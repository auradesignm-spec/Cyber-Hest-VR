/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState, useMemo, useImperativeHandle, forwardRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useXR, useXRInputSourceState } from '@react-three/xr';
import * as THREE from 'three';
import { spatialAudio } from '../audio/SpatialAudio';
import { HUD3D } from './HUD3D';
import { ScenarioId, Language } from '../types/game';

export interface TargetNodeInfo {
  id: string | number;
  position: [number, number, number];
  radius?: number;
}

export interface VRPlayerHandle {
  triggerHeavyRumble: () => void;
}

interface VRPlayerProps {
  onFireLaser: (
    origin: THREE.Vector3,
    direction: THREE.Vector3,
    side: 'left' | 'right' | 'desktop',
    aimOrigin?: THREE.Vector3
  ) => void;
  onGripAction: (hand: 'left' | 'right' | 'desktop') => void;
  health: number;
  timeRemaining: number;
  score: number;
  scenarioId: ScenarioId;
  language?: Language;
  activeTargets?: TargetNodeInfo[];
  onTargetLockChanged?: (targetId: string | number | null) => void;
}

export const VRPlayer = forwardRef<VRPlayerHandle, VRPlayerProps>(
  (
    {
      onFireLaser,
      onGripAction,
      health,
      timeRemaining,
      score,
      scenarioId,
      language = 'en',
      activeTargets = [],
      onTargetLockChanged,
    },
    ref
  ) => {
    const { camera, raycaster, pointer } = useThree();
    const session = useXR((s) => s.session);
    const isInVR = Boolean(session);

    const leftControllerState = useXRInputSourceState('controller', 'left');
    const rightControllerState = useXRInputSourceState('controller', 'right');

    // Desktop gun group refs
    const desktopGunsRef = useRef<THREE.Group>(null);
    const rightGunMuzzleRef = useRef<THREE.Object3D>(null);
    const leftGunMuzzleRef = useRef<THREE.Object3D>(null);

    // Blaster Recoil & Capacitor Charge
    const [rightRecoil, setRightRecoil] = useState(0);
    const [leftRecoil, setLeftRecoil] = useState(0);
    const [chargeLevel, setChargeLevel] = useState(1.0); // 0.0 - 1.0

    // Magnetic Aim Assist State
    const [lockedTargetId, setLockedTargetId] = useState<string | number | null>(null);
    const lockedTargetIdRef = useRef<string | number | null>(null);
    lockedTargetIdRef.current = lockedTargetId;

    // Haptics Trigger Function for Meta Quest 3 Gamepads
    const triggerHaptic = (
      inputSource: XRInputSource | undefined,
      intensity = 0.6,
      durationMs = 50
    ) => {
      try {
        const gamepad = inputSource?.gamepad as unknown as {
          hapticActuators?: Array<{ pulse: (value: number, duration: number) => Promise<boolean> }>;
          vibrationActuator?: {
            playEffect: (
              type: string,
              params: { startDelay: number; duration: number; weakMagnitude: number; strongMagnitude: number }
            ) => Promise<string>;
          };
        };

        if (gamepad?.hapticActuators && gamepad.hapticActuators.length > 0) {
          gamepad.hapticActuators[0].pulse(intensity, durationMs);
        } else if (gamepad?.vibrationActuator?.playEffect) {
          gamepad.vibrationActuator.playEffect('dual-rumble', {
            startDelay: 0,
            duration: durationMs,
            weakMagnitude: intensity,
            strongMagnitude: intensity,
          });
        }
      } catch {
        // Haptics safety fallback
      }
    };

    // Expose heavy rumble to parent on penalty/breach
    useImperativeHandle(ref, () => ({
      triggerHeavyRumble: () => {
        if (session && session.inputSources) {
          session.inputSources.forEach((source) => {
            triggerHaptic(source, 1.0, 400);
          });
        }
      },
    }));

    // Magnetic Aim Assist Computation helper (5 degrees = ~0.087 rad)
    const computeMagneticAim = (origin: THREE.Vector3, rawDirection: THREE.Vector3) => {
      let bestTarget: TargetNodeInfo | null = null;
      let closestAngle = 5.0 * (Math.PI / 180); // 5 degrees max threshold
      const targetVec = new THREE.Vector3();

      activeTargets.forEach((target) => {
        targetVec.set(...target.position).sub(origin).normalize();
        const angle = rawDirection.angleTo(targetVec);
        if (angle < closestAngle) {
          closestAngle = angle;
          bestTarget = target;
        }
      });

      if (bestTarget) {
        targetVec.set(...(bestTarget as TargetNodeInfo).position).sub(origin).normalize();
        // Magnetic snap: blend raw direction towards the locked target
        const snappedDirection = rawDirection.clone().lerp(targetVec, 0.45).normalize();
        return { snappedDirection, targetId: (bestTarget as TargetNodeInfo).id };
      }

      return { snappedDirection: rawDirection, targetId: null };
    };

    // Frame Loop: Aim Assist Check, Recoil Recovery, Capacitor Charge, Blaster Bobbing
    useFrame((_, delta) => {
      // Recoil recovery
      setRightRecoil((prev) => (prev > 0.001 ? THREE.MathUtils.damp(prev, 0, 18, delta) : 0));
      setLeftRecoil((prev) => (prev > 0.001 ? THREE.MathUtils.damp(prev, 0, 18, delta) : 0));

      // Capacitor recharge
      setChargeLevel((prev) => (prev < 1.0 ? Math.min(1.0, prev + delta * 2.5) : 1.0));

      // Determine current aiming direction for magnetic hover feedback
      const origin = new THREE.Vector3();
      const dir = new THREE.Vector3(0, 0, -1);

      if (isInVR && rightControllerState?.object) {
        rightControllerState.object.getWorldPosition(origin);
        rightControllerState.object.getWorldDirection(dir);
        dir.negate();
      } else {
        camera.getWorldPosition(origin);
        raycaster.setFromCamera(pointer, camera);
        dir.copy(raycaster.ray.direction);
      }

      // Check magnetic lock
      const { targetId } = computeMagneticAim(origin, dir);
      if (targetId !== lockedTargetIdRef.current) {
        setLockedTargetId(targetId);
        onTargetLockChanged?.(targetId);

        if (targetId !== null) {
          // Hover lock feedback: Light haptic tick pulse (0.2, 30) + lock chirp
          spatialAudio.playTargetLock();
          if (isInVR) {
            if (rightControllerState?.inputSource) {
              triggerHaptic(rightControllerState.inputSource, 0.2, 30);
            }
            if (leftControllerState?.inputSource) {
              triggerHaptic(leftControllerState.inputSource, 0.2, 30);
            }
          }
        }
      }

      // Desktop blasters smooth aiming interpolation
      if (!isInVR && desktopGunsRef.current) {
        const targetRotX = -pointer.y * 0.35;
        const targetRotY = -pointer.x * 0.55;
        desktopGunsRef.current.rotation.x = THREE.MathUtils.lerp(
          desktopGunsRef.current.rotation.x,
          targetRotX,
          0.18
        );
        desktopGunsRef.current.rotation.y = THREE.MathUtils.lerp(
          desktopGunsRef.current.rotation.y,
          targetRotY,
          0.18
        );
      }
    });

    // VR Session Controller Listeners (Trigger Pull & Squeeze Grip)
    useEffect(() => {
      if (!session) return;

      const handleSelectStart = (event: XRInputSourceEvent) => {
        const handedness = event.inputSource.handedness as 'left' | 'right' | 'none';
        const side = handedness === 'left' ? 'left' : 'right';

        // Sharp recoil pulse (0.8 intensity, 50ms)
        triggerHaptic(event.inputSource, 0.8, 50);

        // Audio, Recoil & Capacitor dip
        spatialAudio.playLaserFire(side);
        setChargeLevel((prev) => Math.max(0.65, prev - 0.2));
        if (side === 'right') setRightRecoil(0.08);
        else setLeftRecoil(0.08);

        const origin = new THREE.Vector3();
        const rawDirection = new THREE.Vector3(0, 0, -1);

        if (handedness === 'right' && rightControllerState?.object) {
          rightControllerState.object.getWorldPosition(origin);
          rightControllerState.object.getWorldDirection(rawDirection);
          rawDirection.negate();
        } else if (handedness === 'left' && leftControllerState?.object) {
          leftControllerState.object.getWorldPosition(origin);
          leftControllerState.object.getWorldDirection(rawDirection);
          rawDirection.negate();
        } else {
          camera.getWorldPosition(origin);
          camera.getWorldDirection(rawDirection);
        }

        // Apply Magnetic Aim Assist
        const { snappedDirection } = computeMagneticAim(origin, rawDirection);
        onFireLaser(origin, snappedDirection, side, origin);
      };

      const handleSqueezeStart = (event: XRInputSourceEvent) => {
        const handedness = event.inputSource.handedness as 'left' | 'right' | 'none';
        triggerHaptic(event.inputSource, 0.35, 40);
        spatialAudio.playButtonBeep(520);
        onGripAction(handedness === 'left' ? 'left' : 'right');
      };

      session.addEventListener('selectstart', handleSelectStart);
      session.addEventListener('squeezestart', handleSqueezeStart);

      return () => {
        session.removeEventListener('selectstart', handleSelectStart);
        session.removeEventListener('squeezestart', handleSqueezeStart);
      };
    }, [session, leftControllerState, rightControllerState, camera, onFireLaser, onGripAction, activeTargets]);

    // Desktop Pointer Down Handlers
    useEffect(() => {
      if (isInVR) return;

      const handlePointerDown = (e: MouseEvent) => {
        if ((e.target as HTMLElement)?.closest('.no-game-shoot')) return;

        const isRightClick = e.button === 2;
        const side = isRightClick ? 'left' : 'right';
        spatialAudio.playLaserFire(side);
        setChargeLevel((prev) => Math.max(0.65, prev - 0.2));
        if (side === 'right') setRightRecoil(0.06);
        else setLeftRecoil(0.06);

        raycaster.setFromCamera(pointer, camera);
        const origin = camera.position.clone();
        const rawDirection = raycaster.ray.direction.clone();

        const muzzlePos =
          side === 'left' && leftGunMuzzleRef.current
            ? leftGunMuzzleRef.current.getWorldPosition(new THREE.Vector3())
            : rightGunMuzzleRef.current
            ? rightGunMuzzleRef.current.getWorldPosition(new THREE.Vector3())
            : origin;

        // Apply Magnetic Aim Assist
        const { snappedDirection } = computeMagneticAim(origin, rawDirection);
        onFireLaser(muzzlePos, snappedDirection, side, origin);
      };

      window.addEventListener('pointerdown', handlePointerDown);
      return () => window.removeEventListener('pointerdown', handlePointerDown);
    }, [isInVR, camera, pointer, raycaster, onFireLaser, activeTargets]);

    return (
      <group name="VRPlayerRig">
        {/* 1. VR Controllers with Cyber Blasters & Diegetic Wrist HUD */}
        {isInVR && rightControllerState?.object && (
          <primitive object={rightControllerState.object}>
            <group position={[0, 0, recoilOffset(rightRecoil)]}>
              <CyberBlasterModel
                color="#00f0ff"
                isRight
                chargeLevel={chargeLevel}
                isLocked={lockedTargetId !== null}
              />
            </group>
          </primitive>
        )}

        {isInVR && leftControllerState?.object && (
          <primitive object={leftControllerState.object}>
            <group position={[0, 0, recoilOffset(leftRecoil)]}>
              <CyberBlasterModel
                color="#ec4899"
                isRight={false}
                chargeLevel={chargeLevel}
                isLocked={lockedTargetId !== null}
              />
            </group>
            {/* 3D Holographic Wristband HUD attached to off-hand controller in VR */}
            <HUD3D
              health={health}
              timeRemaining={timeRemaining}
              score={score}
              scenarioId={scenarioId}
              isInVR={true}
              language={language}
            />
          </primitive>
        )}

        {/* 2. Desktop First-Person Cyber Blasters */}
        {!isInVR && (
          <>
            <group ref={desktopGunsRef} position={[0, 0.95, -0.1]}>
              {/* Right Gun */}
              <group
                position={[0.48, -0.16, -0.48 + rightRecoil]}
                rotation={[-0.04, -0.06, 0]}
              >
                <CyberBlasterModel
                  color="#00f0ff"
                  isRight
                  chargeLevel={chargeLevel}
                  isLocked={lockedTargetId !== null}
                />
                <object3D ref={rightGunMuzzleRef} position={[0, 0.04, -0.35]} />
              </group>

              {/* Left Gun */}
              <group
                position={[-0.48, -0.16, -0.48 + leftRecoil]}
                rotation={[-0.04, 0.06, 0]}
              >
                <CyberBlasterModel
                  color="#ec4899"
                  isRight={false}
                  chargeLevel={chargeLevel}
                  isLocked={lockedTargetId !== null}
                />
                <object3D ref={leftGunMuzzleRef} position={[0, 0.04, -0.35]} />
              </group>
            </group>

            {/* Diegetic 3D Wrist HUD in desktop viewport */}
            <HUD3D
              health={health}
              timeRemaining={timeRemaining}
              score={score}
              scenarioId={scenarioId}
              isInVR={false}
              language={language}
            />
          </>
        )}
      </group>
    );
  }
);

function recoilOffset(recoil: number) {
  return recoil * 0.8;
}

/**
 * Procedural 3D OLED Display Texture for Blaster Top Surface
 */
function useBlasterOLEDTexture(chargeLevel: number, isLocked: boolean, color: string) {
  return useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // OLED Pitch Black Glass
      ctx.fillStyle = '#020611';
      ctx.fillRect(0, 0, 256, 128);

      // Neon outer frame
      ctx.strokeStyle = color;
      ctx.lineWidth = 4;
      ctx.strokeRect(4, 4, 248, 120);

      // Status Bar
      ctx.fillStyle = isLocked ? '#10b981' : color;
      ctx.font = 'bold 22px "JetBrains Mono", monospace';
      ctx.fillText(isLocked ? '[ LOCK-ON ]' : '[ ARMED ]', 16, 32);

      // Voltage readouts
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 16px "JetBrains Mono", monospace';
      ctx.fillText('240V // COOLDOWN', 16, 56);

      // Capacitor Bar Track
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(16, 72, 224, 22);

      // Segmented Energy Fill
      const pct = Math.max(0, Math.min(1, chargeLevel));
      ctx.fillStyle = pct > 0.6 ? (isLocked ? '#10b981' : color) : '#f59e0b';
      ctx.fillRect(16, 72, 224 * pct, 22);

      // Battery Segments Divider
      ctx.strokeStyle = '#020611';
      ctx.lineWidth = 3;
      for (let x = 16 + 22.4; x < 240; x += 22.4) {
        ctx.beginPath();
        ctx.moveTo(x, 72);
        ctx.lineTo(x, 94);
        ctx.stroke();
      }

      // Energy text percentage
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px "JetBrains Mono", monospace';
      ctx.fillText(`${Math.round(pct * 100)}%`, 180, 116);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
  }, [chargeLevel, isLocked, color]);
}

/**
 * AAA-Grade Procedural Cyber Blaster Model with Integrated 3D OLED Display & Energy Rails
 */
const CyberBlasterModel: React.FC<{
  color: string;
  isRight: boolean;
  chargeLevel?: number;
  isLocked?: boolean;
}> = ({ color, isRight, chargeLevel = 1.0, isLocked = false }) => {
  const oledTexture = useBlasterOLEDTexture(chargeLevel, isLocked, color);

  return (
    <group scale={[0.85, 0.85, 0.85]}>
      {/* 1. Main Matte Carbon/Steel Receiver */}
      <mesh position={[0, 0, -0.08]} castShadow receiveShadow>
        <boxGeometry args={[0.065, 0.095, 0.24]} />
        <meshStandardMaterial color="#0b1120" metalness={0.92} roughness={0.2} />
      </mesh>

      {/* 2. Top Superconducting Energy Rail */}
      <mesh position={[0, 0.058, -0.1]}>
        <boxGeometry args={[0.045, 0.026, 0.28]} />
        <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.25} />
      </mesh>
      {/* Neon Energy Trench */}
      <mesh position={[0, 0.072, -0.1]}>
        <boxGeometry args={[0.02, 0.005, 0.26]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>

      {/* 3. Integrated 3D OLED Ammo/Capacitor Display Surface */}
      <group position={[0, 0.076, -0.05]}>
        <mesh rotation={[-Math.PI / 10, 0, 0]}>
          <boxGeometry args={[0.042, 0.006, 0.075]} />
          <meshStandardMaterial color="#020617" metalness={0.95} roughness={0.1} />
        </mesh>
        <mesh position={[0, 0.004, 0]} rotation={[-Math.PI / 10, 0, 0]}>
          <planeGeometry args={[0.038, 0.068]} />
          <meshBasicMaterial map={oledTexture} toneMapped={false} />
        </mesh>
      </group>

      {/* 4. Heat Sink Cooling Fins along Barrel */}
      {[-0.04, -0.08, -0.12].map((zOffset, finIdx) => (
        <mesh key={`fin-${finIdx}`} position={[0, 0.02, zOffset]}>
          <boxGeometry args={[0.075, 0.06, 0.015]} />
          <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.3} />
        </mesh>
      ))}

      {/* 5. Dual Muzzle Emitters */}
      <mesh position={[0, 0.02, -0.25]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.018, 0.02, 0.14, 16]} />
        <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Muzzle Glow Corona */}
      <mesh position={[0, 0.02, -0.32]}>
        <ringGeometry args={[0.01, 0.024, 16]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>

      {/* 6. Ergonomic Tactical Pistol Grip */}
      <mesh position={[0, -0.085, 0.02]} rotation={[Math.PI / 5.2, 0, 0]}>
        <boxGeometry args={[0.05, 0.15, 0.065]} />
        <meshStandardMaterial color="#020617" roughness={0.6} metalness={0.4} />
      </mesh>

      {/* 7. Glowing Rechargeable Power Core Cell */}
      <mesh position={[isRight ? 0.038 : -0.038, -0.01, -0.06]}>
        <cylinderGeometry args={[0.02, 0.02, 0.11, 12]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1.4}
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>
    </group>
  );
};
