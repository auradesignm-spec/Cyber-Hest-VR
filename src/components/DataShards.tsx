/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { DataShard } from '../types/game';

interface DataShardsProps {
  shards: DataShard[];
  blasterPositions?: [number, number, number][];
  onCollectShard: (id: string, position: [number, number, number]) => void;
}

const SingleShard: React.FC<{
  shard: DataShard;
  blasterPositions?: [number, number, number][];
  onCollect: (id: string, position: [number, number, number]) => void;
}> = ({ shard, blasterPositions, onCollect }) => {
  const meshRef = useRef<THREE.Group>(null);
  const currentPos = useRef(new THREE.Vector3(...shard.position));
  const velocity = useRef(new THREE.Vector3(shard.velocity[0], shard.velocity[1], shard.velocity[2]));
  const collectedRef = useRef(false);

  useFrame((state, delta) => {
    if (!meshRef.current || collectedRef.current) return;

    // Gentle floating hover & rotation
    meshRef.current.rotation.x += delta * 2.2;
    meshRef.current.rotation.y += delta * 3.1;

    // Check magnetic attraction to nearest blaster muzzle
    let pulled = false;
    if (blasterPositions && blasterPositions.length > 0) {
      for (const bp of blasterPositions) {
        const muzzleVec = new THREE.Vector3(bp[0], bp[1], bp[2]);
        const dist = currentPos.current.distanceTo(muzzleVec);

        // Magnetic suction range (up to 3.2 meters)
        if (dist < 3.2) {
          pulled = true;
          const pullDir = muzzleVec.clone().sub(currentPos.current).normalize();
          // Acceleration increases sharply the closer it gets
          const pullForce = Math.min(22.0, (4.5 / Math.max(dist, 0.2)) * 6.0);
          velocity.current.add(pullDir.multiplyScalar(pullForce * delta));

          // Collection threshold
          if (dist < 0.4) {
            collectedRef.current = true;
            onCollect(shard.id, [currentPos.current.x, currentPos.current.y, currentPos.current.z]);
            return;
          }
        }
      }
    }

    if (!pulled) {
      // Natural air drag and gentle hovering bobbing
      velocity.current.multiplyScalar(Math.max(0, 1 - delta * 2.5));
      currentPos.current.y += Math.sin(state.clock.elapsedTime * 4 + shard.createdAt) * 0.0015;
    }

    currentPos.current.addScaledVector(velocity.current, delta);
    meshRef.current.position.copy(currentPos.current);
  });

  return (
    <group ref={meshRef} position={shard.position}>
      {/* Glowing Inner Octahedron */}
      <mesh>
        <octahedronGeometry args={[0.09, 0]} />
        <meshStandardMaterial
          color="#00f3ff"
          emissive="#00e5ff"
          emissiveIntensity={2.8}
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>

      {/* Outer Wireframe Resonator Cage */}
      <mesh scale={[1.45, 1.45, 1.45]}>
        <octahedronGeometry args={[0.09, 0]} />
        <meshBasicMaterial
          color="#a5f3fc"
          wireframe
          transparent
          opacity={0.7}
        />
      </mesh>

      {/* Point light to cast dynamic cyan glow onto server floor/racks */}
      <pointLight color="#00ffff" intensity={0.8} distance={1.8} decay={2} />
    </group>
  );
};

export const DataShards: React.FC<DataShardsProps> = ({ shards, blasterPositions, onCollectShard }) => {
  return (
    <group>
      {shards.filter((s) => !s.collected).map((shard) => (
        <SingleShard
          key={shard.id}
          shard={shard}
          blasterPositions={blasterPositions}
          onCollect={onCollectShard}
        />
      ))}
    </group>
  );
};
