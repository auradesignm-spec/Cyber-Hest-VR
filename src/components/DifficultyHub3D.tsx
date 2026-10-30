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
 * 3D Difficulty & Skill Selection Hub (Step 3)
 * - 3 Tiered Floating Holographic Cards (EASY, MEDIUM, HARD)
 * - Curriculum Breakdown & Pacing Indicators
 * - Dual support: Mouse Click and VR Blaster Raycast Shoot-to-Select
 * - 3D Back to Scenario Hub Button
 */
export const DifficultyHub3D: React.FC<DifficultyHub3DProps> = ({
  language,
  selectedDifficulty,
  onSelectDifficulty,
  onBackToScenarios,
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
        speed: '0.55x PACKET FLOW',
        focusEn: [
          '• Cisco OSI 7-Layer Architecture',
          '• TCP/UDP & Secure Protocols (HTTPS/FTP)',
          '• Threat Identification: Phishing & DDoS',
        ],
        focusAr: [
          '• نموذج أوسي OSI ذو الطبقات السبع',
          '• بروتوكولات TCP/UDP وبروتوكول HTTPS',
          '• رصد التهديدات: التصيد والهجمات الموزعة',
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
        speed: '1.05x BALANCED PACE',
        focusEn: [
          '• Well-Known Ports: 22, 80, 443, 53',
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
        speed: '1.65x EMERGENCY FLOW',
        focusEn: [
          '• Real-time Hex Decode: 0x16, 0x01BB',
          '• CIDR Subnet Masks (/12, /16, /24)',
          '• High-Velocity Threat Interception',
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
      // Solid dark navy background
      ctx.fillStyle = '#020814';
      ctx.fillRect(0, 0, 768, 960);

      // Tech Grid
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.06)';
      ctx.lineWidth = 1;
      for (let x = 32; x < 768; x += 32) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 960);
        ctx.stroke();
      }

      // Border with corner brackets
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
      ctx.font = `900 ${isArabic ? '42px' : '36px'} ${fontFamily}`;
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(isArabic ? card.titleAr : card.titleEn, 384, 85);

      // Subtitle
      ctx.font = `bold 22px ${fontFamily}`;
      ctx.fillStyle = card.color;
      ctx.fillText(isArabic ? card.subtitleAr : card.subtitleEn, 384, 130);

      // Divider Line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(48, 160);
      ctx.lineTo(720, 160);
      ctx.stroke();

      // Telemetry Specs Box
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(48, 190, 672, 100);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 2;
      ctx.strokeRect(48, 190, 672, 100);

      ctx.font = 'bold 22px "JetBrains Mono", monospace';
      ctx.fillStyle = '#38bdf8';
      ctx.textAlign = 'center';
      ctx.fillText(`⏱ TIMER: ${card.timer}  |  ⚡ SPEED: ${card.speed}`, 384, 250);

      // Curriculum Topics
      ctx.font = `bold 22px ${fontFamily}`;
      ctx.fillStyle = '#fde68a';
      ctx.textAlign = isArabic ? 'right' : 'left';
      const topicsHeader = isArabic ? 'محاور التدريب السيبراني:' : 'TRAINING CURRICULUM:';
      ctx.fillText(topicsHeader, isArabic ? 700 : 64, 340);

      ctx.font = `normal 22px ${fontFamily}`;
      ctx.fillStyle = '#e2e8f0';
      const list = isArabic ? card.focusAr : card.focusEn;
      list.forEach((item, i) => {
        ctx.fillText(item, isArabic ? 700 : 64, 395 + i * 48);
      });

      // Interactive Action Prompt Box
      ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
      ctx.fillRect(48, 800, 672, 100);
      ctx.strokeStyle = card.color;
      ctx.lineWidth = 3;
      ctx.strokeRect(48, 800, 672, 100);

      ctx.font = `900 28px ${fontFamily}`;
      ctx.fillStyle = card.color;
      ctx.textAlign = 'center';
      const promptText = isArabic ? '⚡ انقر أو أطلق للقفز إلى الساحة' : '⚡ CLICK OR SHOOT TO WARP IN';
      ctx.fillText(promptText, 384, 862);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  };

  const cardTextures = useMemo(() => {
    return diffCards.map((c) => makeCardTexture(c));
  }, [diffCards, isArabic]);

  // Back Button Texture
  const backTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 480;
    canvas.height = 120;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#061325';
      ctx.fillRect(0, 0, 480, 120);

      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 4;
      ctx.strokeRect(6, 6, 468, 108);

      const fontFamily = isArabic ? '"Cairo", sans-serif' : '"JetBrains Mono", monospace';
      ctx.font = `bold 24px ${fontFamily}`;
      ctx.fillStyle = '#e2e8f0';
      ctx.textAlign = 'center';
      const label = isArabic ? '◄ العودة لاختيار السيناريو' : '◄ BACK TO SCENARIOS';
      ctx.fillText(label, 240, 68);
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
      ctx.fillStyle = '#020814';
      ctx.fillRect(0, 0, 1200, 200);

      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 4;
      ctx.strokeRect(8, 8, 1184, 184);

      const fontFamily = isArabic ? '"Cairo", sans-serif' : '"JetBrains Mono", monospace';
      ctx.font = `bold 22px ${fontFamily}`;
      ctx.fillStyle = '#10b981';
      ctx.textAlign = 'center';
      const stepText = isArabic ? 'المرحلة 3 من 4 // اختيار مستوى المهارة' : 'STEP 3 OF 4 // SKILL TIER SELECTION';
      ctx.fillText(stepText, 600, 60);

      ctx.font = `900 ${isArabic ? '40px' : '36px'} ${fontFamily}`;
      ctx.fillStyle = '#ffffff';
      const titleText = isArabic ? 'حدد درجة صعوبة التدريب والتوقيت' : 'SELECT TRAINING DIFFICULTY & PACING';
      ctx.fillText(titleText, 600, 125);
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
        <meshStandardMaterial
          map={headerTexture}
          roughness={0.2}
          metalness={0.8}
          emissive="#00f0ff"
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* 3 Holographic Difficulty Cards */}
      {diffCards.map((card, idx) => {
        const isHovered = hoveredCard === card.id || lockedTargetId === card.id;
        const scaleVal = isHovered ? 1.15 : 1.0;

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
              <meshStandardMaterial
                map={cardTextures[idx]}
                roughness={0.15}
                metalness={0.8}
                emissive={card.color}
                emissiveIntensity={isHovered ? 0.75 : 0.25}
              />
            </mesh>

            {/* Pedestal Underglow */}
            <pointLight
              position={[0, -1.2, 0.2]}
              intensity={isHovered ? 2.5 : 1.2}
              color={card.color}
              distance={3.5}
            />
          </group>
        );
      })}

      {/* Back to Scenarios Button (Y: +0.25m, Z: -3.0m) */}
      <mesh
        position={[0, 0.25, -3.0]}
        onClick={onBackToScenarios}
        onPointerOver={() => setHoveredCard('back')}
        onPointerOut={() => setHoveredCard(null)}
        scale={hoveredCard === 'back' || lockedTargetId === 'back_scenarios' ? 1.12 : 1.0}
      >
        <planeGeometry args={[1.8, 0.42]} />
        <meshStandardMaterial
          map={backTexture}
          roughness={0.2}
          metalness={0.8}
          emissive="#64748b"
          emissiveIntensity={hoveredCard === 'back' || lockedTargetId === 'back_scenarios' ? 0.8 : 0.3}
        />
      </mesh>
    </group>
  );
};
