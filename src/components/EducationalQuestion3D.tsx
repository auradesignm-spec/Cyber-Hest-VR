/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { EducationalQuestion, Language, QuestionOption } from '../types/game';

interface EducationalQuestion3DProps {
  question: EducationalQuestion;
  questionIndex: number;
  totalQuestions: number;
  language: Language;
  lockedTargetId: string | number | null;
  onSelectOption: (optionId: string) => void;
  lastFeedback: { optionId: string; isCorrect: boolean } | null;
}

/**
 * Procedural Canvas Texture for the High-Altitude Question Board (Y: 3.5m, Z: -5.0m)
 * Features solid #020813 opaque navy backing, zero transparency, thick neon frame, and crisp font rendering.
 */
function useQuestionBoardTexture(
  question: EducationalQuestion,
  questionIndex: number,
  totalQuestions: number,
  isArabic: boolean
) {
  return useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1536;
    canvas.height = 384;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // 1. Solid High-Contrast Opaque Dark Navy Background (#020813)
      ctx.fillStyle = '#020813';
      ctx.fillRect(0, 0, 1536, 384);

      // Subtle tech background grid
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.06)';
      ctx.lineWidth = 1;
      for (let x = 48; x < 1536; x += 48) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 384);
        ctx.stroke();
      }
      for (let y = 48; y < 384; y += 48) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(1536, y);
        ctx.stroke();
      }

      // 2. High-Emissive Neon Border with Corner Brackets
      const borderColor =
        question.difficulty === 'easy'
          ? '#10b981'
          : question.difficulty === 'medium'
          ? '#00f0ff'
          : '#f59e0b';

      ctx.save();
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 8;
      ctx.strokeRect(16, 16, 1504, 352);

      // Inner crisp white highlight
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(20, 20, 1496, 344);

      // Heavy corner bracket accents
      ctx.fillStyle = borderColor;
      const bw = 36;
      const bh = 10;
      // Top-Left
      ctx.fillRect(16, 16, bw, bh);
      ctx.fillRect(16, 16, bh, bw);
      // Top-Right
      ctx.fillRect(1520 - bw, 16, bw, bh);
      ctx.fillRect(1520 - bh, 16, bh, bw);
      // Bottom-Left
      ctx.fillRect(16, 368 - bh, bw, bh);
      ctx.fillRect(16, 368 - bw, bh, bw);
      // Bottom-Right
      ctx.fillRect(1520 - bw, 368 - bh, bw, bh);
      ctx.fillRect(1520 - bh, 368 - bw, bh, bw);
      ctx.restore();

      const fontFamily = isArabic ? '"Cairo", sans-serif' : '"JetBrains Mono", monospace';

      // 3. Top Status Row: Category Pill & Question Counter
      const categoryLabel = isArabic ? question.categoryLabelAr : question.categoryLabelEn;
      const diffLabel =
        question.difficulty === 'easy'
          ? isArabic ? 'المستوى: مبتدئ' : 'EASY // NETWORKING BASICS'
          : question.difficulty === 'medium'
          ? isArabic ? 'المستوى: متوسط' : 'MEDIUM // PORTS & ENCRYPTION'
          : isArabic ? 'المستوى: متقدم' : 'HARD // HEX & SUBNETS';

      ctx.fillStyle = borderColor;
      ctx.font = `bold 22px ${fontFamily}`;
      ctx.textAlign = isArabic ? 'right' : 'left';
      ctx.textBaseline = 'middle';
      const headerX = isArabic ? 1480 : 54;
      ctx.fillText(`[ ${diffLabel} ] — ${categoryLabel}`, headerX, 58);

      // Question Counter Badge (Right / Left)
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold 22px ${fontFamily}`;
      ctx.textAlign = isArabic ? 'left' : 'right';
      const counterX = isArabic ? 54 : 1480;
      ctx.fillText(
        isArabic ? `السؤال ${questionIndex + 1} من ${totalQuestions}` : `INCIDENT ${questionIndex + 1} / ${totalQuestions}`,
        counterX,
        58
      );

      // 4. Main Question Prompt (Centered, High-Contrast White, Crisp Auto-wrapping)
      const promptText = isArabic ? question.promptAr : question.promptEn;
      ctx.fillStyle = '#ffffff';
      ctx.font = `900 46px ${fontFamily}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Auto-wrap prompt if it exceeds width
      const maxWidth = 1380;
      const words = promptText.split(' ');
      let line = '';
      const lines: string[] = [];

      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
          lines.push(line);
          line = words[n] + ' ';
        } else {
          line = testLine;
        }
      }
      lines.push(line);

      const startY = lines.length > 1 ? 165 : 190;
      lines.forEach((l, idx) => {
        ctx.fillText(l.trim(), 1536 / 2, startY + idx * 56);
      });

      // 5. Bottom Instructions Bar
      ctx.fillStyle = '#94a3b8';
      ctx.font = `bold 22px ${fontFamily}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const instructionText = isArabic
        ? '◄ أطلق بالليزر على بطاقة الحل الصحيحة في الأسفل لحماية الخادم ►'
        : '◄ AIM & SHOOT THE MATCHING TARGET BADGE BELOW TO DEPLOY COUNTERMEASURE ►';
      ctx.fillText(instructionText, 1536 / 2, 320);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.anisotropy = 4;
    texture.needsUpdate = true;
    return texture;
  }, [question, questionIndex, totalQuestions, isArabic]);
}

/**
 * Procedural Canvas Texture for each Solution Option Target Badge (Y: 1.25m, Z: -3.5m)
 */
function useOptionBadgeTexture(
  option: QuestionOption,
  index: number,
  isLocked: boolean,
  isCorrect: boolean | null,
  isArabic: boolean
) {
  return useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // 1. Solid #020813 Dark Navy Background
      ctx.fillStyle = isCorrect === true ? '#052e16' : isCorrect === false ? '#450a0a' : isLocked ? '#062038' : '#020813';
      ctx.fillRect(0, 0, 512, 256);

      // Technical grid
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.05)';
      ctx.lineWidth = 1;
      for (let x = 32; x < 512; x += 32) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 256);
        ctx.stroke();
      }

      // 2. Glowing Borders & Highlight
      const borderColor =
        isCorrect === true
          ? '#00FF66'
          : isCorrect === false
          ? '#FF0055'
          : isLocked
          ? '#f59e0b'
          : '#00f0ff';

      ctx.save();
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = isLocked ? 8 : 4;
      ctx.strokeRect(10, 10, 492, 236);

      // Inner highlight
      ctx.strokeStyle = isLocked ? '#ffffff' : borderColor;
      ctx.lineWidth = 2;
      ctx.strokeRect(14, 14, 484, 228);

      // Corner brackets
      ctx.fillStyle = borderColor;
      const bw = 24;
      const bh = 8;
      ctx.fillRect(10, 10, bw, bh);
      ctx.fillRect(10, 10, bh, bw);
      ctx.fillRect(502 - bw, 10, bw, bh);
      ctx.fillRect(502 - bh, 10, bh, bw);
      ctx.fillRect(10, 246 - bh, bw, bh);
      ctx.fillRect(10, 246 - bw, bh, bw);
      ctx.fillRect(502 - bw, 246 - bh, bw, bh);
      ctx.fillRect(502 - bh, 246 - bw, bh, bw);
      ctx.restore();

      const fontFamily = isArabic ? '"Cairo", sans-serif' : '"JetBrains Mono", monospace';
      const letter = ['A', 'B', 'C', 'D'][index] || '•';

      // 3. Option Tag Pill: [ OPTION A ]
      ctx.fillStyle = borderColor;
      ctx.font = `bold 20px ${fontFamily}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const optionHeader = isArabic ? `[ الخيار ${letter} ]` : `[ OPTION ${letter} ]`;
      ctx.fillText(isLocked ? `► ${optionHeader} ◄` : optionHeader, 256, 42);

      // 4. Primary Decision Token (Centered, Big & Crisp)
      const labelText = isArabic ? option.labelAr : option.labelEn;
      ctx.fillStyle = '#ffffff';
      ctx.font = `900 32px ${fontFamily}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Truncate / wrap if needed
      const maxTextWidth = 440;
      let fontSize = 32;
      ctx.font = `900 ${fontSize}px ${fontFamily}`;
      while (ctx.measureText(labelText).width > maxTextWidth && fontSize > 18) {
        fontSize -= 2;
        ctx.font = `900 ${fontSize}px ${fontFamily}`;
      }
      ctx.fillText(labelText, 256, 120);

      // 5. Status / Target Hint at Bottom
      ctx.font = `bold 18px ${fontFamily}`;
      ctx.fillStyle = isCorrect === true ? '#34d399' : isCorrect === false ? '#f87171' : isLocked ? '#fbbf24' : '#94a3b8';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const actionText =
        isCorrect === true
          ? isArabic ? '✓ إجابة صحيحة' : '✓ VERIFIED COUNTERMEASURE'
          : isCorrect === false
          ? isArabic ? '✗ إجابة غير صحيحة' : '✗ INCORRECT RULE'
          : isLocked
          ? isArabic ? '[ تصويب مؤكد — أطلق! ]' : '[ TARGET LOCKED — SHOOT! ]'
          : isArabic ? 'أطلق لاختيار الحل' : 'SHOOT TO ACTIVATE';
      ctx.fillText(actionText, 256, 205);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.anisotropy = 4;
    texture.needsUpdate = true;
    return texture;
  }, [option, index, isLocked, isCorrect, isArabic]);
}

/**
 * Individual 3D Solution Target Card with Smooth Hover Scaling (+15%)
 */
const SolutionTargetCard: React.FC<{
  option: QuestionOption;
  index: number;
  position: [number, number, number];
  isLocked: boolean;
  isCorrect: boolean | null;
  isArabic: boolean;
}> = ({ option, index, position, isLocked, isCorrect, isArabic }) => {
  const cardRef = useRef<THREE.Group>(null);
  const badgeTexture = useOptionBadgeTexture(option, index, isLocked, isCorrect, isArabic);

  // Smooth hover scale: 1.15 when locked, 1.0 when idle
  useFrame((_, delta) => {
    if (cardRef.current) {
      const targetScale = isLocked ? 1.15 : 1.0;
      cardRef.current.scale.x = THREE.MathUtils.damp(cardRef.current.scale.x, targetScale, 14, delta);
      cardRef.current.scale.y = THREE.MathUtils.damp(cardRef.current.scale.y, targetScale, 14, delta);
      cardRef.current.scale.z = THREE.MathUtils.damp(cardRef.current.scale.z, targetScale, 14, delta);
    }
  });

  return (
    <group ref={cardRef} position={position}>
      {/* Solid #020813 Opaque Backing Plate */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.35, 0.72, 0.08]} />
        <meshStandardMaterial
          color="#020813"
          metalness={0.9}
          roughness={0.2}
        />
      </mesh>

      {/* Front Canvas Textured Surface */}
      <mesh position={[0, 0, 0.045]}>
        <planeGeometry args={[1.30, 0.67]} />
        <meshBasicMaterial map={badgeTexture} toneMapped={false} />
      </mesh>

      {/* Top Cyber Emitter Node */}
      <mesh position={[0, 0.39, 0]}>
        <cylinderGeometry args={[0.08, 0.12, 0.08, 16]} />
        <meshStandardMaterial
          color={isLocked ? '#f59e0b' : '#00f0ff'}
          emissive={isLocked ? '#f59e0b' : '#00f0ff'}
          emissiveIntensity={isLocked ? 1.8 : 0.8}
        />
      </mesh>

      {/* Bottom Mounting Stanchion */}
      <mesh position={[0, -0.42, 0]}>
        <cylinderGeometry args={[0.04, 0.06, 0.14, 12]} />
        <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  );
};

/**
 * EducationalQuestion3D:
 * Eliminates all visual text overlaps through strict vertical and depth layering:
 * - Question Board: Y: +3.5m, Z: -5.0m (Fixed high-altitude, width: 4.8m)
 * - Solution Badges: Y: +1.25m, Z: -3.5m (Mid-level forward plane, horizontal distribution)
 */
export const EducationalQuestion3D: React.FC<EducationalQuestion3DProps> = ({
  question,
  questionIndex,
  totalQuestions,
  language,
  lockedTargetId,
  onSelectOption,
  lastFeedback,
}) => {
  const isArabic = language === 'ar';
  const boardTexture = useQuestionBoardTexture(question, questionIndex, totalQuestions, isArabic);

  // Distribute 3 solution option cards along X: [-2.35, 0, 2.35] at Y: 1.0, Z: -5.0
  const optionPositions: [number, number, number][] = useMemo(() => {
    const count = question.options.length;
    if (count === 3) {
      return [
        [-2.35, 1.0, -5.0],
        [0.0, 1.0, -5.0],
        [2.35, 1.0, -5.0],
      ];
    }
    // Fallback for 4 options
    return [
      [-2.7, 1.0, -5.0],
      [-0.9, 1.0, -5.0],
      [0.9, 1.0, -5.0],
      [2.7, 1.0, -5.0],
    ];
  }, [question.options.length]);

  return (
    <group name="EducationalQuestionRig">
      {/* 1. HIGH-ALTITUDE QUESTION BOARD (Y: 3.65m, Z: -5.0m) */}
      <group position={[0, 3.65, -5.0]}>
        {/* Solid #020813 Backplate */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[4.8, 1.25, 0.1]} />
          <meshStandardMaterial
            color="#020813"
            metalness={0.92}
            roughness={0.2}
          />
        </mesh>
        {/* Front Canvas Plane */}
        <mesh position={[0, 0, 0.055]}>
          <planeGeometry args={[4.74, 1.18]} />
          <meshBasicMaterial map={boardTexture} toneMapped={false} />
        </mesh>
        {/* Top Antenna Mounts */}
        {[-2.0, 0.0, 2.0].map((x, idx) => (
          <mesh key={idx} position={[x, 0.68, 0]}>
            <cylinderGeometry args={[0.02, 0.04, 0.16, 8]} />
            <meshStandardMaterial color="#00f0ff" emissive="#00f0ff" emissiveIntensity={0.8} />
          </mesh>
        ))}
      </group>

      {/* 2. SOLUTION TARGET BADGES (Y: 1.25m, Z: -3.5m) */}
      <group name="SolutionOptionsRow">
        {question.options.map((opt, idx) => {
          const pos = optionPositions[idx] || [0, 1.25, -3.5];
          const isLocked = lockedTargetId === opt.id;
          const isResult = lastFeedback?.optionId === opt.id ? lastFeedback.isCorrect : null;

          return (
            <SolutionTargetCard
              key={opt.id}
              option={opt}
              index={idx}
              position={pos}
              isLocked={isLocked}
              isCorrect={isResult}
              isArabic={isArabic}
            />
          );
        })}
      </group>
    </group>
  );
};
