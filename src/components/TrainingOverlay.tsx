/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Language,
  TrainingStepId,
  TrainingState,
} from '../types/game';
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
  ChevronDown,
  ChevronUp,
  Sparkles,
  HelpCircle,
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
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isArabic = language === 'ar';
  const { step, leftFired, rightFired, packetsDestroyed, shotTargets, lastFeedback } = trainingState;

  // Step definitions
  const stepsList: Array<{ id: TrainingStepId; titleEn: string; titleAr: string }> = [
    { id: 'welcome', titleEn: 'Welcome', titleAr: 'مقدمة' },
    { id: 'blaster_basics', titleEn: '1. Blasters & Recoil', titleAr: '1. مدافع الليزر' },
    { id: 'target_lock', titleEn: '2. Target Lock-On', titleAr: '2. قفل التصويب' },
    { id: 'scenario_firewall', titleEn: '3. Hex Firewall', titleAr: '3. جدار الحماية' },
    { id: 'scenario_payload', titleEn: '4. Payload Shields', titleAr: '4. شفرات التشفير' },
    { id: 'scenario_ddos', titleEn: '5. DDoS & Subnets', titleAr: '5. طوفان DDoS' },
    { id: 'graduation', titleEn: 'Graduation', titleAr: 'التخرج' },
  ];

  const currentStepIndex = stepsList.findIndex((s) => s.id === step);

  // In VR, don't obstruct the user's field of view with floating flat DOM
  if (vrActive) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-30 flex flex-col justify-between p-3 sm:p-5 no-game-shoot"
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      {/* 1. TOP HEADER & PROGRESS PIPELINE */}
      <div className="pointer-events-auto flex flex-col gap-2 w-full max-w-5xl mx-auto">
        <div className="flex items-center justify-between gap-3 p-3 px-4 rounded-xl bg-slate-950/90 border border-cyan-500/40 backdrop-blur-sm shadow-xl text-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-950 border border-cyan-500/50 text-cyan-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/40">
                  {isArabic ? 'محاكاة تدريبية' : 'TRAINING SIMULATION'}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  {currentStepIndex + 1} / {stepsList.length}
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-black text-cyan-300 font-mono mt-0.5">
                {isArabic ? stepsList[currentStepIndex].titleAr : stepsList[currentStepIndex].titleEn}
              </h2>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenManual}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-mono font-bold transition-all cursor-pointer shadow-sm"
              title="Open Incident Manual"
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">{isArabic ? 'دليل الطاولة' : 'Table Rulebook'}</span>
            </button>

            <button
              onClick={onToggleMute}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-400 transition-all cursor-pointer"
              aria-label="Toggle Mute"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onStartMainGame}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black uppercase font-mono transition-all cursor-pointer shadow-sm"
            >
              <span>{isArabic ? 'تخطي للقتال' : 'Skip To Mission'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Step Progression Tabs */}
        <div className="grid grid-cols-7 gap-1.5 p-1 rounded-xl bg-slate-950/80 border border-slate-800 backdrop-blur-sm overflow-x-auto">
          {stepsList.map((s, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            return (
              <button
                key={s.id}
                onClick={() => onSetStep(s.id)}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer truncate ${
                  isCurrent
                    ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-400 shadow-sm'
                    : isCompleted
                    ? 'bg-slate-900/80 text-emerald-400 hover:text-emerald-300'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <Circle className="w-3 h-3 text-slate-600 shrink-0" />
                )}
                <span className="truncate">{idx + 1}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. CENTER INSTRUCTION CARD (Interactive Guidance & Tasks) */}
      <div className="pointer-events-auto my-auto mx-auto w-full max-w-xl">
        {step === 'welcome' && (
          <div className="p-6 rounded-2xl bg-slate-950/95 border-2 border-cyan-500/50 shadow-[0_0_50px_rgba(6,182,212,0.25)] text-center animate-in fade-in duration-200">
            <div className="inline-flex p-3 rounded-full bg-cyan-500/20 text-cyan-300 mb-3">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white mb-2">
              {isArabic ? 'أهلاً بك في أكاديمية الدفاع السيبراني' : 'WELCOME TO CYBER DEFENSE ACADEMY'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
              {isArabic
                ? 'ستتعلم في هذا التمرين التفاعلي: كيفية إطلاق مدافع الليزر المزدوجة، ونظام التصويب المغناطيسي التلقائي (Lock-On)، وفك شفرات الحوادث الثلاث بالتعاون مع فريق الطاولة الورقي.'
                : 'In this hands-on simulation, you will master: dual blaster firing with capacitor management, 5-degree magnetic aim lock-on, and the asymmetric incident resolution logic.'}
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={onNextStep}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs uppercase tracking-wider font-mono flex items-center gap-2 cursor-pointer shadow-lg"
              >
                <span>{isArabic ? 'بدء التمرين الأول' : 'Begin Stage 1: Blasters'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 'blaster_basics' && (
          <div className="p-5 rounded-2xl bg-slate-950/90 border border-cyan-500/40 shadow-xl backdrop-blur-md">
            <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold uppercase mb-2">
              <Zap className="w-4 h-4" />
              <span>{isArabic ? 'أهداف المرحلة 1: معايرة الأسلحة ومكثف الطاقة' : 'Stage 1 Objectives: Blaster Calibration'}</span>
            </div>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              {isArabic
                ? 'استخدم الماوس أو قبضات الواقع الافتراضي. لاحظ شاشة OLED فوق السلاح: إطلاق الليزر يستهلك طاقة المكثف التي تشحن تلقائياً بعد ثانية.'
                : 'Fire both cyber blasters. Notice the top OLED screen: firing drains capacitor voltage, which auto-recharges rapidly.'}
            </p>

            {/* Checklist */}
            <div className="space-y-2 mb-5">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs font-mono">
                <span className="flex items-center gap-2 text-slate-200">
                  {rightFired ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Circle className="w-4 h-4 text-slate-500" />}
                  <span>{isArabic ? 'إطلاق المدفع الأيمن (Cyan / انقر باليسار)' : 'Fire Right Blaster (Cyan / Left-Click)'}</span>
                </span>
                <span className={rightFired ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                  {rightFired ? 'DONE [✓]' : 'WAITING'}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs font-mono">
                <span className="flex items-center gap-2 text-slate-200">
                  {leftFired ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Circle className="w-4 h-4 text-slate-500" />}
                  <span>{isArabic ? 'إطلاق المدفع الأيسر (Magenta / انقر باليمين)' : 'Fire Left Blaster (Magenta / Right-Click)'}</span>
                </span>
                <span className={leftFired ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                  {leftFired ? 'DONE [✓]' : 'WAITING'}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs font-mono">
                <span className="flex items-center gap-2 text-slate-200">
                  {packetsDestroyed >= 2 ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Circle className="w-4 h-4 text-slate-500" />}
                  <span>{isArabic ? 'تدمير طائرتي التدريب العائمتين أمامك' : 'Destroy 2 floating training drones in scene'}</span>
                </span>
                <span className={packetsDestroyed >= 2 ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                  {packetsDestroyed} / 2
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={onPrevStep}
                className="px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 text-xs font-mono flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{isArabic ? 'السابق' : 'Back'}</span>
              </button>

              <button
                onClick={onNextStep}
                disabled={!rightFired || !leftFired || packetsDestroyed < 2}
                className={`px-5 py-2.5 rounded-xl font-black text-xs font-mono uppercase flex items-center gap-2 cursor-pointer transition-all ${
                  rightFired && leftFired && packetsDestroyed >= 2
                    ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg'
                    : 'bg-slate-800 text-slate-500 opacity-60 cursor-not-allowed'
                }`}
              >
                <span>{isArabic ? 'المرحلة التالية: القفل التلقائي' : 'Next Stage: Target Lock'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 'target_lock' && (
          <div className="p-5 rounded-2xl bg-slate-950/90 border border-cyan-500/40 shadow-xl backdrop-blur-md">
            <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold uppercase mb-2">
              <Target className="w-4 h-4" />
              <span>{isArabic ? 'المرحلة 2: نظام التصويب المغناطيسي (Aim Assist)' : 'Stage 2: Magnetic Aim Assist'}</span>
            </div>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              {isArabic
                ? 'مرر مؤشر السلاح بالقرب من الأبراج الثلاثة في الغرفة. ستسمع نغمة إلكترونية وستتحول شاشة السلاح إلى [LOCK-ON] باللون الأخضر. أطلق النار على كل برج وهو في وضع القفل.'
                : 'Hover your blaster near the 3 target pylons in the 3D room. When within 5 degrees, the laser magnetically snaps onto target, playing an audio chirp and displaying [LOCK-ON] in green. Shoot all 3 pylons.'}
            </p>

            {/* Checklist */}
            <div className="space-y-2 mb-5">
              {['pylon-alpha', 'pylon-beta', 'pylon-gamma'].map((pid) => {
                const label = pid === 'pylon-alpha' ? 'Pylon ALPHA' : pid === 'pylon-beta' ? 'Pylon BETA' : 'Pylon GAMMA';
                const isShot = shotTargets.includes(pid);
                return (
                  <div key={pid} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs font-mono">
                    <span className="flex items-center gap-2 text-slate-200">
                      {isShot ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Circle className="w-4 h-4 text-slate-500" />}
                      <span>{label}</span>
                    </span>
                    <span className={isShot ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                      {isShot ? 'LOCKED & SHOT [✓]' : 'AIM & SHOOT'}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={onPrevStep}
                className="px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 text-xs font-mono flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{isArabic ? 'السابق' : 'Back'}</span>
              </button>

              <button
                onClick={onNextStep}
                disabled={!['pylon-alpha', 'pylon-beta', 'pylon-gamma'].every((p) => shotTargets.includes(p))}
                className={`px-5 py-2.5 rounded-xl font-black text-xs font-mono uppercase flex items-center gap-2 cursor-pointer transition-all ${
                  ['pylon-alpha', 'pylon-beta', 'pylon-gamma'].every((p) => shotTargets.includes(p))
                    ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg'
                    : 'bg-slate-800 text-slate-500 opacity-60 cursor-not-allowed'
                }`}
              >
                <span>{isArabic ? 'المرحلة 3: جدار الحماية' : 'Next Stage: Firewall'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 'scenario_firewall' && (
          <div className="p-5 rounded-2xl bg-slate-950/90 border border-cyan-500/40 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold uppercase">
                <Shield className="w-4 h-4" />
                <span>{isArabic ? 'المرحلة 3: سيناريو جدار الحماية وشفرة Hex' : 'Stage 3: Firewall & Hex Port Matching'}</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/50 text-cyan-300 font-mono text-[11px] font-bold">
                INCIDENT 1
              </span>
            </div>

            <p className="text-xs text-slate-300 mb-3 leading-relaxed">
              {isArabic
                ? 'يرى لاعب الواقع الافتراضي رمز اختراق سداسي: [0x0050]. يقوم فريق الطاولة بمراجعة جدول الدليل الورقي وإخباره: "الرمز 0x0050 يعني المنفذ 80 (HTTP)! أطلق على 80!"'
                : 'The VR Defender sees breach code [0x0050]. Outside team consults their manual and shouts: "0x0050 is Port 80 (HTTP)! Shoot Port 80!"'}
            </p>

            {/* Simulated Table Comms Callout */}
            <div className="mb-4 p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-amber-300 text-xs font-mono">
                <Radio className="w-4 h-4 shrink-0 text-amber-400" />
                <span>
                  {isArabic
                    ? 'فريق الطاولة: "الرمز 0x0050 هو المنفذ 80 (HTTP)! أطلق على أسطوانة Port 80!"'
                    : 'Table Comms: "Code 0x0050 translates to Port 80 (HTTP)! Shoot Port 80!"'}
                </span>
              </div>
              <button
                onClick={onTriggerCommsHint}
                className="px-2.5 py-1 rounded bg-amber-500/30 hover:bg-amber-500/50 text-amber-200 text-[11px] font-mono shrink-0 cursor-pointer"
              >
                {isArabic ? 'إعادة النداء' : 'Replay Shout'}
              </button>
            </div>

            {/* Checklist */}
            <div className="space-y-2 mb-5">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs font-mono">
                <span className="flex items-center gap-2 text-slate-200">
                  {shotTargets.includes('80') ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Circle className="w-4 h-4 text-slate-500" />}
                  <span>{isArabic ? 'أطلق على أسطوانة المنفذ 80 (Port 80)' : 'Shoot Port 80 Cylinder in scene'}</span>
                </span>
                <span className={shotTargets.includes('80') ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                  {shotTargets.includes('80') ? 'SECURED [✓]' : 'TARGET: 80'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={onPrevStep}
                className="px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 text-xs font-mono flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{isArabic ? 'السابق' : 'Back'}</span>
              </button>

              <button
                onClick={onNextStep}
                disabled={!shotTargets.includes('80')}
                className={`px-5 py-2.5 rounded-xl font-black text-xs font-mono uppercase flex items-center gap-2 cursor-pointer transition-all ${
                  shotTargets.includes('80')
                    ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg'
                    : 'bg-slate-800 text-slate-500 opacity-60 cursor-not-allowed'
                }`}
              >
                <span>{isArabic ? 'المرحلة 4: شفرات الراوتر' : 'Next Stage: Payload'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 'scenario_payload' && (
          <div className="p-5 rounded-2xl bg-slate-950/90 border border-cyan-500/40 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold uppercase">
                <Shield className="w-4 h-4" />
                <span>{isArabic ? 'المرحلة 4: الحمولة الخبيثة وترياق التشفير' : 'Stage 4: Corrupted Payload & Shields'}</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/50 text-cyan-300 font-mono text-[11px] font-bold">
                INCIDENT 2
              </span>
            </div>

            <p className="text-xs text-slate-300 mb-3 leading-relaxed">
              {isArabic
                ? 'يرى لاعب الواقع الافتراضي تتابع وميض الراوتر: [أحمر - أزرق - أخضر]. يخبر فريق الطاولة، فيكتشفون أنه هجوم فدية (Ransomware) وعلاجه إطلاق درع [AES-256].'
                : 'The router blinks [RED - BLUE - GREEN]. VR player shouts this sequence; Table Team checks their rulebook: Ransomware infection -> Prescribed shield is [AES-256].'}
            </p>

            {/* Simulated Table Comms Callout */}
            <div className="mb-4 p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-amber-300 text-xs font-mono">
                <Radio className="w-4 h-4 shrink-0 text-amber-400" />
                <span>
                  {isArabic
                    ? 'فريق الطاولة: "تتابع أحمر-أزرق-أخضر هو برمجية فدية! أطلق على كرة درع AES-256!"'
                    : 'Table Comms: "Red-Blue-Green is Ransomware! Shoot the AES-256 shield orb!"'}
                </span>
              </div>
              <button
                onClick={onTriggerCommsHint}
                className="px-2.5 py-1 rounded bg-amber-500/30 hover:bg-amber-500/50 text-amber-200 text-[11px] font-mono shrink-0 cursor-pointer"
              >
                {isArabic ? 'إعادة النداء' : 'Replay Shout'}
              </button>
            </div>

            {/* Checklist */}
            <div className="space-y-2 mb-5">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs font-mono">
                <span className="flex items-center gap-2 text-slate-200">
                  {shotTargets.includes('AES-256') ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Circle className="w-4 h-4 text-slate-500" />}
                  <span>{isArabic ? 'أطلق على كرة درع AES-256' : 'Shoot AES-256 Shield Orb'}</span>
                </span>
                <span className={shotTargets.includes('AES-256') ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                  {shotTargets.includes('AES-256') ? 'CLEANSED [✓]' : 'TARGET: AES-256'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={onPrevStep}
                className="px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 text-xs font-mono flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{isArabic ? 'السابق' : 'Back'}</span>
              </button>

              <button
                onClick={onNextStep}
                disabled={!shotTargets.includes('AES-256')}
                className={`px-5 py-2.5 rounded-xl font-black text-xs font-mono uppercase flex items-center gap-2 cursor-pointer transition-all ${
                  shotTargets.includes('AES-256')
                    ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg'
                    : 'bg-slate-800 text-slate-500 opacity-60 cursor-not-allowed'
                }`}
              >
                <span>{isArabic ? 'المرحلة 5: طوفان DDoS' : 'Next Stage: DDoS'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 'scenario_ddos' && (
          <div className="p-5 rounded-2xl bg-slate-950/90 border border-cyan-500/40 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold uppercase">
                <Shield className="w-4 h-4" />
                <span>{isArabic ? 'المرحلة 5: هجوم DDoS وتوجيه الثقب الأسود' : 'Stage 5: DDoS Mitigation & Subnet Blackholing'}</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/50 text-cyan-300 font-mono text-[11px] font-bold">
                INCIDENT 3
              </span>
            </div>

            <p className="text-xs text-slate-300 mb-3 leading-relaxed">
              {isArabic
                ? 'الآي بي المهاجم [192.168.4.110]. يراجع فريق الطاولة جدول النطاقات: يقع ضمن Subnet Delta (192.168.4.0/24) المرتبط بالعقدة BETA. إطلاق النار على BETA يطلق نبضة EMP تدمر البوتنت!'
                : 'Attacking IP is [192.168.4.110]. Table Team matches it with Subnet Delta (192.168.4.0/24) routed through Node BETA. Shooting Node BETA activates the EMP shockwave!'}
            </p>

            {/* Simulated Table Comms Callout */}
            <div className="mb-4 p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-amber-300 text-xs font-mono">
                <Radio className="w-4 h-4 shrink-0 text-amber-400" />
                <span>
                  {isArabic
                    ? 'فريق الطاولة: "الآي بي 192.168.4.110 يتبع النطاق BETA! أطلق على عقدة BETA لإطلاق نبضة EMP!"'
                    : 'Table Comms: "IP 192.168.4.110 routes to Node BETA! Shoot Node BETA for EMP shockwave!"'}
                </span>
              </div>
              <button
                onClick={onTriggerCommsHint}
                className="px-2.5 py-1 rounded bg-amber-500/30 hover:bg-amber-500/50 text-amber-200 text-[11px] font-mono shrink-0 cursor-pointer"
              >
                {isArabic ? 'إعادة النداء' : 'Replay Shout'}
              </button>
            </div>

            {/* Checklist */}
            <div className="space-y-2 mb-5">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs font-mono">
                <span className="flex items-center gap-2 text-slate-200">
                  {shotTargets.includes('BETA') ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Circle className="w-4 h-4 text-slate-500" />}
                  <span>{isArabic ? 'أطلق على العقدة المركزية BETA' : 'Shoot Core Node BETA'}</span>
                </span>
                <span className={shotTargets.includes('BETA') ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                  {shotTargets.includes('BETA') ? 'EMP ACTIVATED [✓]' : 'TARGET: NODE BETA'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={onPrevStep}
                className="px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 text-xs font-mono flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{isArabic ? 'السابق' : 'Back'}</span>
              </button>

              <button
                onClick={onNextStep}
                disabled={!shotTargets.includes('BETA')}
                className={`px-5 py-2.5 rounded-xl font-black text-xs font-mono uppercase flex items-center gap-2 cursor-pointer transition-all ${
                  shotTargets.includes('BETA')
                    ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg'
                    : 'bg-slate-800 text-slate-500 opacity-60 cursor-not-allowed'
                }`}
              >
                <span>{isArabic ? 'إكمال التدريب والتخرج' : 'Graduate Academy'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 'graduation' && (
          <div className="p-6 rounded-2xl bg-slate-950/95 border-2 border-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.3)] text-center animate-in fade-in zoom-in duration-200">
            <div className="inline-flex p-3 rounded-full bg-emerald-500/20 text-emerald-400 mb-3">
              <Award className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-black text-white mb-1">
              {isArabic ? 'تهانينا! لقد تخرجت رسمياً' : 'TACTICAL TRAINING COMPLETED!'}
            </h3>
            <p className="text-xs font-mono text-emerald-400 uppercase tracking-widest mb-3">
              {isArabic ? 'رخصة مشغل الدفاع السيبراني معتمدة' : 'CERTIFIED CYBER INCIDENT OPERATIVE'}
            </p>
            <p className="text-xs text-slate-300 leading-relaxed mb-6 max-w-md mx-auto">
              {isArabic
                ? 'أتقنت الآن عناصر التحكم بالليزر، والقفل المغناطيسي التلقائي، والتعاون مع فريق الطاولة في حوادث Hex، وPayloads، وDDoS. أنت جاهز الآن لخوض المعركة الحقيقية!'
                : 'You have mastered blaster recoil, magnetic aim locking, and asymmetric team communication across all 3 incident scenarios. You are ready for live combat!'}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={onStartMainGame}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider font-mono flex items-center justify-center gap-2 cursor-pointer shadow-lg transform hover:scale-105 transition-all"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                <span>{isArabic ? 'بدء المهمة المباشرة (الانطلاق)' : 'Deploy To Live Incident'}</span>
              </button>

              <button
                onClick={onResetTraining}
                className="w-full sm:w-auto px-5 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs font-mono flex items-center justify-center gap-2 cursor-pointer border border-slate-800"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{isArabic ? 'إعادة التدريب من البداية' : 'Practice Academy Again'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. COLLAPSIBLE BOTTOM TACTICAL DOCK (Three.js UX Directives) */}
      <div className="pointer-events-auto w-full max-w-3xl mx-auto flex flex-col items-center">
        {/* Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="mb-1 px-3 py-0.5 rounded-t-lg bg-slate-900/80 border-t border-x border-slate-800 text-[11px] font-mono text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
        >
          {isCollapsed ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          <span>{isCollapsed ? (isArabic ? 'إظهار لوحة التدريب' : 'Show Training Dock') : (isArabic ? 'إخفاء لوحة التدريب' : 'Hide Dock')}</span>
        </button>

        {!isCollapsed && (
          <div className="w-full p-3 px-4 rounded-2xl bg-slate-950/85 border border-cyan-500/30 backdrop-blur-sm shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            {/* Table Team Comms Simulation */}
            <div className="flex items-center gap-2">
              <button
                onClick={onTriggerCommsHint}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 font-mono font-bold shrink-0 transition-all cursor-pointer"
              >
                <Radio className="w-3.5 h-3.5" />
                <span>{isArabic ? 'نداء فريق الطاولة' : 'Table Comms'}</span>
              </button>

              <button
                onClick={onOpenManual}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 font-mono text-[11px] cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                <span>{isArabic ? 'فتح الدليل' : 'View Rulebook'}</span>
              </button>
            </div>

            {/* Quick Helper text */}
            <div className="text-[11px] font-mono text-slate-400 hidden sm:block">
              {isArabic
                ? 'التدريب لا يحتوي على عداد وقت أو خسارة صحة — تدرب بحرية تامة'
                : 'Training has no timer or health penalties — practice freely'}
            </div>

            {/* Reset / Exit buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={onResetTraining}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 transition-all cursor-pointer"
                title="Restart Training"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={onStartMainGame}
                className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-mono font-black transition-all cursor-pointer"
              >
                {isArabic ? 'بدء اللعبة' : 'Start Game'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
