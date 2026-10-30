/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Language, TrainingStepId } from '../types/game';
import { createTextTexture } from '../utils/textTexture';

export interface TrainingTargetItem {
  id: string | number;
  position: [number, number, number];
  radius: number;
}

interface TrainingSimulationProps {
  step: TrainingStepId;
  language: Language;
  lockedTargetId: string | number | null;
  leftFired: boolean;
  rightFired: boolean;
  packetsDestroyed: number;
  shotTargets: string[];
}

/**
 * 3D Training Simulation Scene Elements:
 * - Floating Holographic Training Terminal (center-field)
 * - Stage 1: Holographic Training Packets (dummy drones)
 * - Stage 2: Target Lock Practice Pylons
 * - Stage 3: Scenario 1 Firewall Port Cylinders (0x0050 -> Port 80)
 * - Stage 4: Scenario 2 Payload Shield Orbs (Red-Blue-Green -> AES-256)
 * - Stage 5: Scenario 3 DDoS Subnet Core Nodes (192.168.4.110 -> BETA)
 * - Stage 6: Graduation Holographic Trophy
 */
export const TrainingSimulation: React.FC<TrainingSimulationProps> = ({
  step,
  language,
  lockedTargetId,
  leftFired,
  rightFired,
  packetsDestroyed,
  shotTargets,
}) => {
  const isArabic = language === 'ar';
  const groupRef = useRef<THREE.Group>(null);
  const dummyDrone1Ref = useRef<THREE.Group>(null);
  const dummyDrone2Ref = useRef<THREE.Group>(null);
  const trophyRef = useRef<THREE.Group>(null);

  // Dynamic Terminal Header Text Texture
  const terminalTexture = useMemo(() => {
    let title = 'CYBER TRAINING // ACADEMY';
    let sub = 'STEP 1: BLASTER CALIBRATION & RECHARGE';
    let token = 'TRAINING';

    if (step === 'welcome') {
      title = isArabic ? 'أكاديمية الدفاع السيبراني' : 'CYBER INCIDENT DEFENSE ACADEMY';
      sub = isArabic ? 'محاكاة تدريبية تفاعلية للمشغلين الجدد' : 'INTERACTIVE ONBOARDING SIMULATION';
      token = isArabic ? 'مرحباً' : 'INITIATE';
    } else if (step === 'blaster_basics') {
      title = isArabic ? 'المرحلة 1: مدافع الليزر والمكثف' : 'STAGE 1: DUAL BLASTERS & CAPACITORS';
      sub = isArabic ? 'انقر بالماوس أو اسحب زناد اليد لإطلاق النار' : 'L-CLICK: CYAN // R-CLICK: MAGENTA // MONITOR CHARGE';
      token = isArabic ? 'جاهز' : 'ARMED';
    } else if (step === 'target_lock') {
      title = isArabic ? 'المرحلة 2: نظام التصويب المغناطيسي' : 'STAGE 2: MAGNETIC AIM ASSIST';
      sub = isArabic ? 'وجّه شعاعك نحو الأبراج لسماع نغمة القفل' : 'HOVER RETICLE NEAR TARGET TO ENGAGE LOCK CHIRP';
      token = isArabic ? 'تثبيت' : 'LOCK-ON';
    } else if (step === 'scenario_firewall') {
      title = isArabic ? 'المرحلة 3: جدار الحماية ومنافذ Hex' : 'STAGE 3: FIREWALL HEX CONVERSION';
      sub = isArabic ? 'الرمز 0x0050 = المنفذ 80 (HTTP)' : 'INCIDENT 1: 0x0050 EQUALS PORT 80 (HTTP)';
      token = '0x0050';
    } else if (step === 'scenario_payload') {
      title = isArabic ? 'المرحلة 4: شفرات الراوتر وترياق التشفير' : 'STAGE 4: MALWARE PAYLOAD & SHIELDS';
      sub = isArabic ? 'التتابع [أحمر - أزرق - أخضر] = درع AES-256' : '[RED - BLUE - GREEN] = RANSOMWARE -> SHOOT AES-256';
      token = 'PAYLOAD';
    } else if (step === 'scenario_ddos') {
      title = isArabic ? 'المرحلة 5: طوفان DDoS والتوجيه للثقب' : 'STAGE 5: DDOS MITIGATION & EMP';
      sub = isArabic ? 'المهاجم 192.168.4.110 يتبع النطاق BETA' : 'ATTACKER 192.168.4.110 BELONGS TO NODE BETA';
      token = '192.168.4.110';
    } else if (step === 'graduation') {
      title = isArabic ? 'اكتمل التدريب بنجاح!' : 'TACTICAL TRAINING COMPLETED!';
      sub = isArabic ? 'أنت مستعد الآن لخوض الحادث المباشر مع فريقك' : 'DEFENDER OPERATIVE READY FOR LIVE COMBAT DEPLOYMENT';
      token = isArabic ? 'معتمد' : 'CERTIFIED';
    }

    return createTextTexture(title, {
      textColor: '#00f0ff',
      subText: sub,
      decisionToken: token,
      isArabic,
      border: '#00f0ff',
      statusBadge: isArabic ? 'وضع التدريب' : 'TRAINING SIM',
      statusColor: '#10b981',
      fontSize: 54,
    });
  }, [step, isArabic]);

  // Frame animations for drones, trophy, and holographic floating
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    if (dummyDrone1Ref.current) {
      dummyDrone1Ref.current.position.y = 1.6 + Math.sin(t * 2.2) * 0.12;
      dummyDrone1Ref.current.position.x = -0.9 + Math.cos(t * 1.5) * 0.18;
      dummyDrone1Ref.current.rotation.y = t * 1.2;
    }
    if (dummyDrone2Ref.current) {
      dummyDrone2Ref.current.position.y = 1.8 + Math.cos(t * 2.5) * 0.12;
      dummyDrone2Ref.current.position.x = 0.9 + Math.sin(t * 1.8) * 0.18;
      dummyDrone2Ref.current.rotation.y = -t * 1.2;
    }
    if (trophyRef.current) {
      trophyRef.current.rotation.y = t * 0.8;
      trophyRef.current.position.y = 1.9 + Math.sin(t * 1.6) * 0.08;
    }
  });

  return (
    <group ref={groupRef} name="TrainingSimulationScene">
      {/* 1. Main Floating Holographic Training Terminal (Center-Field) */}
      <group position={[0, 2.45, -3.8]}>
        {/* Terminal Header Plate */}
        <mesh receiveShadow castShadow>
          <boxGeometry args={[2.8, 0.9, 0.08]} />
          <meshStandardMaterial color="#020617" roughness={0.2} metalness={0.9} />
        </mesh>
        {/* Neon Border Glow */}
        <mesh position={[0, 0, 0.045]}>
          <planeGeometry args={[2.74, 0.84]} />
          <meshBasicMaterial map={terminalTexture} toneMapped={false} />
        </mesh>
        {/* Terminal Pedestal Energy Emitter Ring */}
        <mesh position={[0, -0.48, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.3, 0.45, 24]} />
          <meshBasicMaterial color="#00f0ff" toneMapped={false} transparent opacity={0.6} />
        </mesh>
      </group>

      {/* 2. STAGE 1 & WELCOME: Floating Practice Drones (Blaster Basics) */}
      {(step === 'welcome' || step === 'blaster_basics') && (
        <group>
          {packetsDestroyed < 1 && (
            <group ref={dummyDrone1Ref} position={[-0.9, 1.6, -2.4]}>
              <TrainingDroneModel
                label={isArabic ? 'هدف 1' : 'DRONE-A'}
                color="#00f0ff"
                isLocked={lockedTargetId === 'drone-1'}
              />
            </group>
          )}

          {packetsDestroyed < 2 && (
            <group ref={dummyDrone2Ref} position={[0.9, 1.8, -2.4]}>
              <TrainingDroneModel
                label={isArabic ? 'هدف 2' : 'DRONE-B'}
                color="#ec4899"
                isLocked={lockedTargetId === 'drone-2'}
              />
            </group>
          )}
        </group>
      )}

      {/* 3. STAGE 2: Target Lock Mastery Pylons */}
      {step === 'target_lock' && (
        <group position={[0, 0, -2.8]}>
          {[
            { id: 'pylon-alpha', label: 'ALPHA', pos: [-1.4, 1.5, 0] as [number, number, number], color: '#00f0ff' },
            { id: 'pylon-beta', label: 'BETA', pos: [0.0, 1.8, -0.4] as [number, number, number], color: '#10b981' },
            { id: 'pylon-gamma', label: 'GAMMA', pos: [1.4, 1.5, 0] as [number, number, number], color: '#f59e0b' },
          ].map((pylon) => {
            const isShot = shotTargets.includes(pylon.id);
            const isLocked = lockedTargetId === pylon.id;
            return (
              <group key={pylon.id} position={pylon.pos}>
                <TargetLockPylonModel
                  label={pylon.label}
                  color={pylon.color}
                  isLocked={isLocked}
                  isShot={isShot}
                />
              </group>
            );
          })}
        </group>
      )}

      {/* 4. STAGE 3: Scenario 1 - Hex to Port Calibration Cylinders */}
      {step === 'scenario_firewall' && (
        <group position={[0, 1.6, -3.1]}>
          {[
            { port: 22, name: 'SSH', pos: [-1.8, 0, 0] as [number, number, number], isCorrect: false },
            { port: 80, name: 'HTTP', pos: [-0.6, 0.25, 0] as [number, number, number], isCorrect: true },
            { port: 443, name: 'HTTPS', pos: [0.6, 0.25, 0] as [number, number, number], isCorrect: false },
            { port: 53, name: 'DNS', pos: [1.8, 0, 0] as [number, number, number], isCorrect: false },
          ].map((item) => {
            const isLocked = lockedTargetId === item.port;
            const isShot = shotTargets.includes(String(item.port));
            return (
              <group key={item.port} position={item.pos}>
                <TrainingPortNode
                  port={item.port}
                  name={item.name}
                  isCorrect={item.isCorrect}
                  isLocked={isLocked}
                  isShot={isShot}
                  isArabic={isArabic}
                />
              </group>
            );
          })}
        </group>
      )}

      {/* 5. STAGE 4: Scenario 2 - Corrupted Payload Shield Orbs */}
      {step === 'scenario_payload' && (
        <group position={[0, 1.45, -2.4]}>
          {[
            { id: 'AES-256', name: 'AES-256', color: '#10b981', pos: [-1.5, 0, 0] as [number, number, number], isCorrect: true },
            { id: 'RSA-4096', name: 'RSA-4096', color: '#00f0ff', pos: [-0.5, 0.15, 0] as [number, number, number], isCorrect: false },
            { id: 'TLS-1.3', name: 'TLS-1.3', color: '#8b5cf6', pos: [0.5, 0.15, 0] as [number, number, number], isCorrect: false },
            { id: 'SHA-256', name: 'SHA-256', color: '#f59e0b', pos: [1.5, 0, 0] as [number, number, number], isCorrect: false },
          ].map((shield) => {
            const isLocked = lockedTargetId === shield.id;
            const isShot = shotTargets.includes(shield.id);
            return (
              <group key={shield.id} position={shield.pos}>
                <TrainingShieldOrb
                  id={shield.id}
                  color={shield.color}
                  isCorrect={shield.isCorrect}
                  isLocked={isLocked}
                  isShot={isShot}
                />
              </group>
            );
          })}
        </group>
      )}

      {/* 6. STAGE 5: Scenario 3 - DDoS Subnet Core Nodes */}
      {step === 'scenario_ddos' && (
        <group position={[0, 1.8, -2.8]}>
          {[
            { id: 'ALPHA', cidr: '192.168.1.0/24', pos: [-1.8, 0, 0] as [number, number, number], isCorrect: false, color: '#00f0ff' },
            { id: 'BETA', cidr: '192.168.4.0/24', pos: [0.0, 0.35, -0.3] as [number, number, number], isCorrect: true, color: '#10b981' },
            { id: 'GAMMA', cidr: '10.0.0.0/8', pos: [1.8, 0, 0] as [number, number, number], isCorrect: false, color: '#ec4899' },
          ].map((node) => {
            const isLocked = lockedTargetId === node.id;
            const isShot = shotTargets.includes(node.id);
            return (
              <group key={node.id} position={node.pos}>
                <TrainingSubnetNode
                  id={node.id}
                  cidr={node.cidr}
                  color={node.color}
                  isCorrect={node.isCorrect}
                  isLocked={isLocked}
                  isShot={isShot}
                  isArabic={isArabic}
                />
              </group>
            );
          })}
        </group>
      )}

      {/* 7. STAGE 6: Graduation Holographic Trophy */}
      {step === 'graduation' && (
        <group ref={trophyRef} position={[0, 1.9, -2.2]}>
          {/* Holographic Cyber Trophy */}
          <mesh castShadow>
            <cylinderGeometry args={[0.22, 0.12, 0.45, 8]} />
            <meshStandardMaterial color="#10b981" metalness={0.95} roughness={0.15} />
          </mesh>
          <mesh position={[0, 0.28, 0]}>
            <octahedronGeometry args={[0.18, 0]} />
            <meshBasicMaterial color="#00ffcc" toneMapped={false} />
          </mesh>
          {/* Base */}
          <mesh position={[0, -0.28, 0]}>
            <cylinderGeometry args={[0.28, 0.32, 0.12, 16]} />
            <meshStandardMaterial color="#020617" metalness={0.9} roughness={0.3} />
          </mesh>
          {/* Orbiting Neon Halo */}
          <mesh rotation={[Math.PI / 4, 0, 0]}>
            <torusGeometry args={[0.42, 0.015, 12, 32]} />
            <meshBasicMaterial color="#00f0ff" toneMapped={false} />
          </mesh>
        </group>
      )}
    </group>
  );
};

/**
 * Procedural Multi-part Training Drone Model
 */
const TrainingDroneModel: React.FC<{
  label: string;
  color: string;
  isLocked: boolean;
}> = ({ label, color, isLocked }) => {
  return (
    <group>
      {/* Core Sphere */}
      <mesh castShadow>
        <sphereGeometry args={[0.16, 16, 16]} />
        <meshStandardMaterial
          color={isLocked ? '#10b981' : color}
          emissive={isLocked ? '#10b981' : color}
          emissiveIntensity={isLocked ? 1.5 : 0.8}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>
      {/* Outer Torus Ring */}
      <mesh rotation={[Math.PI / 3, 0, 0]}>
        <torusGeometry args={[0.28, 0.015, 12, 24]} />
        <meshBasicMaterial color={isLocked ? '#10b981' : '#ffffff'} toneMapped={false} />
      </mesh>
      {/* Target Reticle Brackets (when locked) */}
      {isLocked && (
        <mesh>
          <ringGeometry args={[0.34, 0.38, 32]} />
          <meshBasicMaterial color="#10b981" toneMapped={false} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
};

/**
 * Procedural Target Lock Pylon
 */
const TargetLockPylonModel: React.FC<{
  label: string;
  color: string;
  isLocked: boolean;
  isShot: boolean;
}> = ({ label, color, isLocked, isShot }) => {
  const pylonMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: isShot ? '#10b981' : isLocked ? '#00f0ff' : '#1e293b',
      emissive: isShot ? '#10b981' : isLocked ? '#00f0ff' : '#000000',
      emissiveIntensity: isShot ? 1.4 : isLocked ? 1.0 : 0,
      metalness: 0.9,
      roughness: 0.2,
    });
  }, [isShot, isLocked]);

  return (
    <group>
      {/* Pylon Base Column */}
      <mesh position={[0, -0.4, 0]}>
        <cylinderGeometry args={[0.15, 0.22, 0.8, 16]} />
        <primitive object={pylonMat} />
      </mesh>
      {/* Glowing Floating Crystal Target */}
      <mesh position={[0, 0.2, 0]} castShadow>
        <octahedronGeometry args={[0.24, 0]} />
        <meshBasicMaterial
          color={isShot ? '#10b981' : isLocked ? '#00ffcc' : color}
          toneMapped={false}
        />
      </mesh>
      {/* Lock Ring */}
      {(isLocked || isShot) && (
        <mesh position={[0, 0.2, 0]}>
          <ringGeometry args={[0.34, 0.38, 24]} />
          <meshBasicMaterial color={isShot ? '#10b981' : '#00f0ff'} toneMapped={false} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
};

/**
 * Scenario 1 Training Port Cylinder
 */
const TrainingPortNode: React.FC<{
  port: number;
  name: string;
  isCorrect: boolean;
  isLocked: boolean;
  isShot: boolean;
  isArabic: boolean;
}> = ({ port, name, isCorrect, isLocked, isShot, isArabic }) => {
  const badgeTexture = useMemo(() => {
    return createTextTexture(`PORT ${port}`, {
      textColor: isShot ? '#10b981' : isLocked ? '#00f0ff' : '#e2e8f0',
      decisionToken: String(port),
      secondaryLabel: name,
      subText: isCorrect ? (isArabic ? 'الهدف الصحيح (0x0050)' : 'MATCHES 0x0050') : '',
      border: isShot ? '#10b981' : isLocked ? '#00f0ff' : '#334155',
      statusBadge: isCorrect ? 'TARGET' : 'PORT',
      statusColor: isCorrect ? '#10b981' : '#64748b',
      fontSize: 64,
      isArabic,
    });
  }, [port, name, isCorrect, isLocked, isShot, isArabic]);

  return (
    <group>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.26, 0.26, 0.6, 20]} />
        <meshStandardMaterial
          color={isShot ? '#064e3b' : isLocked ? '#0e3a53' : '#0f172a'}
          metalness={0.88}
          roughness={0.25}
        />
      </mesh>
      {/* Front Badge */}
      <mesh position={[0, 0, 0.27]}>
        <planeGeometry args={[0.55, 0.35]} />
        <meshBasicMaterial map={badgeTexture} toneMapped={false} />
      </mesh>
      {/* Glowing Top Ring */}
      <mesh position={[0, 0.31, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.18, 0.25, 24]} />
        <meshBasicMaterial
          color={isShot ? '#10b981' : isLocked ? '#00f0ff' : isCorrect ? '#00ffcc' : '#334155'}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
};

/**
 * Scenario 2 Training Shield Orb
 */
const TrainingShieldOrb: React.FC<{
  id: string;
  color: string;
  isCorrect: boolean;
  isLocked: boolean;
  isShot: boolean;
}> = ({ id, color, isCorrect, isLocked, isShot }) => {
  const badgeTexture = useMemo(() => {
    return createTextTexture(id, {
      textColor: color,
      decisionToken: id,
      secondaryLabel: isCorrect ? 'COUNTERMEASURE' : 'SHIELD',
      border: color,
      fontSize: 56,
      statusBadge: isCorrect ? 'PRESCRIBED' : 'PROTOCOL',
      statusColor: isCorrect ? '#10b981' : '#94a3b8',
    });
  }, [id, color, isCorrect]);

  return (
    <group>
      {/* Inner Glowing Crystal */}
      <mesh castShadow>
        <icosahedronGeometry args={[0.22, 1]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isShot ? 2.0 : isLocked ? 1.5 : 0.8}
          metalness={0.9}
          roughness={0.15}
        />
      </mesh>
      {/* Outer Hex Shield Wireframe */}
      <mesh>
        <icosahedronGeometry args={[0.28, 1]} />
        <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.35} />
      </mesh>
      {/* 3D Label Badge underneath */}
      <mesh position={[0, -0.42, 0]}>
        <planeGeometry args={[0.55, 0.22]} />
        <meshBasicMaterial map={badgeTexture} toneMapped={false} />
      </mesh>
    </group>
  );
};

/**
 * Scenario 3 Training Subnet Node
 */
const TrainingSubnetNode: React.FC<{
  id: string;
  cidr: string;
  color: string;
  isCorrect: boolean;
  isLocked: boolean;
  isShot: boolean;
  isArabic: boolean;
}> = ({ id, cidr, color, isCorrect, isLocked, isShot, isArabic }) => {
  const badgeTexture = useMemo(() => {
    return createTextTexture(`NODE ${id}`, {
      textColor: color,
      decisionToken: `NODE ${id}`,
      secondaryLabel: cidr,
      subText: isCorrect ? (isArabic ? 'النطاق المستهدف للإخماد' : 'TARGET EMP ROUTE') : '',
      border: color,
      fontSize: 58,
      statusBadge: isCorrect ? 'ACTIVE ROUTE' : 'STANDBY',
      statusColor: isCorrect ? '#10b981' : '#64748b',
      isArabic,
    });
  }, [id, cidr, color, isCorrect, isArabic]);

  return (
    <group>
      {/* Heavy Server Rack Pylon */}
      <mesh position={[0, -0.4, 0]} castShadow>
        <boxGeometry args={[0.42, 0.8, 0.42]} />
        <meshStandardMaterial color="#0b1120" metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Core Emitter Sphere */}
      <mesh position={[0, 0.25, 0]} castShadow>
        <sphereGeometry args={[0.22, 24, 24]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isShot ? 2.0 : isLocked ? 1.6 : 0.9}
          metalness={0.9}
          roughness={0.15}
        />
      </mesh>
      {/* Label Badge */}
      <mesh position={[0, -0.25, 0.22]}>
        <planeGeometry args={[0.55, 0.3]} />
        <meshBasicMaterial map={badgeTexture} toneMapped={false} />
      </mesh>
    </group>
  );
};
