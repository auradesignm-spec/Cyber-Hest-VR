/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useImperativeHandle, forwardRef, useMemo } from 'react';
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
  triggerImpactHaptic?: (side?: 'left' | 'right' | 'desktop') => void;
  getMuzzlePositions: () => [THREE.Vector3, THREE.Vector3];
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
  combo?: number;
  multiplier?: number;
  isFeverMode?: boolean;
}

// Module-level pre-allocated math objects (Zero allocations during gameplay)
const _origin = new THREE.Vector3();
const _dir = new THREE.Vector3(0, 0, -1);
const _rawDirection = new THREE.Vector3(0, 0, -1);
const _targetVec = new THREE.Vector3();
const _normDir = new THREE.Vector3();
const _snappedDir = new THREE.Vector3();
const _m1 = new THREE.Vector3();
const _m2 = new THREE.Vector3();
const _muzzleWorldPos = new THREE.Vector3();

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
      combo = 0,
      multiplier = 1,
      isFeverMode = false,
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
    const rightGunGroupRef = useRef<THREE.Group>(null);
    const leftGunGroupRef = useRef<THREE.Group>(null);
    const rightGunMuzzleRef = useRef<THREE.Object3D>(null);
    const leftGunMuzzleRef = useRef<THREE.Object3D>(null);

    // Blaster Recoil & Capacitor Charge (Zero React state in useFrame)
    const rightRecoilRef = useRef(0);
    const leftRecoilRef = useRef(0);
    const chargeLevelRef = useRef(1.0);
    const lockedTargetIdRef = useRef<string | number | null>(null);

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
        // Haptics fallback safety
      }
    };

    // Expose heavy rumble, light impact haptic and muzzles
    useImperativeHandle(ref, () => ({
      triggerHeavyRumble: () => {
        if (session && session.inputSources) {
          session.inputSources.forEach((source) => {
            triggerHaptic(source, 1.0, 400);
          });
        }
      },
      // Short, subtle hit-confirmation haptic (localized, VR-safe: no strong shake)
      triggerImpactHaptic: (side: 'left' | 'right' | 'desktop' = 'right') => {
        if (isInVR && session && session.inputSources) {
          session.inputSources.forEach((source) => {
            const handed = (source as { handedness?: string })?.handedness;
            // Fire on the matching hand only; desktop is handled by audio
            if (side === 'desktop' || !handed || handed === side) {
              triggerHaptic(source, 0.45, 45);
            }
          });
        }
      },
      getMuzzlePositions: () => {
        if (isInVR) {
          if (rightControllerState?.object) rightControllerState.object.getWorldPosition(_m1);
          if (leftControllerState?.object) leftControllerState.object.getWorldPosition(_m2);
        } else {
          if (rightGunMuzzleRef.current) rightGunMuzzleRef.current.getWorldPosition(_m1);
          if (leftGunMuzzleRef.current) leftGunMuzzleRef.current.getWorldPosition(_m2);
        }
        return [_m1, _m2];
      },
    }));

    // Zero-allocation Magnetic Aim Assist Computation
    const computeMagneticAim = (originVec: THREE.Vector3, rawDir: THREE.Vector3): { snappedDir: THREE.Vector3; targetId: string | number | null } => {
      let bestTarget: TargetNodeInfo | null = null;
      let closestAngle = 0.32; // ~18 degrees max threshold

      for (let i = 0; i < activeTargets.length; i++) {
        const target = activeTargets[i];
        _targetVec.set(target.position[0], target.position[1], target.position[2]).sub(originVec);
        const dist = _targetVec.length();
        _normDir.copy(_targetVec).normalize();
        const angle = rawDir.angleTo(_normDir);

        const targetRadius = target.radius || 0.75;
        const maxAngle = Math.max(0.14, Math.atan2(targetRadius, Math.max(1.0, dist)));

        if (angle < maxAngle && angle < closestAngle) {
          closestAngle = angle;
          bestTarget = target;
        }
      }

      if (bestTarget) {
        _targetVec.set(bestTarget.position[0], bestTarget.position[1], bestTarget.position[2]).sub(originVec).normalize();
        _snappedDir.copy(rawDir).lerp(_targetVec, 0.65).normalize();
        return { snappedDir: _snappedDir, targetId: bestTarget.id };
      }

      _snappedDir.copy(rawDir);
      return { snappedDir: _snappedDir, targetId: null };
    };

    // Frame Loop: Aim Assist Check, Recoil Recovery, Capacitor Charge, Blaster Bobbing
    // STRICT ZERO REACT STATE UPDATES INSIDE useFrame
    useFrame((_, delta) => {
      // 1. Recoil recovery directly on meshes
      if (rightRecoilRef.current > 0.0005) {
        rightRecoilRef.current = THREE.MathUtils.damp(rightRecoilRef.current, 0, 18, delta);
      } else {
        rightRecoilRef.current = 0;
      }

      if (leftRecoilRef.current > 0.0005) {
        leftRecoilRef.current = THREE.MathUtils.damp(leftRecoilRef.current, 0, 18, delta);
      } else {
        leftRecoilRef.current = 0;
      }

      if (rightGunGroupRef.current) {
        rightGunGroupRef.current.position.z = -0.48 + rightRecoilRef.current;
      }
      if (leftGunGroupRef.current) {
        leftGunGroupRef.current.position.z = -0.48 + leftRecoilRef.current;
      }

      // 2. Capacitor recharge in ref
      if (chargeLevelRef.current < 1.0) {
        chargeLevelRef.current = Math.min(1.0, chargeLevelRef.current + delta * 2.5);
      }

      // 3. Current aiming direction for hover feedback
      if (isInVR && rightControllerState?.object) {
        rightControllerState.object.getWorldPosition(_origin);
        rightControllerState.object.getWorldDirection(_dir);
        _dir.negate();
      } else {
        camera.getWorldPosition(_origin);
        raycaster.setFromCamera(pointer, camera);
        _dir.copy(raycaster.ray.direction);
      }

      // Check magnetic lock
      const { targetId } = computeMagneticAim(_origin, _dir);
      if (targetId !== lockedTargetIdRef.current) {
        lockedTargetIdRef.current = targetId;
        onTargetLockChanged?.(targetId);

        if (targetId !== null) {
          spatialAudio.playTargetLock();
          if (isInVR) {
            if (rightControllerState?.inputSource) {
              triggerHaptic(rightControllerState.inputSource, 0.25, 25);
            }
            if (leftControllerState?.inputSource) {
              triggerHaptic(leftControllerState.inputSource, 0.25, 25);
            }
          }
        }
      }

      // 4. Desktop blasters smooth aiming interpolation
      if (!isInVR && desktopGunsRef.current) {
        desktopGunsRef.current.position.x = camera.position.x;
        desktopGunsRef.current.position.y = camera.position.y - 0.65;
        desktopGunsRef.current.position.z = camera.position.z - 0.5;

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

        triggerHaptic(event.inputSource, 0.8, 50);
        spatialAudio.playLaserFire(side);

        chargeLevelRef.current = Math.max(0.65, chargeLevelRef.current - 0.2);
        if (side === 'right') rightRecoilRef.current = 0.08;
        else leftRecoilRef.current = 0.08;

        _origin.set(0, 0, 0);
        _rawDirection.set(0, 0, -1);

        if (handedness === 'right' && rightControllerState?.object) {
          rightControllerState.object.getWorldPosition(_origin);
          rightControllerState.object.getWorldDirection(_rawDirection);
          _rawDirection.negate();
        } else if (handedness === 'left' && leftControllerState?.object) {
          leftControllerState.object.getWorldPosition(_origin);
          leftControllerState.object.getWorldDirection(_rawDirection);
          _rawDirection.negate();
        } else {
          camera.getWorldPosition(_origin);
          camera.getWorldDirection(_rawDirection);
        }

        const { snappedDir } = computeMagneticAim(_origin, _rawDirection);
        onFireLaser(_origin, snappedDir, side, _origin);
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

        chargeLevelRef.current = Math.max(0.65, chargeLevelRef.current - 0.2);
        if (side === 'right') rightRecoilRef.current = 0.06;
        else leftRecoilRef.current = 0.06;

        raycaster.setFromCamera(pointer, camera);
        _origin.copy(camera.position);
        _rawDirection.copy(raycaster.ray.direction);

        if (side === 'left' && leftGunMuzzleRef.current) {
          leftGunMuzzleRef.current.getWorldPosition(_muzzleWorldPos);
        } else if (rightGunMuzzleRef.current) {
          rightGunMuzzleRef.current.getWorldPosition(_muzzleWorldPos);
        } else {
          _muzzleWorldPos.copy(_origin);
        }

        const { snappedDir } = computeMagneticAim(_origin, _rawDirection);
        onFireLaser(_muzzleWorldPos, snappedDir, side, _origin);
      };

      window.addEventListener('pointerdown', handlePointerDown);
      return () => window.removeEventListener('pointerdown', handlePointerDown);
    }, [isInVR, camera, pointer, raycaster, onFireLaser, activeTargets]);

    return (
      <group name="VRPlayerRig">
        {/* 1. VR Controllers with Cyber Blasters & Diegetic Wrist HUD */}
        {isInVR && rightControllerState?.object && (
          <primitive object={rightControllerState.object}>
            <CyberBlasterModel
              color="#00f0ff"
              isRight
              isLocked={lockedTargetIdRef.current !== null}
              combo={combo}
              multiplier={multiplier}
              isFeverMode={isFeverMode}
            />
          </primitive>
        )}

        {isInVR && leftControllerState?.object && (
          <primitive object={leftControllerState.object}>
            <CyberBlasterModel
              color="#ec4899"
              isRight={false}
              isLocked={lockedTargetIdRef.current !== null}
              combo={combo}
              multiplier={multiplier}
              isFeverMode={isFeverMode}
            />
            {/* 3D Holographic Wristband HUD attached to off-hand controller in VR */}
            <HUD3D
              health={health}
              timeRemaining={timeRemaining}
              score={score}
              scenarioId={scenarioId}
              isInVR={true}
              language={language}
              combo={combo}
              multiplier={multiplier}
              isFeverMode={isFeverMode}
            />
          </primitive>
        )}

        {/* 2. Desktop First-Person Cyber Blasters */}
        {!isInVR && (
          <>
            <group ref={desktopGunsRef} position={[0, 0.95, -0.1]}>
              {/* Right Gun */}
              <group
                ref={rightGunGroupRef}
                position={[0.48, -0.16, -0.48]}
                rotation={[-0.04, -0.06, 0]}
              >
                <CyberBlasterModel
                  color="#00f0ff"
                  isRight
                  isLocked={lockedTargetIdRef.current !== null}
                  combo={combo}
                  multiplier={multiplier}
                  isFeverMode={isFeverMode}
                />
                <object3D ref={rightGunMuzzleRef} position={[0, 0.04, -0.35]} />
              </group>

              {/* Left Gun */}
              <group
                ref={leftGunGroupRef}
                position={[-0.48, -0.16, -0.48]}
                rotation={[-0.04, 0.06, 0]}
              >
                <CyberBlasterModel
                  color="#ec4899"
                  isRight={false}
                  isLocked={lockedTargetIdRef.current !== null}
                  combo={combo}
                  multiplier={multiplier}
                  isFeverMode={isFeverMode}
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
              combo={combo}
              multiplier={multiplier}
              isFeverMode={isFeverMode}
            />
          </>
        )}
      </group>
    );
  }
);

/**
 * High-Performance Static Procedural Texture for Blaster Display
 */
function useStaticBlasterTexture(color: string, isRight: boolean) {
  return useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // 1. Strict pitch black background
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, 256, 128);

      // 2. Glowing cyan border
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 4;
      ctx.strokeRect(4, 4, 248, 120);

      // 3. Crisp white bold text
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 22px "JetBrains Mono", monospace';
      ctx.fillText(isRight ? '[ PRIMARY // CYBER ]' : '[ OFF-HAND // ION ]', 16, 36);

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 16px "JetBrains Mono", monospace';
      ctx.fillText('OUTPUT: 240V // READY', 16, 68);

      ctx.fillStyle = '#00f0ff';
      ctx.fillRect(16, 84, 224, 20);

      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      for (let x = 16 + 28; x < 240; x += 28) {
        ctx.beginPath();
        ctx.moveTo(x, 84);
        ctx.lineTo(x, 104);
        ctx.stroke();
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, [color, isRight]);
}

/**
 * AAA-Grade Procedural Cyber Blaster Model with Cheap Materials for 90 FPS
 */
const CyberBlasterModel: React.FC<{
  color: string;
  isRight: boolean;
  isLocked?: boolean;
  combo?: number;
  multiplier?: number;
  isFeverMode?: boolean;
}> = ({ color, isRight, isFeverMode = false }) => {
  const blasterTexture = useStaticBlasterTexture(color, isRight);
  const activeColor = isFeverMode ? '#f59e0b' : color;

  return (
    <group scale={[0.85, 0.85, 0.85]}>
      {/* 1. Main Matte Carbon/Steel Receiver */}
      <mesh position={[0, 0, -0.08]}>
        <boxGeometry args={[0.065, 0.095, 0.24]} />
        <meshBasicMaterial color="#0b1120" />
      </mesh>

      {/* 2. Top Superconducting Energy Rail */}
      <mesh position={[0, 0.058, -0.1]}>
        <boxGeometry args={[0.045, 0.026, 0.28]} />
        <meshBasicMaterial color="#1e293b" />
      </mesh>
      {/* Neon Energy Trench */}
      <mesh position={[0, 0.072, -0.1]}>
        <boxGeometry args={[0.02, 0.005, 0.26]} />
        <meshBasicMaterial color={activeColor} />
      </mesh>

      {/* 3. Integrated 3D OLED Ammo/Capacitor Display Surface */}
      <group position={[0, 0.076, -0.05]}>
        <mesh rotation={[-Math.PI / 10, 0, 0]}>
          <boxGeometry args={[0.042, 0.006, 0.075]} />
          <meshBasicMaterial color="#020617" />
        </mesh>
        <mesh position={[0, 0.004, 0]} rotation={[-Math.PI / 10, 0, 0]}>
          <planeGeometry args={[0.038, 0.068]} />
          <meshBasicMaterial map={blasterTexture} />
        </mesh>
      </group>

      {/* 4. Heat Sink Cooling Fins along Barrel */}
      {[-0.04, -0.08, -0.12].map((zOffset, finIdx) => (
        <mesh key={`fin-${finIdx}`} position={[0, 0.02, zOffset]}>
          <boxGeometry args={[0.075, 0.06, 0.015]} />
          <meshBasicMaterial color="#334155" />
        </mesh>
      ))}

      {/* 5. Dual Muzzle Emitters */}
      <mesh position={[0, 0.02, -0.25]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.018, 0.02, 0.14, 12]} />
        <meshBasicMaterial color="#1e293b" />
      </mesh>
      {/* Muzzle Glow Corona */}
      <mesh position={[0, 0.02, -0.32]}>
        <ringGeometry args={[0.01, 0.024, 12]} />
        <meshBasicMaterial color={activeColor} />
      </mesh>

      {/* 6. Ergonomic Tactical Pistol Grip */}
      <mesh position={[0, -0.085, 0.02]} rotation={[Math.PI / 5.2, 0, 0]}>
        <boxGeometry args={[0.05, 0.15, 0.065]} />
        <meshBasicMaterial color="#020617" />
      </mesh>

      {/* 7. Glowing Rechargeable Power Core Cell */}
      <mesh position={[isRight ? 0.038 : -0.038, -0.01, -0.06]}>
        <cylinderGeometry args={[0.02, 0.02, 0.11, 10]} />
        <meshBasicMaterial color={activeColor} />
      </mesh>
    </group>
  );
};
