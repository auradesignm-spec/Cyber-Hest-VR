/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import * as THREE from 'three';

/**
 * 3D High-Tech Server Room
 * Built with procedural groups: modular server rack towers, glowing fiber cable trays,
 * glowing floor conduits, status light strips, and central holographic pedestal.
 */
export const ServerRoomScene: React.FC = () => {
  // Reusable materials and geometries for optimal draw call count
  const { rackChassisGeo, rackPanelGeo, serverBladeGeo, rackPositions } = useMemo(() => {
    const rackChassisGeo = new THREE.BoxGeometry(0.9, 3.2, 1.0);
    const rackPanelGeo = new THREE.BoxGeometry(0.82, 3.0, 0.04);
    const serverBladeGeo = new THREE.BoxGeometry(0.78, 0.12, 0.85);

    // Positions for server racks flanking the room
    const positions: [number, number, number][] = [
      // Left aisle
      [-3.2, 1.6, -4.5],
      [-3.2, 1.6, -3.0],
      [-3.2, 1.6, -1.5],
      [-3.2, 1.6, 0.0],
      [-3.2, 1.6, 1.5],
      [-3.2, 1.6, 3.0],
      // Right aisle
      [3.2, 1.6, -4.5],
      [3.2, 1.6, -3.0],
      [3.2, 1.6, -1.5],
      [3.2, 1.6, 0.0],
      [3.2, 1.6, 1.5],
      [3.2, 1.6, 3.0],
      // Back wall row
      [-1.8, 1.6, 4.5],
      [0.0, 1.6, 4.5],
      [1.8, 1.6, 4.5],
    ];

    return { rackChassisGeo, rackPanelGeo, serverBladeGeo, rackPositions: positions };
  }, []);

  return (
    <group name="ServerRoomEnvironment">
      {/* Lighting Rig */}
      <ambientLight intensity={0.8} color="#0f2b3c" />
      <directionalLight
        position={[2, 6, 2]}
        intensity={1.8}
        color="#e0f2fe"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0005}
      />
      <pointLight position={[0, 3.5, 0]} intensity={2.5} distance={14} color="#00f0ff" />
      <pointLight position={[-3.0, 2.0, -2.0]} intensity={2.0} distance={8} color="#38bdf8" />
      <pointLight position={[3.0, 2.0, -2.0]} intensity={2.0} distance={8} color="#38bdf8" />
      <pointLight position={[0, 1.8, -4.5]} intensity={3.0} distance={10} color="#ef4444" />

      {/* Main Floor with Cyber Grid */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 24]} />
        <meshStandardMaterial
          color="#060913"
          roughness={0.25}
          metalness={0.8}
        />
      </mesh>

      {/* Hexagonal Player Platform / Stationary Zone */}
      <group position={[0, 0.02, 0]}>
        <mesh position={[0, 0.02, 0]} receiveShadow>
          <cylinderGeometry args={[1.6, 1.6, 0.04, 6]} />
          <meshStandardMaterial
            color="#0b1329"
            roughness={0.4}
            metalness={0.7}
          />
        </mesh>
        {/* Subtle Glowing Platform Rim on Floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.041, 0]}>
          <ringGeometry args={[1.52, 1.58, 32]} />
          <meshBasicMaterial color="#0284c7" transparent opacity={0.4} />
        </mesh>
      </group>

      {/* Floor Glowing Conduits / Fiber Lines */}
      {[-1.5, 0, 1.5].map((xOffset, i) => (
        <mesh
          key={`conduit-${i}`}
          position={[xOffset, 0.025, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[0.08, 18]} />
          <meshBasicMaterial color="#0284c7" transparent opacity={0.4} />
        </mesh>
      ))}

      {/* Ceiling & Overhead Cable Trays */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 4.2, 0]}>
        <planeGeometry args={[20, 24]} />
        <meshStandardMaterial color="#030712" roughness={0.8} />
      </mesh>

      {/* Overhead Glowing Light Panels */}
      {[-2, 0, 2].map((x, i) => (
        <group key={`light-tray-${i}`} position={[x, 4.0, 0]}>
          <mesh>
            <boxGeometry args={[0.3, 0.06, 14]} />
            <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.3} />
          </mesh>
          <mesh position={[0, -0.04, 0]}>
            <boxGeometry args={[0.15, 0.02, 13.8]} />
            <meshBasicMaterial color="#38bdf8" toneMapped={false} />
          </mesh>
        </group>
      ))}

      {/* Server Racks Built as Procedural 4-Part Groups */}
      {rackPositions.map((pos, idx) => {
        const isLeft = pos[0] < 0;
        const rotY = pos[2] > 4 ? Math.PI : isLeft ? Math.PI / 2 : -Math.PI / 2;

        return (
          <group key={`rack-${idx}`} position={pos} rotation={[0, rotY, 0]}>
            {/* 1. Main Steel Chassis */}
            <mesh geometry={rackChassisGeo} castShadow receiveShadow>
              <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.25} />
            </mesh>

            {/* 2. Dark Acrylic Front Screen / Mesh Door */}
            <mesh geometry={rackPanelGeo} position={[0, 0, 0.51]}>
              <meshStandardMaterial
                color="#020617"
                roughness={0.2}
                metalness={0.5}
                transparent
                opacity={0.85}
              />
            </mesh>

            {/* 3. Server Blades with Activity LEDs */}
            {[-1.1, -0.7, -0.3, 0.1, 0.5, 0.9, 1.2].map((yOffset, bladeIdx) => {
              const ledColor =
                (idx + bladeIdx) % 7 === 0
                  ? '#ef4444' // Error red
                  : (idx + bladeIdx) % 3 === 0
                  ? '#10b981' // Online green
                  : '#00f0ff'; // Data cyan

              return (
                <group key={`blade-${bladeIdx}`} position={[0, yOffset, 0.45]}>
                  {/* Blade Face */}
                  <mesh geometry={serverBladeGeo}>
                    <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.4} />
                  </mesh>
                  {/* Status LED Pin */}
                  <mesh position={[0.3, 0, 0.08]}>
                    <boxGeometry args={[0.04, 0.04, 0.02]} />
                    <meshBasicMaterial color={ledColor} toneMapped={false} />
                  </mesh>
                  <mesh position={[0.22, 0, 0.08]}>
                    <boxGeometry args={[0.04, 0.04, 0.02]} />
                    <meshBasicMaterial color="#38bdf8" toneMapped={false} />
                  </mesh>
                </group>
              );
            })}

            {/* 4. Top Exhaust Vents */}
            <mesh position={[0, 1.62, 0]}>
              <boxGeometry args={[0.85, 0.05, 0.9]} />
              <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.3} />
            </mesh>
          </group>
        );
      })}

      {/* Atmospheric Server Room Back Walls */}
      <mesh position={[0, 2.1, -7]} receiveShadow>
        <planeGeometry args={[20, 5]} />
        <meshStandardMaterial color="#050a14" metalness={0.7} roughness={0.5} />
      </mesh>
      <mesh position={[-6, 2.1, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[24, 5]} />
        <meshStandardMaterial color="#050a14" metalness={0.7} roughness={0.5} />
      </mesh>
      <mesh position={[6, 2.1, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[24, 5]} />
        <meshStandardMaterial color="#050a14" metalness={0.7} roughness={0.5} />
      </mesh>
    </group>
  );
};
