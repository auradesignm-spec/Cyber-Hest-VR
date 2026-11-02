/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Scenario2Data, Language } from '../types/game';
import { spatialAudio } from '../audio/SpatialAudio';
import { createTextTexture } from '../utils/textTexture';

interface Scenario2PayloadProps {
  data: Scenario2Data;
  active: boolean;
  onShieldApplied: (shieldId: string) => void;
  language?: Language;
  lockedTargetId?: string | number | null;
}

export const Scenario2Payload: React.FC<Scenario2PayloadProps> = ({
  data,
  active,
  onShieldApplied,
  language = 'en',
  lockedTargetId = null,
}) => {
  const colorBeaconRef = useRef<THREE.Mesh>(null);
  const corruptedBoxRef = useRef<THREE.Group>(null);
  const pipePulsesRef = useRef<THREE.Group>(null);
  const routerFanRef = useRef<THREE.Group>(null);
  const cleansingWaveRef = useRef<THREE.Mesh>(null);
  const colorIndexRef = useRef(0);
  const timerRef = useRef(0);

  const isArabic = language === 'ar';

  // Status Banner Texture
  const statusTexture = useMemo(() => {
    return createTextTexture(
      data.cleansed
        ? isArabic ? 'تم تأمين العقدة وتنقيتها' : 'ROUTER SECURED // PURGED'
        : isArabic ? 'حمولة خبيثة عالقة' : 'CORRUPTED PAYLOAD DETECTED',
      {
        textColor: data.cleansed ? '#10b981' : '#ef4444',
        bgColor: '#020617',
        fontSize: 44,
        border: data.cleansed ? '#059669' : '#dc2626',
        subText: data.cleansed
          ? isArabic ? 'تم تفجير شفرة التطهير وإبادة التروجان' : 'CLEANSING WAVE ACTIVE // THREAT DETONATED'
          : isArabic ? 'استشر فريق الطاولة واقصف كرة التشفير المطابقة' : 'CHECK COLOR CODE // SHOOT MATCHING PROTOCOL ORB',
        isArabic,
        width: 768,
        height: 256,
        statusBadge: data.cleansed
          ? isArabic ? 'مؤمن' : 'CLEANSED'
          : isArabic ? 'تحذير' : 'DEFCON 2',
        statusColor: data.cleansed ? '#10b981' : '#ef4444',
      }
    );
  }, [data.cleansed, isArabic]);

  // Shield Badges Textures with 2x Scaled Decision Tokens and Solid #030A14 Cards
  const shieldTextures = useMemo(() => {
    const map = new Map<string, THREE.CanvasTexture>();

    const arabicTokens: Record<string, { token: string; sec: string }> = {
      'AES-256': { token: 'درع AES-256', sec: 'تشفير كتلي متقدم' },
      'RSA-4096': { token: 'مفتاح RSA-4096', sec: 'مفتاح تشفير غير متماثل' },
      'TLS-1.3': { token: 'نفق TLS 1.3', sec: 'بروتوكول نفق آمن' },
      'SHA-256': { token: 'تجزئة SHA-256', sec: 'فحص سلامة البيانات' },
    };

    const englishTokens: Record<string, { token: string; sec: string }> = {
      'AES-256': { token: 'AES-256', sec: 'SYMMETRIC CIPHER SHIELD' },
      'RSA-4096': { token: 'RSA-4096', sec: 'ASYMMETRIC PUBLIC KEY' },
      'TLS-1.3': { token: 'TLS 1.3', sec: 'ENCRYPTED TRANSPORT TUNNEL' },
      'SHA-256': { token: 'SHA-256', sec: 'INTEGRITY CHECKSUM HASH' },
    };

    data.availableShields.forEach((shield) => {
      const info = isArabic ? arabicTokens[shield.id] : englishTokens[shield.id];
      const token = info?.token || shield.name;
      const sec = info?.sec || 'CRYPTOGRAPHIC COUNTERMEASURE';
      const sub = isArabic ? 'انقر بالليزر للتطبيق' : 'SHOOT ORB TO ACTIVATE';

      const tex = createTextTexture('', {
        decisionToken: token,
        secondaryLabel: sec,
        textColor: shield.color,
        bgColor: '#030A14',
        fontSize: 66,
        border: shield.color,
        subText: sub,
        isArabic,
        width: 768,
        height: 256,
        statusBadge: isArabic ? 'بروتوكول' : 'PROTOCOL',
        statusColor: shield.color,
      });
      map.set(shield.id, tex);
    });
    return map;
  }, [data.availableShields, isArabic]);

  // Map color names to hex codes
  const COLOR_HEX: Record<string, string> = {
    red: '#ef4444',
    blue: '#3b82f6',
    green: '#10b981',
    cyan: '#06b6d4',
    yellow: '#eab308',
    purple: '#a855f7',
  };

  // Frame loop: cycle 3 colors on router beacon, rotate fans, animate flowing pipe pulses
  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    timerRef.current += delta;
    if (timerRef.current > 0.85) {
      timerRef.current = 0;
      colorIndexRef.current = (colorIndexRef.current + 1) % 4;
    }

    if (colorBeaconRef.current) {
      const idx = colorIndexRef.current;
      const colorName = idx < 3 ? data.colorSequence[idx] : null;
      const hex = colorName ? COLOR_HEX[colorName] || '#ffffff' : '#1e293b';
      (colorBeaconRef.current.material as THREE.MeshBasicMaterial).color.set(hex);
    }

    // Router cooling fan rotation
    if (routerFanRef.current) {
      routerFanRef.current.rotation.y += delta * 15.0;
    }

    // Glitching jitter for corrupted payload
    if (corruptedBoxRef.current && !data.cleansed) {
      corruptedBoxRef.current.rotation.x = Math.sin(t * 18.0) * 0.08;
      corruptedBoxRef.current.rotation.y = Math.cos(t * 14.0) * 0.08;
      corruptedBoxRef.current.position.y = -0.05 + Math.sin(t * 22.0) * 0.015;
    }

    // Cleansing wave expansion on cleanse
    if (cleansingWaveRef.current && data.cleansed) {
      cleansingWaveRef.current.scale.addScalar(delta * 8.0);
      const mat = cleansingWaveRef.current.material as THREE.MeshBasicMaterial;
      if (mat.opacity > 0) {
        mat.opacity = Math.max(0, mat.opacity - delta * 0.6);
      }
    }

    // Flowing data pipe pulses
    if (pipePulsesRef.current) {
      pipePulsesRef.current.children.forEach((pulse, pIdx) => {
        pulse.position.z = ((t * 3.0 + pIdx * 1.5) % 6) - 3;
      });
    }
  });

  // Balanced wide positions for the 4 pedestals with staggered depths
  const shieldPositions: Record<string, [number, number, number]> = {
    'AES-256': [-1.85, 1.25, -2.2],
    'RSA-4096': [-0.65, 1.35, -1.8],
    'TLS-1.3': [0.65, 1.35, -1.8],
    'SHA-256': [1.85, 1.25, -2.2],
  };

  return (
    <group name="Scenario2-Payload" visible={active}>
      {/* 1. Central Router Node Core at z = -3.8 */}
      <group position={[0, 1.8, -3.8]}>
        {/* Router Main Chassis */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[2.8, 1.6, 1.2]} />
          <meshStandardMaterial color="#080e1a" metalness={0.92} roughness={0.2} />
        </mesh>

        {/* Status Hologram Banner above Router */}
        <mesh position={[0, 1.1, 0.4]}>
          <planeGeometry args={[2.4, 0.8]} />
          <meshBasicMaterial map={statusTexture} />
        </mesh>

        {/* Color Sequence Flashing Beacon */}
        <group position={[0, 0.35, 0.65]}>
          <mesh>
            <cylinderGeometry args={[0.22, 0.25, 0.12, 24]} />
            <meshStandardMaterial color="#1e293b" metalness={0.8} />
          </mesh>
          <mesh ref={colorBeaconRef} position={[0, 0.08, 0]}>
            <sphereGeometry args={[0.16, 24, 24]} />
            <meshBasicMaterial color="#ef4444" toneMapped={false} />
          </mesh>
          <pointLight position={[0, 0.2, 0]} intensity={1.5} distance={2.5} color="#00f0ff" />
        </group>

        {/* Trapped Corrupted Payload Box */}
        {!data.cleansed && (
          <group ref={corruptedBoxRef} position={[0, -0.05, 0.68]}>
            <mesh>
              <dodecahedronGeometry args={[0.26]} />
              <meshStandardMaterial
                color="#dc2626"
                emissive="#ef4444"
                emissiveIntensity={1.8}
                roughness={0.15}
                wireframe
              />
            </mesh>
            <mesh>
              <octahedronGeometry args={[0.16]} />
              <meshBasicMaterial color="#000000" />
            </mesh>
          </group>
        )}

        {/* Cleansing Energy Shockwave on Purge */}
        {data.cleansed && (
          <mesh ref={cleansingWaveRef} position={[0, 0, 0.7]}>
            <ringGeometry args={[0.4, 0.8, 32]} />
            <meshBasicMaterial color="#10b981" transparent opacity={0.85} toneMapped={false} />
          </mesh>
        )}

        {/* Cooling Turbine Fan on side */}
        <group ref={routerFanRef} position={[1.42, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.3, 0.3, 0.05, 8]} />
          <meshStandardMaterial color="#334155" metalness={0.9} />
        </group>
      </group>

      {/* 2. Flowing Data Conduit Pipes */}
      <group position={[0, 2.5, -2.0]}>
        {[-1.0, 0, 1.0].map((x, idx) => (
          <mesh key={`pipe-${idx}`} position={[x, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.045, 0.045, 5, 16]} />
            <meshStandardMaterial color="#0284c7" emissive="#0284c7" emissiveIntensity={0.8} />
          </mesh>
        ))}
        {/* Animated Pipe Energy Pulses */}
        <group ref={pipePulsesRef}>
          {[-1.0, 0, 1.0].map((x, idx) => (
            <mesh key={`pulse-${idx}`} position={[x, 0, 0]}>
              <sphereGeometry args={[0.07, 12, 12]} />
              <meshBasicMaterial color="#38bdf8" toneMapped={false} />
            </mesh>
          ))}
        </group>
      </group>

      {/* 3. Four Glowing Protocol Orbs on Structured 3D Pedestals (Aim & Shoot to Solve) */}
      <group name="ProtocolOrbs">
        {data.availableShields.map((shield) => {
          const pos = shieldPositions[shield.id];
          const tex = shieldTextures.get(shield.id);
          const isLocked = lockedTargetId === shield.id;

          return (
            <ProtocolPedestalNode
              key={`pedestal-${shield.id}`}
              shield={shield}
              position={pos}
              texture={tex}
              isLocked={isLocked}
              onHit={() => {
                spatialAudio.playButtonBeep(720);
                onShieldApplied(shield.id);
              }}
            />
          );
        })}
      </group>
    </group>
  );
};

interface ProtocolPedestalNodeProps {
  shield: Scenario2Data['availableShields'][0];
  position: [number, number, number];
  texture?: THREE.CanvasTexture;
  isLocked: boolean;
  onHit: () => void;
}

const ProtocolPedestalNode: React.FC<ProtocolPedestalNodeProps> = ({
  shield,
  position,
  texture,
  isLocked,
  onHit,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const currentScale = useRef(1.0);

  const pedestalHeight = position[1] - 0.28;

  useFrame((_, delta) => {
    // Smooth magnetic hover 15% scaling (1.15x)
    currentScale.current = THREE.MathUtils.damp(
      currentScale.current,
      isLocked ? 1.15 : 1.0,
      14,
      delta
    );

    if (groupRef.current) {
      groupRef.current.scale.setScalar(currentScale.current);
    }
    if (haloRef.current) {
      haloRef.current.rotation.z += delta * (isLocked ? 2.5 : 1.2);
    }
  });

  return (
    <group position={[position[0], 0, position[2]]}>
      {/* 1. Physical 3D Metallic Pedestal Column from Floor */}
      <group position={[0, pedestalHeight / 2, 0]}>
        {/* Weighted Octagonal Base */}
        <mesh position={[0, -pedestalHeight / 2 + 0.04, 0]}>
          <cylinderGeometry args={[0.36, 0.42, 0.08, 8]} />
          <meshStandardMaterial color="#0c1220" metalness={0.92} roughness={0.25} />
        </mesh>

        {/* Glowing Base Halo Ring on Floor */}
        <mesh position={[0, -pedestalHeight / 2 + 0.085, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.32, 0.38, 32]} />
          <meshBasicMaterial color={isLocked ? '#facc15' : shield.color} toneMapped={false} />
        </mesh>

        {/* Tapered Metallic Pedestal Column */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.18, 0.26, pedestalHeight, 8]} />
          <meshStandardMaterial color="#0f172a" metalness={0.88} roughness={0.3} />
        </mesh>

        {/* Vertical Glowing Neon Groove Strips */}
        {[-0.17, 0.17].map((xOff, i) => (
          <mesh key={`ped-stripe-${i}`} position={[xOff, 0, 0]}>
            <boxGeometry args={[0.015, pedestalHeight * 0.85, 0.2]} />
            <meshStandardMaterial
              color={isLocked ? '#facc15' : shield.color}
              emissive={isLocked ? '#facc15' : shield.color}
              emissiveIntensity={isLocked ? 3.0 : 1.2}
            />
          </mesh>
        ))}

        {/* Pedestal Top Platform Collar */}
        <mesh position={[0, pedestalHeight / 2, 0]}>
          <cylinderGeometry args={[0.3, 0.24, 0.08, 8]} />
          <meshStandardMaterial color="#1e293b" metalness={0.92} roughness={0.2} />
        </mesh>
        <mesh position={[0, pedestalHeight / 2 + 0.045, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.22, 0.28, 24]} />
          <meshBasicMaterial color={isLocked ? '#facc15' : shield.color} toneMapped={false} />
        </mesh>
      </group>

      {/* 2. Interactive Target Orb & Solid High-Contrast Badge */}
      <group
        ref={groupRef}
        position={[0, position[1], 0]}
        onClick={(e) => {
          e.stopPropagation();
          onHit();
        }}
      >
        {/* PBR Glowing Crystal Orb with Glass Refraction */}
        <mesh>
          <sphereGeometry args={[0.28, 28, 28]} />
          <meshPhysicalMaterial
            color="#ffffff"
            roughness={0.06}
            metalness={0.12}
            transmission={0.7}
            ior={1.45}
            thickness={0.4}
            transparent
            opacity={0.88}
          />
        </mesh>

        {/* Revolving Outer Neon Torus Halo */}
        <mesh ref={haloRef} rotation={[Math.PI / 4, 0, 0]}>
          <torusGeometry args={[0.36, 0.018, 12, 32]} />
          <meshStandardMaterial
            color={isLocked ? '#facc15' : shield.color}
            emissive={isLocked ? '#facc15' : shield.color}
            emissiveIntensity={isLocked ? 3.0 : 1.5}
            metalness={0.8}
          />
        </mesh>

        {/* Inner 3D Cryptographic Glyph */}
        <group scale={[0.85, 0.85, 0.85]}>
          {shield.shape === 'shield' && (
            <mesh>
              <cylinderGeometry args={[0.18, 0.1, 0.3, 5]} />
              <meshStandardMaterial
                color={shield.color}
                emissive={isLocked ? '#facc15' : shield.color}
                emissiveIntensity={isLocked ? 3.0 : 1.5}
                roughness={0.15}
                metalness={0.88}
              />
            </mesh>
          )}
          {shield.shape === 'key' && (
            <group>
              <mesh position={[0, 0.09, 0]}>
                <torusGeometry args={[0.1, 0.025, 16, 24]} />
                <meshStandardMaterial
                  color={shield.color}
                  emissive={isLocked ? '#facc15' : shield.color}
                  emissiveIntensity={isLocked ? 3.0 : 1.5}
                  metalness={0.9}
                />
              </mesh>
              <mesh position={[0, -0.07, 0]}>
                <boxGeometry args={[0.035, 0.2, 0.035]} />
                <meshStandardMaterial
                  color={shield.color}
                  emissive={isLocked ? '#facc15' : shield.color}
                  emissiveIntensity={isLocked ? 3.0 : 1.5}
                  metalness={0.9}
                />
              </mesh>
            </group>
          )}
          {shield.shape === 'tunnel' && (
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.14, 0.14, 0.18, 16, 1, true]} />
              <meshStandardMaterial
                color={shield.color}
                emissive={isLocked ? '#facc15' : shield.color}
                emissiveIntensity={isLocked ? 3.0 : 1.5}
                roughness={0.1}
                metalness={0.8}
                side={THREE.DoubleSide}
              />
            </mesh>
          )}
          {shield.shape === 'hash' && (
            <mesh rotation={[0.4, 0.4, 0]}>
              <octahedronGeometry args={[0.18]} />
              <meshStandardMaterial
                color={shield.color}
                emissive={isLocked ? '#facc15' : shield.color}
                emissiveIntensity={isLocked ? 3.0 : 1.5}
                roughness={0.12}
                metalness={0.85}
              />
            </mesh>
          )}
        </group>

        {/* Magnetic Lock-On Reticle */}
        {isLocked && (
          <group position={[0, 0, 0.34]}>
            <mesh>
              <ringGeometry args={[0.38, 0.42, 32]} />
              <meshBasicMaterial color="#facc15" toneMapped={false} />
            </mesh>
            <mesh rotation={[0, 0, Math.PI / 4]}>
              <ringGeometry args={[0.46, 0.48, 4]} />
              <meshBasicMaterial color="#facc15" toneMapped={false} />
            </mesh>
          </group>
        )}

        {/* Solid #030A14 High-Contrast 3D Card Backing */}
        <mesh position={[0, -0.48, -0.01]} rotation={[-Math.PI / 12, 0, 0]}>
          <boxGeometry args={[0.96, 0.38, 0.02]} />
          <meshStandardMaterial color="#030A14" metalness={0.8} roughness={0.2} />
        </mesh>

        {/* High-Resolution Dynamic Canvas Texture on Front Face */}
        {texture && (
          <mesh position={[0, -0.48, 0.015]} rotation={[-Math.PI / 12, 0, 0]}>
            <planeGeometry args={[0.94, 0.36]} />
            <meshBasicMaterial map={texture} />
          </mesh>
        )}
      </group>
    </group>
  );
};
