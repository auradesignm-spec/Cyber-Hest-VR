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

// Module-level pre-allocated math objects (Zero allocations during gameplay)
const _muzzleVec = new THREE.Vector3();
const _shardPos = new THREE.Vector3();
const _shardVel = new THREE.Vector3();
const _pullDir = new THREE.Vector3();

const MAX_ACTIVE_SHARDS = 8;

export const DataShards: React.FC<DataShardsProps> = ({ shards, blasterPositions, onCollectShard }) => {
  const groupRefs = useRef<(THREE.Group | null)[]>([]);
  const internalPos = useRef<THREE.Vector3[]>(
    Array.from({ length: MAX_ACTIVE_SHARDS }, () => new THREE.Vector3())
  );
  const internalVel = useRef<THREE.Vector3[]>(
    Array.from({ length: MAX_ACTIVE_SHARDS }, () => new THREE.Vector3())
  );
  const initializedShards = useRef<Set<string>>(new Set());

  useFrame((state, delta) => {
    const uncollected = shards.filter((s) => !s.collected).slice(0, MAX_ACTIVE_SHARDS);

    for (let i = 0; i < MAX_ACTIVE_SHARDS; i++) {
      const grp = groupRefs.current[i];
      if (!grp) continue;

      const shard = uncollected[i];
      if (!shard) {
        grp.visible = false;
        continue;
      }

      grp.visible = true;

      // Initialize position on first appearance
      if (!initializedShards.current.has(shard.id)) {
        initializedShards.current.add(shard.id);
        internalPos.current[i].set(shard.position[0], shard.position[1], shard.position[2]);
        internalVel.current[i].set(shard.velocity[0], shard.velocity[1], shard.velocity[2]);
      }

      const pos = internalPos.current[i];
      const vel = internalVel.current[i];

      // Rotation
      grp.rotation.x += delta * 2.5;
      grp.rotation.y += delta * 3.5;

      // Magnetic attraction to player blaster / camera
      let pulled = false;
      const targetPos =
        blasterPositions && blasterPositions.length > 0
          ? _muzzleVec.set(blasterPositions[0][0], blasterPositions[0][1], blasterPositions[0][2])
          : _muzzleVec.set(state.camera.position.x, state.camera.position.y - 0.4, state.camera.position.z);

      const dist = pos.distanceTo(targetPos);
      if (dist < 4.5) {
        pulled = true;
        _pullDir.copy(targetPos).sub(pos).normalize();
        const pullForce = Math.min(26.0, (5.5 / Math.max(dist, 0.2)) * 7.5);
        vel.addScaledVector(_pullDir, pullForce * delta);

        // Collection threshold
        if (dist < 0.55) {
          onCollectShard(shard.id, [pos.x, pos.y, pos.z]);
          grp.visible = false;
          continue;
        }
      }

      if (!pulled) {
        vel.multiplyScalar(Math.max(0, 1 - delta * 2.2));
        pos.y += Math.sin(state.clock.elapsedTime * 4 + i) * 0.0015;
      }

      pos.addScaledVector(vel, delta);
      grp.position.copy(pos);
    }
  });

  return (
    <group name="DataShardsPool">
      {Array.from({ length: MAX_ACTIVE_SHARDS }, (_, idx) => (
        <group
          key={`shard-pool-${idx}`}
          ref={(el) => {
            groupRefs.current[idx] = el;
          }}
          visible={false}
        >
          {/* Glowing Inner Octahedron */}
          <mesh>
            <octahedronGeometry args={[0.08, 0]} />
            <meshBasicMaterial color="#00f3ff" />
          </mesh>

          {/* Outer Wireframe Resonator Cage */}
          <mesh scale={[1.4, 1.4, 1.4]}>
            <octahedronGeometry args={[0.08, 0]} />
            <meshBasicMaterial color="#a5f3fc" wireframe transparent opacity={0.75} />
          </mesh>
        </group>
      ))}
    </group>
  );
};
