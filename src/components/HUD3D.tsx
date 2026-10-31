/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import * as THREE from 'three';
import { ScenarioId, Language } from '../types/game';

interface HUD3DProps {
  health: number; // 0 - 100
  timeRemaining: number;
  score: number;
  scenarioId: ScenarioId;
  isInVR: boolean;
  language?: Language;
  combo?: number;
  multiplier?: number;
  isFeverMode?: boolean;
}

export const HUD3D: React.FC<HUD3DProps> = ({
  health,
  timeRemaining,
  score,
  scenarioId,
  isInVR,
  language = 'en',
  combo = 0,
  multiplier = 1,
  isFeverMode = false,
}) => {
  const isArabic = language === 'ar';

  // Threat Level title by scenario
  const threatInfo = useMemo(() => {
    switch (scenarioId) {
      case 'scenario-1':
        return {
          code: isArabic ? 'ديفكون 3' : 'DEFCON 3',
          title: isArabic ? 'اقتحام المنفذ' : 'PORT BRUTE FORCE',
          color: '#00f0ff',
        };
      case 'scenario-2':
        return {
          code: isArabic ? 'ديفكون 2' : 'DEFCON 2',
          title: isArabic ? 'تلف الحمولة' : 'PAYLOAD CORRUPTION',
          color: '#ec4899',
        };
      case 'scenario-3':
        return {
          code: isArabic ? 'ديفكون 1' : 'DEFCON 1',
          title: isArabic ? 'طوفان DDOS' : 'DDOS OVERFLOW',
          color: '#ef4444',
        };
    }
  }, [scenarioId, isArabic]);

  // Procedural CanvasTexture for the 3D Holographic Display
  const hudTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 320;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // 1. Strict pitch black background
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, 512, 320);

      // 2. Cyan neon border with chamfered tech corners
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 6;
      ctx.strokeRect(6, 6, 500, 308);

      // Header Bar
      ctx.fillStyle = '#000000';
      ctx.fillRect(8, 8, 496, 54);
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2;
      ctx.strokeRect(8, 8, 496, 54);

      const fontFam = isArabic ? '"Cairo", sans-serif' : '"JetBrains Mono", monospace';

      ctx.font = `900 24px ${fontFam}`;
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`[ ${threatInfo.code} ]`, 24, 44);

      ctx.font = `900 20px ${fontFam}`;
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'right';
      ctx.fillText(threatInfo.title, 488, 44);
      ctx.textAlign = 'left';

      // 1. Health Bar Section
      ctx.font = `900 18px ${fontFam}`;
      ctx.fillStyle = '#ffffff';
      ctx.fillText(isArabic ? 'سلامة العقدة:' : 'NODE INTEGRITY:', 24, 98);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`${health}%`, 440, 98);

      // Health Bar Track
      ctx.fillStyle = '#111111';
      ctx.fillRect(24, 110, 464, 18);
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(24, 110, 464, 18);

      ctx.fillStyle = '#00f0ff';
      ctx.fillRect(24, 110, (464 * Math.max(0, health)) / 100, 18);

      // 2. Wave Timer & Score
      ctx.font = `900 18px ${fontFam}`;
      ctx.fillStyle = '#ffffff';
      ctx.fillText(isArabic ? 'الوقت المتبقي:' : 'TIME REMAINING:', 24, 168);
      const minutes = Math.floor(timeRemaining / 60);
      const seconds = (timeRemaining % 60).toString().padStart(2, '0');
      ctx.font = '900 32px "JetBrains Mono", monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`${minutes}:${seconds}`, 24, 204);

      ctx.font = `900 18px ${fontFam}`;
      ctx.fillStyle = '#ffffff';
      ctx.fillText(isArabic ? 'النقاط:' : 'SECURE SCORE:', 280, 168);
      ctx.font = '900 30px "JetBrains Mono", monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`${score} PTS`, 280, 204);

      // 3. Dynamic Combo Meter & Fever Mode Display
      ctx.font = `900 16px ${fontFam}`;
      ctx.fillStyle = '#ffffff';

      if (isFeverMode) {
        ctx.fillText(
          isArabic ? '🔥 وضع الحماس نشط: مضاعف 3x! 🔥' : '🔥 FEVER SURGE: 3x SCORE ACTIVE! 🔥',
          24,
          252
        );
        // Blazing Fever Bars
        for (let i = 0; i < 10; i++) {
          ctx.fillStyle = '#00f0ff';
          ctx.fillRect(24 + i * 46, 264, 40, 10);
        }
      } else if (combo > 1) {
        ctx.fillText(
          isArabic
            ? `تسلسل الضربات: ${combo} [مضاعف x${multiplier}]`
            : `COMBO STREAK: x${combo} [x${multiplier} MULTIPLIER]`,
          24,
          252
        );
        // Progressive Combo Streak Blocks
        for (let i = 0; i < 10; i++) {
          ctx.fillStyle = i < combo ? '#00f0ff' : '#111111';
          ctx.fillRect(24 + i * 46, 264, 40, 10);
        }
      } else {
        ctx.fillText(
          isArabic ? 'مكثف السلاح: 100% [جاهز لتسلسل الضربات]' : 'ENERGY CAPACITOR: 100% [READY FOR COMBO]',
          24,
          252
        );
        ctx.fillStyle = '#00f0ff';
        for (let i = 0; i < 10; i++) {
          ctx.fillRect(24 + i * 46, 264, 40, 10);
        }
      }

      // Tech micro-footer
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 11px "JetBrains Mono", monospace';
      ctx.fillText('QUANTUM NODE DEFENDER // FIRMWARE v4.2-XR', 24, 302);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
  }, [health, timeRemaining, score, threatInfo, isArabic, combo, multiplier, isFeverMode]);

  // Position:
  // In VR, mounted on left controller wrist
  // In Desktop, tucked into lower-left tactical edge
  const position: [number, number, number] = isInVR
    ? [0.0, 0.08, 0.05]
    : [-0.75, 0.98, -0.85];

  const rotation: [number, number, number] = isInVR
    ? [-Math.PI / 4, Math.PI / 8, 0]
    : [-0.05, 0.45, 0];

  return (
    <group position={position} rotation={rotation} scale={[0.65, 0.65, 0.65]}>
      {/* Wrist Housing / Holographic Bracket */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.34, 0.22, 0.02]} />
        <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Cyber Bezel Rim */}
      <mesh position={[0, 0, 0.012]}>
        <boxGeometry args={[0.32, 0.2, 0.005]} />
        <meshStandardMaterial
          color="#1e293b"
          emissive={threatInfo.color}
          emissiveIntensity={0.4}
        />
      </mesh>

      {/* Holographic Display Face */}
      <mesh position={[0, 0, 0.016]}>
        <planeGeometry args={[0.31, 0.19]} />
        <meshBasicMaterial map={hudTexture} transparent opacity={0.95} />
      </mesh>

      {/* Soft Holographic Emitter Light */}
      <pointLight position={[0, 0, 0.06]} intensity={0.4} distance={0.8} color={threatInfo.color} />
    </group>
  );
};
