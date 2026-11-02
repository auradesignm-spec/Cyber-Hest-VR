/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ScorePopup } from '../types/game';

interface FloatingScorePopupsProps {
  popups: ScorePopup[];
}

const POOL_SIZE = 12;

function createBakedScoreTexture(text: string, color: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 384;
  canvas.height = 112;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = 'rgba(2, 6, 17, 0.9)';
  ctx.fillRect(0, 0, 384, 112);

  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, 376, 104);

  // Corner brackets
  ctx.fillStyle = color;
  const bSize = 12;
  ctx.fillRect(4, 4, bSize, 4);
  ctx.fillRect(4, 4, 4, bSize);
  ctx.fillRect(380 - bSize, 4, bSize, 4);
  ctx.fillRect(376, 4, 4, bSize);
  ctx.fillRect(4, 108 - 4, bSize, 4);
  ctx.fillRect(4, 108 - bSize, 4, bSize);
  ctx.fillRect(380 - bSize, 108 - 4, bSize, 4);
  ctx.fillRect(376, 108 - bSize, 4, bSize);

  ctx.font = '900 40px "Orbitron", "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = color;
  ctx.shadowBlur = 10;
  ctx.fillText(text, 192, 56);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  return texture;
}

// Module-level pre-baked textures
const TEXTURE_CACHE: Record<string, THREE.CanvasTexture> = {};

function getTexture(text: string, color: string): THREE.CanvasTexture {
  const key = `${text}_${color}`;
  if (!TEXTURE_CACHE[key]) {
    TEXTURE_CACHE[key] = createBakedScoreTexture(text, color);
  }
  return TEXTURE_CACHE[key];
}

// Pre-allocate common textures
if (typeof document !== 'undefined') {
  getTexture('+100 PTS', '#00f0ff');
  getTexture('+200 PTS', '#00f0ff');
  getTexture('+250 PTS', '#f59e0b');
  getTexture('+300 PTS', '#f59e0b');
  getTexture('+500 PTS', '#f59e0b');
  getTexture('🔥 FEVER MODE ACTIVE! 🔥', '#f59e0b');
  getTexture('DATA SHARD +250', '#00f0ff');
  getTexture('EMP BLAST!', '#a855f7');
  getTexture('RAPID FIRE!', '#ff8800');
  getTexture('PLASMA BEAM!', '#00f0ff');
}

export const FloatingScorePopups: React.FC<FloatingScorePopupsProps> = ({ popups }) => {
  const groupRef = useRef<THREE.Group>(null);
  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame((state) => {
    const now = Date.now();
    for (let i = 0; i < POOL_SIZE; i++) {
      const mesh = meshRefs.current[i];
      if (!mesh) continue;

      const popup = popups[i];
      if (popup) {
        const elapsed = (now - popup.createdAt) / 1000;
        const duration = popup.duration || 1.1;

        if (elapsed < duration) {
          mesh.visible = true;
          // Upward drift
          mesh.position.set(
            popup.position[0],
            popup.position[1] + elapsed * 0.95,
            popup.position[2]
          );

          // Pop-in bounce
          const scale = Math.min(1.0, elapsed * 7) * (popup.scale || 1.0);
          mesh.scale.set(scale * 1.5, scale * 0.45, 1);

          // Billboard towards camera
          mesh.quaternion.copy(state.camera.quaternion);

          // Alpha fade
          const mat = mesh.material as THREE.MeshBasicMaterial;
          mat.opacity = Math.max(0, 1 - Math.pow(elapsed / duration, 1.8));
          continue;
        }
      }
      mesh.visible = false;
    }
  });

  return (
    <group ref={groupRef} name="FloatingScoresPool">
      {Array.from({ length: POOL_SIZE }, (_, idx) => {
        const popup = popups[idx];
        const texture = popup ? getTexture(popup.text, popup.color) : getTexture('+100 PTS', '#00f0ff');

        return (
          <mesh
            key={`score-mesh-${idx}`}
            ref={(el) => {
              meshRefs.current[idx] = el;
            }}
            visible={false}
          >
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial
              map={texture}
              transparent
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        );
      })}
    </group>
  );
};
