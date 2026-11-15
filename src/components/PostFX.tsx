/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EffectComposer, Bloom, ChromaticAberration, Vignette } from '@react-three/postprocessing';
import { useXR } from '@react-three/xr';
import * as THREE from 'three';

const _alarmOffset = new THREE.Vector2(0.0004, 0.0004);
const _calmOffset = new THREE.Vector2(0.0001, 0.0001);

/**
 * Screen-space post-processing, desktop only.
 *
 * postprocessing owns the default framebuffer, so leaving the composer mounted
 * inside an XR session makes it render into the mirror instead of the eye
 * buffers. That throws every frame and kills the rAF loop, which is why the
 * headset froze and nothing (not even a fired bolt) moved.
 */
export const PostFX: React.FC<{ alarmActive: boolean }> = ({ alarmActive }) => {
  const isInXR = useXR((s) => Boolean(s.session));
  if (isInXR) return null;

  return (
    <EffectComposer multisampling={0}>
      <Bloom luminanceThreshold={0.9} mipmapBlur={false} intensity={0.12} />
      <ChromaticAberration offset={alarmActive ? _alarmOffset : _calmOffset} />
      <Vignette eskil={false} offset={0.15} darkness={0.45} />
    </EffectComposer>
  );
};
