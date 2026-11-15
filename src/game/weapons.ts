/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type WeaponId = 'pulse' | 'scatter' | 'lance';

export interface WeaponSpec {
  id: WeaponId;
  nameEn: string;
  nameAr: string;
  taglineEn: string;
  taglineAr: string;
  color: string;
  /** Bolts fired per trigger pull (the extras fan out symmetrically) */
  shots: number;
  /** Total fan width in radians for the extra pellets */
  spread: number;
  /** How strongly the shot is pulled onto a locked threat (0..1) */
  aimAssist: number;
  boltScale: number;
}

export const WEAPONS: Record<WeaponId, WeaponSpec> = {
  pulse: {
    id: 'pulse',
    nameEn: 'MK-II PULSE',
    nameAr: 'نبضة MK-II',
    taglineEn: 'BALANCED · FAST · FORGIVING',
    taglineAr: 'متوازن · سريع · متسامح',
    color: '#00f0ff',
    shots: 1,
    spread: 0,
    aimAssist: 0.65,
    boltScale: 1,
  },
  scatter: {
    id: 'scatter',
    nameEn: 'SPLIT-SHOT',
    nameAr: 'الرشقة الثلاثية',
    taglineEn: '3 BOLTS · WIDE ARC · CROWDS',
    taglineAr: '3 طلقات · قوس واسع · للحشود',
    color: '#f59e0b',
    shots: 3,
    spread: 0.16,
    aimAssist: 0.45,
    boltScale: 0.8,
  },
  lance: {
    id: 'lance',
    nameEn: 'ION LANCE',
    nameAr: 'رمح الأيون',
    taglineEn: 'PIN-POINT · HARD LOCK',
    taglineAr: 'دقيق · قفل مغناطيسي قوي',
    color: '#ec4899',
    shots: 1,
    spread: 0,
    aimAssist: 0.95,
    boltScale: 1.35,
  },
};

export const WEAPON_ORDER: WeaponId[] = ['pulse', 'scatter', 'lance'];
