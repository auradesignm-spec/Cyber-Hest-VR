/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { createXRStore, XR } from '@react-three/xr';
import { EffectComposer, Bloom, ChromaticAberration, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import {
  Language,
  ScenarioId,
  GameStatus,
  Scenario1Data,
  Scenario2Data,
  Scenario3Data,
} from './types/game';
import {
  generateScenario1,
  generateScenario2,
  generateScenario3,
  validatePortShot,
  validateCountermeasure,
  validateSubnetShot,
  HEX_PORT_TABLE,
} from './game/rules';
import { spatialAudio } from './audio/SpatialAudio';
import { ServerRoom } from './components/ServerRoom';
import { PacketSwarm, PacketSwarmHandle } from './components/PacketSwarm';
import { Lasers, LaserHandle } from './components/Lasers';
import { ParticleSystem, ParticleSystemHandle } from './components/ParticleSystem';
import { VRPlayer, VRPlayerHandle, TargetNodeInfo } from './components/VRPlayer';
import { Scenario1Firewall } from './components/Scenario1Firewall';
import { Scenario2Payload } from './components/Scenario2Payload';
import { Scenario3DDoS } from './components/Scenario3DDoS';
import { StartScreen } from './components/StartScreen';
import { HUDOverlay } from './components/HUDOverlay';
import { RulebookModal } from './components/RulebookModal';

/**
 * Scene Camera Rig: Sets eye level and updates Web Audio HRTF 3D positional listener in real time
 */
function SceneCamera() {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(0, 1.6, 0.4);
    camera.lookAt(0, 1.5, -4.5);
    camera.updateProjectionMatrix();
  }, [camera]);

  useFrame(() => {
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    spatialAudio.updateListener(
      camera.position.x,
      camera.position.y,
      camera.position.z,
      dir.x,
      dir.y,
      dir.z
    );
  });

  return null;
}

export default function App() {
  // Query parameters for testing / direct launch
  const queryParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const initialScenario = (queryParams.get('scenario') as ScenarioId) || 'scenario-1';
  const autoStart = queryParams.get('autostart') === '1';

  // Game States
  const [language, setLanguage] = useState<Language>('en');
  const [gameStatus, setGameStatus] = useState<GameStatus>(autoStart ? 'playing' : 'start');
  const [scenarioId, setScenarioId] = useState<ScenarioId>(initialScenario);
  const [selectedScenarioOption, setSelectedScenarioOption] = useState<ScenarioId | 'random'>('random');

  const [health, setHealth] = useState(100);
  const [score, setScore] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(90);
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [lastTeamShout, setLastTeamShout] = useState<string | null>(null);
  const [isInVR, setIsInVR] = useState(false);
  const [alarmActive, setAlarmActive] = useState(false);

  // Magnetic Aim Target Lock State
  const [lockedTargetId, setLockedTargetId] = useState<string | number | null>(null);

  // Scenario Data States
  const [scenario1Data, setScenario1Data] = useState<Scenario1Data>(() => generateScenario1(0));
  const [scenario2Data, setScenario2Data] = useState<Scenario2Data>(() => generateScenario2(0));
  const [scenario3Data, setScenario3Data] = useState<Scenario3Data>(() => generateScenario3(0));

  // Refs
  const vrPlayerRef = useRef<VRPlayerHandle>(null);
  const packetSwarmRef = useRef<PacketSwarmHandle>(null);
  const lasersRef = useRef<LaserHandle>(null);
  const particlesRef = useRef<ParticleSystemHandle>(null);

  // WebXR Store
  const xrStore = useMemo(() => createXRStore(), []);

  // Sync XR Store state
  useEffect(() => {
    const unsubscribe = xrStore.subscribe((state) => {
      const active = Boolean(state.session);
      setIsInVR(active);
      if (active && gameStatus === 'start') {
        setGameStatus('playing');
        spatialAudio.startAmbientHum();
      }
    });
    return () => unsubscribe();
  }, [xrStore, gameStatus]);

  // Compute Active 3D Target Nodes for Magnetic Aim Assist based on current Scenario
  const activeTargets: TargetNodeInfo[] = useMemo(() => {
    if (gameStatus !== 'playing') return [];

    if (scenarioId === 'scenario-1') {
      const positions: [number, number, number][] = [
        [-1.85, 1.65, -3.2],
        [-0.65, 1.95, -3.7],
        [0.65, 1.95, -3.7],
        [1.85, 1.65, -3.2],
      ];
      return scenario1Data.allPortOptions.slice(0, 4).map((port, idx) => ({
        id: port,
        position: positions[idx % positions.length],
        radius: 0.45,
      }));
    }

    if (scenarioId === 'scenario-2') {
      const positions: Record<string, [number, number, number]> = {
        'AES-256': [-1.85, 1.25, -2.2],
        'RSA-4096': [-0.65, 1.35, -1.8],
        'TLS-1.3': [0.65, 1.35, -1.8],
        'SHA-256': [1.85, 1.25, -2.2],
      };
      return scenario2Data.availableShields.map((shield) => ({
        id: shield.id,
        position: positions[shield.id] || [0, 1.3, -2],
        radius: 0.45,
      }));
    }

    if (scenarioId === 'scenario-3') {
      const positions: Record<string, [number, number, number]> = {
        ALPHA: [-2.1, 1.85, -2.8],
        BETA: [0.0, 2.25, -3.6],
        GAMMA: [2.1, 1.85, -2.8],
      };
      return scenario3Data.nodes.map((node) => ({
        id: node.id,
        position: positions[node.id] || [0, 2, -3],
        radius: 0.55,
      }));
    }

    return [];
  }, [scenarioId, scenario1Data, scenario2Data, scenario3Data, gameStatus]);

  // Start or Reset a Scenario
  const initScenario = useCallback(
    (targetScenario?: ScenarioId) => {
      let nextId = targetScenario;
      if (!nextId) {
        if (selectedScenarioOption === 'random') {
          const list: ScenarioId[] = ['scenario-1', 'scenario-2', 'scenario-3'];
          nextId = list[Math.floor(Math.random() * list.length)];
        } else {
          nextId = selectedScenarioOption;
        }
      }

      setScenarioId(nextId);
      setHealth(100);
      setTimeRemaining(90);
      setGameStatus('playing');
      setLastTeamShout(null);
      setAlarmActive(false);
      setLockedTargetId(null);
      spatialAudio.startAmbientHum();

      if (nextId === 'scenario-1') {
        setScenario1Data(generateScenario1());
      } else if (nextId === 'scenario-2') {
        setScenario2Data(generateScenario2());
      } else {
        setScenario3Data(generateScenario3());
      }
    },
    [selectedScenarioOption]
  );

  // Countdown Timer & Damage Alarms
  useEffect(() => {
    if (gameStatus !== 'playing') return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          spatialAudio.playErrorBuzzer();
          vrPlayerRef.current?.triggerHeavyRumble();
          setGameStatus('gameover');
          return 0;
        }
        if (prev <= 15) {
          setAlarmActive(true);
          if (prev % 3 === 0) {
            spatialAudio.playAlarmKlaxon();
          }
        } else {
          setAlarmActive(false);
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gameStatus]);

  // Handle packet reaching target (damage to health)
  const handlePacketBreach = useCallback(() => {
    if (gameStatus !== 'playing') return;
    setHealth((prev) => {
      const next = prev - 4;
      if (next <= 0) {
        spatialAudio.playErrorBuzzer();
        vrPlayerRef.current?.triggerHeavyRumble();
        setGameStatus('gameover');
        return 0;
      }
      return next;
    });
  }, [gameStatus]);

  // Laser Bolt hit on wall or packet
  const handleBoltImpact = useCallback((pos: THREE.Vector3, color: string) => {
    particlesRef.current?.spawnSparks(pos.x, pos.y, pos.z, color);
  }, []);

  // Packet destroyed (spawns voxel shatter + points)
  const handlePacketDestroyed = useCallback((packetId: number, x: number, y: number, z: number) => {
    particlesRef.current?.spawnVoxelShatter(x, y, z, '#ef4444');
    setScore((prev) => prev + 25);
    setHealth((prev) => Math.min(100, prev + 2));
  }, []);

  // SCENARIO 1: Port target shot
  const handlePortShot = useCallback(
    (portNumber: number) => {
      if (gameStatus !== 'playing') return;

      const isCorrect = validatePortShot(scenario1Data.targetHex, portNumber);
      if (isCorrect) {
        spatialAudio.playSuccessChime();
        setScore((prev) => prev + 500);
        packetSwarmRef.current?.destroyAll();
        setGameStatus('victory');
      } else {
        spatialAudio.playErrorBuzzer();
        vrPlayerRef.current?.triggerHeavyRumble();
        setHealth((prev) => {
          const next = prev - 20;
          if (next <= 0) {
            setGameStatus('gameover');
            return 0;
          }
          return next;
        });
      }
    },
    [gameStatus, scenario1Data.targetHex]
  );

  // SCENARIO 2: Protocol Orb shot
  const handleShieldApplied = useCallback(
    (shieldId: string) => {
      if (gameStatus !== 'playing') return;

      const isCorrect = validateCountermeasure(scenario2Data.correctShield, shieldId);
      if (isCorrect) {
        spatialAudio.playSuccessChime();
        setScore((prev) => prev + 500);
        setScenario2Data((prev) => ({ ...prev, cleansed: true }));
        packetSwarmRef.current?.destroyAll();
        particlesRef.current?.spawnSparks(0, 1.8, -2.5, '#10b981');
        setTimeout(() => setGameStatus('victory'), 1200);
      } else {
        spatialAudio.playErrorBuzzer();
        vrPlayerRef.current?.triggerHeavyRumble();
        setHealth((prev) => {
          const next = prev - 20;
          if (next <= 0) {
            setGameStatus('gameover');
            return 0;
          }
          return next;
        });
      }
    },
    [gameStatus, scenario2Data.correctShield]
  );

  // SCENARIO 3: Subnet Core Node shot
  const handleSubnetNodeShot = useCallback(
    (nodeId: 'ALPHA' | 'BETA' | 'GAMMA') => {
      if (gameStatus !== 'playing') return;

      const isCorrect = validateSubnetShot(scenario3Data.correctNodeId, nodeId);
      if (isCorrect) {
        spatialAudio.playEmpShockwave();
        setScore((prev) => prev + 600);
        setScenario3Data((prev) => ({ ...prev, neutralized: true }));
        packetSwarmRef.current?.destroyAll();
        particlesRef.current?.spawnVoxelShatter(0, 1.8, -2.8, '#00ffcc');
        setTimeout(() => setGameStatus('victory'), 1200);
      } else {
        spatialAudio.playErrorBuzzer();
        vrPlayerRef.current?.triggerHeavyRumble();
        setHealth((prev) => {
          const next = prev - 20;
          if (next <= 0) {
            setGameStatus('gameover');
            return 0;
          }
          return next;
        });
      }
    },
    [gameStatus, scenario3Data.correctNodeId]
  );

  // Handle laser fire from VR controller or desktop mouse (Aim, Lock & Shoot to Solve)
  const handleFireLaser = useCallback(
    (origin: THREE.Vector3, direction: THREE.Vector3, side: 'left' | 'right' | 'desktop', aimOrigin?: THREE.Vector3) => {
      if (gameStatus !== 'playing') return;

      const boltColor = side === 'left' ? '#ec4899' : '#00f0ff';
      // 1. Spawn traveling 3D volumetric energy bolt
      lasersRef.current?.fireBolt(origin, direction, boltColor, side);

      // 2. Muzzle flash sparks at weapon barrel
      particlesRef.current?.spawnSparks(origin.x, origin.y, origin.z, boltColor);

      // 3. Check hit on packet swarm (using aimOrigin for pinpoint desktop accuracy)
      const hitOrigin = aimOrigin || origin;
      const hitResult = packetSwarmRef.current?.checkRayHit(hitOrigin, direction);
      if (hitResult?.hit && hitResult.position) {
        particlesRef.current?.spawnSparks(hitResult.position.x, hitResult.position.y, hitResult.position.z, boltColor);
      }

      // 4. Universal Solver: Raycast against active scenario floating target nodes
      const ray = new THREE.Ray(hitOrigin, direction.clone().normalize());

      if (scenarioId === 'scenario-1') {
        activeTargets.forEach((target) => {
          const sphere = new THREE.Sphere(new THREE.Vector3(...target.position), target.radius || 0.45);
          if (ray.intersectsSphere(sphere)) {
            handlePortShot(Number(target.id));
            particlesRef.current?.spawnSparks(target.position[0], target.position[1], target.position[2], '#00ffcc');
          }
        });
      } else if (scenarioId === 'scenario-2') {
        activeTargets.forEach((target) => {
          const sphere = new THREE.Sphere(new THREE.Vector3(...target.position), target.radius || 0.45);
          if (ray.intersectsSphere(sphere)) {
            handleShieldApplied(String(target.id));
            particlesRef.current?.spawnSparks(target.position[0], target.position[1], target.position[2], '#ec4899');
          }
        });
      } else if (scenarioId === 'scenario-3') {
        activeTargets.forEach((target) => {
          const sphere = new THREE.Sphere(new THREE.Vector3(...target.position), target.radius || 0.55);
          if (ray.intersectsSphere(sphere)) {
            handleSubnetNodeShot(target.id as 'ALPHA' | 'BETA' | 'GAMMA');
            particlesRef.current?.spawnSparks(target.position[0], target.position[1], target.position[2], '#10b981');
          }
        });
      }
    },
    [gameStatus, scenarioId, activeTargets, handlePortShot, handleShieldApplied, handleSubnetNodeShot]
  );

  // Grip action handler
  const handleGripAction = useCallback(
    (hand: 'left' | 'right' | 'desktop') => {
      spatialAudio.playButtonBeep(640);
    },
    []
  );

  // Table Team Voice Shout Simulation
  const handleTriggerTeamShout = useCallback(() => {
    spatialAudio.playButtonBeep(880);

    if (scenarioId === 'scenario-1') {
      const match = HEX_PORT_TABLE.find((m) => m.hex === scenario1Data.targetHex);
      const text =
        language === 'ar'
          ? `الرمز ${scenario1Data.targetHex} بالدليل يعني المنفذ ${scenario1Data.correctPort} (${match?.service})! أطلق على هدف Port ${scenario1Data.correctPort} فوراً!`
          : `Table team shouts: "Code ${scenario1Data.targetHex} is Port ${scenario1Data.correctPort} (${match?.service})! Shoot Port ${scenario1Data.correctPort}!"`;
      setLastTeamShout(text);
    } else if (scenarioId === 'scenario-2') {
      const seqStr = scenario2Data.colorSequence.join('-');
      const text =
        language === 'ar'
          ? `تتابع الألوان [${seqStr}] هو هجوم ${scenario2Data.payloadName}! أطلق على كرة درع [${scenario2Data.correctShield}] لتطهير الراوتر!`
          : `Table team shouts: "Colors [${seqStr}] indicate ${scenario2Data.payloadName}! Shoot the ${scenario2Data.correctShield} orb to cleanse the node!"`;
      setLastTeamShout(text);
    } else {
      const correctNode = scenario3Data.nodes.find((n) => n.id === scenario3Data.correctNodeId);
      const text =
        language === 'ar'
          ? `الآي بي المهاجم ${scenario3Data.attackingIp} يقع ضمن ${scenario3Data.targetSubnetCidr}! أطلق على ${correctNode?.label || scenario3Data.correctNodeId} لإطلاق نبضة EMP!`
          : `Table team shouts: "Attacker IP ${scenario3Data.attackingIp} matches ${scenario3Data.targetSubnetCidr}! Shoot ${correctNode?.label || scenario3Data.correctNodeId} to trigger EMP!"`;
      setLastTeamShout(text);
    }
  }, [language, scenarioId, scenario1Data, scenario2Data, scenario3Data]);

  // Audio mute toggle
  const handleToggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      spatialAudio.setMuted(next);
      return next;
    });
  }, []);

  // Enter VR Action using WebXR store
  const handleEnterVR = useCallback(async () => {
    try {
      spatialAudio.startAmbientHum();
      await xrStore.enterVR();
      setGameStatus('playing');
    } catch (err) {
      console.warn('WebXR enterVR failed, launching Desktop Simulator fallback:', err);
      initScenario();
    }
  }, [xrStore, initScenario]);

  return (
    <div className="relative w-screen h-screen bg-slate-950 overflow-hidden select-none font-sans">
      {/* 3D WebXR Canvas Viewport */}
      <div className="absolute inset-0 z-0">
        <Canvas
          camera={{ position: [0, 1.6, 0.4], fov: 72 }}
          shadows
          gl={{
            antialias: true,
            powerPreference: 'high-performance',
            outputColorSpace: THREE.SRGBColorSpace,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.15,
          }}
        >
          <XR store={xrStore}>
            <SceneCamera />

            {/* AAA Server Room 3D Environment with Emergency Dimming & Rotating Strobes */}
            <ServerRoom isEmergency={health < 30 || scenarioId === 'scenario-3'} />

            {/* GPU/CPU Particle Systems (Sparks, Disintegration, Cyber Dust) */}
            <ParticleSystem ref={particlesRef} />

            {/* Traveling High-Speed 3D Laser Bolts */}
            <Lasers ref={lasersRef} onBoltHit={handleBoltImpact} />

            {/* Malicious Packet Swarm (InstancedMesh with Spatial Audio) */}
            <PacketSwarm
              ref={packetSwarmRef}
              scenarioId={scenarioId}
              active={gameStatus === 'playing'}
              onPacketDestroyed={handlePacketDestroyed}
              onPacketBreach={handlePacketBreach}
            />

            {/* VR Player Rig (Blasters with 3D OLED ammo display, Magnetic Aim Assist, Haptics, Wrist HUD) */}
            <VRPlayer
              ref={vrPlayerRef}
              onFireLaser={handleFireLaser}
              onGripAction={handleGripAction}
              health={health}
              timeRemaining={timeRemaining}
              score={score}
              scenarioId={scenarioId}
              language={language}
              activeTargets={activeTargets}
              onTargetLockChanged={setLockedTargetId}
            />

            {/* Scenario 1: Firewall Hex Code (Shoot Port Target to Seal Blast Door) */}
            {scenarioId === 'scenario-1' && (
              <Scenario1Firewall
                data={scenario1Data}
                active={gameStatus === 'playing' || gameStatus === 'victory'}
                onPortHit={handlePortShot}
                language={language}
                lockedTargetId={lockedTargetId}
                isVictory={gameStatus === 'victory'}
              />
            )}

            {/* Scenario 2: Corrupted Payload & Color Routing (Shoot Protocol Orb to Purge) */}
            {scenarioId === 'scenario-2' && (
              <Scenario2Payload
                data={scenario2Data}
                active={gameStatus === 'playing' || gameStatus === 'victory'}
                onShieldApplied={handleShieldApplied}
                language={language}
                lockedTargetId={lockedTargetId}
              />
            )}

            {/* Scenario 3: DDoS Subnet Blackhole (Shoot Massive Subnet Core Node to Trigger EMP) */}
            {scenarioId === 'scenario-3' && (
              <Scenario3DDoS
                data={scenario3Data}
                active={gameStatus === 'playing' || gameStatus === 'victory'}
                onNodeHit={handleSubnetNodeShot}
                language={language}
                lockedTargetId={lockedTargetId}
              />
            )}

            {/* AAA Post-Processing Pipeline (Active in Desktop mode, bypassed in Quest 3 native XR for 90 FPS) */}
            {!isInVR && (
              <EffectComposer multisampling={0}>
                <Bloom
                  luminanceThreshold={0.25}
                  mipmapBlur
                  intensity={1.2}
                />
                <ChromaticAberration
                  offset={alarmActive ? new THREE.Vector2(0.005, 0.005) : new THREE.Vector2(0.0008, 0.0008)}
                />
                <Vignette eskil={false} offset={0.15} darkness={0.75} />
              </EffectComposer>
            )}
          </XR>
        </Canvas>
      </div>

      {/* Start Screen (Visible on entry before entering VR) */}
      {gameStatus === 'start' && !isInVR && (
        <StartScreen
          language={language}
          onSelectLanguage={setLanguage}
          onEnterVR={handleEnterVR}
          onPlayDesktop={() => initScenario()}
          onOpenManual={() => setIsManualOpen(true)}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          selectedScenario={selectedScenarioOption}
          onSelectScenario={setSelectedScenarioOption}
        />
      )}

      {/* Diegetic Strictness: 2D Screen Overlays are ONLY rendered in desktop simulator mode; strictly removed in VR */}
      {gameStatus !== 'start' && !isInVR && (
        <HUDOverlay
          language={language}
          scenarioId={scenarioId}
          gameStatus={gameStatus}
          timeRemaining={timeRemaining}
          health={health}
          score={score}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onOpenManual={() => setIsManualOpen(true)}
          onRestartScenario={() => initScenario()}
          onReturnToMenu={() => setGameStatus('start')}
          onTriggerTeamShout={handleTriggerTeamShout}
          lastTeamShout={lastTeamShout}
          vrActive={isInVR}
        />
      )}

      {/* Interactive Incident Response Manual Modal */}
      <RulebookModal
        language={language}
        isOpen={isManualOpen}
        onClose={() => setIsManualOpen(false)}
      />
    </div>
  );
}
