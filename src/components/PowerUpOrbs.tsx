/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PowerUpOrb, PowerUpType, Language } from '../types/game';

interface PowerUpOrbsProps {
  orbs: PowerUpOrb[];
  language: Language;
  lockedTargetId: string | number | null;
  onHitPowerUp?: (orbId: string, type: PowerUpType, position: [number, number, number]) => void;
}

const POWERUP_CONFIG: Record<
  PowerUpType,
  {
    nameEn: string;
    nameAr: string;
    color: string;
    emissive: string;
    ringColor: string;
  }
> = {
  rapid_fire: {
    nameEn: 'RAPID FIRE (8s)',
    nameAr: 'إطلاق سريع (8ث)',
    color: '#ff8800',
    emissive: '#ff6600',
    ringColor: '#ffaa33',
  },
  emp_bomb: {
    nameEn: 'EMP BOMB',
    nameAr: 'قنبلة EMP',
    color: '#a855f7',
    emissive: '#9333ea',
    ringColor: '#c084fc',
  },
  plasma_beam: {
    nameEn: 'PLASMA BEAM (5s)',
    nameAr: 'شعاع بلازما (5ث)',
    color: '#00f0ff',
    emissive: '#00d8ff',
    ringColor: '#67e8f9',
  },
};

/**
 * Procedural Billboard Texture for Power-Up Orb Label
 */
function usePowerUpBillboardTexture(type: PowerUpType, isArabic: boolean) {
  return useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'rgba(2, 6, 17, 0.9)';
      ctx.fillRect(0, 0, 512, 128);

      const color =
        type === 'rapid_fire' ? '#ff8800' : type === 'emp_bomb' ? '#a855f7' : '#00f0ff';

      ctx.strokeStyle = color;
      ctx.lineWidth = 4;
      ctx.strokeRect(4, 4, 504, 120);

      const title =
        type === 'rapid_fire'
          ? isArabic ? '⚡ إطلاق سريع' : '⚡ RAPID FIRE'
          : type === 'emp_bomb'
          ? isArabic ? '💥 قنبلة EMP' : '💥 EMP BOMB'
          : isArabic ? '💠 شعاع بلازما' : '💠 PLASMA BEAM';

      ctx.font = isArabic ? 'bold 36px "Cairo", sans-serif' : '900 32px "Orbitron", "JetBrains Mono", monospace';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(title, 256, 48);

      ctx.font = isArabic ? 'bold 22px "Cairo", sans-serif' : 'bold 20px "JetBrains Mono", monospace';
      ctx.fillStyle = color;
      const sub = isArabic ? 'أطلق بالليزر للتفعيل!' : 'SHOOT TO ACTIVATE!';
      ctx.fillText(sub, 256, 94);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    return texture;
  }, [type, isArabic]);
}

/**
 * Single Animated Power-Up Orb
 */
function SinglePowerUpOrb({
  orb,
  isArabic,
  isLocked,
}: {
  orb: PowerUpOrb;
  isArabic: boolean;
  isLocked: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef1 = useRef<THREE.Mesh>(null);
  const ringRef2 = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const billboardTexture = usePowerUpBillboardTexture(orb.type, isArabic);

  const color =
    orb.type === 'rapid_fire' ? '#ff8800' : orb.type === 'emp_bomb' ? '#a855f7' : '#00f0ff';

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();

    // Bobbing motion
    groupRef.current.position.y = orb.position[1] + Math.sin(t * 3.5 + orb.createdAt) * 0.12;

    // Smooth hover scale
    const targetScale = isLocked ? 1.25 : 1.0;
    groupRef.current.scale.x = THREE.MathUtils.damp(groupRef.current.scale.x, targetScale, 14, delta);
    groupRef.current.scale.y = THREE.MathUtils.damp(groupRef.current.scale.y, targetScale, 14, delta);
    groupRef.current.scale.z = THREE.MathUtils.damp(groupRef.current.scale.z, targetScale, 14, delta);

    // Rotate holographic gyro rings
    if (ringRef1.current) {
      ringRef1.current.rotation.x += delta * 2.5;
      ringRef1.current.rotation.y += delta * 1.8;
    }
    if (ringRef2.current) {
      ringRef2.current.rotation.y -= delta * 2.2;
      ringRef2.current.rotation.z += delta * 1.5;
    }
    if (coreRef.current) {
      coreRef.current.rotation.y += delta * 3.0;
    }
  });

  return (
    <group ref={groupRef} position={orb.position}>
      {/* Central Glowing Power-Up Core */}
      <mesh ref={coreRef}>
        <octahedronGeometry args={[0.22, 0]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isLocked ? 3.0 : 1.8}
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>

      {/* Gyroscopic Energy Ring 1 */}
      <mesh ref={ringRef1}>
        <torusGeometry args={[0.34, 0.02, 12, 32]} />
        <meshBasicMaterial color={color} wireframe={false} toneMapped={false} />
      </mesh>

      {/* Gyroscopic Energy Ring 2 */}
      <mesh ref={ringRef2} rotation={[Math.PI / 3, 0, 0]}>
        <torusGeometry args={[0.38, 0.015, 12, 32]} />
        <meshBasicMaterial color="#ffffff" wireframe={false} toneMapped={false} />
      </mesh>

      {/* Surrounding Point Light for Dynamic Glow */}
      <pointLight color={color} intensity={isLocked ? 4.0 : 2.0} distance={4} />

      {/* Floating Overhead Label Billboard */}
      <mesh position={[0, 0.48, 0]}>
        <planeGeometry args={[1.0, 0.25]} />
        <meshBasicMaterial map={billboardTexture} transparent opacity={0.95} toneMapped={false} />
      </mesh>
    </group>
  );
}

export const PowerUpOrbs: React.FC<PowerUpOrbsProps> = ({
  orbs,
  language,
  lockedTargetId,
}) => {
  const isArabic = language === 'ar';

  if (!orbs || orbs.length === 0) return null;

  return (
    <group name="PowerUpOrbsLayer">
      {orbs.map((orb) => (
        <SinglePowerUpOrb
          key={orb.id}
          orb={orb}
          isArabic={isArabic}
          isLocked={lockedTargetId === orb.id}
        />
      ))}
    </group>
  );
};
