# Educational Difficulty Progression & Visual Clarity Refactor

A comprehensive architectural overhaul for **Cyber Heist: Node Defender** that eliminates visual rendering glitches, isolates spatial layers to prevent text/packet overlaps, and introduces a **3-Tier Educational Difficulty Progression System (Easy, Medium, Hard)** with dynamic pacing and refined WebXR Shoot-to-Solve mechanics.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following gameplay preferences were confirmed:
> - **Difficulty Access**: Players can freely select any difficulty tier (Easy, Medium, Hard) directly from the Start Screen and in-game pause dock.
> - **Pacing & Timers**: Dynamic timers calibrated per difficulty (Easy: 120s with relaxed packet flow, Medium: 90s standard incident, Hard: 60s intense triage).

---

## 1. Overview & Core Concept

**Cyber Heist: Node Defender** is an asymmetric educational WebXR defense game designed for incident response teams and cybersecurity students. One player enters the 3D server room (via Meta Quest 3 VR or desktop first-person blaster simulator), while teammate(s) outside consult networking concepts and reference materials to formulate tactical countermeasures.

### The Problem Being Solved
1. **Visual Glitches & Overlaps**: Previous 3D text rendering suffered from wireframe font stroke artifacts, overlapping elements at identical focal depths, and blurry bloom post-processing that degraded text readability.
2. **Pedagogical Progression**: Gameplay previously plunged new learners immediately into advanced hexadecimal conversions and CIDR subnet math without covering foundational OSI layer and core protocol concepts.

### The Solution
- **3-Tier Curriculum**:
  - **Easy (Networking & Cyber Basics)**: Cisco OSI Model layers, SSL/TLS web security, and threat definitions (Phishing, Ransomware, DDoS).
  - **Medium (Ports & Countermeasures)**: Standard service ports (SSH 22, HTTP 80, HTTPS 443, DNS 53) and cryptographic algorithms (AES-256 vs. hashing).
  - **Hard (Advanced Systems & Subnets)**: Hexadecimal port decoding (`0x0016` -> 22) and CIDR IP routing calculations (`172.16.2.99` -> `172.16.0.0/12`).
- **Strict Spatial Geometry Layout**: Fixed non-intersecting vertical & depth planes ensuring questions, solution targets, and threat packets never collide or occlude each other.
- **Crisp Dynamic 2D Canvas Textures**: Replacing wireframe/stroke geometry with high-resolution HTML5 Canvas textures rendered onto solid, dark navy opaque backplates (`#020813`) with glowing neon borders.

---

## 2. User Experience & Visual Design

### Spatial Layout & Viewport Hierarchy

```
┌────────────────────────────────────────────────────────────────────────┐
│                                                                        │
│         [ QUESTION BOARD: Y: +3.5m, Z: -5.0m, Width: 4.8m ]            │
│         Solid #020813 Opaque Backing, Gold/Cyan Border                 │
│                                                                        │
│                                                                        │
│  [LEFT PACKET CONDUIT]                        [RIGHT PACKET CONDUIT]   │
│   X: -4.0 to -2.5                             X: +2.5 to +4.0          │
│   Peripheral stream                           Peripheral stream        │
│                                                                        │
│         [ SOLUTION BADGES: Y: +1.2m, Z: -3.5m, Spacing: 1.4m ]         │
│         [ Option A ]       [ Option B ]       [ Option C ]             │
│         Hover: 1.15x scale + Gold highlight + Haptic tick              │
│                                                                        │
│ ══════════════════════════════════════════════════════════════════════ │
│   [COLLAPSIBLE DOCK: Timer | Health | Score | Difficulty | Comms]      │
└────────────────────────────────────────────────────────────────────────┘
```

### Strict Spatial Separation Rules
1. **Question Board**: Fixed high-altitude position at `[0, 3.5, -5.0]` (above player line-of-sight). Never obscured by targets or hands.
2. **Solution Target Badges**: Positioned at `Y: 1.25, Z: -3.5` with generous horizontal distribution (`X: -1.4, 0.0, +1.4` or `X: -2.1, -0.7, +0.7, +2.1`).
3. **Peripheral Threat Packet Lanes**: Packet swarm trajectories constrained strictly to side corridors (`X: -4.0 to -2.5` and `X: +2.5 to +4.0`). Packets never fly through the center question or target area.
4. **Visual Sharpness (Anti-Blur Post-Processing)**:
   - Disable heavy multi-pass Bloom in `EffectComposer` (or lower luminance threshold / mipmap blur to zero-halo).
   - Solid, opaque card backgrounds with high-contrast typography (`JetBrains Mono` for code/numbers, `Cairo` for Arabic, `Inter` for UI).

---

## 3. Key Product Decisions & Trade-Offs

| Decision | Chosen Approach | Rationale | Alternatives Considered |
|---|---|---|---|
| **3D Text Rendering** | Procedural 2D HTML5 Canvas Textures on Opaque Quads | Eliminates all wireframe mesh artifacts, garbled glyphs, and font-load dependencies. | Troika 3D Text (prone to shader/font atlas artifacts in WebXR); SVG 3D extrusions (heavy polygon count). |
| **Packet Trajectories** | Bifurcated Side Conduits (`X: ±2.5m` to `±4.0m`) | Prevents threat packets from obscuring educational questions or answer cards while maintaining peripheral urgency. | Center swarm (causes visual clutter and blocks answer targets). |
| **Difficulty Access** | Free Selection via Menu + Sequential Option | Gives educators and players instant flexibility to test any topic while retaining high score leaderboards. | Locked sequential progression only (restricts quick classroom demos). |
| **Bloom Pipeline** | High-Contrast Tone Mapping with Minimalist Subtle Bloom | Eliminates hazy glare and chromatic ghosting that impairs text legibility in VR headsets. | Aggressive HDR Bloom (looks flashy but destroys text readability). |

---

## 4. Technical Architecture & Component Structure

### System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                              App.tsx                                   │
│  - State: difficulty ('easy' | 'medium' | 'hard')                      │
│  - State: questionIndex, score, health, timer                          │
│  - Handlers: handleFireLaser, handleTargetHit, handleHoverTarget       │
└───────────────────┬───────────────────────────────┬────────────────────┘
                    │                               │
        ┌───────────┴──────────┐        ┌───────────┴──────────┐
        │    3D WebXR Canvas   │        │     2D Screen HUD    │
        └───────────┬──────────┘        └───────────┬──────────┘
                    │                               │
  ┌─────────────────┼──────────────────┐            │
  ▼                 ▼                  ▼            ▼
┌──────────────┐ ┌──────────────┐ ┌──────────┐ ┌────────────────┐
│ QuestionCard │ │ SolutionGrid │ │ Packet   │ │ HUDOverlay     │
│ [0, 3.5, -5] │ │ [X, 1.2,-3.5]│ │ Lanes    │ │ - Difficulty   │
│ Canvas-based │ │ Scale on hov │ │ X: ±3.0m │ │ - Intercom     │
└──────────────┘ └──────────────┘ └──────────┘ └────────────────┘
```

### Module Refactoring Plan
1. **`src/types/game.ts`**:
   - Add `DifficultyLevel = 'easy' | 'medium' | 'hard'`.
   - Add `EducationalQuestion` schema:
     ```ts
     export interface EducationalQuestion {
       id: string;
       difficulty: DifficultyLevel;
       category: 'osi' | 'protocols' | 'threats' | 'ports' | 'encryption' | 'hex' | 'subnets';
       promptEn: string;
       promptAr: string;
       options: Array<{
         id: string;
         labelEn: string;
         labelAr: string;
         isCorrect: boolean;
         explanationEn: string;
         explanationAr: string;
       }>;
     }
     ```
2. **`src/game/curriculum.ts`**:
   - Comprehensive bank of curated questions for Easy, Medium, and Hard tiers with English and Arabic translations.
3. **`src/components/EducationalQuestion3D.tsx`**:
   - Renders the Question Banner at `[0, 3.5, -5.0]` using `createTextTexture`.
   - Renders the Solution Target Badges at `Y: 1.25, Z: -3.5`.
   - Smooth hover scaling (+15%), gold border highlight, and haptic feedback.
4. **`src/components/PacketSwarm.tsx`**:
   - Modify packet generation paths to route strictly through side lanes (`X: ±2.5m` to `±4.0m`).
   - Adjust packet speeds based on difficulty (Easy: 0.5x speed, Medium: 1.0x, Hard: 1.5x).
5. **`src/components/StartScreen.tsx` & `src/components/HUDOverlay.tsx`**:
   - Add difficulty level selectors with descriptive badges.
6. **`src/App.tsx`**:
   - Connect shoot-to-solve detection, hover highlighting, sound triggers, and dynamic difficulty timers.
   - Adjust post-processing bloom intensity to keep text razor-sharp.
