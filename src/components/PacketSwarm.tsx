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

    // 1. Threat Capsule Body Geometry (Crimson PBR Metallic)
    const capsuleGeo = useMemo(() => new THREE.CapsuleGeometry(0.065, 0.10, 8, 16), []);
    const capsuleMat = useMemo(
      () =>
        new THREE.MeshStandardMaterial({
          color: '#ef4444',
          emissive: '#dc2626',
          emissiveIntensity: 1.6,
          roughness: 0.2,
          metalness: 0.8,
          transparent: true,
          opacity: 0.72,
        }),
      []
    );

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

    // Initialize packets pool
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
    }, []);

    // Spawning logic with Strict Side-Lane Separation: X in [-4.0 to -2.5] or [+2.5 to +4.0]
    // Threat packets NEVER pass through or cover the center Question or Solution badges!
    const spawnPacket = () => {
      const packets = packetsRef.current;
      const inactivePacket = packets.find((p) => !p.active);
      if (!inactivePacket) return;

      // Strictly left or right peripheral lanes
      const isLeft = Math.random() < 0.5;

      if (isLeft) {
        // Left Lane (X: -4.0 to -2.5)
        inactivePacket.x = -2.6 - Math.random() * 1.2; // -2.6 to -3.8
        inactivePacket.y = 0.8 + Math.random() * 1.6;
        inactivePacket.z = 1.5 + Math.random() * 2.5;
        inactivePacket.targetX = -2.6 - Math.random() * 1.0; // stays on left
        inactivePacket.targetY = 0.9 + Math.random() * 1.4;
        inactivePacket.targetZ = -4.9;
      } else {
        // Right Lane (X: +2.5 to +4.0)
        inactivePacket.x = 2.6 + Math.random() * 1.2; // +2.6 to +3.8
        inactivePacket.y = 0.8 + Math.random() * 1.6;
        inactivePacket.z = 1.5 + Math.random() * 2.5;
        inactivePacket.targetX = 2.6 + Math.random() * 1.0; // stays on right
        inactivePacket.targetY = 0.9 + Math.random() * 1.4;
        inactivePacket.targetZ = -4.9;
      }

      const dx = inactivePacket.targetX - inactivePacket.x;
      const dy = inactivePacket.targetY - inactivePacket.y;
      const dz = inactivePacket.targetZ - inactivePacket.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;

      // Speed paced by difficulty tier
      const speedMultiplier = difficulty === 'easy' ? 0.55 : difficulty === 'medium' ? 1.05 : 1.65;
      inactivePacket.vx = (dx / dist) * speedMultiplier;
      inactivePacket.vy = (dy / dist) * speedMultiplier;
      inactivePacket.vz = (dz / dist) * speedMultiplier;
      inactivePacket.active = true;
    };

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

      spawnPenaltyPackets: (count = 4) => {
        for (let i = 0; i < count; i++) {
          spawnPacket();
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

      // Spawning
      if (active) {
        spawnTimerRef.current += delta;
        const spawnInterval = scenarioId === 'scenario-3' ? 0.25 : 0.75;
        if (spawnTimerRef.current > spawnInterval) {
          spawnTimerRef.current = 0;
          spawnPacket();
          if (scenarioId === 'scenario-3') {
            spawnPacket();
          }
        }
      }

      // Update positions
      for (let i = 0; i < packets.length; i++) {
        const p = packets[i];
        if (p.active) {
          p.x += p.vx * delta;
          p.y += p.vy * delta;
          p.z += p.vz * delta;

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

      capsuleMesh.instanceMatrix.needsUpdate = true;
      coreMesh.instanceMatrix.needsUpdate = true;
      ringMesh.instanceMatrix.needsUpdate = true;
    });

    return (
      <group name="ThreatCapsuleSwarm">
        {/* 1. Threat Capsule Bodies */}
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
      </group>
    );
  }
);
