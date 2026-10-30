/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Language, TrainingStepId, TrainingState } from '../types/game';
import {
  Shield,
  Target,
  Zap,
  CheckCircle2,
  Circle,
  Radio,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Volume2,
  VolumeX,
  Play,
  Award,
  Sparkles,
  X,
  Crosshair,
} from 'lucide-react';

interface TrainingOverlayProps {
  language: Language;
  trainingState: TrainingState;
  onSetStep: (step: TrainingStepId) => void;
  onNextStep: () => void;
  onPrevStep: () => void;
  onResetTraining: () => void;
  onStartMainGame: () => void;
  onOpenManual: () => void;
  onTriggerCommsHint: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  vrActive: boolean;
}

/**
 * Non-Intrusive Compact Top HUD Banner for Tutorial Mode (<10% screen height).
 * ELIMINATES all center modal popups so the player's line of sight, 3D targets,
 * and laser blasters remain 100% unobstructed.
 */
export const TrainingOverlay: React.FC<TrainingOverlayProps> = ({
  language,
  trainingState,
  onSetStep,
  onNextStep,
  onPrevStep,
  onResetTraining,
  onStartMainGame,
  onOpenManual,
  onTriggerCommsHint,
  isMuted,
  onToggleMute,
  vrActive,
}) => {
  const isArabic = language === 'ar';
  const { step, leftFired, rightFired, packetsDestroyed, shotTargets } = trainingState;

  // In VR mode, hide flat DOM overlay so WebXR field of view remains clear
  if (vrActive) return null;

  // 3-Step Live Protocol Mapping
  const stepsMap: Record<
    TrainingStepId,
    {
      num: number;
      titleEn: string;
      titleAr: string;
      instructionEn: string;
      instructionAr: string;
    }
  > = {
    welcome: {
      num: 1,
      titleEn: '1. Blaster Calibration',
      titleAr: '1. معايرة مدافع الليزر',
      instructionEn: 'Fire right and left laser blasters at the 2 test orbs ahead to verify calibration.',
      instructionAr: 'أطلق النار بالسلاح الأيمن والأيسر على الكرتين أمامك لتأكيد المعايرة.',
    },
    blaster_basics: {
      num: 1,
      titleEn: '1. Blaster Calibration',
      titleAr: '1. معايرة مدافع الليزر',
      instructionEn: 'Fire right and left laser blasters at the 2 test orbs ahead to verify calibration.',
      instructionAr: 'أطلق النار بالسلاح الأيمن والأيسر على الكرتين أمامك لتأكيد المعايرة.',
    },
    target_lock: {
      num: 2,
      titleEn: '2. Target Lock & Shoot',
      titleAr: '2. التصويب والقفل المغناطيسي',
      instructionEn: 'Aim and shoot the highlighted PORT 22 / SSH target card in 3D space.',
      instructionAr: 'صوّب وأطلق الليزر على لوحة الهدف المحددة (PORT 22 / SSH) في الغرفة.',
    },
    scenario_firewall: {
      num: 2,
      titleEn: '2. Target Lock & Shoot',
      titleAr: '2. التصويب والقفل المغناطيسي',
      instructionEn: 'Aim and shoot the highlighted PORT 22 / SSH target card in 3D space.',
      instructionAr: 'صوّب وأطلق الليزر على لوحة الهدف المحددة (PORT 22 / SSH) في الغرفة.',
    },
    scenario_payload: {
      num: 2,
      titleEn: '2. Target Lock & Shoot',
      titleAr: '2. التصويب والقفل المغناطيسي',
      instructionEn: 'Aim and shoot the highlighted PORT 22 / SSH target card in 3D space.',
      instructionAr: 'صوّب وأطلق الليزر على لوحة الهدف المحددة (PORT 22 / SSH) في الغرفة.',
    },
    scenario_ddos: {
      num: 3,
      titleEn: '3. Malware Swarm Defense',
      titleAr: '3. صد كبسولة الفيروس الخبيث',
      instructionEn: 'Destroy the incoming test virus packet before it impacts the Protected Core Node.',
      instructionAr: 'دمر كبسولة الفيروس القادمة قبل اصطدامها بنواة الخادم المركزي.',
    },
    graduation: {
      num: 3,
      titleEn: '3. Graduation Completed',
      titleAr: '3. اكتمل التدريب بنجاح',
      instructionEn: 'Training complete! Ready to launch Quantum Time Tunnel into main mission.',
      instructionAr: 'اكتمل التدريب بنجاح! أنت جاهز للقفز بالزمن إلى المهمة الرئيسية.',
    },
  };

  const currentStep = stepsMap[step] || stepsMap.welcome;

  return (
    <div
      className="pointer-events-none fixed top-0 left-0 right-0 z-30 p-3 sm:p-4 no-game-shoot"
      dir={isArabic ? 'rtl' : 'ltr'}
      style={{ fontFamily: isArabic ? "'Cairo', sans-serif" : "'JetBrains Mono', monospace" }}
    >
      {/* COMPACT TOP HUD BANNER (<10% Viewport Height) */}
      <div className="pointer-events-auto w-full max-w-4xl mx-auto p-3 px-5 rounded-2xl bg-[#020611]/90 border border-cyan-500/60 backdrop-blur-xl shadow-[0_0_30px_rgba(0,240,255,0.2)] flex items-center justify-between gap-4 text-slate-100 relative overflow-hidden">
        {/* Subtle Scanline Texture */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(0,240,255,0.03)_1px,transparent_1px)] bg-[size:100%_4px] opacity-40" />

        {/* Left: Step Badge & Instruction */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="p-2 rounded-xl bg-[#030d22] border border-cyan-400 text-cyan-300 shrink-0 shadow-[0_0_10px_rgba(0,240,255,0.3)]">
            <Crosshair className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/50 shadow-[0_0_8px_rgba(52,211,153,0.3)]">
                {isArabic ? `تمرين ${currentStep.num} من 3` : `STEP ${currentStep.num} / 3`}
              </span>
              <span className="text-xs font-black tracking-wide text-cyan-300">
                {isArabic ? currentStep.titleAr : currentStep.titleEn}
              </span>
            </div>
            <p className="text-xs text-white font-extrabold mt-0.5 leading-tight">
              {isArabic ? currentStep.instructionAr : currentStep.instructionEn}
            </p>
          </div>
        </div>

        {/* Center: Live Task Progress Badges */}
        <div className="hidden md:flex items-center gap-2 text-xs font-bold shrink-0 relative z-10">
          {(step === 'welcome' || step === 'blaster_basics') && (
            <>
              <span className={`px-2.5 py-1 rounded-xl border flex items-center gap-1.5 transition-all ${rightFired ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500 shadow-[0_0_10px_rgba(52,211,153,0.4)]' : 'bg-[#030d22] text-slate-400 border-slate-700'}`}>
                {rightFired ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Circle className="w-3.5 h-3.5 text-slate-500" />}
                <span>{isArabic ? 'السلاح الأيمن' : 'Right Blaster'}</span>
              </span>
              <span className={`px-2.5 py-1 rounded-xl border flex items-center gap-1.5 transition-all ${leftFired ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500 shadow-[0_0_10px_rgba(52,211,153,0.4)]' : 'bg-[#030d22] text-slate-400 border-slate-700'}`}>
                {leftFired ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Circle className="w-3.5 h-3.5 text-slate-500" />}
                <span>{isArabic ? 'السلاح الأيسر' : 'Left Blaster'}</span>
              </span>
            </>
          )}

          {(step === 'target_lock' || step === 'scenario_firewall' || step === 'scenario_payload') && (
            <span className={`px-2.5 py-1 rounded-xl border flex items-center gap-1.5 transition-all ${shotTargets.length > 0 ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500 shadow-[0_0_10px_rgba(52,211,153,0.4)]' : 'bg-[#030d22] text-amber-300 border-amber-500/60 shadow-[0_0_10px_rgba(245,158,11,0.3)] animate-pulse'}`}>
              <Target className="w-3.5 h-3.5 text-cyan-400" />
              <span>{shotTargets.length > 0 ? (isArabic ? 'تم القفل والإصابة ✓' : 'TARGET SHOT ✓') : (isArabic ? 'صوّب على الهدف' : 'AIM & SHOOT')}</span>
            </span>
          )}

          {(step === 'scenario_ddos' || step === 'graduation') && (
            <span className="px-2.5 py-1 rounded-xl bg-emerald-950/90 text-emerald-300 border border-emerald-500 flex items-center gap-1.5 shadow-[0_0_15px_rgba(52,211,153,0.5)]">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isArabic ? 'اكتمل التدريب!' : 'TRAINING COMPLETE!'}</span>
            </span>
          )}
        </div>

        {/* Right: Quick Actions */}
        <div className="flex items-center gap-2 shrink-0 relative z-10">
          <button
            onClick={onOpenManual}
            className="p-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/50 text-xs font-black transition-all cursor-pointer shadow-sm"
            title="Rulebook"
          >
            <BookOpen className="w-4 h-4 text-amber-400" />
          </button>

          <button
            onClick={onToggleMute}
            className="p-2 rounded-xl bg-[#030d22] border border-slate-700 text-slate-300 hover:text-cyan-400 transition-all cursor-pointer shadow-sm"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            onClick={onStartMainGame}
            className="px-4.5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-[0_0_20px_rgba(245,158,11,0.6)] transform hover:scale-105 active:scale-95"
          >
            <Play className="w-3.5 h-3.5 fill-slate-950" />
            <span>{isArabic ? 'الانطلاق' : 'Launch'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
