/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ServerRoomProps {
  isEmergency?: boolean;
}

export const ServerRoom: React.FC<ServerRoomProps> = ({ isEmergency = false }) => {
  const fansGroupRef = useRef<THREE.Group>(null);
  const fiberPulsesRef = useRef<THREE.Group>(null);
  const ceilingGridRef = useRef<THREE.Group>(null);
  const ledsMeshRef = useRef<THREE.InstancedMesh>(null);
  const strobe1Ref = useRef<THREE.Group>(null);
  const strobe2Ref = useRef<THREE.Group>(null);

  // Dynamic emergency lighting refs for randomized power grid fluctuations
  const ambientLightRef = useRef<THREE.AmbientLight>(null);
  const dirLightRef = useRef<THREE.DirectionalLight>(null);
  const centerPointLightRef = useRef<THREE.PointLight>(null);
  const leftPointLightRef = useRef<THREE.PointLight>(null);
  const rightPointLightRef = useRef<THREE.PointLight>(null);
  const rearAlertLightRef = useRef<THREE.PointLight>(null);

  // Strobe point lights and volumetric beam materials
  const strobe1LightRef = useRef<THREE.PointLight>(null);
  const strobe2LightRef = useRef<THREE.PointLight>(null);
  const strobe1BeamMat1Ref = useRef<THREE.MeshBasicMaterial>(null);
  const strobe1BeamMat2Ref = useRef<THREE.MeshBasicMaterial>(null);
  const strobe2BeamMat1Ref = useRef<THREE.MeshBasicMaterial>(null);
  const strobe2BeamMat2Ref = useRef<THREE.MeshBasicMaterial>(null);

  // Persistent voltage surge & brownout drop state (zero GC allocations during useFrame)
  const powerGridState = useRef({
    brownoutTimer: 1.8,
    brownoutDepth: 0,
  });

  // Server rack positions flanking the central aisle
  const rackPositions: [number, number, number][] = useMemo(
    () => [
      [-3.2, 1.6, -4.5],
      [-3.2, 1.6, -3.0],
      [-3.2, 1.6, -1.5],
      [-3.2, 1.6, 0.0],
      [-3.2, 1.6, 1.5],
      [-3.2, 1.6, 3.0],
      [3.2, 1.6, -4.5],
      [3.2, 1.6, -3.0],
      [3.2, 1.6, -1.5],
      [3.2, 1.6, 0.0],
      [3.2, 1.6, 1.5],
      [3.2, 1.6, 3.0],
      [-1.8, 1.6, 4.5],
      [0.0, 1.6, 4.5],
      [1.8, 1.6, 4.5],
    ],
    []
  );

  // Instanced LEDs matrix & colors (15 racks * 7 blades * 2 LEDs = 210 LEDs)
  const TOTAL_LEDS = rackPositions.length * 7 * 2;
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tempLedColor = useMemo(() => new THREE.Color(), []);
  const ledGeo = useMemo(() => new THREE.BoxGeometry(0.035, 0.035, 0.02), []);
  const ledMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#00f0ff',
        toneMapped: false,
      }),
    []
  );

  // Frame animations: fan rotations, traveling fiber pulse shader, ceiling security grid pulse, emergency strobes & dynamic lighting fluctuations
  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();

    // 1. Dynamic Power Grid & Emergency Light Intensity Fluctuations
    if (isEmergency) {
      // Rotate emergency ceiling strobes
      if (strobe1Ref.current) strobe1Ref.current.rotation.y += delta * 7.5;
      if (strobe2Ref.current) strobe2Ref.current.rotation.y += delta * 7.5;

      // Subtle multi-frequency electrical ripple (AC governor hunting and generator strain)
      const waveA = Math.sin(t * 6.8) * 0.14;
      const waveB = Math.sin(t * 14.3 + 1.1) * 0.09;
      const waveC = Math.cos(t * 27.6 + 0.5) * 0.05;

      // Sporadic electrical brownout micro-drop simulation (simulates heavy packet breach power draw)
      powerGridState.current.brownoutTimer -= delta;
      if (powerGridState.current.brownoutTimer <= 0) {
        // Sudden voltage dip of 18% - 36%
        powerGridState.current.brownoutDepth = 0.22 + (Math.sin(t * 31.7) * 0.5 + 0.5) * 0.18;
        // Schedule next brownout sag in 1.4 to 3.2 seconds
        powerGridState.current.brownoutTimer = 1.4 + (Math.cos(t * 19.3) * 0.5 + 0.5) * 1.8;
      } else {
        // Fast capacitor recovery to restore steady voltage
        powerGridState.current.brownoutDepth = THREE.MathUtils.damp(
          powerGridState.current.brownoutDepth,
          0,
          8.5,
          delta
        );
      }

      // Small voltage rebound surge
      const surge = Math.sin(t * 9.4) > 0.88 ? 0.15 : 0.0;
      const netFluctuation = 1.0 + waveA + waveB + waveC + surge - powerGridState.current.brownoutDepth;

      // Spatial phase divergence between central aisle, left corridor, and right corridor
      const centerFluct = THREE.MathUtils.clamp(netFluctuation, 0.42, 1.35);
      const leftFluct = THREE.MathUtils.clamp(netFluctuation + Math.sin(t * 8.9 + 0.7) * 0.1, 0.45, 1.4);
      const rightFluct = THREE.MathUtils.clamp(netFluctuation + Math.sin(t * 10.2 + 2.3) * 0.1, 0.45, 1.4);

      // Rotating strobe intensity with micro-stutter
      const strobeJitter = Math.sin(t * 22.0) * 0.12 + (Math.sin(t * 45.0) > 0.75 ? 0.25 : -0.08);
      const strobe1Target = 4.5 * THREE.MathUtils.clamp(netFluctuation + strobeJitter, 0.55, 1.45);
      const strobe2Target = 4.5 * THREE.MathUtils.clamp(netFluctuation - strobeJitter, 0.55, 1.45);

      // Smoothly damp light intensities to avoid jarring pop
      if (ambientLightRef.current) {
        ambientLightRef.current.intensity = THREE.MathUtils.damp(
          ambientLightRef.current.intensity,
          0.2 * centerFluct,
          12,
          delta
        );
      }
      if (dirLightRef.current) {
        dirLightRef.current.intensity = THREE.MathUtils.damp(
          dirLightRef.current.intensity,
          0.6 * centerFluct,
          12,
          delta
        );
      }
      if (centerPointLightRef.current) {
        centerPointLightRef.current.intensity = THREE.MathUtils.damp(
          centerPointLightRef.current.intensity,
          0.8 * centerFluct,
          14,
          delta
        );
      }
      if (leftPointLightRef.current) {
        leftPointLightRef.current.intensity = THREE.MathUtils.damp(
          leftPointLightRef.current.intensity,
          0.4 * leftFluct,
          12,
          delta
        );
      }
      if (rightPointLightRef.current) {
        rightPointLightRef.current.intensity = THREE.MathUtils.damp(
          rightPointLightRef.current.intensity,
          0.4 * rightFluct,
          12,
          delta
        );
      }
      if (rearAlertLightRef.current) {
        rearAlertLightRef.current.intensity = THREE.MathUtils.damp(
          rearAlertLightRef.current.intensity,
          4.0 * centerFluct,
          14,
          delta
        );
      }
      if (strobe1LightRef.current) {
        strobe1LightRef.current.intensity = THREE.MathUtils.damp(
          strobe1LightRef.current.intensity,
          strobe1Target,
          18,
          delta
        );
      }
      if (strobe2LightRef.current) {
        strobe2LightRef.current.intensity = THREE.MathUtils.damp(
          strobe2LightRef.current.intensity,
          strobe2Target,
          18,
          delta
        );
      }

      // Synchronize volumetric strobe cone beam opacities with fluctuating light levels
      const beamAlpha1 = THREE.MathUtils.clamp(0.3 * (strobe1Target / 4.5), 0.12, 0.48);
      const beamAlpha2 = THREE.MathUtils.clamp(0.3 * (strobe2Target / 4.5), 0.12, 0.48);
      if (strobe1BeamMat1Ref.current) strobe1BeamMat1Ref.current.opacity = beamAlpha1;
      if (strobe1BeamMat2Ref.current) strobe1BeamMat2Ref.current.opacity = beamAlpha1;
      if (strobe2BeamMat1Ref.current) strobe2BeamMat1Ref.current.opacity = beamAlpha2;
      if (strobe2BeamMat2Ref.current) strobe2BeamMat2Ref.current.opacity = beamAlpha2;
    } else {
      // Nominal steady-state lighting restoration
      if (ambientLightRef.current) {
        ambientLightRef.current.intensity = THREE.MathUtils.damp(ambientLightRef.current.intensity, 0.6, 8, delta);
      }
      if (dirLightRef.current) {
        dirLightRef.current.intensity = THREE.MathUtils.damp(dirLightRef.current.intensity, 1.5, 8, delta);
      }
      if (centerPointLightRef.current) {
        centerPointLightRef.current.intensity = THREE.MathUtils.damp(centerPointLightRef.current.intensity, 2.0, 8, delta);
      }
      if (leftPointLightRef.current) {
        leftPointLightRef.current.intensity = THREE.MathUtils.damp(leftPointLightRef.current.intensity, 1.5, 8, delta);
      }
      if (rightPointLightRef.current) {
        rightPointLightRef.current.intensity = THREE.MathUtils.damp(rightPointLightRef.current.intensity, 1.5, 8, delta);
      }
      if (rearAlertLightRef.current) {
        rearAlertLightRef.current.intensity = THREE.MathUtils.damp(rearAlertLightRef.current.intensity, 2.8, 8, delta);
      }
    }

    // 2. Rotate cooling fans
    if (fansGroupRef.current) {
      fansGroupRef.current.children.forEach((fan) => {
        fan.rotation.z += delta * (isEmergency ? 32.0 : 18.0);
      });
    }

    // 3. Pulse fiber optic emissive traveling lights
    if (fiberPulsesRef.current) {
      fiberPulsesRef.current.children.forEach((pulse, i) => {
        // Move traveling light packet along cable
        pulse.position.z = ((t * 2.5 + i * 2) % 16) - 8;
      });
    }

    // 4. Ceiling laser grid subtle breathing
    if (ceilingGridRef.current) {
      ceilingGridRef.current.children.forEach((beam, idx) => {
        const mat = (beam as THREE.Mesh).material as THREE.MeshBasicMaterial;
        mat.opacity = 0.35 + Math.sin(t * 3.0 + idx) * 0.2;
      });
    }

    // 5. Animate Instanced Server LED activity (zero GC allocation)
    if (ledsMeshRef.current) {
      let ledIdx = 0;
      rackPositions.forEach((pos, rackI) => {
        const isLeft = pos[0] < 0;
        const rotY = pos[2] > 4 ? Math.PI : isLeft ? Math.PI / 2 : -Math.PI / 2;
        const yBlades = [-1.1, -0.7, -0.3, 0.1, 0.5, 0.9, 1.2];

        yBlades.forEach((yOffset, bladeI) => {
          // LED 1: Activity
          const active = Math.sin(t * 8.0 + rackI * 3 + bladeI) > 0.1;
          tempLedColor.set(active ? (bladeI % 3 === 0 ? '#10b981' : '#00f0ff') : '#0284c7');
          ledsMeshRef.current!.setColorAt(ledIdx, tempLedColor);

          dummy.position.set(pos[0], pos[1] + yOffset, pos[2]);
          dummy.rotation.set(0, rotY, 0);
          dummy.translateX(0.3);
          dummy.translateZ(0.53);
          dummy.scale.set(1, 1, 1);
          dummy.updateMatrix();
          ledsMeshRef.current!.setMatrixAt(ledIdx, dummy.matrix);
          ledIdx++;

          // LED 2: Power / Alert
          const alertLed = (rackI + bladeI) % 11 === 0 && Math.sin(t * 5) > 0;
          tempLedColor.set(alertLed ? '#ef4444' : '#38bdf8');
          ledsMeshRef.current!.setColorAt(ledIdx, tempLedColor);

          dummy.position.set(pos[0], pos[1] + yOffset, pos[2]);
          dummy.rotation.set(0, rotY, 0);
          dummy.translateX(0.22);
          dummy.translateZ(0.53);
          dummy.scale.set(1, 1, 1);
          dummy.updateMatrix();
          ledsMeshRef.current!.setMatrixAt(ledIdx, dummy.matrix);
          ledIdx++;
        });
      });

      ledsMeshRef.current.instanceMatrix.needsUpdate = true;
      if (ledsMeshRef.current.instanceColor) {
        ledsMeshRef.current.instanceColor.needsUpdate = true;
      }
    }
  });

  return (
    <group name="ServerRoomEnvironment">
      {/* Dynamic Cyber Volumetric Fog (#030B14 palette) */}
      <fogExp2 attach="fog" args={['#030b14', 0.055]} />

      {/* Balanced Studio PBR Lighting Rig with Emergency Dimming & Subtle Power Fluctuations */}
      <ambientLight ref={ambientLightRef} intensity={isEmergency ? 0.2 : 0.6} color={isEmergency ? '#260a0a' : '#061824'} />
      <directionalLight
        ref={dirLightRef}
        position={[2.5, 5.5, 2.0]}
        intensity={isEmergency ? 0.6 : 1.5}
        color={isEmergency ? '#fca5a5' : '#e0f2fe'}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0005}
      />
      <pointLight ref={centerPointLightRef} position={[0, 3.4, 0]} intensity={isEmergency ? 0.8 : 2.0} distance={12} color={isEmergency ? '#dc2626' : '#00f0ff'} />
      <pointLight ref={leftPointLightRef} position={[-3.0, 2.0, -1.5]} intensity={isEmergency ? 0.4 : 1.5} distance={7} color="#00ffcc" />
      <pointLight ref={rightPointLightRef} position={[3.0, 2.0, -1.5]} intensity={isEmergency ? 0.4 : 1.5} distance={7} color="#00ffcc" />
      <pointLight ref={rearAlertLightRef} position={[0, 1.8, -4.8]} intensity={isEmergency ? 4.0 : 2.8} distance={10} color="#ef4444" />

      {/* Rotating Red Emergency Ceiling Strobes with Fluctuating Power (Active on Health < 30% or Scenario 3 DDoS) */}
      {isEmergency && (
        <group name="EmergencyCeilingStrobes">
          {/* Strobe 1 on Left Ceiling */}
          <group position={[-2.0, 3.9, -1.5]}>
            {/* Siren Housing Mount */}
            <mesh>
              <cylinderGeometry args={[0.18, 0.22, 0.14, 16]} />
              <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
            </mesh>
            <mesh position={[0, -0.09, 0]}>
              <sphereGeometry args={[0.12, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshBasicMaterial color="#ef4444" />
            </mesh>
            {/* Rotating Dual Red Beams */}
            <group ref={strobe1Ref} position={[0, -0.1, 0]}>
              <pointLight ref={strobe1LightRef} color="#ef4444" intensity={4.5} distance={10} />
              <mesh rotation={[0.4, 0, 0]} position={[0, -1.2, 0.8]}>
                <cylinderGeometry args={[0.02, 0.7, 2.6, 16, 1, true]} />
                <meshBasicMaterial ref={strobe1BeamMat1Ref} color="#ef4444" transparent opacity={0.3} side={THREE.DoubleSide} />
              </mesh>
              <mesh rotation={[-0.4, 0, Math.PI]} position={[0, -1.2, -0.8]}>
                <cylinderGeometry args={[0.02, 0.7, 2.6, 16, 1, true]} />
                <meshBasicMaterial ref={strobe1BeamMat2Ref} color="#ef4444" transparent opacity={0.3} side={THREE.DoubleSide} />
              </mesh>
            </group>
          </group>

          {/* Strobe 2 on Right Ceiling */}
          <group position={[2.0, 3.9, -1.5]}>
            <mesh>
              <cylinderGeometry args={[0.18, 0.22, 0.14, 16]} />
              <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
            </mesh>
            <mesh position={[0, -0.09, 0]}>
              <sphereGeometry args={[0.12, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshBasicMaterial color="#ef4444" />
            </mesh>
            <group ref={strobe2Ref} position={[0, -0.1, 0]}>
              <pointLight ref={strobe2LightRef} color="#ef4444" intensity={4.5} distance={10} />
              <mesh rotation={[0.4, 0, 0]} position={[0, -1.2, 0.8]}>
                <cylinderGeometry args={[0.02, 0.7, 2.6, 16, 1, true]} />
                <meshBasicMaterial ref={strobe2BeamMat1Ref} color="#ef4444" transparent opacity={0.3} side={THREE.DoubleSide} />
              </mesh>
              <mesh rotation={[-0.4, 0, Math.PI]} position={[0, -1.2, -0.8]}>
                <cylinderGeometry args={[0.02, 0.7, 2.6, 16, 1, true]} />
                <meshBasicMaterial ref={strobe2BeamMat2Ref} color="#ef4444" transparent opacity={0.3} side={THREE.DoubleSide} />
              </mesh>
            </group>
          </group>
        </group>
      )}

      {/* Main Floor: Highly Reflective Metallic PBR with Grid */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 24]} />
        <meshStandardMaterial
          color="#040914"
          roughness={0.18}
          metalness={0.88}
        />
      </mesh>

      {/* Hexagonal Player Security Platform */}
      <group position={[0, 0, 0]}>
        <mesh position={[0, 0.02, 0]} receiveShadow>
          <cylinderGeometry args={[1.6, 1.6, 0.04, 6]} />
          <meshStandardMaterial
            color="#081022"
            roughness={0.3}
            metalness={0.8}
          />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.041, 0]}>
          <ringGeometry args={[1.52, 1.58, 32]} />
          <meshBasicMaterial color="#00f0ff" transparent opacity={0.6} toneMapped={false} />
        </mesh>
      </group>

      {/* Floor Conduits with Glowing Fiber Lines */}
      {[-1.5, 0, 1.5].map((xOffset, i) => (
        <group key={`conduit-${i}`} position={[xOffset, 0.025, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.08, 18]} />
            <meshStandardMaterial
              color="#0284c7"
              emissive="#00f0ff"
              emissiveIntensity={0.6}
            />
          </mesh>
        </group>
      ))}

      {/* Ceiling & Overhead Cable Trays */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 4.2, 0]}>
        <planeGeometry args={[20, 24]} />
        <meshStandardMaterial color="#020612" roughness={0.7} metalness={0.5} />
      </mesh>

      {/* Ceiling Laser Security Grid */}
      <group ref={ceilingGridRef} position={[0, 4.0, 0]}>
        {[-3, -1.5, 0, 1.5, 3].map((x, i) => (
          <mesh key={`laser-line-x-${i}`} position={[x, 0, 0]}>
            <boxGeometry args={[0.015, 0.015, 18]} />
            <meshBasicMaterial color="#00ffcc" transparent opacity={0.4} toneMapped={false} />
          </mesh>
        ))}
        {[-6, -3, 0, 3, 6].map((z, j) => (
          <mesh key={`laser-line-z-${j}`} position={[0, 0, z]}>
            <boxGeometry args={[12, 0.015, 0.015]} />
            <meshBasicMaterial color="#00ffcc" transparent opacity={0.4} toneMapped={false} />
          </mesh>
        ))}
      </group>

      {/* Overhead Volumetric Light Shafts */}
      {[-1.8, 1.8].map((x, i) => (
        <group key={`shaft-${i}`} position={[x, 3.2, -1.5]} rotation={[0.2, 0, i === 0 ? 0.15 : -0.15]}>
          <mesh>
            <cylinderGeometry args={[0.15, 0.9, 3.2, 16, 1, true]} />
            <meshBasicMaterial
              color="#00f0ff"
              transparent
              opacity={0.06}
              blending={THREE.AdditiveBlending}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
        </group>
      ))}

      {/* Fiber Optic Cables with Traveling Pulse Packets */}
      <group position={[0, 3.8, 0]}>
        {[-1.5, 1.5].map((x, i) => (
          <group key={`fiber-cable-${i}`}>
            {/* Dark Cable Housing */}
            <mesh position={[x, 0, 0]}>
              <boxGeometry args={[0.08, 0.08, 16]} />
              <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
            </mesh>
          </group>
        ))}
        {/* Traveling light pulses */}
        <group ref={fiberPulsesRef}>
          {[-1.5, 1.5].map((x, i) => (
            <mesh key={`pulse-${i}`} position={[x, -0.05, 0]}>
              <sphereGeometry args={[0.06, 8, 8]} />
              <meshBasicMaterial color="#00ffcc" toneMapped={false} />
            </mesh>
          ))}
        </group>
      </group>

      {/* Procedural Server Racks */}
      {rackPositions.map((pos, idx) => {
        const isLeft = pos[0] < 0;
        const rotY = pos[2] > 4 ? Math.PI : isLeft ? Math.PI / 2 : -Math.PI / 2;

        return (
          <group key={`rack-${idx}`} position={pos} rotation={[0, rotY, 0]}>
            {/* 1. Heavy High-Grade Steel Chassis */}
            <mesh castShadow receiveShadow>
              <boxGeometry args={[0.9, 3.2, 1.0]} />
              <meshStandardMaterial color="#0a0f1d" metalness={0.92} roughness={0.2} />
            </mesh>

            {/* 2. Dark Tinted Acrylic Door */}
            <mesh position={[0, 0, 0.51]}>
              <boxGeometry args={[0.82, 3.0, 0.04]} />
              <meshStandardMaterial
                color="#020617"
                roughness={0.1}
                metalness={0.7}
                transparent
                opacity={0.8}
              />
            </mesh>

            {/* 3. Server Blades Front Face */}
            {[-1.1, -0.7, -0.3, 0.1, 0.5, 0.9, 1.2].map((yOffset, bladeIdx) => (
              <mesh key={`blade-${bladeIdx}`} position={[0, yOffset, 0.46]}>
                <boxGeometry args={[0.78, 0.12, 0.85]} />
                <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.3} />
              </mesh>
            ))}

            {/* 4. Top Exhaust Vents */}
            <mesh position={[0, 1.62, 0]}>
              <boxGeometry args={[0.85, 0.05, 0.9]} />
              <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.25} />
            </mesh>
          </group>
        );
      })}

      {/* Rotating Server Cooling Fans on Exhaust Columns */}
      <group ref={fansGroupRef}>
        {[-3.2, 3.2].map((x, i) => (
          <group key={`fan-col-${i}`} position={[x, 3.0, -4.5]}>
            {/* Fan Housing Grille */}
            <mesh rotation={[0, i === 0 ? Math.PI / 2 : -Math.PI / 2, 0]}>
              <torusGeometry args={[0.22, 0.03, 16, 24]} />
              <meshStandardMaterial color="#475569" metalness={0.9} />
            </mesh>
            {/* Rotating 4-Blade Fan */}
            <group rotation={[0, i === 0 ? Math.PI / 2 : -Math.PI / 2, 0]}>
              {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((angle, bIdx) => (
                <mesh key={`blade-part-${bIdx}`} rotation={[0, 0, angle]}>
                  <boxGeometry args={[0.04, 0.2, 0.005]} />
                  <meshStandardMaterial color="#0f172a" metalness={0.8} />
                </mesh>
              ))}
            </group>
          </group>
        ))}
      </group>

      {/* Instanced Server LEDs */}
      <instancedMesh
        ref={ledsMeshRef}
        args={[ledGeo, ledMat, TOTAL_LEDS]}
        frustumCulled={false}
      />

      {/* Room Enclosing Boundaries */}
      <mesh position={[0, 2.1, -7]} receiveShadow>
        <planeGeometry args={[20, 5]} />
        <meshStandardMaterial color="#030712" metalness={0.8} roughness={0.4} />
      </mesh>
      <mesh position={[-6, 2.1, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[24, 5]} />
        <meshStandardMaterial color="#030712" metalness={0.8} roughness={0.4} />
      </mesh>
      <mesh position={[6, 2.1, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[24, 5]} />
        <meshStandardMaterial color="#030712" metalness={0.8} roughness={0.4} />
      </mesh>
    </group>
  );
};
