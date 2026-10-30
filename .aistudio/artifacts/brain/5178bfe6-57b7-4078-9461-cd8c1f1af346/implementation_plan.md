# Universal Shoot-to-Interact System & Arcade Overhaul

An AAA-grade overhaul of **Cyber Heist: Node Defender** transforming all menu flows (Splash, Scenario Hub, Difficulty Selection) and gameplay into a universal **"Shoot-to-Interact"** mechanic. Players aim and fire laser blasters directly at 3D holographic targets in both Desktop and WebXR (Meta Quest 3), accompanied by instantaneous neon flashes, particle shatter bursts, and spatial audio feedback.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The user confirmed the following architectural decisions:
> - **Interaction Model**: Full 3D holographic targets with laser crosshair aiming on Desktop and dual 6DoF blasters in VR.
> - **Hit Feedback**: Direct instant trigger on laser strike with bright neon flash, sound chime, and voxel particle shatter.

---

## 1. Overview & Core Concept

### What It Does
Replaces passive 2D mouse button clicks with an active **Shoot-to-Interact** arcade flow. From the moment the game loads:
- Menu options (Start Defense, Training, Scenario Cards, Difficulty Tiers) float as illuminated 3D holographic cyber-targets in the data center.
- On Desktop, the player uses mouse movement with an active 3D cyber reticle and laser blasters that fire volumetric beam projectiles.
- In VR (Meta Quest 3), the player uses dual 6DoF laser blasters with ray-traced laser pointers and trigger-activated beams.
- Shooting any 3D menu target triggers instant neon flash, spark/voxel explosion, audio chime, and smoothly executes the selection or phase transition.

### Key Value
- Immersive, cohesive arcade gameplay where the weapon is the universal controller.
- Zero disconnect between "menu clicking" and "gameplay shooting".
- Full fidelity across Meta Quest 3 VR headsets and standard desktop browsers.

---

## 2. Visual Architecture & Component Hierarchy

### System Flow Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                        3D CYBER DATA CENTER SCENE                      │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│   [Cinematic Step 1: Splash]                                           │
│   ┌──────────────────────────────────────────────────────────────┐     │
│   │  3D Floating Title & Interactive Shoot Targets:              │     │
│   │  • [⚡ SHOOT TO INITIALIZE DEFENSE]                          │     │
│   │  • [🎓 SHOOT FOR TRAINING SIMULATION]                       │     │
│   └──────────────────────────────────────────────────────────────┘     │
│                                  │                                     │
│                                  ▼ (Laser Shot ➜ Warp Tunnel)          │
│   [Cinematic Step 2: Scenario Selection Hub]                           │
│   ┌──────────────────────────────────────────────────────────────┐     │
│   │  3 Holographic 3D Interactive Target Cards (Z: -4.5):        │     │
│   │  • [Card 1: Hex Breach Firewall]                             │     │
│   │  • [Card 2: Payload Purge & Shields]                         │     │
│   │  • [Card 3: DDoS Blackhole & Subnets]                        │     │
│   │  • [🏠 SHOOT TO RETURN TO MAIN HUB]                         │     │
│   └──────────────────────────────────────────────────────────────┘     │
│                                  │                                     │
│                                  ▼ (Laser Shot ➜ Warp Tunnel)          │
│   [Cinematic Step 3: Difficulty Tier Selection]                        │
│   ┌──────────────────────────────────────────────────────────────┐     │
│   │  3 Holographic 3D Tier Targets (X: -2.8, 0.0, +2.8, Z: -4.0):│     │
│   │  • [Tier 1: EASY (Basics)]                                   │     │
│   │  • [Tier 2: MEDIUM (Ports & Ciphers)]                        │     │
│   │  • [Tier 3: HARD (Forensics & Subnets)]                      │     │
│   │  • [⚡ SHOOT TO LAUNCH MISSION]                              │     │
│   └──────────────────────────────────────────────────────────────┘     │
│                                  │                                     │
│                                  ▼ (Laser Shot ➜ Level Warp)           │
│   [Phase 1: Question Decoding]                                         │
│   • Top Question Terminal [0, 3.5, -5.0]                               │
│   • 3 Solution Badges at [X, 1.0, -4.0] ➜ Shoot to Answer              │
│     - Correct: Green Flash (#00FF66) + Disintegrate ➜ Phase 2          │
│     - Wrong: Red Flash (#FF0055) + -1 HP + Error Buzzer                │
│                                  │                                     │
│                                  ▼ (Wave Cleared)                      │
│   [Phase 2: Malware Defense Wave]                                      │
│   • Q&A Disappears completely ➜ 6-10 Threat Packets attack Core        │
│   • Shoot down all packets to protect Floating Core at Z: -8.0         │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Detailed Technical Strategy

### 1. 3D Menu Shoot-to-Interact Architecture
- **Interactive 3D Targets**:
  - `SplashHero3D`: Render shootable holographic badges for `[ INITIALIZE DEFENSE ]` and `[ TRAINING SIMULATION ]`.
  - `ScenarioHub3D`: 3 glowing 3D scenario cards rendered with high-contrast canvas textures (Hex Breach, Payload Purge, DDoS Blackhole) and collision bounding boxes registered to the laser raycasting system.
  - `DifficultyHub3D`: 3 glowing 3D difficulty cards (`EASY`, `MEDIUM`, `HARD`) plus shootable action triggers `[ LAUNCH MISSION ]` and `[ BACK ]`.
- **Desktop & VR Universal Raycaster**:
  - Unifies mouse pointer raycasting on Desktop and 6DoF controller pointers in VR.
  - Clicking on Desktop or squeezing controller triggers fires laser blasters with volumetric beam trails.
  - Raycaster detects hits on 3D menu targets with magnetic aim assistance (subtle target attraction within 15° cone).

### 2. Direct Hit Feedback & Juice
- **Hit Sparks & Voxel Burst**: Spawns 20 glowing neon particle shards radiating from the exact collision point.
- **Emissive Flash**: Target material pulses emissive intensity to 3.0 with neon green or cyan glow for 180ms before executing the step change.
- **Audio Synthesis**: High-tech energetic confirm tone via `SpatialAudio.ts`.

### 3. Non-Blocking Complementary HUD
- Retain top status bar (language toggle `[ AR | EN ]`, Rulebook button, mute toggle) as a slim, non-intrusive floating header with `pointer-events-auto` so players can switch language or reference documentation at any time without blocking 3D shooting.

---

## 4. Acceptance Criteria

1. **Shoot-to-Interact Menus**:
   - On the Splash screen, shooting the `INITIALIZE DEFENSE` target launches the scenario selection.
   - In Scenario selection, shooting any scenario card selects it, and shooting `NEXT` or `DIFFICULTY` proceeds to tier select.
   - In Difficulty selection, shooting `EASY`, `MEDIUM`, or `HARD` selects the tier, and shooting `LAUNCH` immediately begins the mission.
2. **Audio & Visual Feedback**:
   - Laser beams clearly emit from blasters and strike targets with neon flashes and particles.
   - Spatial sound plays on every shot and hit.
3. **Gameplay Continuity**:
   - Phase 1 decoding badges remain 100% shoot-to-interact with green/red feedback.
   - Phase 2 combat defense seamlessly engages without question clutter.
4. **Performance & Stability**:
   - Zero compilation errors (`compile_applet` passes).
   - Crisp 60-90 FPS in WebXR and Desktop browsers.
