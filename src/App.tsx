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
  DifficultyLevel,
  Scenario1Data,
  Scenario2Data,
  Scenario3Data,
  TrainingStepId,
  TrainingState,
  CinematicStep,
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
import { CURRICULUM_QUESTIONS } from './game/curriculum';
import { spatialAudio } from './audio/SpatialAudio';
import { ServerRoom } from './components/ServerRoom';
import { PacketSwarm, PacketSwarmHandle } from './components/PacketSwarm';
import { Lasers, LaserHandle } from './components/Lasers';
import { ParticleSystem, ParticleSystemHandle } from './components/ParticleSystem';
import { VRPlayer, VRPlayerHandle, TargetNodeInfo } from './components/VRPlayer';
import { EducationalQuestion3D } from './components/EducationalQuestion3D';
import { MatrixCodeRain3D } from './components/MatrixCodeRain3D';
import { WarpTunnel3D } from './components/WarpTunnel3D';
import { SplashHero3D } from './components/SplashHero3D';
import { ScenarioHub3D } from './components/ScenarioHub3D';
import { DifficultyHub3D } from './components/DifficultyHub3D';
import { Scenario1Firewall } from './components/Scenario1Firewall';
import { Scenario2Payload } from './components/Scenario2Payload';
import { Scenario3DDoS } from './components/Scenario3DDoS';
import { TrainingSimulation } from './components/TrainingSimulation';
import { TrainingOverlay } from './components/TrainingOverlay';
import { StartScreen } from './components/StartScreen';
import { HUDOverlay } from './components/HUDOverlay';
import { RulebookModal } from './components/RulebookModal';
import { Glasses, BookOpen, GraduationCap, Volume2, VolumeX, Sparkles } from 'lucide-react';

/**
 * Scene Camera Rig: Sets eye level, coordinates dynamic warp transitions, and updates Web Audio HRTF listener
 */
function SceneCamera({ cinematicStep }: { cinematicStep: CinematicStep }) {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(0, 1.6, 0.4);
    camera.lookAt(0, 1.5, -4.5);
    camera.updateProjectionMatrix();
  }, [camera]);

  useFrame((_, delta) => {
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

    // Subtle physical camera momentum during forward and reverse warp transitions
    if (cinematicStep.startsWith('warp_to_')) {
      camera.position.z = THREE.MathUtils.damp(camera.position.z, -0.6, 3.5, delta);
    } else if (cinematicStep.startsWith('warp_reverse_')) {
      camera.position.z = THREE.MathUtils.damp(camera.position.z, 1.2, 3.5, delta);
    } else {
      camera.position.z = THREE.MathUtils.damp(camera.position.z, 0.4, 6.0, delta);
    }
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
  const [cinematicStep, setCinematicStep] = useState<CinematicStep>('splash');
  const [scenarioId, setScenarioId] = useState<ScenarioId>(initialScenario);
  const [selectedScenarioOption, setSelectedScenarioOption] = useState<ScenarioId | 'random'>('random');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [educationalFeedback, setEducationalFeedback] = useState<{
    messageEn: string;
    messageAr: string;
    isCorrect: boolean;
  } | null>(null);
  const [lastQuestionResult, setLastQuestionResult] = useState<{
    optionId: string;
    isCorrect: boolean;
  } | null>(null);

  const currentQuestions = useMemo(() => CURRICULUM_QUESTIONS[difficulty], [difficulty]);
  const currentQuestion = currentQuestions[questionIndex % currentQuestions.length];

  const getInitialTimer = useCallback((diff: DifficultyLevel) => {
    if (diff === 'easy') return 120;
    if (diff === 'hard') return 60;
    return 90;
  }, []);

  const [health, setHealth] = useState(100);
  const [score, setScore] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(90);
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [lastTeamShout, setLastTeamShout] = useState<string | null>(null);
  const [isInVR, setIsInVR] = useState(false);
  const [alarmActive, setAlarmActive] = useState(false);

  // Guided Training Simulation State
  const [trainingState, setTrainingState] = useState<TrainingState>({
    step: 'welcome',
    leftFired: false,
    rightFired: false,
    packetsDestroyed: 0,
    lockedTargets: [],
    shotTargets: [],
    lastFeedback: null,
  });

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
        spatialAudio.startAmbientHum();
      }
    });
    return () => unsubscribe();
  }, [xrStore, gameStatus]);

  // Compute Active 3D Target Nodes for Magnetic Aim Assist based on current Cinematic Step & Gameplay Scenario
  const activeTargets: TargetNodeInfo[] = useMemo(() => {
    // 1. Cinematic 3D Hubs (Step 1, Step 2, Step 3)
    if (gameStatus === 'start') {
      if (cinematicStep === 'splash') {
        return [
          { id: 'cta_initialize', position: [0, 1.4, -3.8], radius: 0.65 },
          { id: 'cta_manual', position: [-1.25, 0.85, -3.8], radius: 0.5 },
          { id: 'cta_lang', position: [1.25, 0.85, -3.8], radius: 0.5 },
        ];
      }
      if (cinematicStep === 'scenario_select') {
        return [
          { id: 'scenario-1', position: [-2.3, 1.6, -3.4], radius: 0.75 },
          { id: 'scenario-2', position: [0.0, 1.6, -3.4], radius: 0.75 },
          { id: 'scenario-3', position: [2.3, 1.6, -3.4], radius: 0.75 },
          { id: 'back_splash', position: [0, 0.25, -3.0], radius: 0.5 },
        ];
      }
      if (cinematicStep === 'difficulty_select') {
        return [
          { id: 'easy', position: [-2.3, 1.6, -3.4], radius: 0.75 },
          { id: 'medium', position: [0.0, 1.6, -3.4], radius: 0.75 },
          { id: 'hard', position: [2.3, 1.6, -3.4], radius: 0.75 },
          { id: 'back_scenarios', position: [0, 0.25, -3.0], radius: 0.5 },
        ];
      }
      return [];
    }

    // 2. Training mode target nodes
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
      if (trainingState.step === 'scenario_firewall') {
        return [
          { id: 22, position: [-1.8, 1.6, -3.1], radius: 0.45 },
          { id: 80, position: [-0.6, 1.85, -3.1], radius: 0.45 },
          { id: 443, position: [0.6, 1.85, -3.1], radius: 0.45 },
          { id: 53, position: [1.8, 1.6, -3.1], radius: 0.45 },
        ];
      }
      if (trainingState.step === 'scenario_payload') {
        return [
          { id: 'AES-256', position: [-1.5, 1.45, -2.4], radius: 0.45 },
          { id: 'RSA-4096', position: [-0.5, 1.6, -2.4], radius: 0.45 },
          { id: 'TLS-1.3', position: [0.5, 1.6, -2.4], radius: 0.45 },
          { id: 'SHA-256', position: [1.5, 1.45, -2.4], radius: 0.45 },
        ];
      }
      if (trainingState.step === 'scenario_ddos') {
        return [
          { id: 'ALPHA', position: [-1.8, 1.8, -2.8], radius: 0.55 },
          { id: 'BETA', position: [0.0, 2.15, -3.1], radius: 0.55 },
          { id: 'GAMMA', position: [1.8, 1.8, -2.8], radius: 0.55 },
        ];
      }
      if (trainingState.step === 'graduation') {
        return [{ id: 'trophy', position: [0, 1.9, -2.2], radius: 0.5 }];
      }
      return [];
    }

    if (gameStatus !== 'playing') return [];

    // 3. Educational Shoot-to-Solve Solution Badges (Y: 1.25m, Z: -3.5m)
    const positions: [number, number, number][] = [
      [-1.55, 1.25, -3.5],
      [0.0, 1.25, -3.5],
      [1.55, 1.25, -3.5],
    ];
    return currentQuestion.options.map((opt, idx) => ({
      id: opt.id,
      position: positions[idx] || [0, 1.25, -3.5],
      radius: 0.55,
    }));
  }, [gameStatus, cinematicStep, trainingState, currentQuestion]);

  // Start or Reset a Scenario
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
      setHealth(100);
      setTimeRemaining(getInitialTimer(activeDiff));
      setGameStatus('playing');
      setCinematicStep('playing');
      setQuestionIndex(0);
      setEducationalFeedback(null);
      setLastQuestionResult(null);
      setLastTeamShout(null);
      setAlarmActive(false);
      setLockedTargetId(null);
      spatialAudio.startAmbientHum();
    },
    [selectedScenarioOption, difficulty, getInitialTimer]
  );

  // Cinematic 4-Step Navigation Handlers (with 3D Warp Time Tunnel Transitions)
  const handleStartWarpToScenarios = useCallback(() => {
    spatialAudio.playButtonBeep(640);
    spatialAudio.playWarpWhoosh(false);
    setCinematicStep('warp_to_scenario');
  }, []);

  const handleCompleteWarpToScenarios = useCallback(() => {
    spatialAudio.playWarpDecelerate();
    setCinematicStep('scenario_select');
  }, []);

  const handleSelectScenario = useCallback((sc: ScenarioId) => {
    setScenarioId(sc);
    setSelectedScenarioOption(sc);
    spatialAudio.playButtonBeep(720);
    spatialAudio.playWarpWhoosh(false);
    setCinematicStep('warp_to_difficulty');
  }, []);

  const handleCompleteWarpToDifficulty = useCallback(() => {
    spatialAudio.playWarpDecelerate();
    setCinematicStep('difficulty_select');
  }, []);

  const handleSelectDifficulty = useCallback(
    (diff: DifficultyLevel) => {
      setDifficulty(diff);
      spatialAudio.playButtonBeep(880);
      spatialAudio.playWarpWhoosh(false);
      setCinematicStep('warp_to_game');
    },
    []
  );

  const handleCompleteWarpToGame = useCallback(() => {
    spatialAudio.playWarpDecelerate();
    initScenario(scenarioId, difficulty);
  }, [initScenario, scenarioId, difficulty]);

  const handleBackToSplash = useCallback(() => {
    spatialAudio.playButtonBeep(420);
    spatialAudio.playWarpWhoosh(true);
    setCinematicStep('warp_reverse_to_splash');
  }, []);

  const handleCompleteWarpReverseToSplash = useCallback(() => {
    spatialAudio.playWarpDecelerate();
    setCinematicStep('splash');
  }, []);

  const handleBackToScenarios = useCallback(() => {
    spatialAudio.playButtonBeep(420);
    spatialAudio.playWarpWhoosh(true);
    setCinematicStep('warp_reverse_to_scenario');
  }, []);

  const handleCompleteWarpReverseToScenarios = useCallback(() => {
    spatialAudio.playWarpDecelerate();
    setCinematicStep('scenario_select');
  }, []);

  const handleChangeDifficulty = useCallback(
    (newDiff: DifficultyLevel) => {
      spatialAudio.playButtonBeep(640);
      initScenario(undefined, newDiff);
    },
    [initScenario]
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

  // 3-Tier Educational Question Answer Handler (Shoot-to-Solve)
  const handleOptionShot = useCallback(
    (optionId: string, position: [number, number, number]) => {
      if (gameStatus !== 'playing') return;

      const matchedOption = currentQuestion.options.find((opt) => opt.id === optionId);
      const isCorrect = Boolean(matchedOption?.isCorrect);
      setLastQuestionResult({ optionId, isCorrect });

      const explanationEn = matchedOption?.explanationEn || (isCorrect ? 'Correct protocol selected!' : 'Security violation detected.');
      const explanationAr = matchedOption?.explanationAr || (isCorrect ? 'تم اختيار البروتوكول الصحيح!' : 'تم رصد انتهاك أمني.');

      if (isCorrect) {
        spatialAudio.playSuccessChime();
        particlesRef.current?.spawnSparks(position[0], position[1], position[2], '#10b981');
        particlesRef.current?.spawnVoxelShatter(0, 3.5, -5.0, '#10b981');
        setScore((prev) => prev + 500);
        packetSwarmRef.current?.destroyAll();

        setEducationalFeedback({
          messageEn: `CORRECT: ${explanationEn}`,
          messageAr: `إجابة صحيحة: ${explanationAr}`,
          isCorrect: true,
        });

        const isLastQuestion = questionIndex >= currentQuestions.length - 1;
        setTimeout(() => {
          if (isLastQuestion) {
            setGameStatus('victory');
          } else {
            setQuestionIndex((prev) => prev + 1);
            setLastQuestionResult(null);
            setEducationalFeedback(null);
            setTimeRemaining((prev) => Math.min(getInitialTimer(difficulty), prev + 20));
          }
        }, 1600);
      } else {
        spatialAudio.playErrorBuzzer();
        vrPlayerRef.current?.triggerHeavyRumble();
        particlesRef.current?.spawnSparks(position[0], position[1], position[2], '#ef4444');
        setAlarmActive(true);
        setTimeout(() => setAlarmActive(false), 900);

        setScore((prev) => Math.max(0, prev - 50));
        setHealth((prev) => {
          const next = prev - 15;
          if (next <= 0) {
            setGameStatus('gameover');
            return 0;
          }
          return next;
        });

        setEducationalFeedback({
          messageEn: `INCORRECT: ${explanationEn}`,
          messageAr: `إجابة خاطئة: ${explanationAr}`,
          isCorrect: false,
        });

        setTimeout(() => {
          setLastQuestionResult(null);
        }, 1200);
      }
    },
    [gameStatus, currentQuestion, questionIndex, currentQuestions.length, difficulty, getInitialTimer]
  );

  // SCENARIO 1: Port target shot (Legacy fallback)
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
        return;
      }

      if (step === 'scenario_firewall') {
        if (Number(targetId) === 80) {
          particlesRef.current?.spawnSparks(pos[0], pos[1], pos[2], '#10b981');
          spatialAudio.playSuccessChime();
          setTrainingState((prev) => ({
            ...prev,
            shotTargets: ['80'],
          }));
        } else {
          particlesRef.current?.spawnSparks(pos[0], pos[1], pos[2], '#ef4444');
          spatialAudio.playErrorBuzzer();
          vrPlayerRef.current?.triggerHeavyRumble();
        }
        return;
      }

      if (step === 'scenario_payload') {
        if (targetId === 'AES-256') {
          particlesRef.current?.spawnSparks(pos[0], pos[1], pos[2], '#10b981');
          spatialAudio.playSuccessChime();
          setTrainingState((prev) => ({
            ...prev,
            shotTargets: ['AES-256'],
          }));
        } else {
          particlesRef.current?.spawnSparks(pos[0], pos[1], pos[2], '#ef4444');
          spatialAudio.playErrorBuzzer();
          vrPlayerRef.current?.triggerHeavyRumble();
        }
        return;
      }

      if (step === 'scenario_ddos') {
        if (targetId === 'BETA') {
          particlesRef.current?.spawnVoxelShatter(pos[0], pos[1], pos[2], '#00ffcc');
          spatialAudio.playEmpShockwave();
          setTrainingState((prev) => ({
            ...prev,
            shotTargets: ['BETA'],
          }));
        } else {
          particlesRef.current?.spawnSparks(pos[0], pos[1], pos[2], '#ef4444');
          spatialAudio.playErrorBuzzer();
          vrPlayerRef.current?.triggerHeavyRumble();
        }
        return;
      }

      if (step === 'graduation') {
        particlesRef.current?.spawnSparks(pos[0], pos[1], pos[2], '#10b981');
        spatialAudio.playSuccessChime();
      }
    },
    [trainingState.step]
  );

  // Training Navigation Handlers
  const handleStartTraining = useCallback(() => {
    setGameStatus('training');
    setHealth(100);
    setTimeRemaining(999);
    setAlarmActive(false);
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
      const text = language === 'ar'
        ? 'فريق الطاولة: "الرمز 0x0050 بالدليل هو المنفذ 80 (HTTP)! أطلق على أسطوانة Port 80!"'
        : 'Table team shouts: "Code 0x0050 in the manual translates to Port 80 (HTTP)! Shoot Port 80!"';
      setLastTeamShout(text);
    } else if (trainingState.step === 'scenario_payload') {
      const text = language === 'ar'
        ? 'فريق الطاولة: "تتابع أحمر-أزرق-أخضر هو برمجية فدية Ransomware! الدرع المطلوب هو AES-256!"'
        : 'Table team shouts: "Red-Blue-Green indicates Ransomware! Prescribed countermeasure is AES-256!"';
      setLastTeamShout(text);
    } else if (trainingState.step === 'scenario_ddos') {
      const text = language === 'ar'
        ? 'فريق الطاولة: "الآي بي 192.168.4.110 يتبع النطاق Subnet Delta! أطلق على العقدة BETA لإطلاق نبضة EMP!"'
        : 'Table team shouts: "Attacker IP 192.168.4.110 routes to Subnet Delta on Node BETA! Shoot Node BETA for EMP shockwave!"';
      setLastTeamShout(text);
    } else {
      const text = language === 'ar'
        ? 'فريق الطاولة: "أجهزة الاتصال جاهزة ومستقرة. ننتظر توجيهاتك!"'
        : 'Table team comms: "Comms link online and operational. Awaiting your report!"';
      setLastTeamShout(text);
    }
  }, [language, trainingState.step]);

  // Handle laser fire from VR controller or desktop mouse (Aim, Lock & Shoot to Solve)
  const handleFireLaser = useCallback(
    (origin: THREE.Vector3, direction: THREE.Vector3, side: 'left' | 'right' | 'desktop', aimOrigin?: THREE.Vector3) => {
      const boltColor = side === 'left' ? '#ec4899' : '#00f0ff';
      // 1. Spawn traveling 3D volumetric energy bolt
      lasersRef.current?.fireBolt(origin, direction, boltColor, side);

      // 2. Muzzle flash sparks at weapon barrel
      particlesRef.current?.spawnSparks(origin.x, origin.y, origin.z, boltColor);

      // CINEMATIC 3D HUBS DISPATCH (Splash Screen, Scenario Hub, Difficulty Hub)
      if (gameStatus === 'start') {
        const hitOrigin = aimOrigin || origin;
        const ray = new THREE.Ray(hitOrigin, direction.clone().normalize());

        activeTargets.forEach((target) => {
          const sphere = new THREE.Sphere(new THREE.Vector3(...target.position), target.radius || 0.55);
          if (ray.intersectsSphere(sphere)) {
            const id = String(target.id);
            particlesRef.current?.spawnSparks(target.position[0], target.position[1], target.position[2], '#00f0ff');

            if (id === 'cta_initialize') {
              handleStartWarpToScenarios();
            } else if (id === 'cta_manual') {
              setIsManualOpen(true);
            } else if (id === 'cta_lang') {
              setLanguage((prev) => (prev === 'en' ? 'ar' : 'en'));
            } else if (id === 'scenario-1' || id === 'scenario-2' || id === 'scenario-3') {
              handleSelectScenario(id as ScenarioId);
            } else if (id === 'back_splash') {
              handleBackToSplash();
            } else if (id === 'easy' || id === 'medium' || id === 'hard') {
              handleSelectDifficulty(id as DifficultyLevel);
            } else if (id === 'back_scenarios') {
              handleBackToScenarios();
            }
          }
        });
        return;
      }

      // TRAINING MODE DISPATCH
      if (gameStatus === 'training') {
        setTrainingState((prev) => ({
          ...prev,
          leftFired: side === 'left' ? true : prev.leftFired,
          rightFired: side === 'right' || side === 'desktop' ? true : prev.rightFired,
        }));

        const hitOrigin = aimOrigin || origin;
        const ray = new THREE.Ray(hitOrigin, direction.clone().normalize());

        activeTargets.forEach((target) => {
          const sphere = new THREE.Sphere(new THREE.Vector3(...target.position), target.radius || 0.45);
          if (ray.intersectsSphere(sphere)) {
            handleTrainingTargetHit(target.id, target.position);
          }
        });
        return;
      }

      // 3. Check hit on packet swarm (using aimOrigin for pinpoint desktop accuracy)
      const hitOrigin = aimOrigin || origin;
      const hitResult = packetSwarmRef.current?.checkRayHit(hitOrigin, direction);
      if (hitResult?.hit && hitResult.position) {
        particlesRef.current?.spawnSparks(hitResult.position.x, hitResult.position.y, hitResult.position.z, boltColor);
      }

      // 4. Shoot-to-Solve: Raycast against active floating target badges
      const ray = new THREE.Ray(hitOrigin, direction.clone().normalize());

      activeTargets.forEach((target) => {
        const sphere = new THREE.Sphere(new THREE.Vector3(...target.position), target.radius || 0.55);
        if (ray.intersectsSphere(sphere)) {
          handleOptionShot(String(target.id), target.position);
          particlesRef.current?.spawnSparks(target.position[0], target.position[1], target.position[2], '#00f0ff');
        }
      });
    },
    [
      gameStatus,
      activeTargets,
      handleOptionShot,
      handleTrainingTargetHit,
      handleStartWarpToScenarios,
      handleSelectScenario,
      handleBackToSplash,
      handleSelectDifficulty,
      handleBackToScenarios,
    ]
  );

  // Grip action handler
  const handleGripAction = useCallback(
    (hand: 'left' | 'right' | 'desktop') => {
      spatialAudio.playButtonBeep(640);
    },
    []
  );

  // Table Team Voice Shout Simulation: Context-aware clues for current incident
  const handleTriggerTeamShout = useCallback(() => {
    spatialAudio.playButtonBeep(880);

    if (currentQuestion) {
      const correctOpt = currentQuestion.options.find((o) => o.isCorrect);
      const catLabel = language === 'ar' ? currentQuestion.categoryLabelAr : currentQuestion.categoryLabelEn;
      const optLabel = language === 'ar' ? (correctOpt?.labelAr || 'الحل الصحيح') : (correctOpt?.labelEn || 'Correct Countermeasure');
      const text =
        language === 'ar'
          ? `فريق الطاولة يصرخ: "تحليل بروتوكول [${catLabel}] في الدليل يشير إلى الحل: [${optLabel}]! أطلق على الشارة فوراً!"`
          : `Table team shouts: "Incident manual says [${catLabel}] requires: [${optLabel}]! Shoot target badge now!"`;
      setLastTeamShout(text);
      return;
    }
  }, [language, currentQuestion]);

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
            <SceneCamera cinematicStep={cinematicStep} />

            {/* AAA Server Room 3D Environment (Active during gameplay and training) */}
            {gameStatus !== 'start' && (
              <ServerRoom isEmergency={health < 30 || scenarioId === 'scenario-3'} />
            )}

            {/* Step 1: 3D Matrix Code Rain & Cyber Grid Floor */}
            {gameStatus === 'start' && cinematicStep === 'splash' && (
              <MatrixCodeRain3D active={true} />
            )}

            {/* Step 1: 3D Splash Screen Hero with Glitch Typography & Glowing CTAs */}
            {gameStatus === 'start' && cinematicStep === 'splash' && (
              <SplashHero3D
                language={language}
                onToggleLanguage={() => setLanguage((prev) => (prev === 'en' ? 'ar' : 'en'))}
                onInitializeDefense={handleStartWarpToScenarios}
                onOpenManual={() => setIsManualOpen(true)}
                onStartTraining={handleStartTraining}
                lockedTargetId={lockedTargetId}
              />
            )}

            {/* 3D Warp Time Tunnel Transition (Steps 1->2, 2->3, 3->4 and Reverse Nav) */}
            {gameStatus === 'start' && cinematicStep.startsWith('warp_') && (
              <WarpTunnel3D
                active={true}
                reverse={cinematicStep.startsWith('warp_reverse_')}
                onComplete={() => {
                  if (cinematicStep === 'warp_to_scenario') {
                    handleCompleteWarpToScenarios();
                  } else if (cinematicStep === 'warp_to_difficulty') {
                    handleCompleteWarpToDifficulty();
                  } else if (cinematicStep === 'warp_to_game') {
                    handleCompleteWarpToGame();
                  } else if (cinematicStep === 'warp_reverse_to_splash') {
                    handleCompleteWarpReverseToSplash();
                  } else if (cinematicStep === 'warp_reverse_to_scenario') {
                    handleCompleteWarpReverseToScenarios();
                  }
                }}
              />
            )}

            {/* Step 2: 3D Scenario Selection Hub (3 Floating Holographic Cards) */}
            {gameStatus === 'start' && cinematicStep === 'scenario_select' && (
              <ScenarioHub3D
                language={language}
                selectedScenario={scenarioId}
                onSelectScenario={handleSelectScenario}
                onBackToSplash={handleBackToSplash}
                lockedTargetId={lockedTargetId}
              />
            )}

            {/* Step 3: 3D Difficulty & Skill Selection Hub (3 Tiered Nodes) */}
            {gameStatus === 'start' && cinematicStep === 'difficulty_select' && (
              <DifficultyHub3D
                language={language}
                selectedDifficulty={difficulty}
                onSelectDifficulty={handleSelectDifficulty}
                onBackToScenarios={handleBackToScenarios}
                lockedTargetId={lockedTargetId}
              />
            )}

            {/* GPU/CPU Particle Systems (Sparks, Disintegration, Cyber Dust) */}
            <ParticleSystem ref={particlesRef} />

            {/* Traveling High-Speed 3D Laser Bolts */}
            <Lasers ref={lasersRef} onBoltHit={handleBoltImpact} />

            {/* Malicious Packet Swarm (Side corridor lanes only, scaled by difficulty) */}
            <PacketSwarm
              ref={packetSwarmRef}
              scenarioId={scenarioId}
              difficulty={difficulty}
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

            {/* 3D Educational Shoot-to-Solve Question Board & Solution Badges (Crisp Canvas on Solid Navy Opaque Quads) */}
            {gameStatus !== 'training' && (gameStatus === 'playing' || gameStatus === 'victory') && (
              <EducationalQuestion3D
                question={currentQuestion}
                questionIndex={questionIndex}
                totalQuestions={currentQuestions.length}
                language={language}
                lockedTargetId={lockedTargetId}
                onSelectOption={(optionId) => {
                  const target = activeTargets.find((t) => t.id === optionId);
                  handleOptionShot(optionId, target?.position || [0, 1.25, -3.5]);
                }}
                lastFeedback={lastQuestionResult}
              />
            )}

            {/* Sharp Visuals Post-Processing (Desktop mode: Low bloom, no halo blur, crisp high-contrast cards) */}
            {!isInVR && (
              <EffectComposer multisampling={0}>
                <Bloom
                  luminanceThreshold={0.8}
                  mipmapBlur={false}
                  intensity={0.25}
                />
                <ChromaticAberration
                  offset={alarmActive ? new THREE.Vector2(0.003, 0.003) : new THREE.Vector2(0.0001, 0.0001)}
                />
                <Vignette eskil={false} offset={0.15} darkness={0.65} />
              </EffectComposer>
            )}
          </XR>
        </Canvas>
      </div>

      {/* Sleek Top Bar for Cinematic Navigation & Quick Controls (Non-intrusive, zero viewport occlusion) */}
      {gameStatus === 'start' && !isInVR && (
        <header
          className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-6 py-3 bg-slate-950/70 border-b border-cyan-500/20 backdrop-blur-md"
          dir={language === 'ar' ? 'rtl' : 'ltr'}
        >
          {/* Zone 1: Brand Wordmark & Cinematic Step Indicator */}
          <div className="flex items-center gap-3">
            <span className="text-base sm:text-lg font-black tracking-wider text-cyan-400 font-mono">
              CYBER HEIST: NODE DEFENDER
            </span>
            <span className="hidden sm:inline-block text-xs font-mono text-emerald-400 border border-emerald-500/30 bg-emerald-950/40 px-2 py-0.5 rounded">
              {cinematicStep === 'splash' && (language === 'ar' ? 'المرحلة 1: البوابة الرئيسية' : 'STEP 1 // MAIN GATEWAY')}
              {(cinematicStep === 'scenario_select' || cinematicStep === 'warp_to_scenario' || cinematicStep === 'warp_reverse_to_scenario') && (language === 'ar' ? 'المرحلة 2: اختيار السيناريو' : 'STEP 2 // SCENARIO HUB')}
              {(cinematicStep === 'difficulty_select' || cinematicStep === 'warp_to_difficulty' || cinematicStep === 'warp_to_game') && (language === 'ar' ? 'المرحلة 3: مستوى الصعوبة' : 'STEP 3 // DIFFICULTY HUB')}
            </span>
          </div>

          {/* Zone 2: Navigation Links / Direct Stage Jump */}
          <nav className="hidden md:flex items-center gap-4 text-xs font-mono text-slate-400">
            <button
              onClick={() => {
                spatialAudio.playButtonBeep(520);
                setCinematicStep('splash');
              }}
              className={`hover:text-cyan-300 transition-colors cursor-pointer ${cinematicStep === 'splash' ? 'text-cyan-400 font-bold' : ''}`}
            >
              {language === 'ar' ? '01. البداية' : '01. Splash'}
            </button>
            <span>/</span>
            <button
              onClick={handleStartWarpToScenarios}
              className={`hover:text-cyan-300 transition-colors cursor-pointer ${cinematicStep === 'scenario_select' ? 'text-cyan-400 font-bold' : ''}`}
            >
              {language === 'ar' ? '02. السيناريوهات' : '02. Scenarios'}
            </button>
            <span>/</span>
            <button
              onClick={() => {
                spatialAudio.playButtonBeep(640);
                spatialAudio.playWarpWhoosh(false);
                setCinematicStep('warp_to_difficulty');
              }}
              className={`hover:text-cyan-300 transition-colors cursor-pointer ${cinematicStep === 'difficulty_select' ? 'text-cyan-400 font-bold' : ''}`}
            >
              {language === 'ar' ? '03. الصعوبة' : '03. Difficulty'}
            </button>
          </nav>

          {/* Zone 3: Actions (Enter VR, Incident Rulebook, Training, Mute, Language) */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setLanguage((prev) => (prev === 'en' ? 'ar' : 'en'))}
              className="px-2.5 py-1 text-xs font-mono rounded bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:border-cyan-400 transition-colors cursor-pointer"
            >
              {language === 'ar' ? 'EN' : 'عربي'}
            </button>

            <button
              onClick={handleToggleMute}
              className="p-1.5 rounded bg-slate-900 border border-slate-700 text-slate-300 hover:text-cyan-400 transition-colors cursor-pointer"
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setIsManualOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded bg-amber-950/60 border border-amber-500/50 text-amber-300 hover:bg-amber-900/60 transition-colors cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'الدليل' : 'Rulebook'}</span>
            </button>

            <button
              onClick={handleStartTraining}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded bg-purple-950/60 border border-purple-500/50 text-purple-300 hover:bg-purple-900/60 transition-colors cursor-pointer"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'محاكي التدريب' : 'Training Sim'}</span>
            </button>

            <button
              onClick={handleEnterVR}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold font-mono rounded bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-500 hover:to-blue-500 transition-all cursor-pointer"
            >
              <Glasses className="w-4 h-4" />
              <span>{language === 'ar' ? 'دخول VR' : 'ENTER VR'}</span>
            </button>
          </div>
        </header>
      )}

      {/* Guided Training Simulation HUD Overlay */}
      {gameStatus === 'training' && !isInVR && (
        <TrainingOverlay
          language={language}
          trainingState={trainingState}
          onSetStep={handleTrainingSetStep}
          onNextStep={handleTrainingNextStep}
          onPrevStep={handleTrainingPrevStep}
          onResetTraining={handleResetTraining}
          onStartMainGame={() => initScenario()}
          onOpenManual={() => setIsManualOpen(true)}
          onTriggerCommsHint={handleTriggerTrainingComms}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          vrActive={isInVR}
        />
      )}

      {/* Diegetic Strictness: 2D Screen Overlays are ONLY rendered in desktop simulator mode; strictly removed in VR */}
      {gameStatus !== 'start' && gameStatus !== 'training' && !isInVR && (
        <HUDOverlay
          language={language}
          scenarioId={scenarioId}
          gameStatus={gameStatus}
          difficulty={difficulty}
          onChangeDifficulty={handleChangeDifficulty}
          timeRemaining={timeRemaining}
          health={health}
          score={score}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onOpenManual={() => setIsManualOpen(true)}
          onRestartScenario={() => initScenario()}
          onReturnToMenu={() => {
            setGameStatus('start');
            setCinematicStep('splash');
          }}
          onOpenTraining={handleStartTraining}
          onTriggerTeamShout={handleTriggerTeamShout}
          lastTeamShout={lastTeamShout}
          educationalFeedback={educationalFeedback}
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
