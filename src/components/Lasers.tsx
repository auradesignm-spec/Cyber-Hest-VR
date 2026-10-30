/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useMemo, useImperativeHandle, forwardRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export interface LaserHandle {
  fireBolt: (
    origin: THREE.Vector3,
    direction: THREE.Vector3,
    color?: string,
    side?: 'left' | 'right' | 'desktop'
  ) => void;
}

interface ActiveBolt {
  id: number;
  active: boolean;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  dir: THREE.Vector3;
  color: string;
  distanceTraveled: number;
  maxDistance: number;
}

const MAX_BOLTS = 24;
const BOLT_SPEED = 40.0; // units/second

const _dummy = new THREE.Object3D();
const _orientation = new THREE.Matrix4();
const _up = new THREE.Vector3(0, 1, 0);

interface LasersProps {
  onBoltHit?: (position: THREE.Vector3, color: string) => void;
}

export const Lasers = forwardRef<LaserHandle, LasersProps>(({ onBoltHit }, ref) => {
  const meshCoreRef = useRef<THREE.InstancedMesh>(null);
  const meshGlowRef = useRef<THREE.InstancedMesh>(null);
  const boltsRef = useRef<ActiveBolt[]>([]);
  const impactLightRef = useRef<THREE.PointLight>(null);
  const boltLightRef = useRef<THREE.PointLight>(null);
  const impactTimerRef = useRef(0);

  // Initialize pool
  useMemo(() => {
    boltsRef.current = Array.from({ length: MAX_BOLTS }, (_, idx) => ({
      id: idx,
      active: false,
      x: 0,
      y: -20,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      dir: new THREE.Vector3(0, 0, -1),
      color: '#00f0ff',
      distanceTraveled: 0,
      maxDistance: 25.0,
    }));
  }, []);

  // Geometry: Elongated Energy Bolt Capsule
  const coreGeo = useMemo(() => new THREE.CylinderGeometry(0.015, 0.015, 0.75, 8), []);
  const coreMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#ffffff',
        toneMapped: false,
      }),
    []
  );

  const glowGeo = useMemo(() => new THREE.CylinderGeometry(0.045, 0.045, 0.85, 8), []);
  const glowMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#00f0ff',
        transparent: true,
        opacity: 0.85,
        toneMapped: false,
      }),
    []
  );

  // Fire bolt API
  useImperativeHandle(ref, () => ({
    fireBolt: (origin: THREE.Vector3, direction: THREE.Vector3, color = '#00f0ff') => {
      const pool = boltsRef.current;
      const bolt = pool.find((b) => !b.active);
      if (!bolt) return;

      const normDir = direction.clone().normalize();
      bolt.active = true;
      bolt.x = origin.x;
      bolt.y = origin.y;
      bolt.z = origin.z;
      bolt.vx = normDir.x * BOLT_SPEED;
      bolt.vy = normDir.y * BOLT_SPEED;
      bolt.vz = normDir.z * BOLT_SPEED;
      bolt.dir.copy(normDir);
      bolt.color = color;
      bolt.distanceTraveled = 0;
      bolt.maxDistance = 28.0;
    },
  }));

  // Update physics and instancing
  useFrame((_, delta) => {
    const pool = boltsRef.current;
    const coreMesh = meshCoreRef.current;
    const glowMesh = meshGlowRef.current;
    if (!coreMesh || !glowMesh) return;

    // Decay impact point light
    if (impactLightRef.current && impactTimerRef.current > 0) {
      impactTimerRef.current -= delta;
      impactLightRef.current.intensity = Math.max(0, impactTimerRef.current * 15.0);
    }

    for (let i = 0; i < pool.length; i++) {
      const b = pool[i];
      if (b.active) {
        const stepDist = BOLT_SPEED * delta;
        b.x += b.vx * delta;
        b.y += b.vy * delta;
        b.z += b.vz * delta;
        b.distanceTraveled += stepDist;

        // Check if exceeded max range or hit backwall/floor
        if (b.distanceTraveled >= b.maxDistance || b.z < -6.5 || b.y < 0.05) {
          b.active = false;
          _dummy.position.set(0, -20, 0);
          _dummy.scale.set(0.001, 0.001, 0.001);
          _dummy.updateMatrix();
          coreMesh.setMatrixAt(i, _dummy.matrix);
          glowMesh.setMatrixAt(i, _dummy.matrix);

          // Impact Flash
          if (impactLightRef.current && b.z <= -6.0) {
            impactLightRef.current.position.set(b.x, b.y, b.z + 0.2);
            impactLightRef.current.color.set(b.color);
            impactLightRef.current.intensity = 4.0;
            impactTimerRef.current = 0.12;
            onBoltHit?.(new THREE.Vector3(b.x, b.y, b.z), b.color);
          }
        } else {
          _dummy.position.set(b.x, b.y, b.z);
          const target = _dummy.position.clone().add(b.dir);
          _orientation.lookAt(_dummy.position, target, _up);
          _dummy.quaternion.setFromRotationMatrix(_orientation);
          // Cylinder geometry default is Y-axis, rotate 90 deg around X to face trajectory
          _dummy.rotateX(Math.PI / 2);
          _dummy.scale.set(1, 1, 1);
          _dummy.updateMatrix();

          coreMesh.setMatrixAt(i, _dummy.matrix);
          glowMesh.setMatrixAt(i, _dummy.matrix);
        }
      } else {
        _dummy.position.set(0, -20, 0);
        _dummy.scale.set(0.001, 0.001, 0.001);
        _dummy.updateMatrix();
        coreMesh.setMatrixAt(i, _dummy.matrix);
        glowMesh.setMatrixAt(i, _dummy.matrix);
      }
    }

    // Update leading bolt point light
    if (boltLightRef.current) {
      const leadingBolt = pool.find((b) => b.active);
      if (leadingBolt) {
        boltLightRef.current.position.set(leadingBolt.x, leadingBolt.y, leadingBolt.z);
        boltLightRef.current.color.set(leadingBolt.color);
        boltLightRef.current.intensity = 3.5;
      } else {
        boltLightRef.current.intensity = 0;
      }
    }

    coreMesh.instanceMatrix.needsUpdate = true;
    glowMesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <group name="TravelingLasers">
      {/* 1. Core White Laser Bolt Beam */}
      <instancedMesh
        ref={meshCoreRef}
        args={[coreGeo, coreMat, MAX_BOLTS]}
        frustumCulled={false}
      />

      {/* 2. Outer Glowing Laser Sheath */}
      <instancedMesh
        ref={meshGlowRef}
        args={[glowGeo, glowMat, MAX_BOLTS]}
        frustumCulled={false}
      />

      {/* 3. Traveling Bolt Volumetric Point Light */}
      <pointLight
        ref={boltLightRef}
        intensity={0}
        distance={5.0}
        decay={2}
        color="#00f0ff"
      />

      {/* 4. Dynamic Impact Point Light */}
      <pointLight
        ref={impactLightRef}
        intensity={0}
        distance={5.5}
        decay={2}
        color="#00f0ff"
      />
    </group>
  );
});
