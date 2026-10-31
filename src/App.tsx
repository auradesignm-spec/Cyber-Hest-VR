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
  ScenarioId,
  GameStatus,
  DifficultyLevel,
  CombatPhase,
  TrainingStepId,
  TrainingState,
  CinematicStep,
  ScorePopup,
  DataShard,
  PowerUpOrb,
  PowerUpType,
  ActivePowerUp,
  QuestionOption,
} from './types/game';
import {
  calculateComboMultiplier,
  isFeverTriggered,
  calculateHitScore,
  shouldDropDataShard,
} from './game/rules';
import { CURRICULUM_QUESTIONS } from './game/curriculum';
import { spatialAudio } from './audio/SpatialAudio';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { ServerRoom } from './components/ServerRoom';
import { PacketSwarm, PacketSwarmHandle } from './components/PacketSwarm';
import { Lasers, LaserHandle } from './components/Lasers';
import { ParticleSystem, ParticleSystemHandle } from './components/ParticleSystem';
import { VRPlayer, VRPlayerHandle, TargetNodeInfo } from './components/VRPlayer';
import { EducationalQuestion3D } from './components/EducationalQuestion3D';
import { MatrixCodeRain3D } from './components/MatrixCodeRain3D';
import { WarpTunnel3D } from './components/WarpTunnel3D';
import { TrainingSimulation } from './components/TrainingSimulation';
import { TrainingOverlay } from './components/TrainingOverlay';
import { StartScreen } from './components/StartScreen';
import { HUDOverlay } from './components/HUDOverlay';
import { RulebookModal } from './components/RulebookModal';
import { VictimServerNode3D } from './components/VictimServerNode3D';
import { FloatingScorePopups } from './components/FloatingScorePopups';
import { DataShards } from './components/DataShards';
import { PowerUpOrbs } from './components/PowerUpOrbs';
import { SplashHero3D } from './components/SplashHero3D';
import { ScenarioHub3D } from './components/ScenarioHub3D';
import { DifficultyHub3D } from './components/DifficultyHub3D';

// Module-level pre-allocated math objects (Zero allocations during gameplay)
const _camDir = new THREE.Vector3();
const _menuRay = new THREE.Ray();
const _menuSphere = new THREE.Sphere(new THREE.Vector3(), 0.85);
const _normRayDir = new THREE.Vector3();

/**
 * Scene Camera Rig: Coordinates the "Distant Core -> Forward Warp -> Close Combat" spatial mechanic
 * - Phase 1 (Decoding): Camera at [0, 1.6, 0.4], looking down corridor at Z: -10, FOV: 72
 * - Transition Dash: Camera rushes forward along Z from 0.4 to -25.0 with FOV stretching up to 115
 * - Phase 2 (Combat): Camera stationed at [0, 1.6, -25.0] directly in front of the Core at Z: -30
 * - Wave Reset: Camera rapidly warps backwards from -25.0 back to 0.4 for next round
 */
function SceneCamera({
  combatPhase,
  isCombatWarping,
  combatWarpProgress,
  combatWarpDirection,
  cinematicStep,
  isScreenShake = false,
}: {
  combatPhase: CombatPhase;
  isCombatWarping: boolean;
  combatWarpProgress: number;
  combatWarpDirection: 'forward' | 'backward' | null;
  cinematicStep: CinematicStep;
  isScreenShake?: boolean;
}) {
  const { camera } = useThree();

  useFrame((_, delta) => {
    camera.getWorldDirection(_camDir);
    spatialAudio.updateListener(
      camera.position.x,
      camera.position.y,
      camera.position.z,
      _camDir.x,
      _camDir.y,
      _camDir.z
    );

    // Screen shake on hit-stop / impact
    if (isScreenShake) {
      camera.position.x = (Math.random() - 0.5) * 0.08;
      camera.position.y = 1.6 + (Math.random() - 0.5) * 0.08;
    } else {
      camera.position.x = THREE.MathUtils.damp(camera.position.x, 0, 14, delta);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, 1.6, 14, delta);
    }

    let targetZ = 0.4;
    let targetLookZ = -10.0;
    let targetFov = 72;

    if (isCombatWarping) {
      const p = Math.min(1.0, Math.max(0.0, combatWarpProgress));
      // Cubic easing for visceral dash impulse
      const eased = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      const velocityPeak = Math.sin(p * Math.PI);

      if (combatWarpDirection === 'forward') {
        // Forward Dash towards the Core to Z: -20 (Core at Z: -30)
        targetZ = THREE.MathUtils.lerp(0.4, -20.0, eased);
        targetLookZ = -30.0;
        // Hyper-dash FOV dilation (stretching from 72 up to 115!)
        targetFov = 72 + velocityPeak * 43;
      } else if (combatWarpDirection === 'backward') {
        // Reverse Warp back to original station
        targetZ = THREE.MathUtils.lerp(-20.0, 0.4, eased);
        targetLookZ = -10.0;
        targetFov = 72 + velocityPeak * 36;
      }
    } else if (combatPhase === 'defense') {
      // Stationed right in front of Core at Z: -20 (Core at Z: -30)
      targetZ = -20.0;
      targetLookZ = -30.0;
      targetFov = 75;
    } else {
      // Default Phase 1 position
      targetZ = 0.4;
      targetLookZ = -10.0;
      targetFov = 72;
    }

    // Apply camera Z position
    if (isCombatWarping) {
      camera.position.z = targetZ;
    } else {
      camera.position.z = THREE.MathUtils.damp(camera.position.z, targetZ, 8, delta);
    }

    camera.lookAt(0, 1.5, targetLookZ);

    if ('fov' in camera) {
      const pCam = camera as THREE.PerspectiveCamera;
      pCam.fov = THREE.MathUtils.damp(pCam.fov, targetFov, 14, delta);
      pCam.updateProjectionMatrix();
    }
  });

  return null;
}

function MainGameApp() {
  const { language, setLanguage, isArabic, t } = useLanguage();

  // Query parameters for direct launch
  const queryParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const initialScenario = (queryParams.get('scenario') as ScenarioId) || 'scenario-1';
  const autoStart = queryParams.get('autostart') === '1';

  // Game States
  const [gameStatus, setGameStatus] = useState<GameStatus>(autoStart ? 'playing' : 'start');
  const [cinematicStep, setCinematicStep] = useState<CinematicStep>('splash');
  const [scenarioId, setScenarioId] = useState<ScenarioId>(initialScenario);
  const [selectedScenarioOption, setSelectedScenarioOption] = useState<ScenarioId | 'random'>('random');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');
  const [questionIndex, setQuestionIndex] = useState(0);

  // 2-Phase Gameplay Loop State: 'decoding' (Phase 1) vs 'defense' (Phase 2)
  const [combatPhase, setCombatPhase] = useState<CombatPhase>('decoding');
  const [hearts, setHearts] = useState(5);
  const [maxHearts] = useState(5);
  const [score, setScore] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(90);

  // Warp-To-Defend Camera State Machine
  const [isCombatWarping, setIsCombatWarping] = useState(false);
  const [combatWarpProgress, setCombatWarpProgress] = useState(0);
  const [combatWarpDirection, setCombatWarpDirection] = useState<'forward' | 'backward' | null>(null);

  // Addictive Arcade Mechanics State (Fever Mode, Hit-Stop, Shards & Power-Ups)
  const [overclockCombo, setOverclockCombo] = useState(0);
  const [isFeverMode, setIsFeverMode] = useState(false);
  const missGraceRef = useRef(0);
  const [scorePopups, setScorePopups] = useState<ScorePopup[]>([]);
  const [dataShards, setDataShards] = useState<DataShard[]>([]);
  const [powerUpOrbs, setPowerUpOrbs] = useState<PowerUpOrb[]>([]);
  const [activePowerUp, setActivePowerUp] = useState<ActivePowerUp | null>(null);
  const [blasterMuzzles, setBlasterMuzzles] = useState<[number, number, number][]>([]);
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem('cyber_heist_high_score') || '0', 10);
    } catch {
      return 0;
    }
  });
  const [isNewRecord, setIsNewRecord] = useState(false);

  // UI Overlays & Feedback Banners
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [lastTeamShout, setLastTeamShout] = useState<string | null>(null);
  const [alarmActive, setAlarmActive] = useState(false);
  const [screenShake, setScreenShake] = useState(false);
  const [redVignetteFlash, setRedVignetteFlash] = useState(false);
  const [educationalFeedback, setEducationalFeedback] = useState<{
    messageEn: string;
    messageAr: string;
    isCorrect: boolean;
  } | null>(null);
  const [phaseBanner, setPhaseBanner] = useState<{
    type: 'alarm' | 'purge' | 'overclock';
    messageEn: string;
    messageAr: string;
  } | null>(null);

  // Locked Target ID for Magnetic Aim Assist
  const [lockedTargetId, setLockedTargetId] = useState<string | number | null>(null);

  // Training Simulation State
  const [trainingState, setTrainingState] = useState<TrainingState>({
    step: 'welcome',
    leftFired: false,
    rightFired: false,
    packetsDestroyed: 0,
    lockedTargets: [],
    shotTargets: [],
    lastFeedback: null,
  });

  // Questions for current difficulty curriculum
  const currentQuestions = useMemo(() => {
    return CURRICULUM_QUESTIONS[difficulty] || CURRICULUM_QUESTIONS['medium'];
  }, [difficulty]);

  const currentQuestion = useMemo(() => {
    return currentQuestions[questionIndex % currentQuestions.length];
  }, [currentQuestions, questionIndex]);

  // Last Question Feedback
  const [lastQuestionResult, setLastQuestionResult] = useState<{
    optionId: string;
    isCorrect: boolean;
  } | null>(null);

  // Component Refs
  const packetSwarmRef = useRef<PacketSwarmHandle>(null);
  const lasersRef = useRef<LaserHandle>(null);
  const particlesRef = useRef<ParticleSystemHandle>(null);
  const vrPlayerRef = useRef<VRPlayerHandle>(null);

  // WebXR Store
  const xrStore = useMemo(() => createXRStore(), []);

  // Hit-Stop time dilation trigger (50ms micro-pause)
  const triggerHitStop = useCallback((durationMs = 50) => {
    setScreenShake(true);
    setTimeout(() => {
      setScreenShake(false);
    }, durationMs + 100);
  }, []);

  // Spawn dynamic 3D floating score billboard
  const spawnScorePopup = useCallback(
    (text: string, position: [number, number, number], color: string, scale = 1.0) => {
      const newPopup: ScorePopup = {
        id: `popup-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        text,
        position: [position[0], position[1], position[2]],
        color,
        scale,
        createdAt: Date.now(),
        duration: 1.1,
      };
      setScorePopups((prev) => [...prev.slice(-14), newPopup]);
    },
    []
  );

  // Spawn magnetic crystalline data shard
  const spawnDataShard = useCallback((x: number, y: number, z: number) => {
    const newShard: DataShard = {
      id: `shard-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      position: [x, y, z],
      velocity: [
        (Math.random() - 0.5) * 1.6,
        Math.random() * 1.2 + 0.3,
        (Math.random() - 0.5) * 1.6,
      ],
      collected: false,
      createdAt: Date.now(),
    };
    setDataShards((prev) => [...prev.slice(-10), newShard]);
  }, []);

  // Magnetic shard absorption handler
  const handleCollectShard = useCallback(
    (shardId: string, pos: [number, number, number]) => {
      setDataShards((prev) => prev.filter((s) => s.id !== shardId));
      spatialAudio.playShardPickup(pos[0], pos[1], pos[2]);
      particlesRef.current?.spawnSparks(pos[0], pos[1], pos[2], '#00f0ff');
      const bonus = isFeverMode ? 150 : 50;
      setScore((prev) => {
        const nextScore = prev + bonus;
        if (nextScore > highScore) {
          setHighScore(nextScore);
          setIsNewRecord(true);
          try {
            localStorage.setItem('cyber_heist_high_score', String(nextScore));
          } catch {}
        }
        return nextScore;
      });
      spawnScorePopup(`+${bonus} DATA`, pos, '#00f0ff', 0.95);
    },
    [isFeverMode, highScore, spawnScorePopup]
  );

  // Dynamic Shoot-to-Activate Power-Up Orb Collection
  const handleCollectPowerUp = useCallback(
    (orbId: string, type: PowerUpType, pos: [number, number, number]) => {
      setPowerUpOrbs((prev) => prev.filter((o) => o.id !== orbId));
      triggerHitStop(50);
      spatialAudio.playPowerupChime();
      particlesRef.current?.spawnSparks(
        pos[0],
        pos[1],
        pos[2],
        type === 'rapid_fire' ? '#ff8800' : type === 'emp_bomb' ? '#a855f7' : '#00f0ff'
      );
      particlesRef.current?.spawnVoxelShatter(pos[0], pos[1], pos[2], '#ffffff');

      if (type === 'rapid_fire') {
        setActivePowerUp({ type: 'rapid_fire', endTime: Date.now() + 8000 });
        spawnScorePopup('⚡ RAPID FIRE (8s)!', pos, '#ff8800', 1.3);
        setScore((s) => s + 250);
      } else if (type === 'emp_bomb') {
        packetSwarmRef.current?.destroyAll();
        spatialAudio.playEMPBlast();
        spawnScorePopup('💥 EMP PURGE ALL PACKETS!', pos, '#a855f7', 1.5);
        setScore((s) => s + 500);
      } else if (type === 'plasma_beam') {
        setActivePowerUp({ type: 'plasma_beam', endTime: Date.now() + 5000 });
        spatialAudio.playPlasmaBeamSound();
        spawnScorePopup('💠 PLASMA BEAM ACTIVE (5s)!', pos, '#00f0ff', 1.3);
        setScore((s) => s + 300);
      }
    },
    [triggerHitStop, spawnScorePopup]
  );

  // Periodic spawn of Power-Up Orbs in Phase 2
  useEffect(() => {
    if (gameStatus !== 'playing' || combatPhase !== 'defense') {
      setPowerUpOrbs([]);
      return;
    }

    const interval = setInterval(() => {
      setPowerUpOrbs((prev) => {
        if (prev.length >= 2) return prev;
        const types: PowerUpType[] = ['rapid_fire', 'emp_bomb', 'plasma_beam'];
        const chosenType = types[Math.floor(Math.random() * types.length)];
        const newOrb: PowerUpOrb = {
          id: `powerup-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          type: chosenType,
          position: [
            (Math.random() - 0.5) * 3.2,
            1.3 + Math.random() * 0.8,
            -23.5 - Math.random() * 2.5,
          ],
          createdAt: Date.now(),
          duration: 4000,
          collected: false,
        };
        return [...prev, newOrb];
      });
    }, 7000);

    return () => clearInterval(interval);
  }, [gameStatus, combatPhase]);

  // Expire stale power-up orbs & active effects
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setPowerUpOrbs((prev) => prev.filter((o) => now - o.createdAt < o.duration));
      setActivePowerUp((prev) => (prev && now > prev.endTime ? null : prev));
      setScorePopups((prev) => prev.filter((p) => now - p.createdAt < 1300));
      setDataShards((prev) => prev.filter((s) => now - s.createdAt < 12000));
    }, 200);
    return () => clearInterval(timer);
  }, []);

  // 1.5-Second Miss Grace Window decay timer
  useEffect(() => {
    if (gameStatus !== 'playing') return;
    const interval = setInterval(() => {
      if (missGraceRef.current > 0) {
        missGraceRef.current -= 0.1;
        if (missGraceRef.current <= 0) {
          missGraceRef.current = 0;
          setOverclockCombo(0);
          setIsFeverMode(false);
          spatialAudio.setFeverMode(false);
        }
      }
    }, 100);
    return () => clearInterval(interval);
  }, [gameStatus]);

  // Initial timer setup by difficulty
  const getInitialTimer = useCallback((diff: DifficultyLevel) => {
    if (diff === 'easy') return 120;
    if (diff === 'medium') return 90;
    return 60;
  }, []);

  // Start or Reset Scenario Game Loop
  const initScenario = useCallback(
    (targetScenario?: ScenarioId, newDifficulty?: DifficultyLevel) => {
      const activeDiff = newDifficulty || difficulty;
      if (newDifficulty) {
        setDifficulty(newDifficulty);
      }
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
      setHearts(5);
      setTimeRemaining(getInitialTimer(activeDiff));
      setGameStatus('playing');
      setCinematicStep('playing');
      setCombatPhase('decoding');
      setIsCombatWarping(false);
      setCombatWarpProgress(0);
      setCombatWarpDirection(null);
      setQuestionIndex(0);
      setOverclockCombo(0);
      setIsFeverMode(false);
      spatialAudio.setFeverMode(false);
      setScorePopups([]);
      setDataShards([]);
      setPowerUpOrbs([]);
      setActivePowerUp(null);
      missGraceRef.current = 0;
      setEducationalFeedback(null);
      setLastQuestionResult(null);
      setPhaseBanner(null);
      setLastTeamShout(null);
      setAlarmActive(false);
      spatialAudio.stopAlarmSiren();
      setLockedTargetId(null);
      spatialAudio.startAmbientHum();
    },
    [selectedScenarioOption, difficulty, getInitialTimer]
  );

  // Active 3D Target Nodes for Magnetic Aim Assist
  const activeTargets: TargetNodeInfo[] = useMemo(() => {
    if (gameStatus === 'training') {
      if (trainingState.step === 'welcome' || trainingState.step === 'blaster_basics') {
        const list: TargetNodeInfo[] = [];
        if (trainingState.packetsDestroyed < 1) {
          list.push({ id: 'drone-1', position: [-0.9, 1.6, -2.4], radius: 0.38 });
        }
        if (trainingState.packetsDestroyed < 2) {
          list.push({ id: 'drone-2', position: [0.9, 1.8, -2.4], radius: 0.38 });
        }
        return list;
      }
      if (trainingState.step === 'target_lock') {
        return [
          { id: 'pylon-alpha', position: [-1.4, 1.5, -2.8], radius: 0.42 },
          { id: 'pylon-beta', position: [0.0, 1.8, -3.2], radius: 0.42 },
          { id: 'pylon-gamma', position: [1.4, 1.5, -2.8], radius: 0.42 },
        ];
      }
      return [];
    }

    if (gameStatus === 'start') {
      if (cinematicStep === 'splash') {
        return [
          { id: 'btn-init-defense', position: [0.0, 1.5, -4.0], radius: 1.1 },
          { id: 'btn-manual', position: [-1.3, 0.85, -3.8], radius: 0.85 },
          { id: 'btn-lang', position: [1.3, 0.85, -3.8], radius: 0.85 },
          { id: 'btn-training', position: [0.0, 0.25, -3.8], radius: 1.1 },
        ];
      }
      if (cinematicStep === 'scenario_select') {
        return [
          { id: 'scenario-1', position: [-2.5, 1.5, -4.0], radius: 1.15 },
          { id: 'scenario-2', position: [0.0, 1.5, -4.0], radius: 1.15 },
          { id: 'scenario-3', position: [2.5, 1.5, -4.0], radius: 1.15 },
          { id: 'btn-back-splash', position: [-1.4, 0.3, -3.8], radius: 0.85 },
          { id: 'btn-next-difficulty', position: [1.4, 0.3, -3.8], radius: 0.85 },
        ];
      }
      if (cinematicStep === 'difficulty_select') {
        return [
          { id: 'diff-easy', position: [-2.5, 1.5, -4.0], radius: 1.15 },
          { id: 'diff-medium', position: [0.0, 1.5, -4.0], radius: 1.15 },
          { id: 'diff-hard', position: [2.5, 1.5, -4.0], radius: 1.15 },
          { id: 'btn-back-scenarios', position: [-1.4, 0.3, -3.8], radius: 0.85 },
          { id: 'btn-launch-mission', position: [1.4, 0.3, -3.8], radius: 0.85 },
        ];
      }
      return [];
    }

    if (gameStatus !== 'playing') return [];

    // Phase 1 (Decoding): The 3 horizontal Answer Badges at [-2.35, 1.0, -4.0], [0, 1.0, -4.0], [2.35, 1.0, -4.0]
    if (combatPhase === 'decoding' && !isCombatWarping) {
      const positions: [number, number, number][] = [
        [-2.35, 1.0, -4.0],
        [0.0, 1.0, -4.0],
        [2.35, 1.0, -4.0],
      ];
      return currentQuestion.options.map((opt: QuestionOption, idx: number) => ({
        id: opt.id,
        position: positions[idx] || [0, 1.0, -4.0],
        radius: 0.85,
      }));
    }

    // Phase 2 (Defense): Targets include dynamic Power-Up Orbs
    if (combatPhase === 'defense') {
      return powerUpOrbs.map((orb) => ({
        id: orb.id,
        position: orb.position,
        radius: 0.5,
      }));
    }

    return [];
  }, [gameStatus, cinematicStep, trainingState, combatPhase, currentQuestion, isCombatWarping, powerUpOrbs]);

  // Countdown Timer
  useEffect(() => {
    if (gameStatus !== 'playing') return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          spatialAudio.stopAlarmSiren();
          spatialAudio.playErrorBuzzer();
          vrPlayerRef.current?.triggerHeavyRumble();
          setGameStatus('gameover');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gameStatus]);

  // Threat Packet Breach handler (Core Damage in Phase 2)
  const handlePacketBreach = useCallback(() => {
    if (gameStatus !== 'playing') return;

    triggerHitStop(70);
    setOverclockCombo(0);
    setIsFeverMode(false);
    spatialAudio.setFeverMode(false);
    missGraceRef.current = 0;

    setScreenShake(true);
    setRedVignetteFlash(true);
    setTimeout(() => {
      setScreenShake(false);
      setRedVignetteFlash(false);
    }, 400);

    vrPlayerRef.current?.triggerHeavyRumble();
    spatialAudio.playErrorBuzzer();

    setHearts((prev) => {
      const next = prev - 1;
      if (next <= 0) {
        spatialAudio.stopAlarmSiren();
        spatialAudio.playErrorBuzzer();
        setGameStatus('gameover');
        return 0;
      }
      return next;
    });
  }, [gameStatus, triggerHitStop]);

  // Threat Packet Destroyed in Phase 2
  const handlePacketDestroyed = useCallback(
    (packetId: number, x: number, y: number, z: number) => {
      particlesRef.current?.spawnVoxelShatter(x, y, z, '#ef4444');
      triggerHitStop(40);
      missGraceRef.current = 0;

      // Arcade Combo & Fever Mode Logic
      setOverclockCombo((prev) => {
        const next = prev + 1;
        const currentMult = calculateComboMultiplier(next);
        const isFever = isFeverTriggered(next);

        if (isFever && !isFeverMode) {
          setIsFeverMode(true);
          spatialAudio.setFeverMode(true);
          spawnScorePopup('🔥 FEVER MODE ACTIVE! 🔥', [x, y + 0.5, z], '#f59e0b', 1.4);
        } else if (currentMult > calculateComboMultiplier(prev)) {
          spatialAudio.playComboMilestone(currentMult);
        }

        const pts = calculateHitScore(100, next, isFever || isFeverMode);
        setScore((s) => {
          const newScore = s + pts;
          if (newScore > highScore) {
            setHighScore(newScore);
            setIsNewRecord(true);
            try {
              localStorage.setItem('cyber_heist_high_score', String(newScore));
            } catch {}
          }
          return newScore;
        });

        const label = isFever || isFeverMode
          ? `+${pts} FEVER!`
          : currentMult > 1
          ? `+${pts} x${currentMult}`
          : `+${pts}`;

        spawnScorePopup(
          label,
          [x, y, z],
          isFever || isFeverMode ? '#f59e0b' : currentMult > 1 ? '#38bdf8' : '#ffffff',
          isFever ? 1.25 : currentMult > 1 ? 1.1 : 0.95
        );

        return next;
      });

      // 30% chance for magnetic data shard drop
      if (shouldDropDataShard()) {
        spawnDataShard(x, y, z);
      }

      // Check for Wave Clear (All Packets Eliminated)
      setTimeout(() => {
        const remaining = packetSwarmRef.current?.getActiveCount() || 0;
        if (remaining === 0 && combatPhase === 'defense' && !isCombatWarping) {
          // 1. Play System Secure victory fanfare
          spatialAudio.stopAlarmSiren();
          setAlarmActive(false);
          spatialAudio.playVictoryFanfare();

          setPhaseBanner({
            type: 'purge',
            messageEn: 'THREAT PURGED! WARPING BACK...',
            messageAr: 'تم تطهير التهديد! جاري الرجوع للنقطة الرئيسية...',
          });

          // 2. Animate camera rapidly warping BACKWARDS to original starting position (Z: 0.4)
          setIsCombatWarping(true);
          setCombatWarpDirection('backward');
          setCombatWarpProgress(0);
          spatialAudio.playWarpWhoosh(true);

          const startTime = performance.now();
          const duration = 1100;

          const animateBackWarp = (now: number) => {
            const elapsed = now - startTime;
            const p = Math.min(1.0, elapsed / duration);
            setCombatWarpProgress(p);

            if (p < 1.0) {
              requestAnimationFrame(animateBackWarp);
            } else {
              // Backward warp complete!
              spatialAudio.playWarpDecelerate();
              setIsCombatWarping(false);
              setCombatWarpDirection(null);
              setPhaseBanner(null);

              const isLastQuestion = questionIndex >= currentQuestions.length - 1;
              if (isLastQuestion) {
                setGameStatus('victory');
              } else {
                setQuestionIndex((prev) => prev + 1);
                setCombatPhase('decoding');
                setOverclockCombo(0);
                setIsFeverMode(false);
                spatialAudio.setFeverMode(false);
                setEducationalFeedback(null);
                setLastQuestionResult(null);
                setTimeRemaining((prev) => Math.min(getInitialTimer(difficulty), prev + 25));
              }
            }
          };

          requestAnimationFrame(animateBackWarp);
        }
      }, 100);
    },
    [
      combatPhase,
      isFeverMode,
      questionIndex,
      currentQuestions.length,
      difficulty,
      getInitialTimer,
      triggerHitStop,
      spawnScorePopup,
      spawnDataShard,
      highScore,
      isCombatWarping,
    ]
  );

  // Phase 1 Option Shot (Shoot-to-Solve) with Forward Warp Dash Transition
  const handleOptionShot = useCallback(
    (optionId: string, position: [number, number, number]) => {
      if (gameStatus !== 'playing' || combatPhase !== 'decoding' || isCombatWarping) return;

      const matchedOption = currentQuestion.options.find((opt: QuestionOption) => opt.id === optionId);
      const isCorrect = Boolean(matchedOption?.isCorrect);
      setLastQuestionResult({ optionId, isCorrect });

      if (isCorrect) {
        spatialAudio.playSuccessChime();
        particlesRef.current?.spawnSparks(position[0], position[1], position[2], '#00FF66');
        particlesRef.current?.spawnVoxelShatter(position[0], position[1], position[2], '#00FF66');
        setScore((prev) => prev + 500);

        // 1. INSTANTLY hide all Question and Answer UI panels
        setEducationalFeedback(null);
        setLastQuestionResult(null);

        // 2. The Forward Warp Dash Camera Animation: rapidly moves camera from Z: 0.4 to Z: -20
        setIsCombatWarping(true);
        setCombatWarpDirection('forward');
        setCombatWarpProgress(0);
        spatialAudio.playWarpWhoosh(false);

        const startTime = performance.now();
        const duration = 1100;

        const animateForwardWarp = (now: number) => {
          const elapsed = now - startTime;
          const p = Math.min(1.0, elapsed / duration);
          setCombatWarpProgress(p);

          if (p < 1.0) {
            requestAnimationFrame(animateForwardWarp);
          } else {
            // Forward Dash reaches destination! Camera abruptly stops in front of the Core at Z: -20
            setIsCombatWarping(false);
            setCombatWarpDirection(null);
            setCombatPhase('defense');
            spatialAudio.playWarpDecelerate();
            triggerHitStop(50);

            // Red emergency lights trigger, and malware swarm spawns around this new deep-Z area
            setAlarmActive(true);
            spatialAudio.startAlarmSiren();

            const packetCount = difficulty === 'easy' ? 6 : difficulty === 'medium' ? 8 : 10;
            packetSwarmRef.current?.spawnPenaltyPackets(packetCount);
          }
        };

        requestAnimationFrame(animateForwardWarp);
      } else {
        spatialAudio.playErrorBuzzer();
        vrPlayerRef.current?.triggerHeavyRumble();
        particlesRef.current?.spawnSparks(position[0], position[1], position[2], '#FF0055');
        particlesRef.current?.spawnVoxelShatter(position[0], position[1], position[2], '#FF0055');

        setScreenShake(true);
        setRedVignetteFlash(true);
        setTimeout(() => {
          setScreenShake(false);
          setRedVignetteFlash(false);
        }, 350);

        setHearts((prev) => {
          const next = prev - 1;
          if (next <= 0) {
            spatialAudio.stopAlarmSiren();
            setGameStatus('gameover');
            return 0;
          }
          return next;
        });

        setTimeout(() => {
          setLastQuestionResult(null);
        }, 1200);
      }
    },
    [gameStatus, combatPhase, currentQuestion, difficulty, isCombatWarping, triggerHitStop]
  );

  // Guided Training Hit Handler
  const handleTrainingTargetHit = useCallback(
    (targetId: string | number, pos: [number, number, number]) => {
      const step = trainingState.step;
      if (step === 'welcome' || step === 'blaster_basics') {
        particlesRef.current?.spawnVoxelShatter(pos[0], pos[1], pos[2], '#00ffcc');
        spatialAudio.playSuccessChime();
        setTrainingState((prev) => ({
          ...prev,
          packetsDestroyed: prev.packetsDestroyed + 1,
        }));
        return;
      }
      if (step === 'target_lock') {
        particlesRef.current?.spawnSparks(pos[0], pos[1], pos[2], '#00ffcc');
        spatialAudio.playSuccessChime();
        setTrainingState((prev) => {
          const idStr = String(targetId);
          if (prev.shotTargets.includes(idStr)) return prev;
          return {
            ...prev,
            shotTargets: [...prev.shotTargets, idStr],
          };
        });
      }
    },
    [trainingState.step]
  );

  // Start Training
  const handleStartTraining = useCallback(() => {
    setGameStatus('training');
    setHearts(5);
    setTimeRemaining(999);
    setAlarmActive(false);
    spatialAudio.stopAlarmSiren();
    setLockedTargetId(null);
    setTrainingState({
      step: 'welcome',
      leftFired: false,
      rightFired: false,
      packetsDestroyed: 0,
      lockedTargets: [],
      shotTargets: [],
      lastFeedback: null,
    });
    spatialAudio.startAmbientHum();
    spatialAudio.playButtonBeep(640);
  }, []);

  const handleTrainingSetStep = useCallback((stepId: TrainingStepId) => {
    spatialAudio.playButtonBeep(520);
    setTrainingState((prev) => ({
      ...prev,
      step: stepId,
      shotTargets: [],
      lastFeedback: null,
    }));
  }, []);

  const handleTrainingNextStep = useCallback(() => {
    spatialAudio.playButtonBeep(720);
    const steps: TrainingStepId[] = [
      'welcome',
      'blaster_basics',
      'target_lock',
      'scenario_firewall',
      'scenario_payload',
      'scenario_ddos',
      'graduation',
    ];
    setTrainingState((prev) => {
      const idx = steps.indexOf(prev.step);
      const nextStep = idx < steps.length - 1 ? steps[idx + 1] : 'graduation';
      return {
        ...prev,
        step: nextStep,
        shotTargets: [],
        lastFeedback: null,
      };
    });
  }, []);

  const handleTrainingPrevStep = useCallback(() => {
    spatialAudio.playButtonBeep(420);
    const steps: TrainingStepId[] = [
      'welcome',
      'blaster_basics',
      'target_lock',
      'scenario_firewall',
      'scenario_payload',
      'scenario_ddos',
      'graduation',
    ];
    setTrainingState((prev) => {
      const idx = steps.indexOf(prev.step);
      const prevStep = idx > 0 ? steps[idx - 1] : 'welcome';
      return {
        ...prev,
        step: prevStep,
        shotTargets: [],
        lastFeedback: null,
      };
    });
  }, []);

  const handleResetTraining = useCallback(() => {
    spatialAudio.playButtonBeep(480);
    setTrainingState({
      step: 'welcome',
      leftFired: false,
      rightFired: false,
      packetsDestroyed: 0,
      lockedTargets: [],
      shotTargets: [],
      lastFeedback: null,
    });
  }, []);

  const handleTriggerTrainingComms = useCallback(() => {
    spatialAudio.playButtonBeep(880);
    if (trainingState.step === 'scenario_firewall') {
      const text = isArabic
        ? 'فريق الطاولة: "الرمز 0x0050 بالدليل هو المنفذ 80 (HTTP)! أطلق على أسطوانة Port 80!"'
        : 'Table team shouts: "Code 0x0050 in the manual translates to Port 80 (HTTP)! Shoot Port 80!"';
      setLastTeamShout(text);
    } else if (trainingState.step === 'scenario_payload') {
      const text = isArabic
        ? 'فريق الطاولة: "تتابع أحمر-أزرق-أخضر هو برمجية فدية Ransomware! الدرع المطلوب هو AES-256!"'
        : 'Table team shouts: "Red-Blue-Green indicates Ransomware! Prescribed countermeasure is AES-256!"';
      setLastTeamShout(text);
    } else if (trainingState.step === 'scenario_ddos') {
      const text = isArabic
        ? 'فريق الطاولة: "الآي بي 192.168.4.110 يتبع النطاق Subnet Delta! أطلق على العقدة BETA لإطلاق نبضة EMP!"'
        : 'Table team shouts: "Attacker IP 192.168.4.110 routes to Subnet Delta on Node BETA! Shoot Node BETA for EMP shockwave!"';
      setLastTeamShout(text);
    } else {
      const text = isArabic
        ? 'فريق الطاولة: "أجهزة الاتصال جاهزة ومستقرة. ننتظر توجيهاتك!"'
        : 'Table team comms: "Comms link online and operational. Awaiting your report!"';
      setLastTeamShout(text);
    }
  }, [isArabic, trainingState.step]);

  // Shoot-to-Interact 3D Menu Selection Handler
  const handleMenuTargetHit = useCallback(
    (targetId: string | number) => {
      const idStr = String(targetId);
      spatialAudio.playButtonBeep(680);

      if (idStr === 'btn-init-defense') {
        spatialAudio.playWhoosh();
        setCinematicStep('scenario_select');
      } else if (idStr === 'btn-manual') {
        spatialAudio.playButtonBeep(640);
        setIsManualOpen(true);
      } else if (idStr === 'btn-training') {
        handleStartTraining();
      } else if (idStr === 'btn-lang') {
        setLanguage(isArabic ? 'en' : 'ar');
        spatialAudio.playButtonBeep(840);
      } else if (idStr === 'scenario-1' || idStr === 'scenario-2' || idStr === 'scenario-3') {
        setSelectedScenarioOption(idStr as ScenarioId);
        spatialAudio.playButtonBeep(750);
      } else if (idStr === 'btn-next-difficulty') {
        spatialAudio.playWhoosh();
        setCinematicStep('difficulty_select');
      } else if (idStr === 'btn-back-splash') {
        spatialAudio.playWhoosh();
        setCinematicStep('splash');
      } else if (idStr === 'diff-easy') {
        setDifficulty('easy');
        spatialAudio.playButtonBeep(600);
      } else if (idStr === 'diff-medium') {
        setDifficulty('medium');
        spatialAudio.playButtonBeep(720);
      } else if (idStr === 'diff-hard') {
        setDifficulty('hard');
        spatialAudio.playButtonBeep(880);
      } else if (idStr === 'btn-launch-mission') {
        spatialAudio.playWhoosh();
        initScenario(selectedScenarioOption === 'random' ? 'scenario-1' : selectedScenarioOption, difficulty);
      } else if (idStr === 'btn-back-scenarios') {
        spatialAudio.playWhoosh();
        setCinematicStep('scenario_select');
      }
    },
    [isArabic, setLanguage, handleStartTraining, selectedScenarioOption, difficulty, initScenario]
  );

  // Handle laser fire from VR controller or desktop mouse (Zero Allocations)
  const handleFireLaser = useCallback(
    (origin: THREE.Vector3, direction: THREE.Vector3, side: 'left' | 'right' | 'desktop', aimOrigin?: THREE.Vector3) => {
      const boltColor = isFeverMode
        ? '#f59e0b'
        : activePowerUp?.type === 'rapid_fire'
        ? '#ff8800'
        : activePowerUp?.type === 'plasma_beam'
        ? '#00f0ff'
        : overclockCombo >= 3
        ? '#FFC700'
        : side === 'left'
        ? '#ec4899'
        : '#00f0ff';

      // 1. Spawn traveling 3D volumetric energy bolt
      lasersRef.current?.fireBolt(origin, direction, boltColor, side, isFeverMode);

      // 2. Muzzle flash sparks
      particlesRef.current?.spawnSparks(origin.x, origin.y, origin.z, boltColor);

      const hitOrigin = aimOrigin || origin;
      _normRayDir.copy(direction).normalize();
      _menuRay.set(hitOrigin, _normRayDir);

      // 3. Shoot-to-Interact 3D Menu Targets
      if (gameStatus === 'start') {
        for (let i = 0; i < activeTargets.length; i++) {
          const target = activeTargets[i];
          _menuSphere.center.set(target.position[0], target.position[1], target.position[2]);
          _menuSphere.radius = target.radius || 0.85;

          if (_menuRay.intersectsSphere(_menuSphere)) {
            particlesRef.current?.spawnSparks(target.position[0], target.position[1], target.position[2], '#00f0ff');
            particlesRef.current?.spawnVoxelShatter(target.position[0], target.position[1], target.position[2], '#00f0ff');
            handleMenuTargetHit(target.id);
            return;
          }
        }
        return;
      }

      // 4. Training Mode dispatch
      if (gameStatus === 'training') {
        for (let i = 0; i < activeTargets.length; i++) {
          const target = activeTargets[i];
          _menuSphere.center.set(target.position[0], target.position[1], target.position[2]);
          _menuSphere.radius = target.radius || 0.45;
          if (_menuRay.intersectsSphere(_menuSphere)) {
            handleTrainingTargetHit(target.id, target.position);
          }
        }
        return;
      }

      // 5. Phase 2 (Defense): Check hit on power-up orbs & threat packets
      if (combatPhase === 'defense') {
        // Check power-up orbs
        for (let o = 0; o < powerUpOrbs.length; o++) {
          const orb = powerUpOrbs[o];
          _menuSphere.center.set(orb.position[0], orb.position[1], orb.position[2]);
          _menuSphere.radius = 0.5;
          if (_menuRay.intersectsSphere(_menuSphere)) {
            handleCollectPowerUp(orb.id, orb.type, orb.position);
            return;
          }
        }

        // Check threat packets
        const hitResult = packetSwarmRef.current?.checkRayHit(hitOrigin, direction);
        if (hitResult?.hit && hitResult.position) {
          particlesRef.current?.spawnSparks(hitResult.position.x, hitResult.position.y, hitResult.position.z, boltColor);
          missGraceRef.current = 0;
        } else {
          // Missed shot! Start 1.5-second miss grace window before combo resets
          if (overclockCombo > 0 && missGraceRef.current <= 0) {
            missGraceRef.current = 1.5;
          }
        }
      }

      // 6. Phase 1 (Decoding): Raycast against the 3 answer option badges
      if (combatPhase === 'decoding' && !isCombatWarping) {
        for (let i = 0; i < activeTargets.length; i++) {
          const target = activeTargets[i];
          _menuSphere.center.set(target.position[0], target.position[1], target.position[2]);
          _menuSphere.radius = target.radius || 0.75;
          if (_menuRay.intersectsSphere(_menuSphere)) {
            handleOptionShot(String(target.id), target.position);
            particlesRef.current?.spawnSparks(target.position[0], target.position[1], target.position[2], '#00f0ff');
          }
        }
      }
    },
    [
      gameStatus,
      combatPhase,
      isCombatWarping,
      activeTargets,
      isFeverMode,
      activePowerUp,
      overclockCombo,
      powerUpOrbs,
      handleOptionShot,
      handleCollectPowerUp,
      handleTrainingTargetHit,
      handleMenuTargetHit,
    ]
  );

  // Table Team Voice Shout Simulation
  const handleTriggerTeamShout = useCallback(() => {
    spatialAudio.playButtonBeep(880);

    if (currentQuestion) {
      const correctOpt = currentQuestion.options.find((o: QuestionOption) => o.isCorrect);
      const catLabel = isArabic ? currentQuestion.categoryLabelAr : currentQuestion.categoryLabelEn;
      const optLabel = isArabic ? (correctOpt?.labelAr || 'الحل الصحيح') : (correctOpt?.labelEn || 'Correct Countermeasure');
      const text = isArabic
        ? `فريق الطاولة يصرخ: "تحليل [${catLabel}] في الدليل يشير إلى: [${optLabel}]! أطلق على الشارة فوراً!"`
        : `Table team shouts: "Incident manual says [${catLabel}] requires: [${optLabel}]! Shoot target badge now!"`;
      setLastTeamShout(text);
    }
  }, [isArabic, currentQuestion]);

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
    <div
      className={`relative w-screen h-screen bg-[#020611] overflow-hidden select-none font-sans ${
        screenShake ? 'animate-bounce' : ''
      }`}
    >
      {/* Red Vignette Flash on Core damage or penalty */}
      {redVignetteFlash && (
        <div className="pointer-events-none fixed inset-0 z-40 bg-red-600/30 shadow-[inset_0_0_120px_rgba(239,68,68,0.9)] animate-ping" />
      )}

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
            {/* The Dynamic Scene Camera Rig driving the Forward/Backward Warp */}
            <SceneCamera
              combatPhase={combatPhase}
              isCombatWarping={isCombatWarping}
              combatWarpProgress={combatWarpProgress}
              combatWarpDirection={combatWarpDirection}
              cinematicStep={cinematicStep}
              isScreenShake={screenShake}
            />

            {/* AAA Server Room 3D Environment with Fever Mode Rhythmic Surge */}
            <ServerRoom
              isEmergency={alarmActive || combatPhase === 'defense' || hearts <= 2}
              isFeverMode={isFeverMode}
            />

            {/* 
              PHASE 1 (Q&A DECODING) - THE DISTANT CORE:
              The Protected Core sits deep at [0, 1.5, -40.0] leaving the center window crystal-clear!
              In Phase 2, the camera halts at Z: -25, bringing the player right in front of Core at Z: -30!
            */}
            {gameStatus !== 'start' && (
              <VictimServerNode3D
                combatPhase={combatPhase}
                scenarioId={scenarioId}
                language={language}
                hearts={hearts}
                maxHearts={maxHearts}
                isEmergency={alarmActive || combatPhase === 'defense' || hearts <= 2}
                position={[0, 1.5, -30.0]}
                scale={0.85}
              />
            )}

            {/* 3D Matrix Code Rain in Background on Start or High Score Celebration */}
            {((gameStatus === 'start' && cinematicStep === 'splash') || gameStatus === 'victory' || isNewRecord) && (
              <MatrixCodeRain3D active={true} />
            )}

            {/* 
              3D Warp Tunnel Dash (Forward Warp to Core & Backward Warp on Wave Clear)
              Displays relativistic light streaks and dynamic velocity tunnel
            */}
            <WarpTunnel3D
              active={isCombatWarping}
              reverse={combatWarpDirection === 'backward'}
              duration={1.1}
            />

            {/* GPU Particle Systems */}
            <ParticleSystem ref={particlesRef} />

            {/* Traveling High-Speed 3D Laser Bolts (with 3x thickness in Fever Mode) */}
            <Lasers
              ref={lasersRef}
              onBoltHit={(pos, color) => particlesRef.current?.spawnSparks(pos.x, pos.y, pos.z, color)}
              isFeverMode={isFeverMode}
            />

            {/* 3D Floating Score Popups (Dopamine Hits) */}
            <FloatingScorePopups popups={scorePopups} />

            {/* Magnetic Crystalline Data Shards (Loot Drops) */}
            <DataShards
              shards={dataShards}
              blasterPositions={blasterMuzzles}
              onCollectShard={handleCollectShard}
            />

            {/* Dynamic Shoot-to-Activate Power-Up Orbs (Phase 2 Close Combat) */}
            <PowerUpOrbs
              orbs={powerUpOrbs}
              language={language}
              lockedTargetId={lockedTargetId}
            />

            {/* Malicious Packet Swarm (Phase 2: Converges onto Core at [0, 1.5, -30]) */}
            <PacketSwarm
              ref={packetSwarmRef}
              scenarioId={scenarioId}
              difficulty={difficulty}
              active={gameStatus === 'playing' && combatPhase === 'defense'}
              onPacketDestroyed={handlePacketDestroyed}
              onPacketBreach={handlePacketBreach}
            />

            {/* VR Player Rig with Diegetic Blaster OLED & Wrist HUD */}
            <VRPlayer
              ref={vrPlayerRef}
              onFireLaser={handleFireLaser}
              onGripAction={() => spatialAudio.playButtonBeep(640)}
              health={(hearts / maxHearts) * 100}
              timeRemaining={timeRemaining}
              score={score}
              scenarioId={scenarioId}
              language={language}
              activeTargets={activeTargets}
              onTargetLockChanged={setLockedTargetId}
              combo={overclockCombo}
              multiplier={calculateComboMultiplier(overclockCombo)}
              isFeverMode={isFeverMode}
            />

            {/* Guided Training Simulation 3D Scene */}
            {gameStatus === 'training' && (
              <TrainingSimulation
                step={trainingState.step}
                language={language}
                lockedTargetId={lockedTargetId}
                leftFired={trainingState.leftFired}
                rightFired={trainingState.rightFired}
                packetsDestroyed={trainingState.packetsDestroyed}
                shotTargets={trainingState.shotTargets}
              />
            )}

            {/* 
              SPATIAL 3D SHOOT-TO-INTERACT MENUS (WebXR & Desktop):
              Crystal-clear solid #020612 cards arranged in strict grid layout
            */}
            {gameStatus === 'start' && cinematicStep === 'splash' && (
              <SplashHero3D
                language={language}
                onToggleLanguage={() => setLanguage(isArabic ? 'en' : 'ar')}
                onInitializeDefense={() => {
                  spatialAudio.playWhoosh();
                  setCinematicStep('scenario_select');
                }}
                onOpenManual={() => setIsManualOpen(true)}
                onStartTraining={handleStartTraining}
                lockedTargetId={lockedTargetId}
              />
            )}

            {gameStatus === 'start' && cinematicStep === 'scenario_select' && (
              <ScenarioHub3D
                language={language}
                selectedScenario={selectedScenarioOption}
                onSelectScenario={(sc) => {
                  setSelectedScenarioOption(sc);
                  spatialAudio.playButtonBeep(700);
                }}
                onBackToSplash={() => {
                  spatialAudio.playWhoosh();
                  setCinematicStep('splash');
                }}
                onNextDifficulty={() => {
                  spatialAudio.playWhoosh();
                  setCinematicStep('difficulty_select');
                }}
                lockedTargetId={lockedTargetId}
              />
            )}

            {gameStatus === 'start' && cinematicStep === 'difficulty_select' && (
              <DifficultyHub3D
                language={language}
                selectedDifficulty={difficulty}
                onSelectDifficulty={(d) => {
                  setDifficulty(d);
                  spatialAudio.playButtonBeep(720);
                }}
                onBackToScenarios={() => {
                  spatialAudio.playWhoosh();
                  setCinematicStep('scenario_select');
                }}
                onLaunchGame={() => {
                  spatialAudio.playWhoosh();
                  initScenario(selectedScenarioOption === 'random' ? 'scenario-1' : selectedScenarioOption, difficulty);
                }}
                lockedTargetId={lockedTargetId}
              />
            )}

            {/* 
              PHASE 1 (DECODING ONLY) - PERFECT FRAMING:
              Question Terminal at [0, 4.35, -5.0]
              Answer Badges at [-2.35, 1, -5], [0, 1, -5], [2.35, 1, -5]
              Preserved in memory with visible toggling to avoid shader recompilation
            */}
            <group visible={gameStatus !== 'training' && gameStatus === 'playing' && combatPhase === 'decoding' && !isCombatWarping}>
              <EducationalQuestion3D
                question={currentQuestion}
                questionIndex={questionIndex}
                totalQuestions={currentQuestions.length}
                language={language}
                lockedTargetId={lockedTargetId}
                onSelectOption={(optionId) => {
                  const target = activeTargets.find((t) => t.id === optionId);
                  handleOptionShot(optionId, target?.position || [0, 1.0, -5.0]);
                }}
                lastFeedback={lastQuestionResult}
              />
            </group>

            {/* Post-Processing Bloom & Vignette */}
            <EffectComposer multisampling={0}>
              <Bloom luminanceThreshold={0.9} mipmapBlur={false} intensity={0.12} />
              <ChromaticAberration
                offset={alarmActive ? new THREE.Vector2(0.0004, 0.0004) : new THREE.Vector2(0.0001, 0.0001)}
              />
              <Vignette eskil={false} offset={0.15} darkness={0.45} />
            </EffectComposer>
          </XR>
        </Canvas>
      </div>

      {/* 
        NON-BLOCKING SPATIAL HUD OVERLAY ON START (Allows full 3D shooting interaction)
      */}
      {gameStatus === 'start' && (
        <div className="pointer-events-none fixed inset-0 z-30 flex flex-col justify-between p-4 md:p-6">
          {/* Top Cyber Glass Header Bar */}
          <div className="pointer-events-auto flex items-center justify-between bg-[#000000] border-2 border-[#00f0ff] px-5 py-3 rounded-2xl shadow-[0_0_25px_rgba(0,240,255,0.4)] mx-auto w-full max-w-5xl">
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <div className="w-9 h-9 rounded-xl bg-[#000000] border-2 border-[#00f0ff] flex items-center justify-center text-[#00f0ff] shadow-[0_0_10px_rgba(0,240,255,0.4)]">
                🛡️
              </div>
              <div>
                <h1 className="text-sm md:text-base font-black tracking-widest text-[#ffffff] uppercase font-mono">
                  CYBER HEIST: NODE DEFENDER <span className="text-[#00f0ff] text-xs font-black">V3.0 SOC</span>
                </h1>
                <p className="text-[11px] text-[#ffffff] font-mono font-bold tracking-wider">
                  Asymmetric WebXR Defense // Shoot-to-Interact
                </p>
              </div>
            </div>

            {/* Center Hint */}
            <div className="hidden md:flex items-center space-x-2 text-xs font-mono font-black text-[#ffffff] bg-[#000000] border-2 border-[#00f0ff] px-3.5 py-1.5 rounded-xl shadow-[0_0_15px_rgba(0,240,255,0.3)]">
              <span>🎯</span>
              <span>AIM & SHOOT 3D TARGETS TO SELECT</span>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <button
                onClick={() => setLanguage(isArabic ? 'en' : 'ar')}
                className="no-game-shoot px-3 py-1.5 text-xs font-mono font-black bg-[#000000] hover:bg-[#00f0ff]/20 border-2 border-[#00f0ff] text-[#ffffff] rounded-xl transition shadow-[0_0_10px_rgba(0,240,255,0.3)] cursor-pointer"
              >
                {isArabic ? 'English' : 'عربي'}
              </button>
              <button
                onClick={handleEnterVR}
                className="no-game-shoot px-3.5 py-1.5 text-xs font-mono font-black bg-[#000000] hover:bg-[#00f0ff]/20 border-2 border-[#00f0ff] text-[#ffffff] rounded-xl transition shadow-[0_0_15px_rgba(0,240,255,0.5)] flex items-center space-x-1.5 cursor-pointer"
              >
                <span>🥽</span>
                <span>VR Mode (Quest 3)</span>
              </button>
              <button
                onClick={() => setIsManualOpen(true)}
                className="no-game-shoot px-3 py-1.5 text-xs font-mono font-black bg-[#000000] hover:bg-[#00f0ff]/20 border-2 border-[#00f0ff] text-[#ffffff] rounded-xl transition shadow-[0_0_10px_rgba(0,240,255,0.3)] cursor-pointer"
              >
                📖 {isArabic ? 'الدليل' : 'Manual'}
              </button>
              <button
                onClick={handleToggleMute}
                className="no-game-shoot p-2 text-xs bg-[#000000] hover:bg-[#00f0ff]/20 border-2 border-[#00f0ff] text-[#ffffff] rounded-xl transition shadow-[0_0_10px_rgba(0,240,255,0.3)] cursor-pointer"
              >
                {isMuted ? '🔇' : '🔊'}
              </button>
            </div>
          </div>

          {/* Bottom Aim & Fire Directive */}
          <div className="pointer-events-auto mx-auto bg-[#000000] border-2 border-[#00f0ff] px-6 py-2.5 rounded-full shadow-[0_0_25px_rgba(0,240,255,0.4)] text-center">
            <p className="text-xs md:text-sm font-mono font-black text-[#ffffff] flex items-center justify-center space-x-2">
              <span className="text-[#00f0ff] animate-pulse">⚡</span>
              <span>
                {cinematicStep === 'splash'
                  ? isArabic
                    ? 'أطلق الليزر على بطاقة [بدء الدفاع] أو [محاكاة التدريب]'
                    : 'Shoot laser at [INITIALIZE DEFENSE] or [TRAINING SIMULATION] target'
                  : cinematicStep === 'scenario_select'
                  ? isArabic
                    ? 'أطلق الليزر على أي بطاقة سيناريو لاختيار المهمة'
                    : 'Shoot laser at any scenario card (Hex Breach, Payload Purge, DDoS Blackhole)'
                  : isArabic
                  ? 'أطلق الليزر على مستوى الصعوبة ثم أطلق على [بدء المهمة]'
                  : 'Shoot laser at difficulty tier card, then shoot [LAUNCH MISSION]'}
              </span>
            </p>
          </div>
        </div>
      )}

      {/* In-Game Desktop HUD Overlay */}
      {gameStatus !== 'start' && gameStatus !== 'training' && (
        <HUDOverlay
          language={language}
          scenarioId={scenarioId}
          gameStatus={gameStatus}
          combatPhase={combatPhase}
          difficulty={difficulty}
          onChangeDifficulty={(newDiff) => initScenario(scenarioId, newDiff)}
          timeRemaining={timeRemaining}
          hearts={hearts}
          maxHearts={maxHearts}
          score={score}
          overclockCombo={overclockCombo}
          isOverclockActive={overclockCombo > 1}
          isFeverMode={isFeverMode}
          multiplier={calculateComboMultiplier(overclockCombo)}
          highScore={highScore}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onOpenManual={() => setIsManualOpen(true)}
          onRestartScenario={() => initScenario(scenarioId, difficulty)}
          onNextScenarioHub={() => setGameStatus('start')}
          onReturnToMenu={() => setGameStatus('start')}
          onOpenTraining={handleStartTraining}
          onTriggerTeamShout={handleTriggerTeamShout}
          lastTeamShout={lastTeamShout}
          educationalFeedback={educationalFeedback}
          phaseBanner={phaseBanner}
          vrActive={false}
        />
      )}

      {/* Training Mode Overlay */}
      {gameStatus === 'training' && (
        <TrainingOverlay
          trainingState={trainingState}
          language={language}
          onNextStep={handleTrainingNextStep}
          onPrevStep={handleTrainingPrevStep}
          onSetStep={handleTrainingSetStep}
          onResetTraining={handleResetTraining}
          onStartMainGame={() => initScenario()}
          onOpenManual={() => setIsManualOpen(true)}
          onTriggerCommsHint={handleTriggerTrainingComms}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          vrActive={false}
        />
      )}

      {/* Incident Rulebook Modal */}
      <RulebookModal
        isOpen={isManualOpen}
        onClose={() => setIsManualOpen(false)}
        language={language}
      />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <MainGameApp />
    </LanguageProvider>
  );
}
