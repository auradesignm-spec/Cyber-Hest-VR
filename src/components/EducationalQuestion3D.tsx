/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Interactive } from '@react-three/xr';
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
      // 1. Strict pitch black background (#000000)
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, 1536, 384);

      // 2. High-Emissive Glowing Cyan Border with Corner Brackets
      ctx.save();
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 8;
      ctx.strokeRect(16, 16, 1504, 352);

      // Inner crisp white highlight
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(20, 20, 1496, 344);

      // Heavy corner bracket accents
      ctx.fillStyle = '#00f0ff';
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

      ctx.fillStyle = '#ffffff';
      ctx.font = `900 24px ${fontFamily}`;
      ctx.textAlign = isArabic ? 'right' : 'left';
      ctx.textBaseline = 'middle';
      const headerX = isArabic ? 1480 : 54;
      ctx.fillText(`[ ${diffLabel} ] — ${categoryLabel}`, headerX, 58);

      // Question Counter Badge (Right / Left)
      ctx.fillStyle = '#ffffff';
      ctx.font = `900 24px ${fontFamily}`;
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
      ctx.fillStyle = '#ffffff';
      ctx.font = `900 22px ${fontFamily}`;
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
      // 1. Strict pitch black #000000 background
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, 512, 256);

      // 2. Glowing Borders & Highlight
      const borderColor = '#00f0ff';

      ctx.save();
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = isLocked ? 8 : 5;
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
      ctx.fillStyle = '#ffffff';
      ctx.font = `900 22px ${fontFamily}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const optionHeader = isArabic ? `[ الخيار ${letter} ]` : `[ OPTION ${letter} ]`;
      ctx.fillText(isLocked ? `► ${optionHeader} ◄` : optionHeader, 256, 42);

      // 4. Primary Decision Token (Centered, Big & Crisp)
      const labelText = isArabic ? option.labelAr : option.labelEn;
      ctx.fillStyle = '#ffffff';
      ctx.font = `900 34px ${fontFamily}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Truncate / wrap if needed
      const maxTextWidth = 440;
      let fontSize = 34;
      ctx.font = `900 ${fontSize}px ${fontFamily}`;
      while (ctx.measureText(labelText).width > maxTextWidth && fontSize > 18) {
        fontSize -= 2;
        ctx.font = `900 ${fontSize}px ${fontFamily}`;
      }
      ctx.fillText(labelText, 256, 120);

      // 5. Status / Target Hint at Bottom
      ctx.font = `900 20px ${fontFamily}`;
      ctx.fillStyle = '#ffffff';
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
 * Individual 3D Solution Target Card with Smooth Hover Scaling and Direct Interaction
 */
const SolutionTargetCard: React.FC<{
  option: QuestionOption;
  index: number;
  position: [number, number, number];
  isLocked: boolean;
  isCorrect: boolean | null;
  isArabic: boolean;
  onSelect: () => void;
}> = ({ option, index, position, isLocked, isCorrect, isArabic, onSelect }) => {
  const cardRef = useRef<THREE.Group>(null);
  const badgeTexture = useOptionBadgeTexture(option, index, isLocked, isCorrect, isArabic);

  // Smooth hover scale: 1.05 when locked/hovered, 1.0 when idle
  useFrame((_, delta) => {
    if (cardRef.current) {
      const targetScale = isLocked ? 1.05 : 1.0;
      cardRef.current.scale.x = THREE.MathUtils.damp(cardRef.current.scale.x, targetScale, 14, delta);
      cardRef.current.scale.y = THREE.MathUtils.damp(cardRef.current.scale.y, targetScale, 14, delta);
      cardRef.current.scale.z = THREE.MathUtils.damp(cardRef.current.scale.z, targetScale, 14, delta);
    }
  });

  return (
    <Interactive
      onSelect={onSelect}
    >
      <group ref={cardRef} position={position}>
        {/* Solid #000000 Opaque Backing Plate (renderOrder 0) */}
        <mesh renderOrder={0}>
          <boxGeometry args={[1.35, 0.72, 0.08]} />
          <meshBasicMaterial color="#000000" />
        </mesh>

        {/* Front Canvas Textured Surface (renderOrder 1, depthWrite false) */}
        <mesh
          position={[0, 0, 0.045]}
          renderOrder={1}
          onClick={onSelect}
          onPointerDown={onSelect}
        >
          <planeGeometry args={[1.30, 0.67]} />
          <meshBasicMaterial map={badgeTexture} toneMapped={false} depthWrite={false} />
        </mesh>

        {/* Wireframe Outline on Hover/Lock (renderOrder 2) */}
        {isLocked && (
          <mesh position={[0, 0, 0.05]} renderOrder={2}>
            <planeGeometry args={[1.34, 0.71]} />
            <meshBasicMaterial color="#00f0ff" wireframe toneMapped={false} depthWrite={false} />
          </mesh>
        )}

        {/* Top Cyber Emitter Node */}
        <mesh position={[0, 0.39, 0]}>
          <cylinderGeometry args={[0.08, 0.12, 0.08, 12]} />
          <meshBasicMaterial color="#00f0ff" />
        </mesh>

        {/* Bottom Mounting Stanchion */}
        <mesh position={[0, -0.42, 0]}>
          <cylinderGeometry args={[0.04, 0.06, 0.14, 10]} />
          <meshBasicMaterial color="#000000" />
        </mesh>
      </group>
    </Interactive>
  );
};

/**
 * EducationalQuestion3D:
 * Perfectly positioned in player's natural center FOV:
 * - Question Board: Y: 2.8m, Z: -4.0m
 * - Solution Badges: Y: 1.0m, Z: -4.0m
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

  // Distribute 3 solution option cards along X: [-2.35, 0, 2.35] at Y: 1.0, Z: -4.0
  const optionPositions: [number, number, number][] = useMemo(() => {
    const count = question.options.length;
    if (count === 3) {
      return [
        [-2.35, 1.0, -4.0],
        [0.0, 1.0, -4.0],
        [2.35, 1.0, -4.0],
      ];
    }
    return [
      [-2.7, 1.0, -4.0],
      [-0.9, 1.0, -4.0],
      [0.9, 1.0, -4.0],
      [2.7, 1.0, -4.0],
    ];
  }, [question.options.length]);

  return (
    <group name="EducationalQuestionRig">
      {/* 1. QUESTION BOARD LOWERED TO NATURAL CENTER FOV (Y: 2.8m, Z: -4.0m) */}
      <group position={[0, 2.8, -4.0]}>
        {/* Solid #000000 Backplate */}
        <mesh renderOrder={0}>
          <boxGeometry args={[4.8, 1.25, 0.1]} />
          <meshBasicMaterial color="#000000" />
        </mesh>
        {/* Front Canvas Plane */}
        <mesh position={[0, 0, 0.055]} renderOrder={1}>
          <planeGeometry args={[4.74, 1.18]} />
          <meshBasicMaterial map={boardTexture} toneMapped={false} depthWrite={false} />
        </mesh>
        {/* Top Antenna Mounts */}
        {[-2.0, 0.0, 2.0].map((x, idx) => (
          <mesh key={idx} position={[x, 0.68, 0]}>
            <cylinderGeometry args={[0.02, 0.04, 0.16, 8]} />
            <meshBasicMaterial color="#00f0ff" />
          </mesh>
        ))}
      </group>

      {/* 2. SOLUTION TARGET BADGES (Y: 1.0m, Z: -4.0m) */}
      <group name="SolutionOptionsRow">
        {question.options.map((opt, idx) => {
          const pos = optionPositions[idx] || [0, 1.0, -4.0];
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
              onSelect={() => onSelectOption(opt.id)}
            />
          );
        })}
      </group>
    </group>
  );
};
