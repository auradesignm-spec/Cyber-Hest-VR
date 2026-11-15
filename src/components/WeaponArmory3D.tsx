/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Interactive } from '@react-three/xr';
import * as THREE from 'three';
import { CyberBlasterModel } from './VRPlayer';
import { Language } from '../types/game';

interface WeaponArmory3DProps {
  language: Language;
  onClose: () => void;
}

const BASE_SPIN = 0.5;

/**
 * In-world weapon inspection bay.
 *
 * Sits ~2.4m in front of the player at chest height, so on a headset you can
 * physically walk around the blasters, while on a flat screen you drag (or
 * shoot) to spin the turntable. The turntable keeps a slow idle turn and rocks
 * on X so the top rail and the underside are both readable.
 */
export const WeaponArmory3D: React.FC<WeaponArmory3DProps> = ({ language, onClose }) => {
  const isArabic = language === 'ar';
  const turntableRef = useRef<THREE.Group>(null);
  const velocityRef = useRef(BASE_SPIN);
  const dragRef = useRef({ active: false, lastX: 0 });
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    const endDrag = () => {
      dragRef.current.active = false;
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('pointerup', endDrag);
      window.removeEventListener('pointercancel', endDrag);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  const headerTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 320;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, 1024, 320);
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 5;
      ctx.strokeRect(6, 6, 1012, 308);

      const fontFamily = isArabic ? '"Cairo", sans-serif' : '"JetBrains Mono", monospace';
      ctx.textAlign = 'center';

      ctx.fillStyle = '#ffffff';
      ctx.font = `900 ${isArabic ? '40px' : '36px'} ${fontFamily}`;
      ctx.fillText(isArabic ? 'معرض الأسلحة // بندقية أيون MK-II' : 'ARMORY // MK-II ION BLASTER', 512, 74);

      ctx.fillStyle = '#00f0ff';
      ctx.font = `900 22px ${fontFamily}`;
      ctx.fillText(
        isArabic ? 'سماوي: اليد الأساسية   ·   أرجواني: اليد الثانية' : 'CYAN: PRIMARY HAND   ·   MAGENTA: OFF-HAND',
        512,
        124
      );

      ctx.fillStyle = '#ffffff';
      ctx.font = `900 22px ${fontFamily}`;
      ctx.fillText(
        isArabic ? '240 فولت  ·  6 طلقات/ث  ·  مدى 28م  ·  وزن 1.4كجم' : '240V  ·  6 RPS  ·  28M RANGE  ·  1.4KG',
        512,
        176
      );

      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2;
      ctx.strokeRect(48, 208, 928, 76);

      ctx.fillStyle = '#ffffff';
      ctx.font = `900 24px ${fontFamily}`;
      ctx.fillText(
        isArabic ? 'اسحب بالماوس أو حرّك رأسك حول السلاح لرؤيته من كل زاوية' : 'DRAG TO ROTATE  ·  WALK AROUND IT IN VR',
        512,
        254
      );
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, [isArabic]);

  const closeTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 110;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, 512, 110);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 5;
      ctx.strokeRect(6, 6, 500, 98);

      const fontFamily = isArabic ? '"Cairo", sans-serif' : '"JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.font = `900 ${isArabic ? '32px' : '28px'} ${fontFamily}`;
      ctx.fillText(isArabic ? '✕ إغلاق المعرض' : '✕ CLOSE ARMORY', 256, 68);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, [isArabic]);

  useFrame((state, delta) => {
    const group = turntableRef.current;
    if (!group) return;

    velocityRef.current = THREE.MathUtils.damp(velocityRef.current, BASE_SPIN, 2.4, delta);
    group.rotation.y += velocityRef.current * delta;

    const t = state.clock.getElapsedTime();
    group.rotation.x = Math.sin(t * 0.6) * 0.16;
    group.position.y = Math.sin(t * 1.2) * 0.015;
  });

  return (
    <group position={[0, 1.4, -2.4]}>
      {/* Dark backing panel so the showcase reads against the room */}
      <mesh position={[0, 0.05, -0.55]}>
        <planeGeometry args={[2.5, 1.85]} />
        <meshBasicMaterial color="#020611" transparent opacity={0.9} depthWrite={false} />
      </mesh>

      {/* Header + specs */}
      <mesh position={[0, 0.96, -0.5]} renderOrder={2}>
        <planeGeometry args={[2.1, 0.66]} />
        <meshBasicMaterial map={headerTexture} toneMapped={false} transparent depthWrite={false} />
      </mesh>

      {/* Holographic plinth */}
      <mesh position={[0, -0.34, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.42, 0.46, 48]} />
        <meshBasicMaterial color="#00f0ff" toneMapped={false} transparent opacity={0.75} />
      </mesh>
      <mesh position={[0, -0.35, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.42, 48]} />
        <meshBasicMaterial color="#04101c" transparent opacity={0.8} />
      </mesh>

      {/* Both blasters on one turntable */}
      <group ref={turntableRef}>
        {/* Both blasters are mounted in profile so barrel, rail and grip all read */}
        <group position={[-0.42, 0.02, 0]} rotation={[0, Math.PI / 2, 0]} scale={2.05}>
          <CyberBlasterModel color="#00f0ff" isRight isFeverMode={false} />
        </group>
        <group position={[0.42, 0.02, 0]} rotation={[0, -Math.PI / 2, 0]} scale={2.05}>
          <CyberBlasterModel color="#ec4899" isRight={false} isFeverMode={false} />
        </group>

        {/* Mount pylons reaching down to the plinth ring */}
        {[-0.42, 0.42].map((x) => (
          <mesh key={`pylon-${x}`} position={[x, -0.16, 0]}>
            <cylinderGeometry args={[0.012, 0.02, 0.36, 8]} />
            <meshStandardMaterial
              color="#16233a"
              metalness={0.9}
              roughness={0.3}
              emissive="#00f0ff"
              emissiveIntensity={0.35}
            />
          </mesh>
        ))}

        {/* Soft holo glow behind the guns */}
        <mesh position={[0, 0.08, 0.22]}>
          <planeGeometry args={[1.0, 0.46]} />
          <meshBasicMaterial color="#00f0ff" transparent opacity={0.06} depthWrite={false} />
        </mesh>
      </group>

      {/* Drag surface: horizontal drag spins the turntable */}
      <Interactive
        onSelect={() => {
          // Trigger in VR: give the table a spin instead of firing
          velocityRef.current = THREE.MathUtils.clamp(velocityRef.current + 2.4, -6, 6);
        }}
      >
        <mesh
          position={[0, 0.05, 0.12]}
          onPointerDown={(e) => {
            e.stopPropagation();
            dragRef.current = { active: true, lastX: e.clientX };
          }}
          onPointerMove={(e) => {
            if (!dragRef.current.active) return;
            const dx = e.clientX - dragRef.current.lastX;
            dragRef.current.lastX = e.clientX;
            velocityRef.current = THREE.MathUtils.clamp(velocityRef.current + dx * 0.03, -6, 6);
          }}
          onPointerUp={() => {
            dragRef.current.active = false;
          }}
        >
          <planeGeometry args={[1.15, 0.75]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      </Interactive>

      {/* Close */}
      <Interactive
        onSelect={onClose}
        onHover={() => setHovered('close')}
        onBlur={() => setHovered(null)}
      >
        <group
          position={[0, -0.68, 0.35]}
          scale={hovered === 'close' ? [1.06, 1.06, 1] : [1, 1, 1]}
        >
          <mesh
            renderOrder={2}
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
              onClose();
            }}
          >
            <planeGeometry args={[0.62, 0.14]} />
            <meshBasicMaterial map={closeTexture} toneMapped={false} transparent depthWrite={false} />
          </mesh>
          {hovered === 'close' && (
            <mesh position={[0, 0, 0.005]} renderOrder={3}>
              <planeGeometry args={[0.66, 0.17]} />
              <meshBasicMaterial color="#ef4444" wireframe toneMapped={false} depthWrite={false} />
            </mesh>
          )}
        </group>
      </Interactive>

      <pointLight position={[0, 0.3, 0.7]} intensity={16} distance={4} color="#22d3ee" />
      <pointLight position={[-0.7, -0.05, 0.4]} intensity={7} distance={3} color="#ec4899" />
      <pointLight position={[0.6, 0.55, 0.35]} intensity={9} distance={3.4} color="#ffffff" />
    </group>
  );
};
