/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Language } from '../types/game';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  isArabic: boolean;
  t: (key: string) => string;
}

const translations: Record<string, { en: string; ar: string }> = {
  // Brand & Header
  appTitle: {
    en: 'CYBER HEIST: NODE DEFENDER',
    ar: 'السرقة السيبرانية: حامي العقد',
  },
  appSubtitle: {
    en: 'Asymmetric WebXR Defense // Shoot-to-Interact',
    ar: 'نظام الدفاع السيبراني التفاعلي // إطلاق الليزر للاختيار',
  },
  socVersion: {
    en: 'v2.0 SOC',
    ar: 'الإصدار 2.0 SOC',
  },
  aimAndShootPrompt: {
    en: 'AIM & SHOOT 3D TARGETS TO SELECT',
    ar: 'صوّب وأطلق الليزر على الأهداف للاختيار',
  },
  rulebook: {
    en: 'Rulebook',
    ar: 'دليل القواعد',
  },
  soundOn: {
    en: 'Mute Audio',
    ar: 'كتم الصوت',
  },
  soundOff: {
    en: 'Unmute Audio',
    ar: 'تشغيل الصوت',
  },

  // Splash Menu
  initializeDefense: {
    en: 'INITIALIZE DEFENSE',
    ar: 'بدء تشغيل الدفاع',
  },
  initializeDefenseSub: {
    en: 'CLICK OR SHOOT TO WARP',
    ar: 'انقر أو أطلق للبدء الفوري',
  },
  trainingSimulation: {
    en: 'TRAINING SIMULATION & CALIBRATION',
    ar: 'محاكاة التدريب ومعايرة السلاح',
  },
  trainingSimulationSub: {
    en: 'ACADEMY FIRING RANGE // BLASTER CALIBRATION',
    ar: 'ميدان الرماية الأكاديمي // معايرة الليزر',
  },
  incidentRulebook: {
    en: 'INCIDENT RULEBOOK & MANUAL',
    ar: 'كتيب الحوادث ودليل التعليمات',
  },
  incidentRulebookSub: {
    en: 'PHYSICAL PROTOCOL TABLES & CODES',
    ar: 'جداول البروتوكولات والشفرات الميدانية',
  },
  systemStatus: {
    en: 'SYSTEM STATUS: OPERATIONAL',
    ar: 'حالة النظام: جاهز للعمليات',
  },
  quantumTunnel: {
    en: 'QUANTUM TIME TUNNEL: ONLINE',
    ar: 'نفق الزمن الكمومي: متصل',
  },

  // Scenario Selection
  scenarioSelectTitle: {
    en: 'SELECT CYBER INCIDENT TO SIMULATE',
    ar: 'اختر الحادث السيبراني للمحاكاة',
  },
  scenarioSelectSub: {
    en: 'CHOOSE TARGET ATTACK VECTOR // ASYMMETRIC RESPONSE',
    ar: 'حدد متجه الهجوم المستهدف // استجابة متناسقة',
  },
  scenario1Title: {
    en: 'Brute Force Firewall & Hex Port',
    ar: 'اختراق الجدار الناري ومنفذ الست عشري',
  },
  scenario1Tag: {
    en: 'HEX PROTOCOLS & PORTS',
    ar: 'بروتوكولات الست عشري والمنافذ',
  },
  scenario1Desc: {
    en: 'Attacker probes ports using hex codes (0x16, 0x50, 0x01BB). Table officer calculates port numbers to seal breaches.',
    ar: 'المهاجم يفحص المنافذ باستخدام الرموز الست عشرية. ضابط الطاولة يحسب أرقام المنافذ لسد الثغرات.',
  },
  scenario2Title: {
    en: 'Payload Purge & Cipher Shields',
    ar: 'تطهير الحمولات والدروع المشفرة',
  },
  scenario2Tag: {
    en: 'COLOR ROUTING & CIPHERS',
    ar: 'توجيه الألوان والتشفير',
  },
  scenario2Desc: {
    en: 'Corrupted payload color sequences indicate ransomware & worms. Deploy AES-256 and RSA countermeasure shields.',
    ar: 'تسلسلات ألوان الحزم الفاسدة تشير إلى برمجيات الفدية. انشر دروع AES-256 و RSA للتصدي.',
  },
  scenario3Title: {
    en: 'DDoS Subnet Blackhole Routing',
    ar: 'إغراق DDoS وتوجيه الثقب الأسود للشبكات',
  },
  scenario3Tag: {
    en: 'CIDR ROUTING & EMP SHIELDS',
    ar: 'توجيه CIDR ودروع النبضة الكهرومغناطيسية',
  },
  scenario3Desc: {
    en: 'Botnet deluge strikes critical gateway. Calculate CIDR subnet masks (/24, /16, /8) to blackhole attacker nodes.',
    ar: 'طوفان من أجهزة البوتنت يهاجم البوابة الرئيسية. احسب أقنعة شبكات CIDR لعزل أجهزة المهاجمين.',
  },

  // Difficulty Selection
  difficultySelectTitle: {
    en: 'SELECT TRAINING DIFFICULTY & PACING',
    ar: 'اختر مستوى الصعوبة وتيرة التدريب',
  },
  difficultySelectSub: {
    en: 'BALANCED FOR META QUEST 3 & DESKTOP CO-OP',
    ar: 'متوافق مع نظارة كويست 3 واللعب المكتبي المشترك',
  },
  easyTitle: {
    en: 'TIER 1: EASY',
    ar: 'المستوى 1: مبتدئ',
  },
  easySub: {
    en: 'NETWORKING & CYBER BASICS',
    ar: 'أساسيات الشبكات والأمن السيبراني',
  },
  easyPacing: {
    en: 'Timer: 120s | Pacing: 0.7x Gentle Stream',
    ar: 'المؤقت: 120 ثانية | التدفق: 0.7x وتيرة هادئة',
  },
  easyCurriculum: {
    en: 'OSI 7-Layer Model Architecture, Common Protocols (HTTP/SSH/DNS), Threat Identification (Phishing/Malware)',
    ar: 'طبقات نموذج OSI السبع، البروتوكولات الشائعة، تحديد التهديدات الشائعة كالبرمجيات الخبيثة',
  },
  mediumTitle: {
    en: 'TIER 2: MEDIUM',
    ar: 'المستوى 2: متوسط',
  },
  mediumSub: {
    en: 'PORTS & CRYPTOGRAPHIC SHIELDS',
    ar: 'المنافذ والدروع التشفيرية',
  },
  mediumPacing: {
    en: 'Timer: 90s | Pacing: 1.15x Balanced Wave',
    ar: 'المؤقت: 90 ثانية | التدفق: 1.15x موجة متوازنة',
  },
  mediumCurriculum: {
    en: 'Standard Port Mapping (22, 80, 443, 53), Symmetric vs Asymmetric Ciphers, AES-256 vs RSA-4096 vs SHA Logic',
    ar: 'مطابقة المنافذ القياسية، التشفير المتماثل وغير المتماثل، منطق AES و RSA وتجزئة SHA',
  },
  hardTitle: {
    en: 'TIER 3: HARD',
    ar: 'المستوى 3: متقدم',
  },
  hardSub: {
    en: 'HEX CONVERSIONS & CIDR SUBNETS',
    ar: 'تحويلات الست عشري وتفرعات CIDR',
  },
  hardPacing: {
    en: 'Timer: 60s | Pacing: 1.6x Swarm Assault',
    ar: 'المؤقت: 60 ثانية | التدفق: 1.6x هجوم مكثف',
  },
  hardCurriculum: {
    en: 'Real-time Hex Decode (0x16, 0x01BB), CIDR Subnet Masks (/12, /16, /24), Multi-Vector Threat Interception',
    ar: 'فك شفرات الست عشري الفورية، حساب أقنعة الشبكات CIDR، اعتراض التهديدات متعددة النواقل',
  },

  // Actions
  back: {
    en: 'Back',
    ar: 'رجوع',
  },
  backToSplash: {
    en: 'Back to Main Menu',
    ar: 'العودة للقائمة الرئيسية',
  },
  backToScenarios: {
    en: 'Back to Scenarios',
    ar: 'العودة لاختيار السيناريو',
  },
  nextDifficulty: {
    en: 'Continue to Difficulty',
    ar: 'متابعة لاختيار الصعوبة',
  },
  launchMission: {
    en: 'LAUNCH DEFENSE MISSION',
    ar: 'بدء مهمة الدفاع',
  },
  enterVR: {
    en: 'VR Mode (Meta Quest 3)',
    ar: 'وضع الواقع الافتراضي (Quest 3)',
  },
  playDesktop: {
    en: 'Desktop Simulator Mode',
    ar: 'وضع المحاكي المكتبي',
  },

  // Phase & In-Game
  phase1Title: {
    en: 'PHASE 1: INCIDENT DECODE',
    ar: 'المرحلة 1: فك شفرة الحادثة',
  },
  phase2Title: {
    en: 'PHASE 2: ACTIVE DEFENSE',
    ar: 'المرحلة 2: الدفاع النشط عن الهدف',
  },
  warpTunneling: {
    en: 'QUANTUM WARP IN PROGRESS...',
    ar: 'جاري الانتقال عبر النفق الكمومي...',
  },
  powerUpRapidFire: {
    en: 'RAPID FIRE ACTIVATED (8s)!',
    ar: 'تم تفعيل الإطلاق السريع (8 ثوانٍ)!',
  },
  powerUpEmpBomb: {
    en: 'EMP BLAST DETONATED! ALL PACKETS PURGED!',
    ar: 'انفجار كهرومغناطيسي! تم تطهير جميع الحزم!',
  },
  powerUpPlasmaBeam: {
    en: 'PLASMA BEAM ACTIVE (5s)!',
    ar: 'شعاع البلازما نشط (5 ثوانٍ)!',
  },
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  toggleLanguage: () => {},
  isArabic: false,
  t: (key: string) => key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('cyber_heist_lang') as Language;
      return saved === 'ar' || saved === 'en' ? saved : 'en';
    } catch {
      return 'en';
    }
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('cyber_heist_lang', lang);
    } catch {}
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguageState((prev) => {
      const next = prev === 'en' ? 'ar' : 'en';
      try {
        localStorage.setItem('cyber_heist_lang', next);
      } catch {}
      document.documentElement.lang = next;
      document.documentElement.dir = next === 'ar' ? 'rtl' : 'ltr';
      return next;
    });
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  const t = useCallback(
    (key: string): string => {
      const entry = translations[key];
      if (!entry) return key;
      return entry[language] || entry.en || key;
    },
    [language]
  );

  const isArabic = language === 'ar';

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        isArabic,
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
