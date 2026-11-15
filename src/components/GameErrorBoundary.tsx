/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface GameErrorBoundaryState {
  failed: boolean;
}

/**
 * Last line of defence.
 *
 * A throw inside the 3D tree used to unmount everything and leave a blank dark
 * page with no way back. This keeps a recovery card on screen instead.
 */
export class GameErrorBoundary extends React.Component<
  { children: React.ReactNode },
  GameErrorBoundaryState
> {
  state: GameErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): GameErrorBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error('Game crashed:', error);
  }

  render() {
    if (!this.state.failed) return this.props.children;

    return (
      <div
        className="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-[#020611]"
        style={{ fontFamily: "'Cairo', 'JetBrains Mono', sans-serif" }}
      >
        <div className="max-w-md w-full rounded-2xl bg-black border-2 border-[#00f0ff] p-6 text-center shadow-[0_0_50px_rgba(0,240,255,0.4)]">
          <p className="text-[#00f0ff] font-black text-lg mb-2">⚠ توقف محرك العرض</p>
          <p className="text-white font-bold text-xs leading-relaxed mb-4" dir="rtl">
            حدث خطأ غير متوقع أثناء الرسم. أعد التحميل لمتابعة اللعب — تقدمك في المتصفح محفوظ.
          </p>
          <p className="text-slate-400 font-bold text-[11px] mb-5" dir="ltr">
            The renderer hit an unexpected error. Reload to continue.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-6 py-3 rounded-xl bg-[#00f0ff] text-black font-black text-sm cursor-pointer hover:bg-white transition-colors"
          >
            إعادة التحميل / RELOAD
          </button>
        </div>
      </div>
    );
  }
}
