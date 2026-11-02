/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  HexPortMapping,
  PayloadRule,
  SubnetRule,
  SubnetCoreNode,
  Scenario1Data,
  Scenario2Data,
  Scenario3Data,
  Language,
} from '../types/game';

// SCENARIO 1: HEX TO PORT CONVERSION TABLE
export const HEX_PORT_TABLE: HexPortMapping[] = [
  { hex: '0x16', port: 22, service: 'SSH', description: 'Secure Shell Remote Access' },
  { hex: '0x50', port: 80, service: 'HTTP', description: 'Cleartext Web Traffic' },
  { hex: '0x1BB', port: 443, service: 'HTTPS', description: 'TLS Encrypted Web Traffic' },
  { hex: '0x15', port: 21, service: 'FTP', description: 'File Transfer Protocol' },
  { hex: '0x35', port: 53, service: 'DNS', description: 'Domain Name System Resolution' },
  { hex: '0x1BD', port: 445, service: 'SMB', description: 'Server Message Block Network Share' },
  { hex: '0x0D3D', port: 3389, service: 'RDP', description: 'Remote Desktop Protocol' },
  { hex: '0x1F90', port: 8080, service: 'HTTP-ALT', description: 'Alternative Web Proxy' },
];

// SCENARIO 2: COLOR ROUTING TO PAYLOAD & COUNTERMEASURE TABLE
export const PAYLOAD_RULES: PayloadRule[] = [
  {
    sequence: ['red', 'blue', 'green'],
    payloadName: 'Trojan.Backdoor.Zero',
    threatType: 'Trojan',
    countermeasure: 'AES-256',
    color: '#06b6d4', // Cyan
  },
  {
    sequence: ['cyan', 'yellow', 'red'],
    payloadName: 'Ransomware.CryptoLock',
    threatType: 'Ransomware',
    countermeasure: 'RSA-4096',
    color: '#eab308', // Gold
  },
  {
    sequence: ['green', 'purple', 'blue'],
    payloadName: 'MITM.PacketInterceptor',
    threatType: 'Eavesdropping',
    countermeasure: 'TLS-1.3',
    color: '#10b981', // Emerald
  },
  {
    sequence: ['blue', 'red', 'yellow'],
    payloadName: 'Integrity.ChecksumTamper',
    threatType: 'Tampering',
    countermeasure: 'SHA-256',
    color: '#8b5cf6', // Violet
  },
];

export const AVAILABLE_SHIELDS = [
  { id: 'AES-256', name: 'AES-256 Shield', color: '#06b6d4', shape: 'shield' },
  { id: 'RSA-4096', name: 'RSA-4096 Key', color: '#eab308', shape: 'key' },
  { id: 'TLS-1.3', name: 'TLS 1.3 Tunnel', color: '#10b981', shape: 'tunnel' },
  { id: 'SHA-256', name: 'SHA-256 Hash', color: '#8b5cf6', shape: 'hash' },
];

// SCENARIO 3: SUBNET ROUTING & BLACKHOLE CORE NODES
export const SUBNET_CORE_NODES: SubnetCoreNode[] = [
  {
    id: 'ALPHA',
    label: 'NODE ALPHA',
    cidr: '10.0.0.0/8',
    rangePrefix: '10.',
    subnetName: 'Core VPC DataCenter',
    color: '#38bdf8',
  },
  {
    id: 'BETA',
    label: 'NODE BETA',
    cidr: '172.16.0.0/12',
    rangePrefix: '172.16.',
    subnetName: 'DMZ Perimeter Edge',
    color: '#ec4899',
  },
  {
    id: 'GAMMA',
    label: 'NODE GAMMA',
    cidr: '192.168.4.0/24',
    rangePrefix: '192.168.4.',
    subnetName: 'Office LAN Gateway',
    color: '#10b981',
  },
];

export const SUBNET_RULES: SubnetRule[] = [
  {
    prefix: '192.168.4.',
    sampleIp: '192.168.4.50',
    subnetName: 'LAN Office Segment',
    cidr: '192.168.4.0/24',
    targetNodeId: 'GAMMA',
  },
  {
    prefix: '10.0.8.',
    sampleIp: '10.0.8.120',
    subnetName: 'DataCenter Core VPC',
    cidr: '10.0.0.0/8',
    targetNodeId: 'ALPHA',
  },
  {
    prefix: '172.16.2.',
    sampleIp: '172.16.2.99',
    subnetName: 'DMZ Edge Perimeter',
    cidr: '172.16.0.0/12',
    targetNodeId: 'BETA',
  },
];

export const CONSOLE_BUTTONS = [
  { id: 'alpha', label: 'ALPHA', symbol: 'α', color: '#38bdf8' },
  { id: 'beta', label: 'BETA', symbol: 'β', color: '#ec4899' },
  { id: 'gamma', label: 'GAMMA', symbol: 'γ', color: '#10b981' },
  { id: 'delta', label: 'DELTA', symbol: 'δ', color: '#f59e0b' },
];

/**
 * Pure helper to parse hex string (e.g. "0x16") to decimal port (22)
 */
export function hexToPort(hexStr: string): number {
  return parseInt(hexStr, 16);
}

/**
 * Validates a port shot against the target hex code
 */
export function validatePortShot(targetHex: string, shotPort: number): boolean {
  return hexToPort(targetHex) === shotPort;
}

/**
 * Generates initial data for Scenario 1: Brute Force & The Hex Code
 */
export function generateScenario1(forcedIndex?: number): Scenario1Data {
  const index = forcedIndex !== undefined && forcedIndex >= 0 && forcedIndex < HEX_PORT_TABLE.length
    ? forcedIndex
    : Math.floor(Math.random() * HEX_PORT_TABLE.length);
  const target = HEX_PORT_TABLE[index];

  // Pick 4 candidate port options including the target port
  const candidatePorts = new Set<number>([target.port]);
  while (candidatePorts.size < 4) {
    const randomPick = HEX_PORT_TABLE[Math.floor(Math.random() * HEX_PORT_TABLE.length)];
    candidatePorts.add(randomPick.port);
  }

  // Shuffle candidate ports
  const shuffledPorts = Array.from(candidatePorts).sort(() => Math.random() - 0.5);

  return {
    targetHex: target.hex,
    correctPort: target.port,
    serviceName: target.service,
    allPortOptions: shuffledPorts,
    doorHealth: 100,
    timeRemaining: 90,
  };
}

/**
 * Validates applied countermeasure shield for Scenario 2
 */
export function validateCountermeasure(
  expectedShieldId: string,
  appliedShieldId: string
): boolean {
  return expectedShieldId.toUpperCase() === appliedShieldId.toUpperCase();
}

/**
 * Generates initial data for Scenario 2: Malicious Payload & Color Routing
 */
export function generateScenario2(forcedIndex?: number): Scenario2Data {
  const index = forcedIndex !== undefined && forcedIndex >= 0 && forcedIndex < PAYLOAD_RULES.length
    ? forcedIndex
    : Math.floor(Math.random() * PAYLOAD_RULES.length);
  const rule = PAYLOAD_RULES[index];

  return {
    colorSequence: rule.sequence,
    payloadName: rule.payloadName,
    correctShield: rule.countermeasure,
    availableShields: AVAILABLE_SHIELDS,
    routerHealth: 100,
    timeRemaining: 90,
    cleansed: false,
  };
}

/**
 * Validates Subnet Core Node shot for Scenario 3
 */
export function validateSubnetShot(
  expectedNodeId: 'ALPHA' | 'BETA' | 'GAMMA',
  shotNodeId: 'ALPHA' | 'BETA' | 'GAMMA' | string
): boolean {
  return expectedNodeId.toUpperCase() === shotNodeId.toUpperCase();
}

/**
 * Validates a button sequence step for Scenario 3 (legacy fallback)
 */
export function validateButtonStep(
  expectedSeq: string[],
  currentSeq: string[],
  pressedButton: string
): { valid: boolean; completed: boolean; nextSeq: string[] } {
  const nextIndex = currentSeq.length;
  if (nextIndex >= expectedSeq.length) {
    return { valid: false, completed: true, nextSeq: currentSeq };
  }

  if (expectedSeq[nextIndex] === pressedButton) {
    const updated = [...currentSeq, pressedButton];
    return {
      valid: true,
      completed: updated.length === expectedSeq.length,
      nextSeq: updated,
    };
  }

  return {
    valid: false,
    completed: false,
    nextSeq: [],
  };
}

/**
 * Generates initial data for Scenario 3: DDoS Overload & Subnet Blackhole
 */
export function generateScenario3(forcedIndex?: number): Scenario3Data {
  const index = forcedIndex !== undefined && forcedIndex >= 0 && forcedIndex < SUBNET_RULES.length
    ? forcedIndex
    : Math.floor(Math.random() * SUBNET_RULES.length);
  const rule = SUBNET_RULES[index];

  return {
    attackingIp: rule.sampleIp,
    targetSubnetCidr: rule.cidr,
    correctNodeId: rule.targetNodeId,
    nodes: SUBNET_CORE_NODES,
    systemLoad: 100,
    timeRemaining: 90,
    neutralized: false,
  };
}

/**
 * Comprehensive bilingual manual content for physical print / table team companion view
 */
export const INCIDENT_MANUAL = {
  en: {
    title: 'INCIDENT RESPONSE RULEBOOK',
    subtitle: 'Table Team Physical Manual - Operation "Node Defender"',
    docId: 'DOC-SEC-8820-XR',
    classification: 'TOP SECRET // FOR PHYSICAL MANUAL TEAM ONLY',
    rulesSummary:
      'The VR Player is locked in the virtual server room with dual blasters and cannot see this manual. You, the Table Team, hold all decryption keys. Listen to what the VR Player shouts, look up the solution, and command them which target node to SHOOT!',
    scenario1: {
      title: 'PROTOCOL 1: BRUTE FORCE FIREWALL & HEX CONVERSION',
      instruction:
        'When the VR player reports a glowing Hexadecimal breach code on the blast door (e.g. 0x16), convert it to the corresponding Network Port. Command: "Shoot Port [Number]!"',
      columns: ['HEX CODE', 'TARGET PORT', 'PROTOCOL', 'SYSTEM PURPOSE'],
    },
    scenario2: {
      title: 'PROTOCOL 2: MALICIOUS PAYLOAD & COLOR ROUTING',
      instruction:
        'When the VR player sees a flashing 3-color sequence on the corrupted Router Node, match the sequence to identify the malware and countermeasure. Command: "Shoot the [Shield / Key / Tunnel / Hash] Orb!"',
      columns: ['COLOR SEQUENCE', 'THREAT CLASSIFICATION', 'COUNTERMEASURE ORB TO SHOOT'],
    },
    scenario3: {
      title: 'PROTOCOL 3: DDOS ATTACK & SUBNET BLACKHOLE EMP',
      instruction:
        'When the VR player shouts the attacking IP address shown on the terminal, identify which CIDR block it belongs to and shout which massive Subnet Core Node to shoot to trigger the room-clearing EMP ring!',
      columns: ['ATTACKING IP / PREFIX', 'SUBNET CIDR BLOCK', 'TARGET CORE NODE TO SHOOT'],
      rows: [
        { ip: '10.0.8.x (10.x.x.x)', cidr: '10.0.0.0/8 (Core VPC)', target: 'SHOOT NODE ALPHA (Cyan)' },
        { ip: '172.16.2.x (172.16-31.x)', cidr: '172.16.0.0/12 (DMZ Edge)', target: 'SHOOT NODE BETA (Magenta)' },
        { ip: '192.168.4.x (192.168.x)', cidr: '192.168.4.0/24 (Office LAN)', target: 'SHOOT NODE GAMMA (Emerald)' },
      ],
    },
    phonetic: {
      title: 'TACTICAL RADIO PROTOCOL',
      alpha: 'NODE ALPHA (α) - 10.0.0.0/8 [Cyan Blue Core]',
      beta: 'NODE BETA (β) - 172.16.0.0/12 [Magenta Pink Core]',
      gamma: 'NODE GAMMA (γ) - 192.168.4.0/24 [Emerald Green Core]',
      delta: 'BLASTER LOCK: Aim within 5° for magnetic target snap and haptic confirmation.',
    },
  },
  ar: {
    title: 'دليل الاستجابة للحوادث السيبرانية',
    subtitle: 'دليل فريق الطاولة الورقي - عملية "حامي العقد"',
    docId: 'وثيقة-أمن-8820-XR',
    classification: 'سري للغاية // خاص بفريق الطاولة الورقي',
    rulesSummary:
      'لاعب الواقع الافتراضي محبوس داخل غرفة الخوادم حاملاً مسدسات الليزر ولا يرى هذا الدليل. أنتم فريق الطاولة تمتلكون شفرات الحل. استمعوا لما يصرخه لاعب VR، ابحثوا في الجداول، واصرخوا باسم الهدف المطلوب إطلاق النار عليه!',
    scenario1: {
      title: 'البروتوكول 1: صد الهجوم الغاشم وتحويل الشفرة الست عشرية',
      instruction:
        'عندما يقرأ لاعب VR الرمز الست عشري (Hex) الوامض على بوابة جدار الحماية، طابق الرمز برقم المنفذ واصرخ: "أطلق على المنفذ [الرقم]!"',
      columns: ['الرمز الست عشري', 'رقم المنفذ (Port)', 'البروتوكول', 'الاستخدام'],
    },
    scenario2: {
      title: 'البروتوكول 2: تحييد الحمولة الخبيثة وتسلسل الألوان',
      instruction:
        'عندما يرى لاعب VR وميض الألوان الثلاثة على الراوتر، طابق الألوان لتحديد نوع الهجوم واصرخ باسم كرة التشفير المطلوبة ليطلق عليها: "أطلق على كرة [الدرع / المفتاح / النفق / التجزئة]!"',
      columns: ['تسلسل الألوان', 'تصنيف التهديد', 'كرة التشفير المطلوب قصفها'],
    },
    scenario3: {
      title: 'البروتوكول 3: إيقاف هجوم حجب الخدمة (DDoS) وتفعيل نبضة EMP للثقب الأسود',
      instruction:
        'عندما يصرخ لاعب VR بعنوان الـ IP المهاجم، ابحث عن نطاق CIDR المقابل واصرخ باسم عقدة الشبكة المطلوب إطلاق النار عليها لإطلاق نبضة EMP تطهر القاعة!',
      columns: ['عنوان الآي بي / البادئة', 'نطاق CIDR للشبكة الفرعية', 'العقدة المطلوب إطلاق النار عليها'],
      rows: [
        { ip: '10.0.8.x (10.x.x.x)', cidr: '10.0.0.0/8 (مركز البيانات)', target: 'أطلق على العقدة ألفا (السماوية)' },
        { ip: '172.16.2.x (172.16-31.x)', cidr: '172.16.0.0/12 (حافة الشبكة DMZ)', target: 'أطلق على العقدة بيتا (الوردية)' },
        { ip: '192.168.4.x (192.168.x)', cidr: '192.168.4.0/24 (شبكة المكاتب)', target: 'أطلق على العقدة جاما (الخضراء)' },
      ],
    },
    phonetic: {
      title: 'بروتوكول الاتصال والتصويب التكتيكي',
      alpha: 'عقدة ألفا (α) - 10.0.0.0/8 [نواة زرقاء سماوية]',
      beta: 'عقدة بيتا (β) - 172.16.0.0/12 [نواة وردية ماجنتا]',
      gamma: 'عقدة جاما (γ) - 192.168.4.0/24 [نواة خضراء زمردية]',
      delta: 'التصويب المغناطيسي: وجّه الشعاع ضمن 5 درجات للقفل التلقائي وتفعيل الاهتزاز.',
    },
  },
};

/**
 * Calculates current combo multiplier based on consecutive hit streak.
 * 0 - 2 hits: 1x
 * 3 - 5 hits: 2x
 * 6 - 9 hits: 3x
 * 10+ hits: 4x
 */
export function calculateComboMultiplier(combo: number): number {
  if (combo >= 10) return 4;
  if (combo >= 6) return 3;
  if (combo >= 3) return 2;
  return 1;
}

/**
 * Checks if Fever Mode is reached (combo >= 10)
 */
export function isFeverTriggered(combo: number): boolean {
  return combo >= 10;
}

/**
 * Calculates the score awarded for a hit.
 * If Fever Mode is active, the score is tripled (3x on top of combo multiplier).
 */
export function calculateHitScore(
  basePoints: number,
  combo: number,
  isFeverMode: boolean
): number {
  const multiplier = calculateComboMultiplier(combo);
  const feverMultiplier = isFeverMode ? 3 : 1;
  return basePoints * multiplier * feverMultiplier;
}

/**
 * Handles the 1.5-second miss grace window.
 * When a miss occurs, a 1.5-second timer starts. If another hit occurs within 1.5s,
 * the combo continues. If time expires, the combo drops to 0.
 */
export function processMissGrace(
  currentCombo: number,
  missGraceRemaining: number,
  delta: number
): { newCombo: number; newGrace: number; resetOccurred: boolean } {
  if (currentCombo === 0) {
    return { newCombo: 0, newGrace: 0, resetOccurred: false };
  }
  const updatedGrace = missGraceRemaining - delta;
  if (updatedGrace <= 0) {
    return { newCombo: 0, newGrace: 0, resetOccurred: true };
  }
  return { newCombo: currentCombo, newGrace: updatedGrace, resetOccurred: false };
}

/**
 * Determines if a destroyed malware packet drops a magnetic data shard (30% probability)
 */
export function shouldDropDataShard(randomValue: number = Math.random()): boolean {
  return randomValue <= 0.30;
}
