/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Scenario3Data, Language, SubnetCoreNode } from '../types/game';
import { spatialAudio } from '../audio/SpatialAudio';
import { createTextTexture } from '../utils/textTexture';

interface Scenario3DDoSProps {
  data: Scenario3Data;
  active: boolean;
  onNodeHit: (nodeId: 'ALPHA' | 'BETA' | 'GAMMA') => void;
  language?: Language;
  lockedTargetId?: string | number | null;
}

export const Scenario3DDoS: React.FC<Scenario3DDoSProps> = ({
  data,
  active,
  onNodeHit,
  language = 'en',
  lockedTargetId = null,
}) => {
  const terminalGlowRef = useRef<THREE.Mesh>(null);
  const empRingRef = useRef<THREE.Mesh>(null);
  const nodesGroupRef = useRef<THREE.Group>(null);

  const isArabic = language === 'ar';

  // Holographic Threat Terminal Screen Texture (2x Scaled Attacker IP)
  const terminalTexture = useMemo(() => {
    return createTextTexture('', {
      decisionToken: data.neutralized
        ? isArabic ? 'تم تحييد الهجوم' : 'DDOS NEUTRALIZED'
        : data.attackingIp,
      secondaryLabel: data.neutralized
        ? isArabic ? 'مسار نبضة EMP مكتمل // الشبكة آمنة' : 'EMP BLAST COMPLETE // SUB-NETWORK ISOLATED'
        : isArabic ? 'عنوان IP المهاجم النشط // حدد الشبكة واقصفها' : 'MALICIOUS FLOOD SOURCE // SHOOT TARGET CIDR NODE',
      textColor: data.neutralized ? '#10b981' : '#ef4444',
      bgColor: '#030A14',
      fontSize: 78,
      border: data.neutralized ? '#10b981' : '#ef4444',
      subText: isArabic ? 'استشر فريق الطاولة واقصف العقدة المطابقة' : 'CONSULT MANUAL // SHOOT MATCHING SUBNET CORE',
      isArabic,
      width: 768,
      height: 256,
      statusBadge: data.neutralized
        ? isArabic ? 'محايد' : 'NEUTRALIZED'
        : isArabic ? 'إنذار 1' : 'DEFCON 1',
      statusColor: data.neutralized ? '#10b981' : '#ef4444',
    });
  }, [data.attackingIp, data.neutralized, isArabic]);

  // Subnet Core Node Textures with 2x Scaled CIDR & Node Identifier
  const nodeTextures = useMemo(() => {
    const map = new Map<string, THREE.CanvasTexture>();

    const arabicLabels: Record<string, { token: string; sec: string }> = {
      ALPHA: { token: 'عقدة ألفا (10.0.0.0/8)', sec: 'شبكة مركز البيانات الرئيسية' },
      BETA: { token: 'عقدة بيتا (172.16.0.0/12)', sec: 'حافة الشبكة العازلة DMZ' },
      GAMMA: { token: 'عقدة جاما (192.168.4.0/24)', sec: 'بوابة شبكة المكاتب LAN' },
    };

    const englishLabels: Record<string, { token: string; sec: string }> = {
      ALPHA: { token: 'ALPHA // 10.0.0.0/8', sec: 'DATA CENTER CORE CLUSTER' },
      BETA: { token: 'BETA // 172.16.0.0/12', sec: 'DMZ PERIMETER PROXY' },
      GAMMA: { token: 'GAMMA // 192.168.4.0/24', sec: 'OFFICE LAN SUBNET GATEWAY' },
    };

    data.nodes.forEach((node) => {
      const info = isArabic ? arabicLabels[node.id] : englishLabels[node.id];
      const token = info?.token || `${node.label} (${node.cidr})`;
      const sec = info?.sec || `${node.subnetName} // TARGET NODE`;
      const sub = isArabic ? 'انقر بالليزر لإطلاق EMP' : 'SHOOT TO TRIGGER EMP SHOCKWAVE';

      const tex = createTextTexture('', {
        decisionToken: token,
        secondaryLabel: sec,
        textColor: node.color,
        bgColor: '#030A14',
        fontSize: 62,
        border: node.color,
        subText: sub,
        isArabic,
        width: 768,
        height: 256,
        statusBadge: isArabic ? 'عقدة رئيسية' : 'CORE NODE',
        statusColor: node.color,
      });
      map.set(node.id, tex);
    });

    return map;
  }, [data.nodes, isArabic]);

  // 3 Massive Core Node Positions at staggered depths for 100% line-of-sight clarity
  const nodePositions: Record<string, [number, number, number]> = {
    ALPHA: [-2.1, 1.85, -2.8],
    BETA: [0.0, 2.25, -3.6],
    GAMMA: [2.1, 1.85, -2.8],
  };

  // Frame animation: pulsating terminal, rotating core nodes, expanding EMP blast
  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();

    if (terminalGlowRef.current) {
      const pulse = 0.8 + Math.sin(t * 6) * 0.4;
      (terminalGlowRef.current.material as THREE.MeshBasicMaterial).opacity = pulse;
    }

    // Expanding massive EMP Ring on neutralize
    if (empRingRef.current && data.neutralized) {
      empRingRef.current.scale.addScalar(delta * 14.0);
      const mat = empRingRef.current.material as THREE.MeshBasicMaterial;
      if (mat.opacity > 0) {
        mat.opacity = Math.max(0, mat.opacity - delta * 0.5);
      }
    }

    // Rotate node containment rings
    if (nodesGroupRef.current) {
      nodesGroupRef.current.children.forEach((nodeGroup, idx) => {
        const ring1 = nodeGroup.getObjectByName('Ring1');
        const ring2 = nodeGroup.getObjectByName('Ring2');
        if (ring1) ring1.rotation.y += delta * (0.8 + idx * 0.2);
        if (ring2) ring2.rotation.x += delta * (0.6 + idx * 0.2);
        nodeGroup.position.y += Math.sin(t * 1.8 + idx) * 0.001;
      });
    }
  });

  return (
    <group name="Scenario3-DDoSBlackhole" visible={active}>
      {/* 1. Holographic Threat Terminal Screen at z = -2.6 */}
      <group position={[0, 2.3, -2.6]}>
        <mesh>
          <boxGeometry args={[2.5, 1.3, 0.06]} />
          <meshStandardMaterial color="#0b0f19" metalness={0.92} roughness={0.2} />
        </mesh>

        {/* Display Glass with Terminal Texture */}
        <mesh position={[0, 0, 0.035]}>
          <planeGeometry args={[2.3, 1.1]} />
          <meshBasicMaterial map={terminalTexture} />
        </mesh>

        {/* Target CIDR Instruction Banner */}
        <mesh position={[0, -0.42, 0.04]}>
          <planeGeometry args={[1.8, 0.12]} />
          <meshBasicMaterial color={data.neutralized ? '#10b981' : '#dc2626'} />
        </mesh>
      </group>

      {/* 2. Three Massive Floating Subnet Core Nodes on Physical Pylons (Shoot to Solve) */}
      <group ref={nodesGroupRef} name="SubnetCoreNodes">
        {data.nodes.map((node) => {
          const pos = nodePositions[node.id];
          const tex = nodeTextures.get(node.id);
          const isLocked = lockedTargetId === node.id;

          return (
            <SubnetPylonNode
              key={`subnet-node-${node.id}`}
              node={node}
              position={pos}
              texture={tex}
              isLocked={isLocked}
              onHit={() => {
                spatialAudio.playButtonBeep(880);
                onNodeHit(node.id);
              }}
            />
          );
        })}
      </group>

      {/* 3. Massive Expanding EMP Ring on Neutralize */}
      {data.neutralized && (
        <mesh
          ref={empRingRef}
          position={[0, 1.8, -2.5]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[0.8, 1.4, 48]} />
          <meshBasicMaterial color="#00ffcc" transparent opacity={0.95} toneMapped={false} />
        </mesh>
      )}
    </group>
  );
};

interface SubnetPylonNodeProps {
  node: SubnetCoreNode;
  position: [number, number, number];
  texture?: THREE.CanvasTexture;
  isLocked: boolean;
  onHit: () => void;
}

const SubnetPylonNode: React.FC<SubnetPylonNodeProps> = ({
  node,
  position,
  texture,
  isLocked,
  onHit,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const currentScale = useRef(1.0);

  const pylonHeight = position[1] - 0.38;

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
    if (ring1Ref.current) {
      ring1Ref.current.rotation.y += delta * (isLocked ? 2.5 : 1.0);
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.x += delta * (isLocked ? 2.0 : 0.8);
    }
  });

  return (
    <group position={[position[0], 0, position[2]]}>
      {/* 1. Heavy-Duty Cyber Data Pylon from Floor */}
      <group position={[0, pylonHeight / 2, 0]}>
        {/* Massive Reinforced Base Plate on Floor */}
        <mesh position={[0, -pylonHeight / 2 + 0.05, 0]}>
          <cylinderGeometry args={[0.48, 0.56, 0.1, 8]} />
          <meshStandardMaterial color="#080e1a" metalness={0.94} roughness={0.2} />
        </mesh>
        {/* Glowing Base Platform Rim */}
        <mesh position={[0, -pylonHeight / 2 + 0.105, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.42, 0.48, 24]} />
          <meshBasicMaterial color={isLocked ? '#facc15' : node.color} toneMapped={false} />
        </mesh>

        {/* Tapered Central Pylon Tower */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.22, 0.36, pylonHeight, 8]} />
          <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.28} />
        </mesh>

        {/* Illuminated Vertical Bus Conduit Tubes */}
        {[-0.22, 0.22].map((xOff, i) => (
          <mesh key={`pylon-tube-${i}`} position={[xOff, 0, 0]}>
            <boxGeometry args={[0.02, pylonHeight * 0.9, 0.28]} />
            <meshStandardMaterial
              color={isLocked ? '#facc15' : node.color}
              emissive={isLocked ? '#facc15' : node.color}
              emissiveIntensity={isLocked ? 3.0 : 1.2}
            />
          </mesh>
        ))}

        {/* Pylon Top Collar Platform */}
        <mesh position={[0, pylonHeight / 2, 0]}>
          <cylinderGeometry args={[0.4, 0.32, 0.1, 8]} />
          <meshStandardMaterial color="#1e293b" metalness={0.92} roughness={0.2} />
        </mesh>
        <mesh position={[0, pylonHeight / 2 + 0.055, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.3, 0.38, 24]} />
          <meshBasicMaterial color={isLocked ? '#facc15' : node.color} toneMapped={false} />
        </mesh>
      </group>

      {/* 2. Interactive Target Subnet Core Node */}
      <group
        ref={groupRef}
        position={[0, position[1], 0]}
        onClick={(e) => {
          e.stopPropagation();
          onHit();
        }}
      >
        {/* Outer Revolving Cyber Containment Ring 1 */}
        <mesh ref={ring1Ref}>
          <torusGeometry args={[0.55, 0.024, 16, 32]} />
          <meshStandardMaterial
            color={isLocked ? '#facc15' : node.color}
            emissive={isLocked ? '#facc15' : node.color}
            emissiveIntensity={isLocked ? 3.0 : 1.2}
            metalness={0.85}
          />
        </mesh>

        {/* Outer Revolving Cyber Containment Ring 2 */}
        <mesh ref={ring2Ref} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.5, 0.02, 16, 32]} />
          <meshStandardMaterial
            color={isLocked ? '#facc15' : node.color}
            emissive={isLocked ? '#facc15' : node.color}
            emissiveIntensity={isLocked ? 3.0 : 1.2}
            metalness={0.85}
          />
        </mesh>

        {/* Massive PBR Glowing Crystal Orb with Glass Refraction */}
        <mesh>
          <sphereGeometry args={[0.38, 32, 32]} />
          <meshPhysicalMaterial
            color="#ffffff"
            roughness={0.05}
            metalness={0.12}
            transmission={0.72}
            ior={1.46}
            thickness={0.5}
            transparent
            opacity={0.88}
          />
        </mesh>

        {/* Pulsating Inner Quantum Data Core */}
        <mesh>
          <sphereGeometry args={[0.18, 20, 20]} />
          <meshStandardMaterial
            color={isLocked ? '#facc15' : node.color}
            emissive={isLocked ? '#facc15' : node.color}
            emissiveIntensity={isLocked ? 3.2 : 1.8}
            roughness={0.1}
          />
        </mesh>

        {/* Crosshair Guidance Vector Fins */}
        <mesh>
          <boxGeometry args={[0.9, 0.015, 0.015]} />
          <meshBasicMaterial color={node.color} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <boxGeometry args={[0.9, 0.015, 0.015]} />
          <meshBasicMaterial color={node.color} />
        </mesh>

        {/* Magnetic Lock-On Reticle */}
        {isLocked && (
          <group position={[0, 0, 0.44]}>
            <mesh>
              <ringGeometry args={[0.5, 0.56, 32]} />
              <meshBasicMaterial color="#facc15" toneMapped={false} />
            </mesh>
            <mesh rotation={[0, 0, Math.PI / 4]}>
              <ringGeometry args={[0.62, 0.66, 4]} />
              <meshBasicMaterial color="#facc15" toneMapped={false} />
            </mesh>
          </group>
        )}

        {/* Solid #030A14 High-Contrast 3D Card Backing */}
        <mesh position={[0, -0.65, -0.01]} rotation={[-Math.PI / 12, 0, 0]}>
          <boxGeometry args={[1.08, 0.4, 0.02]} />
          <meshStandardMaterial color="#030A14" metalness={0.8} roughness={0.2} />
        </mesh>

        {/* High-Resolution Unclipped Dynamic Subnet Badge */}
        {texture && (
          <mesh position={[0, -0.65, 0.015]} rotation={[-Math.PI / 12, 0, 0]}>
            <planeGeometry args={[1.06, 0.38]} />
            <meshBasicMaterial map={texture} />
          </mesh>
        )}
      </group>
    </group>
  );
};
