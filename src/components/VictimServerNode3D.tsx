/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CombatPhase, ScenarioId, Language } from '../types/game';

interface VictimServerNode3DProps {
  combatPhase: CombatPhase;
  scenarioId: ScenarioId;
  language: Language;
  hearts: number; // 0 - 5
  maxHearts?: number;
  isEmergency?: boolean;
  position?: [number, number, number];
  scale?: number | [number, number, number];
}

/**
 * Procedural Canvas Texture for the Victim Device Status Display (High Contrast OLED)
 */
function useDeviceStatusTexture(
  scenarioId: ScenarioId,
  combatPhase: CombatPhase,
  hearts: number,
  isArabic: boolean
) {
  return useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Solid dark pitch black background (#000000)
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, 1024, 512);

      const frameColor = '#00f0ff';

      // Outer Glowing Frame
      ctx.strokeStyle = frameColor;
      ctx.lineWidth = 8;
      ctx.strokeRect(16, 16, 992, 480);

      // Corner brackets
      ctx.fillStyle = frameColor;
      const bw = 36;
      ctx.fillRect(16, 16, bw, 8);
      ctx.fillRect(16, 16, 8, bw);
      ctx.fillRect(1008 - bw, 16, bw, 8);
      ctx.fillRect(1000, 16, 8, bw);
      ctx.fillRect(16, 488, bw, 8);
      ctx.fillRect(16, 496 - bw, 8, bw);
      ctx.fillRect(1008 - bw, 488, bw, 8);
      ctx.fillRect(1000, 496 - bw, 8, bw);

      const fontFamily = isArabic ? '"Cairo", sans-serif' : '"JetBrains Mono", monospace';

      // Device Type Header Badge
      const isRouter = scenarioId === 'scenario-1' || scenarioId === 'scenario-3';
      const deviceTitle = isRouter
        ? isArabic
          ? '◄ جهاز موجه الشبكة الرئيسي (ENTERPRISE ROUTER) ►'
          : '◄ CORE NETWORK ROUTER [CISCO-SOC-9000] ►'
        : isArabic
        ? '◄ محطة العمل المستهدفة (WORKSTATION PC TOWER) ►'
        : '◄ TARGET WORKSTATION PC [DEFENDER-NODE-01] ►';

      ctx.fillStyle = '#000000';
      ctx.fillRect(48, 36, 928, 56);
      ctx.strokeStyle = frameColor;
      ctx.lineWidth = 2;
      ctx.strokeRect(48, 36, 928, 56);

      ctx.fillStyle = '#ffffff';
      ctx.font = `900 28px ${fontFamily}`;
      ctx.textAlign = 'center';
      ctx.fillText(deviceTitle, 512, 75);

      // Primary Status Alert
      ctx.font = `900 38px ${fontFamily}`;
      ctx.fillStyle = '#ffffff';
      const isUnderAttack = combatPhase === 'defense';
      if (isUnderAttack) {
        const alertMsg = isArabic
          ? '⚠ إنذار! هجوم حزم خبيثة نشط — أطلق لحماية الجهاز! ⚠'
          : '⚠ DEFEND ASSET: INCOMING MALWARE PACKET SWARM! ⚠';
        ctx.fillText(alertMsg, 512, 160);
      } else {
        const secureMsg = isArabic
          ? '🛡 درع الجهاز نشط — أجب على التساؤل لفك التشفير'
          : '🛡 NODE INTEGRITY STABLE — SOLVE DECRYPTION TO PROCEED';
        ctx.fillText(secureMsg, 512, 160);
      }

      // Live Network Stats Row
      ctx.fillStyle = '#ffffff';
      ctx.font = `900 26px ${fontFamily}`;
      const ipText = isRouter ? 'IP: 192.168.1.1  ·  PORT: 443 / 80  ·  VLAN: 10' : 'IP: 10.0.4.52  ·  CPU LOAD: 74%  ·  SEC-GATE: ON';
      ctx.fillText(ipText, 512, 240);

      // Force Shield Bar
      const pct = Math.max(0, Math.min(1, hearts / 5));
      ctx.fillStyle = '#000000';
      ctx.fillRect(96, 310, 832, 54);
      ctx.strokeStyle = frameColor;
      ctx.lineWidth = 3;
      ctx.strokeRect(96, 310, 832, 54);

      // Health bar fill
      ctx.fillStyle = '#00f0ff';
      ctx.fillRect(100, 314, (832 - 8) * pct, 46);

      // Text Over Shield Bar
      ctx.fillStyle = '#ffffff';
      ctx.font = `900 28px ${fontFamily}`;
      const shieldLabel = isArabic
        ? `طاقة درع الحماية: ${Math.round(pct * 100)}% (${hearts} / 5 قلوب)`
        : `SHIELD INTEGRITY: ${Math.round(pct * 100)}% (${hearts} / 5 HEARTS)`;
      ctx.fillText(shieldLabel, 512, 420);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
  }, [scenarioId, combatPhase, hearts, isArabic]);
}

/**
 * High-Contrast 3D Floating Tactical Banner positioned directly above the victim device
 */
function useTacticalBannerTexture(
  scenarioId: ScenarioId,
  combatPhase: CombatPhase,
  hearts: number,
  isArabic: boolean
) {
  return useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Solid dark pitch black background
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, 1024, 256);

      const frameColor = '#00f0ff';

      // Sharp glowing border
      ctx.strokeStyle = frameColor;
      ctx.lineWidth = 6;
      ctx.strokeRect(10, 10, 1004, 236);

      const fontFamily = isArabic ? '"Cairo", sans-serif' : '"JetBrains Mono", monospace';

      // Top Tag
      ctx.font = `900 24px ${fontFamily}`;
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      const topTag = isArabic
        ? '◄ الهدف الاستراتيجي المطلوب حمايته // عقدة السيرفر ►'
        : '◄ PRIMARY DEFENSE TARGET // PROTECTED CORE NODE ►';
      ctx.fillText(topTag, 512, 54);

      // Big Title
      ctx.font = `900 38px ${fontFamily}`;
      ctx.fillStyle = '#ffffff';
      const isRouter = scenarioId === 'scenario-1' || scenarioId === 'scenario-3';
      const isUnderAttack = combatPhase === 'defense';
      const titleStr = isRouter
        ? isArabic
          ? (isUnderAttack ? '⚠ راوتر الشبكة يتعرض لهجوم! دافع عنه!' : 'راوتر التوجيه المركزي — متصل وآمن')
          : (isUnderAttack ? '⚠ CORE ROUTER UNDER ATTACK! DEFEND NOW!' : 'ENTERPRISE ROUTER — STATUS: NOMINAL')
        : isArabic
        ? (isUnderAttack ? '⚠ حاسوب محطة العمل يتعرض لهجوم! دافع عنه!' : 'حاسوب محطة العمل — متصل وآمن')
        : (isUnderAttack ? '⚠ WORKSTATION PC UNDER ATTACK! DEFEND NOW!' : 'WORKSTATION PC — STATUS: NOMINAL');
      ctx.fillText(titleStr, 512, 126);

      // Heart Icons row
      ctx.font = '32px sans-serif';
      let heartsStr = '';
      for (let i = 0; i < 5; i++) {
        heartsStr += i < hearts ? ' ❤️ ' : ' 🖤 ';
      }
      ctx.fillText(heartsStr, 512, 195);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
  }, [scenarioId, combatPhase, hearts, isArabic]);
}

/**
 * 3D Victim Target Device (Positioned prominently at [0, 0.8, -4.5])
 * Shows either a Detailed Enterprise Router or a High-Tech PC Workstation Tower
 */
export const VictimServerNode3D: React.FC<VictimServerNode3DProps> = ({
  combatPhase,
  scenarioId,
  language,
  hearts,
  maxHearts = 5,
  isEmergency = false,
  position = [0, 0.8, -4.5],
  scale = [0.95, 0.95, 0.95],
}) => {
  const isArabic = language === 'ar';
  const groupRef = useRef<THREE.Group>(null);
  const shieldMeshRef = useRef<THREE.Mesh>(null);
  const fanRef = useRef<THREE.Group>(null);
  const antennasRef = useRef<THREE.Group>(null);
  const coreLightRef = useRef<THREE.PointLight>(null);

  const statusTexture = useDeviceStatusTexture(scenarioId, combatPhase, hearts, isArabic);
  const bannerTexture = useTacticalBannerTexture(scenarioId, combatPhase, hearts, isArabic);

  const isRouter = scenarioId === 'scenario-1' || scenarioId === 'scenario-3';

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();

    // Floating breathing motion
    if (groupRef.current) {
      const baseY = Array.isArray(position) ? position[1] : 0.8;
      groupRef.current.position.y = baseY + Math.sin(t * 1.8) * 0.04;
    }

    // Antenna tip pulse or PC fan rotation
    if (fanRef.current) {
      fanRef.current.rotation.z += delta * (combatPhase === 'defense' ? 26.0 : 12.0);
    }
    if (antennasRef.current) {
      antennasRef.current.rotation.y = Math.sin(t * 1.2) * 0.08;
    }

    // Force shield pulse
    if (shieldMeshRef.current) {
      const isUnderAttack = combatPhase === 'defense';
      const pulseSpeed = isUnderAttack ? 10.0 : 3.0;
      const mat = shieldMeshRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = (isUnderAttack ? 0.38 : 0.15) + Math.sin(t * pulseSpeed) * 0.08;

      const scalePulse = 1.0 + Math.sin(t * pulseSpeed * 0.5) * 0.03;
      shieldMeshRef.current.scale.set(scalePulse, scalePulse, scalePulse);
    }

    // Core point light pulse
    if (coreLightRef.current) {
      const baseIntensity = combatPhase === 'defense' ? 4.5 : 2.5;
      coreLightRef.current.intensity = baseIntensity + Math.sin(t * 6.0) * 0.8;
    }
  });

  return (
    <group ref={groupRef} position={position} scale={scale} name="VictimDeviceAsset">
      {/* 1. Floating Holographic Tactical Status HUD Banner directly above device */}
      <group position={[0, 1.85, 0]}>
        <mesh>
          <planeGeometry args={[3.2, 0.8]} />
          <meshBasicMaterial map={bannerTexture} side={THREE.DoubleSide} toneMapped={false} />
        </mesh>
        {/* Subtle glowing frame backing */}
        <mesh position={[0, 0, -0.01]}>
          <planeGeometry args={[3.24, 0.84]} />
          <meshBasicMaterial
            color={combatPhase === 'defense' ? '#ef4444' : '#00f0ff'}
            wireframe
            transparent
            opacity={0.6}
          />
        </mesh>
      </group>

      {/* 2. Physical Device 3D Model: Enterprise Router OR Cyber PC Workstation */}
      {isRouter ? (
        /* ================= ENTERPRISE NETWORK ROUTER MODEL ================= */
        <group position={[0, 0, 0]}>
          {/* Main Router Chassis Body (Wide, metallic rack/desktop format) */}
          <mesh castShadow receiveShadow position={[0, 0, 0]}>
            <boxGeometry args={[2.2, 0.55, 1.4]} />
            <meshStandardMaterial color="#0b1329" metalness={0.92} roughness={0.2} />
          </mesh>

          {/* Front Bezel with Ventilation Slits */}
          <mesh position={[0, 0, 0.71]}>
            <boxGeometry args={[2.14, 0.5, 0.04]} />
            <meshStandardMaterial color="#050a14" metalness={0.85} roughness={0.3} />
          </mesh>

          {/* OLED Status Screen on Front Face */}
          <mesh position={[-0.45, 0.02, 0.735]}>
            <planeGeometry args={[1.05, 0.42]} />
            <meshBasicMaterial map={statusTexture} toneMapped={false} />
          </mesh>

          {/* Ethernet Switch Ports Array (8 RJ45 ports with blinking green LEDs) */}
          <group position={[0.55, 0.05, 0.72]}>
            {[-0.36, -0.26, -0.16, -0.06, 0.06, 0.16, 0.26, 0.36].map((xOffset, portIdx) => (
              <group key={`port-${portIdx}`} position={[xOffset, 0, 0]}>
                {/* Port socket */}
                <mesh>
                  <boxGeometry args={[0.07, 0.09, 0.04]} />
                  <meshStandardMaterial color="#1e293b" metalness={0.9} />
                </mesh>
                {/* Activity LED */}
                <mesh position={[0, 0.065, 0.02]}>
                  <sphereGeometry args={[0.014, 8, 8]} />
                  <meshBasicMaterial
                    color={portIdx % 2 === 0 ? '#10b981' : '#f59e0b'}
                    toneMapped={false}
                  />
                </mesh>
              </group>
            ))}
          </group>

          {/* 4 Articulated High-Gain Cyber Antennas */}
          <group ref={antennasRef} position={[0, 0.28, -0.55]}>
            {[-0.9, -0.3, 0.3, 0.9].map((xPos, aIdx) => (
              <group key={`antenna-${aIdx}`} position={[xPos, 0, 0]} rotation={[0.1, 0, (aIdx - 1.5) * 0.1]}>
                {/* Antenna Base Swivel */}
                <mesh position={[0, 0.05, 0]}>
                  <cylinderGeometry args={[0.035, 0.045, 0.1, 12]} />
                  <meshStandardMaterial color="#334155" metalness={0.9} />
                </mesh>
                {/* Antenna Mast */}
                <mesh position={[0, 0.5, 0]}>
                  <cylinderGeometry args={[0.018, 0.028, 0.8, 12]} />
                  <meshStandardMaterial color="#0f172a" metalness={0.8} />
                </mesh>
                {/* Glowing Signal Tip */}
                <mesh position={[0, 0.92, 0]}>
                  <sphereGeometry args={[0.032, 12, 12]} />
                  <meshBasicMaterial
                    color={combatPhase === 'defense' ? '#ef4444' : '#00f0ff'}
                    toneMapped={false}
                  />
                </mesh>
              </group>
            ))}
          </group>
        </group>
      ) : (
        /* ================= CYBER PC WORKSTATION TOWER MODEL ================= */
        <group position={[0, 0.2, 0]}>
          {/* Main PC Chassis Tower (Vertical Tower) */}
          <mesh castShadow receiveShadow position={[0, 0, 0]}>
            <boxGeometry args={[1.3, 2.0, 1.4]} />
            <meshStandardMaterial color="#080e1e" metalness={0.92} roughness={0.15} />
          </mesh>

          {/* Tempered Glass Side Window */}
          <mesh position={[-0.66, 0, 0]}>
            <boxGeometry args={[0.03, 1.85, 1.25]} />
            <meshStandardMaterial
              color="#020814"
              metalness={0.3}
              roughness={0.05}
              transparent
              opacity={0.4}
            />
          </mesh>

          {/* Inside: Glowing Liquid Cooling Tubes */}
          <group position={[-0.45, 0, 0]}>
            {[-0.2, 0.1].map((yOff, cIdx) => (
              <mesh key={`coolant-${cIdx}`} position={[0, yOff, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.035, 0.035, 0.7, 12]} />
                <meshBasicMaterial color="#00f0ff" transparent opacity={0.85} toneMapped={false} />
              </mesh>
            ))}
          </group>

          {/* Front Bezel with Integrated OLED Screen */}
          <mesh position={[0, 0.35, 0.71]}>
            <planeGeometry args={[1.1, 0.65]} />
            <meshBasicMaterial map={statusTexture} toneMapped={false} />
          </mesh>

          {/* Front Dual Intake Fans with Illuminated RGB Rings */}
          <group ref={fanRef} position={[0, -0.45, 0.71]}>
            {/* Outer RGB Glow Ring */}
            <mesh position={[0, 0, 0]}>
              <ringGeometry args={[0.28, 0.32, 24]} />
              <meshBasicMaterial
                color={combatPhase === 'defense' ? '#ef4444' : '#00ffcc'}
                toneMapped={false}
              />
            </mesh>
            {/* Spinning Blades */}
            {[0, Math.PI / 3, (2 * Math.PI) / 3].map((ang, bIdx) => (
              <mesh key={`fan-b-${bIdx}`} rotation={[0, 0, ang]}>
                <boxGeometry args={[0.05, 0.52, 0.01]} />
                <meshStandardMaterial color="#0f172a" metalness={0.8} />
              </mesh>
            ))}
          </group>
        </group>
      )}

      {/* 3. Holographic Pedestal Base with Glowing Floor Rings */}
      <group position={[0, -0.7, 0]}>
        {/* Dark Obsidian Pedestal */}
        <mesh receiveShadow position={[0, 0, 0]}>
          <cylinderGeometry args={[1.5, 1.7, 0.22, 24]} />
          <meshStandardMaterial color="#040816" metalness={0.9} roughness={0.3} />
        </mesh>
        {/* Glowing Concentric Neon Perimeter Ring */}
        <mesh position={[0, 0.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.42, 1.48, 32]} />
          <meshBasicMaterial
            color={combatPhase === 'defense' ? '#ef4444' : '#00f0ff'}
            toneMapped={false}
          />
        </mesh>
        {/* Pedestal Upward Wash Light */}
        <pointLight
          position={[0, 0.3, 0]}
          color={combatPhase === 'defense' ? '#ef4444' : '#00f0ff'}
          intensity={3.0}
          distance={5}
        />
      </group>

      {/* 4. Translucent Spherical Force Shield Wrapping Device */}
      <mesh ref={shieldMeshRef} position={[0, 0, 0]}>
        <sphereGeometry args={[1.65, 32, 32]} />
        <meshBasicMaterial
          color={combatPhase === 'defense' ? '#ef4444' : '#00f0ff'}
          transparent
          opacity={combatPhase === 'defense' ? 0.35 : 0.12}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>

      {/* 5. Central Illuminator Core Light */}
      <pointLight
        ref={coreLightRef}
        position={[0, 0.2, 0.4]}
        color={combatPhase === 'defense' ? '#ef4444' : '#00f0ff'}
        intensity={3.5}
        distance={9}
      />
    </group>
  );
};
