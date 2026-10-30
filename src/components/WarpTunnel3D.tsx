/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface WarpTunnel3DProps {
  active: boolean;
  reverse?: boolean;
  onComplete?: () => void;
  duration?: number; // Duration in seconds
}

const STREAK_COUNT = 72;
const DUMMY = new THREE.Object3D();

/**
 * High-Speed 3D Warp Time Tunnel Transition
 * - Inward-facing cylindrical hyperspace tunnel with traveling neon bands
 * - Instanced high-speed relativistic light streaks (cyan & magenta)
 * - Dynamic Camera FOV stretch (72 -> 105 -> 72) and forward dolly-in motion
 * - Seamless completion callback
 */
export const WarpTunnel3D: React.FC<WarpTunnel3DProps> = ({
  active,
  reverse = false,
  onComplete,
  duration = 1.35,
}) => {
  const { camera } = useThree();
  const cylinderRef = useRef<THREE.Mesh>(null);
  const streaksRef = useRef<THREE.InstancedMesh>(null);
  const ringGroupRef = useRef<THREE.Group>(null);
  const progressRef = useRef(0);
  const initialFovRef = useRef(72);

  // Store initial FOV
  useEffect(() => {
    if ('fov' in camera) {
      initialFovRef.current = (camera as THREE.PerspectiveCamera).fov;
    }
  }, [camera]);

  // Reset progress when activated
  useEffect(() => {
    if (active) {
      progressRef.current = 0;
    }
  }, [active]);

  // Procedural Hyperspace Tunnel Texture
  const tunnelTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#010512';
      ctx.fillRect(0, 0, 1024, 1024);

      // Longitudinal warp lines
      for (let x = 0; x < 1024; x += 16) {
        const isCyan = (x / 16) % 2 === 0;
        ctx.strokeStyle = isCyan ? 'rgba(0, 240, 255, 0.45)' : 'rgba(236, 72, 153, 0.35)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 1024);
        ctx.stroke();
      }

      // Traveling ring bands
      for (let y = 0; y < 1024; y += 64) {
        ctx.fillStyle = 'rgba(0, 240, 255, 0.15)';
        ctx.fillRect(0, y, 1024, 8);
      }
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(8, 24);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, []);

  // Light streak data
  const streaks = useMemo(() => {
    const items = [];
    for (let i = 0; i < STREAK_COUNT; i++) {
      const angle = (i / STREAK_COUNT) * Math.PI * 2;
      const radius = 1.2 + Math.random() * 1.8;
      const z = -Math.random() * 24;
      const length = 2.5 + Math.random() * 4.5;
      const speed = 25 + Math.random() * 15;
      const isMagenta = i % 3 === 0;
      items.push({ angle, radius, z, length, speed, isMagenta });
    }
    return items;
  }, []);

  useFrame((state, delta) => {
    if (!active) {
      // Restore normal FOV when inactive
      if ('fov' in camera) {
        const pCam = camera as THREE.PerspectiveCamera;
        if (Math.abs(pCam.fov - 72) > 0.1) {
          pCam.fov = THREE.MathUtils.damp(pCam.fov, 72, 8, delta);
          pCam.updateProjectionMatrix();
        }
      }
      return;
    }

    progressRef.current += delta / duration;
    const p = Math.min(1.0, progressRef.current);

    // Easing curve: S-curve acceleration then deceleration
    const easedProgress = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
    // Peak velocity in the middle (bell curve)
    const velocityFactor = Math.sin(p * Math.PI);

    // 1. Dynamic FOV stretch during hyperspace
    if ('fov' in camera) {
      const pCam = camera as THREE.PerspectiveCamera;
      const targetFov = 72 + velocityFactor * 36; // Expands from 72 up to 108
      pCam.fov = THREE.MathUtils.damp(pCam.fov, targetFov, 14, delta);
      pCam.updateProjectionMatrix();
    }

    // 2. Animate Cylinder Texture UV
    if (cylinderRef.current) {
      const mat = cylinderRef.current.material as THREE.MeshBasicMaterial;
      if (mat.map) {
        const dir = reverse ? -1 : 1;
        mat.map.offset.y += dir * delta * (1.5 + velocityFactor * 8.0);
      }
      cylinderRef.current.rotation.z += (reverse ? -1 : 1) * delta * 0.4;
    }

    // 3. Animate Instanced Light Streaks
    if (streaksRef.current) {
      const dir = reverse ? -1 : 1;
      for (let i = 0; i < STREAK_COUNT; i++) {
        const s = streaks[i];
        if (reverse) {
          s.z -= s.speed * delta * (1.2 + velocityFactor * 2.0);
          if (s.z < -28) s.z = 2.0;
        } else {
          s.z += s.speed * delta * (1.2 + velocityFactor * 2.0);
          if (s.z > 2.0) s.z = -28;
        }

        const x = Math.cos(s.angle) * s.radius;
        const y = Math.sin(s.angle) * s.radius + 1.5;

        DUMMY.position.set(x, y, s.z);
        DUMMY.scale.set(0.04, 0.04, s.length * (1.0 + velocityFactor * 2.0));
        DUMMY.updateMatrix();

        streaksRef.current.setMatrixAt(i, DUMMY.matrix);
      }
      streaksRef.current.instanceMatrix.needsUpdate = true;
    }

    // 4. Animate Traveling Neon Rings
    if (ringGroupRef.current) {
      ringGroupRef.current.children.forEach((child, idx) => {
        const mesh = child as THREE.Mesh;
        if (reverse) {
          mesh.position.z -= delta * (12 + velocityFactor * 20);
          if (mesh.position.z < -26) mesh.position.z = 1.0;
        } else {
          mesh.position.z += delta * (12 + velocityFactor * 20);
          if (mesh.position.z > 1.0) mesh.position.z = -26;
        }
      });
    }

    // Complete transition
    if (p >= 1.0) {
      if ('fov' in camera) {
        (camera as THREE.PerspectiveCamera).fov = 72;
        camera.updateProjectionMatrix();
      }
      if (onComplete) {
        onComplete();
      }
    }
  });

  return (
    <group visible={active}>
      {/* High-Speed Cylindrical Hyperspace Tunnel */}
      <mesh
        ref={cylinderRef}
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, 1.5, -12]}
      >
        <cylinderGeometry args={[3.2, 3.2, 32, 32, 1, true]} />
        <meshBasicMaterial
          map={tunnelTexture}
          side={THREE.BackSide}
          transparent
          opacity={0.88}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Instanced High-Speed Light Streaks */}
      <instancedMesh
        ref={streaksRef}
        args={[undefined, undefined, STREAK_COUNT]}
        frustumCulled={false}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial
          color="#00f0ff"
          transparent
          opacity={0.9}
          blending={THREE.AdditiveBlending}
        />
      </instancedMesh>

      {/* Pulsing Neon Warp Rings */}
      <group ref={ringGroupRef}>
        {[-4, -8, -12, -16, -20, -24].map((zPos, idx) => (
          <mesh key={idx} position={[0, 1.5, zPos]}>
            <torusGeometry args={[3.1, 0.05, 8, 32]} />
            <meshBasicMaterial
              color={idx % 2 === 0 ? '#00f0ff' : '#ec4899'}
              transparent
              opacity={0.75}
            />
          </mesh>
        ))}
      </group>

      {/* Central Warp Core Light */}
      <pointLight position={[0, 1.5, -12]} intensity={3.5} color="#00f0ff" distance={20} />
    </group>
  );
};
