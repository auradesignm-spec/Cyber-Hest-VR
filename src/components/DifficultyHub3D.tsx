/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import * as THREE from 'three';
import { Language, DifficultyLevel } from '../types/game';

interface DifficultyHub3DProps {
  language: Language;
  selectedDifficulty: DifficultyLevel;
  onSelectDifficulty: (diff: DifficultyLevel) => void;
  onBackToScenarios: () => void;
  onLaunchGame: () => void;
  lockedTargetId?: string | number | null;
}

interface DifficultyCardData {
  id: DifficultyLevel;
  titleEn: string;
  titleAr: string;
  subtitleEn: string;
  subtitleAr: string;
  timer: string;
  speed: string;
  focusEn: string[];
  focusAr: string[];
  color: string;
  xPos: number;
  rotY: number;
}

/**
 * 3D Difficulty & Skill Selection Hub (Step 3) - High Contrast & Crystal Clear Text
 * - Solid dark obsidian backing panels (#020612)
 * - Pure white high-contrast typography (#ffffff)
 * - Vivid colored borders (Emerald, Cyan, Amber) without emissive wash-out
 * - Clear curriculum bullet points & pacing metrics
 * - Dual support: Mouse Click and VR Blaster Raycast Shoot-to-Select
 */
export const DifficultyHub3D: React.FC<DifficultyHub3DProps> = ({
  language,
  selectedDifficulty,
  onSelectDifficulty,
  onBackToScenarios,
  onLaunchGame,
  lockedTargetId,
}) => {
  const isArabic = language === 'ar';
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const diffCards: DifficultyCardData[] = useMemo(
    () => [
      {
        id: 'easy',
        titleEn: 'TIER 1: EASY',
        titleAr: 'المستوى 1: مبتدئ',
        subtitleEn: 'NETWORKING & CYBER BASICS',
        subtitleAr: 'أساسيات الشبكات والأمن السيبراني',
        timer: '120 SECONDS',
        speed: '0.65x CONTROLLED FLOW',
        focusEn: [
          '• Cisco OSI 7-Layer Architecture',
          '• TCP/UDP & Secure Protocols (HTTPS/SSH)',
          '• Threat Identification: Phishing & Malware',
        ],
        focusAr: [
          '• نموذج أوسي OSI ذو الطبقات السبع',
          '• بروتوكولات TCP/UDP وبروتوكول HTTPS',
          '• رصد التهديدات: التصيد والبرمجيات الخبيثة',
        ],
        color: '#10b981',
        xPos: -2.3,
        rotY: 0.22,
      },
      {
        id: 'medium',
        titleEn: 'TIER 2: MEDIUM',
        titleAr: 'المستوى 2: متوسط',
        subtitleEn: 'PORTS & CRYPTOGRAPHIC SHIELDS',
        subtitleAr: 'المنافذ والأنظمة التشفيرية',
        timer: '90 SECONDS',
        speed: '1.15x BALANCED PACE',
        focusEn: [
          '• Standard Port Mapping: 22, 80, 443, 53',
          '• Symmetric vs Asymmetric Ciphers',
          '• AES-256 vs RSA-4096 vs SHA Hash Logic',
        ],
        focusAr: [
          '• مطابقة المنافذ الشائعة: 22 و80 و443 و53',
          '• التشفير المتماثل وغير المتماثل',
          '• آليات دروع AES-256 وRSA والتجزئة',
        ],
        color: '#00f0ff',
        xPos: 0.0,
        rotY: 0.0,
      },
      {
        id: 'hard',
        titleEn: 'TIER 3: HARD',
        titleAr: 'المستوى 3: خبير متقدم',
        subtitleEn: 'HEX CONVERSIONS & CIDR SUBNETS',
        subtitleAr: 'التحويل الست عشري وأقنعة الشبكات',
        timer: '60 SECONDS',
        speed: '1.75x EMERGENCY FLOW',
        focusEn: [
          '• Real-time Hex Decode: 0x16, 0x01BB',
          '• CIDR Subnet Masks (/12, /16, /24)',
          '• Multi-Vector Threat Interception',
        ],
        focusAr: [
          '• فك تشفير الرموز الست عشرية الفورية',
          '• حساب نطاقات CIDR وأقنعة الشبكات الفرعية',
          '• سرعة تدفق فائقة للحزم الهجومية',
        ],
        color: '#f59e0b',
        xPos: 2.3,
        rotY: -0.22,
      },
    ],
    []
  );

  const makeCardTexture = (card: DifficultyCardData) => {
    const canvas = document.createElement('canvas');
    canvas.width = 768;
    canvas.height = 960;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Solid dark obsidian navy background
      ctx.fillStyle = '#020612';
      ctx.fillRect(0, 0, 768, 960);

      // Subtle tech grid
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.06)';
      ctx.lineWidth = 1;
      for (let x = 32; x < 768; x += 32) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 960);
        ctx.stroke();
      }

      // Outer sharp glowing border
      ctx.strokeStyle = card.color;
      ctx.lineWidth = 8;
      ctx.strokeRect(16, 16, 736, 928);

      // Corner brackets
      ctx.fillStyle = card.color;
      const bSize = 36;
      ctx.fillRect(16, 16, bSize, 8);
      ctx.fillRect(16, 16, 8, bSize);
      ctx.fillRect(752 - bSize, 16, bSize, 8);
      ctx.fillRect(744, 16, 8, bSize);
      ctx.fillRect(16, 936, bSize, 8);
      ctx.fillRect(16, 944 - bSize, 8, bSize);
      ctx.fillRect(752 - bSize, 936, bSize, 8);
      ctx.fillRect(744, 944 - bSize, 8, bSize);

      const fontFamily = isArabic ? '"Cairo", sans-serif' : '"JetBrains Mono", monospace';

      // Header Tier Title
      ctx.font = `900 ${isArabic ? '38px' : '36px'} ${fontFamily}`;
      ctx.fillStyle = card.color;
      ctx.textAlign = 'center';
      ctx.fillText(isArabic ? card.titleAr : card.titleEn, 384, 80);

      // Subtitle
      ctx.font = `bold 20px ${fontFamily}`;
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(isArabic ? card.subtitleAr : card.subtitleEn, 384, 125);

      // Divider Line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(48, 155);
      ctx.lineTo(720, 155);
      ctx.stroke();

      // Pacing Stats Box
      ctx.fillStyle = '#060e1e';
      ctx.fillRect(48, 175, 672, 90);
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
      ctx.lineWidth = 2;
      ctx.strokeRect(48, 175, 672, 90);

      ctx.font = 'bold 22px "JetBrains Mono", monospace';
      ctx.fillStyle = '#38bdf8';
      ctx.textAlign = 'center';
      ctx.fillText(`⏱ TIMER: ${card.timer}   |   ⚡ PACING: ${card.speed}`, 384, 230);

      // Training Focus Header
      ctx.font = `bold 24px ${fontFamily}`;
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = isArabic ? 'right' : 'left';
      ctx.fillText(isArabic ? 'محاور تدريب المحاكاة:' : 'TRAINING CURRICULUM:', isArabic ? 720 : 54, 315);

      // Bullet points (Word wrapped, pure white high-contrast text)
      const bullets = isArabic ? card.focusAr : card.focusEn;
      let yOffset = 365;

      bullets.forEach((bullet) => {
        ctx.fillStyle = '#0a162c';
        ctx.fillRect(48, yOffset - 32, 672, 70);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        ctx.strokeRect(48, yOffset - 32, 672, 70);

        ctx.font = `bold 22px ${fontFamily}`;
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = isArabic ? 'right' : 'left';
        ctx.fillText(bullet, isArabic ? 700 : 68, yOffset + 12);
        yOffset += 90;
      });

      // Interactive Action Prompt Box
      ctx.fillStyle = '#081226';
      ctx.fillRect(48, 820, 672, 90);
      ctx.strokeStyle = card.color;
      ctx.lineWidth = 4;
      ctx.strokeRect(48, 820, 672, 90);

      ctx.font = `900 28px ${fontFamily}`;
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      const promptText = isArabic ? '⚡ انقر أو أطلق بالليزر للاختيار' : '⚡ CLICK OR SHOOT TO ENGAGE';
      ctx.fillText(promptText, 384, 876);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  };

  const cardTextures = useMemo(() => {
    return diffCards.map((c) => makeCardTexture(c));
  }, [diffCards, isArabic, selectedDifficulty]);

  // Back Button Texture (High Contrast Slate-Navy)
  const backTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 480;
    canvas.height = 120;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#071120';
      ctx.fillRect(0, 0, 480, 120);

      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 5;
      ctx.strokeRect(6, 6, 468, 108);

      const fontFamily = isArabic ? '"Cairo", sans-serif' : '"JetBrains Mono", monospace';
      ctx.font = `900 24px ${fontFamily}`;
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      const label = isArabic ? '◄ العودة للسيناريوهات' : '◄ BACK TO SCENARIOS';
      ctx.fillText(label, 240, 68);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, [isArabic]);

  // Launch Button Texture (High Contrast Amber-Navy)
  const launchTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 540;
    canvas.height = 130;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#1c1304';
      ctx.fillRect(0, 0, 540, 130);

      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 6;
      ctx.strokeRect(6, 6, 528, 118);

      const fontFamily = isArabic ? '"Cairo", sans-serif' : '"JetBrains Mono", monospace';
      ctx.font = `900 ${isArabic ? '28px' : '26px'} ${fontFamily}`;
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      const label = isArabic ? '⚡ أطلق لبدء المهمة والدفاع ◄' : '⚡ SHOOT TO LAUNCH MISSION ◄';
      ctx.fillText(label, 270, 75);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, [isArabic]);

  // Header Title Texture
  const headerTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#020612';
      ctx.fillRect(0, 0, 1200, 200);

      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 5;
      ctx.strokeRect(8, 8, 1184, 184);

      const fontFamily = isArabic ? '"Cairo", sans-serif' : '"JetBrains Mono", monospace';
      ctx.font = `bold 24px ${fontFamily}`;
      ctx.fillStyle = '#10b981';
      ctx.textAlign = 'center';
      const stepText = isArabic ? 'المرحلة 3 من 3 // أطلق بالليزر لتحديد الصعوبة' : 'STEP 3 // SHOOT DIFFICULTY TARGET TO SELECT';
      ctx.fillText(stepText, 600, 60);

      ctx.font = `900 ${isArabic ? '42px' : '38px'} ${fontFamily}`;
      ctx.fillStyle = '#ffffff';
      const titleText = isArabic ? 'حدد درجة صعوبة التدريب والتوقيت' : 'SELECT TRAINING DIFFICULTY & PACING';
      ctx.fillText(titleText, 600, 130);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, [isArabic]);

  return (
    <group position={[0, 0, 0]}>
      {/* Top Header Panel (Y: +3.2m, Z: -3.8m) */}
      <mesh position={[0, 3.2, -3.8]}>
        <planeGeometry args={[3.8, 0.65]} />
        <meshBasicMaterial map={headerTexture} toneMapped={false} />
      </mesh>

      {/* 3 Holographic Difficulty Cards */}
      {diffCards.map((card, idx) => {
        const isHovered = hoveredCard === card.id || lockedTargetId === `diff_${card.id}`;
        const isSelected = selectedDifficulty === card.id;
        const scaleVal = isHovered ? 1.15 : isSelected ? 1.08 : 1.0;

        return (
          <group
            key={card.id}
            position={[card.xPos, 1.6, -3.4]}
            rotation={[0, card.rotY, 0]}
            scale={[scaleVal, scaleVal, scaleVal]}
          >
            <mesh
              onClick={() => onSelectDifficulty(card.id)}
              onPointerOver={() => setHoveredCard(card.id)}
              onPointerOut={() => setHoveredCard(null)}
            >
              <planeGeometry args={[1.9, 2.4]} />
              <meshBasicMaterial map={cardTextures[idx]} toneMapped={false} />
            </mesh>

            {/* Glowing Wireframe Outline on Hover or Selection */}
            {(isHovered || isSelected) && (
              <mesh position={[0, 0, 0.01]}>
                <planeGeometry args={[1.94, 2.44]} />
                <meshBasicMaterial color={card.color} wireframe toneMapped={false} />
              </mesh>
            )}

            {/* Subtle Pedestal Underglow */}
            <pointLight
              position={[0, -1.2, 0.2]}
              intensity={isHovered ? 2.0 : isSelected ? 1.5 : 0.8}
              color={card.color}
              distance={3.0}
            />
          </group>
        );
      })}

      {/* Back to Scenarios Button (Y: +0.25m, X: -1.4m, Z: -3.0m) */}
      <group
        position={[-1.4, 0.25, -3.0]}
        scale={hoveredCard === 'back' || lockedTargetId === 'back_scenarios' ? [1.12, 1.12, 1] : [1, 1, 1]}
      >
        <mesh
          onClick={onBackToScenarios}
          onPointerOver={() => setHoveredCard('back')}
          onPointerOut={() => setHoveredCard(null)}
        >
          <planeGeometry args={[1.6, 0.42]} />
          <meshBasicMaterial map={backTexture} toneMapped={false} />
        </mesh>
        {(hoveredCard === 'back' || lockedTargetId === 'back_scenarios') && (
          <mesh position={[0, 0, 0.01]}>
            <planeGeometry args={[1.64, 0.46]} />
            <meshBasicMaterial color="#64748b" wireframe toneMapped={false} />
          </mesh>
        )}
      </group>

      {/* Launch Mission Button (Y: +0.25m, X: +1.4m, Z: -3.0m) */}
      <group
        position={[1.4, 0.25, -3.0]}
        scale={hoveredCard === 'launch' || lockedTargetId === 'launch_game' ? [1.15, 1.15, 1] : [1.05, 1.05, 1]}
      >
        <mesh
          onClick={onLaunchGame}
          onPointerOver={() => setHoveredCard('launch')}
          onPointerOut={() => setHoveredCard(null)}
        >
          <planeGeometry args={[1.8, 0.48]} />
          <meshBasicMaterial map={launchTexture} toneMapped={false} />
        </mesh>
        {(hoveredCard === 'launch' || lockedTargetId === 'launch_game') && (
          <mesh position={[0, 0, 0.01]}>
            <planeGeometry args={[1.84, 0.52]} />
            <meshBasicMaterial color="#f59e0b" wireframe toneMapped={false} />
          </mesh>
        )}
      </group>
    </group>
  );
};
