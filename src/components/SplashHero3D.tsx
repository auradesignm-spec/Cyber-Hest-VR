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
 * 3D Main Splash Screen
 * - Cyberpunk Glowing Typography with Glitch Offsets
 * - Large Glowing 3D "INITIALIZE DEFENSE" CTA Button
 * - Secondary "Incident Rulebook" 3D Button
 * - Floating Language Selector [ العربية | English ] with RTL Cairo support
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

  // 1. Procedural Cyberpunk Glitch Typography Canvas Texture
  const titleTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1536;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Solid dark navy backing
      ctx.fillStyle = '#020813';
      ctx.fillRect(0, 0, 1536, 512);

      // Tech grid lines
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.08)';
      ctx.lineWidth = 1;
      for (let x = 32; x < 1536; x += 32) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 512);
        ctx.stroke();
      }

      // Outer glowing frame
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 6;
      ctx.strokeRect(16, 16, 1504, 480);

      // Corner brackets
      ctx.fillStyle = '#00f0ff';
      const bw = 32;
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

      // Sub-kicker
      ctx.font = `bold 24px ${fontFamily}`;
      ctx.fillStyle = '#10b981';
      ctx.textAlign = 'center';
      const kickerText = isArabic
        ? 'نظام الدفاع السيبراني التفاعلي // الإصدار 3.0 WebXR'
        : 'ASYMMETRIC CYBER DEFENSE ENVIRONMENT // WEBXR ACTIVE';
      ctx.fillText(kickerText, 768, 80);

      // Primary Cyberpunk Glowing Title (Chromatic Glitch Double Pass)
      const titleText = isArabic ? 'السرقة السيبرانية: حامي العقد' : 'CYBER HEIST: NODE DEFENDER';
      ctx.font = `900 ${isArabic ? '64px' : '72px'} ${fontFamily}`;

      // Red/Pink Glitch Shadow Pass
      ctx.fillStyle = '#ec4899';
      ctx.fillText(titleText, 765, 185);

      // Cyan Glitch Pass
      ctx.fillStyle = '#00f0ff';
      ctx.fillText(titleText, 771, 183);

      // Primary White Core
      ctx.fillStyle = '#ffffff';
      ctx.fillText(titleText, 768, 184);

      // Sub-description
      ctx.font = `normal 26px ${fontFamily}`;
      ctx.fillStyle = '#94a3b8';
      const descText = isArabic
        ? 'محاكاة تدريبية ثلاثية الأبعاد لفرق الاستجابة للحوادث الأمنية والواقع الافتراضي'
        : 'Collaborative Incident Response & Port Security Simulation for Meta Quest 3 & Desktop';
      ctx.fillText(descText, 768, 255);

      // Security Badges Line
      ctx.font = `bold 20px ${fontFamily}`;
      ctx.fillStyle = '#f59e0b';
      const badgeText = isArabic
        ? '✦ وضع اللعب بالليزر  ·  ✦ دعم نظارات الواقع الافتراضي  ·  ✦ تحكم كامل باللغة العربية'
        : '✦ WEAPONIZED LASER PROTOCOLS  ·  ✦ META QUEST 3 OPTIMIZED  ·  ✦ 3-TIER DIFFICULTY';
      ctx.fillText(badgeText, 768, 320);

      // Status Bar
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(40, 370, 1456, 90);
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)';
      ctx.lineWidth = 2;
      ctx.strokeRect(40, 370, 1456, 90);

      ctx.font = `bold 22px ${fontFamily}`;
      ctx.fillStyle = '#38bdf8';
      const specText = isArabic
        ? 'حالة النظام: الاتصال نشط  ·  بوابة الزمن الافتراضية: جاهزة للقفز'
        : 'SYSTEM STATUS: OPERATIONAL  ·  TIME TUNNEL WARP GATE: ONLINE';
      ctx.fillText(specText, 768, 424);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, [isArabic]);

  // 2. Procedural Primary CTA "INITIALIZE DEFENSE" Texture
  const ctaTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 160;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#021827';
      ctx.fillRect(0, 0, 640, 160);

      // Neon Frame
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 6;
      ctx.strokeRect(8, 8, 624, 144);

      // Fill glow
      ctx.fillStyle = 'rgba(0, 240, 255, 0.12)';
      ctx.fillRect(12, 12, 616, 136);

      // Corner Accents
      ctx.fillStyle = '#00f0ff';
      ctx.fillRect(8, 8, 24, 6);
      ctx.fillRect(8, 8, 6, 24);
      ctx.fillRect(608, 8, 24, 6);
      ctx.fillRect(626, 8, 6, 24);
      ctx.fillRect(8, 146, 24, 6);
      ctx.fillRect(8, 130, 6, 24);
      ctx.fillRect(608, 146, 24, 6);
      ctx.fillRect(626, 130, 6, 24);

      const fontFamily = isArabic ? '"Cairo", sans-serif' : '"JetBrains Mono", monospace';
      ctx.font = `900 ${isArabic ? '36px' : '32px'} ${fontFamily}`;
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      const ctaLabel = isArabic ? '⚡ بدء الدفاع والقفز بالزمن' : '⚡ INITIALIZE DEFENSE';
      ctx.fillText(ctaLabel, 320, 78);

      ctx.font = `bold 18px ${fontFamily}`;
      ctx.fillStyle = '#38bdf8';
      const subLabel = isArabic ? 'انقر أو صوّب الليزر للدخول' : 'CLICK OR SHOOT TO WARP';
      ctx.fillText(subLabel, 320, 118);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, [isArabic]);

  // 3. Procedural Secondary "Incident Rulebook" Texture
  const manualTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 480;
    canvas.height = 140;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#061325';
      ctx.fillRect(0, 0, 480, 140);

      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 4;
      ctx.strokeRect(6, 6, 468, 128);

      const fontFamily = isArabic ? '"Cairo", sans-serif' : '"JetBrains Mono", monospace';
      ctx.font = `bold ${isArabic ? '28px' : '24px'} ${fontFamily}`;
      ctx.fillStyle = '#fde68a';
      ctx.textAlign = 'center';
      const label = isArabic ? '📖 دليل الحوادث السيبرانية' : '📖 INCIDENT RULEBOOK';
      ctx.fillText(label, 240, 68);

      ctx.font = `normal 16px ${fontFamily}`;
      ctx.fillStyle = '#94a3b8';
      const sub = isArabic ? 'دليل فريق الطاولة الورقي' : 'PHYSICAL TABLE MANUAL';
      ctx.fillText(sub, 240, 102);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, [isArabic]);

  // 4. Procedural Language Switcher [ العربية | English ] Texture
  const langTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 440;
    canvas.height = 120;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#051224';
      ctx.fillRect(0, 0, 440, 120);

      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 4;
      ctx.strokeRect(6, 6, 428, 108);

      const fontFamily = '"Cairo", "JetBrains Mono", sans-serif';
      ctx.font = `bold 24px ${fontFamily}`;
      ctx.textAlign = 'center';

      // Active language highlight
      if (isArabic) {
        ctx.fillStyle = '#10b981';
        ctx.fillText('● العربية (AR)', 140, 68);
        ctx.fillStyle = '#64748b';
        ctx.fillText('English (EN)', 300, 68);
      } else {
        ctx.fillStyle = '#64748b';
        ctx.fillText('العربية (AR)', 140, 68);
        ctx.fillStyle = '#10b981';
        ctx.fillText('● English (EN)', 300, 68);
      }
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, [isArabic]);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();

    // Floating breathing motion
    if (titleMeshRef.current) {
      titleMeshRef.current.position.y = 2.85 + Math.sin(time * 1.5) * 0.03;
    }

    // CTA Pulse scaling
    if (ctaMeshRef.current) {
      const isTargeted = lockedTargetId === 'cta_initialize' || hoveredButton === 'initialize';
      const targetScale = isTargeted ? 1.15 : 1.0 + Math.sin(time * 3.5) * 0.02;
      ctaMeshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, 1), 0.15);
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* 1. Main Title Card (Y: +2.85m, Z: -4.5m) */}
      <mesh
        ref={titleMeshRef}
        position={[0, 2.85, -4.5]}
      >
        <planeGeometry args={[4.2, 1.4]} />
        <meshStandardMaterial
          map={titleTexture}
          roughness={0.2}
          metalness={0.7}
          emissive="#00f0ff"
          emissiveIntensity={0.25}
        />
      </mesh>

      {/* 2. Primary Button: "INITIALIZE DEFENSE" (Y: +1.4m, Z: -3.8m) */}
      <mesh
        ref={ctaMeshRef}
        position={[0, 1.4, -3.8]}
        onClick={onInitializeDefense}
        onPointerOver={() => setHoveredButton('initialize')}
        onPointerOut={() => setHoveredButton(null)}
      >
        <planeGeometry args={[2.5, 0.65]} />
        <meshStandardMaterial
          map={ctaTexture}
          roughness={0.1}
          metalness={0.8}
          emissive="#00f0ff"
          emissiveIntensity={hoveredButton === 'initialize' || lockedTargetId === 'cta_initialize' ? 0.9 : 0.4}
        />
      </mesh>

      {/* 3. Secondary Button: "Incident Rulebook" (Y: +0.85m, X: -1.3m, Z: -3.8m) */}
      <mesh
        position={[-1.25, 0.85, -3.8]}
        onClick={onOpenManual}
        onPointerOver={() => setHoveredButton('manual')}
        onPointerOut={() => setHoveredButton(null)}
        scale={hoveredButton === 'manual' || lockedTargetId === 'cta_manual' ? 1.12 : 1.0}
      >
        <planeGeometry args={[1.8, 0.52]} />
        <meshStandardMaterial
          map={manualTexture}
          roughness={0.2}
          metalness={0.7}
          emissive="#f59e0b"
          emissiveIntensity={hoveredButton === 'manual' || lockedTargetId === 'cta_manual' ? 0.8 : 0.3}
        />
      </mesh>

      {/* 4. Language Selector Toggle (Y: +0.85m, X: +1.3m, Z: -3.8m) */}
      <mesh
        position={[1.25, 0.85, -3.8]}
        onClick={onToggleLanguage}
        onPointerOver={() => setHoveredButton('lang')}
        onPointerOut={() => setHoveredButton(null)}
        scale={hoveredButton === 'lang' || lockedTargetId === 'cta_lang' ? 1.12 : 1.0}
      >
        <planeGeometry args={[1.7, 0.52]} />
        <meshStandardMaterial
          map={langTexture}
          roughness={0.2}
          metalness={0.7}
          emissive="#10b981"
          emissiveIntensity={hoveredButton === 'lang' || lockedTargetId === 'cta_lang' ? 0.8 : 0.3}
        />
      </mesh>

      {/* Floating Accent Pedestal Lights */}
      <pointLight position={[0, 1.4, -3.5]} intensity={1.8} color="#00f0ff" distance={5} />
      <pointLight position={[-1.25, 0.85, -3.5]} intensity={1.2} color="#f59e0b" distance={4} />
      <pointLight position={[1.25, 0.85, -3.5]} intensity={1.2} color="#10b981" distance={4} />
    </group>
  );
};
