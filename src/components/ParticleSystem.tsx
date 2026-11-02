/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useMemo, useImperativeHandle, forwardRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export interface ParticleSystemHandle {
  spawnSparks: (x: number, y: number, z: number, color?: string) => void;
  spawnVoxelShatter: (x: number, y: number, z: number, color?: string) => void;
  triggerHighScoreCelebration: (x: number, y: number, z: number) => void;
  /**
   * Cinematic laser-target impact at an exact world-space point.
   * (x,y,z) = exact raycast hit point; (nx,ny,nz) = surface normal at impact.
   * strength >= 1 = interactive/valid target hit; < 1 = subtle incidental hit.
   */
  spawnLaserImpact: (
    x: number,
    y: number,
    z: number,
    normalX: number,
    normalY: number,
    normalZ: number,
    color?: string,
    strength?: number
  ) => void;
}

const MAX_SPARKS = 180;
const MAX_VOXELS = 120;
const DUST_COUNT = 120;
const MAX_FLASHES = 8;
const MAX_RINGS = 8;

interface SparkParticle {
  active: boolean;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  scale: number;
}

interface VoxelParticle {
  active: boolean;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  rx: number;
  ry: number;
  rz: number;
  vrx: number;
  vry: number;
  life: number;
  maxLife: number;
  scale: number;
}

const _dummy = new THREE.Object3D();
const _color = new THREE.Color();
const _fxColor = new THREE.Color();
const _white = new THREE.Color('#ffffff');
const _fxLook = new THREE.Vector3();

interface FlashFx {
  active: boolean;
  x: number;
  y: number;
  z: number;
  life: number;
  maxLife: number;
  baseScale: number;
  color: string;
}

interface RingFx {
  active: boolean;
  x: number;
  y: number;
  z: number;
  nx: number;
  ny: number;
  nz: number;
  life: number;
  maxLife: number;
  baseScale: number;
  color: string;
}

export const ParticleSystem = forwardRef<ParticleSystemHandle>((_, ref) => {
  const sparksMeshRef = useRef<THREE.InstancedMesh>(null);
  const voxelsMeshRef = useRef<THREE.InstancedMesh>(null);
  const dustPointsRef = useRef<THREE.Points>(null);
  const impactLightRef = useRef<THREE.PointLight>(null);
  const impactLightTimer = useRef(0);
  const impactLightPeak = useRef(0);

  const sparks = useRef<SparkParticle[]>([]);
  const voxels = useRef<VoxelParticle[]>([]);
  const flashes = useRef<FlashFx[]>([]);
  const rings = useRef<RingFx[]>([]);

  // Pooled individual meshes => per-instance opacity control for smooth fade-out
  const flashMeshes = useMemo(
    () =>
      Array.from({ length: MAX_FLASHES }, () => {
        const mat = new THREE.MeshBasicMaterial({
          color: '#ffffff',
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          side: THREE.DoubleSide,
          toneMapped: false,
        });
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
        mesh.visible = false;
        mesh.renderOrder = 10;
        return mesh;
      }),
    []
  );

  const ringMeshes = useMemo(
    () =>
      Array.from({ length: MAX_RINGS }, () => {
        const mat = new THREE.MeshBasicMaterial({
          color: '#00f0ff',
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          side: THREE.DoubleSide,
          toneMapped: false,
        });
        // Thin glowing ring (radial shockwave)
        const mesh = new THREE.Mesh(new THREE.RingGeometry(0.44, 0.5, 32), mat);
        mesh.visible = false;
        mesh.renderOrder = 10;
        return mesh;
      }),
    []
  );

  // Dispose pooled FX GPU resources when the particle system unmounts (lifecycle hygiene)
  useEffect(() => {
    return () => {
      [...flashMeshes, ...ringMeshes].forEach((mesh) => {
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
      });
    };
  }, [flashMeshes, ringMeshes]);

  useMemo(() => {
    sparks.current = Array.from({ length: MAX_SPARKS }, () => ({
      active: false,
      x: 0,
      y: -20,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      life: 0,
      maxLife: 0.4,
      scale: 0.04,
    }));

    voxels.current = Array.from({ length: MAX_VOXELS }, () => ({
      active: false,
      x: 0,
      y: -20,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      rx: 0,
      ry: 0,
      rz: 0,
      vrx: 0,
      vry: 0,
      life: 0,
      maxLife: 0.6,
      scale: 0.08,
    }));

    flashes.current = Array.from({ length: MAX_FLASHES }, () => ({
      active: false,
      x: 0,
      y: -20,
      z: 0,
      life: 0,
      maxLife: 0.12,
      baseScale: 0.6,
      color: '#00f0ff',
    }));

    rings.current = Array.from({ length: MAX_RINGS }, () => ({
      active: false,
      x: 0,
      y: -20,
      z: 0,
      nx: 0,
      ny: 1,
      nz: 0,
      life: 0,
      maxLife: 0.32,
      baseScale: 1.0,
      color: '#00f0ff',
    }));
  }, []);

  const dustGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(DUST_COUNT * 3);
    for (let i = 0; i < DUST_COUNT; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 1] = 0.5 + Math.random() * 3.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  const sparkGeo = useMemo(() => new THREE.SphereGeometry(0.02, 6, 6), []);
  const sparkMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#ffffff',
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
      }),
    []
  );

  const voxelGeo = useMemo(() => new THREE.BoxGeometry(0.06, 0.06, 0.06), []);
  const voxelMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#ef4444',
      }),
    []
  );

  useImperativeHandle(ref, () => ({
    spawnSparks: (x: number, y: number, z: number, color = '#00f0ff') => {
      const pool = sparks.current;
      let count = 0;
      _color.set(color);

      for (let i = 0; i < pool.length && count < 20; i++) {
        if (!pool[i].active) {
          const p = pool[i];
          p.active = true;
          p.x = x;
          p.y = y;
          p.z = z;
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.random() * Math.PI;
          const speed = 3.0 + Math.random() * 4.0;
          p.vx = Math.sin(phi) * Math.cos(theta) * speed;
          p.vy = Math.cos(phi) * speed + 1.0;
          p.vz = Math.sin(phi) * Math.sin(theta) * speed;
          p.life = 0;
          p.maxLife = 0.35 + Math.random() * 0.25;
          p.scale = 0.045 + Math.random() * 0.035;

          if (sparksMeshRef.current) {
            sparksMeshRef.current.setColorAt(i, _color);
          }
          count++;
        }
      }
      if (sparksMeshRef.current && sparksMeshRef.current.instanceColor) {
        sparksMeshRef.current.instanceColor.needsUpdate = true;
      }
    },

    spawnVoxelShatter: (x: number, y: number, z: number, color = '#ef4444') => {
      const pool = voxels.current;
      let count = 0;
      _color.set(color);

      for (let i = 0; i < pool.length && count < 14; i++) {
        if (!pool[i].active) {
          const v = pool[i];
          v.active = true;
          v.x = x + (Math.random() - 0.5) * 0.2;
          v.y = y + (Math.random() - 0.5) * 0.2;
          v.z = z + (Math.random() - 0.5) * 0.2;
          const speed = 2.2 + Math.random() * 3.4;
          const angle = Math.random() * Math.PI * 2;
          v.vx = Math.cos(angle) * speed;
          v.vy = Math.random() * 3.0 + 0.8;
          v.vz = Math.sin(angle) * speed;
          v.rx = Math.random() * Math.PI;
          v.ry = Math.random() * Math.PI;
          v.rz = Math.random() * Math.PI;
          v.vrx = (Math.random() - 0.5) * 14;
          v.vry = (Math.random() - 0.5) * 14;
          v.life = 0;
          v.maxLife = 0.5 + Math.random() * 0.3;
          v.scale = 0.08 + Math.random() * 0.04;

          if (voxelsMeshRef.current) {
            voxelsMeshRef.current.setColorAt(i, _color);
          }
          count++;
        }
      }
      if (voxelsMeshRef.current && voxelsMeshRef.current.instanceColor) {
        voxelsMeshRef.current.instanceColor.needsUpdate = true;
      }
    },

    // --- Cinematic laser-target impact at exact world-space point ---
    spawnLaserImpact: (
      x: number,
      y: number,
      z: number,
      normalX: number,
      normalY: number,
      normalZ: number,
      color = '#00f0ff',
      strength = 1
    ) => {
      const s = Math.max(0.25, Math.min(1.6, strength));
      const nLen = Math.hypot(normalX, normalY, normalZ) || 1;
      const nxn = normalX / nLen;
      const nyn = normalY / nLen;
      const nzn = normalZ / nLen;

      // --- A. Energy impact flash (bright cyan-white billboard quad, ~100ms) ---
      let fi = flashes.current.findIndex((f) => !f.active);
      if (fi === -1) fi = 0; // recycle oldest slot under heavy fire
      const f = flashes.current[fi];
      f.active = true;
      f.x = x + nxn * 0.05; // lift off surface: no z-fighting
      f.y = y + nyn * 0.05;
      f.z = z + nzn * 0.05;
      f.life = 0;
      f.maxLife = 0.09 + Math.random() * 0.05;
      f.baseScale = 0.5 * s + Math.random() * 0.15;

      const fmesh = flashMeshes[fi];
      fmesh.visible = true;
      fmesh.position.set(f.x, f.y, f.z);
      (_fxColor.set(color).lerp(_white, 0.7)); // hot cyan-white core
      (fmesh.material as THREE.MeshBasicMaterial).color.copy(_fxColor);

      // --- B. Radial energy shockwave ring (oriented to surface normal) ---
      let ri = rings.current.findIndex((r) => !r.active);
      if (ri === -1) ri = 0;
      const r = rings.current[ri];
      r.active = true;
      r.x = x + nxn * 0.03;
      r.y = y + nyn * 0.03;
      r.z = z + nzn * 0.03;
      r.nx = nxn;
      r.ny = nyn;
      r.nz = nzn;
      r.life = 0;
      r.maxLife = 0.3;
      r.baseScale = 0.9 * s;

      const rmesh = ringMeshes[ri];
      rmesh.visible = true;
      rmesh.position.set(r.x, r.y, r.z);
      _fxLook.set(r.x + nxn, r.y + nyn, r.z + nzn);
      rmesh.lookAt(_fxLook);
      (_fxColor.set(color).lerp(_white, 0.3)); // cyan glow ring
      (rmesh.material as THREE.MeshBasicMaterial).color.copy(_fxColor);

      // --- C. Normal-biased electric sparks (pooled instanced spheres) ---
      const pool = sparks.current;
      const sparkCount = 12 + Math.floor(Math.random() * 4);
      let sc = 0;
      for (let i = 0; i < pool.length && sc < sparkCount; i++) {
        if (!pool[i].active) {
          const p = pool[i];
          p.active = true;
          p.x = x + nxn * 0.04;
          p.y = y + nyn * 0.04;
          p.z = z + nzn * 0.04;
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.random() * Math.PI;
          const speed = (2.4 + Math.random() * 3.8) * Math.min(s, 1.3);
          // tangent dispersion plus strong push along the surface normal
          p.vx = Math.sin(phi) * Math.cos(theta) * speed + nxn * (1.6 + Math.random() * 2.6) * s;
          p.vy = Math.cos(phi) * speed + nyn * (1.6 + Math.random() * 2.6) * s;
          p.vz = Math.sin(phi) * Math.sin(theta) * speed + nzn * (1.6 + Math.random() * 2.6) * s;
          p.life = 0;
          p.maxLife = 0.26 + Math.random() * 0.22;
          p.scale = (0.035 + Math.random() * 0.04) * Math.min(s, 1.3);

          // occasional subtle magenta accent
          const accent = Math.random() < 0.15;
          _color.set(accent ? '#ff44ff' : color);
          if (sparksMeshRef.current) {
            sparksMeshRef.current.setColorAt(i, _color);
          }
          sc++;
        }
      }
      if (sparksMeshRef.current && sparksMeshRef.current.instanceColor) {
        sparksMeshRef.current.instanceColor.needsUpdate = true;
      }

      // --- D. Short energy residue: 3-4 slow fading embers drifting off the hit ---
      const emberCount = 3 + Math.floor(Math.random() * 2);
      let ec = 0;
      for (let i = 0; i < pool.length && ec < emberCount; i++) {
        if (!pool[i].active) {
          const p = pool[i];
          p.active = true;
          p.x = x + nxn * 0.06 + (Math.random() - 0.5) * 0.08;
          p.y = y + nyn * 0.06 + (Math.random() - 0.5) * 0.08;
          p.z = z + nzn * 0.06 + (Math.random() - 0.5) * 0.08;
          const drift = 0.4 + Math.random() * 0.6;
          const a = Math.random() * Math.PI * 2;
          p.vx = Math.cos(a) * drift * 0.4 + nxn * drift * 0.5;
          p.vy = Math.sin(a) * drift * 0.4 + nyn * drift * 0.5 + 0.3;
          p.vz = (Math.random() - 0.5) * drift * 0.3 + nzn * drift * 0.5;
          p.life = 0;
          p.maxLife = 0.55 + Math.random() * 0.2;
          p.scale = 0.022 + Math.random() * 0.018;
          _color.set(color).lerp(_white, 0.4);
          if (sparksMeshRef.current) {
            sparksMeshRef.current.setColorAt(i, _color);
          }
          ec++;
        }
      }

      // --- Localized brief point-light pulse at the hit point ---
      if (impactLightRef.current) {
        impactLightRef.current.position.set(x + nxn * 0.2, y + nyn * 0.2, z + nzn * 0.2);
        impactLightRef.current.color.set(color);
        impactLightPeak.current = 5.5 * s;
        impactLightTimer.current = 0.12;
      }
    },

    triggerHighScoreCelebration: (x: number, y: number, z: number) => {
      // Golden High Score Particle Explosion
      const pool = sparks.current;
      _color.set('#f59e0b');
      let count = 0;
      for (let i = 0; i < pool.length && count < 60; i++) {
        if (!pool[i].active) {
          const p = pool[i];
          p.active = true;
          p.x = x + (Math.random() - 0.5) * 0.8;
          p.y = y + (Math.random() - 0.5) * 0.8;
          p.z = z + (Math.random() - 0.5) * 0.8;
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.random() * Math.PI;
          const speed = 4.5 + Math.random() * 5.5;
          p.vx = Math.sin(phi) * Math.cos(theta) * speed;
          p.vy = Math.cos(phi) * speed + 2.0;
          p.vz = Math.sin(phi) * Math.sin(theta) * speed;
          p.life = 0;
          p.maxLife = 0.8 + Math.random() * 0.5;
          p.scale = 0.07 + Math.random() * 0.04;

          if (sparksMeshRef.current) {
            sparksMeshRef.current.setColorAt(i, _color);
          }
          count++;
        }
      }
      if (sparksMeshRef.current && sparksMeshRef.current.instanceColor) {
        sparksMeshRef.current.instanceColor.needsUpdate = true;
      }
    },
  }));

  useFrame((state, delta) => {
    // 1. Dust
    if (dustPointsRef.current) {
      const positions = dustPointsRef.current.geometry.attributes.position.array as Float32Array;
      const t = state.clock.getElapsedTime();
      for (let i = 0; i < DUST_COUNT; i++) {
        positions[i * 3 + 1] += Math.sin(t * 0.5 + i) * 0.0015;
      }
      dustPointsRef.current.geometry.attributes.position.needsUpdate = true;
    }

    // 2. Sparks
    if (sparksMeshRef.current) {
      const pool = sparks.current;
      for (let i = 0; i < pool.length; i++) {
        const p = pool[i];
        if (p.active) {
          p.life += delta;
          if (p.life >= p.maxLife) {
            p.active = false;
            _dummy.position.set(0, -20, 0);
            _dummy.scale.set(0.001, 0.001, 0.001);
            _dummy.updateMatrix();
            sparksMeshRef.current.setMatrixAt(i, _dummy.matrix);
          } else {
            p.x += p.vx * delta;
            p.y += p.vy * delta;
            p.z += p.vz * delta;
            p.vy -= 9.8 * delta * 0.5;

            const progress = p.life / p.maxLife;
            const currentScale = p.scale * (1.0 - progress);

            _dummy.position.set(p.x, p.y, p.z);
            _dummy.scale.set(currentScale, currentScale, currentScale);
            _dummy.updateMatrix();
            sparksMeshRef.current.setMatrixAt(i, _dummy.matrix);
          }
        } else {
          _dummy.position.set(0, -20, 0);
          _dummy.scale.set(0.001, 0.001, 0.001);
          _dummy.updateMatrix();
          sparksMeshRef.current.setMatrixAt(i, _dummy.matrix);
        }
      }
      sparksMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    // 3. Voxels
    if (voxelsMeshRef.current) {
      const pool = voxels.current;
      for (let i = 0; i < pool.length; i++) {
        const v = pool[i];
        if (v.active) {
          v.life += delta;
          if (v.life >= v.maxLife) {
            v.active = false;
            _dummy.position.set(0, -20, 0);
            _dummy.scale.set(0.001, 0.001, 0.001);
            _dummy.updateMatrix();
            voxelsMeshRef.current.setMatrixAt(i, _dummy.matrix);
          } else {
            v.x += v.vx * delta;
            v.y += v.vy * delta;
            v.z += v.vz * delta;
            v.vy -= 8.0 * delta;
            v.rx += v.vrx * delta;
            v.ry += v.vry * delta;

            const progress = v.life / v.maxLife;
            const currentScale = v.scale * (1.0 - progress * 0.7);

            _dummy.position.set(v.x, v.y, v.z);
            _dummy.rotation.set(v.rx, v.ry, v.rz);
            _dummy.scale.set(currentScale, currentScale, currentScale);
            _dummy.updateMatrix();
            voxelsMeshRef.current.setMatrixAt(i, _dummy.matrix);
          }
        } else {
          _dummy.position.set(0, -20, 0);
          _dummy.scale.set(0.001, 0.001, 0.001);
          _dummy.updateMatrix();
          voxelsMeshRef.current.setMatrixAt(i, _dummy.matrix);
        }
      }
      voxelsMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    // 4. Impact flashes (camera-facing billboard quads, short-lived)
    const camQuat = state.camera.quaternion;
    for (let i = 0; i < flashes.current.length; i++) {
      const f = flashes.current[i];
      const mesh = flashMeshes[i];
      if (f.active) {
        f.life += delta;
        const t = f.life / f.maxLife;
        if (t >= 1) {
          f.active = false;
          mesh.visible = false;
        } else {
          mesh.visible = true;
          mesh.position.set(f.x, f.y, f.z);
          mesh.quaternion.copy(camQuat); // billboard
          mesh.scale.setScalar(f.baseScale * (0.4 + 0.65 * t));
          (mesh.material as THREE.MeshBasicMaterial).opacity = Math.pow(1 - t, 1.5);
        }
      }
    }

    // 5. Shockwave rings (expand along surface normal, fade out)
    for (let i = 0; i < rings.current.length; i++) {
      const r = rings.current[i];
      const mesh = ringMeshes[i];
      if (r.active) {
        r.life += delta;
        const t = r.life / r.maxLife;
        if (t >= 1) {
          r.active = false;
          mesh.visible = false;
        } else {
          mesh.visible = true;
          mesh.position.set(r.x, r.y, r.z);
          _fxLook.set(r.x + r.nx, r.y + r.ny, r.z + r.nz);
          mesh.lookAt(_fxLook);
          const ease = 1 - Math.pow(1 - t, 2.2); // rapid expansion, smooth tail
          mesh.scale.setScalar(r.baseScale * (0.25 + 2.2 * ease));
          (mesh.material as THREE.MeshBasicMaterial).opacity = Math.pow(1 - t, 1.2) * 0.95;
        }
      }
    }

    // 6. Impact point-light pulse decay
    if (impactLightRef.current) {
      if (impactLightTimer.current > 0) {
        impactLightTimer.current = Math.max(0, impactLightTimer.current - delta);
        impactLightRef.current.intensity =
          impactLightPeak.current * (impactLightTimer.current / 0.12);
      } else {
        impactLightRef.current.intensity = 0;
      }
    }
  });

  return (
    <group name="ParticleSystems">
      <points ref={dustPointsRef} geometry={dustGeometry}>
        <pointsMaterial
          size={0.03}
          color="#00f0ff"
          transparent
          opacity={0.35}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      <instancedMesh
        ref={sparksMeshRef}
        args={[sparkGeo, sparkMat, MAX_SPARKS]}
        frustumCulled={false}
      />

      <instancedMesh
        ref={voxelsMeshRef}
        args={[voxelGeo, voxelMat, MAX_VOXELS]}
        frustumCulled={false}
      />

      {/* Pooled impact flashes (billboard quads) */}
      {flashMeshes.map((m, i) => (
        <primitive key={`flashfx-${i}`} object={m} />
      ))}

      {/* Pooled shockwave rings */}
      {ringMeshes.map((m, i) => (
        <primitive key={`ringfx-${i}`} object={m} />
      ))}

      {/* Brief localized impact light pulse */}
      <pointLight ref={impactLightRef} color="#00f0ff" intensity={0} distance={6} decay={2} />
    </group>
  );
});
