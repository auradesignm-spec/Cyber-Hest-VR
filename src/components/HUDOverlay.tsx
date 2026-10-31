/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Language, ScenarioId, GameStatus, DifficultyLevel, CombatPhase } from '../types/game';
import {
  Shield,
  Clock,
  Heart,
  BookOpen,
  Volume2,
  VolumeX,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Radio,
  Sparkles,
  Trophy,
  AlertOctagon,
  GraduationCap,
  Gauge,
  CheckCircle,
  AlertTriangle,
  Zap,
  Crosshair,
  Flame,
  Home,
  ArrowRight,
} from 'lucide-react';

interface HUDOverlayProps {
  language: Language;
  scenarioId: ScenarioId;
  gameStatus: GameStatus;
  combatPhase?: CombatPhase;
  difficulty?: DifficultyLevel;
  onChangeDifficulty?: (d: DifficultyLevel) => void;
  timeRemaining: number;
  hearts?: number; // 0 to 5 hearts
  maxHearts?: number; // 5
  score: number;
  overclockCombo?: number;
  isOverclockActive?: boolean;
  isFeverMode?: boolean;
  multiplier?: number;
  highScore?: number;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenManual: () => void;
  onRestartScenario: () => void;
  onNextScenarioHub: () => void;
  onReturnToMenu: () => void;
  onOpenTraining?: () => void;
  onTriggerTeamShout: () => void;
  lastTeamShout: string | null;
  educationalFeedback?: { messageEn: string; messageAr: string; isCorrect: boolean } | null;
  phaseBanner?: { type: 'alarm' | 'purge' | 'overclock'; messageEn: string; messageAr: string } | null;
  vrActive: boolean;
}

export const HUDOverlay: React.FC<HUDOverlayProps> = ({
  language,
  scenarioId,
  gameStatus,
  combatPhase = 'decoding',
  difficulty = 'medium',
  onChangeDifficulty,
  timeRemaining,
  hearts = 5,
  maxHearts = 5,
  score,
  overclockCombo = 0,
  isOverclockActive = false,
  isFeverMode = false,
  multiplier = 1,
  highScore = 0,
  isMuted,
  onToggleMute,
  onOpenManual,
  onRestartScenario,
  onNextScenarioHub,
  onReturnToMenu,
  onOpenTraining,
  onTriggerTeamShout,
  lastTeamShout,
  educationalFeedback,
  phaseBanner,
  vrActive,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isArabic = language === 'ar';

  const scenarioTitles: Record<ScenarioId, { en: string; ar: string }> = {
    'scenario-1': {
      en: 'Scenario 1: Brute Force Firewall & Hex Port',
      ar: 'السيناريو 1: هجوم القوة الغاشمة ومنافذ Hex',
    },
    'scenario-2': {
      en: 'Scenario 2: Malicious Payload & Color Routing',
      ar: 'السيناريو 2: الحمولة الخبيثة وتشفير الألوان',
    },
    'scenario-3': {
      en: 'Scenario 3: DDoS Overload & Blackhole Subnet',
      ar: 'السيناريو 3: طوفان DDoS وتوجيه الثقب الأسود',
    },
  };

  // In VR mode, hide 2D HTML overlay so 3D field-of-view remains clear
  if (vrActive) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-30 flex flex-col justify-between p-3 sm:p-5 no-game-shoot"
      dir={isArabic ? 'rtl' : 'ltr'}
      style={{ fontFamily: isArabic ? "'Cairo', sans-serif" : "'JetBrains Mono', monospace" }}
    >
      {/* Subtle Cyberpunk Scanline Effect for HUD */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(0,240,255,0.02)_1px,transparent_1px)] bg-[size:100%_4px] opacity-40" />

      {/* Top Header Bar */}
      <div className="pointer-events-auto flex items-center justify-between gap-3 w-full max-w-5xl mx-auto relative z-10">
        {/* Sleek Top-Left Neon HP Bar & Core Status */}
        <div className="flex items-center gap-3.5 p-3 px-4.5 rounded-2xl bg-[#020611]/85 border border-cyan-500/50 backdrop-blur-xl text-slate-100 shadow-[0_0_25px_rgba(0,240,255,0.2)]">
          <div className="relative">
            <Shield className={`w-5 h-5 ${combatPhase === 'defense' ? 'text-red-400 animate-pulse' : 'text-cyan-400'}`} />
            {combatPhase === 'defense' && (
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-wider text-cyan-300">
                {isArabic ? scenarioTitles[scenarioId].ar : scenarioTitles[scenarioId].en}
              </span>
              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                hearts > 2 
                  ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10' 
                  : 'border-red-500/60 text-red-400 bg-red-500/10 animate-pulse'
              }`}>
                {Math.round((hearts / maxHearts) * 100)}% INTEGRITY
              </span>
            </div>

            {/* Sleek Neon HP Energy Bar + Hearts */}
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[10px] font-black tracking-widest text-slate-400">
                {isArabic ? 'صمود النواة:' : 'CORE HP:'}
              </span>
              <div className="flex items-center gap-1.5">
                {Array.from({ length: maxHearts }).map((_, idx) => (
                  <div key={idx} className="relative flex items-center justify-center">
                    <Heart
                      className={`w-4 h-4 transition-all duration-300 ${
                        idx < hearts
                          ? 'text-red-500 fill-red-500 drop-shadow-[0_0_8px_rgba(255,0,85,0.9)]'
                          : 'text-slate-800 fill-slate-900/60'
                      }`}
                    />
                    {idx < hearts && (
                      <span className="absolute inset-0 rounded-full bg-red-500/20 blur-sm pointer-events-none" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Center: Phase Indicator, Timer, Score, Overclock */}
        <div className="flex items-center gap-3 sm:gap-4 p-2.5 px-4.5 rounded-2xl bg-[#020611]/85 border border-cyan-500/40 backdrop-blur-xl text-slate-100 shadow-[0_0_20px_rgba(0,240,255,0.15)]">
          {/* Phase Badge */}
          <div className="flex items-center gap-1.5 font-bold text-xs">
            {combatPhase === 'decoding' ? (
              <span className="px-2.5 py-1 rounded-xl bg-cyan-500/15 text-cyan-300 border border-cyan-400/60 flex items-center gap-1.5 shadow-[0_0_10px_rgba(0,240,255,0.25)]">
                <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
                <span>{isArabic ? 'المرحلة 1: فك الشفرة' : 'PHASE 1: DECODE'}</span>
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-xl bg-red-500/20 text-red-300 border border-red-500/80 flex items-center gap-1.5 shadow-[0_0_15px_rgba(255,0,85,0.4)] animate-pulse">
                <Flame className="w-3.5 h-3.5 text-red-400 fill-red-500" />
                <span>{isArabic ? 'المرحلة 2: صد الهجوم' : 'PHASE 2: DEFEND CORE'}</span>
              </span>
            )}
          </div>

          <div className="h-4 w-px bg-slate-700/80" />

          {/* Overclock & Fever Mode Combo */}
          {isFeverMode ? (
            <div className="flex items-center gap-1 px-3 py-1 rounded-lg bg-gradient-to-r from-amber-500/30 to-pink-500/30 text-amber-300 border border-amber-400 font-black text-xs shadow-[0_0_16px_rgba(245,158,11,0.8)] animate-pulse">
              <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>🔥 FEVER 3x! ({overclockCombo})</span>
            </div>
          ) : isOverclockActive || overclockCombo >= 3 ? (
            <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-cyan-400/20 text-cyan-300 border border-cyan-400/80 font-black text-xs shadow-[0_0_12px_rgba(6,182,212,0.6)]">
              <Zap className="w-3.5 h-3.5 fill-cyan-400 text-cyan-400" />
              <span>COMBO x{overclockCombo} (x{multiplier})</span>
            </div>
          ) : overclockCombo > 0 ? (
            <div className="text-xs font-mono font-bold text-cyan-300">
              COMBO x{overclockCombo}
            </div>
          ) : null}

          {/* Difficulty Badge */}
          <div className="flex items-center gap-1.5 font-bold text-xs hidden md:flex">
            <Gauge className="w-3.5 h-3.5 text-cyan-400" />
            <span
              className={
                difficulty === 'easy'
                  ? 'text-emerald-400 font-mono'
                  : difficulty === 'medium'
                  ? 'text-cyan-300 font-mono'
                  : 'text-amber-400 font-mono'
              }
            >
              {difficulty.toUpperCase()}
            </span>
          </div>

          <div className="h-4 w-px bg-slate-700/80" />

          {/* Timer */}
          <div className="flex items-center gap-1.5 font-mono font-bold text-xs sm:text-sm">
            <Clock className="w-4 h-4 text-amber-400" />
            <span className={timeRemaining < 20 ? 'text-red-400 font-black animate-pulse' : 'text-slate-200'}>
              {Math.floor(timeRemaining / 60)}:
              {(timeRemaining % 60).toString().padStart(2, '0')}
            </span>
          </div>

          <div className="h-4 w-px bg-slate-700/80" />

          {/* Score */}
          <div className="flex items-center gap-1.5 font-mono font-bold text-xs sm:text-sm">
            <Trophy className="w-4 h-4 text-cyan-400" />
            <span className="text-cyan-300">{score} PTS</span>
          </div>
        </div>

        {/* Right: Manual & Sound */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenManual}
            className="pointer-events-auto flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#020611] border border-amber-500/80 hover:bg-amber-500/20 text-amber-300 text-xs font-black transition-all cursor-pointer shadow-[0_0_10px_rgba(245,158,11,0.25)]"
          >
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">{isArabic ? 'الدليل' : 'Rulebook'}</span>
          </button>

          <button
            onClick={onToggleMute}
            className="pointer-events-auto p-2 rounded-xl bg-[#020611] border border-slate-700 hover:border-cyan-400 text-slate-300 hover:text-cyan-400 transition-all cursor-pointer shadow-sm"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Phase Transition & Counterattack Banners */}
      {phaseBanner && (
        <div
          className={`pointer-events-auto mx-auto my-3 px-6 py-3.5 rounded-2xl border-2 backdrop-blur-xl shadow-2xl flex items-center gap-3 text-sm sm:text-base font-black max-w-xl transition-all animate-in zoom-in duration-200 relative z-20 ${
            phaseBanner.type === 'alarm'
              ? 'bg-[#020611]/90 border-red-500 text-red-200 shadow-[0_0_35px_rgba(255,0,85,0.6)] animate-pulse'
              : phaseBanner.type === 'purge'
              ? 'bg-[#020611]/90 border-emerald-400 text-emerald-200 shadow-[0_0_35px_rgba(16,185,129,0.6)]'
              : 'bg-[#020611]/90 border-amber-400 text-amber-300 shadow-[0_0_35px_rgba(245,158,11,0.6)]'
          }`}
        >
          {phaseBanner.type === 'alarm' ? (
            <AlertTriangle className="w-6 h-6 text-red-400 shrink-0" />
          ) : phaseBanner.type === 'purge' ? (
            <CheckCircle className="w-6 h-6 text-emerald-400 shrink-0" />
          ) : (
            <Zap className="w-6 h-6 text-amber-400 fill-amber-400 shrink-0" />
          )}
          <span>{isArabic ? phaseBanner.messageAr : phaseBanner.messageEn}</span>
        </div>
      )}

      {/* Educational Feedback Banner: ONLY shown during Phase 1 Decoding, never during Combat Phase 2 */}
      {educationalFeedback && !phaseBanner && combatPhase === 'decoding' && (
        <div
          className={`pointer-events-auto mx-auto my-2 px-5 py-3 rounded-2xl border-2 backdrop-blur-xl shadow-2xl flex items-center gap-3 text-xs sm:text-sm font-bold max-w-xl transition-all animate-in fade-in slide-in-from-top-2 duration-200 relative z-20 ${
            educationalFeedback.isCorrect
              ? 'bg-[#020611]/90 border-emerald-400 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
              : 'bg-[#020611]/90 border-red-500 text-red-200 shadow-[0_0_20px_rgba(255,0,85,0.4)]'
          }`}
        >
          {educationalFeedback.isCorrect ? (
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          )}
          <span className="leading-relaxed font-semibold">
            {isArabic ? educationalFeedback.messageAr : educationalFeedback.messageEn}
          </span>
        </div>
      )}

      {/* Victory Overlay Modal */}
      {gameStatus === 'victory' && (
        <div className="pointer-events-auto my-auto mx-auto p-7 max-w-md w-full rounded-2xl bg-[#020611]/95 border-2 border-emerald-400 text-center shadow-[0_0_60px_rgba(16,185,129,0.5)] backdrop-blur-2xl animate-in fade-in zoom-in duration-200 relative z-30">
          <div className="inline-flex p-3.5 rounded-2xl bg-emerald-500/20 text-emerald-400 mb-3 border border-emerald-400/40 shadow-[0_0_20px_rgba(16,185,129,0.4)]">
            <Sparkles className="w-8 h-8 animate-spin" style={{ animationDuration: '8s' }} />
          </div>
          <h3 className="text-2xl font-black text-white mb-2 tracking-wide drop-shadow-[0_0_15px_rgba(52,211,153,0.6)]">
            {isArabic ? 'تم تأمين العقدة وتطهير الخادم!' : 'NODE SECURED! SYSTEM PURGED!'}
          </h3>
          <p className="text-xs text-slate-300 mb-6 leading-relaxed font-semibold">
            {isArabic
              ? 'تنسيق ممتاز وسريع بين تحليل الأسئلة وصد هجمات الحزم الخبيثة بنجاح.'
              : 'Flawless execution! All curriculum threat waves destroyed and core integrity preserved.'}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <button
              onClick={onNextScenarioHub}
              className="w-full sm:w-auto px-7 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-[0_0_25px_rgba(245,158,11,0.6)] flex items-center justify-center gap-2 transform hover:scale-105 active:scale-95"
            >
              <span>{isArabic ? 'السيناريو التالي' : 'Next Scenario'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onReturnToMenu}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#030d22] hover:bg-[#061536] border border-cyan-500/40 text-cyan-200 text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm"
            >
              <Home className="w-4 h-4 text-cyan-400" />
              <span>{isArabic ? 'القائمة الرئيسية' : 'Main Menu'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Defeat Overlay Modal */}
      {gameStatus === 'gameover' && (
        <div className="pointer-events-auto my-auto mx-auto p-7 max-w-md w-full rounded-2xl bg-[#020611]/95 border-2 border-red-500 text-center shadow-[0_0_60px_rgba(255,0,85,0.6)] backdrop-blur-2xl animate-in fade-in zoom-in duration-200 relative z-30">
          <div className="inline-flex p-3.5 rounded-2xl bg-red-500/20 text-red-400 mb-3 border border-red-500/50 shadow-[0_0_20px_rgba(255,0,85,0.5)]">
            <AlertOctagon className="w-8 h-8 animate-bounce" />
          </div>
          <h3 className="text-2xl font-black text-white mb-2 tracking-wide drop-shadow-[0_0_15px_rgba(255,0,85,0.6)]">
            {isArabic ? 'تم اختراق العقدة! فشلت المهمة' : 'CRITICAL BREACH! MISSION FAILED'}
          </h3>
          <p className="text-xs text-slate-300 mb-6 leading-relaxed font-semibold">
            {isArabic
              ? 'تدمرت دروع العقدة جراء اصطدام الحزم الخبيثة. ادرس الدليل الورقي وحاول مجدداً!'
              : 'The malware swarm overwhelmed the central protected core node before defenses held.'}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <button
              onClick={onRestartScenario}
              className="w-full sm:w-auto px-7 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-[0_0_25px_rgba(255,0,85,0.7)] flex items-center justify-center gap-2 transform hover:scale-105 active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{isArabic ? 'إعادة المحاولة' : 'Retry Incident'}</span>
            </button>
            <button
              onClick={onReturnToMenu}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#030d22] hover:bg-[#061536] border border-slate-700 text-slate-300 text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm"
            >
              <Home className="w-4 h-4 text-cyan-400" />
              <span>{isArabic ? 'القائمة الرئيسية' : 'Main Menu'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Bottom Dock */}
      <div className="pointer-events-auto w-full max-w-3xl mx-auto flex flex-col items-center relative z-10">
        {/* Collapse toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="mb-1 px-3.5 py-0.5 rounded-t-xl bg-[#020611]/90 border-t border-x border-cyan-500/40 text-[11px] font-black text-cyan-300 hover:text-white flex items-center gap-1.5 cursor-pointer shadow-md backdrop-blur-md"
        >
          {isCollapsed ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          <span>{isCollapsed ? (isArabic ? 'إظهار لوحة التحكم' : 'Show Dock') : (isArabic ? 'إخفاء لوحة التحكم' : 'Hide Dock')}</span>
        </button>

        {!isCollapsed && (
          <div className="w-full p-3 px-4.5 rounded-2xl bg-[#020611]/85 border border-cyan-500/40 backdrop-blur-xl shadow-[0_0_25px_rgba(0,240,255,0.15)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            {/* Table Team Intercom */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={onTriggerTeamShout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-400/50 font-black shrink-0 transition-all cursor-pointer shadow-sm"
              >
                <Radio className="w-3.5 h-3.5 text-cyan-400" />
                <span>{isArabic ? 'صوت فريق الطاولة' : 'Table Comms'}</span>
              </button>

              {lastTeamShout && (
                <div className="px-3 py-1 rounded-xl bg-[#030d22] border border-cyan-500/30 text-amber-300 font-bold text-[11px] truncate max-w-xs shadow-inner">
                  "{lastTeamShout}"
                </div>
              )}
            </div>

            {/* Desktop hint - changes dynamically per Phase */}
            {!vrActive && (
              <div className="text-[11px] text-cyan-200/80 hidden xl:block font-bold text-center px-2 whitespace-nowrap">
                {combatPhase === 'decoding'
                  ? isArabic
                    ? '🎯 أطلق الليزر على شارة الإجابة الصحيحة'
                    : '🎯 Click mouse to shoot target badge'
                  : isArabic
                    ? '⚡ احمِ قلب الخادم من الحزم الخبيثة!'
                    : '⚡ Blast incoming malware packets!'}
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center gap-2">
              {onChangeDifficulty && (
                <div className="flex items-center p-0.5 rounded-xl bg-[#030d22] border border-cyan-500/30">
                  {(['easy', 'medium', 'hard'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => onChangeDifficulty(lvl)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer ${
                        difficulty === lvl
                          ? 'bg-gradient-to-r from-cyan-400 to-cyan-500 text-slate-950 shadow-[0_0_8px_rgba(0,240,255,0.7)]'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              )}

              {onOpenTraining && (
                <button
                  onClick={onOpenTraining}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 text-xs font-black transition-all cursor-pointer"
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{isArabic ? 'التدريب' : 'Training'}</span>
                </button>
              )}
              <button
                onClick={onRestartScenario}
                className="p-1.5 rounded-xl bg-[#030d22] hover:bg-[#061536] border border-slate-700 text-slate-300 hover:text-cyan-300 transition-all cursor-pointer"
                title="Restart"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={onReturnToMenu}
                className="px-3 py-1.5 rounded-xl bg-[#030d22] hover:bg-[#061536] border border-slate-700 text-slate-300 hover:text-cyan-300 text-xs font-black transition-all cursor-pointer"
              >
                {isArabic ? 'القائمة' : 'Menu'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
