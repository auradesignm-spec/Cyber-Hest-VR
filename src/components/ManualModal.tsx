/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  HEX_PORT_TABLE,
  PAYLOAD_RULES,
  SUBNET_RULES,
  INCIDENT_MANUAL,
  CONSOLE_BUTTONS,
} from '../game/rules';
import { Language } from '../types/game';
import { Printer, X, ShieldAlert, Cpu, Network, Radio } from 'lucide-react';

interface ManualModalProps {
  language: Language;
  isOpen: boolean;
  onClose: () => void;
}

export const ManualModal: React.FC<ManualModalProps> = ({ language, isOpen, onClose }) => {
  if (!isOpen) return null;

  const t = INCIDENT_MANUAL[language];
  const isArabic = language === 'ar';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md no-game-shoot overflow-y-auto"
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-slate-950 border border-cyan-500/40 rounded-xl shadow-[0_0_50px_rgba(6,182,212,0.25)] text-slate-100 overflow-hidden">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-500/30 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-500/50 text-cyan-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-wider text-cyan-300 uppercase">
                  {t.title}
                </h2>
                <span className="text-xs px-2 py-0.5 rounded font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  {t.docId}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">{t.subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/50 text-xs font-mono transition-all cursor-pointer"
              title="Print Physical Manual"
            >
              <Printer className="w-4 h-4" />
              <span>{isArabic ? 'طباعة الدليل الورقي' : 'Print Rulebook'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
          {/* Top Banner Notice */}
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs font-mono flex items-start gap-3">
            <Radio className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold uppercase tracking-wider">{t.classification}</div>
              <div>{t.rulesSummary}</div>
            </div>
          </div>

          {/* PROTOCOL 1: HEX TO PORT */}
          <section className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center gap-2 mb-2 text-cyan-400 font-bold font-mono">
              <Cpu className="w-4 h-4" />
              <h3>{t.scenario1.title}</h3>
            </div>
            <p className="text-xs text-slate-300 mb-3">{t.scenario1.instruction}</p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono border-collapse" dir={isArabic ? 'rtl' : 'ltr'}>
                <thead>
                  <tr className="border-b border-cyan-500/30 text-cyan-300 bg-cyan-950/30">
                    <th className="p-2">{t.scenario1.columns[0]}</th>
                    <th className="p-2">{t.scenario1.columns[1]}</th>
                    <th className="p-2">{t.scenario1.columns[2]}</th>
                    <th className="p-2">{t.scenario1.columns[3]}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  {HEX_PORT_TABLE.map((row) => (
                    <tr key={row.hex} className="hover:bg-cyan-500/5">
                      <td className="p-2 text-amber-400 font-bold">{row.hex}</td>
                      <td className="p-2 text-cyan-300 font-bold">PORT {row.port}</td>
                      <td className="p-2 text-emerald-400">{row.service}</td>
                      <td className="p-2 text-slate-400">{row.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* PROTOCOL 2: COLOR SEQUENCE TO SHIELD */}
          <section className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center gap-2 mb-2 text-pink-400 font-bold font-mono">
              <ShieldAlert className="w-4 h-4" />
              <h3>{t.scenario2.title}</h3>
            </div>
            <p className="text-xs text-slate-300 mb-3">{t.scenario2.instruction}</p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono border-collapse" dir={isArabic ? 'rtl' : 'ltr'}>
                <thead>
                  <tr className="border-b border-pink-500/30 text-pink-300 bg-pink-950/30">
                    <th className="p-2">{t.scenario2.columns[0]}</th>
                    <th className="p-2">{t.scenario2.columns[1]}</th>
                    <th className="p-2">{t.scenario2.columns[2]}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  {PAYLOAD_RULES.map((rule, idx) => (
                    <tr key={`payload-${idx}`} className="hover:bg-pink-500/5">
                      <td className="p-2">
                        <div className="flex items-center gap-1.5 uppercase font-bold">
                          {rule.sequence.map((c, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded text-[10px] text-black font-extrabold"
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
                      <td className="p-2 text-red-400 font-bold">{rule.payloadName}</td>
                      <td className="p-2 text-cyan-300 font-bold uppercase tracking-wider">
                        {rule.countermeasure} SHIELD
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* PROTOCOL 3: SUBNET ROUTING & BLACKHOLE BUTTON SEQUENCE */}
          <section className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center gap-2 mb-2 text-emerald-400 font-bold font-mono">
              <Network className="w-4 h-4" />
              <h3>{t.scenario3.title}</h3>
            </div>
            <p className="text-xs text-slate-300 mb-3">{t.scenario3.instruction}</p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono border-collapse" dir={isArabic ? 'rtl' : 'ltr'}>
                <thead>
                  <tr className="border-b border-emerald-500/30 text-emerald-300 bg-emerald-950/30">
                    <th className="p-2">{t.scenario3.columns[0]}</th>
                    <th className="p-2">{t.scenario3.columns[1]}</th>
                    <th className="p-2">{t.scenario3.columns[2]}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  {SUBNET_RULES.map((sub, idx) => (
                    <tr key={`subnet-${idx}`} className="hover:bg-emerald-500/5">
                      <td className="p-2 text-amber-400 font-bold">
                        {sub.prefix}x ({sub.cidr})
                      </td>
                      <td className="p-2 text-slate-300">{sub.subnetName}</td>
                      <td className="p-2">
                        <span
                          className="px-2.5 py-1 rounded text-xs font-mono text-slate-900 font-extrabold shadow-sm"
                          style={{
                            backgroundColor:
                              sub.targetNodeId === 'ALPHA'
                                ? '#38bdf8'
                                : sub.targetNodeId === 'BETA'
                                ? '#ec4899'
                                : '#10b981',
                          }}
                        >
                          SHOOT NODE {sub.targetNodeId}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-900/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>{isArabic ? 'عملية حامي الخوادم - تدريب فرق الأمن السيبراني' : 'Operation Node Defender - IT Cyber Co-op'}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-all cursor-pointer"
          >
            {isArabic ? 'إغلاق الدليل' : 'Close Rulebook'}
          </button>
        </div>
      </div>
    </div>
  );
};
