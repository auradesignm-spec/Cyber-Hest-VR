/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import * as THREE from 'three';
import { Interactive } from '@react-three/xr';
import { Language, ScenarioId } from '../types/game';

interface ScenarioHub3DProps {
  language: Language;
  selectedScenario: ScenarioId | 'random';
  onSelectScenario: (scenario: ScenarioId) => void;
  onBackToSplash: () => void;
  onNextDifficulty?: () => void;
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
  position: [number, number, number];
  rotY: number;
}

export const ScenarioHub3D: React.FC<ScenarioHub3DProps> = ({
  language,
  selectedScenario,
  onSelectScenario,
  onBackToSplash,
  onNextDifficulty,
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
        position: [-2.5, 1.5, -4.0],
        rotY: 0.3,
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
        position: [0.0, 1.5, -4.0],
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
        position: [2.5, 1.5, -4.0],
        rotY: -0.3,
      },
    ],
    []
  );

  // Generate Card Texture with High-Contrast Graphics & Thumbnails
  const makeCardTexture = (card: ScenarioCardData) => {
    const canvas = document.createElement('canvas');
    canvas.width = 768;
    canvas.height = 960;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Solid pitch black background
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, 768, 960);

      // Outer sharp glowing border
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 8;
      ctx.strokeRect(16, 16, 736, 928);

      // Corner brackets
      ctx.fillStyle = '#00f0ff';
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

      // Index Badge
      ctx.fillStyle = '#000000';
      ctx.fillRect(40, 42, 160, 52);
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2;
      ctx.strokeRect(40, 42, 160, 52);

      ctx.font = '900 24px "JetBrains Mono", monospace';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(`SCENARIO ${card.indexStr}`, 120, 77);

      // Category Tag
      ctx.font = `900 22px ${fontFamily}`;
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = isArabic ? 'right' : 'left';
      ctx.fillText(isArabic ? card.tagAr : card.tagEn, isArabic ? 720 : 220, 78);

      // Scenario Title (Pure White, Bold)
      ctx.font = `900 ${isArabic ? '38px' : '36px'} ${fontFamily}`;
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = isArabic ? 'right' : 'left';
      ctx.fillText(isArabic ? card.titleAr : card.titleEn, isArabic ? 720 : 48, 155);

      // Divider Line
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(48, 185);
      ctx.lineTo(720, 185);
      ctx.stroke();

      // ================= VISUAL THUMBNAIL CANVAS =================
      ctx.fillStyle = '#000000';
      ctx.fillRect(48, 205, 672, 340);
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2;
      ctx.strokeRect(48, 205, 672, 340);

      if (card.id === 'scenario-1') {
        // Armored Blast Door with Hazard Stripes & Hex Lock
        ctx.fillStyle = '#111111';
        ctx.fillRect(160, 235, 448, 280);
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 4;
        ctx.strokeRect(160, 235, 448, 280);

        // Center Hexagon Lock Badge
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        const cx = 384, cy = 375, r = 60;
        for (let a = 0; a < 6; a++) {
          const ang = (a * Math.PI) / 3;
          const x = cx + r * Math.cos(ang);
          const y = cy + r * Math.sin(ang);
          if (a === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.font = '900 36px "JetBrains Mono", monospace';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText('0x16', 384, 388);
      } else if (card.id === 'scenario-2') {
        // Router with Force Shield & Color Payload Orbs
        ctx.fillStyle = '#111111';
        ctx.fillRect(200, 360, 368, 90);
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 4;
        ctx.strokeRect(200, 360, 368, 90);

        // Glowing Shield Dome
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(384, 405, 150, Math.PI, 0, false);
        ctx.stroke();

        // Payload Orbs
        const orbs = [
          { x: 300, y: 310, c: '#00f0ff' },
          { x: 384, y: 280, c: '#ffffff' },
          { x: 468, y: 310, c: '#00f0ff' },
        ];
        orbs.forEach((orb) => {
          ctx.fillStyle = orb.c;
          ctx.beginPath();
          ctx.arc(orb.x, orb.y, 22, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 3;
          ctx.stroke();
        });
      } else {
        // Subnet EMP with Radiating Concentric Pulse Rings
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 3;
        for (let r = 40; r <= 140; r += 32) {
          ctx.beginPath();
          ctx.arc(384, 375, r, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Core Switch Tower
        ctx.fillStyle = '#111111';
        ctx.fillRect(334, 335, 100, 80);
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 4;
        ctx.strokeRect(334, 335, 100, 80);

        ctx.font = '900 24px "JetBrains Mono", monospace';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText('/24 CIDR', 384, 382);
      }

      // ================= DESCRIPTION TEXT =================
      ctx.font = `900 24px ${fontFamily}`;
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = isArabic ? 'right' : 'left';
      const desc = isArabic ? card.descAr : card.descEn;
      const words = desc.split(' ');
      let line = '';
      let yPos = 590;
      for (const word of words) {
        const testLine = line + word + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > 660) {
          ctx.fillText(line, isArabic ? 710 : 54, yPos);
          line = word + ' ';
          yPos += 36;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, isArabic ? 710 : 54, yPos);

      // ================= INTERACTIVE CTA PROMPT =================
      ctx.fillStyle = '#000000';
      ctx.fillRect(48, 820, 672, 90);
      ctx.strokeStyle = '#00f0ff';
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
    return scenarioCards.map((c) => makeCardTexture(c));
  }, [scenarioCards, isArabic, selectedScenario]);

  // Back Button Texture (High Contrast Strict #000000 + #00F0FF)
  const backTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 480;
    canvas.height = 120;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, 480, 120);

      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 5;
      ctx.strokeRect(6, 6, 468, 108);

      const fontFamily = isArabic ? '"Cairo", sans-serif' : '"JetBrains Mono", monospace';
      ctx.font = `900 24px ${fontFamily}`;
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      const label = isArabic ? '◄ العودة للرئيسية' : '◄ BACK TO SPLASH';
      ctx.fillText(label, 240, 68);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, [isArabic]);

  // Next: Difficulty Button Texture
  const nextTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 540;
    canvas.height = 130;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, 540, 130);

      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 6;
      ctx.strokeRect(6, 6, 528, 118);

      const fontFamily = isArabic ? '"Cairo", sans-serif' : '"JetBrains Mono", monospace';
      ctx.font = `900 ${isArabic ? '28px' : '26px'} ${fontFamily}`;
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      const label = isArabic ? '⚡ الانتقال لتحديد الصعوبة ◄' : '⚡ SHOOT FOR DIFFICULTY ◄';
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
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, 1200, 200);

      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 5;
      ctx.strokeRect(8, 8, 1184, 184);

      const fontFamily = isArabic ? '"Cairo", sans-serif' : '"JetBrains Mono", monospace';
      ctx.font = `900 24px ${fontFamily}`;
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      const stepText = isArabic ? 'المرحلة 2 من 3 // أطلق بالليزر لاختيار السيناريو' : 'STEP 2 // SHOOT SCENARIO TARGET TO SELECT';
      ctx.fillText(stepText, 600, 60);

      ctx.font = `900 ${isArabic ? '42px' : '38px'} ${fontFamily}`;
      ctx.fillStyle = '#ffffff';
      const titleText = isArabic ? 'حدد مسار الحادث السيبراني المراد محاكاته' : 'SELECT CYBER INCIDENT TO SIMULATE';
      ctx.fillText(titleText, 600, 130);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, [isArabic]);

  return (
    <group position={[0, 0, 0]}>
      {/* Top Header Panel (Y: +3.1m, Z: -4.0m) */}
      <mesh position={[0, 3.1, -4.0]} renderOrder={1}>
        <planeGeometry args={[3.8, 0.65]} />
        <meshBasicMaterial map={headerTexture} toneMapped={false} depthWrite={false} />
      </mesh>

      {/* 3 Holographic Scenario Cards in Rigid Curved Gallery */}
      {scenarioCards.map((card, idx) => {
        const isHovered = hoveredCard === card.id || lockedTargetId === card.id;
        const isSelected = selectedScenario === card.id;
        const scaleVal = isHovered ? 1.05 : isSelected ? 1.03 : 1.0;

        return (
          <Interactive
            key={card.id}
            onSelect={() => onSelectScenario(card.id)}
            onHover={() => setHoveredCard(card.id)}
            onBlur={() => setHoveredCard(null)}
          >
            <group
              position={card.position}
              rotation={[0, card.rotY, 0]}
              scale={[scaleVal, scaleVal, scaleVal]}
            >
              {/* Solid Pitch Black Backing Plane (Prevents transparency blend) */}
              <mesh renderOrder={0}>
                <boxGeometry args={[1.92, 2.42, 0.05]} />
                <meshBasicMaterial color="#000000" />
              </mesh>

              {/* Front Textured Surface with strict renderOrder to avoid Z-fighting */}
              <mesh
                position={[0, 0, 0.03]}
                renderOrder={1}
                onClick={() => onSelectScenario(card.id)}
                onPointerDown={() => onSelectScenario(card.id)}
                onPointerEnter={() => setHoveredCard(card.id)}
                onPointerLeave={() => setHoveredCard(null)}
              >
                <planeGeometry args={[1.9, 2.4]} />
                <meshBasicMaterial map={cardTextures[idx]} toneMapped={false} depthWrite={false} />
              </mesh>

              {/* Glowing Wireframe Outline on Hover or Selection */}
              {(isHovered || isSelected) && (
                <mesh position={[0, 0, 0.035]} renderOrder={2}>
                  <planeGeometry args={[1.96, 2.46]} />
                  <meshBasicMaterial color="#00f0ff" wireframe toneMapped={false} depthWrite={false} />
                </mesh>
              )}

              {/* Pedestal Underglow */}
              <pointLight
                position={[0, -1.2, 0.3]}
                intensity={isHovered ? 2.5 : isSelected ? 1.8 : 0.8}
                color="#00f0ff"
                distance={3.0}
              />
            </group>
          </Interactive>
        );
      })}

      {/* Back to Splash Button (Y: +0.3m, X: -1.4m, Z: -3.8m, RotY: 0.15) */}
      <Interactive
        onSelect={onBackToSplash}
        onHover={() => setHoveredCard('back')}
        onBlur={() => setHoveredCard(null)}
      >
        <group
          position={[-1.4, 0.3, -3.8]}
          rotation={[0, 0.15, 0]}
          scale={hoveredCard === 'back' || lockedTargetId === 'btn-back-splash' ? [1.05, 1.05, 1] : [1, 1, 1]}
        >
          <mesh renderOrder={0}>
            <boxGeometry args={[1.62, 0.44, 0.04]} />
            <meshBasicMaterial color="#000000" />
          </mesh>
          <mesh
            position={[0, 0, 0.025]}
            renderOrder={1}
            onClick={onBackToSplash}
            onPointerDown={onBackToSplash}
            onPointerEnter={() => setHoveredCard('back')}
            onPointerLeave={() => setHoveredCard(null)}
          >
            <planeGeometry args={[1.6, 0.42]} />
            <meshBasicMaterial map={backTexture} toneMapped={false} depthWrite={false} />
          </mesh>
          {(hoveredCard === 'back' || lockedTargetId === 'btn-back-splash') && (
            <mesh position={[0, 0, 0.03]} renderOrder={2}>
              <planeGeometry args={[1.66, 0.48]} />
              <meshBasicMaterial color="#00f0ff" wireframe toneMapped={false} depthWrite={false} />
            </mesh>
          )}
        </group>
      </Interactive>

      {/* Next to Difficulty Button (Y: +0.3m, X: +1.4m, Z: -3.8m, RotY: -0.15) */}
      <Interactive
        onSelect={() => onNextDifficulty?.()}
        onHover={() => setHoveredCard('next')}
        onBlur={() => setHoveredCard(null)}
      >
        <group
          position={[1.4, 0.3, -3.8]}
          rotation={[0, -0.15, 0]}
          scale={hoveredCard === 'next' || lockedTargetId === 'btn-next-difficulty' ? [1.05, 1.05, 1] : [1, 1, 1]}
        >
          <mesh renderOrder={0}>
            <boxGeometry args={[1.82, 0.5, 0.04]} />
            <meshBasicMaterial color="#000000" />
          </mesh>
          <mesh
            position={[0, 0, 0.025]}
            renderOrder={1}
            onClick={() => onNextDifficulty?.()}
            onPointerDown={() => onNextDifficulty?.()}
            onPointerEnter={() => setHoveredCard('next')}
            onPointerLeave={() => setHoveredCard(null)}
          >
            <planeGeometry args={[1.8, 0.48]} />
            <meshBasicMaterial map={nextTexture} toneMapped={false} depthWrite={false} />
          </mesh>
          {(hoveredCard === 'next' || lockedTargetId === 'btn-next-difficulty') && (
            <mesh position={[0, 0, 0.03]} renderOrder={2}>
              <planeGeometry args={[1.86, 0.54]} />
              <meshBasicMaterial color="#00f0ff" wireframe toneMapped={false} depthWrite={false} />
            </mesh>
          )}
        </group>
      </Interactive>
    </group>
  );
};
