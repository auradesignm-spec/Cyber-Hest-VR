/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useMemo, useEffect, useImperativeHandle, forwardRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { DataPacketInstance, ScenarioId, DifficultyLevel } from '../types/game';
import { spatialAudio } from '../audio/SpatialAudio';

interface PacketSwarmProps {
  scenarioId: ScenarioId;
  active: boolean;
  difficulty?: DifficultyLevel;
  onPacketDestroyed?: (packetId: number, x: number, y: number, z: number) => void;
  onPacketBreach?: () => void;
}

export interface PacketSwarmHandle {
  checkRayHit: (
    rayOrigin: THREE.Vector3,
    rayDirection: THREE.Vector3
  ) => { hit: boolean; position?: THREE.Vector3 };
  checkSphereHit: (point: THREE.Vector3, radius: number) => boolean;
  destroyAll: () => void;
  spawnPenaltyPackets: (count?: number) => void;
  getActiveCount: () => number;
}

const MAX_PACKETS = 60;
const DUMMY_CAPSULE = new THREE.Object3D();
const DUMMY_CORE1 = new THREE.Object3D();
const DUMMY_CORE2 = new THREE.Object3D();
const DUMMY_RING = new THREE.Object3D();
const DUMMY_TRAIL = new THREE.Object3D();

const _ray = new THREE.Ray();
const _sphere = new THREE.Sphere(new THREE.Vector3(), 0.3);

export const PacketSwarm = forwardRef<PacketSwarmHandle, PacketSwarmProps>(
  ({ scenarioId, active, difficulty = 'medium', onPacketDestroyed, onPacketBreach }, ref) => {
    // 3 Instanced meshes forming the dual-core threat capsule with energy ring
    const capsuleMeshRef = useRef<THREE.InstancedMesh>(null);
    const coreMeshRef = useRef<THREE.InstancedMesh>(null);
    const ringMeshRef = useRef<THREE.InstancedMesh>(null);

    const packetsRef = useRef<DataPacketInstance[]>([]);
    const spawnTimerRef = useRef(0);

    // 1. Threat Capsule Body Geometry with Glitch Shader
    const capsuleGeo = useMemo(() => new THREE.CapsuleGeometry(0.065, 0.10, 8, 16), []);
    const capsuleMat = useMemo(() => {
      const mat = new THREE.MeshStandardMaterial({
        color: '#ef4444',
        emissive: '#dc2626',
        emissiveIntensity: 1.8,
        roughness: 0.15,
        metalness: 0.85,
        transparent: true,
        opacity: 0.8,
      });

      mat.userData.uTime = { value: 0 };

      mat.onBeforeCompile = (shader) => {
        shader.uniforms.uTime = mat.userData.uTime;

        shader.vertexShader = `
          uniform float uTime;
          varying vec3 vGlitchPos;
          ${shader.vertexShader}
        `;

        shader.vertexShader = shader.vertexShader.replace(
          '#include <begin_vertex>',
          `
          #include <begin_vertex>
          vGlitchPos = position;
          float noiseSignal = sin(uTime * 45.0 + position.y * 18.0) * cos(uTime * 30.0 + position.z * 12.0);
          if (noiseSignal > 0.68) {
            transformed.x += sin(uTime * 90.0) * 0.05;
            transformed.y += cos(uTime * 70.0) * 0.03;
            transformed.z += sin(uTime * 110.0) * 0.05;
          }
          `
        );

        shader.fragmentShader = `
          uniform float uTime;
          varying vec3 vGlitchPos;
          ${shader.fragmentShader}
        `;

        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <dithering_fragment>',
          `
          #include <dithering_fragment>
          float glitchPulse = step(0.82, sin(uTime * 50.0 + vGlitchPos.y * 30.0));
          gl_FragColor.rgb += vec3(glitchPulse * 0.8, glitchPulse * 0.2, glitchPulse * 0.4);
          `
        );
      };

      return mat;
    }, []);

    // 2. Dual Concentrated White/Cyan Energy Cores
    const coreGeo = useMemo(() => new THREE.SphereGeometry(0.03, 12, 12), []);
    const coreMat = useMemo(
      () =>
        new THREE.MeshBasicMaterial({
          color: '#ffffff',
          toneMapped: false,
          transparent: true,
          opacity: 0.85,
        }),
      []
    );

    // 3. Revolving Outer Glowing Toroidal Energy Ring
    const ringGeo = useMemo(() => new THREE.TorusGeometry(0.13, 0.011, 8, 24), []);
    const ringMat = useMemo(
      () =>
        new THREE.MeshBasicMaterial({
          color: '#ff2255',
          transparent: true,
          opacity: 0.68,
          toneMapped: false,
        }),
      []
    );

    // 4. Trailing Data-Stream Noise Particles
    const TRAIL_COUNT = 240;
    const trailMeshRef = useRef<THREE.InstancedMesh>(null);
    const trailGeo = useMemo(() => new THREE.BoxGeometry(0.022, 0.022, 0.022), []);
    const trailMat = useMemo(
      () =>
        new THREE.MeshBasicMaterial({
          color: '#00f0ff',
          transparent: true,
          opacity: 0.85,
          toneMapped: false,
        }),
      []
    );
    const trailParticlesRef = useRef<
      Array<{ x: number; y: number; z: number; vx: number; vy: number; vz: number; life: number; maxLife: number }>
    >([]);

    // Initialize packets and trail particles pool
    useEffect(() => {
      const initialPackets: DataPacketInstance[] = [];
      for (let i = 0; i < MAX_PACKETS; i++) {
        initialPackets.push({
          id: i,
          x: 0,
          y: -15,
          z: 0,
          vx: 0,
          vy: 0,
          vz: 0,
          targetX: 0,
          targetY: 1.2,
          targetZ: -4.8,
          active: false,
        });
      }
      packetsRef.current = initialPackets;

      const trails = [];
      for (let j = 0; j < TRAIL_COUNT; j++) {
        trails.push({
          x: 0,
          y: -20,
          z: 0,
          vx: 0,
          vy: 0,
          vz: 0,
          life: 0,
          maxLife: 1.0,
        });
      }
      trailParticlesRef.current = trails;
    }, []);

    // Spawning logic with Strict Side-Lane Separation: X in [-4.0 to -2.5] or [+2.5 to +4.0]
    // Threat packets NEVER pass through or cover the center Question or Solution badges!
    // Multi-Directional Spawning Logic: Ceiling dive, high rafters, deep tunnel, and floor flanks
    // Attacks converge from all 3D directions toward the protected Victim Node at [0, 0.8, -4.5]
    const spawnPacket = () => {
      const packets = packetsRef.current;
      const inactivePacket = packets.find((p) => !p.active);
      if (!inactivePacket) return;

      // 5 distinct attack vectors
      const vectorType = Math.floor(Math.random() * 5);

      if (vectorType === 0) {
        // 1. High Ceiling Dive-bomb: Drops from overhead ceiling ventilation
        inactivePacket.x = (Math.random() - 0.5) * 3.6;
        inactivePacket.y = 3.3 + Math.random() * 0.6;
        inactivePacket.z = -1.5 - Math.random() * 2.0;
      } else if (vectorType === 1) {
        // 2. High Left Rafters: Sweeps inward from upper left cable tray
        inactivePacket.x = -3.2 - Math.random() * 1.0;
        inactivePacket.y = 2.4 + Math.random() * 0.9;
        inactivePacket.z = -0.5 - Math.random() * 2.5;
      } else if (vectorType === 2) {
        // 3. High Right Rafters: Sweeps inward from upper right cable tray
        inactivePacket.x = 3.2 + Math.random() * 1.0;
        inactivePacket.y = 2.4 + Math.random() * 0.9;
        inactivePacket.z = -0.5 - Math.random() * 2.5;
      } else if (vectorType === 3) {
        // 4. Deep Rear Tunnel: Rushes forward directly from the back cyber corridor
        inactivePacket.x = (Math.random() - 0.5) * 2.4;
        inactivePacket.y = 1.0 + Math.random() * 1.6;
        inactivePacket.z = -6.2;
      } else {
        // 5. Low Floor Flank Crawlers: Skims along the server rack floors
        const isLeft = Math.random() < 0.5;
        inactivePacket.x = (isLeft ? -1 : 1) * (2.6 + Math.random() * 1.0);
        inactivePacket.y = 0.35 + Math.random() * 0.45;
        inactivePacket.z = 0.5 + Math.random() * 1.5;
      }

      // Exact target: Central Victim Device at [0, 0.8, -4.5]
      inactivePacket.targetX = (Math.random() - 0.5) * 0.4;
      inactivePacket.targetY = 0.8 + (Math.random() - 0.5) * 0.3;
      inactivePacket.targetZ = -4.5;

      const dx = inactivePacket.targetX - inactivePacket.x;
      const dy = inactivePacket.targetY - inactivePacket.y;
      const dz = inactivePacket.targetZ - inactivePacket.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;

      // Speed paced by difficulty tier
      const speedMultiplier = difficulty === 'easy' ? 0.65 : difficulty === 'medium' ? 1.15 : 1.75;
      inactivePacket.vx = (dx / dist) * speedMultiplier;
      inactivePacket.vy = (dy / dist) * speedMultiplier;
      inactivePacket.vz = (dz / dist) * speedMultiplier;
      inactivePacket.active = true;
    };

    const waveTargetCountRef = useRef(0);
    const spawnedInWaveRef = useRef(0);

    // Imperative hit testing
    useImperativeHandle(ref, () => ({
      checkRayHit: (rayOrigin: THREE.Vector3, rayDirection: THREE.Vector3) => {
        _ray.set(rayOrigin, rayDirection.clone().normalize());
        const packets = packetsRef.current;

        for (let i = 0; i < packets.length; i++) {
          const p = packets[i];
          if (!p.active) continue;

          _sphere.center.set(p.x, p.y, p.z);
          _sphere.radius = 0.32;

          if (_ray.intersectsSphere(_sphere)) {
            p.active = false;
            const hitPos = new THREE.Vector3(p.x, p.y, p.z);
            p.y = -20;
            spatialAudio.playPacketExplosion(hitPos.x, hitPos.y, hitPos.z);
            onPacketDestroyed?.(p.id, hitPos.x, hitPos.y, hitPos.z);
            return { hit: true, position: hitPos };
          }
        }
        return { hit: false };
      },

      checkSphereHit: (point: THREE.Vector3, radius: number) => {
        const packets = packetsRef.current;
        let anyHit = false;
        for (let i = 0; i < packets.length; i++) {
          const p = packets[i];
          if (!p.active) continue;
          const dx = p.x - point.x;
          const dy = p.y - point.y;
          const dz = p.z - point.z;
          const distSq = dx * dx + dy * dy + dz * dz;

          if (distSq <= (radius + 0.16) * (radius + 0.16)) {
            p.active = false;
            const hitPos = new THREE.Vector3(p.x, p.y, p.z);
            p.y = -20;
            spatialAudio.playPacketExplosion(hitPos.x, hitPos.y, hitPos.z);
            onPacketDestroyed?.(p.id, hitPos.x, hitPos.y, hitPos.z);
            anyHit = true;
          }
        }
        return anyHit;
      },

      destroyAll: () => {
        packetsRef.current.forEach((p) => {
          if (p.active) {
            onPacketDestroyed?.(p.id, p.x, p.y, p.z);
            p.active = false;
            p.y = -20;
          }
        });
      },

      spawnPenaltyPackets: (count = 8) => {
        waveTargetCountRef.current = count;
        spawnedInWaveRef.current = 0;
        const initialSpawn = Math.min(count, 3);
        for (let i = 0; i < initialSpawn; i++) {
          spawnPacket();
          spawnedInWaveRef.current += 1;
        }
      },

      getActiveCount: () => {
        return packetsRef.current.filter((p) => p.active).length;
      },
    }));

    // Animation loop: update threat capsule, dual cores, and revolving energy rings
    useFrame((state, delta) => {
      const capsuleMesh = capsuleMeshRef.current;
      const coreMesh = coreMeshRef.current;
      const ringMesh = ringMeshRef.current;
      if (!capsuleMesh || !coreMesh || !ringMesh) return;

      const packets = packetsRef.current;
      const t = state.clock.getElapsedTime();

      // Update glitch shader time uniform
      if (capsuleMat.userData.uTime) {
        capsuleMat.userData.uTime.value = t;
      }

      // Spawning controlled wave packets
      if (active && spawnedInWaveRef.current < waveTargetCountRef.current) {
        spawnTimerRef.current += delta;
        const spawnInterval = difficulty === 'easy' ? 1.1 : difficulty === 'medium' ? 0.75 : 0.45;
        if (spawnTimerRef.current > spawnInterval) {
          spawnTimerRef.current = 0;
          spawnPacket();
          spawnedInWaveRef.current += 1;
        }
      }

      // Update positions & emit trailing data noise
      for (let i = 0; i < packets.length; i++) {
        const p = packets[i];
        if (p.active) {
          p.x += p.vx * delta;
          p.y += p.vy * delta;
          p.z += p.vz * delta;

          // Emit trailing data-stream noise particles behind active threat packet
          if (Math.random() < 0.68) {
            const trailPool = trailParticlesRef.current;
            const deadTrail = trailPool.find((tp) => tp.life <= 0);
            if (deadTrail) {
              deadTrail.x = p.x + (Math.random() - 0.5) * 0.08;
              deadTrail.y = p.y + (Math.random() - 0.5) * 0.08;
              deadTrail.z = p.z + 0.12 + Math.random() * 0.08;
              deadTrail.vx = (Math.random() - 0.5) * 0.3;
              deadTrail.vy = (Math.random() - 0.5) * 0.3;
              deadTrail.vz = 0.4 + Math.random() * 0.4;
              deadTrail.maxLife = 0.35 + Math.random() * 0.25;
              deadTrail.life = deadTrail.maxLife;
            }
          }

          const dx = p.targetX - p.x;
          const dy = p.targetY - p.y;
          const dz = p.targetZ - p.z;
          const distSq = dx * dx + dy * dy + dz * dz;

          if (distSq < 0.22) {
            p.active = false;
            p.y = -20;
            spatialAudio.playErrorBuzzer();
            onPacketBreach?.();
          } else {
            // 35% reduced mesh scale factor with frustum clearance
            const inCenterFrustum = Math.abs(p.x) < 2.0 && p.z > -4.5 && p.z < 0.5;
            const frustumScaleMod = inCenterFrustum ? 0.55 : 0.65;
            const pulse = (1.0 + Math.sin(t * 8.0 + i) * 0.12) * frustumScaleMod;

            // 1. Capsule Body
            DUMMY_CAPSULE.position.set(p.x, p.y, p.z);
            DUMMY_CAPSULE.rotation.set(t * 1.5 + i, t * 2.0 + i, 0);
            DUMMY_CAPSULE.scale.set(pulse, pulse, pulse);
            DUMMY_CAPSULE.updateMatrix();
            capsuleMesh.setMatrixAt(i, DUMMY_CAPSULE.matrix);

            // 2. Dual Energy Cores
            DUMMY_CORE1.position.set(p.x, p.y + 0.04, p.z);
            DUMMY_CORE1.scale.set(pulse * 1.1, pulse * 1.1, pulse * 1.1);
            DUMMY_CORE1.updateMatrix();
            coreMesh.setMatrixAt(i, DUMMY_CORE1.matrix);

            // 3. Revolving Outer Toroidal Energy Ring
            DUMMY_RING.position.set(p.x, p.y, p.z);
            DUMMY_RING.rotation.set(t * 3.5 + i, t * 2.2, Math.PI / 4);
            DUMMY_RING.scale.set(pulse * 1.25, pulse * 1.25, pulse * 1.25);
            DUMMY_RING.updateMatrix();
            ringMesh.setMatrixAt(i, DUMMY_RING.matrix);
          }
        } else {
          DUMMY_CAPSULE.position.set(0, -20, 0);
          DUMMY_CAPSULE.scale.set(0.001, 0.001, 0.001);
          DUMMY_CAPSULE.updateMatrix();
          capsuleMesh.setMatrixAt(i, DUMMY_CAPSULE.matrix);
          coreMesh.setMatrixAt(i, DUMMY_CAPSULE.matrix);
          ringMesh.setMatrixAt(i, DUMMY_CAPSULE.matrix);
        }
      }

      // Update trailing data-stream noise particles
      const trailMesh = trailMeshRef.current;
      if (trailMesh) {
        const trails = trailParticlesRef.current;
        for (let k = 0; k < trails.length; k++) {
          const tp = trails[k];
          if (tp.life > 0) {
            tp.life -= delta;
            tp.x += tp.vx * delta;
            tp.y += tp.vy * delta;
            tp.z += tp.vz * delta;

            const alpha = Math.max(0, tp.life / tp.maxLife);
            const trailScale = alpha * 0.85;

            DUMMY_TRAIL.position.set(tp.x, tp.y, tp.z);
            DUMMY_TRAIL.rotation.set(t * 10.0 + k, t * 12.0, 0);
            DUMMY_TRAIL.scale.set(trailScale, trailScale, trailScale);
            DUMMY_TRAIL.updateMatrix();
            trailMesh.setMatrixAt(k, DUMMY_TRAIL.matrix);
          } else {
            DUMMY_TRAIL.position.set(0, -20, 0);
            DUMMY_TRAIL.scale.set(0.001, 0.001, 0.001);
            DUMMY_TRAIL.updateMatrix();
            trailMesh.setMatrixAt(k, DUMMY_TRAIL.matrix);
          }
        }
        trailMesh.instanceMatrix.needsUpdate = true;
      }

      capsuleMesh.instanceMatrix.needsUpdate = true;
      coreMesh.instanceMatrix.needsUpdate = true;
      ringMesh.instanceMatrix.needsUpdate = true;
    });

    return (
      <group name="ThreatCapsuleSwarm">
        {/* 1. Threat Capsule Bodies with Glitch Shader */}
        <instancedMesh
          ref={capsuleMeshRef}
          args={[capsuleGeo, capsuleMat, MAX_PACKETS]}
          frustumCulled={false}
        />
        {/* 2. Concentrated White Energy Cores */}
        <instancedMesh
          ref={coreMeshRef}
          args={[coreGeo, coreMat, MAX_PACKETS]}
          frustumCulled={false}
        />
        {/* 3. Revolving Outer Energy Rings */}
        <instancedMesh
          ref={ringMeshRef}
          args={[ringGeo, ringMat, MAX_PACKETS]}
          frustumCulled={false}
        />
        {/* 4. Trailing Data-Stream Noise Particles */}
        <instancedMesh
          ref={trailMeshRef}
          args={[trailGeo, trailMat, TRAIL_COUNT]}
          frustumCulled={false}
        />
      </group>
    );
  }
);
