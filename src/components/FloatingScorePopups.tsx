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
  onExpire?: (id: string) => void;
}

/**
 * Creates a cached high-res canvas texture for a score label
 */
function createScoreTexture(text: string, color: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Background glowing capsule
  ctx.save();
  ctx.fillStyle = 'rgba(2, 8, 20, 0.85)';
  ctx.strokeStyle = color;
  ctx.lineWidth = 6;
  ctx.shadowColor = color;
  ctx.shadowBlur = 18;

  const x = 16, y = 16, w = canvas.width - 32, h = canvas.height - 32, r = 24;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Typography
  ctx.save();
  ctx.font = '900 64px "Orbitron", monospace, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = color;
  ctx.shadowBlur = 12;
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

const SingleScorePopup: React.FC<{ popup: ScorePopup }> = ({ popup }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useMemo(() => createScoreTexture(popup.text, popup.color), [popup.text, popup.color]);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    const elapsed = (Date.now() - popup.createdAt) / 1000;
    const duration = popup.duration || 1.1;

    // Upward drift
    meshRef.current.position.y = popup.position[1] + elapsed * 0.9;
    
    // Scale bounce (pop in fast, then settle)
    const scale = Math.min(1.0, elapsed * 6) * popup.scale;
    meshRef.current.scale.set(scale * 1.6, scale * 0.5, 1);

    // Billboarding towards camera
    meshRef.current.quaternion.copy(state.camera.quaternion);

    // Alpha fadeout
    if (materialRef.current) {
      const remainingAlpha = Math.max(0, 1 - (elapsed / duration) ** 1.8);
      materialRef.current.opacity = remainingAlpha;
    }
  });

  return (
    <mesh ref={meshRef} position={popup.position}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        ref={materialRef}
        map={texture}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
};

export const FloatingScorePopups: React.FC<FloatingScorePopupsProps> = ({ popups }) => {
  return (
    <group>
      {popups.map((popup) => (
        <SingleScorePopup key={popup.id} popup={popup} />
      ))}
    </group>
  );
};
