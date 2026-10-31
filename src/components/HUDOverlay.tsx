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
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(0,240,255,0.03)_1px,transparent_1px)] bg-[size:100%_4px] opacity-40" />

      {/* Top Header Bar */}
      <div className="pointer-events-auto flex items-center justify-between gap-3 w-full max-w-5xl mx-auto relative z-10">
        {/* Sleek Top-Left Neon HP Bar & Core Status */}
        <div className="flex items-center gap-3.5 p-3 px-5 rounded-2xl bg-[#000000] border-2 border-[#00f0ff] text-[#ffffff] shadow-[0_0_20px_rgba(0,240,255,0.4)]">
          <div className="relative">
            <Shield className="w-5 h-5 text-[#00f0ff]" />
            {combatPhase === 'defense' && (
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00f0ff] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00f0ff]"></span>
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-wider text-[#ffffff]">
                {isArabic ? scenarioTitles[scenarioId].ar : scenarioTitles[scenarioId].en}
              </span>
              <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded border border-[#00f0ff] text-[#ffffff] bg-[#000000] shadow-[0_0_8px_rgba(0,240,255,0.4)]">
                {Math.round((hearts / maxHearts) * 100)}% INTEGRITY
              </span>
            </div>

            {/* Sleek Neon HP Energy Bar + Hearts */}
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[11px] font-black tracking-widest text-[#ffffff]">
                {isArabic ? 'صمود النواة:' : 'CORE HP:'}
              </span>
              <div className="flex items-center gap-1.5">
                {Array.from({ length: maxHearts }).map((_, idx) => (
                  <div key={idx} className="relative flex items-center justify-center">
                    <Heart
                      className={`w-4 h-4 transition-all duration-300 ${
                        idx < hearts
                          ? 'text-[#00f0ff] fill-[#00f0ff] drop-shadow-[0_0_10px_rgba(0,240,255,0.9)]'
                          : 'text-[#333333] fill-[#111111]'
                      }`}
                    />
                    {idx < hearts && (
                      <span className="absolute inset-0 rounded-full bg-[#00f0ff]/20 blur-sm pointer-events-none" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Center: Phase Indicator, Timer, Score, Overclock */}
        <div className="flex items-center gap-3 sm:gap-4 p-2.5 px-5 rounded-2xl bg-[#000000] border-2 border-[#00f0ff] text-[#ffffff] shadow-[0_0_20px_rgba(0,240,255,0.4)]">
          {/* Phase Badge */}
          <div className="flex items-center gap-1.5 font-black text-xs">
            {combatPhase === 'decoding' ? (
              <span className="px-2.5 py-1 rounded-xl bg-[#000000] text-[#ffffff] border-2 border-[#00f0ff] flex items-center gap-1.5 shadow-[0_0_12px_rgba(0,240,255,0.4)] font-black">
                <Crosshair className="w-3.5 h-3.5 text-[#00f0ff]" />
                <span>{isArabic ? 'المرحلة 1: فك الشفرة' : 'PHASE 1: DECODE'}</span>
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-xl bg-[#000000] text-[#ffffff] border-2 border-[#00f0ff] flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,240,255,0.5)] animate-pulse font-black">
                <Flame className="w-3.5 h-3.5 text-[#00f0ff] fill-[#00f0ff]" />
                <span>{isArabic ? 'المرحلة 2: صد الهجوم' : 'PHASE 2: DEFEND CORE'}</span>
              </span>
            )}
          </div>

          <div className="h-4 w-px bg-[#00f0ff]/50" />

          {/* Overclock & Fever Mode Combo */}
          {isFeverMode ? (
            <div className="flex items-center gap-1 px-3 py-1 rounded-lg bg-[#000000] text-[#ffffff] border-2 border-[#00f0ff] font-black text-xs shadow-[0_0_16px_rgba(0,240,255,0.8)] animate-pulse">
              <Zap className="w-3.5 h-3.5 fill-[#00f0ff] text-[#00f0ff]" />
              <span>🔥 FEVER 3x! ({overclockCombo})</span>
            </div>
          ) : isOverclockActive || overclockCombo >= 3 ? (
            <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-[#000000] text-[#ffffff] border-2 border-[#00f0ff] font-black text-xs shadow-[0_0_12px_rgba(0,240,255,0.6)]">
              <Zap className="w-3.5 h-3.5 fill-[#00f0ff] text-[#00f0ff]" />
              <span>COMBO x{overclockCombo} (x{multiplier})</span>
            </div>
          ) : overclockCombo > 0 ? (
            <div className="text-xs font-mono font-black text-[#ffffff]">
              COMBO x{overclockCombo}
            </div>
          ) : null}

          {/* Difficulty Badge */}
          <div className="flex items-center gap-1.5 font-black text-xs hidden md:flex">
            <Gauge className="w-3.5 h-3.5 text-[#00f0ff]" />
            <span className="text-[#ffffff] font-mono font-black">
              {difficulty.toUpperCase()}
            </span>
          </div>

          <div className="h-4 w-px bg-[#00f0ff]/50" />

          {/* Timer */}
          <div className="flex items-center gap-1.5 font-mono font-black text-xs sm:text-sm">
            <Clock className="w-4 h-4 text-[#00f0ff]" />
            <span className={timeRemaining < 20 ? 'text-[#ffffff] font-black animate-pulse drop-shadow-[0_0_8px_#00f0ff]' : 'text-[#ffffff] font-black'}>
              {Math.floor(timeRemaining / 60)}:
              {(timeRemaining % 60).toString().padStart(2, '0')}
            </span>
          </div>

          <div className="h-4 w-px bg-[#00f0ff]/50" />

          {/* Score */}
          <div className="flex items-center gap-1.5 font-mono font-black text-xs sm:text-sm">
            <Trophy className="w-4 h-4 text-[#00f0ff]" />
            <span className="text-[#ffffff] font-black">{score} PTS</span>
          </div>
        </div>

        {/* Right: Manual & Sound */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenManual}
            className="pointer-events-auto flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#000000] border-2 border-[#00f0ff] hover:bg-[#00f0ff]/20 text-[#ffffff] text-xs font-black transition-all cursor-pointer shadow-[0_0_15px_rgba(0,240,255,0.4)]"
          >
            <BookOpen className="w-4 h-4 text-[#00f0ff]" />
            <span className="hidden sm:inline">{isArabic ? 'الدليل' : 'Rulebook'}</span>
          </button>

          <button
            onClick={onToggleMute}
            className="pointer-events-auto p-2 rounded-xl bg-[#000000] border-2 border-[#00f0ff] hover:border-[#00f0ff] text-[#ffffff] hover:text-[#00f0ff] transition-all cursor-pointer shadow-[0_0_15px_rgba(0,240,255,0.4)]"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-[#00f0ff]" /> : <Volume2 className="w-4 h-4 text-[#00f0ff]" />}
          </button>
        </div>
      </div>

      {/* Phase Transition & Counterattack Banners */}
      {phaseBanner && (
        <div className="pointer-events-auto mx-auto my-3 px-6 py-3.5 rounded-2xl border-2 border-[#00f0ff] bg-[#000000] text-[#ffffff] shadow-[0_0_35px_rgba(0,240,255,0.6)] flex items-center gap-3 text-sm sm:text-base font-black max-w-xl transition-all animate-in zoom-in duration-200 relative z-20">
          {phaseBanner.type === 'alarm' ? (
            <AlertTriangle className="w-6 h-6 text-[#00f0ff] shrink-0" />
          ) : phaseBanner.type === 'purge' ? (
            <CheckCircle className="w-6 h-6 text-[#00f0ff] shrink-0" />
          ) : (
            <Zap className="w-6 h-6 text-[#00f0ff] fill-[#00f0ff] shrink-0" />
          )}
          <span className="font-black text-[#ffffff]">{isArabic ? phaseBanner.messageAr : phaseBanner.messageEn}</span>
        </div>
      )}

      {/* Educational Feedback Banner: ONLY shown during Phase 1 Decoding, never during Combat Phase 2 */}
      {educationalFeedback && !phaseBanner && combatPhase === 'decoding' && (
        <div className="pointer-events-auto mx-auto my-2 px-5 py-3 rounded-2xl border-2 border-[#00f0ff] bg-[#000000] text-[#ffffff] shadow-[0_0_25px_rgba(0,240,255,0.4)] flex items-center gap-3 text-xs sm:text-sm font-black max-w-xl transition-all animate-in fade-in slide-in-from-top-2 duration-200 relative z-20">
          {educationalFeedback.isCorrect ? (
            <CheckCircle className="w-5 h-5 text-[#00f0ff] shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-[#00f0ff] shrink-0" />
          )}
          <span className="leading-relaxed font-black text-[#ffffff]">
            {isArabic ? educationalFeedback.messageAr : educationalFeedback.messageEn}
          </span>
        </div>
      )}

      {/* Victory Overlay Modal */}
      {gameStatus === 'victory' && (
        <div className="pointer-events-auto my-auto mx-auto p-7 max-w-md w-full rounded-2xl bg-[#000000] border-2 border-[#00f0ff] text-center shadow-[0_0_60px_rgba(0,240,255,0.7)] animate-in fade-in zoom-in duration-200 relative z-30">
          <div className="inline-flex p-3.5 rounded-2xl bg-[#000000] text-[#00f0ff] mb-3 border-2 border-[#00f0ff] shadow-[0_0_20px_rgba(0,240,255,0.6)]">
            <Sparkles className="w-8 h-8 animate-spin" style={{ animationDuration: '8s' }} />
          </div>
          <h3 className="text-2xl font-black text-[#ffffff] mb-2 tracking-wide drop-shadow-[0_0_15px_rgba(0,240,255,0.8)]">
            {isArabic ? 'تم تأمين العقدة وتطهير الخادم!' : 'NODE SECURED! SYSTEM PURGED!'}
          </h3>
          <p className="text-xs text-[#ffffff] mb-6 leading-relaxed font-bold">
            {isArabic
              ? 'تنسيق ممتاز وسريع بين تحليل الأسئلة وصد هجمات الحزم الخبيثة بنجاح.'
              : 'Flawless execution! All curriculum threat waves destroyed and core integrity preserved.'}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <button
              onClick={onNextScenarioHub}
              className="w-full sm:w-auto px-7 py-3 rounded-xl bg-[#000000] hover:bg-[#00f0ff]/20 border-2 border-[#00f0ff] text-[#ffffff] font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-[0_0_25px_rgba(0,240,255,0.7)] flex items-center justify-center gap-2 transform hover:scale-105 active:scale-95"
            >
              <span>{isArabic ? 'السيناريو التالي' : 'Next Scenario'}</span>
              <ArrowRight className="w-4 h-4 text-[#00f0ff]" />
            </button>
            <button
              onClick={onReturnToMenu}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#000000] hover:bg-[#00f0ff]/20 border-2 border-[#00f0ff] text-[#ffffff] text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,240,255,0.4)]"
            >
              <Home className="w-4 h-4 text-[#00f0ff]" />
              <span>{isArabic ? 'القائمة الرئيسية' : 'Main Menu'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Defeat Overlay Modal */}
      {gameStatus === 'gameover' && (
        <div className="pointer-events-auto my-auto mx-auto p-7 max-w-md w-full rounded-2xl bg-[#000000] border-2 border-[#00f0ff] text-center shadow-[0_0_60px_rgba(0,240,255,0.7)] animate-in fade-in zoom-in duration-200 relative z-30">
          <div className="inline-flex p-3.5 rounded-2xl bg-[#000000] text-[#00f0ff] mb-3 border-2 border-[#00f0ff] shadow-[0_0_20px_rgba(0,240,255,0.6)]">
            <AlertOctagon className="w-8 h-8 animate-bounce" />
          </div>
          <h3 className="text-2xl font-black text-[#ffffff] mb-2 tracking-wide drop-shadow-[0_0_15px_rgba(0,240,255,0.8)]">
            {isArabic ? 'تم اختراق العقدة! فشلت المهمة' : 'CRITICAL BREACH! MISSION FAILED'}
          </h3>
          <p className="text-xs text-[#ffffff] mb-6 leading-relaxed font-bold">
            {isArabic
              ? 'تدمرت دروع العقدة جراء اصطدام الحزم الخبيثة. ادرس الدليل الورقي وحاول مجدداً!'
              : 'The malware swarm overwhelmed the central protected core node before defenses held.'}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <button
              onClick={onRestartScenario}
              className="w-full sm:w-auto px-7 py-3 rounded-xl bg-[#000000] hover:bg-[#00f0ff]/20 border-2 border-[#00f0ff] text-[#ffffff] font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-[0_0_25px_rgba(0,240,255,0.7)] flex items-center justify-center gap-2 transform hover:scale-105 active:scale-95"
            >
              <RotateCcw className="w-4 h-4 text-[#00f0ff]" />
              <span>{isArabic ? 'إعادة المحاولة' : 'Retry Incident'}</span>
            </button>
            <button
              onClick={onReturnToMenu}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#000000] hover:bg-[#00f0ff]/20 border-2 border-[#00f0ff] text-[#ffffff] text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,240,255,0.4)]"
            >
              <Home className="w-4 h-4 text-[#00f0ff]" />
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
          className="mb-1 px-4 py-1 rounded-t-xl bg-[#000000] border-t-2 border-x-2 border-[#00f0ff] text-[11px] font-black text-[#ffffff] hover:text-[#00f0ff] flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(0,240,255,0.4)]"
        >
          {isCollapsed ? <ChevronUp className="w-3 h-3 text-[#00f0ff]" /> : <ChevronDown className="w-3 h-3 text-[#00f0ff]" />}
          <span>{isCollapsed ? (isArabic ? 'إظهار لوحة التحكم' : 'Show Dock') : (isArabic ? 'إخفاء لوحة التحكم' : 'Hide Dock')}</span>
        </button>

        {!isCollapsed && (
          <div className="w-full p-3 px-5 rounded-2xl bg-[#000000] border-2 border-[#00f0ff] shadow-[0_0_25px_rgba(0,240,255,0.4)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            {/* Table Team Intercom */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={onTriggerTeamShout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#000000] hover:bg-[#00f0ff]/20 text-[#ffffff] border-2 border-[#00f0ff] font-black shrink-0 transition-all cursor-pointer shadow-[0_0_10px_rgba(0,240,255,0.3)]"
              >
                <Radio className="w-3.5 h-3.5 text-[#00f0ff]" />
                <span>{isArabic ? 'صوت فريق الطاولة' : 'Table Comms'}</span>
              </button>

              {lastTeamShout && (
                <div className="px-3 py-1 rounded-xl bg-[#000000] border border-[#00f0ff] text-[#ffffff] font-black text-[11px] truncate max-w-xs shadow-inner">
                  "{lastTeamShout}"
                </div>
              )}
            </div>

            {/* Desktop hint - changes dynamically per Phase */}
            {!vrActive && (
              <div className="text-[12px] text-[#ffffff] hidden xl:block font-black text-center px-2 whitespace-nowrap">
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
                <div className="flex items-center p-1 rounded-xl bg-[#000000] border-2 border-[#00f0ff]">
                  {(['easy', 'medium', 'hard'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => onChangeDifficulty(lvl)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer ${
                        difficulty === lvl
                          ? 'bg-[#00f0ff] text-[#000000] shadow-[0_0_10px_rgba(0,240,255,0.8)] font-black'
                          : 'text-[#ffffff] hover:text-[#00f0ff]'
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
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#000000] hover:bg-[#00f0ff]/20 text-[#ffffff] border-2 border-[#00f0ff] text-xs font-black transition-all cursor-pointer shadow-[0_0_10px_rgba(0,240,255,0.3)]"
                >
                  <GraduationCap className="w-3.5 h-3.5 text-[#00f0ff]" />
                  <span className="hidden sm:inline">{isArabic ? 'التدريب' : 'Training'}</span>
                </button>
              )}
              <button
                onClick={onRestartScenario}
                className="p-1.5 rounded-xl bg-[#000000] hover:bg-[#00f0ff]/20 border-2 border-[#00f0ff] text-[#ffffff] hover:text-[#00f0ff] transition-all cursor-pointer shadow-[0_0_10px_rgba(0,240,255,0.3)]"
                title="Restart"
              >
                <RotateCcw className="w-4 h-4 text-[#00f0ff]" />
              </button>
              <button
                onClick={onReturnToMenu}
                className="px-3 py-1.5 rounded-xl bg-[#000000] hover:bg-[#00f0ff]/20 border-2 border-[#00f0ff] text-[#ffffff] hover:text-[#00f0ff] text-xs font-black transition-all cursor-pointer shadow-[0_0_10px_rgba(0,240,255,0.3)]"
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
