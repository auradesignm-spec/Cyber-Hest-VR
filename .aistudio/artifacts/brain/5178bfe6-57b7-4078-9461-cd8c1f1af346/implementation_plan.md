# WebXR 90 FPS Performance Architecture & Spatial UI Refactor

## Executive Architectural Summary
Refactoring **Cyber Heist: Node Defender** for rock-solid 90 FPS on **Meta Quest 3** and Desktop, replacing garbage-collected object churn and unoptimized render loops with zero-allocation instanced pooling and crystal-clear 3D spatial UI.

---

## 1. Extreme Performance & Anti-Lag Engine Architecture
- **Zero React State in `useFrame`**:
  - Strip all `useState` / `setState` updates from all 60/90Hz loops (`VRPlayer.tsx`, `PacketSwarm.tsx`, `Lasers.tsx`, `ParticleSystem.tsx`, `SceneCamera`).
  - Move all frame-to-frame animations (recoil, capacitor charge, aim lock detection, muzzle coordinates) to mutable `useRef` instances.
- **Pre-Allocated Math Memory**:
  - Declare shared module-level reusable math primitives (`_v1`, `_v2`, `_dir`, `_ray`, `_sphere`, `_dummy`, `_quat`, `_matrix`) at module root. Zero `new THREE.Vector3()` or `new THREE.Quaternion()` allocations inside any animation or raycast call.
- **Full `THREE.InstancedMesh` Object Pooling**:
  - **Malware Packets**: Pooled 12 instanced capsules with dual energy spheres.
  - **Laser Bolts**: 24 pre-allocated instanced cylinders.
  - **Sparks & Voxels**: 300 instanced particle shards.
  - **Floating Scores**: Instanced or pre-allocated billboard quad pool referencing pre-rendered canvas atlas textures (+100, +250, +500, FEVER!).
  - **Data Shards**: Instanced octahedron pool with vectorized magnetic suction.
- **GPU Optimization for Mobile WebXR**:
  - Replace expensive `meshStandardMaterial` on UI cards with `meshBasicMaterial` with solid `#020611` backplates.
  - Selectively disable post-processing bloom during active WebXR VR session to avoid fillrate throttling.

---

## 2. Spatial 3D UI & Shoot-to-Interact Grid
- **WebXR Diegetic UI**:
  - 3D Spatial UI directly visible inside the VR headset and on desktop.
  - Solid dark `#020611` cards with high-contrast glowing cyan (`#00f0ff`) and gold (`#f59e0b`) borders.
  - Main Hub: `[ ⚡ INITIALIZE DEFENSE ]`, `[ 🎓 TRAINING SIMULATION ]`, `[ 🌐 AR/EN ]`.
  - Scenario Hub: 3 clean, non-overlapping cards (Hex Breach, Payload Purge, DDoS Blackhole).
  - Difficulty Hub: 3 clean tier cards (Easy, Medium, Hard) + `[ LAUNCH MISSION ]`.
- **Instant Arabic / English Toggle**:
  - Seamless localized strings rendered cleanly without font or layout distortion.

---

## 3. Strict 2-Phase "Warp-to-Defend" Flow
- **Phase 1: Question Decoding**:
  - Victim Core / Router pushed to deep background (`Z: -40.0`).
  - Question Terminal positioned high (`Y: 4.5, Z: -5.0`).
  - 3 Solution Badges positioned at `Y: 1.0, Z: -5.0` (`X: -2.35, 0.0, 2.35`).
- **Warp Transition**:
  - Correct shot instantly hides Q&A UI (`visible = false`, zero unmounts/garbage collection).
  - Camera rapidly dashes forward along Z from `0.4` to `-25.0` (FOV stretches from 72 to 115) with light streaks & whoosh audio.
- **Phase 2: Combat Defense**:
  - Camera positioned at `Z: -25.0` defending Core at `Z: -30.0`.
  - 6–10 instanced malware packets converge from 5 distinct 3D attack trajectories.
  - Shoot-to-Activate power-up orbs (Rapid Fire, EMP Bomb, Plasma Beam).

---

## 4. Addictive Arcade Juice (User-Selected Features)
- **Hit-Stop Micro-Pause**: 50ms time-dilation pause on core hit or power-up, followed by sharp camera shake.
- **Floating Score Pop-ups**: Upward drifting 3D text at death location.
- **Electric Gold Fever Mode**: Reaching x10 combo activates pulsing strobe, thick gold beams, 3x score multiplier, and audio tempo boost.
- **Magnetic Data Shards**: 30% drop rate, magnetic vacuum pull toward blaster muzzles, +250 PTS with digital collect chime.
- **High-Score Celebration**: Screen-filling binary code particle burst (0s and 1s) with holographic "NEW RECORD!" banner.
