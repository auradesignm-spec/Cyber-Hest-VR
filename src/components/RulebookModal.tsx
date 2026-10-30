/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  HEX_PORT_TABLE,
  PAYLOAD_RULES,
  SUBNET_RULES,
  INCIDENT_MANUAL,
  CONSOLE_BUTTONS,
} from '../game/rules';
import { Language } from '../types/game';
import {
  Printer,
  X,
  ShieldAlert,
  Cpu,
  Network,
  Radio,
  Search,
  Filter,
} from 'lucide-react';

interface RulebookModalProps {
  language: Language;
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'all' | 'scenario1' | 'scenario2' | 'scenario3' | 'radio';

export const RulebookModal: React.FC<RulebookModalProps> = ({ language, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const t = INCIDENT_MANUAL[language];
  const isArabic = language === 'ar';

  const handlePrint = () => {
    window.print();
  };

  // Filtered Scenario 1 rows
  const filteredHexRows = useMemo(() => {
    if (!searchQuery) return HEX_PORT_TABLE;
    const q = searchQuery.toLowerCase();
    return HEX_PORT_TABLE.filter(
      (r) =>
        r.hex.toLowerCase().includes(q) ||
        r.port.toString().includes(q) ||
        r.service.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Filtered Scenario 2 rows
  const filteredPayloadRows = useMemo(() => {
    if (!searchQuery) return PAYLOAD_RULES;
    const q = searchQuery.toLowerCase();
    return PAYLOAD_RULES.filter(
      (r) =>
        r.payloadName.toLowerCase().includes(q) ||
        r.countermeasure.toLowerCase().includes(q) ||
        r.sequence.some((c) => c.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  // Filtered Scenario 3 rows
  const filteredSubnetRows = useMemo(() => {
    if (!searchQuery) return SUBNET_RULES;
    const q = searchQuery.toLowerCase();
    return SUBNET_RULES.filter(
      (r) =>
        r.prefix.toLowerCase().includes(q) ||
        r.cidr.toLowerCase().includes(q) ||
        r.subnetName.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-black/90 backdrop-blur-md no-game-shoot overflow-y-auto"
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      <div className="relative w-full max-w-5xl max-h-[94vh] flex flex-col bg-slate-950 border border-cyan-500/50 rounded-2xl shadow-[0_0_60px_rgba(6,182,212,0.3)] text-slate-100 overflow-hidden">
        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-cyan-500/30 bg-slate-900/95">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-950 border border-cyan-500/60 text-cyan-300 shadow-md">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black tracking-wider text-cyan-300 uppercase font-mono">
                  {t.title}
                </h2>
                <span className="text-xs px-2.5 py-0.5 rounded font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/50">
                  {t.docId}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{t.subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/50 text-xs font-mono font-bold transition-all shadow-md cursor-pointer"
              title="Print Physical Manual"
            >
              <Printer className="w-4 h-4" />
              <span>{isArabic ? 'طباعة الدليل الورقي' : 'Print Rulebook'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search & Filter Tabs Bar */}
        <div className="px-6 py-3 bg-slate-900/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          {/* Quick Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
            {[
              { id: 'all', labelEn: 'ALL PROTOCOLS', labelAr: 'كافة البروتوكولات' },
              { id: 'scenario1', labelEn: '1: HEX → PORT', labelAr: '1: الرموز والمنافذ' },
              { id: 'scenario2', labelEn: '2: COLOR → SHIELD', labelAr: '2: الألوان والدروع' },
              { id: 'scenario3', labelEn: '3: CIDR → BLACKHOLE', labelAr: '3: مسار الثقب الأسود' },
              { id: 'radio', labelEn: 'RADIO COMMS', labelAr: 'نداءات اللاسلكي' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-cyan-500 text-slate-950 shadow-md'
                    : 'bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-750'
                }`}
              >
                {isArabic ? tab.labelAr : tab.labelEn}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative flex items-center">
            <Search className="w-4 h-4 absolute left-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isArabic ? 'بحث سريع عن رمز، منفذ، لون...' : 'Quick search port, hex, IP...'}
              className="pl-9 pr-4 py-1.5 text-xs font-mono rounded-lg bg-slate-950 border border-slate-700 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 w-52 sm:w-64"
            />
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
          {/* Top Banner Notice */}
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs font-mono flex items-start gap-3">
            <Radio className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold uppercase tracking-wider text-amber-300">
                {t.classification}
              </div>
              <div className="mt-0.5 text-slate-300 leading-relaxed">{t.rulesSummary}</div>
            </div>
          </div>

          {/* PROTOCOL 1: HEX TO PORT */}
          {(activeTab === 'all' || activeTab === 'scenario1') && (
            <section className="p-5 rounded-2xl bg-slate-900/70 border border-cyan-500/25">
              <div className="flex items-center gap-2 mb-2 text-cyan-400 font-bold font-mono">
                <Cpu className="w-5 h-5" />
                <h3 className="text-base">{t.scenario1.title}</h3>
              </div>
              <p className="text-xs text-slate-300 mb-4">{t.scenario1.instruction}</p>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono border-collapse" dir={isArabic ? 'rtl' : 'ltr'}>
                  <thead>
                    <tr className="border-b border-cyan-500/40 text-cyan-300 bg-cyan-950/40">
                      <th className="p-2.5">{t.scenario1.columns[0]}</th>
                      <th className="p-2.5">{t.scenario1.columns[1]}</th>
                      <th className="p-2.5">{t.scenario1.columns[2]}</th>
                      <th className="p-2.5">{t.scenario1.columns[3]}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-200">
                    {filteredHexRows.map((row) => (
                      <tr key={row.hex} className="hover:bg-cyan-500/10 transition-colors">
                        <td className="p-2.5 text-amber-400 font-bold text-sm">{row.hex}</td>
                        <td className="p-2.5 text-cyan-300 font-bold text-sm">PORT {row.port}</td>
                        <td className="p-2.5 text-emerald-400 font-bold">{row.service}</td>
                        <td className="p-2.5 text-slate-300">{row.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* PROTOCOL 2: COLOR SEQUENCE TO SHIELD */}
          {(activeTab === 'all' || activeTab === 'scenario2') && (
            <section className="p-5 rounded-2xl bg-slate-900/70 border border-pink-500/25">
              <div className="flex items-center gap-2 mb-2 text-pink-400 font-bold font-mono">
                <ShieldAlert className="w-5 h-5" />
                <h3 className="text-base">{t.scenario2.title}</h3>
              </div>
              <p className="text-xs text-slate-300 mb-4">{t.scenario2.instruction}</p>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono border-collapse" dir={isArabic ? 'rtl' : 'ltr'}>
                  <thead>
                    <tr className="border-b border-pink-500/40 text-pink-300 bg-pink-950/40">
                      <th className="p-2.5">{t.scenario2.columns[0]}</th>
                      <th className="p-2.5">{t.scenario2.columns[1]}</th>
                      <th className="p-2.5">{t.scenario2.columns[2]}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-200">
                    {filteredPayloadRows.map((rule, idx) => (
                      <tr key={`payload-${idx}`} className="hover:bg-pink-500/10 transition-colors">
                        <td className="p-2.5">
                          <div className="flex items-center gap-1.5 uppercase font-bold">
                            {rule.sequence.map((c, i) => (
                              <span
                                key={i}
                                className="px-2.5 py-1 rounded text-xs text-black font-black"
                                style={{
                                  backgroundColor:
                                    c === 'red'
                                      ? '#ef4444'
                                      : c === 'blue'
                                      ? '#3b82f6'
                                      : c === 'green'
                                      ? '#10b981'
                                      : c === 'yellow'
                                      ? '#eab308'
                                      : c === 'cyan'
                                      ? '#06b6d4'
                                      : '#a855f7',
                                }}
                              >
                                {c}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-2.5 text-red-400 font-bold text-sm">{rule.payloadName}</td>
                        <td className="p-2.5 text-cyan-300 font-bold uppercase tracking-wider text-sm">
                          {rule.countermeasure} SHIELD
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* PROTOCOL 3: SUBNET ROUTING & BLACKHOLE EMP CORE NODE */}
          {(activeTab === 'all' || activeTab === 'scenario3') && (
            <section className="p-5 rounded-2xl bg-slate-900/70 border border-emerald-500/25">
              <div className="flex items-center gap-2 mb-2 text-emerald-400 font-bold font-mono">
                <Network className="w-5 h-5" />
                <h3 className="text-base">{t.scenario3.title}</h3>
              </div>
              <p className="text-xs text-slate-300 mb-4">{t.scenario3.instruction}</p>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono border-collapse" dir={isArabic ? 'rtl' : 'ltr'}>
                  <thead>
                    <tr className="border-b border-emerald-500/40 text-emerald-300 bg-emerald-950/40">
                      <th className="p-2.5">{t.scenario3.columns[0]}</th>
                      <th className="p-2.5">{t.scenario3.columns[1]}</th>
                      <th className="p-2.5">{t.scenario3.columns[2]}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-200">
                    {filteredSubnetRows.map((sub, idx) => {
                      const nodeTarget = sub.targetNodeId;
                      const badgeColor =
                        nodeTarget === 'ALPHA' ? '#38bdf8' : nodeTarget === 'BETA' ? '#ec4899' : '#10b981';
                      const nodeLabel =
                        isArabic
                          ? nodeTarget === 'ALPHA'
                            ? 'أطلق على العقدة ألفا (السماوية)'
                            : nodeTarget === 'BETA'
                            ? 'أطلق على العقدة بيتا (الوردية)'
                            : 'أطلق على العقدة جاما (الخضراء)'
                          : `SHOOT NODE ${nodeTarget}`;

                      return (
                        <tr key={`subnet-${idx}`} className="hover:bg-emerald-500/10 transition-colors">
                          <td className="p-2.5 text-amber-400 font-bold text-sm">
                            {sub.prefix}x
                          </td>
                          <td className="p-2.5 text-slate-300 font-medium">{sub.cidr} ({sub.subnetName})</td>
                          <td className="p-2.5">
                            <span
                              className="px-3 py-1.5 rounded-lg text-xs font-mono text-slate-950 font-black shadow-md inline-flex items-center gap-1.5"
                              style={{ backgroundColor: badgeColor }}
                            >
                              {nodeLabel}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* RADIO PROTOCOL & TACTICAL CALLOUTS */}
          {(activeTab === 'all' || activeTab === 'radio') && (
            <section className="p-5 rounded-2xl bg-slate-900/70 border border-amber-500/25">
              <div className="flex items-center gap-2 mb-2 text-amber-400 font-bold font-mono">
                <Radio className="w-5 h-5" />
                <h3 className="text-base">{t.phonetic.title}</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono mt-3">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-cyan-300">
                  {t.phonetic.alpha}
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-pink-300">
                  {t.phonetic.beta}
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-emerald-300">
                  {t.phonetic.gamma}
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-amber-300">
                  {t.phonetic.delta}
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>{isArabic ? 'عملية حامي العقد السيبرانية // وضع تدريب فرق الطوارئ' : 'Operation Node Defender // IT Incident Response Simulation'}</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md"
          >
            {isArabic ? 'إغلاق الدليل' : 'Close Rulebook'}
          </button>
        </div>
      </div>
    </div>
  );
};
