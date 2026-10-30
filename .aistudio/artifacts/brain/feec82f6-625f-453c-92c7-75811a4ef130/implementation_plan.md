# Cinematic 4-Step Game Flow with 3D Warp Time Tunnel

Implement a cinematic 4-step game progression flow in "Cyber Heist: Node Defender" featuring custom 3D Warp Time Tunnel transitions, 3D Matrix Code Rain, procedural glitch shader typography, 3D holographic scenario and difficulty selection cards, and fluid camera choreography.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following user preferences were confirmed during clarification:
> - **Warp Time Tunnel Visual & Audio**: High-speed hyper-warp with traveling light streaks, dynamic camera FOV warp (dolly-in stretch), cylindrical neon rings, and procedural Web Audio spatial whooshes.
> - **Card Interaction**: Dual support featuring clickable 3D holographic cards on desktop and laser blaster pointing/shoot-to-select in WebXR.
> - **Navigation**: Bi-directional navigation allowing players to step backward with reverse tunnel camera motion.

- **Confirmed Decision 1**: High-speed hyper-warp transition with light streaks and audio whoosh between each step.
- **Confirmed Decision 2**: Interactive 3D holographic cards with dual mouse-click and VR laser blaster aiming.
- **Confirmed Decision 3**: Reverse navigation with backward tunnel camera motion and holographic back buttons.

---

## 1. Overview & Core Concept

- **What It Does**: Replaces the flat 2D menu overlays with an immersive, full-viewport 3D cinematic onboarding experience. Players navigate across 4 distinct steps connected by dynamic 3D Warp Time Tunnel transitions:
  1. **Main Splash Screen**: Cyberpunk glowing title with glitch shader effects, 3D Matrix Code Rain, cyber grid floor, floating ambient dust, language toggle, and "INITIALIZE DEFENSE" CTA.
  2. **Scenario Selection Hub**: Decelerates out of the tunnel into an arc of 3 interactive floating holographic cards (Firewall Hex Breach, Payload Purge, DDoS Subnet Blackhole).
  3. **Difficulty & Skill Hub**: Warps to a tier selection platform displaying Easy (OSI/Basics), Medium (Ports/Encryption), and Hard (Hex/CIDR Subnets) with round timers and threat stats.
  4. **Active Defense Ingress**: Final high-velocity warp into the Server Room defense station to battle malicious packet swarms and solve shoot-to-solve security incidents.
- **Target Audience**: Cybersecurity students, incident response teams, and WebXR gamers seeking AAA production values.
- **Key Value**: Replaces conventional 2D menus with tactile, spatial WebXR storytelling that builds anticipation and teaches threat mechanics through physical interactions.

---

## 2. User Experience & Visual Design

```
┌────────────────────────────────────────────────────────────────────────┐
│                          CINEMATIC 4-STEP FLOW                         │
│                                                                        │
│   [ Step 1: Splash ]  ──(Warp 1)──>  [ Step 2: Scenario Hub ]          │
│   • 3D Matrix Rain                   • 3 Holographic Cards             │
│   • Cyber Grid Floor                 • Bi-directional Nav              │
│   • Glitch Typography                • Desktop click / VR blaster      │
│            ▲                                     │                     │
│            │ (Reverse Warp)                      │ (Forward Warp 2)    │
│            └─────────────────────────┐           ▼                     │
│                                      [ Step 3: Difficulty Hub ]        │
│                                      • Easy / Medium / Hard Tiers      │
│                                      • Threat parameters               │
│                                                  │                     │
│                                                  │ (Final Warp 3)      │
│                                                  ▼                     │
│                                      [ Step 4: Defense Arena ]         │
│                                      • Server Room Incident Active     │
└────────────────────────────────────────────────────────────────────────┘
```

### Visual Identity & Theme
- **Color Palette & Atmospheric Depth**:
  - Dominant Neutral Canvas (60%): Deep obsidian void (`#020611`) with subtle exponential fog (`scene.fog` matching horizon).
  - Structural Surfaces (30%): Dark navy cyber glass (`#061325`) with emissive cyan (`#00f0ff`), emerald (`#10b981`), and amber (`#f59e0b`) accents.
  - Accent Highlights (10%): Neon gold and hot pink targeting reticles and warp light streaks (`#ec4899`, `#00f0ff`).
- **Typography & Hierarchy**:
  - Latin Display: `JetBrains Mono` and `Cairo` (Arabic) with crisp 2D canvas textures on solid opaque backing quads.
  - No wireframe stroke fonts; zero blurry bloom artifacts.
- **3D Warp Time Tunnel Effect**:
  - Procedural tube/cylinder geometry with inward-facing animated vertex UV coordinates.
  - Traveling neon warp rings and high-speed instanced light streaks streaking past the camera.
  - Camera FOV expansion from $72^\circ \to 105^\circ$ during peak warp velocity, settling smoothly back to $72^\circ$ upon arrival using `THREE.MathUtils.damp`.
  - Web Audio procedural synthesized whoosh with resonant low-pass filter sweeps and sub-bass transients.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Real-time 3D Scene Flow vs. HTML Modals**
  - *Chosen Approach*: Render all menu stages directly within the Three.js Canvas using dedicated 3D scene rigs (Matrix Rain, Holographic Hub, Difficulty Pedestal, Time Tunnel).
  - *Why*: Provides complete spatial immersion in VR (Meta Quest 3) and desktop alike without mode switches or DOM overlays occluding the 3D world.
- **Decision 2: Dual Interaction (Clickable Canvas + VR Raycast Blaster)**
  - *Chosen Approach*: Attach pointer event handlers to 3D holographic cards for instant desktop mouse interaction, while maintaining raycasting from VR blasters for shoot-to-select in headset mode.
  - *Why*: Zero friction for desktop players while honoring the tactile VR blaster mechanic.
- **Decision 3: Procedural Audio Whoosh Synthesis**
  - *Chosen Approach*: Synthesize hyper-warp audio via Web Audio API nodes (pink noise burst + dual-biquad bandpass filter sweep + sub oscillator) inside `SpatialAudio.ts`.
  - *Why*: Zero external audio file dependencies (no 404s), frame-perfect sync with camera acceleration.

---

## 4. Technical Architecture & Component Mapping

```
┌───────────────────────────────────────────────────────────────────────┐
│                           SYSTEM ARCHITECTURE                         │
│                                                                       │
│   src/App.tsx (Cinematic Step State Machine: splash|tunnel|scenarios|  │
│                difficulty|playing|training)                           │
│     │                                                                 │
│     ├── <Canvas>                                                      │
│     │     ├── <SceneCameraRig> (Damped camera translation + FOV warp) │
│     │     ├── <WarpTunnel3D> (Cylindrical warp tunnel + light streaks)│
│     │     ├── <MatrixCodeRain3D> (Instanced falling glyph columns)    │
│     │     ├── <CyberGridFloor> (Perspective grid with pulse waves)    │
│     │     ├── <SplashHero3D> (Glitch typography + CTA pedestals)      │
│     │     ├── <ScenarioHub3D> (Arc of 3 interactive holographic cards)│
│     │     ├── <DifficultyHub3D> (3 Tiered skill nodes with timers)    │
│     │     ├── <ServerRoom> & <EducationalQuestion3D> (In gameplay)    │
│     │     └── <VRPlayer> & <Lasers> (Active in all stages for aim)    │
│     │                                                                 │
│     └── <HUDOverlay> / <ManualModal> (Minimal unobtrusive controls)   │
└───────────────────────────────────────────────────────────────────────┘
```

### Component Breakdown
1. **`src/components/WarpTunnel3D.tsx`**:
   - Manages the cylindrical warp tunnel mesh with inward UV animation.
   - Instanced light streaks moving at high velocity toward/away from the camera.
   - Camera transition driver: animates camera position between step anchors with exponential damping and FOV stretching.
2. **`src/components/MatrixCodeRain3D.tsx`**:
   - 3D falling digital code columns rendered via instanced characters or canvas-mapped strip quads with glowing green/cyan heads.
3. **`src/components/SplashHero3D.tsx`**:
   - Cyberpunk glowing title with chromatic glitch offsets.
   - Interactive 3D CTA "INITIALIZE DEFENSE" and "Incident Rulebook".
   - Language toggle [العربية | English] floating pill with instant RTL Cairo re-render.
4. **`src/components/ScenarioHub3D.tsx`**:
   - Curved arc of 3 holographic cards at `Z: -3.2m`:
     1. Hex Firewall Breach (Port security, 0x Hex codes)
     2. Payload Purge (Color sequencing & cryptographic protocols)
     3. DDoS Subnet Blackhole (IP triage & CIDR subnet routing)
   - Hover glow (+15% scale, gold/cyan border) and click/shoot handlers.
   - Holographic Back button to return to Splash.
5. **`src/components/DifficultyHub3D.tsx`**:
   - 3 holographic difficulty nodes (Easy, Medium, Hard) displaying threat speed, round timer (120s, 90s, 60s), and curriculum topic badges.
   - Holographic Back button to return to Scenario Hub.
6. **`src/audio/SpatialAudio.ts`**:
   - Add `playWarpWhoosh(reverse?: boolean)` and `playWarpDecelerate()` with resonant filter sweeps.
7. **`src/App.tsx`**:
   - State machine governing current cinematic step: `splash` -> `tunnel_to_scenario` -> `scenario_select` -> `tunnel_to_diff` -> `diff_select` -> `tunnel_to_game` -> `playing`.
   - Smooth camera target orchestration and bi-directional navigation.

---

## 5. Verification Plan

- **Static Analysis**: Run `lint_applet` to ensure zero TypeScript errors or missing imports.
- **Production Build**: Run `compile_applet` to verify clean Vite build.
- **Logic Tests**: Run `npx tsx src/game/rules.test.ts` to ensure scenario rules and scoring integrity.
- **Interaction Verification**:
  - Test Step 1 -> Warp 1 -> Step 2 -> Warp 2 -> Step 3 -> Warp 3 -> Step 4.
  - Test reverse navigation (Step 3 -> Step 2 -> Step 1) with reverse warp tunnel camera motion.
  - Verify bilingual English/Arabic font rendering across all 3D cards.
  - Verify dual mouse clicking and laser blaster shoot-to-select.
