# Implementation Plan: Addictive Arcade Mechanics & "Juice" (Fever Mode & Visceral Feedback)

## Overview
This plan integrates visceral arcade game feel and micro-interactions ("juice") into **Cyber Heist: Node Defender** for both Meta Quest 3 WebXR and Desktop browser modes. Based on your preferences, it introduces hit-stop micro-pauses with camera shake, floating 3D score popups, magnetic data shard drops, and a high-energy Fever Mode with a 1.5-second miss grace window.

---

## User-Confirmed Specifications
1. **Combo Reset Timing**: 1.5-second grace window after a missed shot before combo resets, providing fair room for fast-paced recovery.
2. **Magnetic Shard Collection**: Floating data shards auto-magnetize smoothly toward the player's blaster muzzle when aiming near them.
3. **Fever Mode Audiovisuals**: High-energy presentation with a 20% tempo increase in synth audio, pulsating grid lighting, and 3x laser thickness.

---

## Architectural Changes & Components

### 1. Hit-Stop (Micro-Pause) & Camera Shake
- **Global Time Dilation (`gameTimeScale`)**:
  - Expose a global time multiplier (`1.0` normal, `0.05` for 50ms during core damage or critical countermeasure activations).
  - Integrates into packet movement, laser propagation, and particle velocity inside `useFrame`.
- **Camera Shake Impulse (`useCameraShake`)**:
  - High-frequency decaying shake vector applied in desktop mode and gentle controller haptic burst in WebXR mode (respecting VR comfort guidelines to prevent motion sickness).

### 2. Floating 3D Score Popups (`FloatingScorePopups.tsx`)
- Object-pooled 3D score billboards spawning at the exact coordinates of destroyed malicious packets.
- Pop-ups animate with a quick scale bounce, gentle upward drift, and smooth alpha fadeout.
- Dynamic color coding:
  - White/Cyan: Standard packet kill (`+100 PTS`)
  - Gold/Orange: Combo kill (`+200 x2`, `+300 x3`)
  - Neon Magenta: Fever Mode kill (`+300 FEVER!`)
  - Blue: Data shard collection (`+50 DATA`)

### 3. Combo Meter & High-Energy Fever Mode
- **Combo State Engine**:
  - Consecutive hits increment combo counter (x1 &rarr; x2 &rarr; x3 &rarr; x4 &rarr; Fever at x10).
  - Taking node damage immediately resets combo.
  - Missed shots start a 1.5-second countdown timer; hitting a target within 1.5s preserves the combo streak.
- **Fever Mode Surge (At x10 Combo)**:
  - **Triple Points**: Multiplies all scores by 3x.
  - **Blaster Upgrade**: Triples laser beam cylinder thickness with golden/cyan energy trails.
  - **Environmental Pulse**: Server room overhead neon grid and floor lines rhythmically pulse.
  - **Audio Overdrive**: `SpatialAudioEngine` accelerates background synth bassline tempo by +20% with energetic pitch modulation.
  - **Diegetic Blaster UI**: Real-time combo multiplier and glowing "FEVER ACTIVE" banner rendered on the weapon OLED display and wrist HUD.

### 4. Magnetic Data Shards (`DataShards.tsx`)
- 30% drop chance upon malware packet destruction.
- Shards spawn as glowing crystalline octahedrons hovering with gentle floating physics.
- **Magnetic Attraction**:
  - When the player aims their blaster within proximity (angle &le; 15&deg; or distance &le; 2.5m), shards accelerate toward the blaster tip with a particle wake.
  - On absorption: Triggers an audio collection chime, creates a tiny spark burst, and awards `+50 DATA PTS`.

### 5. High-Score Celebration & Binary Matrix Rain
- Screen-filling celebratory binary code explosion (`0`s and `1`s) upon scenario completion or record break.
- 3D holographic "NEW RECORD!" banner with neon particle fountain.
- Persistent high score recorded in `localStorage` across play sessions.

---

## File Modification Plan
1. `src/types/game.ts`: Add arcade state types (`combo`, `feverTimeLeft`, `isFeverMode`, `highScore`, `shards`).
2. `src/audio/SpatialAudio.ts`: Add `setFeverMode(active: boolean)`, shard pickup chime, and combo milestone SFX.
3. `src/components/FloatingScorePopups.tsx`: New pooled 3D floating score billboard component.
4. `src/components/DataShards.tsx`: New magnetic data shard spawner and physics loop.
5. `src/components/VRPlayer.tsx`: Add combo/fever indicator on the blaster 3D OLED HUD and muzzle magnet point.
6. `src/components/Lasers.tsx`: Adapt laser thickness and glow when `isFeverMode` is active.
7. `src/components/ServerRoom.tsx`: Add pulsating rhythmic grid effect during Fever Mode.
8. `src/App.tsx`: Coordinate hit-stop time scale, camera shake hook, combo logic, and high-score celebration.
9. `src/game/rules.test.ts`: Add unit test coverage for combo calculations, grace window decay, and Fever multipliers.

---

## Verification & Acceptance Criteria
- Unit tests pass with `npm test` verifying combo grace timers and multiplier calculations.
- Clean TypeScript compilation (`compile_applet`).
- Visual and interaction verification in browser:
  - Destroying malware packets spawns floating score text.
  - Successive hits build the combo; 1.5s miss grace window works as intended.
  - Reaching x10 triggers Fever Mode (accelerated synth tempo, thicker lasers, pulsating grid).
  - Shards drop and smoothly pull into the blaster when aimed at.
