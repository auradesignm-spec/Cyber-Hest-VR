/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface MatrixCodeRain3DProps {
  active?: boolean;
}

const COLUMN_COUNT = 48;
const DUMMY = new THREE.Object3D();

/**
 * Procedural 3D Matrix Code Rain and Glowing Cyber Grid Floor
 * - 48 falling glyph columns spread in an arc
 * - High-speed cycling characters with glowing bright heads and fading emerald trails
 * - Cyber grid floor with infinite pulse ripples
 * - Ambient cyber dust particles
 */
export const MatrixCodeRain3D: React.FC<MatrixCodeRain3DProps> = ({ active = true }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const gridFloorRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);

  // Procedural Matrix Column Strip Texture (Canvas with 16 stacked digital glyphs)
  const stripTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, 128, 1024);

      const glyphs = '01101001アイウエオカキクケコサシスセソタチツテト0x4F0x9A0x1680443';
      ctx.font = 'bold 36px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';

      for (let i = 0; i < 24; i++) {
        const y = i * 42 + 36;
        const char = glyphs[Math.floor(Math.random() * glyphs.length)];
        
        // Lead character is white-cyan, trailing are neon emerald fading to deep green
        if (i === 0) {
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = '#00f0ff';
          ctx.shadowBlur = 12;
        } else if (i < 4) {
          ctx.fillStyle = '#00ffcc';
          ctx.shadowColor = '#10b981';
          ctx.shadowBlur = 8;
        } else {
          const alpha = 1.0 - (i / 24);
          ctx.fillStyle = `rgba(16, 185, 129, ${alpha * 0.9})`;
          ctx.shadowBlur = 0;
        }
        ctx.fillText(char, 64, y);
      }
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, []);

  // Column positions & fall speeds
  const columns = useMemo(() => {
    const items = [];
    for (let i = 0; i < COLUMN_COUNT; i++) {
      // Arc radius between 3.5m and 7.0m in front and to the sides
      const angle = (i / COLUMN_COUNT) * Math.PI * 1.5 - Math.PI * 0.75;
      const radius = 3.5 + Math.random() * 3.5;
      const x = Math.sin(angle) * radius;
      const z = -Math.cos(angle) * radius;
      const y = Math.random() * 8 + 2;
      const speed = 2.5 + Math.random() * 3.5;
      const scale = 0.8 + Math.random() * 0.6;
      items.push({ x, y, z, speed, scale, baseAngle: angle, baseRadius: radius });
    }
    return items;
  }, []);

  // Ambient floating dust particles
  const dustPositions = useMemo(() => {
    const count = 180;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 12;
      pos[i * 3 + 1] = Math.random() * 5 + 0.2;
      pos[i * 3 + 2] = -Math.random() * 8 - 0.5;
    }
    return pos;
  }, []);

  useFrame((state, delta) => {
    if (!active) return;
    const time = state.clock.getElapsedTime();

    // 1. Update Matrix Columns Falling
    if (meshRef.current) {
      for (let i = 0; i < COLUMN_COUNT; i++) {
        const col = columns[i];
        col.y -= col.speed * delta;
        if (col.y < -2.0) {
          col.y = 7.0 + Math.random() * 3.0;
        }

        DUMMY.position.set(col.x, col.y, col.z);
        DUMMY.scale.set(col.scale * 0.45, col.scale * 2.8, 1);
        DUMMY.lookAt(0, col.y, 0); // Face inward toward player camera
        DUMMY.updateMatrix();

        meshRef.current.setMatrixAt(i, DUMMY.matrix);
      }
      meshRef.current.instanceMatrix.needsUpdate = true;
    }

    // 2. Animate Cyber Grid Floor Ripple
    if (gridFloorRef.current) {
      const mat = gridFloorRef.current.material as THREE.MeshStandardMaterial;
      if (mat.map) {
        mat.map.offset.y = -(time * 0.15) % 1;
      }
    }

    // 3. Subtle floating particle drift
    if (particlesRef.current) {
      particlesRef.current.rotation.y = time * 0.03;
    }
  });

  // Cyber Grid Floor Texture
  const gridTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#020611';
      ctx.fillRect(0, 0, 512, 512);

      // Neon grid lines
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
      ctx.lineWidth = 3;
      ctx.strokeRect(0, 0, 512, 512);

      // Inner crosshairs
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(256, 0);
      ctx.lineTo(256, 512);
      ctx.moveTo(0, 256);
      ctx.lineTo(512, 256);
      ctx.stroke();
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(16, 16);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, []);

  return (
    <group visible={active}>
      {/* Instanced Matrix Columns */}
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, COLUMN_COUNT]}
        frustumCulled={false}
      >
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          map={stripTexture}
          transparent
          opacity={0.88}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </instancedMesh>

      {/* Cyber Grid Floor */}
      <mesh
        ref={gridFloorRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.01, -4]}
        receiveShadow
      >
        <planeGeometry args={[24, 24]} />
        <meshStandardMaterial
          map={gridTexture}
          roughness={0.2}
          metalness={0.8}
          emissive="#00f0ff"
          emissiveIntensity={0.12}
        />
      </mesh>

      {/* Horizon Fog Line and Light Emissive Strip */}
      <mesh position={[0, 0.02, -8]}>
        <boxGeometry args={[20, 0.04, 0.04]} />
        <meshBasicMaterial color="#00f0ff" />
      </mesh>

      {/* Floating Cyber Dust Particles */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[dustPositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.035}
          color="#00f0ff"
          transparent
          opacity={0.65}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Atmospheric Point Light for Ground Glow */}
      <pointLight position={[0, 0.5, -3]} intensity={1.5} color="#00f0ff" distance={8} />
      <pointLight position={[0, 2.5, -4]} intensity={1.2} color="#10b981" distance={10} />
    </group>
  );
};
