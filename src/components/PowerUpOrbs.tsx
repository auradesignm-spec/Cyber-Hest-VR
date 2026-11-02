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
}

const POWERUP_CONFIG: Record<
  PowerUpType,
  {
    nameEn: string;
    nameAr: string;
    color: string;
  }
> = {
  rapid_fire: {
    nameEn: '⚡ RAPID FIRE (8s)',
    nameAr: '⚡ إطلاق سريع (8ث)',
    color: '#ff8800',
  },
  emp_bomb: {
    nameEn: '💥 EMP BOMB',
    nameAr: '💥 قنبلة EMP',
    color: '#a855f7',
  },
  plasma_beam: {
    nameEn: '💠 PLASMA BEAM (5s)',
    nameAr: '💠 شعاع بلازما (5ث)',
    color: '#00f0ff',
  },
};

const TEXTURE_CACHE: Record<string, THREE.CanvasTexture> = {};

function getPowerUpTexture(type: PowerUpType, isArabic: boolean): THREE.CanvasTexture {
  const key = `${type}_${isArabic ? 'ar' : 'en'}`;
  if (!TEXTURE_CACHE[key]) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#020611';
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

      ctx.font = isArabic ? 'bold 36px "Cairo", sans-serif' : '900 32px "Orbitron", monospace';
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
    TEXTURE_CACHE[key] = texture;
  }
  return TEXTURE_CACHE[key];
}

const MAX_ORBS = 4;

export const PowerUpOrbs: React.FC<PowerUpOrbsProps> = ({ orbs, language, lockedTargetId }) => {
  const isArabic = language === 'ar';
  const groupRefs = useRef<(THREE.Group | null)[]>([]);
  const ring1Refs = useRef<(THREE.Mesh | null)[]>([]);
  const ring2Refs = useRef<(THREE.Mesh | null)[]>([]);
  const coreRefs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    for (let i = 0; i < MAX_ORBS; i++) {
      const grp = groupRefs.current[i];
      if (!grp) continue;

      const orb = orbs[i];
      if (!orb) {
        grp.visible = false;
        continue;
      }

      grp.visible = true;
      grp.position.set(
        orb.position[0],
        orb.position[1] + Math.sin(t * 3.5 + i) * 0.1,
        orb.position[2]
      );

      const isLocked = lockedTargetId === orb.id;
      const scale = isLocked ? 1.2 : 1.0;
      grp.scale.set(scale, scale, scale);

      if (ring1Refs.current[i]) {
        ring1Refs.current[i]!.rotation.x += delta * 2.5;
        ring1Refs.current[i]!.rotation.y += delta * 1.8;
      }
      if (ring2Refs.current[i]) {
        ring2Refs.current[i]!.rotation.y -= delta * 2.2;
        ring2Refs.current[i]!.rotation.z += delta * 1.5;
      }
      if (coreRefs.current[i]) {
        coreRefs.current[i]!.rotation.y += delta * 3.0;
      }
    }
  });

  return (
    <group name="PowerUpOrbsPool">
      {Array.from({ length: MAX_ORBS }, (_, idx) => {
        const orb = orbs[idx];
        const color = orb?.type === 'rapid_fire' ? '#ff8800' : orb?.type === 'emp_bomb' ? '#a855f7' : '#00f0ff';
        const texture = orb ? getPowerUpTexture(orb.type, isArabic) : getPowerUpTexture('rapid_fire', false);

        return (
          <group
            key={`orb-slot-${idx}`}
            ref={(el) => {
              groupRefs.current[idx] = el;
            }}
            visible={false}
          >
            {/* Core */}
            <mesh
              ref={(el) => {
                coreRefs.current[idx] = el;
              }}
            >
              <octahedronGeometry args={[0.22, 0]} />
              <meshBasicMaterial color={color} />
            </mesh>

            {/* Gyro Ring 1 */}
            <mesh
              ref={(el) => {
                ring1Refs.current[idx] = el;
              }}
            >
              <torusGeometry args={[0.34, 0.02, 10, 24]} />
              <meshBasicMaterial color={color} />
            </mesh>

            {/* Gyro Ring 2 */}
            <mesh
              ref={(el) => {
                ring2Refs.current[idx] = el;
              }}
              rotation={[Math.PI / 3, 0, 0]}
            >
              <torusGeometry args={[0.38, 0.015, 10, 24]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>

            {/* Overhead Label */}
            <mesh position={[0, 0.48, 0]}>
              <planeGeometry args={[1.0, 0.25]} />
              <meshBasicMaterial map={texture} transparent opacity={0.95} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};
