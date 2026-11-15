/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Interactive, useXRInputSourceState, useXRControllerButtonEvent } from '@react-three/xr';
import * as THREE from 'three';
import { CyberBlasterModel } from './VRPlayer';
import { Language } from '../types/game';
import { WEAPONS, WEAPON_ORDER, WeaponId } from '../game/weapons';

interface WeaponArmory3DProps {
  language: Language;
  weaponId: WeaponId;
  onSelectWeapon: (id: WeaponId) => void;
  onClose: () => void;
}

const BASE_SPIN = 0.5;

const _worldQuat = new THREE.Quaternion();
const _worldEuler = new THREE.Euler();

/**
 * In-world armory and loadout bay.
 *
 * One blaster is mounted on a turntable that can be grabbed with the trigger
 * (or dragged with the mouse) and inspected from every side, while three fixed
 * plates below it swap the equipped weapon.
 */
export const WeaponArmory3D: React.FC<WeaponArmory3DProps> = ({
  language,
  weaponId,
  onSelectWeapon,
  onClose,
}) => {
  const isArabic = language === 'ar';
  const turntableRef = useRef<THREE.Group>(null);
  const velocityRef = useRef(BASE_SPIN);
  const dragRef = useRef({ active: false, lastX: 0 });
  const [hovered, setHovered] = useState<string | null>(null);

  const rightState = useXRInputSourceState('controller', 'right');
  const leftState = useXRInputSourceState('controller', 'left');

  const grabRef = useRef<{
    side: 'left' | 'right';
    startYaw: number;
    startRotation: number;
    lastRotation: number;
    velocity: number;
  } | null>(null);

  const beginGrab = (side: 'left' | 'right') => {
    const controller = side === 'right' ? rightState : leftState;
    const group = turntableRef.current;
    if (!controller?.object || !group) return;
    controller.object.getWorldQuaternion(_worldQuat);
    _worldEuler.setFromQuaternion(_worldQuat, 'YXZ');
    grabRef.current = {
      side,
      startYaw: _worldEuler.y,
      startRotation: group.rotation.y,
      lastRotation: group.rotation.y,
      velocity: 0,
    };
  };

  const endGrab = () => {
    const grab = grabRef.current;
    if (!grab) return;
    velocityRef.current = THREE.MathUtils.clamp(grab.velocity, -4, 4);
    grabRef.current = null;
  };

  useXRControllerButtonEvent(rightState, 'xr-standard-trigger', (state) => {
    if (state === 'pressed') beginGrab('right');
    else endGrab();
  });
  useXRControllerButtonEvent(leftState, 'xr-standard-trigger', (state) => {
    if (state === 'pressed') beginGrab('left');
    else endGrab();
  });

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
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, 1024, 300);
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 5;
      ctx.strokeRect(6, 6, 1012, 288);

      const fontFamily = isArabic ? '"Cairo", sans-serif' : '"JetBrains Mono", monospace';
      ctx.textAlign = 'center';

      ctx.fillStyle = '#ffffff';
      ctx.font = `900 ${isArabic ? '38px' : '34px'} ${fontFamily}`;
      ctx.fillText(isArabic ? 'معرض الأسلحة // اختر عتادك' : 'ARMORY // SELECT YOUR LOADOUT', 512, 68);

      ctx.fillStyle = '#00f0ff';
      ctx.font = `900 22px ${fontFamily}`;
      ctx.fillText(
        isArabic ? 'أمسك الزناد وأدِر يدك للفحص · أو اسحب بالماوس' : 'HOLD TRIGGER + TURN YOUR HAND · OR DRAG WITH THE MOUSE',
        512,
        118
      );

      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2;
      ctx.strokeRect(48, 152, 928, 60);

      ctx.fillStyle = '#ffffff';
      ctx.font = `900 22px ${fontFamily}`;
      ctx.fillText(
        isArabic ? 'كل سلاح يغيّر الإطلاق والمدى وقوة القفل المغناطيسي' : 'EACH BLASTER CHANGES FIRE RATE, SPREAD AND MAGNETIC LOCK',
        512,
        190
      );

      ctx.fillStyle = '#00f0ff';
      ctx.font = `900 20px ${fontFamily}`;
      ctx.fillText(
        isArabic ? 'تحت: اختر بالليزر أو بالزناد' : 'BELOW: PICK WITH THE LASER OR THE TRIGGER',
        512,
        250
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
      ctx.font = `900 ${isArabic ? '30px' : '26px'} ${fontFamily}`;
      ctx.fillText(isArabic ? '✕ تأكيد والخروج' : '✕ CONFIRM & CLOSE', 256, 68);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, [isArabic]);

  const tileTextures = useMemo(() => {
    const fontFamily = isArabic ? '"Cairo", sans-serif' : '"JetBrains Mono", monospace';
    return WEAPON_ORDER.reduce((acc, id) => {
      const weapon = WEAPONS[id];
      const isEquipped = id === weaponId;

      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 200;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, 512, 200);
        ctx.strokeStyle = isEquipped ? '#00f0ff' : '#334155';
        ctx.lineWidth = isEquipped ? 7 : 4;
        ctx.strokeRect(5, 5, 502, 190);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.font = `900 ${isArabic ? '30px' : '26px'} ${fontFamily}`;
        ctx.fillText(isArabic ? weapon.nameAr : weapon.nameEn, 256, 62);

        ctx.fillStyle = isEquipped ? '#00f0ff' : '#94a3b8';
        ctx.font = `900 19px ${fontFamily}`;
        ctx.fillText(isArabic ? weapon.taglineAr : weapon.taglineEn, 256, 104);

        if (isEquipped) {
          ctx.fillStyle = '#00f0ff';
          ctx.fillRect(5, 150, 502, 45);
          ctx.fillStyle = '#000000';
          ctx.font = `900 24px ${fontFamily}`;
          ctx.fillText(isArabic ? 'مُجهَّز' : 'EQUIPPED', 256, 182);
        } else {
          ctx.fillStyle = '#ffffff';
          ctx.font = `900 20px ${fontFamily}`;
          ctx.fillText(isArabic ? 'اضغط للتجهيز' : 'EQUIP', 256, 176);
        }
      }
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      acc[id] = texture;
      return acc;
    }, {} as Record<WeaponId, THREE.Texture>);
  }, [isArabic, weaponId]);

  useFrame((state, delta) => {
    const group = turntableRef.current;
    if (!group) return;

    const t = state.clock.getElapsedTime();
    const grab = grabRef.current;
    const controller = grab ? (grab.side === 'right' ? rightState : leftState) : null;

    if (grab && controller?.object) {
      controller.object.getWorldQuaternion(_worldQuat);
      _worldEuler.setFromQuaternion(_worldQuat, 'YXZ');
      const deltaYaw = Math.atan2(
        Math.sin(_worldEuler.y - grab.startYaw),
        Math.cos(_worldEuler.y - grab.startYaw)
      );
      group.rotation.y = grab.startRotation + deltaYaw;

      if (delta > 0.0001) {
        grab.velocity = THREE.MathUtils.lerp(
          grab.velocity,
          (group.rotation.y - grab.lastRotation) / delta,
          0.4
        );
      }
      grab.lastRotation = group.rotation.y;
      group.rotation.x = THREE.MathUtils.damp(group.rotation.x, 0, 8, delta);
    } else {
      velocityRef.current = THREE.MathUtils.damp(velocityRef.current, BASE_SPIN, 2.4, delta);
      group.rotation.y += velocityRef.current * delta;
      group.rotation.x = Math.sin(t * 0.6) * 0.16;
    }

    group.position.y = 0.06 + Math.sin(t * 1.2) * 0.014;
  });

  const equipped = WEAPONS[weaponId];

  return (
    <group position={[0, 1.38, -2.35]}>
      {/* Dark backing panel so the showcase reads against the room */}
      <mesh position={[0, 0.05, -0.62]}>
        <planeGeometry args={[2.85, 2.2]} />
        <meshBasicMaterial color="#020611" transparent opacity={0.92} depthWrite={false} />
      </mesh>

      {/* Header + rules */}
      <mesh position={[0, 1.02, -0.58]} renderOrder={2}>
        <planeGeometry args={[2.2, 0.64]} />
        <meshBasicMaterial map={headerTexture} toneMapped={false} transparent depthWrite={false} />
      </mesh>

      {/* Holographic plinth */}
      <mesh position={[0, -0.26, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.36, 0.4, 48]} />
        <meshBasicMaterial color={equipped.color} toneMapped={false} transparent opacity={0.8} />
      </mesh>
      <mesh position={[0, -0.27, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.36, 48]} />
        <meshBasicMaterial color="#04101c" transparent opacity={0.8} />
      </mesh>

      {/* Single equipped blaster on the turntable */}
      <group ref={turntableRef} position={[0, 0.06, 0]}>
        <group rotation={[0, Math.PI / 2, 0]} scale={2.5}>
          <CyberBlasterModel color={equipped.color} isRight isFeverMode={false} />
        </group>

        {/* Mount pylon down to the plinth */}
        <mesh position={[0, -0.22, 0]}>
          <cylinderGeometry args={[0.012, 0.02, 0.32, 8]} />
          <meshStandardMaterial
            color="#16233a"
            metalness={0.9}
            roughness={0.3}
            emissive={equipped.color}
            emissiveIntensity={0.35}
          />
        </mesh>
      </group>

      {/* Drag surface: hold and turn the table */}
      <Interactive>
        <mesh
          position={[0, 0.12, 0.18]}
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
          <planeGeometry args={[1.05, 0.66]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      </Interactive>

      {/* Loadout plates */}
      {WEAPON_ORDER.map((id, index) => {
        const weapon = WEAPONS[id];
        const isEquipped = id === weaponId;
        const hoverKey = `weapon-${id}`;
        return (
          <Interactive
            key={id}
            onSelect={() => onSelectWeapon(id)}
            onHover={() => setHovered(hoverKey)}
            onBlur={() => setHovered(null)}
          >
            <group
              position={[(index - 1) * 0.68, -0.56, 0.06]}
              scale={
                hovered === hoverKey || isEquipped
                  ? [isEquipped ? 1.04 : 1.08, isEquipped ? 1.04 : 1.08, 1]
                  : [1, 1, 1]
              }
            >
              <mesh
                renderOrder={2}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectWeapon(id);
                }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  onSelectWeapon(id);
                }}
              >
                <planeGeometry args={[0.6, 0.235]} />
                <meshBasicMaterial
                  map={tileTextures[id]}
                  toneMapped={false}
                  transparent
                  depthWrite={false}
                />
              </mesh>
              {(hovered === hoverKey || isEquipped) && (
                <mesh position={[0, 0, 0.004]} renderOrder={3}>
                  <planeGeometry args={[0.64, 0.27]} />
                  <meshBasicMaterial
                    color={isEquipped ? weapon.color : weapon.color}
                    wireframe
                    toneMapped={false}
                    depthWrite={false}
                  />
                </mesh>
              )}
            </group>
          </Interactive>
        );
      })}

      {/* Close */}
      <Interactive
        onSelect={onClose}
        onHover={() => setHovered('close')}
        onBlur={() => setHovered(null)}
      >
        <group
          position={[0, -0.86, 0.3]}
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
      <pointLight position={[0, -0.5, 0.5]} intensity={7} distance={3} color={equipped.color} />
      <pointLight position={[0.6, 0.55, 0.35]} intensity={9} distance={3.4} color="#ffffff" />
    </group>
  );
};
