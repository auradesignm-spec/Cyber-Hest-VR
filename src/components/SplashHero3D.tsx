/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Language } from '../types/game';

interface SplashHero3DProps {
  language: Language;
  onToggleLanguage: () => void;
  onInitializeDefense: () => void;
  onOpenManual: () => void;
  onStartTraining?: () => void;
  lockedTargetId?: string | number | null;
}

/**
 * 3D Main Splash Screen - High Contrast & Crystal Clear Readability
 * - Solid dark obsidian backing panels (#020612)
 * - Ultra-high contrast pure white typography (#ffffff) with sharp outlines
 * - Vibrant neon accent borders (Cyan, Emerald, Amber, Indigo)
 * - 100% legible text without washed-out emissive bleeding
 * - Desktop hover / click and VR Laser Raycast Target compatibility
 */
export const SplashHero3D: React.FC<SplashHero3DProps> = ({
  language,
  onToggleLanguage,
  onInitializeDefense,
  onOpenManual,
  onStartTraining,
  lockedTargetId,
}) => {
  const isArabic = language === 'ar';
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const titleMeshRef = useRef<THREE.Mesh>(null);
  const ctaMeshRef = useRef<THREE.Mesh>(null);

  // 1. Procedural Main Title Card Canvas Texture (Razor-Sharp High Contrast)
  const titleTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1536;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Solid pitch black / dark obsidian backing
      ctx.fillStyle = '#020612';
      ctx.fillRect(0, 0, 1536, 512);

      // Subtle cyber grid
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.08)';
      ctx.lineWidth = 1;
      for (let x = 32; x < 1536; x += 32) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 512);
        ctx.stroke();
      }

      // Outer vibrant neon border
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 6;
      ctx.strokeRect(16, 16, 1504, 480);

      // Neon corner brackets
      ctx.fillStyle = '#00f0ff';
      const bw = 40;
      const bh = 8;
      ctx.fillRect(16, 16, bw, bh);
      ctx.fillRect(16, 16, bh, bw);
      ctx.fillRect(1520 - bw, 16, bw, bh);
      ctx.fillRect(1520 - bh, 16, bh, bw);
      ctx.fillRect(16, 496 - bh, bw, bh);
      ctx.fillRect(16, 496 - bw, bh, bw);
      ctx.fillRect(1520 - bw, 496 - bh, bw, bh);
      ctx.fillRect(1520 - bh, 496 - bw, bh, bw);

      const fontFamily = isArabic ? '"Cairo", sans-serif' : '"JetBrains Mono", monospace';

      // Kicker Header
      ctx.font = `bold 24px ${fontFamily}`;
      ctx.fillStyle = '#10b981';
      ctx.textAlign = 'center';
      const kickerText = isArabic
        ? '◄ نظام الدفاع السيبراني التفاعلي // الإصدار 3.0 WebXR ►'
        : '◄ ASYMMETRIC CYBER DEFENSE ENVIRONMENT // WEBXR ACTIVE ►';
      ctx.fillText(kickerText, 768, 76);

      // Primary Title: Crisp Pure White with subtle shadow for extreme contrast
      const titleText = isArabic ? 'السرقة السيبرانية: حامي العقد' : 'CYBER HEIST: NODE DEFENDER';
      ctx.font = `900 ${isArabic ? '66px' : '72px'} ${fontFamily}`;

      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#ffffff';
      ctx.fillText(titleText, 768, 175);
      ctx.shadowBlur = 0; // reset shadow

      // Sub-description
      ctx.font = `bold 26px ${fontFamily}`;
      ctx.fillStyle = '#cbd5e1';
      const descText = isArabic
        ? 'محاكاة تدريبية احترافية ثلاثية الأبعاد لفرق الأمن السيبراني والواقع الافتراضي'
        : 'Professional WebXR Incident Response & Cyber Security Simulation';
      ctx.fillText(descText, 768, 252);

      // Security Badges Line (High Contrast Amber Gold)
      ctx.font = `900 22px ${fontFamily}`;
      ctx.fillStyle = '#fbbf24';
      const badgeText = isArabic
        ? '✦ وضع التصويب والليزر  ·  ✦ دعم الواقع الافتراضي Quest 3  ·  ✦ واجهة عربية كاملة'
        : '✦ WEAPONIZED LASER PROTOCOLS  ·  ✦ META QUEST 3 OPTIMIZED  ·  ✦ FULL ARABIC / ENGLISH';
      ctx.fillText(badgeText, 768, 318);

      // System Status Box
      ctx.fillStyle = '#090e1f';
      ctx.fillRect(48, 370, 1440, 88);
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2;
      ctx.strokeRect(48, 370, 1440, 88);

      ctx.font = `900 24px ${fontFamily}`;
      ctx.fillStyle = '#38bdf8';
      const specText = isArabic
        ? 'حالة النظام: الاتصال نشط  ·  بوابة الزمن الافتراضية: جاهزة للقفز الفوري'
        : 'SYSTEM STATUS: OPERATIONAL  ·  QUANTUM TIME TUNNEL: ONLINE';
      ctx.fillText(specText, 768, 424);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, [isArabic]);

  // 2. Primary CTA "INITIALIZE DEFENSE" Texture (High Contrast Cyan-Navy)
  const ctaTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 160;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Solid dark navy background
      ctx.fillStyle = '#041628';
      ctx.fillRect(0, 0, 640, 160);

      // Thick Neon Frame
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 6;
      ctx.strokeRect(8, 8, 624, 144);

      // Corner Accents
      ctx.fillStyle = '#00f0ff';
      ctx.fillRect(8, 8, 30, 8);
      ctx.fillRect(8, 8, 8, 30);
      ctx.fillRect(602, 8, 30, 8);
      ctx.fillRect(624, 8, 8, 30);
      ctx.fillRect(8, 144, 30, 8);
      ctx.fillRect(8, 122, 8, 30);
      ctx.fillRect(602, 144, 30, 8);
      ctx.fillRect(624, 122, 8, 30);

      const fontFamily = isArabic ? '"Cairo", sans-serif' : '"JetBrains Mono", monospace';
      ctx.font = `900 ${isArabic ? '36px' : '32px'} ${fontFamily}`;
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      const ctaLabel = isArabic ? '⚡ بدء الدفاع والقفز بالزمن' : '⚡ INITIALIZE DEFENSE';
      ctx.fillText(ctaLabel, 320, 75);

      ctx.font = `bold 18px ${fontFamily}`;
      ctx.fillStyle = '#38bdf8';
      const subLabel = isArabic ? 'انقر أو صوّب الليزر للدخول' : 'CLICK OR SHOOT TO WARP';
      ctx.fillText(subLabel, 320, 120);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, [isArabic]);

  // 3. Secondary "Incident Rulebook" Texture (High Contrast Amber-Navy)
  const manualTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 480;
    canvas.height = 140;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#181105';
      ctx.fillRect(0, 0, 480, 140);

      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 5;
      ctx.strokeRect(6, 6, 468, 128);

      const fontFamily = isArabic ? '"Cairo", sans-serif' : '"JetBrains Mono", monospace';
      ctx.font = `900 ${isArabic ? '28px' : '24px'} ${fontFamily}`;
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      const label = isArabic ? '📖 دليل الحوادث السيبرانية' : '📖 INCIDENT RULEBOOK';
      ctx.fillText(label, 240, 65);

      ctx.font = `bold 18px ${fontFamily}`;
      ctx.fillStyle = '#fbbf24';
      const sub = isArabic ? 'دليل فريق الطاولة الورقي' : 'PHYSICAL TABLE MANUAL';
      ctx.fillText(sub, 240, 105);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, [isArabic]);

  // 4. Language Switcher [ العربية | English ] Texture (High Contrast Emerald-Navy)
  const langTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 440;
    canvas.height = 120;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#041c17';
      ctx.fillRect(0, 0, 440, 120);

      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 5;
      ctx.strokeRect(6, 6, 428, 108);

      const fontFamily = '"Cairo", "JetBrains Mono", sans-serif';
      ctx.font = `900 24px ${fontFamily}`;
      ctx.textAlign = 'center';

      if (isArabic) {
        ctx.fillStyle = '#10b981';
        ctx.fillText('● العربية (AR)', 130, 68);
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('English (EN)', 300, 68);
      } else {
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('العربية (AR)', 130, 68);
        ctx.fillStyle = '#10b981';
        ctx.fillText('● English (EN)', 300, 68);
      }
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, [isArabic]);

  // 5. Training Simulation Button Texture (High Contrast Indigo-Navy)
  const trainingTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 140;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#090e26';
      ctx.fillRect(0, 0, 640, 140);

      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 5;
      ctx.strokeRect(6, 6, 628, 128);

      const fontFamily = isArabic ? '"Cairo", sans-serif' : '"JetBrains Mono", monospace';
      ctx.font = `900 ${isArabic ? '28px' : '24px'} ${fontFamily}`;
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      const label = isArabic ? '🎓 محاكاة التدريب ومعايرة الليزر' : '🎓 TRAINING SIMULATION & CALIBRATION';
      ctx.fillText(label, 320, 65);

      ctx.font = `bold 18px ${fontFamily}`;
      ctx.fillStyle = '#a5b4fc';
      const sub = isArabic ? 'أطلق للبدء الفوري بالتدريب' : 'SHOOT TO START CALIBRATION';
      ctx.fillText(sub, 320, 105);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, [isArabic]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    // Floating breathing motion
    if (titleMeshRef.current) {
      titleMeshRef.current.position.y = 2.85 + Math.sin(time * 1.5) * 0.03;
    }

    // CTA Pulse scaling
    if (ctaMeshRef.current) {
      const isTargeted = lockedTargetId === 'init_defense' || hoveredButton === 'initialize';
      const targetScale = isTargeted ? 1.15 : 1.0 + Math.sin(time * 3.5) * 0.02;
      ctaMeshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, 1), 0.15);
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* 1. Main Title Card (Y: +2.85m, Z: -4.5m) */}
      <mesh ref={titleMeshRef} position={[0, 2.85, -4.5]}>
        <planeGeometry args={[4.2, 1.4]} />
        <meshBasicMaterial map={titleTexture} toneMapped={false} />
      </mesh>

      {/* 2. Primary Button: "INITIALIZE DEFENSE" (Y: +1.4m, Z: -3.8m) */}
      <group position={[0, 1.4, -3.8]}>
        <mesh
          ref={ctaMeshRef}
          onClick={onInitializeDefense}
          onPointerOver={() => setHoveredButton('initialize')}
          onPointerOut={() => setHoveredButton(null)}
        >
          <planeGeometry args={[2.5, 0.65]} />
          <meshBasicMaterial map={ctaTexture} toneMapped={false} />
        </mesh>
        {(hoveredButton === 'initialize' || lockedTargetId === 'init_defense') && (
          <mesh position={[0, 0, 0.01]}>
            <planeGeometry args={[2.56, 0.71]} />
            <meshBasicMaterial color="#00f0ff" wireframe toneMapped={false} />
          </mesh>
        )}
      </group>

      {/* 3. Secondary Button: "Incident Rulebook" (Y: +0.85m, X: -1.25m, Z: -3.8m) */}
      <group
        position={[-1.25, 0.85, -3.8]}
        scale={hoveredButton === 'manual' || lockedTargetId === 'manual' ? [1.12, 1.12, 1] : [1, 1, 1]}
      >
        <mesh
          onClick={onOpenManual}
          onPointerOver={() => setHoveredButton('manual')}
          onPointerOut={() => setHoveredButton(null)}
        >
          <planeGeometry args={[1.8, 0.52]} />
          <meshBasicMaterial map={manualTexture} toneMapped={false} />
        </mesh>
        {(hoveredButton === 'manual' || lockedTargetId === 'manual') && (
          <mesh position={[0, 0, 0.01]}>
            <planeGeometry args={[1.86, 0.58]} />
            <meshBasicMaterial color="#f59e0b" wireframe toneMapped={false} />
          </mesh>
        )}
      </group>

      {/* 4. Language Selector Toggle (Y: +0.85m, X: +1.25m, Z: -3.8m) */}
      <group
        position={[1.25, 0.85, -3.8]}
        scale={hoveredButton === 'lang' || lockedTargetId === 'lang_toggle' ? [1.12, 1.12, 1] : [1, 1, 1]}
      >
        <mesh
          onClick={onToggleLanguage}
          onPointerOver={() => setHoveredButton('lang')}
          onPointerOut={() => setHoveredButton(null)}
        >
          <planeGeometry args={[1.7, 0.52]} />
          <meshBasicMaterial map={langTexture} toneMapped={false} />
        </mesh>
        {(hoveredButton === 'lang' || lockedTargetId === 'lang_toggle') && (
          <mesh position={[0, 0, 0.01]}>
            <planeGeometry args={[1.76, 0.58]} />
            <meshBasicMaterial color="#10b981" wireframe toneMapped={false} />
          </mesh>
        )}
      </group>

      {/* 5. Training Simulation Button (Y: +0.25m, Z: -3.8m) */}
      <group
        position={[0, 0.25, -3.8]}
        scale={hoveredButton === 'training' || lockedTargetId === 'training' ? [1.12, 1.12, 1] : [1, 1, 1]}
      >
        <mesh
          onClick={onStartTraining}
          onPointerOver={() => setHoveredButton('training')}
          onPointerOut={() => setHoveredButton(null)}
        >
          <planeGeometry args={[2.5, 0.52]} />
          <meshBasicMaterial map={trainingTexture} toneMapped={false} />
        </mesh>
        {(hoveredButton === 'training' || lockedTargetId === 'training') && (
          <mesh position={[0, 0, 0.01]}>
            <planeGeometry args={[2.56, 0.58]} />
            <meshBasicMaterial color="#6366f1" wireframe toneMapped={false} />
          </mesh>
        )}
      </group>

      {/* Subtle Atmospheric Accent Lights (Controlled intensities) */}
      <pointLight position={[0, 1.4, -3.5]} intensity={1.2} color="#00f0ff" distance={4} />
      <pointLight position={[-1.25, 0.85, -3.5]} intensity={0.9} color="#f59e0b" distance={3.5} />
      <pointLight position={[1.25, 0.85, -3.5]} intensity={0.9} color="#10b981" distance={3.5} />
      <pointLight position={[0, 0.25, -3.5]} intensity={0.9} color="#6366f1" distance={3.5} />
    </group>
  );
};
