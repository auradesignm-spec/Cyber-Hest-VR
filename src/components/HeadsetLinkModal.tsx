/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Glasses, Copy, Check, X, Wifi, ShieldCheck } from 'lucide-react';
import { Language } from '../types/game';

interface HeadsetLinkModalProps {
  language: Language;
  onEnterVR: () => void;
  onClose: () => void;
}

/**
 * Headset link panel.
 *
 * WebXR runs the page *on* the headset, so "linking" means opening this exact
 * origin inside the headset browser. The panel reports whether this device can
 * start an immersive session, shows the URL to open on the headset, and warns
 * when the origin is loopback (a headset cannot reach the PC's localhost).
 */
export const HeadsetLinkModal: React.FC<HeadsetLinkModalProps> = ({
  language,
  onEnterVR,
  onClose,
}) => {
  const isArabic = language === 'ar';
  const [vrSupported, setVrSupported] = useState<boolean | null>(null);
  const [copied, setCopied] = useState(false);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const shareUrl = `${origin}${window.location.pathname}?vr=1`;
  const isLoopback =
    typeof window !== 'undefined' &&
    /^(localhost|127\.0\.0\.1|\[::1\])$/i.test(window.location.hostname);

  useEffect(() => {
    let cancelled = false;
    const xr = (navigator as Navigator & { xr?: { isSessionSupported: (m: string) => Promise<boolean> } }).xr;
    if (!xr?.isSessionSupported) {
      setVrSupported(false);
      return;
    }
    xr.isSessionSupported('immersive-vr')
      .then((ok) => {
        if (!cancelled) setVrSupported(ok);
      })
      .catch(() => {
        if (!cancelled) setVrSupported(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard can be blocked; the URL stays selectable on screen
    }
  };

  const statusLabel =
    vrSupported === null
      ? isArabic
        ? 'جاري فحص دعم WebXR…'
        : 'CHECKING WEBXR SUPPORT…'
      : vrSupported
      ? isArabic
        ? 'هذا الجهاز يدعم جلسات الواقع الافتراضي'
        : 'THIS DEVICE CAN START AN IMMERSIVE SESSION'
      : isArabic
      ? 'لا يوجد دعم VR على هذا الجهاز — افتح الرابط داخل النظارة'
      : 'NO VR SUPPORT HERE — OPEN THE LINK INSIDE THE HEADSET';

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#020611]/85 backdrop-blur-sm"
      dir={isArabic ? 'rtl' : 'ltr'}
      style={{
        fontFamily: isArabic ? "'Cairo', sans-serif" : "'JetBrains Mono', monospace",
      }}
    >
      <div className="w-full max-w-xl rounded-2xl bg-[#000000] border-2 border-[#00f0ff] shadow-[0_0_60px_rgba(0,240,255,0.45)] p-6 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 end-3 p-2 rounded-lg border border-[#00f0ff]/50 text-[#00f0ff] hover:bg-[#00f0ff]/15 cursor-pointer"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl border-2 border-[#00f0ff] text-[#00f0ff]">
            <Glasses className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-[#ffffff] font-black text-lg leading-tight">
              {isArabic ? 'ربط نظارة الواقع الافتراضي' : 'LINK YOUR HEADSET'}
            </h2>
            <p className="text-[#00f0ff] text-[11px] font-black tracking-wide">
              {isArabic ? 'جلسة WebXR مباشرة من المتصفح' : 'NATIVE WEBXR SESSION, NO APP INSTALL'}
            </p>
          </div>
        </div>

        {/* Capability status */}
        <div className="flex items-start gap-2 p-3 rounded-xl border border-slate-700 bg-[#03091e] mb-3">
          <ShieldCheck
            className={`w-4 h-4 mt-0.5 shrink-0 ${
              vrSupported ? 'text-emerald-400' : 'text-slate-400'
            }`}
          />
          <span className="text-[11px] font-black text-[#ffffff] leading-snug">{statusLabel}</span>
        </div>

        {/* Link to open on the headset */}
        <p className="text-[11px] text-slate-300 font-bold mb-1.5">
          {isArabic ? 'افتح هذا الرابط داخل متصفح النظارة:' : 'OPEN THIS LINK IN THE HEADSET BROWSER:'}
        </p>
        <div className="flex items-center gap-2 mb-3">
          <code className="flex-1 min-w-0 truncate px-3 py-2 rounded-lg bg-[#03091e] border border-[#00f0ff]/60 text-[#00f0ff] text-[11px] font-black">
            {shareUrl}
          </code>
          <button
            type="button"
            onClick={copyLink}
            className="px-3 py-2 rounded-lg bg-[#00f0ff] text-black font-black text-[11px] flex items-center gap-1.5 cursor-pointer hover:bg-white transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? (isArabic ? 'تم النسخ' : 'COPIED') : isArabic ? 'نسخ' : 'COPY'}
          </button>
        </div>

        {isLoopback && (
          <div className="flex items-start gap-2 p-3 rounded-xl border border-amber-400/70 bg-amber-400/10 mb-3">
            <Wifi className="w-4 h-4 mt-0.5 shrink-0 text-amber-300" />
            <span className="text-[11px] font-black text-amber-200 leading-snug">
              {isArabic
                ? 'الرابط الحالي على localhost — النظارة لا تستطيع الوصول إليه. شغّل السيرفر على الشبكة واستخدم عنوان الجهاز (مثال: http://192.168.1.5:3000).'
                : 'This origin is localhost, which the headset cannot reach. Serve on your LAN and use the machine IP (e.g. http://192.168.1.5:3000).'}
            </span>
          </div>
        )}

        {/* Steps */}
        <ol className="text-[11px] text-slate-200 font-bold space-y-1.5 mb-4 list-decimal ps-5">
          <li>
            {isArabic
              ? 'البس النظارة وافتح متصفح Meta Quest (أو أي متصفح يدعم WebXR).'
              : 'Put the headset on and open the Meta Quest Browser (or any WebXR browser).'}
          </li>
          <li>
            {isArabic
              ? 'الصق الرابط، ثم اضغط «Enter VR» — اللعبة تنتقل للعرض ثلاثي الأبعاد الكامل.'
              : 'Paste the link, then press Enter VR — the game takes over the full 3D view.'}
          </li>
          <li>
            {isArabic
              ? 'فريق الطاولة يفتح نفس الموقع على اللابتوب ويستخدم الواجهة المرئية بالتوازي.'
              : 'The table team keeps the same site open on a laptop and uses the flat HUD in parallel.'}
          </li>
        </ol>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onEnterVR}
            className="px-4 py-2.5 rounded-xl bg-[#00f0ff] text-black font-black text-xs cursor-pointer hover:bg-white transition-colors"
          >
            {isArabic ? 'إدخال VR الآن' : 'ENTER VR NOW'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border-2 border-[#00f0ff]/70 text-[#00f0ff] font-black text-xs cursor-pointer hover:bg-[#00f0ff]/15 transition-colors"
          >
            {isArabic ? 'إغلاق' : 'CLOSE'}
          </button>
        </div>
      </div>
    </div>
  );
};
