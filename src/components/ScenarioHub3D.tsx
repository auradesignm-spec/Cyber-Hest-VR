/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import * as THREE from 'three';
import { Language, ScenarioId } from '../types/game';

interface ScenarioHub3DProps {
  language: Language;
  selectedScenario: ScenarioId | 'random';
  onSelectScenario: (scenario: ScenarioId) => void;
  onBackToSplash: () => void;
  lockedTargetId?: string | number | null;
}

interface ScenarioCardData {
  id: ScenarioId;
  indexStr: string;
  titleEn: string;
  titleAr: string;
  tagEn: string;
  tagAr: string;
  descEn: string;
  descAr: string;
  color: string;
  xPos: number;
  rotY: number;
}

/**
 * 3D Scenario Selection Hub (Step 2)
 * - 3 Floating Holographic Cards in a gentle arc
 * - Hover elevation (+15%), gold/cyan glow border
 * - Dual support: Mouse click on desktop and Blaster shoot-to-select in VR
 * - 3D Back to Splash button
 */
export const ScenarioHub3D: React.FC<ScenarioHub3DProps> = ({
  language,
  selectedScenario,
  onSelectScenario,
  onBackToSplash,
  lockedTargetId,
}) => {
  const isArabic = language === 'ar';
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const scenarioCards: ScenarioCardData[] = useMemo(
    () => [
      {
        id: 'scenario-1',
        indexStr: '01',
        titleEn: 'Hex Firewall Breach',
        titleAr: 'اختراق الجدار الناري الست عشري',
        tagEn: 'PORTS & HEX PROTOCOLS',
        tagAr: 'المنافذ والترميز الست عشري',
        descEn: 'Attacker injects raw hex port codes (0x16, 0x50, 0x01BB). Decouple hex values to seal blast gates.',
        descAr: 'المهاجم يحقن رموز منافذ ست عشرية. فك تشفير الرموز الست عشرية لإغلاق البوابات المحصنة.',
        color: '#00f0ff',
        xPos: -2.3,
        rotY: 0.22,
      },
      {
        id: 'scenario-2',
        indexStr: '02',
        titleEn: 'Payload Purge',
        titleAr: 'تطهير حمولة البرمجيات الخبيثة',
        tagEn: 'COLOR ROUTING & SHIELDS',
        tagAr: 'توجيه الألوان ودروع التشفير',
        descEn: 'Corrupted color packet signatures indicate Ransomware and Worms. Deploy AES-256 and RSA countermeasure orbs.',
        descAr: 'بصمات حزم الألوان المشبوهة تدل على الفدية والديدان. أطلق دروع التطهير لحماية الموجهات.',
        color: '#ec4899',
        xPos: 0.0,
        rotY: 0.0,
      },
      {
        id: 'scenario-3',
        indexStr: '03',
        titleEn: 'DDoS Subnet Blackhole',
        titleAr: 'هجوم حجب الخدمة وعزل الشبكة',
        tagEn: 'CIDR ROUTING & EMP BURSTS',
        tagAr: 'توجيه CIDR ونبضات EMP',
        descEn: 'Botnet deluge strikes core subnet routers. Calculate CIDR masks (/12, /16, /24) and overload attacker nodes.',
        descAr: 'طوفان من البوت نت يضرب راوترات الشبكة. احسب أقنعة CIDR وأسقط عقد المهاجمين بنبضة كهرومغناطيسية.',
        color: '#10b981',
        xPos: 2.3,
        rotY: -0.22,
      },
    ],
    []
  );

  // Generate Card Texture
  const makeCardTexture = (card: ScenarioCardData) => {
    const canvas = document.createElement('canvas');
    canvas.width = 768;
    canvas.height = 960;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Solid dark navy background
      ctx.fillStyle = '#020814';
      ctx.fillRect(0, 0, 768, 960);

      // Grid watermark
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

      // Index Pill Badge
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.fillRect(40, 48, 120, 56);
      ctx.strokeStyle = card.color;
      ctx.lineWidth = 2;
      ctx.strokeRect(40, 48, 120, 56);

      ctx.font = '900 28px "JetBrains Mono", monospace';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(`SCENARIO ${card.indexStr}`, 100, 87);

      // Category Tag
      ctx.font = `bold 22px ${fontFamily}`;
      ctx.fillStyle = card.color;
      ctx.textAlign = isArabic ? 'right' : 'left';
      ctx.fillText(isArabic ? card.tagAr : card.tagEn, isArabic ? 720 : 180, 86);

      // Scenario Title
      ctx.font = `900 ${isArabic ? '42px' : '38px'} ${fontFamily}`;
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = isArabic ? 'right' : 'left';
      ctx.fillText(isArabic ? card.titleAr : card.titleEn, isArabic ? 720 : 48, 180);

      // Divider Line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(48, 220);
      ctx.lineTo(720, 220);
      ctx.stroke();

      // Description (Word wrapped)
      ctx.font = `normal 24px ${fontFamily}`;
      ctx.fillStyle = '#cbd5e1';
      const desc = isArabic ? card.descAr : card.descEn;
      const words = desc.split(' ');
      let line = '';
      let yPos = 280;
      for (const word of words) {
        const testLine = line + word + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > 660) {
          ctx.fillText(line, isArabic ? 720 : 48, yPos);
          line = word + ' ';
          yPos += 38;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, isArabic ? 720 : 48, yPos);

      // Interactive Action Prompt Box
      ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
      ctx.fillRect(48, 800, 672, 100);
      ctx.strokeStyle = card.color;
      ctx.lineWidth = 3;
      ctx.strokeRect(48, 800, 672, 100);

      ctx.font = `900 28px ${fontFamily}`;
      ctx.fillStyle = card.color;
      ctx.textAlign = 'center';
      const promptText = isArabic ? '⚡ انقر أو أطلق بالليزر للاختيار' : '⚡ CLICK OR SHOOT TO ENGAGE';
      ctx.fillText(promptText, 384, 862);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  };

  const cardTextures = useMemo(() => {
    return scenarioCards.map((c) => makeCardTexture(c));
  }, [scenarioCards, isArabic]);

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
      const label = isArabic ? '◄ العودة للشاشة الرئيسية' : '◄ BACK TO SPLASH';
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
      const stepText = isArabic ? 'المرحلة 2 من 4 // مركز اختيار السيناريو' : 'STEP 2 OF 4 // SCENARIO SELECTION HUB';
      ctx.fillText(stepText, 600, 60);

      ctx.font = `900 ${isArabic ? '40px' : '36px'} ${fontFamily}`;
      ctx.fillStyle = '#ffffff';
      const titleText = isArabic ? 'حدد مسار الحادث السيبراني المراد محاكاته' : 'SELECT CYBER INCIDENT TO SIMULATE';
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

      {/* 3 Holographic Scenario Cards */}
      {scenarioCards.map((card, idx) => {
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
              onClick={() => onSelectScenario(card.id)}
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

      {/* Back to Splash Button (Y: +0.25m, Z: -3.0m) */}
      <mesh
        position={[0, 0.25, -3.0]}
        onClick={onBackToSplash}
        onPointerOver={() => setHoveredCard('back')}
        onPointerOut={() => setHoveredCard(null)}
        scale={hoveredCard === 'back' || lockedTargetId === 'back_splash' ? 1.12 : 1.0}
      >
        <planeGeometry args={[1.6, 0.42]} />
        <meshStandardMaterial
          map={backTexture}
          roughness={0.2}
          metalness={0.8}
          emissive="#64748b"
          emissiveIntensity={hoveredCard === 'back' || lockedTargetId === 'back_splash' ? 0.8 : 0.3}
        />
      </mesh>
    </group>
  );
};
