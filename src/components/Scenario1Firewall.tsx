/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Scenario1Data, Language } from '../types/game';
import { HEX_PORT_TABLE } from '../game/rules';
import { spatialAudio } from '../audio/SpatialAudio';
import { createTextTexture } from '../utils/textTexture';

interface Scenario1FirewallProps {
  data: Scenario1Data;
  active: boolean;
  onPortHit: (portNumber: number) => void;
  language?: Language;
  lockedTargetId?: string | number | null;
  isVictory?: boolean;
}

export const Scenario1Firewall: React.FC<Scenario1FirewallProps> = ({
  data,
  active,
  onPortHit,
  language = 'en',
  lockedTargetId = null,
  isVictory = false,
}) => {
  const doorLightsRef = useRef<THREE.Group>(null);
  const targetsGroupRef = useRef<THREE.Group>(null);
  const blastDoorLeftRef = useRef<THREE.Mesh>(null);
  const blastDoorRightRef = useRef<THREE.Mesh>(null);
  const breachCounterTextRef = useRef<THREE.Mesh>(null);
  const sealingWaveRef = useRef<THREE.Mesh>(null);
  const [waveScale, setWaveScale] = useState(0);

  const isArabic = language === 'ar';

  // Hex Display Texture on Blast Door (2x Scaled Hex Number)
  const hexTexture = useMemo(() => {
    return createTextTexture('', {
      decisionToken: data.targetHex,
      secondaryLabel: isVictory
        ? isArabic ? 'جدار الحماية: مؤمن ومغلق' : 'FIREWALL LOCKED // SECURED'
        : isArabic ? 'شفرة اختراق جدار الحماية' : 'BREACH PROTOCOL HEX',
      textColor: isVictory ? '#10b981' : '#ef4444',
      bgColor: '#030A14',
      fontSize: 84,
      border: isVictory ? '#10b981' : '#ef4444',
      subText: isVictory
        ? isArabic ? 'تم صد الهجوم الغاشم وإغلاق المنافذ' : 'BRUTE FORCE NEUTRALIZED // SSH ENCRYPTED'
        : isArabic ? 'استشر فريق الطاولة واقصف المنفذ المقابل' : 'CONSULT MANUAL // SHOOT MATCHING PORT',
      isArabic,
      width: 768,
      height: 256,
      statusBadge: isVictory
        ? isArabic ? 'مؤمن' : 'LOCKED'
        : isArabic ? 'خطر' : 'DEFCON 3',
      statusColor: isVictory ? '#10b981' : '#ef4444',
    });
  }, [data.targetHex, isArabic, isVictory]);

  // Port Target Textures with 2x Scaled Port Number and Solid #030A14 Card
  const portTextures = useMemo(() => {
    const map = new Map<number, THREE.CanvasTexture>();
    data.allPortOptions.forEach((port) => {
      const match = HEX_PORT_TABLE.find((p) => p.port === port);
      const serviceName = match ? match.service : 'TCP';
      const decToken = isArabic ? `منفذ ${port}` : `PORT ${port}`;
      const secLabel = `${serviceName} // ${match?.description || 'FIREWALL PORT'}`;
      const sub = isArabic ? 'انقر بالليزر للقفل' : 'SHOOT ORB TO SEAL';

      const tex = createTextTexture('', {
        decisionToken: decToken,
        secondaryLabel: secLabel,
        textColor: '#00f0ff',
        bgColor: '#030A14',
        fontSize: 68,
        border: '#00f0ff',
        subText: sub,
        isArabic,
        width: 768,
        height: 256,
        statusBadge: serviceName,
        statusColor: '#00f0ff',
      });
      map.set(port, tex);
    });
    return map;
  }, [data.allPortOptions, isArabic]);

  // 4 orbital target positions at staggered depths to guarantee 100% line-of-sight clarity
  const targetPositions: [number, number, number][] = [
    [-1.85, 1.65, -3.2],
    [-0.65, 1.95, -3.7],
    [0.65, 1.95, -3.7],
    [1.85, 1.65, -3.2],
  ];

  // Trigger sealing wave animation on victory
  useEffect(() => {
    if (isVictory) {
      spatialAudio.playSealingWave();
    }
  }, [isVictory]);

  // Frame animations: door sliding on victory and sealing wave expansion
  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();

    // Pulse breach counter
    if (doorLightsRef.current) {
      doorLightsRef.current.position.y = 0.8 + Math.sin(t * 4) * 0.02;
    }

    // Sealing doors shut on victory
    if (isVictory) {
      if (blastDoorLeftRef.current) {
        blastDoorLeftRef.current.position.x = THREE.MathUtils.damp(
          blastDoorLeftRef.current.position.x,
          -0.95,
          4,
          delta
        );
      }
      if (blastDoorRightRef.current) {
        blastDoorRightRef.current.position.x = THREE.MathUtils.damp(
          blastDoorRightRef.current.position.x,
          0.95,
          4,
          delta
        );
      }
      // Expanding blue energy sealing shockwave
      if (sealingWaveRef.current) {
        sealingWaveRef.current.scale.addScalar(delta * 6.0);
        const mat = sealingWaveRef.current.material as THREE.MeshBasicMaterial;
        if (mat.opacity > 0) {
          mat.opacity = Math.max(0, mat.opacity - delta * 0.7);
        }
      }
    } else {
      if (blastDoorLeftRef.current) blastDoorLeftRef.current.position.x = -1.15;
      if (blastDoorRightRef.current) blastDoorRightRef.current.position.x = 1.15;
    }
  });

  return (
    <group name="Scenario1-Firewall" visible={active}>
      {/* 1. Giant Armored Firewall Blast Door at z = -5.0 */}
      <group position={[0, 1.8, -5.0]}>
        {/* Massive Outer Frame */}
        <mesh position={[0, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[4.4, 3.8, 0.4]} />
          <meshStandardMaterial color="#080e1a" metalness={0.92} roughness={0.25} />
        </mesh>

        {/* Left Armored Sliding Gate */}
        <mesh ref={blastDoorLeftRef} position={[-1.15, 0, 0.1]}>
          <boxGeometry args={[1.9, 3.4, 0.2]} />
          <meshStandardMaterial color="#1e293b" metalness={0.88} roughness={0.3} />
        </mesh>

        {/* Right Armored Sliding Gate */}
        <mesh ref={blastDoorRightRef} position={[1.15, 0, 0.1]}>
          <boxGeometry args={[1.9, 3.4, 0.2]} />
          <meshStandardMaterial color="#1e293b" metalness={0.88} roughness={0.3} />
        </mesh>

        {/* Hazard Caution Warning Stripes */}
        <mesh position={[0, 1.6, 0.22]}>
          <boxGeometry args={[3.8, 0.15, 0.02]} />
          <meshStandardMaterial color="#eab308" roughness={0.3} metalness={0.2} />
        </mesh>
        <mesh position={[0, -1.6, 0.22]}>
          <boxGeometry args={[3.8, 0.15, 0.02]} />
          <meshStandardMaterial color="#eab308" roughness={0.3} metalness={0.2} />
        </mesh>

        {/* Central Hexagonal Digital Lock Core */}
        <group position={[0, 0, 0.25]}>
          <mesh rotation={[0, 0, Math.PI / 6]}>
            <cylinderGeometry args={[0.7, 0.75, 0.1, 6]} />
            <meshStandardMaterial color="#334155" metalness={0.85} roughness={0.2} />
          </mesh>
          <mesh position={[0, 0, 0.06]}>
            <ringGeometry args={[0.45, 0.58, 32]} />
            <meshBasicMaterial color={isVictory ? '#10b981' : '#ef4444'} toneMapped={false} />
          </mesh>
        </group>

        {/* Glowing Placard Displaying Animated Hex Code */}
        <group ref={doorLightsRef} position={[0, 0.8, 0.26]}>
          <mesh ref={breachCounterTextRef}>
            <planeGeometry args={[2.2, 1.1]} />
            <meshBasicMaterial map={hexTexture} />
          </mesh>
        </group>

        {/* Expanding Blue Energy Sealing Wave on Hit/Victory */}
        {isVictory && (
          <mesh ref={sealingWaveRef} position={[0, 0, 0.3]}>
            <ringGeometry args={[0.6, 1.2, 48]} />
            <meshBasicMaterial color="#00f0ff" transparent opacity={0.85} toneMapped={false} />
          </mesh>
        )}
      </group>

      {/* 2. Structured 3D Metallic Pedestals at Staggered Depths with Floating Crystal Orbs */}
      <group ref={targetsGroupRef} name="PortTargets">
        {data.allPortOptions.slice(0, 4).map((portNumber, idx) => {
          const pos = targetPositions[idx % targetPositions.length];
          const tex = portTextures.get(portNumber);
          const isLocked = lockedTargetId === portNumber;

          return (
            <PortTargetNode
              key={`target-port-${portNumber}`}
              portNumber={portNumber}
              position={pos}
              texture={tex}
              isLocked={isLocked}
              onHit={() => {
                spatialAudio.playButtonBeep(880);
                onPortHit(portNumber);
              }}
            />
          );
        })}
      </group>
    </group>
  );
};

interface PortTargetNodeProps {
  portNumber: number;
  position: [number, number, number];
  texture?: THREE.CanvasTexture;
  isLocked: boolean;
  onHit: () => void;
}

const PortTargetNode: React.FC<PortTargetNodeProps> = ({
  position,
  texture,
  isLocked,
  onHit,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const currentScale = useRef(1.0);

  // Pedestal height from floor (y = 0) up to just beneath the target node
  const pedestalHeight = position[1] - 0.28;

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
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
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * (isLocked ? 2.5 : 1.2);
    }
  });

  return (
    <group position={[position[0], 0, position[2]]}>
      {/* 1. Physical Metallic Pedestal Column from Floor */}
      <group position={[0, pedestalHeight / 2, 0]}>
        {/* Weighted Octagonal Base on Floor */}
        <mesh position={[0, -pedestalHeight / 2 + 0.04, 0]}>
          <cylinderGeometry args={[0.38, 0.42, 0.08, 8]} />
          <meshStandardMaterial color="#0b1120" metalness={0.9} roughness={0.25} />
        </mesh>
        {/* Glowing Base Platform Ring */}
        <mesh position={[0, -pedestalHeight / 2 + 0.085, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.34, 0.38, 16]} />
          <meshBasicMaterial color={isLocked ? '#facc15' : '#00f0ff'} toneMapped={false} />
        </mesh>

        {/* Tapered Octagonal Metallic Column */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.18, 0.28, pedestalHeight, 8]} />
          <meshStandardMaterial color="#0f172a" metalness={0.88} roughness={0.3} />
        </mesh>

        {/* Vertical Glowing Neon Groove Strips */}
        {[-0.18, 0.18].map((xOff, i) => (
          <mesh key={`ped-stripe-${i}`} position={[xOff, 0, 0]}>
            <boxGeometry args={[0.015, pedestalHeight * 0.85, 0.22]} />
            <meshStandardMaterial
              color={isLocked ? '#facc15' : '#0284c7'}
              emissive={isLocked ? '#facc15' : '#00f0ff'}
              emissiveIntensity={isLocked ? 3.0 : 1.2}
            />
          </mesh>
        ))}

        {/* Pedestal Top Collar Platform */}
        <mesh position={[0, pedestalHeight / 2, 0]}>
          <cylinderGeometry args={[0.32, 0.26, 0.08, 8]} />
          <meshStandardMaterial color="#1e293b" metalness={0.92} roughness={0.2} />
        </mesh>
        <mesh position={[0, pedestalHeight / 2 + 0.045, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.26, 0.3, 16]} />
          <meshBasicMaterial color={isLocked ? '#facc15' : '#00f0ff'} toneMapped={false} />
        </mesh>
      </group>

      {/* 2. Interactive Target Node (Aimed, Locked & Shot) */}
      <group
        ref={groupRef}
        position={[0, position[1], 0]}
        onClick={(e) => {
          e.stopPropagation();
          onHit();
        }}
      >
        {/* Outer Kinetic Shield Ring */}
        <mesh ref={ringRef}>
          <torusGeometry args={[0.45, 0.024, 16, 4]} />
          <meshStandardMaterial
            color={isLocked ? '#facc15' : '#00f0ff'}
            emissive={isLocked ? '#facc15' : '#0284c7'}
            emissiveIntensity={isLocked ? 3.0 : 1.2}
            metalness={0.85}
          />
        </mesh>

        {/* PBR Glowing Crystal Orb with Glass Refraction */}
        <mesh>
          <sphereGeometry args={[0.26, 24, 24]} />
          <meshPhysicalMaterial
            color="#ffffff"
            roughness={0.06}
            metalness={0.15}
            transmission={0.65}
            ior={1.45}
            thickness={0.4}
            transparent
            opacity={0.88}
          />
        </mesh>

        {/* Inner Pulsing Node Energy Core */}
        <mesh>
          <sphereGeometry args={[0.13, 16, 16]} />
          <meshStandardMaterial
            color={isLocked ? '#facc15' : '#00f0ff'}
            emissive={isLocked ? '#facc15' : '#00f0ff'}
            emissiveIntensity={isLocked ? 3.2 : 1.6}
            roughness={0.1}
          />
        </mesh>

        {/* Magnetic Lock-On Reticle */}
        {isLocked && (
          <group position={[0, 0, 0.3]}>
            <mesh>
              <ringGeometry args={[0.36, 0.40, 32]} />
              <meshBasicMaterial color="#facc15" toneMapped={false} />
            </mesh>
            <mesh rotation={[0, 0, Math.PI / 4]}>
              <ringGeometry args={[0.44, 0.46, 4]} />
              <meshBasicMaterial color="#facc15" toneMapped={false} />
            </mesh>
          </group>
        )}

        {/* Solid #030A14 High-Contrast 3D Card Backing */}
        <mesh position={[0, -0.48, -0.01]}>
          <boxGeometry args={[0.96, 0.38, 0.02]} />
          <meshStandardMaterial color="#030A14" metalness={0.8} roughness={0.2} />
        </mesh>

        {/* High-Resolution Dynamic Canvas Texture on Front Face */}
        {texture && (
          <mesh position={[0, -0.48, 0.015]}>
            <planeGeometry args={[0.94, 0.36]} />
            <meshBasicMaterial map={texture} />
          </mesh>
        )}
      </group>
    </group>
  );
};
