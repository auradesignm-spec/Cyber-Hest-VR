/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Language, ScenarioId, DifficultyLevel } from '../types/game';
import { Shield, BookOpen, Glasses, Monitor, Volume2, VolumeX, Sparkles, AlertTriangle, GraduationCap, Flame, Gauge, Zap } from 'lucide-react';

interface StartScreenProps {
  language: Language;
  onSelectLanguage: (lang: Language) => void;
  difficulty: DifficultyLevel;
  onSelectDifficulty: (d: DifficultyLevel) => void;
  onEnterVR: () => void;
  onPlayDesktop: () => void;
  onStartTraining: () => void;
  onOpenManual: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  selectedScenario: ScenarioId | 'random';
  onSelectScenario: (sc: ScenarioId | 'random') => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  language,
  onSelectLanguage,
  difficulty,
  onSelectDifficulty,
  onEnterVR,
  onPlayDesktop,
  onStartTraining,
  onOpenManual,
  isMuted,
  onToggleMute,
  selectedScenario,
  onSelectScenario,
}) => {
  const isArabic = language === 'ar';

  return (
    <div
      className="fixed inset-0 z-40 flex flex-col items-center justify-between p-4 sm:p-8 bg-slate-950/95 text-slate-100 no-game-shoot overflow-y-auto"
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      {/* Top Navbar */}
      <header className="w-full max-w-5xl flex items-center justify-between py-3 border-b border-cyan-500/20">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-950 border border-cyan-500/50 text-cyan-400">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black tracking-wider text-cyan-300 font-mono">
              CYBER HEIST: NODE DEFENDER
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              {isArabic ? 'لعبة تعاونية لا متماثلة لطلاب تقنية المعلومات والواقع الافتراضي' : 'Asymmetric WebXR Co-op for IT Incident Response Teams'}
            </p>
          </div>
        </div>

        {/* Language & Sound Toggles */}
        <div className="flex items-center gap-3">
          <div className="flex items-center p-1 rounded-lg bg-slate-900 border border-slate-800">
            <button
              onClick={() => onSelectLanguage('ar')}
              className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                language === 'ar'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              عربي
            </button>
            <button
              onClick={() => onSelectLanguage('en')}
              className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                language === 'en'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              English
            </button>
          </div>

          <button
            onClick={onToggleMute}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-400 transition-all cursor-pointer"
            aria-label="Toggle Sound"
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Main Hero Card */}
      <main className="w-full max-w-3xl my-auto py-6 flex flex-col items-center text-center">
        {/* Glowing Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 text-xs font-mono mb-4">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>{isArabic ? 'نظام دفاعي WebXR متوافق مع Meta Quest 3 والحواسيب' : 'Meta Quest 3 & WebXR Compatible // Asymmetric Team Play'}</span>
        </div>

        <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white mb-3">
          {isArabic ? 'حامي العقد: السطو السيبراني' : 'CYBER HEIST: NODE DEFENDER'}
        </h2>

        <p className="max-w-xl text-sm sm:text-base text-slate-300 mb-8 leading-relaxed">
          {isArabic
            ? 'لاعب واحد يرتدي نظارة الواقع الافتراضي داخل غرفة الخوادم ثلاثية الأبعاد مسلحاً بمسدسي ليزر. بقية الفريق يجلسون خارج الواقع الافتراضي ممسكين بالدليل الورقي الفيزيائي لحل الشفرات والتوجيه!'
            : 'One player dons the Meta Quest 3 VR headset inside the 3D Server Room with dual cyber laser guns. The rest of the team sits outside holding the physical Incident Response manual shouting the decoded solutions!'}
        </p>

        {/* Asymmetric Role Split Explainer */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mb-8 text-left" dir={isArabic ? 'rtl' : 'ltr'}>
          <div className="p-4 rounded-xl bg-slate-900/80 border border-cyan-500/30">
            <div className="flex items-center gap-2 mb-2 text-cyan-400 font-bold font-mono">
              <Glasses className="w-5 h-5" />
              <span>{isArabic ? 'لاعب الواقع الافتراضي (VR Player)' : 'In-Headset VR Defender'}</span>
            </div>
            <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
              <li>{isArabic ? 'مسدسا ليزر لإطلاق النار على الحزم الخبيثة' : 'Dual laser blasters: pull trigger to destroy malicious red packets'}</li>
              <li>{isArabic ? 'إمساك الدروع والمفاتيح لوضعها على الأجهزة المصابة' : 'Grip controllers to grab floating cryptographic shields & keys'}</li>
              <li>{isArabic ? 'وصف ما تراه بصوت عالٍ لفريق الطاولة' : 'Must shout visual codes & flashing alerts to the table team'}</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-amber-500/30">
            <div className="flex items-center gap-2 mb-2 text-amber-400 font-bold font-mono">
              <BookOpen className="w-5 h-5" />
              <span>{isArabic ? 'فريق الطاولة (Incident Team)' : 'Outside Table Team'}</span>
            </div>
            <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
              <li>{isArabic ? 'يمسكون بالدليل الورقي لحل الشفرات السداسية' : 'Holds the physical manual with Hex-to-Port conversion tables'}</li>
              <li>{isArabic ? 'فك تشفير تتابعات ألوان الراوتر واختيار الدرع' : 'Decodes flashing router color codes to prescribe shields'}</li>
              <li>{isArabic ? 'حساب مسار الثقب الأسود وإعطاء الأوامر للاعب' : 'Calculates subnet blackhole 3-button sequences & shouts orders'}</li>
            </ul>
          </div>
        </div>

        {/* 3-Tier Educational Difficulty Selector */}
        <div className="w-full mb-4 p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-mono text-slate-300 font-bold uppercase flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-cyan-400" />
              <span>{isArabic ? 'مستوى الصعوبة والمحتوى التعليمي:' : 'Educational Difficulty Tier:'}</span>
            </span>
            <span className="text-[11px] font-mono text-cyan-400">
              {difficulty === 'easy'
                ? isArabic ? 'مؤقت 120 ثانية // وتيرة هادئة' : '120s Timer // Relaxed Pace'
                : difficulty === 'medium'
                ? isArabic ? 'مؤقت 90 ثانية // وتيرة قياسية' : '90s Timer // Balanced Triage'
                : isArabic ? 'مؤقت 60 ثانية // وتيرة مكثفة' : '60s Timer // High-Pressure Emergency'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {[
              {
                id: 'easy' as const,
                titleEn: '1. Easy (Basics)',
                titleAr: '1. مبتدئ (الأساسيات)',
                descEn: 'OSI Model, Protocols, Threat Definitions',
                descAr: 'نموذج OSI، بروتوكولات الويب، وتصنيف التهديدات',
                color: 'emerald',
                borderActive: 'border-emerald-400 bg-emerald-950/40 text-emerald-300',
              },
              {
                id: 'medium' as const,
                titleEn: '2. Medium (Ports)',
                titleAr: '2. متوسط (المنافذ والتشفير)',
                descEn: 'Standard Ports, Firewall Rules, AES Ciphers',
                descAr: 'منافذ الخدمات، قواعد الجدار، وتشفير AES',
                color: 'cyan',
                borderActive: 'border-cyan-400 bg-cyan-950/40 text-cyan-300',
              },
              {
                id: 'hard' as const,
                titleEn: '3. Hard (Subnets)',
                titleAr: '3. متقدم (الـ Subnets)',
                descEn: 'Hexadecimal Conversion & CIDR Blackholing',
                descAr: 'تحويلات Hex السداسية وحسابات نطاقات CIDR',
                color: 'amber',
                borderActive: 'border-amber-400 bg-amber-950/40 text-amber-300',
              },
            ].map((tier) => {
              const isSelected = difficulty === tier.id;
              return (
                <button
                  key={tier.id}
                  onClick={() => onSelectDifficulty(tier.id)}
                  className={`p-2.5 rounded-lg text-left transition-all cursor-pointer border flex flex-col justify-between ${
                    isSelected
                      ? tier.borderActive
                      : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                  dir={isArabic ? 'rtl' : 'ltr'}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-bold text-xs">{isArabic ? tier.titleAr : tier.titleEn}</span>
                    {isSelected && <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-900 border border-current">ACTIVE</span>}
                  </div>
                  <p className="text-[11px] leading-tight opacity-80 font-sans">
                    {isArabic ? tier.descAr : tier.descEn}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Scenario Selection */}
        <div className="w-full mb-8 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="text-xs font-mono text-slate-400 mb-2">
            {isArabic ? 'اختر سيناريو التدريب:' : 'Select Tactical Incident Scenario:'}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'random', labelEn: 'Random Threat', labelAr: 'سيناريو عشوائي' },
              { id: 'scenario-1', labelEn: '1: Hex Firewall', labelAr: '1: جدار الحماية (Hex)' },
              { id: 'scenario-2', labelEn: '2: Corrupt Payload', labelAr: '2: شفرة الراوتر والألوان' },
              { id: 'scenario-3', labelEn: '3: DDoS Overload', labelAr: '3: طوفان DDoS والأزرار' },
            ].map((sc) => (
              <button
                key={sc.id}
                onClick={() => onSelectScenario(sc.id as ScenarioId | 'random')}
                className={`px-3 py-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  selectedScenario === sc.id
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400'
                    : 'bg-slate-800/60 text-slate-400 hover:text-white border border-transparent'
                }`}
              >
                {isArabic ? sc.labelAr : sc.labelEn}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full flex-wrap">
          {/* Training Simulation (Recommended for new players) */}
          <button
            onClick={onStartTraining}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm tracking-wider uppercase flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(16,185,129,0.35)] transition-all cursor-pointer transform hover:scale-105"
          >
            <GraduationCap className="w-5 h-5 text-slate-950" />
            <span>{isArabic ? 'محاكاة التدريب التفاعلي' : 'Training Simulation'}</span>
          </button>

          {/* Enter VR Button (WebXR Meta Quest 3) */}
          <button
            onClick={onEnterVR}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-sm tracking-wider uppercase flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(6,182,212,0.35)] transition-all cursor-pointer transform hover:scale-105"
          >
            <Glasses className="w-5 h-5" />
            <span>{isArabic ? 'دخول الواقع الافتراضي' : 'Enter VR (Quest 3)'}</span>
          </button>

          {/* Desktop Simulator / Observer Mode */}
          <button
            onClick={onPlayDesktop}
            className="w-full sm:w-auto px-5 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 font-bold text-sm tracking-wider uppercase border border-cyan-500/40 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Monitor className="w-5 h-5" />
            <span>{isArabic ? 'طور الحاسوب' : 'Desktop Mode'}</span>
          </button>

          {/* Open Physical Rulebook */}
          <button
            onClick={onOpenManual}
            className="w-full sm:w-auto px-5 py-3.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 font-bold text-sm tracking-wider uppercase border border-amber-500/40 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <BookOpen className="w-5 h-5" />
            <span>{isArabic ? 'دليل الطاولة' : 'Rulebook Manual'}</span>
          </button>
        </div>
      </main>

      {/* Footer Status */}
      <footer className="w-full max-w-5xl py-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500 font-mono">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
          <span>90 FPS WebXR Architecture // InstancedMesh Acceleration</span>
        </div>
        <span>Cyber Heist: Node Defender v1.0</span>
      </footer>
    </div>
  );
};
