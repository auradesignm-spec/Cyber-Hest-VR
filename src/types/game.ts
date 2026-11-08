/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Language = 'en' | 'ar';

export type ScenarioId = 'scenario-1' | 'scenario-2' | 'scenario-3';

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export type CombatPhase = 'decoding' | 'defense';

export type CinematicStep =
  | 'splash'
  | 'warp_to_scenario'
  | 'scenario_select'
  | 'warp_to_difficulty'
  | 'difficulty_select'
  | 'warp_to_game'
  | 'warp_reverse_to_scenario'
  | 'warp_reverse_to_splash'
  | 'playing';

export interface QuestionOption {
  id: string;
  labelEn: string;
  labelAr: string;
  isCorrect: boolean;
  explanationEn: string;
  explanationAr: string;
}

export interface EducationalQuestion {
  id: string;
  difficulty: DifficultyLevel;
  category: 'osi' | 'protocols' | 'threats' | 'ports' | 'encryption' | 'hex' | 'subnets';
  categoryLabelEn: string;
  categoryLabelAr: string;
  promptEn: string;
  promptAr: string;
  options: QuestionOption[];
}

export type GameStatus = 'start' | 'briefing' | 'playing' | 'victory' | 'gameover' | 'training';

export type TrainingStepId =
  | 'welcome'
  | 'blaster_basics'
  | 'target_lock'
  | 'scenario_firewall'
  | 'scenario_payload'
  | 'scenario_ddos'
  | 'graduation';

export interface TrainingState {
  step: TrainingStepId;
  leftFired: boolean;
  rightFired: boolean;
  packetsDestroyed: number;
  lockedTargets: string[];
  shotTargets: string[];
  lastFeedback: {
    type: 'success' | 'warning' | 'info';
    messageEn: string;
    messageAr: string;
  } | null;
}

export interface HexPortMapping {
  hex: string;
  port: number;
  service: string;
  description: string;
}

export interface PayloadRule {
  sequence: [string, string, string]; // e.g. ['red', 'blue', 'green']
  payloadName: string;
  threatType: string;
  countermeasure: string; // e.g. 'AES-256'
  color: string;
}

export interface SubnetCoreNode {
  id: 'ALPHA' | 'BETA' | 'GAMMA';
  label: string;
  cidr: string;
  rangePrefix: string;
  subnetName: string;
  color: string;
}

export interface SubnetRule {
  prefix: string; // e.g. '192.168.4.'
  sampleIp: string; // e.g. '192.168.4.50'
  subnetName: string;
  cidr: string;
  targetNodeId: 'ALPHA' | 'BETA' | 'GAMMA';
}

export interface Scenario1Data {
  targetHex: string;
  correctPort: number;
  serviceName: string;
  allPortOptions: number[];
  doorHealth: number; // 0 - 100
  timeRemaining: number;
}

export interface Scenario2Data {
  colorSequence: [string, string, string];
  payloadName: string;
  correctShield: string;
  availableShields: Array<{ id: string; name: string; color: string; shape: string }>;
  routerHealth: number;
  timeRemaining: number;
  cleansed: boolean;
}

export interface Scenario3Data {
  attackingIp: string;
  targetSubnetCidr: string;
  correctNodeId: 'ALPHA' | 'BETA' | 'GAMMA';
  nodes: SubnetCoreNode[];
  systemLoad: number; // 0 - 100
  timeRemaining: number;
  neutralized: boolean;
}

export interface LaserShot {
  id: string;
  origin: [number, number, number];
  direction: [number, number, number];
  color: string;
  createdAt: number;
  isFever?: boolean;
}

export interface DataPacketInstance {
  id: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  targetX: number;
  targetY: number;
  targetZ: number;
  active: boolean;
}

export interface ScorePopup {
  id: string;
  text: string;
  position: [number, number, number];
  color: string;
  scale: number;
  createdAt: number;
  duration?: number;
}

export interface DataShard {
  id: string;
  position: [number, number, number];
  velocity: [number, number, number];
  collected: boolean;
  createdAt: number;
}

export interface ArcadeState {
  combo: number;
  multiplier: number;
  isFeverMode: boolean;
  feverTimeLeft: number;
  missGraceTimeLeft: number;
  highScore: number;
  shardsCollected: number;
}

export type PowerUpType = 'rapid_fire' | 'emp_bomb' | 'plasma_beam';

export interface PowerUpOrb {
  id: string;
  type: PowerUpType;
  position: [number, number, number];
  createdAt: number;
  duration: number; // 4000ms despawn
  collected: boolean;
}

export interface ActivePowerUp {
  type: PowerUpType;
  endTime: number;
}

export interface HealthPickup {
  id: string;
  position: [number, number, number];
  createdAt: number;
}

