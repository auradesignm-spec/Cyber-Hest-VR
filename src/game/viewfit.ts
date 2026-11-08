/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';

export interface AnswerSlot {
  position: [number, number, number];
  rotY: number;
  scale: number;
}

export const getViewAspect = (): number => {
  if (typeof window === 'undefined') return 16 / 9;
  return window.innerWidth / Math.max(1, window.innerHeight);
};

/** Tracks the live viewport aspect ratio so 3D layouts can adapt on resize. */
export const useViewAspect = (): number => {
  const [aspect, setAspect] = useState<number>(getViewAspect);

  useEffect(() => {
    const update = () => setAspect(getViewAspect());
    update();
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, []);

  return aspect;
};

/**
 * Single source of truth for the answer-card arc, shared by the 3D cards and by
 * the aim-assist targets so they can never drift apart.
 *
 * - Wide screens / VR: options wrap around the player (±40° / ±55°) so the world
 *   surrounds them instead of forming one flat wall.
 * - Narrow portrait screens: a tighter fan (±22° / ±32°) at a shorter radius so
 *   every option stays inside the horizontal field of view instead of being
 *   pushed off-screen.
 */
export const getAnswerLayout = (count: number, aspect: number = getViewAspect()): AnswerSlot[] => {
  const narrow = aspect < 1.15;
  const radius = narrow ? 3.4 : 3.9;
  const angles =
    count <= 3
      ? narrow
        ? [-17, 0, 17]
        : [-30, 0, 30]
      : narrow
        ? [-25, -9, 9, 25]
        : [-42, -14, 14, 42];

  return angles.slice(0, count).map((deg) => {
    const rad = (deg * Math.PI) / 180;
    return {
      position: [
        Math.sin(rad) * radius,
        narrow ? 1.15 : 1.25,
        -Math.cos(rad) * radius,
      ] as [number, number, number],
      rotY: -rad,
      scale: narrow ? 0.72 : 1,
    };
  });
};
