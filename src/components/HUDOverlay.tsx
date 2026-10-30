/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Language, ScenarioId, GameStatus } from '../types/game';
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
} from 'lucide-react';

interface HUDOverlayProps {
  language: Language;
  scenarioId: ScenarioId;
  gameStatus: GameStatus;
  timeRemaining: number;
  health: number; // 0 - 100
  score: number;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenManual: () => void;
  onRestartScenario: () => void;
  onReturnToMenu: () => void;
  onTriggerTeamShout: () => void;
  lastTeamShout: string | null;
  vrActive: boolean;
}

export const HUDOverlay: React.FC<HUDOverlayProps> = ({
  language,
  scenarioId,
  gameStatus,
  timeRemaining,
  health,
  score,
  isMuted,
  onToggleMute,
  onOpenManual,
  onRestartScenario,
  onReturnToMenu,
  onTriggerTeamShout,
  lastTeamShout,
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

  // Auto-Hide Flat Overlays in VR mode: keep the VR field-of-view completely unobstructed
  if (vrActive) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-30 flex flex-col justify-between p-3 sm:p-5 no-game-shoot"
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      {/* Top Header Bar */}
      <div className="pointer-events-auto flex items-center justify-between gap-3 w-full max-w-5xl mx-auto">
        {/* Left: Mission Badge & Health */}
        <div className="flex items-center gap-3 p-2.5 px-4 rounded-xl bg-slate-950/80 border border-cyan-500/30 backdrop-blur-sm text-slate-100 shadow-lg">
          <Shield className="w-5 h-5 text-cyan-400 shrink-0" />
          <div>
            <div className="text-xs font-mono font-bold text-cyan-300">
              {isArabic ? scenarioTitles[scenarioId].ar : scenarioTitles[scenarioId].en}
            </div>
            {/* Health Bar */}
            <div className="flex items-center gap-2 mt-1">
              <Heart className="w-3.5 h-3.5 text-red-400 shrink-0" />
              <div className="w-24 sm:w-36 h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    health > 50 ? 'bg-emerald-400' : health > 25 ? 'bg-amber-400' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.max(0, health)}%` }}
                />
              </div>
              <span className="text-[10px] font-mono text-slate-400">{health}%</span>
            </div>
          </div>
        </div>

        {/* Center: Timer & Score */}
        <div className="flex items-center gap-4 p-2.5 px-5 rounded-xl bg-slate-950/80 border border-slate-800 backdrop-blur-sm text-slate-100 shadow-lg">
          <div className="flex items-center gap-1.5 font-mono text-xs sm:text-sm">
            <Clock className="w-4 h-4 text-amber-400" />
            <span className={timeRemaining < 20 ? 'text-red-400 font-bold' : 'text-slate-200'}>
              {Math.floor(timeRemaining / 60)}:
              {(timeRemaining % 60).toString().padStart(2, '0')}
            </span>
          </div>

          <div className="h-4 w-px bg-slate-800" />

          <div className="flex items-center gap-1.5 font-mono text-xs sm:text-sm">
            <Trophy className="w-4 h-4 text-cyan-400" />
            <span className="text-cyan-300 font-bold">{score} PTS</span>
          </div>
        </div>

        {/* Right: Quick Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenManual}
            className="pointer-events-auto flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-mono font-bold transition-all shadow-md cursor-pointer"
          >
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">{isArabic ? 'دليل الطاولة' : 'Table Rulebook'}</span>
          </button>

          <button
            onClick={onToggleMute}
            className="pointer-events-auto p-2 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-slate-800 text-slate-300 transition-all cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Middle Banner: Victory or Defeat Overlay Modal */}
      {gameStatus === 'victory' && (
        <div className="pointer-events-auto my-auto mx-auto p-6 max-w-md w-full rounded-2xl bg-slate-950/95 border-2 border-emerald-500 text-center shadow-[0_0_50px_rgba(16,185,129,0.3)] animate-in fade-in zoom-in duration-200">
          <div className="inline-flex p-3 rounded-full bg-emerald-500/20 text-emerald-400 mb-3">
            <Sparkles className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-black text-white mb-2">
            {isArabic ? 'تم تأمين العقدة بنجاح!' : 'NODE SECURED! THREAT NEUTRALIZED'}
          </h3>
          <p className="text-xs text-slate-300 mb-5">
            {isArabic
              ? 'تنسيق ممتاز بين لاعب الواقع الافتراضي وفريق الطاولة الورقي. استمروا في صد الهجمات القادمة.'
              : 'Flawless asymmetric coordination between the VR operative and incident manual team.'}
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={onRestartScenario}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              {isArabic ? 'السيناريو التالي' : 'Next Scenario'}
            </button>
            <button
              onClick={onReturnToMenu}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-all cursor-pointer"
            >
              {isArabic ? 'القائمة الرئيسية' : 'Main Menu'}
            </button>
          </div>
        </div>
      )}

      {gameStatus === 'gameover' && (
        <div className="pointer-events-auto my-auto mx-auto p-6 max-w-md w-full rounded-2xl bg-slate-950/95 border-2 border-red-500 text-center shadow-[0_0_50px_rgba(239,68,68,0.3)] animate-in fade-in zoom-in duration-200">
          <div className="inline-flex p-3 rounded-full bg-red-500/20 text-red-400 mb-3">
            <AlertOctagon className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-black text-white mb-2">
            {isArabic ? 'تم اختراق العقدة! فشل المهمة' : 'CRITICAL BREACH! MISSION FAILED'}
          </h3>
          <p className="text-xs text-slate-300 mb-5">
            {isArabic
              ? 'نفد الوقت أو تدمرت دروع الخادم. استشر الدليل الورقي مجدداً وحاول تنسيق الأوامر بشكل أسرع.'
              : 'The packet storm overwhelmed the node before countermeasures could be deployed.'}
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={onRestartScenario}
              className="px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-400 text-white font-black text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              {isArabic ? 'إعادة المحاولة' : 'Retry Incident'}
            </button>
            <button
              onClick={onReturnToMenu}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-all cursor-pointer"
            >
              {isArabic ? 'القائمة الرئيسية' : 'Main Menu'}
            </button>
          </div>
        </div>
      )}

      {/* Bottom Dock (Following Three.js guidelines: collapsible, centered, zero obstruction) */}
      <div className="pointer-events-auto w-full max-w-3xl mx-auto flex flex-col items-center">
        {/* Collapse toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="mb-1 px-3 py-0.5 rounded-t-lg bg-slate-900/80 border-t border-x border-slate-800 text-[11px] font-mono text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
        >
          {isCollapsed ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          <span>{isCollapsed ? (isArabic ? 'إظهار اللوحة' : 'Show Tactical Dock') : (isArabic ? 'إخفاء اللوحة' : 'Hide Dock')}</span>
        </button>

        {!isCollapsed && (
          <div className="w-full p-3 px-4 rounded-2xl bg-slate-950/85 border border-cyan-500/30 backdrop-blur-sm shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            {/* Table Team Shout Intercom */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={onTriggerTeamShout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/50 font-mono font-bold shrink-0 transition-all cursor-pointer"
                title="Simulate Table Team Voice Shout"
              >
                <Radio className="w-3.5 h-3.5" />
                <span>{isArabic ? 'نداء فريق الطاولة (صوت)' : 'Table Team Comms'}</span>
              </button>

              {lastTeamShout && (
                <div className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-amber-300 font-mono text-[11px] truncate max-w-xs">
                  "{lastTeamShout}"
                </div>
              )}
            </div>

            {/* Desktop Controls Hint (if not in VR) */}
            {!vrActive && (
              <div className="text-[11px] font-mono text-slate-400 hidden md:block">
                {isArabic
                  ? 'التحكم: انقر بالماوس للتصويب وإطلاق الليزر على الأهداف والحزم الخبيثة'
                  : 'Controls: Click to shoot laser blasters at target nodes & threat packets'}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={onRestartScenario}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 transition-all cursor-pointer"
                title="Restart Round"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={onReturnToMenu}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-mono transition-all cursor-pointer"
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
