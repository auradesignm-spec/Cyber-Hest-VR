/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Interactive } from '@react-three/xr';
import { Language } from '../types/game';

interface StageResult3DProps {
  status: 'victory' | 'gameover';
  language: Language;
  score: number;
  highScore: number;
  isNewRecord: boolean;
  lockedTargetId: string | number | null;
  onNextStage: () => void;
  onRetry: () => void;
  onMainMenu: () => void;
}

function useResultPanelTexture(
  status: 'victory' | 'gameover',
  isArabic: boolean,
  score: number,
  highScore: number,
  isNewRecord: boolean
) {
  return useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 384;
    const ctx = canvas.getContext('2d');
    const fontFamily = isArabic ? '"Cairo", sans-serif' : '"Orbitron", monospace';

    if (ctx) {
      ctx.fillStyle = '#02060f';
      ctx.fillRect(0, 0, 1024, 384);

      const accent = status === 'victory' ? '#22d3ee' : '#ef4444';
      ctx.strokeStyle = accent;
      ctx.lineWidth = 8;
      ctx.strokeRect(12, 12, 1000, 360);

      ctx.fillStyle = accent;
      ctx.font = `900 54px ${fontFamily}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        status === 'victory'
          ? isArabic
            ? '✓ تم تحييد الحادث'
            : '✓ INCIDENT NEUTRALIZED'
          : isArabic
          ? '✗ اختراق النواة'
          : '✗ CORE BREACHED',
        512,
        92
      );

      ctx.fillStyle = '#ffffff';
      ctx.font = `900 32px ${fontFamily}`;
      ctx.fillText(
        isArabic ? `نقاطك: ${score}` : `SCORE: ${score}`,
        512,
        168
      );

      ctx.font = `900 24px ${fontFamily}`;
      ctx.fillStyle = '#cbd5f5';
      ctx.fillText(
        isArabic ? `أفضل نتيجة: ${highScore}` : `PERSONAL BEST: ${highScore}`,
        512,
        216
      );

      if (isNewRecord) {
        ctx.fillStyle = '#f59e0b';
        ctx.font = `900 26px ${fontFamily}`;
        ctx.fillText(isArabic ? '🔥 رقم قياسي جديد!' : '🔥 NEW HIGH SCORE!', 512, 262);
      }

      ctx.fillStyle = '#ffffff';
      ctx.font = `900 22px ${fontFamily}`;
      ctx.fillText(
        isArabic
          ? '◄ أطلق على زر في الأسفل للمتابعة ►'
          : '◄ SHOOT A PANEL BELOW TO CONTINUE ►',
        512,
        328
      );
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.needsUpdate = true;
    return texture;
  }, [status, isArabic, score, highScore, isNewRecord]);
}

function useButtonTexture(labelEn: string, labelAr: string, isArabic: boolean, accent: string) {
  return useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 192;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#02060f';
      ctx.fillRect(0, 0, 512, 192);
      ctx.strokeStyle = accent;
      ctx.lineWidth = 6;
      ctx.strokeRect(6, 6, 500, 180);

      ctx.fillStyle = '#ffffff';
      ctx.font = isArabic ? 'bold 44px "Cairo", sans-serif' : '900 36px "Orbitron", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(isArabic ? labelAr : labelEn, 256, 82);

      ctx.fillStyle = accent;
      ctx.font = isArabic ? 'bold 22px "Cairo", sans-serif' : 'bold 20px "JetBrains Mono", monospace';
      ctx.fillText(isArabic ? 'أطلق للتفعيل' : 'SHOOT TO ACTIVATE', 256, 140);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    return texture;
  }, [labelEn, labelAr, isArabic, accent]);
}

const ResultButton: React.FC<{
  position: [number, number, number];
  texture: THREE.Texture;
  isLocked: boolean;
  onSelect: () => void;
}> = ({ position, texture, isLocked, onSelect }) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const target = isLocked ? 1.06 : 1.0;
    groupRef.current.scale.x = THREE.MathUtils.damp(groupRef.current.scale.x, target, 14, delta);
    groupRef.current.scale.y = THREE.MathUtils.damp(groupRef.current.scale.y, target, 14, delta);
    groupRef.current.scale.z = THREE.MathUtils.damp(groupRef.current.scale.z, target, 14, delta);
  });

  return (
    <Interactive onSelect={onSelect}>
      <group ref={groupRef} position={position}>
        <mesh>
          <boxGeometry args={[1.5, 0.56, 0.07]} />
          <meshBasicMaterial color="#000000" />
        </mesh>
        <mesh
          position={[0, 0, 0.04]}
          onClick={onSelect}
          onPointerDown={onSelect}
        >
          <planeGeometry args={[1.46, 0.52]} />
          <meshBasicMaterial map={texture} toneMapped={false} depthWrite={false} />
        </mesh>
      </group>
    </Interactive>
  );
};

export const StageResult3D: React.FC<StageResult3DProps> = ({
  status,
  language,
  score,
  highScore,
  isNewRecord,
  lockedTargetId,
  onNextStage,
  onRetry,
  onMainMenu,
}) => {
  const isArabic = language === 'ar';
  const panelTexture = useResultPanelTexture(status, isArabic, score, highScore, isNewRecord);

  const primaryTexture = useButtonTexture(
    status === 'victory' ? 'NEXT INCIDENT ►' : 'RETRY MISSION ↻',
    status === 'victory' ? 'الحادث التالي ►' : 'إعادة المهمة ↻',
    isArabic,
    status === 'victory' ? '#22d3ee' : '#f59e0b'
  );
  const menuTexture = useButtonTexture('MAIN MENU', 'القائمة الرئيسية', isArabic, '#94a3b8');

  const primaryId = status === 'victory' ? 'btn-next-stage' : 'btn-retry';
  const primaryAction = status === 'victory' ? onNextStage : onRetry;

  return (
    <group name="StageResultRig">
      <group position={[0, 2.05, -3.4]}>
        <mesh>
          <boxGeometry args={[4.3, 1.62, 0.08]} />
          <meshBasicMaterial color="#000000" />
        </mesh>
        <mesh position={[0, 0, 0.05]}>
          <planeGeometry args={[4.2, 1.58]} />
          <meshBasicMaterial map={panelTexture} toneMapped={false} depthWrite={false} />
        </mesh>
      </group>

      <ResultButton
        position={[-1.15, 1.0, -3.15]}
        texture={primaryTexture}
        isLocked={lockedTargetId === primaryId}
        onSelect={primaryAction}
      />
      <ResultButton
        position={[1.15, 1.0, -3.15]}
        texture={menuTexture}
        isLocked={lockedTargetId === 'btn-main-menu'}
        onSelect={onMainMenu}
      />
    </group>
  );
};
