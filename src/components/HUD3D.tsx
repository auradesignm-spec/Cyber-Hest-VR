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
}

export const HUD3D: React.FC<HUD3DProps> = ({
  health,
  timeRemaining,
  score,
  scenarioId,
  isInVR,
  language = 'en',
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
      // Dark cyber glass background
      ctx.fillStyle = '#030b14';
      ctx.fillRect(0, 0, 512, 320);

      // Cyan neon border with chamfered tech corners
      ctx.strokeStyle = threatInfo.color;
      ctx.lineWidth = 6;
      ctx.strokeRect(6, 6, 500, 308);

      // Header Bar
      ctx.fillStyle = 'rgba(6, 182, 212, 0.15)';
      ctx.fillRect(8, 8, 496, 54);

      const fontFam = isArabic ? '"Cairo", sans-serif' : '"JetBrains Mono", monospace';

      ctx.font = `bold 22px ${fontFam}`;
      ctx.fillStyle = threatInfo.color;
      ctx.fillText(`[ ${threatInfo.code} ]`, 24, 44);

      ctx.font = `bold 18px ${fontFam}`;
      ctx.fillStyle = '#e2e8f0';
      ctx.textAlign = 'right';
      ctx.fillText(threatInfo.title, 488, 44);
      ctx.textAlign = 'left';

      // 1. Health Bar Section
      ctx.font = `bold 16px ${fontFam}`;
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(isArabic ? 'سلامة العقدة:' : 'NODE INTEGRITY:', 24, 98);
      ctx.fillStyle = health > 50 ? '#10b981' : health > 25 ? '#f59e0b' : '#ef4444';
      ctx.fillText(`${health}%`, 440, 98);

      // Health Bar Track
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(24, 110, 464, 18);
      ctx.fillStyle = health > 50 ? '#10b981' : health > 25 ? '#f59e0b' : '#ef4444';
      ctx.fillRect(24, 110, (464 * Math.max(0, health)) / 100, 18);

      // 2. Wave Timer & Score
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(isArabic ? 'الوقت المتبقي:' : 'TIME REMAINING:', 24, 168);
      const minutes = Math.floor(timeRemaining / 60);
      const seconds = (timeRemaining % 60).toString().padStart(2, '0');
      ctx.font = 'bold 28px "JetBrains Mono", monospace';
      ctx.fillStyle = timeRemaining < 20 ? '#ef4444' : '#38bdf8';
      ctx.fillText(`${minutes}:${seconds}`, 24, 204);

      ctx.font = `bold 16px ${fontFam}`;
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(isArabic ? 'النقاط:' : 'SECURE SCORE:', 280, 168);
      ctx.font = 'bold 26px "JetBrains Mono", monospace';
      ctx.fillStyle = '#00f0ff';
      ctx.fillText(`${score} PTS`, 280, 204);

      // 3. Shield Battery Gauge
      ctx.fillStyle = '#94a3b8';
      ctx.font = `bold 14px ${fontFam}`;
      ctx.fillText(isArabic ? 'مكثف الدرع: 100% [نشط]' : 'SHIELD CAPACITOR: 100% [ONLINE]', 24, 252);
      ctx.fillStyle = '#0284c7';
      for (let i = 0; i < 10; i++) {
        ctx.fillRect(24 + i * 46, 264, 40, 10);
      }

      // Tech micro-footer
      ctx.fillStyle = '#475569';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillText('QUANTUM NODE DEFENDER // FIRMWARE v4.2-XR', 24, 302);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
  }, [health, timeRemaining, score, threatInfo, isArabic]);

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
