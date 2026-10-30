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
}

const MAX_SPARKS = 180;
const MAX_VOXELS = 120;
const DUST_COUNT = 150;

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
  // Sparks InstancedMesh ref
  const sparksMeshRef = useRef<THREE.InstancedMesh>(null);
  const voxelsMeshRef = useRef<THREE.InstancedMesh>(null);
  const dustPointsRef = useRef<THREE.Points>(null);

  // Sparks Pool
  const sparks = useRef<SparkParticle[]>([]);
  // Voxels Pool
  const voxels = useRef<VoxelParticle[]>([]);

  // Initialize Pools
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

  // Ambient Cyber Dust Geometry
  const dustGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(DUST_COUNT * 3);
    for (let i = 0; i < DUST_COUNT; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 8; // x
      positions[i * 3 + 1] = 0.5 + Math.random() * 3.5; // y
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10; // z
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  // Geometries for InstancedMeshes
  const sparkGeo = useMemo(() => new THREE.OctahedronGeometry(0.04), []);
  const sparkMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#00f0ff',
        transparent: true,
        opacity: 0.9,
      }),
    []
  );

  const voxelGeo = useMemo(() => new THREE.BoxGeometry(0.06, 0.06, 0.06), []);
  const voxelMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#ef4444',
        emissive: '#dc2626',
        emissiveIntensity: 1.5,
        roughness: 0.2,
        metalness: 0.8,
      }),
    []
  );

  // Imperative handle to trigger bursts
  useImperativeHandle(ref, () => ({
    spawnSparks: (x: number, y: number, z: number, color = '#00f0ff') => {
      const pool = sparks.current;
      let count = 0;
      _color.set(color);

      for (let i = 0; i < pool.length && count < 22; i++) {
        if (!pool[i].active) {
          const p = pool[i];
          p.active = true;
          p.x = x;
          p.y = y;
          p.z = z;
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.random() * Math.PI;
          const speed = 3.2 + Math.random() * 4.2;
          p.vx = Math.sin(phi) * Math.cos(theta) * speed;
          p.vy = Math.cos(phi) * speed + 1.2;
          p.vz = Math.sin(phi) * Math.sin(theta) * speed;
          p.life = 0;
          p.maxLife = 0.35 + Math.random() * 0.3;
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

      for (let i = 0; i < pool.length && count < 16; i++) {
        if (!pool[i].active) {
          const v = pool[i];
          v.active = true;
          v.x = x + (Math.random() - 0.5) * 0.2;
          v.y = y + (Math.random() - 0.5) * 0.2;
          v.z = z + (Math.random() - 0.5) * 0.2;
          const speed = 2.4 + Math.random() * 3.6;
          const angle = Math.random() * Math.PI * 2;
          v.vx = Math.cos(angle) * speed;
          v.vy = Math.random() * 3.2 + 0.8;
          v.vz = Math.sin(angle) * speed;
          v.rx = Math.random() * Math.PI;
          v.ry = Math.random() * Math.PI;
          v.rz = Math.random() * Math.PI;
          v.vrx = (Math.random() - 0.5) * 16;
          v.vry = (Math.random() - 0.5) * 16;
          v.life = 0;
          v.maxLife = 0.5 + Math.random() * 0.35;
          v.scale = 0.08 + Math.random() * 0.05;

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
  }));

  // Update loop
  useFrame((state, delta) => {
    // 1. Update Ambient Cyber Dust
    if (dustPointsRef.current) {
      const positions = dustPointsRef.current.geometry.attributes.position.array as Float32Array;
      const t = state.clock.getElapsedTime();
      for (let i = 0; i < DUST_COUNT; i++) {
        // Subtle drift in light beams
        positions[i * 3 + 1] += Math.sin(t * 0.5 + i) * 0.002;
        positions[i * 3 + 0] += Math.cos(t * 0.3 + i) * 0.001;
      }
      dustPointsRef.current.geometry.attributes.position.needsUpdate = true;
    }

    // 2. Update Sparks InstancedMesh
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
            p.vy -= 9.8 * delta * 0.6; // gravity

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

    // 3. Update Voxel Shards InstancedMesh
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
            v.vy -= 8.0 * delta; // gravity
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
      {/* 1. Ambient Cyber Dust Points */}
      <points ref={dustPointsRef} geometry={dustGeometry}>
        <pointsMaterial
          size={0.035}
          color="#00f0ff"
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* 2. Instanced Sparks */}
      <instancedMesh
        ref={sparksMeshRef}
        args={[sparkGeo, sparkMat, MAX_SPARKS]}
        frustumCulled={false}
      />

      {/* 3. Instanced Voxel Shards */}
      <instancedMesh
        ref={voxelsMeshRef}
        args={[voxelGeo, voxelMat, MAX_VOXELS]}
        frustumCulled={false}
      />
    </group>
  );
});
