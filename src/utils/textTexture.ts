/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';

export interface TextTextureOptions {
  textColor?: string;
  bgColor?: string;
  fontSize?: number;
  width?: number;
  height?: number;
  border?: string;
  subText?: string;
  isArabic?: boolean;
  statusBadge?: string;
  statusColor?: string;
  decisionToken?: string; // 2x scaled critical number (e.g., "PORT 22", "0x16", "192.168.4.0/24")
  secondaryLabel?: string; // Standard-size accompanying label
}

/**
 * AAA High-Contrast Dynamic Canvas Badge Generator
 * Features solid #030A14 dark-navy card background, thick neon glowing borders,
 * and 2x scaled critical decision numbers relative to secondary text.
 */
export function createTextTexture(
  text: string,
  options: TextTextureOptions = {}
): THREE.CanvasTexture {
  const {
    textColor = '#00f0ff',
    bgColor = '#030A14',
    fontSize = 62,
    width = 768,
    height = 256,
    border = '#00f0ff',
    subText = '',
    isArabic = false,
    statusBadge = '',
    statusColor = '#10b981',
    decisionToken = '',
    secondaryLabel = '',
  } = options;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // 1. Solid High-Contrast Dark-Navy Card (Hex #030A14)
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    // Subtle technical grid pattern
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 32; x < width; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 32; y < height; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // 2. Thick Multi-Layer Neon Glowing Border
    if (border) {
      // Outer neon diffuse glow
      ctx.save();
      ctx.shadowColor = border;
      ctx.shadowBlur = 18;
      ctx.strokeStyle = border;
      ctx.lineWidth = 8;
      ctx.strokeRect(10, 10, width - 20, height - 20);

      // Inner crisp neon highlight
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#ffffff';
      ctx.strokeRect(12, 12, width - 24, height - 24);

      // Heavy cyber corner brackets
      ctx.fillStyle = border;
      const notchW = 28;
      const notchH = 8;
      // Top-Left
      ctx.fillRect(10, 10, notchW, notchH);
      ctx.fillRect(10, 10, notchH, notchW);
      // Top-Right
      ctx.fillRect(width - 10 - notchW, 10, notchW, notchH);
      ctx.fillRect(width - 10 - notchH, 10, notchH, notchW);
      // Bottom-Left
      ctx.fillRect(10, height - 10 - notchH, notchW, notchH);
      ctx.fillRect(10, height - 10 - notchW, notchH, notchW);
      // Bottom-Right
      ctx.fillRect(width - 10 - notchW, height - 10 - notchH, notchW, notchH);
      ctx.fillRect(width - 10 - notchH, height - 10 - notchW, notchH, notchW);
      ctx.restore();
    }

    // 3. Status Badge Pill
    if (statusBadge) {
      ctx.font = 'bold 20px "JetBrains Mono", monospace';
      const badgeWidth = ctx.measureText(statusBadge).width + 28;
      const badgeX = isArabic ? 24 : width - 24 - badgeWidth;

      ctx.fillStyle = '#01050e';
      ctx.fillRect(badgeX, 16, badgeWidth, 32);
      ctx.strokeStyle = statusColor;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(badgeX, 16, badgeWidth, 32);

      ctx.fillStyle = statusColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(statusBadge, badgeX + badgeWidth / 2, 32);
    }

    const fontFamily = isArabic ? '"Cairo", sans-serif' : '"JetBrains Mono", monospace';

    // 4. Critical Decision Number (2x Scaled) vs Secondary Label
    if (decisionToken) {
      // 2x Scaled Primary Decision Token
      ctx.save();
      ctx.shadowColor = textColor;
      ctx.shadowBlur = 18;
      ctx.fillStyle = textColor;
      ctx.font = `900 ${fontSize}px ${fontFamily}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(decisionToken, width / 2, height * 0.38);
      ctx.restore();

      // Secondary Label (Half size)
      if (secondaryLabel) {
        ctx.font = `bold ${Math.round(fontSize * 0.48)}px ${fontFamily}`;
        ctx.fillStyle = '#e2e8f0';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(secondaryLabel, width / 2, height * 0.68);
      }

      // SubText
      if (subText) {
        ctx.font = `bold 18px ${fontFamily}`;
        ctx.fillStyle = '#94a3b8';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(subText, width / 2, height * 0.86);
      }
    } else {
      // Auto-Fit Primary Text
      const maxTextWidth = width - 80;
      let currentFontSize = fontSize;

      ctx.font = `bold ${currentFontSize}px ${fontFamily}`;
      let measured = ctx.measureText(text).width;

      while (measured > maxTextWidth && currentFontSize > 24) {
        currentFontSize -= 2;
        ctx.font = `bold ${currentFontSize}px ${fontFamily}`;
        measured = ctx.measureText(text).width;
      }

      ctx.save();
      ctx.shadowColor = textColor;
      ctx.shadowBlur = 16;
      ctx.fillStyle = textColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const textY = subText ? height * 0.44 : height * 0.5;
      ctx.fillText(text, width / 2, textY);
      ctx.restore();

      if (subText) {
        const subFontSize = Math.max(20, Math.round(currentFontSize * 0.45));
        ctx.font = `bold ${subFontSize}px ${fontFamily}`;
        ctx.fillStyle = '#cbd5e1';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(subText, width / 2, height * 0.78);
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}
