/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useMemo, useImperativeHandle, forwardRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export interface ParticleSystemHandle {
  spawnSparks: (x: number, y: number, z: number, color?: string) => void;
  spawnVoxelShatter: (x: number, y: number, z: number, color?: string) => void;
  triggerHighScoreCelebration: (x: number, y: number, z: number) => void;
}

const MAX_SPARKS = 180;
const MAX_VOXELS = 120;
const DUST_COUNT = 120;

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

export const ParticleSystem = forwardRef<ParticleSystemHandle>((_, ref) => {
  const sparksMeshRef = useRef<THREE.InstancedMesh>(null);
  const voxelsMeshRef = useRef<THREE.InstancedMesh>(null);
  const dustPointsRef = useRef<THREE.Points>(null);

  const sparks = useRef<SparkParticle[]>([]);
  const voxels = useRef<VoxelParticle[]>([]);

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
    </group>
  );
});
