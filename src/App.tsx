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
  CombatPhase,
  TrainingStepId,
  TrainingState,
  CinematicStep,
} from './types/game';
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
import { TrainingSimulation } from './components/TrainingSimulation';
import { TrainingOverlay } from './components/TrainingOverlay';
import { StartScreen } from './components/StartScreen';
import { HUDOverlay } from './components/HUDOverlay';
import { RulebookModal } from './components/RulebookModal';
import { VictimServerNode3D } from './components/VictimServerNode3D';
import { SplashHero3D } from './components/SplashHero3D';
import { ScenarioHub3D } from './components/ScenarioHub3D';
import { DifficultyHub3D } from './components/DifficultyHub3D';

/**
 * Scene Camera Rig: Sets eye level, coordinates dynamic warp transitions, and updates Web Audio listener
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

  // 2-Phase Gameplay Loop State: 'decoding' (Phase 1) vs 'defense' (Phase 2)
  const [combatPhase, setCombatPhase] = useState<CombatPhase>('decoding');
  const [hearts, setHearts] = useState(5); // 5 Hearts (HP)
  const [maxHearts] = useState(5);
  const [score, setScore] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(90);

  // Overclock Combo System
  const [overclockCombo, setOverclockCombo] = useState(0);
  const [isOverclockActive, setIsOverclockActive] = useState(false);

  // UI Overlays & Feedback Banners
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [lastTeamShout, setLastTeamShout] = useState<string | null>(null);
  const [isInVR, setIsInVR] = useState(false);
  const [alarmActive, setAlarmActive] = useState(false);
  const [screenShake, setScreenShake] = useState(false);
  const [redVignetteFlash, setRedVignetteFlash] = useState(false);
  const [educationalFeedback, setEducationalFeedback] = useState<{
    messageEn: string;
    messageAr: string;
    isCorrect: boolean;
  } | null>(null);
  const [lastQuestionResult, setLastQuestionResult] = useState<{
    optionId: string;
    isCorrect: boolean;
  } | null>(null);
  const [phaseBanner, setPhaseBanner] = useState<{
    type: 'alarm' | 'purge' | 'overclock';
    messageEn: string;
    messageAr: string;
  } | null>(null);

  // Curriculum Questions for current difficulty
  const currentQuestions = useMemo(() => CURRICULUM_QUESTIONS[difficulty], [difficulty]);
  const currentQuestion = currentQuestions[questionIndex % currentQuestions.length];

  const getInitialTimer = useCallback((diff: DifficultyLevel) => {
    if (diff === 'easy') return 120;
    if (diff === 'hard') return 60;
    return 90;
  }, []);

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

  // Active 3D Target Nodes for Magnetic Aim Assist
  const activeTargets: TargetNodeInfo[] = useMemo(() => {
    // Start / Menu Mode: 3D Holographic Shoot-to-Interact Targets
    if (gameStatus === 'start') {
      if (cinematicStep === 'splash') {
        return [
          { id: 'init_defense', position: [0, 1.4, -3.8], radius: 0.85 },
          { id: 'training', position: [0, 0.25, -3.8], radius: 0.75 },
          { id: 'manual', position: [-1.25, 0.85, -3.8], radius: 0.65 },
          { id: 'lang_toggle', position: [1.25, 0.85, -3.8], radius: 0.65 },
        ];
      }
      if (cinematicStep === 'scenario_select') {
        return [
          { id: 'scenario-1', position: [-2.3, 1.6, -3.4], radius: 0.95 },
          { id: 'scenario-2', position: [0.0, 1.6, -3.4], radius: 0.95 },
          { id: 'scenario-3', position: [2.3, 1.6, -3.4], radius: 0.95 },
          { id: 'back_splash', position: [-1.4, 0.25, -3.0], radius: 0.55 },
          { id: 'next_difficulty', position: [1.4, 0.25, -3.0], radius: 0.65 },
        ];
      }
      if (cinematicStep === 'difficulty_select') {
        return [
          { id: 'diff_easy', position: [-2.3, 1.6, -3.4], radius: 0.95 },
          { id: 'diff_medium', position: [0.0, 1.6, -3.4], radius: 0.95 },
          { id: 'diff_hard', position: [2.3, 1.6, -3.4], radius: 0.95 },
          { id: 'back_scenarios', position: [-1.4, 0.25, -3.0], radius: 0.55 },
          { id: 'launch_game', position: [1.4, 0.25, -3.0], radius: 0.65 },
        ];
      }
      return [];
    }

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

    if (gameStatus !== 'playing') return [];

    // Phase 1 (Decoding): Aim targets are the floating option badges
    if (combatPhase === 'decoding') {
      const positions: [number, number, number][] = [
        [-1.8, 1.0, -4.0],
        [0.0, 1.0, -4.0],
        [1.8, 1.0, -4.0],
      ];
      return currentQuestion.options.map((opt, idx) => ({
        id: opt.id,
        position: positions[idx] || [0, 1.0, -4.0],
        radius: 0.55,
      }));
    }

    return [];
  }, [gameStatus, trainingState, combatPhase, currentQuestion, cinematicStep]);

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
      setQuestionIndex(0);
      setOverclockCombo(0);
      setIsOverclockActive(false);
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

  // Menu Transition Warp Triggers
  const handleStartWarpToScenarios = useCallback(() => {
    spatialAudio.playButtonBeep(640);
    spatialAudio.playWarpWhoosh(false);
    setCinematicStep('warp_to_scenario');
  }, []);

  const handleCompleteWarpToScenarios = useCallback(() => {
    spatialAudio.playWarpDecelerate();
    setCinematicStep('scenario_select');
  }, []);

  const handleStartWarpToDifficulty = useCallback(() => {
    spatialAudio.playButtonBeep(720);
    spatialAudio.playWarpWhoosh(false);
    setCinematicStep('warp_to_difficulty');
  }, []);

  const handleSelectScenario = useCallback((sc: ScenarioId | 'random') => {
    setSelectedScenarioOption(sc);
    if (sc !== 'random') {
      setScenarioId(sc);
    }
    spatialAudio.playButtonBeep(720);
    spatialAudio.playWarpWhoosh(false);
    setCinematicStep('warp_to_difficulty');
  }, []);

  const handleCompleteWarpToDifficulty = useCallback(() => {
    spatialAudio.playWarpDecelerate();
    setCinematicStep('difficulty_select');
  }, []);

  const handleSelectDifficulty = useCallback((diff: DifficultyLevel) => {
    setDifficulty(diff);
    spatialAudio.playButtonBeep(880);
    spatialAudio.playWarpWhoosh(false);
    setCinematicStep('warp_to_game');
  }, []);

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

  // Handle Threat Packet Collision with Protected Core (Phase 2 Damage)
  const handlePacketBreach = useCallback(() => {
    if (gameStatus !== 'playing') return;

    // Reset Overclock Combo on miss / core damage
    setOverclockCombo(0);
    setIsOverclockActive(false);

    // Trigger Screen Shake, Red Vignette Flash & Rumble
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
  }, [gameStatus]);

  // Laser Bolt hit on wall or packet
  const handleBoltImpact = useCallback((pos: THREE.Vector3, color: string) => {
    particlesRef.current?.spawnSparks(pos.x, pos.y, pos.z, color);
  }, []);

  // Threat Packet Destroyed in Phase 2
  const handlePacketDestroyed = useCallback(
    (packetId: number, x: number, y: number, z: number) => {
      particlesRef.current?.spawnVoxelShatter(x, y, z, '#ef4444');

      // Overclock Combo System
      setOverclockCombo((prev) => {
        const next = prev + 1;
        if (next >= 5) {
          setIsOverclockActive(true);
          spatialAudio.playPowerupChime();
          setPhaseBanner({
            type: 'overclock',
            messageEn: '⚡ OVERCLOCK MODE ACTIVATED! 2x SCORE MULTIPLIER',
            messageAr: '⚡ تفعيل وضع كسر السرعة! مضاعفة النقاط 2x',
          });
          setTimeout(() => setPhaseBanner(null), 2000);
        }
        return next;
      });

      const pts = isOverclockActive ? 50 : 25;
      setScore((prev) => prev + pts);

      // Check if all malware in Phase 2 wave is destroyed (Wave Clear)
      setTimeout(() => {
        const remaining = packetSwarmRef.current?.getActiveCount() || 0;
        if (remaining === 0 && combatPhase === 'defense') {
          spatialAudio.stopAlarmSiren();
          setAlarmActive(false);
          spatialAudio.playVictoryFanfare();

          setPhaseBanner({
            type: 'purge',
            messageEn: 'THREAT PURGED! WARPING TO NEXT NODE...',
            messageAr: 'تم تطهير التهديد بنجاح! القفز بالزمن إلى العقدة التالية...',
          });

          // Trigger Time Tunnel Warp
          spatialAudio.playWarpWhoosh(false);

          setTimeout(() => {
            setPhaseBanner(null);
            const isLastQuestion = questionIndex >= currentQuestions.length - 1;
            if (isLastQuestion) {
              setGameStatus('victory');
            } else {
              setQuestionIndex((prev) => prev + 1);
              setCombatPhase('decoding');
              setOverclockCombo(0);
              setIsOverclockActive(false);
              setEducationalFeedback(null);
              setLastQuestionResult(null);
              setTimeRemaining((prev) => Math.min(getInitialTimer(difficulty), prev + 25));
            }
          }, 2000);
        }
      }, 100);
    },
    [combatPhase, isOverclockActive, questionIndex, currentQuestions.length, difficulty, getInitialTimer]
  );

  // Phase 1 Option Shot (Shoot-to-Solve)
  const handleOptionShot = useCallback(
    (optionId: string, position: [number, number, number]) => {
      if (gameStatus !== 'playing' || combatPhase !== 'decoding') return;

      const matchedOption = currentQuestion.options.find((opt) => opt.id === optionId);
      const isCorrect = Boolean(matchedOption?.isCorrect);
      setLastQuestionResult({ optionId, isCorrect });

      const explanationEn = matchedOption?.explanationEn || (isCorrect ? 'Correct protocol selected!' : 'Security violation detected.');
      const explanationAr = matchedOption?.explanationAr || (isCorrect ? 'تم اختيار البروتوكول الصحيح!' : 'تم رصد انتهاك أمني.');

      if (isCorrect) {
        spatialAudio.playSuccessChime();
        particlesRef.current?.spawnSparks(position[0], position[1], position[2], '#00FF66');
        particlesRef.current?.spawnVoxelShatter(position[0], position[1], position[2], '#00FF66');
        particlesRef.current?.spawnVoxelShatter(0, 3.5, -5.0, '#00FF66');
        setScore((prev) => prev + 500);

        // Transition: IMMEDIATELY HIDE all Question and Answer UI panels and launch Phase 2
        setTimeout(() => {
          setCombatPhase('defense');
          setEducationalFeedback(null);
          setLastQuestionResult(null);

          // Atmosphere Shift: Dim ambient lights, rotate red emergency strobes, spatial siren + synth growl
          setAlarmActive(true);
          spatialAudio.startAlarmSiren();

          // Controlled wave of 6 to 10 malware packets flying toward Floating Core
          const packetCount = difficulty === 'easy' ? 6 : difficulty === 'medium' ? 8 : 10;
          packetSwarmRef.current?.spawnPenaltyPackets(packetCount);
        }, 320);
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
    [gameStatus, combatPhase, currentQuestion, difficulty]
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

  // Handle laser fire from VR controller or desktop mouse
  const handleFireLaser = useCallback(
    (origin: THREE.Vector3, direction: THREE.Vector3, side: 'left' | 'right' | 'desktop', aimOrigin?: THREE.Vector3) => {
      const boltColor = isOverclockActive ? '#FFC700' : side === 'left' ? '#ec4899' : '#00f0ff';
      // 1. Spawn traveling 3D volumetric energy bolt
      lasersRef.current?.fireBolt(origin, direction, boltColor, side);

      // 2. Muzzle flash sparks at weapon barrel
      particlesRef.current?.spawnSparks(origin.x, origin.y, origin.z, boltColor);

      // START / MENU MODE DISPATCH (Shoot-to-Interact everywhere!)
      if (gameStatus === 'start') {
        const hitOrigin = aimOrigin || origin;
        const ray = new THREE.Ray(hitOrigin, direction.clone().normalize());

        activeTargets.forEach((target) => {
          const sphere = new THREE.Sphere(new THREE.Vector3(...target.position), target.radius || 0.65);
          if (ray.intersectsSphere(sphere)) {
            particlesRef.current?.spawnSparks(target.position[0], target.position[1], target.position[2], '#ffc700');
            spatialAudio.playSuccessChime();

            const tid = String(target.id);
            if (tid === 'init_defense') {
              handleStartWarpToScenarios();
            } else if (tid === 'training') {
              handleStartTraining();
            } else if (tid === 'manual') {
              setIsManualOpen(true);
            } else if (tid === 'lang_toggle') {
              setLanguage((l) => (l === 'ar' ? 'en' : 'ar'));
            } else if (tid === 'scenario-1') {
              handleSelectScenario('scenario-1');
              handleStartWarpToDifficulty();
            } else if (tid === 'scenario-2') {
              handleSelectScenario('scenario-2');
              handleStartWarpToDifficulty();
            } else if (tid === 'scenario-3') {
              handleSelectScenario('scenario-3');
              handleStartWarpToDifficulty();
            } else if (tid === 'back_splash') {
              handleBackToSplash();
            } else if (tid === 'next_difficulty') {
              handleStartWarpToDifficulty();
            } else if (tid === 'diff_easy') {
              setDifficulty('easy');
              handleSelectDifficulty('easy');
            } else if (tid === 'diff_medium') {
              setDifficulty('medium');
              handleSelectDifficulty('medium');
            } else if (tid === 'diff_hard') {
              setDifficulty('hard');
              handleSelectDifficulty('hard');
            } else if (tid === 'back_scenarios') {
              handleBackToScenarios();
            } else if (tid === 'launch_game') {
              handleSelectDifficulty(difficulty);
            }
          }
        });
        return;
      }

      // TRAINING MODE DISPATCH
      if (gameStatus === 'training') {
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

      const hitOrigin = aimOrigin || origin;

      // 3. Phase 2 (Defense): Check hit on malware threat packets
      if (combatPhase === 'defense') {
        const hitResult = packetSwarmRef.current?.checkRayHit(hitOrigin, direction);
        if (hitResult?.hit && hitResult.position) {
          particlesRef.current?.spawnSparks(hitResult.position.x, hitResult.position.y, hitResult.position.z, boltColor);
        }
      }

      // 4. Phase 1 (Decoding): Raycast against active solution target badges
      if (combatPhase === 'decoding') {
        const ray = new THREE.Ray(hitOrigin, direction.clone().normalize());

        activeTargets.forEach((target) => {
          const sphere = new THREE.Sphere(new THREE.Vector3(...target.position), target.radius || 0.55);
          if (ray.intersectsSphere(sphere)) {
            handleOptionShot(String(target.id), target.position);
            particlesRef.current?.spawnSparks(target.position[0], target.position[1], target.position[2], '#00f0ff');
          }
        });
      }
    },
    [
      gameStatus,
      combatPhase,
      activeTargets,
      isOverclockActive,
      handleOptionShot,
      handleTrainingTargetHit,
      handleStartWarpToScenarios,
      handleStartTraining,
      handleSelectScenario,
      handleStartWarpToDifficulty,
      handleBackToSplash,
      handleBackToScenarios,
      handleSelectDifficulty,
      difficulty,
    ]
  );

  // Grip action handler
  const handleGripAction = useCallback((hand: 'left' | 'right' | 'desktop') => {
    spatialAudio.playButtonBeep(640);
  }, []);

  // Table Team Voice Shout Simulation
  const handleTriggerTeamShout = useCallback(() => {
    spatialAudio.playButtonBeep(880);

    if (currentQuestion) {
      const correctOpt = currentQuestion.options.find((o) => o.isCorrect);
      const catLabel = language === 'ar' ? currentQuestion.categoryLabelAr : currentQuestion.categoryLabelEn;
      const optLabel = language === 'ar' ? (correctOpt?.labelAr || 'الحل الصحيح') : (correctOpt?.labelEn || 'Correct Countermeasure');
      const text =
        language === 'ar'
          ? `فريق الطاولة يصرخ: "تحليل [${catLabel}] في الدليل يشير إلى: [${optLabel}]! أطلق على الشارة فوراً!"`
          : `Table team shouts: "Incident manual says [${catLabel}] requires: [${optLabel}]! Shoot target badge now!"`;
      setLastTeamShout(text);
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
    <div
      className={`relative w-screen h-screen bg-[#030914] overflow-hidden select-none font-sans ${
        screenShake ? 'animate-bounce' : ''
      }`}
    >
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

            {/* AAA Server Room 3D Environment */}
            <ServerRoom isEmergency={alarmActive || combatPhase === 'defense' || hearts <= 2} />

            {/* 3D Victim Server Node (Prominently centered in player's field of view) */}
            {gameStatus !== 'start' && (
              <VictimServerNode3D
                combatPhase={combatPhase}
                scenarioId={scenarioId}
                language={language}
                hearts={hearts}
                maxHearts={maxHearts}
                isEmergency={alarmActive || combatPhase === 'defense' || hearts <= 2}
                position={[0, 0.8, -4.5]}
                scale={[0.95, 0.95, 0.95]}
              />
            )}

            {/* 3D Matrix Code Rain in Background on Start */}
            {gameStatus === 'start' && cinematicStep === 'splash' && (
              <MatrixCodeRain3D active={true} />
            )}

            {/* 3D Warp Time Tunnel Transition */}
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

            {/* GPU Particle Systems */}
            <ParticleSystem ref={particlesRef} />

            {/* Traveling High-Speed 3D Laser Bolts */}
            <Lasers ref={lasersRef} onBoltHit={handleBoltImpact} />

            {/* Malicious Packet Swarm */}
            <PacketSwarm
              ref={packetSwarmRef}
              scenarioId={scenarioId}
              difficulty={difficulty}
              active={gameStatus === 'playing' && combatPhase === 'defense'}
              onPacketDestroyed={handlePacketDestroyed}
              onPacketBreach={handlePacketBreach}
            />

            {/* VR Player Rig */}
            <VRPlayer
              ref={vrPlayerRef}
              onFireLaser={handleFireLaser}
              onGripAction={handleGripAction}
              health={(hearts / maxHearts) * 100}
              timeRemaining={timeRemaining}
              score={score}
              scenarioId={scenarioId}
              language={language}
              activeTargets={activeTargets}
              onTargetLockChanged={setLockedTargetId}
            />

            {/* 3D Shoot-to-Interact Holographic Hubs (Start Mode) */}
            {gameStatus === 'start' && !cinematicStep.startsWith('warp_') && (
              <>
                {cinematicStep === 'splash' && (
                  <SplashHero3D
                    language={language}
                    onToggleLanguage={() => setLanguage((l) => (l === 'ar' ? 'en' : 'ar'))}
                    onInitializeDefense={handleStartWarpToScenarios}
                    onOpenManual={() => setIsManualOpen(true)}
                    onStartTraining={handleStartTraining}
                    lockedTargetId={lockedTargetId}
                  />
                )}
                {cinematicStep === 'scenario_select' && (
                  <ScenarioHub3D
                    language={language}
                    selectedScenario={selectedScenarioOption}
                    onSelectScenario={(sc) => {
                      handleSelectScenario(sc);
                      spatialAudio.playSuccessChime();
                      handleStartWarpToDifficulty();
                    }}
                    onBackToSplash={handleBackToSplash}
                    onNextDifficulty={handleStartWarpToDifficulty}
                    lockedTargetId={lockedTargetId}
                  />
                )}
                {cinematicStep === 'difficulty_select' && (
                  <DifficultyHub3D
                    language={language}
                    selectedDifficulty={difficulty}
                    onSelectDifficulty={(diff) => {
                      setDifficulty(diff);
                      spatialAudio.playSuccessChime();
                    }}
                    onBackToScenarios={handleBackToScenarios}
                    onLaunchGame={() => handleSelectDifficulty(difficulty)}
                    lockedTargetId={lockedTargetId}
                  />
                )}
              </>
            )}

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

            {/* 3D Educational Shoot-to-Solve Question Board & Solution Badges (PHASE 1 ONLY - Hidden during Combat Phase 2) */}
            {gameStatus !== 'training' && (gameStatus === 'playing' || gameStatus === 'victory') && combatPhase === 'decoding' && (
              <EducationalQuestion3D
                question={currentQuestion}
                questionIndex={questionIndex}
                totalQuestions={currentQuestions.length}
                language={language}
                lockedTargetId={lockedTargetId}
                onSelectOption={(optionId) => {
                  const target = activeTargets.find((t) => t.id === optionId);
                  handleOptionShot(optionId, target?.position || [0, 1.0, -4.0]);
                }}
                lastFeedback={lastQuestionResult}
              />
            )}

            {/* Sharp Visuals Post-Processing */}
            {!isInVR && (
              <EffectComposer multisampling={0}>
                <Bloom
                  luminanceThreshold={0.88}
                  mipmapBlur={false}
                  intensity={0.16}
                />
                <ChromaticAberration
                  offset={alarmActive ? new THREE.Vector2(0.0004, 0.0004) : new THREE.Vector2(0.0001, 0.0001)}
                />
                <Vignette eskil={false} offset={0.15} darkness={0.45} />
              </EffectComposer>
            )}
          </XR>
        </Canvas>
      </div>

      {/* 2D HTML/CSS Menu Overlay (Fixes 3D plane unreadable dark contrast bugs) */}
      {gameStatus === 'start' && !isInVR && (
        <StartScreen
          language={language}
          onSelectLanguage={setLanguage}
          difficulty={difficulty}
          onSelectDifficulty={setDifficulty}
          selectedScenario={selectedScenarioOption}
          onSelectScenario={handleSelectScenario}
          cinematicStep={cinematicStep}
          onGoToScenarioSelect={handleStartWarpToScenarios}
          onGoToDifficultySelect={() => handleSelectDifficulty(difficulty)}
          onBackToSplash={handleBackToSplash}
          onBackToScenarioSelect={handleBackToScenarios}
          onStartGame={() => handleSelectDifficulty(difficulty)}
          onEnterVR={handleEnterVR}
          onPlayDesktop={() => initScenario()}
          onStartTraining={handleStartTraining}
          onOpenManual={() => setIsManualOpen(true)}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* 2D In-Game HUD Overlay */}
      {gameStatus !== 'start' && gameStatus !== 'training' && !isInVR && (
        <HUDOverlay
          language={language}
          scenarioId={scenarioId}
          gameStatus={gameStatus}
          combatPhase={combatPhase}
          difficulty={difficulty}
          onChangeDifficulty={handleChangeDifficulty}
          timeRemaining={timeRemaining}
          hearts={hearts}
          maxHearts={maxHearts}
          score={score}
          overclockCombo={overclockCombo}
          isOverclockActive={isOverclockActive}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onOpenManual={() => setIsManualOpen(true)}
          onRestartScenario={() => initScenario()}
          onNextScenarioHub={() => {
            spatialAudio.stopAlarmSiren();
            spatialAudio.playWarpWhoosh(false);
            setGameStatus('start');
            setCinematicStep('scenario_select');
          }}
          onReturnToMenu={() => {
            spatialAudio.stopAlarmSiren();
            spatialAudio.playWarpWhoosh(true);
            setGameStatus('start');
            setCinematicStep('splash');
          }}
          onOpenTraining={handleStartTraining}
          onTriggerTeamShout={handleTriggerTeamShout}
          lastTeamShout={lastTeamShout}
          educationalFeedback={educationalFeedback}
          phaseBanner={phaseBanner}
          vrActive={isInVR}
        />
      )}

      {/* Guided Training Overlay */}
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

      {/* Physical Incident Response Rulebook Modal */}
      <RulebookModal
        isOpen={isManualOpen}
        onClose={() => setIsManualOpen(false)}
        language={language}
      />

      {/* Red Vignette Damage Flash Overlay on Core Breach or Wrong Hit */}
      {redVignetteFlash && (
        <div className="pointer-events-none fixed inset-0 z-50 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(255,0,85,0.45)_100%)] animate-pulse" />
      )}
    </div>
  );
}
