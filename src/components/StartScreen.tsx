/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Language, ScenarioId, DifficultyLevel, CinematicStep } from '../types/game';
import {
  Shield,
  BookOpen,
  Glasses,
  Monitor,
  Volume2,
  VolumeX,
  Crosshair,
  Sparkles,
  Zap,
  ArrowLeft,
  ArrowRight,
  Home,
  Target,
  Flame,
} from 'lucide-react';

interface StartScreenProps {
  language: Language;
  onSelectLanguage: (lang: Language) => void;
  difficulty: DifficultyLevel;
  onSelectDifficulty: (d: DifficultyLevel) => void;
  selectedScenario: ScenarioId | 'random';
  onSelectScenario: (sc: ScenarioId | 'random') => void;
  cinematicStep: CinematicStep;
  onGoToScenarioSelect: () => void;
  onGoToDifficultySelect: () => void;
  onBackToSplash: () => void;
  onBackToScenarioSelect: () => void;
  onStartGame: () => void;
  onEnterVR: () => void;
  onPlayDesktop: () => void;
  onStartTraining: () => void;
  onOpenManual: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

/**
 * Non-blocking Cyberpunk Tactical HUD Overlay
 * - Transparent pointer-events-none viewport letting 3D Holographic targets shine through
 * - Dual Blaster Shoot-to-Interact guidance across Desktop and VR
 * - Clean top header bar for Language, Rulebook, Sound, and Step Telemetry
 */
export const StartScreen: React.FC<StartScreenProps> = ({
  language,
  onSelectLanguage,
  difficulty,
  selectedScenario,
  cinematicStep,
  onBackToSplash,
  onBackToScenarioSelect,
  onEnterVR,
  onPlayDesktop,
  onOpenManual,
  isMuted,
  onToggleMute,
}) => {
  const isArabic = language === 'ar';

  return (
    <div
      className="pointer-events-none fixed inset-0 z-30 flex flex-col justify-between p-3 sm:p-5 text-slate-100 select-none overflow-hidden"
      dir={isArabic ? 'rtl' : 'ltr'}
      style={{ fontFamily: isArabic ? "'Cairo', sans-serif" : "'JetBrains Mono', monospace" }}
    >
      {/* Subtle Scanlines effect overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(0,240,255,0.02)_1px,transparent_1px)] bg-[size:100%_4px] opacity-35" />

      {/* TOP HEADER HUD (pointer-events-auto) */}
      <header className="pointer-events-auto w-full max-w-5xl mx-auto flex items-center justify-between py-2.5 px-4.5 rounded-2xl bg-[#020611]/80 border border-cyan-500/40 shadow-[0_0_25px_rgba(0,240,255,0.15)] backdrop-blur-xl relative z-10 no-game-shoot">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#030d22] border border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(0,240,255,0.35)] shrink-0">
            <Shield className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-teal-200 to-amber-300">
                {isArabic ? 'السرقة السيبرانية: حامي العقد' : 'CYBER HEIST: NODE DEFENDER'}
              </h1>
              <span className="hidden sm:inline-block px-1.5 py-0.2 rounded text-[9px] font-mono font-black uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                v2.0 SOC
              </span>
            </div>
            <p className="text-[10px] text-cyan-400/80 font-bold hidden sm:block">
              {isArabic ? 'نظام الدفاع السيبراني التفاعلي // إطلاق الليزر للاختيار' : 'Asymmetric WebXR Defense // Shoot-to-Interact'}
            </p>
          </div>
        </div>

        {/* Center: Glowing Shoot-to-Interact Status Alert */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-amber-400/10 border border-amber-400/50 text-amber-300 text-xs font-black shadow-[0_0_15px_rgba(245,158,11,0.2)] animate-pulse">
          <Crosshair className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden md:inline">
            {isArabic ? 'صوّب وأطلق الليزر على الأهداف ثلاثية الأبعاد للاختيار' : 'AIM & SHOOT 3D TARGETS TO SELECT'}
          </span>
          <span className="md:hidden">
            {isArabic ? 'أطلق بالليزر للاختيار' : 'SHOOT TO SELECT'}
          </span>
        </div>

        {/* Right: Language Toggle, Rulebook, Sound */}
        <div className="flex items-center gap-2">
          {/* Language Toggle [ AR | EN ] */}
          <div className="flex items-center p-0.5 rounded-xl bg-[#030c1f] border border-cyan-500/50 shadow-inner">
            <button
              onClick={() => onSelectLanguage('ar')}
              className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                language === 'ar'
                  ? 'bg-gradient-to-r from-cyan-400 to-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(0,240,255,0.8)]'
                  : 'text-slate-400 hover:text-cyan-200'
              }`}
            >
              عربي
            </button>
            <button
              onClick={() => onSelectLanguage('en')}
              className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                language === 'en'
                  ? 'bg-gradient-to-r from-cyan-400 to-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(0,240,255,0.8)]'
                  : 'text-slate-400 hover:text-cyan-200'
              }`}
            >
              EN
            </button>
          </div>

          <button
            onClick={onOpenManual}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#030c1f] border border-amber-500/80 text-amber-300 font-extrabold text-xs hover:bg-amber-500/20 transition-all cursor-pointer shadow-sm group"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">{isArabic ? 'الدليل' : 'Rulebook'}</span>
          </button>

          <button
            onClick={onToggleMute}
            className="p-1.5 rounded-xl bg-[#030c1f] border border-slate-700 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-400 transition-all cursor-pointer shadow-sm"
            aria-label="Toggle Sound"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* CENTER HUD: Reticle Aim Assist Indicator (pointer-events-none) */}
      <div className="pointer-events-none mx-auto my-auto flex flex-col items-center text-center opacity-85">
        {/* Subtle holographic laser crosshair mark */}
        <div className="w-8 h-8 rounded-full border border-cyan-400/40 flex items-center justify-center relative animate-pulse">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(0,240,255,0.9)]" />
          <div className="absolute -top-1 w-0.5 h-2 bg-cyan-400/60" />
          <div className="absolute -bottom-1 w-0.5 h-2 bg-cyan-400/60" />
          <div className="absolute -left-1 h-0.5 w-2 bg-cyan-400/60" />
          <div className="absolute -right-1 h-0.5 w-2 bg-cyan-400/60" />
        </div>
      </div>

      {/* BOTTOM TACTICAL FOOTER HUD (pointer-events-auto controls) */}
      <footer className="pointer-events-none w-full max-w-4xl mx-auto flex flex-col items-center gap-2 relative z-10">
        {/* Mode Guidance Strip */}
        <div className="pointer-events-auto px-4 py-1.5 rounded-xl bg-[#020611]/85 border border-cyan-500/30 backdrop-blur-xl text-xs font-bold text-slate-200 shadow-lg flex items-center gap-3">
          <Target className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>
            {cinematicStep === 'splash'
              ? isArabic
                ? '⚡ صوّب الليزر على [ابدأ حماية الشبكة] أو [نمط التدريب] في الغرفة للاختيار'
                : '⚡ Shoot laser at [INITIALIZE DEFENSE] or [TRAINING SIMULATION] target'
              : cinematicStep === 'scenario_select'
              ? isArabic
                ? '⚡ أطلق الليزر على بطاقة السيناريو (اختراق الجدار / الحمولة / طوفان DDoS)'
                : '⚡ Shoot laser at any scenario card (Hex Breach, Payload Purge, DDoS Blackhole)'
              : isArabic
              ? '⚡ أطلق الليزر على بطاقة الصعوبة ثم أطلق على [بدء المهمة السيبرانية]'
              : '⚡ Shoot laser at difficulty tier card, then shoot [LAUNCH MISSION]'}
          </span>
        </div>

        {/* Hardware Quick Actions */}
        <div className="pointer-events-auto flex items-center gap-3 text-xs font-black no-game-shoot">
          {cinematicStep !== 'splash' && (
            <button
              onClick={cinematicStep === 'difficulty_select' ? onBackToScenarioSelect : onBackToSplash}
              className="px-3.5 py-1.5 rounded-xl bg-[#020611]/90 border border-slate-700 hover:border-cyan-400 text-slate-300 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 shadow-md"
            >
              <Home className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isArabic ? 'رجوع' : 'Back'}</span>
            </button>
          )}

          <button
            onClick={onEnterVR}
            className="px-3.5 py-1.5 rounded-xl bg-[#020611]/90 border border-cyan-500/60 hover:border-cyan-400 text-cyan-300 font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md group"
          >
            <Glasses className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span>{isArabic ? 'خوذة VR (Meta Quest 3)' : 'VR Mode (Quest 3)'}</span>
          </button>

          <button
            onClick={onPlayDesktop}
            className="px-3.5 py-1.5 rounded-xl bg-[#020611]/90 border border-slate-700 hover:border-slate-500 text-slate-300 font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md"
          >
            <Monitor className="w-3.5 h-3.5 text-slate-400" />
            <span>{isArabic ? 'شاشة الحاسوب (Desktop)' : 'Desktop Mode'}</span>
          </button>
        </div>
      </footer>
    </div>
  );
};
