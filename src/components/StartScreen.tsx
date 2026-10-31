/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ScenarioId, DifficultyLevel, CinematicStep } from '../types/game';
import { useLanguage } from '../context/LanguageContext';
import {
  Shield,
  BookOpen,
  Glasses,
  Monitor,
  Volume2,
  VolumeX,
  Zap,
  Target,
  ArrowRight,
  ArrowLeft,
  GraduationCap,
  Sparkles,
  Server,
  Lock,
  Globe,
  Radio,
  CheckCircle2,
} from 'lucide-react';

interface StartScreenProps {
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

export const StartScreen: React.FC<StartScreenProps> = ({
  difficulty,
  onSelectDifficulty,
  selectedScenario,
  onSelectScenario,
  cinematicStep,
  onGoToScenarioSelect,
  onGoToDifficultySelect,
  onBackToSplash,
  onBackToScenarioSelect,
  onStartGame,
  onEnterVR,
  onPlayDesktop,
  onStartTraining,
  onOpenManual,
  isMuted,
  onToggleMute,
}) => {
  const { language, setLanguage, isArabic, t } = useLanguage();

  const scenarios: Array<{
    id: ScenarioId;
    title: string;
    tag: string;
    color: string;
    border: string;
    glow: string;
    icon: React.ReactNode;
    desc: string;
    details: string[];
  }> = [
    {
      id: 'scenario-1',
      title: t('scenario1Title'),
      tag: t('scenario1Tag'),
      color: 'from-cyan-500/20 to-blue-600/10',
      border: 'border-cyan-400',
      glow: 'shadow-[0_0_20px_rgba(0,240,255,0.25)]',
      icon: <Lock className="w-6 h-6 text-cyan-400" />,
      desc: t('scenario1Desc'),
      details: ['0x16 (SSH : 22)', '0x50 (HTTP : 80)', '0x01BB (HTTPS : 443)'],
    },
    {
      id: 'scenario-2',
      title: t('scenario2Title'),
      tag: t('scenario2Tag'),
      color: 'from-pink-500/20 to-rose-600/10',
      border: 'border-pink-400',
      glow: 'shadow-[0_0_20px_rgba(244,63,94,0.25)]',
      icon: <Server className="w-6 h-6 text-pink-400" />,
      desc: t('scenario2Desc'),
      details: ['AES-256 Symmetric', 'RSA-4096 Asymmetric', 'SHA-256 Hash Digest'],
    },
    {
      id: 'scenario-3',
      title: t('scenario3Title'),
      tag: t('scenario3Tag'),
      color: 'from-amber-500/20 to-orange-600/10',
      border: 'border-amber-400',
      glow: 'shadow-[0_0_20px_rgba(245,158,11,0.25)]',
      icon: <Globe className="w-6 h-6 text-amber-400" />,
      desc: t('scenario3Desc'),
      details: ['/24 Subnet (256 IPs)', '/16 Subnet (65k IPs)', '/8 Enterprise Backbone'],
    },
  ];

  const difficulties: Array<{
    id: DifficultyLevel;
    title: string;
    sub: string;
    pacing: string;
    curriculum: string;
    color: string;
    border: string;
    accent: string;
  }> = [
    {
      id: 'easy',
      title: t('easyTitle'),
      sub: t('easySub'),
      pacing: t('easyPacing'),
      curriculum: t('easyCurriculum'),
      color: 'from-emerald-500/20 to-teal-600/10',
      border: 'border-emerald-400',
      accent: 'text-emerald-300',
    },
    {
      id: 'medium',
      title: t('mediumTitle'),
      sub: t('mediumSub'),
      pacing: t('mediumPacing'),
      curriculum: t('mediumCurriculum'),
      color: 'from-cyan-500/20 to-blue-600/10',
      border: 'border-cyan-400',
      accent: 'text-cyan-300',
    },
    {
      id: 'hard',
      title: t('hardTitle'),
      sub: t('hardSub'),
      pacing: t('hardPacing'),
      curriculum: t('hardCurriculum'),
      color: 'from-amber-500/20 to-orange-600/10',
      border: 'border-amber-400',
      accent: 'text-amber-300',
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-between p-4 md:p-6 bg-[#020611]/85 backdrop-blur-md select-none overflow-y-auto no-game-shoot"
      dir={isArabic ? 'rtl' : 'ltr'}
      style={{
        fontFamily: isArabic
          ? "'Cairo', sans-serif"
          : "'Orbitron', 'JetBrains Mono', monospace",
      }}
    >
      {/* Subtle Matrix Scanlines */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(0,240,255,0.03)_1px,transparent_1px)] bg-[size:100%_4px] opacity-40" />

      {/* 1. TOP HEADER HUD */}
      <header className="w-full max-w-6xl mx-auto flex items-center justify-between py-3 px-5 rounded-2xl bg-[#03091e]/90 border border-cyan-500/50 shadow-[0_0_30px_rgba(0,240,255,0.2)] backdrop-blur-xl relative z-10">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#04112e] border border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.4)] shrink-0">
            <Shield className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base md:text-lg font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-teal-200 to-amber-300">
                {t('appTitle')}
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                {t('socVersion')}
              </span>
            </div>
            <p className="text-xs text-cyan-300/80 font-bold hidden sm:block">
              {t('appSubtitle')}
            </p>
          </div>
        </div>

        {/* Center: System Status */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyan-950/40 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold">
          <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span>{t('quantumTunnel')}</span>
        </div>

        {/* Top-Right: Language Toggle, Rulebook, Sound */}
        <div className="flex items-center gap-2.5">
          {/* Robust Instant Language Toggle [ عربي | EN ] */}
          <div className="flex items-center p-1 rounded-xl bg-[#020a1c] border border-cyan-500/60 shadow-inner">
            <button
              type="button"
              onClick={() => setLanguage('ar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                language === 'ar'
                  ? 'bg-gradient-to-r from-cyan-400 to-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(0,240,255,0.9)]'
                  : 'text-slate-400 hover:text-cyan-200'
              }`}
              style={{ fontFamily: "'Cairo', sans-serif" }}
            >
              عربي
            </button>
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                language === 'en'
                  ? 'bg-gradient-to-r from-cyan-400 to-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(0,240,255,0.9)]'
                  : 'text-slate-400 hover:text-cyan-200'
              }`}
              style={{ fontFamily: "'Orbitron', 'JetBrains Mono', monospace" }}
            >
              EN
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenManual}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#030d24] border border-amber-400/80 text-amber-300 font-extrabold text-xs hover:bg-amber-400/20 transition-all cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.25)] group"
          >
            <BookOpen className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">{t('rulebook')}</span>
          </button>

          <button
            type="button"
            onClick={onToggleMute}
            className="p-2 rounded-xl bg-[#030d24] border border-slate-700 hover:border-cyan-400 text-slate-300 hover:text-cyan-400 transition-all cursor-pointer shadow-sm"
            aria-label="Toggle Sound"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>
        </div>
      </header>

      {/* 2. MAIN CENTER CONTENT VIEWPORT */}
      <main className="w-full max-w-6xl mx-auto my-auto py-6 relative z-10 flex flex-col items-center justify-center">
        {/* VIEW 1: SPLASH SCREEN HERO */}
        {cinematicStep === 'splash' && (
          <div className="w-full max-w-4xl flex flex-col items-center text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Holographic Header Banner */}
            <div className="p-6 md:p-8 rounded-3xl bg-[#03091e]/90 border-2 border-cyan-400/70 shadow-[0_0_40px_rgba(0,240,255,0.25)] backdrop-blur-2xl w-full">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold tracking-widest uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 mb-3 inline-block">
                ◄ ASYMMETRIC CYBER DEFENSE ENVIRONMENT // WEBXR ACTIVE ►
              </span>
              <h2 className="text-3xl md:text-5xl font-black tracking-wider text-white drop-shadow-[0_0_20px_rgba(0,240,255,0.6)] mt-2">
                {t('appTitle')}
              </h2>
              <p className="text-sm md:text-base text-cyan-200/90 max-w-2xl mx-auto mt-3 font-medium leading-relaxed">
                {isArabic
                  ? 'محاكاة أمن سيبراني احترافية مصممة للواقع الافتراضي (Meta Quest 3) والمكتبي. دافع عن العقد السيبرانية ضد الهجمات في الوقت الفعلي.'
                  : 'Professional WebXR Incident Response & Cyber Security Simulation. Cooperate in real-time to decode incidents and eliminate malware threats.'}
              </p>

              {/* Badges */}
              <div className="flex flex-wrap items-center justify-center gap-3 mt-5 text-xs font-mono font-bold text-cyan-400">
                <span className="px-3 py-1 rounded-lg bg-cyan-950/60 border border-cyan-500/40">
                  ⚡ WEAPONIZED LASER PROTOCOLS
                </span>
                <span className="px-3 py-1 rounded-lg bg-cyan-950/60 border border-cyan-500/40">
                  🥽 META QUEST 3 OPTIMIZED (90 FPS)
                </span>
                <span className="px-3 py-1 rounded-lg bg-cyan-950/60 border border-cyan-500/40">
                  🌐 BILINGUAL ARABIC & ENGLISH
                </span>
              </div>
            </div>

            {/* 3 Main Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full">
              {/* Action 1: INITIALIZE DEFENSE (Primary CTA) */}
              <button
                type="button"
                onClick={onGoToScenarioSelect}
                className="group relative p-6 rounded-2xl bg-gradient-to-b from-cyan-950/70 to-[#020a1c] border-2 border-cyan-400 hover:border-cyan-300 text-left shadow-[0_0_25px_rgba(0,240,255,0.3)] hover:shadow-[0_0_35px_rgba(0,240,255,0.5)] transition-all cursor-pointer transform hover:-translate-y-1 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between w-full mb-3">
                  <div className="p-3 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400">
                    <Zap className="w-6 h-6 animate-pulse" />
                  </div>
                  {isArabic ? (
                    <ArrowLeft className="w-5 h-5 text-cyan-400 group-hover:-translate-x-1 transition-transform" />
                  ) : (
                    <ArrowRight className="w-5 h-5 text-cyan-400 group-hover:translate-x-1 transition-transform" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-black text-white group-hover:text-cyan-300 transition-colors">
                    {t('initializeDefense')}
                  </h3>
                  <p className="text-xs text-cyan-300/80 font-mono mt-1">
                    {t('initializeDefenseSub')}
                  </p>
                </div>
              </button>

              {/* Action 2: TRAINING SIMULATION */}
              <button
                type="button"
                onClick={onStartTraining}
                className="group relative p-6 rounded-2xl bg-gradient-to-b from-indigo-950/70 to-[#020a1c] border-2 border-indigo-400/70 hover:border-indigo-300 text-left shadow-[0_0_20px_rgba(99,102,241,0.25)] hover:shadow-[0_0_30px_rgba(99,102,241,0.45)] transition-all cursor-pointer transform hover:-translate-y-1 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between w-full mb-3">
                  <div className="p-3 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-400">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  {isArabic ? (
                    <ArrowLeft className="w-5 h-5 text-indigo-400 group-hover:-translate-x-1 transition-transform" />
                  ) : (
                    <ArrowRight className="w-5 h-5 text-indigo-400 group-hover:translate-x-1 transition-transform" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-black text-white group-hover:text-indigo-300 transition-colors">
                    {t('trainingSimulation')}
                  </h3>
                  <p className="text-xs text-indigo-300/80 font-mono mt-1">
                    {t('trainingSimulationSub')}
                  </p>
                </div>
              </button>

              {/* Action 3: INCIDENT RULEBOOK */}
              <button
                type="button"
                onClick={onOpenManual}
                className="group relative p-6 rounded-2xl bg-gradient-to-b from-amber-950/70 to-[#020a1c] border-2 border-amber-400/70 hover:border-amber-300 text-left shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:shadow-[0_0_30px_rgba(245,158,11,0.45)] transition-all cursor-pointer transform hover:-translate-y-1 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between w-full mb-3">
                  <div className="p-3 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  {isArabic ? (
                    <ArrowLeft className="w-5 h-5 text-amber-400 group-hover:-translate-x-1 transition-transform" />
                  ) : (
                    <ArrowRight className="w-5 h-5 text-amber-400 group-hover:translate-x-1 transition-transform" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-black text-white group-hover:text-amber-300 transition-colors">
                    {t('incidentRulebook')}
                  </h3>
                  <p className="text-xs text-amber-300/80 font-mono mt-1">
                    {t('incidentRulebookSub')}
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* VIEW 2: SCENARIO SELECTION (Strict Grid-Cols-3 Gap-6) */}
        {cinematicStep === 'scenario_select' && (
          <div className="w-full flex flex-col items-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="text-center space-y-1">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold tracking-widest uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-400/50">
                STEP 1 // CHOOSE INCIDENT VECTOR
              </span>
              <h2 className="text-2xl md:text-4xl font-black text-white tracking-wider">
                {t('scenarioSelectTitle')}
              </h2>
              <p className="text-xs md:text-sm text-cyan-300/80 font-mono">
                {t('scenarioSelectSub')}
              </p>
            </div>

            {/* Strict 3-Card Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
              {scenarios.map((sc) => {
                const isSelected = selectedScenario === sc.id;
                return (
                  <div
                    key={sc.id}
                    onClick={() => onSelectScenario(sc.id)}
                    className={`relative p-6 rounded-2xl bg-[#03091e]/90 border-2 transition-all cursor-pointer flex flex-col justify-between min-h-[360px] ${
                      isSelected
                        ? `${sc.border} ${sc.glow} scale-[1.02] bg-gradient-to-b ${sc.color}`
                        : 'border-slate-800 hover:border-slate-600 hover:bg-[#030d24]'
                    }`}
                  >
                    <div>
                      {/* Top Row: Icon & Tag */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-xl bg-[#020612] border border-slate-700">
                          {sc.icon}
                        </div>
                        <span className="px-2.5 py-1 rounded text-[11px] font-mono font-bold uppercase bg-slate-900 border border-slate-700 text-slate-300">
                          {sc.tag}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="text-lg font-black text-white mb-2">{sc.title}</h3>

                      {/* Description */}
                      <p className="text-xs text-slate-300 leading-relaxed mb-4">
                        {sc.desc}
                      </p>

                      {/* Curriculum Highlights */}
                      <div className="space-y-1.5 pt-3 border-t border-slate-800">
                        {sc.details.map((detail, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 text-[11px] font-mono text-cyan-300/90"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                            <span>{detail}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Bottom CTA Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectScenario(sc.id);
                        onGoToDifficultySelect();
                      }}
                      className={`w-full py-2.5 px-4 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer mt-5 ${
                        isSelected
                          ? 'bg-cyan-400 text-slate-950 shadow-[0_0_15px_rgba(0,240,255,0.8)]'
                          : 'bg-[#051333] border border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/20'
                      }`}
                    >
                      <span>{isArabic ? 'اختيار ومتابعة' : 'ENGAGE SCENARIO'}</span>
                      {isArabic ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Bottom Nav Bar */}
            <div className="flex items-center justify-between w-full pt-4">
              <button
                type="button"
                onClick={onBackToSplash}
                className="px-5 py-2.5 rounded-xl bg-[#03091e] border border-slate-700 hover:border-cyan-400 text-slate-300 hover:text-white text-xs font-black transition-all cursor-pointer flex items-center gap-2"
              >
                {isArabic ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                <span>{t('backToSplash')}</span>
              </button>

              <button
                type="button"
                onClick={onGoToDifficultySelect}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-teal-400 text-slate-950 text-xs font-black shadow-[0_0_20px_rgba(0,240,255,0.6)] hover:shadow-[0_0_30px_rgba(0,240,255,0.8)] transition-all cursor-pointer flex items-center gap-2"
              >
                <span>{t('nextDifficulty')}</span>
                {isArabic ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        {/* VIEW 3: DIFFICULTY SELECTION (Strict Grid-Cols-3 Gap-6) */}
        {cinematicStep === 'difficulty_select' && (
          <div className="w-full flex flex-col items-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="text-center space-y-1">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold tracking-widest uppercase bg-amber-500/20 text-amber-300 border border-amber-400/50">
                STEP 2 // TRAINING PACING & DIFFICULTY
              </span>
              <h2 className="text-2xl md:text-4xl font-black text-white tracking-wider">
                {t('difficultySelectTitle')}
              </h2>
              <p className="text-xs md:text-sm text-cyan-300/80 font-mono">
                {t('difficultySelectSub')}
              </p>
            </div>

            {/* Strict 3-Card Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
              {difficulties.map((diff) => {
                const isSelected = difficulty === diff.id;
                return (
                  <div
                    key={diff.id}
                    onClick={() => onSelectDifficulty(diff.id)}
                    className={`relative p-6 rounded-2xl bg-[#03091e]/90 border-2 transition-all cursor-pointer flex flex-col justify-between min-h-[360px] ${
                      isSelected
                        ? `${diff.border} shadow-[0_0_25px_rgba(0,240,255,0.35)] scale-[1.02] bg-gradient-to-b ${diff.color}`
                        : 'border-slate-800 hover:border-slate-600 hover:bg-[#030d24]'
                    }`}
                  >
                    <div>
                      {/* Top Row */}
                      <div className="flex items-center justify-between mb-4">
                        <span className={`text-base font-black ${diff.accent}`}>
                          {diff.title}
                        </span>
                        {isSelected && (
                          <CheckCircle2 className="w-5 h-5 text-cyan-400 animate-pulse" />
                        )}
                      </div>

                      {/* Subtitle */}
                      <h4 className="text-xs font-mono font-black uppercase text-slate-400 tracking-wider mb-3">
                        {diff.sub}
                      </h4>

                      {/* Pacing Badge */}
                      <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono font-bold text-amber-300 mb-4">
                        {diff.pacing}
                      </div>

                      {/* Curriculum Content */}
                      <div className="space-y-2 pt-3 border-t border-slate-800 text-xs text-slate-300 leading-relaxed">
                        <p className="font-bold text-slate-200">
                          {isArabic ? 'المنهج التدريبي المشمول:' : 'Curriculum Focus:'}
                        </p>
                        <p>{diff.curriculum}</p>
                      </div>
                    </div>

                    {/* Bottom CTA */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectDifficulty(diff.id);
                        onStartGame();
                      }}
                      className={`w-full py-2.5 px-4 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer mt-5 ${
                        isSelected
                          ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.8)]'
                          : 'bg-[#051333] border border-slate-700 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span>{isArabic ? 'بدء المهمة بهذا المستوى' : 'ENGAGE MISSION'}</span>
                      {isArabic ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Bottom Nav Bar */}
            <div className="flex items-center justify-between w-full pt-4">
              <button
                type="button"
                onClick={onBackToScenarioSelect}
                className="px-5 py-2.5 rounded-xl bg-[#03091e] border border-slate-700 hover:border-cyan-400 text-slate-300 hover:text-white text-xs font-black transition-all cursor-pointer flex items-center gap-2"
              >
                {isArabic ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                <span>{t('backToScenarios')}</span>
              </button>

              <button
                type="button"
                onClick={onStartGame}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 text-slate-950 text-sm font-black shadow-[0_0_25px_rgba(245,158,11,0.8)] hover:shadow-[0_0_35px_rgba(245,158,11,1.0)] transition-all cursor-pointer flex items-center gap-2 transform hover:scale-105"
              >
                <Zap className="w-4 h-4" />
                <span>{t('launchMission')}</span>
                {isArabic ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}
      </main>

      {/* 3. BOTTOM HARDWARE LAUNCHER FOOTER */}
      <footer className="w-full max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-4 relative z-10 pt-2">
        <button
          type="button"
          onClick={onEnterVR}
          className="px-5 py-2.5 rounded-xl bg-[#03091e]/90 border-2 border-cyan-400/80 hover:border-cyan-300 text-cyan-300 hover:text-white font-black text-xs transition-all cursor-pointer flex items-center gap-2 shadow-[0_0_15px_rgba(0,240,255,0.3)] group"
        >
          <Glasses className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
          <span>{t('enterVR')}</span>
        </button>

        <button
          type="button"
          onClick={onPlayDesktop}
          className="px-5 py-2.5 rounded-xl bg-[#03091e]/90 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white font-black text-xs transition-all cursor-pointer flex items-center gap-2 shadow-sm"
        >
          <Monitor className="w-4 h-4 text-slate-400" />
          <span>{t('playDesktop')}</span>
        </button>
      </footer>
    </div>
  );
};
