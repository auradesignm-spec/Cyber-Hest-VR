/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { HealthPickup, Language } from '../types/game';

interface HealthPickupsProps {
  pickups: HealthPickup[];
  language: Language;
  lockedTargetId: string | number | null;
}

export const MAX_HEALTH_PICKUPS = 3;

const LABEL_CACHE: Record<string, THREE.CanvasTexture> = {};

function getRepairLabelTexture(isArabic: boolean): THREE.CanvasTexture {
  const key = isArabic ? 'ar' : 'en';
  if (!LABEL_CACHE[key]) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#020611';
      ctx.fillRect(0, 0, 512, 128);
      ctx.strokeStyle = '#f87171';
      ctx.lineWidth = 5;
      ctx.strokeRect(4, 4, 504, 120);

      ctx.font = isArabic ? 'bold 40px "Cairo", sans-serif' : '900 34px "Orbitron", monospace';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(isArabic ? '+1 سلامة النواة' : '+1 CORE INTEGRITY', 256, 48);

      ctx.font = isArabic ? 'bold 24px "Cairo", sans-serif' : 'bold 22px "JetBrains Mono", monospace';
      ctx.fillStyle = '#f87171';
      ctx.fillText(isArabic ? 'أطلق عليه للإصلاح!' : 'SHOOT TO REPAIR!', 256, 94);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    LABEL_CACHE[key] = texture;
  }
  return LABEL_CACHE[key];
}

/**
 * Floating field-repair kit: white armoured case, red medical cross, black
 * containment strap and corner bolts — the arcade health pickup that restores
 * one heart on the target core when shot.
 */
const RepairKitModel: React.FC<{ isArabic: boolean }> = ({ isArabic }) => {
  const label = getRepairLabelTexture(isArabic);

  return (
    <group>
      {/* Armoured white case */}
      <mesh castShadow>
        <boxGeometry args={[0.38, 0.24, 0.3]} />
        <meshPhysicalMaterial
          color="#f4f6fb"
          metalness={0.15}
          roughness={0.28}
          clearcoat={1}
          clearcoatRoughness={0.12}
        />
      </mesh>

      {/* Chamfered lid highlight */}
      <mesh position={[0, 0.125, 0]}>
        <boxGeometry args={[0.34, 0.02, 0.26]} />
        <meshStandardMaterial color="#ffffff" metalness={0.1} roughness={0.22} />
      </mesh>

      {/* Red medical cross (top face) */}
      <mesh position={[0, 0.136, 0]}>
        <boxGeometry args={[0.22, 0.014, 0.075]} />
        <meshStandardMaterial color="#e11d2e" emissive="#7f0d16" emissiveIntensity={0.35} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.136, 0]}>
        <boxGeometry args={[0.075, 0.014, 0.22]} />
        <meshStandardMaterial color="#e11d2e" emissive="#7f0d16" emissiveIntensity={0.35} roughness={0.35} />
      </mesh>

      {/* Black containment strap wrapped around the case */}
      <mesh position={[0, -0.01, 0]}>
        <boxGeometry args={[0.402, 0.075, 0.322]} />
        <meshStandardMaterial color="#141821" metalness={0.5} roughness={0.55} />
      </mesh>

      {/* Corner bolts */}
      {[
        [-0.145, -0.1],
        [0.145, -0.1],
        [-0.145, 0.1],
        [0.145, 0.1],
      ].map(([x, z], idx) => (
        <mesh key={`bolt-${idx}`} position={[x, 0.126, z]} rotation={[0, 0, 0]}>
          <cylinderGeometry args={[0.018, 0.018, 0.012, 8]} />
          <meshStandardMaterial color="#2b3342" metalness={0.9} roughness={0.35} />
        </mesh>
      ))}

      {/* Repair halo ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.34, 0.012, 8, 32]} />
        <meshBasicMaterial color="#f87171" toneMapped={false} />
      </mesh>

      {/* Floating instruction label */}
      <mesh position={[0, 0.42, 0]}>
        <planeGeometry args={[0.92, 0.23]} />
        <meshBasicMaterial map={label} transparent opacity={0.95} />
      </mesh>
    </group>
  );
};

export const HealthPickups: React.FC<HealthPickupsProps> = ({ pickups, language, lockedTargetId }) => {
  const isArabic = language === 'ar';
  const groupRefs = useRef<(THREE.Group | null)[]>([]);
  const ringRefs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    for (let i = 0; i < MAX_HEALTH_PICKUPS; i += 1) {
      const group = groupRefs.current[i];
      if (!group) continue;

      const pickup = pickups[i];
      if (!pickup) {
        group.visible = false;
        continue;
      }

      group.visible = true;
      group.position.set(
        pickup.position[0],
        pickup.position[1] + Math.sin(t * 2.4 + i * 1.7) * 0.08,
        pickup.position[2]
      );
      group.rotation.y += delta * 1.1;

      const isLocked = lockedTargetId === pickup.id;
      const targetScale = isLocked ? 1.22 : 1.0;
      const s = THREE.MathUtils.damp(group.scale.x, targetScale, 12, delta);
      group.scale.set(s, s, s);

      const ring = ringRefs.current[i];
      if (ring) {
        ring.rotation.z += delta * 2.2;
        ring.scale.setScalar(1 + Math.sin(t * 3.4 + i) * 0.08);
      }
    }
  });

  return (
    <group name="HealthPickupPool">
      {Array.from({ length: MAX_HEALTH_PICKUPS }, (_, idx) => (
        <group
          key={`medkit-slot-${idx}`}
          ref={(el) => {
            groupRefs.current[idx] = el;
          }}
          visible={false}
        >
          <RepairKitModel isArabic={isArabic} />
          <mesh
            ref={(el) => {
              ringRefs.current[idx] = el;
            }}
            rotation={[Math.PI / 2, 0, 0]}
            position={[0, -0.05, 0]}
          >
            <ringGeometry args={[0.42, 0.5, 24]} />
            <meshBasicMaterial color="#f87171" transparent opacity={0.5} toneMapped={false} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}
    </group>
  );
};
