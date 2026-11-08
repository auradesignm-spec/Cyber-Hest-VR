/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

/* ------------------------------------------------------------------------- *
 * Procedural PBR asset generation (no Blender, no external texture files).
 * Every map below is painted into an offscreen canvas at runtime and uploaded
 * as a CanvasTexture, so the deployable bundle stays asset-free.
 * ------------------------------------------------------------------------- */

const paintCanvas = (
  size: number,
  paint: (ctx: CanvasRenderingContext2D, size: number) => void
): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) paint(ctx, size);
  return canvas;
};

/** Brushed / machined metal micro-surface: used as bump + roughness modulation. */
const createBrushTexture = (): THREE.CanvasTexture => {
  const canvas = paintCanvas(256, (ctx, size) => {
    ctx.fillStyle = '#8a8a8a';
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 1400; i += 1) {
      const y = Math.random() * size;
      const shade = Math.round(96 + Math.random() * 58);
      ctx.strokeStyle = `rgba(${shade}, ${shade}, ${shade}, 0.4)`;
      ctx.lineWidth = Math.random() < 0.75 ? 1 : 2;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(size, y + (Math.random() - 0.5) * 1.6);
      ctx.stroke();
    }
  });
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 4);
  texture.anisotropy = 4;
  return texture;
};

/** Panel joints + surface grain: floor plating and rack plinths. */
const createPanelTexture = (): THREE.CanvasTexture => {
  const canvas = paintCanvas(256, (ctx, size) => {
    ctx.fillStyle = '#7d7d7d';
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 2600; i += 1) {
      const grain = Math.round(96 + Math.random() * 52);
      ctx.fillStyle = `rgba(${grain}, ${grain}, ${grain}, 0.25)`;
      ctx.fillRect(Math.random() * size, Math.random() * size, 2, 2);
    }
    ctx.strokeStyle = 'rgba(24, 24, 24, 0.95)';
    ctx.lineWidth = 3;
    ctx.strokeRect(1.5, 1.5, size - 3, size - 3);
    ctx.strokeStyle = 'rgba(64, 64, 64, 0.5)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i += 1) {
      const p = (size / 4) * i;
      ctx.beginPath();
      ctx.moveTo(p, 0);
      ctx.lineTo(p, size);
      ctx.moveTo(0, p);
      ctx.lineTo(size, p);
      ctx.stroke();
    }
  });
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(10, 12);
  texture.anisotropy = 4;
  return texture;
};

/** Hex perforation mask for blade intake grilles (alpha-tested cutout). */
const createPerforationTexture = (): THREE.CanvasTexture => {
  const canvas = paintCanvas(128, (ctx, size) => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#000000';
    const step = 10;
    for (let row = 0; row * step < size + step; row += 1) {
      const y = row * step + step / 2;
      const offset = row % 2 === 0 ? 0 : step / 2;
      for (let x = offset + step / 2; x < size; x += step) {
        ctx.beginPath();
        ctx.arc(x, y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  });
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(6, 1);
  return texture;
};

/** Industrial hazard striping for rack plinths. */
const createHazardTexture = (): THREE.CanvasTexture => {
  const canvas = paintCanvas(128, (ctx, size) => {
    ctx.fillStyle = '#0b1120';
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 13;
    for (let i = -size; i < size * 2; i += 30) {
      ctx.beginPath();
      ctx.moveTo(i, size);
      ctx.lineTo(i + size, 0);
      ctx.stroke();
    }
  });
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 1);
  return texture;
};

/**
 * A tiny emissive "studio room" used as the source for image-based lighting.
 * PMREMGenerator bakes it into a prefiltered env map: metal racks then pick up
 * believable cyan/cool/warm reflections instead of reading as flat plastic.
 */
const buildStudioEnvironment = (): THREE.Scene => {
  const envScene = new THREE.Scene();
  const shell = new THREE.Mesh(
    new THREE.BoxGeometry(12, 8, 12),
    new THREE.MeshBasicMaterial({ color: 0x04070e, side: THREE.BackSide })
  );
  envScene.add(shell);

  const addPanel = (
    color: number,
    intensity: number,
    size: [number, number],
    position: [number, number, number],
    rotation: [number, number, number]
  ) => {
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color).multiplyScalar(intensity),
    });
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(size[0], size[1]), material);
    panel.position.set(position[0], position[1], position[2]);
    panel.rotation.set(rotation[0], rotation[1], rotation[2]);
    envScene.add(panel);
  };

  // Cool overhead key strip
  addPanel(0xdff3ff, 3.2, [6, 1.4], [0, 3.9, 0], [Math.PI / 2, 0, 0]);
  // Cyan aisle bounce from both server rows
  addPanel(0x00f0ff, 1.5, [1.2, 4.0], [-5.9, 1.2, 0], [0, Math.PI / 2, 0]);
  addPanel(0x00f0ff, 1.5, [1.2, 4.0], [5.9, 1.2, 0], [0, -Math.PI / 2, 0]);
  // Warm floor bounce (kept subtle so the palette stays cyan/black)
  addPanel(0xffb066, 0.32, [8, 8], [0, -3.9, 0], [-Math.PI / 2, 0, 0]);
  // Red core glow at the far end of the room
  addPanel(0xff3355, 0.85, [2.4, 1.2], [0, 1.2, -5.9], [0, 0, 0]);

  return envScene;
};

interface ServerRoomProps {
  isEmergency?: boolean;
  isFeverMode?: boolean;
}

export const ServerRoom: React.FC<ServerRoomProps> = ({ isEmergency = false, isFeverMode = false }) => {
  const fansGroupRef = useRef<THREE.Group>(null);
  const fiberPulsesRef = useRef<THREE.Group>(null);
  const ceilingGridRef = useRef<THREE.Group>(null);
  const ledsMeshRef = useRef<THREE.InstancedMesh>(null);
  const strobe1Ref = useRef<THREE.Group>(null);
  const strobe2Ref = useRef<THREE.Group>(null);

  // Dynamic emergency lighting refs for randomized power grid fluctuations
  const ambientLightRef = useRef<THREE.AmbientLight>(null);
  const dirLightRef = useRef<THREE.DirectionalLight>(null);
  const centerPointLightRef = useRef<THREE.PointLight>(null);
  const leftPointLightRef = useRef<THREE.PointLight>(null);
  const rightPointLightRef = useRef<THREE.PointLight>(null);
  const rearAlertLightRef = useRef<THREE.PointLight>(null);

  // Strobe point lights and volumetric beam materials
  const strobe1LightRef = useRef<THREE.PointLight>(null);
  const strobe2LightRef = useRef<THREE.PointLight>(null);
  const strobe1BeamMat1Ref = useRef<THREE.MeshBasicMaterial>(null);
  const strobe1BeamMat2Ref = useRef<THREE.MeshBasicMaterial>(null);
  const strobe2BeamMat1Ref = useRef<THREE.MeshBasicMaterial>(null);
  const strobe2BeamMat2Ref = useRef<THREE.MeshBasicMaterial>(null);

  // Persistent voltage surge & brownout drop state (zero GC allocations during useFrame)
  const powerGridState = useRef({
    brownoutTimer: 1.8,
    brownoutDepth: 0,
  });

  // Server rack positions flanking the central aisle
  const rackPositions: [number, number, number][] = useMemo(
    () => [
      [-3.2, 1.6, -4.5],
      [-3.2, 1.6, -3.0],
      [-3.2, 1.6, -1.5],
      [-3.2, 1.6, 0.0],
      [-3.2, 1.6, 1.5],
      [-3.2, 1.6, 3.0],
      [3.2, 1.6, -4.5],
      [3.2, 1.6, -3.0],
      [3.2, 1.6, -1.5],
      [3.2, 1.6, 0.0],
      [3.2, 1.6, 1.5],
      [3.2, 1.6, 3.0],
      [-1.8, 1.6, 4.5],
      [0.0, 1.6, 4.5],
      [1.8, 1.6, 4.5],
    ],
    []
  );

  // Instanced LEDs matrix & colors (15 racks * 7 blades * 2 LEDs = 210 LEDs)
  const TOTAL_LEDS = rackPositions.length * 7 * 2;
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tempLedColor = useMemo(() => new THREE.Color(), []);
  const ledGeo = useMemo(() => new THREE.BoxGeometry(0.035, 0.035, 0.02), []);
  const ledMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#00f0ff',
        toneMapped: false,
      }),
    []
  );

  // ------------------------------------------------------------------
  // Procedural textures shared by every metal / composite surface.
  // ------------------------------------------------------------------
  const roomTextures = useMemo(
    () => ({
      brush: createBrushTexture(),
      panel: createPanelTexture(),
      perforation: createPerforationTexture(),
      hazard: createHazardTexture(),
    }),
    []
  );

  useEffect(
    () => () => {
      roomTextures.brush.dispose();
      roomTextures.panel.dispose();
      roomTextures.perforation.dispose();
      roomTextures.hazard.dispose();
    },
    [roomTextures]
  );

  // ------------------------------------------------------------------
  // Image-based lighting baked once from a procedural studio room.
  // ------------------------------------------------------------------
  const { gl, scene } = useThree();

  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const envScene = buildStudioEnvironment();
    const target = pmrem.fromScene(envScene, 0.04);

    scene.environment = target.texture;
    scene.environmentIntensity = 0.55;

    envScene.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.geometry.dispose();
      const material = mesh.material as THREE.Material | THREE.Material[];
      if (Array.isArray(material)) material.forEach((entry) => entry.dispose());
      else material.dispose();
    });
    pmrem.dispose();

    return () => {
      scene.environment = null;
      target.dispose();
    };
  }, [gl, scene]);

  useEffect(() => {
    scene.environmentIntensity = isEmergency ? 0.3 : isFeverMode ? 0.9 : 0.55;
  }, [scene, isEmergency, isFeverMode]);

  // ------------------------------------------------------------------
  // Full rack assembly, overhead cable trays, wall conduits and fiber
  // bundles. Everything is instanced so ~450 parts cost ~16 draw calls,
  // which keeps the Quest 3 frame budget intact.
  // ------------------------------------------------------------------
  const { rackGroup, rackDisposables } = useMemo(() => {
    const group = new THREE.Group();
    group.name = 'RackAssembly';

    const disposables: { dispose: () => void }[] = [];
    const trackGeo = (geometry: THREE.BufferGeometry) => {
      disposables.push(geometry);
      return geometry;
    };
    const trackMat = (material: THREE.Material) => {
      disposables.push(material);
      return material;
    };

    const steelMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: '#0a101f',
        metalness: 0.92,
        roughness: 0.55,
        roughnessMap: roomTextures.brush,
        bumpMap: roomTextures.brush,
        bumpScale: 0.02,
        envMapIntensity: 1.1,
      })
    );
    const railMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: '#16233a',
        metalness: 0.95,
        roughness: 0.3,
        envMapIntensity: 1.35,
      })
    );
    const doorMat = trackMat(
      new THREE.MeshPhysicalMaterial({
        color: '#03060f',
        metalness: 0.2,
        roughness: 0.06,
        clearcoat: 1,
        clearcoatRoughness: 0.06,
        transparent: true,
        opacity: 0.62,
        envMapIntensity: 1.8,
      })
    );
    const bladeMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: '#1b2437',
        metalness: 0.82,
        roughness: 0.46,
        roughnessMap: roomTextures.brush,
        bumpMap: roomTextures.brush,
        bumpScale: 0.012,
        envMapIntensity: 0.85,
      })
    );
    const ventMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: '#04070f',
        metalness: 0.55,
        roughness: 0.72,
        alphaMap: roomTextures.perforation,
        alphaTest: 0.5,
        side: THREE.DoubleSide,
      })
    );
    const plinthMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: '#060c18',
        metalness: 0.88,
        roughness: 0.5,
        bumpMap: roomTextures.panel,
        bumpScale: 0.012,
      })
    );
    const hazardMat = trackMat(
      new THREE.MeshBasicMaterial({
        map: roomTextures.hazard,
        transparent: true,
        toneMapped: false,
      })
    );
    const cableMat = trackMat(
      new THREE.MeshStandardMaterial({ color: '#0b1220', metalness: 0.35, roughness: 0.72 })
    );

    type Placement = {
      rack: [number, number, number];
      rotY: number;
      localPos: [number, number, number];
      localRot?: [number, number, number];
    };

    const chassis: Placement[] = [];
    const doors: Placement[] = [];
    const blades: Placement[] = [];
    const vents: Placement[] = [];
    const plinths: Placement[] = [];
    const rails: Placement[] = [];
    const handles: Placement[] = [];
    const tops: Placement[] = [];
    const hazards: Placement[] = [];
    const bladeOffsets = [-1.1, -0.7, -0.3, 0.1, 0.5, 0.9, 1.2];

    rackPositions.forEach((pos) => {
      const isLeft = pos[0] < 0;
      const rotY = pos[2] > 4 ? Math.PI : isLeft ? Math.PI / 2 : -Math.PI / 2;
      const push = (list: Placement[], localPos: [number, number, number]) =>
        list.push({ rack: pos, rotY, localPos });

      push(chassis, [0, 0, 0]);
      push(doors, [0, 0, 0.5]);
      push(plinths, [0, -1.66, 0]);
      push(tops, [0, 1.63, 0]);
      push(handles, [0.34, 0.1, 0.545]);
      push(hazards, [0, -1.585, 0.53]);
      ([
        [-0.44, -0.48],
        [0.44, -0.48],
        [-0.44, 0.48],
        [0.44, 0.48],
      ] as [number, number][]).forEach(([x, z]) => push(rails, [x, 0, z]));
      bladeOffsets.forEach((y) => {
        push(blades, [0, y, 0.46]);
        push(vents, [0, y, 0.881]);
      });
    });

    const dummy = new THREE.Object3D();
    const baseMatrix = new THREE.Matrix4();
    const localMatrix = new THREE.Matrix4();
    const worldMatrix = new THREE.Matrix4();

    const buildInstanced = (
      geometry: THREE.BufferGeometry,
      material: THREE.Material,
      placements: Placement[],
      castShadow = true
    ) => {
      const mesh = new THREE.InstancedMesh(geometry, material, placements.length);
      mesh.castShadow = castShadow;
      mesh.receiveShadow = true;
      mesh.frustumCulled = false;
      placements.forEach((placement, index) => {
        dummy.position.set(placement.rack[0], placement.rack[1], placement.rack[2]);
        dummy.rotation.set(0, placement.rotY, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        baseMatrix.copy(dummy.matrix);

        dummy.position.set(placement.localPos[0], placement.localPos[1], placement.localPos[2]);
        const rot = placement.localRot;
        dummy.rotation.set(rot ? rot[0] : 0, rot ? rot[1] : 0, rot ? rot[2] : 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        localMatrix.copy(dummy.matrix);

        worldMatrix.multiplyMatrices(baseMatrix, localMatrix);
        mesh.setMatrixAt(index, worldMatrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
      group.add(mesh);
      return mesh;
    };

    buildInstanced(trackGeo(new THREE.BoxGeometry(0.9, 3.2, 1.0)), steelMat, chassis);
    buildInstanced(trackGeo(new THREE.BoxGeometry(0.82, 3.0, 0.035)), doorMat, doors, false);
    buildInstanced(trackGeo(new THREE.BoxGeometry(0.78, 0.13, 0.84)), bladeMat, blades);
    buildInstanced(trackGeo(new THREE.PlaneGeometry(0.62, 0.09)), ventMat, vents, false);
    buildInstanced(trackGeo(new THREE.BoxGeometry(0.94, 0.12, 1.04)), plinthMat, plinths);
    buildInstanced(trackGeo(new THREE.BoxGeometry(0.05, 3.2, 0.05)), railMat, rails);
    buildInstanced(trackGeo(new THREE.BoxGeometry(0.035, 0.3, 0.035)), railMat, handles, false);
    buildInstanced(trackGeo(new THREE.BoxGeometry(0.86, 0.05, 0.92)), railMat, tops);
    buildInstanced(trackGeo(new THREE.PlaneGeometry(0.9, 0.1)), hazardMat, hazards, false);

    // Overhead ladder cable trays with hanging fiber bundles.
    [-2.2, 2.2].forEach((x) => {
      const rail = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.5, 0.05, 15)), railMat);
      rail.position.set(x, 3.78, 0);
      rail.castShadow = true;
      group.add(rail);

      const rungs = new THREE.InstancedMesh(trackGeo(new THREE.BoxGeometry(0.62, 0.03, 0.03)), railMat, 14);
      rungs.frustumCulled = false;
      for (let i = 0; i < 14; i += 1) {
        dummy.position.set(x, 3.81, -7 + i * 1.05);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        rungs.setMatrixAt(i, dummy.matrix);
      }
      rungs.instanceMatrix.needsUpdate = true;
      group.add(rungs);

      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(x - 0.18, 3.72, -7.4),
        new THREE.Vector3(x + 0.06, 3.54, -3.6),
        new THREE.Vector3(x - 0.04, 3.62, 0),
        new THREE.Vector3(x + 0.1, 3.5, 3.6),
        new THREE.Vector3(x - 0.12, 3.7, 7.4),
      ]);
      const bundle = new THREE.Mesh(trackGeo(new THREE.TubeGeometry(curve, 48, 0.045, 6, false)), cableMat);
      bundle.castShadow = true;
      group.add(bundle);
    });

    // Wall-mounted conduit runs along both side walls.
    [-5.78, 5.78].forEach((x) => {
      const pipe = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.07, 0.07, 20, 10)), railMat);
      pipe.rotation.x = Math.PI / 2;
      pipe.position.set(x, 2.7, 0);
      group.add(pipe);
    });

    const clamps = new THREE.InstancedMesh(trackGeo(new THREE.BoxGeometry(0.18, 0.18, 0.07)), railMat, 12);
    clamps.frustumCulled = false;
    for (let i = 0; i < 12; i += 1) {
      const x = i % 2 === 0 ? -5.78 : 5.78;
      const z = -6.6 + Math.floor(i / 2) * 2.6;
      dummy.position.set(x, 2.7, z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      clamps.setMatrixAt(i, dummy.matrix);
    }
    clamps.instanceMatrix.needsUpdate = true;
    group.add(clamps);

    return { rackGroup: group, rackDisposables: disposables };
  }, [rackPositions, roomTextures]);

  useEffect(() => () => {
    rackDisposables.forEach((disposable) => disposable.dispose());
  }, [rackDisposables]);

  // Frame animations: fan rotations, traveling fiber pulse shader, ceiling security grid pulse, emergency strobes & dynamic lighting fluctuations
  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();

    // 1. Dynamic Power Grid & Emergency Light Intensity Fluctuations
    if (isEmergency) {
      // Rotate emergency ceiling strobes
      if (strobe1Ref.current) strobe1Ref.current.rotation.y += delta * 7.5;
      if (strobe2Ref.current) strobe2Ref.current.rotation.y += delta * 7.5;

      // Subtle multi-frequency electrical ripple (AC governor hunting and generator strain)
      const waveA = Math.sin(t * 6.8) * 0.14;
      const waveB = Math.sin(t * 14.3 + 1.1) * 0.09;
      const waveC = Math.cos(t * 27.6 + 0.5) * 0.05;

      // Sporadic electrical brownout micro-drop simulation (simulates heavy packet breach power draw)
      powerGridState.current.brownoutTimer -= delta;
      if (powerGridState.current.brownoutTimer <= 0) {
        // Sudden voltage dip of 18% - 36%
        powerGridState.current.brownoutDepth = 0.22 + (Math.sin(t * 31.7) * 0.5 + 0.5) * 0.18;
        // Schedule next brownout sag in 1.4 to 3.2 seconds
        powerGridState.current.brownoutTimer = 1.4 + (Math.cos(t * 19.3) * 0.5 + 0.5) * 1.8;
      } else {
        // Fast capacitor recovery to restore steady voltage
        powerGridState.current.brownoutDepth = THREE.MathUtils.damp(
          powerGridState.current.brownoutDepth,
          0,
          8.5,
          delta
        );
      }

      // Small voltage rebound surge
      const surge = Math.sin(t * 9.4) > 0.88 ? 0.15 : 0.0;
      const netFluctuation = 1.0 + waveA + waveB + waveC + surge - powerGridState.current.brownoutDepth;

      // Spatial phase divergence between central aisle, left corridor, and right corridor
      const centerFluct = THREE.MathUtils.clamp(netFluctuation, 0.42, 1.35);
      const leftFluct = THREE.MathUtils.clamp(netFluctuation + Math.sin(t * 8.9 + 0.7) * 0.1, 0.45, 1.4);
      const rightFluct = THREE.MathUtils.clamp(netFluctuation + Math.sin(t * 10.2 + 2.3) * 0.1, 0.45, 1.4);

      // Rotating strobe intensity with micro-stutter
      const strobeJitter = Math.sin(t * 22.0) * 0.12 + (Math.sin(t * 45.0) > 0.75 ? 0.25 : -0.08);
      const strobe1Target = 4.5 * THREE.MathUtils.clamp(netFluctuation + strobeJitter, 0.55, 1.45);
      const strobe2Target = 4.5 * THREE.MathUtils.clamp(netFluctuation - strobeJitter, 0.55, 1.45);

      // Smoothly damp light intensities to avoid jarring pop
      if (ambientLightRef.current) {
        ambientLightRef.current.intensity = THREE.MathUtils.damp(
          ambientLightRef.current.intensity,
          0.2 * centerFluct,
          12,
          delta
        );
      }
      if (dirLightRef.current) {
        dirLightRef.current.intensity = THREE.MathUtils.damp(
          dirLightRef.current.intensity,
          0.6 * centerFluct,
          12,
          delta
        );
      }
      if (centerPointLightRef.current) {
        centerPointLightRef.current.intensity = THREE.MathUtils.damp(
          centerPointLightRef.current.intensity,
          0.8 * centerFluct,
          14,
          delta
        );
      }
      if (leftPointLightRef.current) {
        leftPointLightRef.current.intensity = THREE.MathUtils.damp(
          leftPointLightRef.current.intensity,
          0.4 * leftFluct,
          12,
          delta
        );
      }
      if (rightPointLightRef.current) {
        rightPointLightRef.current.intensity = THREE.MathUtils.damp(
          rightPointLightRef.current.intensity,
          0.4 * rightFluct,
          12,
          delta
        );
      }
      if (rearAlertLightRef.current) {
        rearAlertLightRef.current.intensity = THREE.MathUtils.damp(
          rearAlertLightRef.current.intensity,
          4.0 * centerFluct,
          14,
          delta
        );
      }
      if (strobe1LightRef.current) {
        strobe1LightRef.current.intensity = THREE.MathUtils.damp(
          strobe1LightRef.current.intensity,
          strobe1Target,
          18,
          delta
        );
      }
      if (strobe2LightRef.current) {
        strobe2LightRef.current.intensity = THREE.MathUtils.damp(
          strobe2LightRef.current.intensity,
          strobe2Target,
          18,
          delta
        );
      }

      // Synchronize volumetric strobe cone beam opacities with fluctuating light levels
      const beamAlpha1 = THREE.MathUtils.clamp(0.3 * (strobe1Target / 4.5), 0.12, 0.48);
      const beamAlpha2 = THREE.MathUtils.clamp(0.3 * (strobe2Target / 4.5), 0.12, 0.48);
      if (strobe1BeamMat1Ref.current) strobe1BeamMat1Ref.current.opacity = beamAlpha1;
      if (strobe1BeamMat2Ref.current) strobe1BeamMat2Ref.current.opacity = beamAlpha1;
      if (strobe2BeamMat1Ref.current) strobe2BeamMat1Ref.current.opacity = beamAlpha2;
      if (strobe2BeamMat2Ref.current) strobe2BeamMat2Ref.current.opacity = beamAlpha2;
    } else if (isFeverMode) {
      // FEVER MODE: Dynamic high-energy rhythmic surge pulsing to the 138 BPM synth beat
      const beatPulse = (Math.sin(t * 14.5) + 1.0) * 0.5; // 0 to 1
      const feverIntensity = 2.0 + beatPulse * 2.2;

      if (ambientLightRef.current) {
        ambientLightRef.current.intensity = THREE.MathUtils.damp(ambientLightRef.current.intensity, 0.9 + beatPulse * 0.5, 14, delta);
      }
      if (dirLightRef.current) {
        dirLightRef.current.intensity = THREE.MathUtils.damp(dirLightRef.current.intensity, 2.2, 10, delta);
      }
      if (centerPointLightRef.current) {
        centerPointLightRef.current.intensity = THREE.MathUtils.damp(centerPointLightRef.current.intensity, feverIntensity, 16, delta);
      }
      if (leftPointLightRef.current) {
        leftPointLightRef.current.intensity = THREE.MathUtils.damp(leftPointLightRef.current.intensity, 2.2 + beatPulse * 1.5, 14, delta);
      }
      if (rightPointLightRef.current) {
        rightPointLightRef.current.intensity = THREE.MathUtils.damp(rightPointLightRef.current.intensity, 2.2 + beatPulse * 1.5, 14, delta);
      }
      if (rearAlertLightRef.current) {
        rearAlertLightRef.current.intensity = THREE.MathUtils.damp(rearAlertLightRef.current.intensity, 3.5, 10, delta);
      }
    } else {
      // Nominal steady-state lighting restoration
      if (ambientLightRef.current) {
        ambientLightRef.current.intensity = THREE.MathUtils.damp(ambientLightRef.current.intensity, 0.6, 8, delta);
      }
      if (dirLightRef.current) {
        dirLightRef.current.intensity = THREE.MathUtils.damp(dirLightRef.current.intensity, 1.5, 8, delta);
      }
      if (centerPointLightRef.current) {
        centerPointLightRef.current.intensity = THREE.MathUtils.damp(centerPointLightRef.current.intensity, 2.0, 8, delta);
      }
      if (leftPointLightRef.current) {
        leftPointLightRef.current.intensity = THREE.MathUtils.damp(leftPointLightRef.current.intensity, 1.5, 8, delta);
      }
      if (rightPointLightRef.current) {
        rightPointLightRef.current.intensity = THREE.MathUtils.damp(rightPointLightRef.current.intensity, 1.5, 8, delta);
      }
      if (rearAlertLightRef.current) {          rearAlertLightRef.current.intensity = THREE.MathUtils.damp(rearAlertLightRef.current.intensity, 1.1, 8, delta);
      }
    }

    // 2. Rotate cooling fans
    if (fansGroupRef.current) {
      fansGroupRef.current.children.forEach((fan) => {
        fan.rotation.z += delta * (isEmergency ? 32.0 : 18.0);
      });
    }

    // 3. Pulse fiber optic emissive traveling lights
    if (fiberPulsesRef.current) {
      fiberPulsesRef.current.children.forEach((pulse, i) => {
        // Move traveling light packet along cable
        pulse.position.z = ((t * 2.5 + i * 2) % 16) - 8;
      });
    }

    // 4. Ceiling laser grid subtle breathing
    if (ceilingGridRef.current) {
      ceilingGridRef.current.children.forEach((beam, idx) => {
        const mat = (beam as THREE.Mesh).material as THREE.MeshBasicMaterial;
        mat.opacity = 0.35 + Math.sin(t * 3.0 + idx) * 0.2;
      });
    }

    // 5. Animate Instanced Server LED activity (zero GC allocation)
    if (ledsMeshRef.current) {
      let ledIdx = 0;
      rackPositions.forEach((pos, rackI) => {
        const isLeft = pos[0] < 0;
        const rotY = pos[2] > 4 ? Math.PI : isLeft ? Math.PI / 2 : -Math.PI / 2;
        const yBlades = [-1.1, -0.7, -0.3, 0.1, 0.5, 0.9, 1.2];

        yBlades.forEach((yOffset, bladeI) => {
          // LED 1: Activity
          const active = Math.sin(t * 8.0 + rackI * 3 + bladeI) > 0.1;
          tempLedColor.set(active ? (bladeI % 3 === 0 ? '#10b981' : '#00f0ff') : '#0284c7');
          ledsMeshRef.current!.setColorAt(ledIdx, tempLedColor);

          dummy.position.set(pos[0], pos[1] + yOffset, pos[2]);
          dummy.rotation.set(0, rotY, 0);
          dummy.translateX(0.3);
          dummy.translateZ(0.53);
          dummy.scale.set(1, 1, 1);
          dummy.updateMatrix();
          ledsMeshRef.current!.setMatrixAt(ledIdx, dummy.matrix);
          ledIdx++;

          // LED 2: Power / Alert
          const alertLed = (rackI + bladeI) % 11 === 0 && Math.sin(t * 5) > 0;
          tempLedColor.set(alertLed ? '#ef4444' : '#38bdf8');
          ledsMeshRef.current!.setColorAt(ledIdx, tempLedColor);

          dummy.position.set(pos[0], pos[1] + yOffset, pos[2]);
          dummy.rotation.set(0, rotY, 0);
          dummy.translateX(0.22);
          dummy.translateZ(0.53);
          dummy.scale.set(1, 1, 1);
          dummy.updateMatrix();
          ledsMeshRef.current!.setMatrixAt(ledIdx, dummy.matrix);
          ledIdx++;
        });
      });

      ledsMeshRef.current.instanceMatrix.needsUpdate = true;
      if (ledsMeshRef.current.instanceColor) {
        ledsMeshRef.current.instanceColor.needsUpdate = true;
      }
    }
  });

  return (
    <group name="ServerRoomEnvironment">
      {/* Dynamic Cyber Volumetric Fog (#010812 SOC palette) */}
      <fogExp2 attach="fog" args={['#010812', 0.055]} />

      {/* Balanced Studio PBR Lighting Rig with Emergency Dimming & Subtle Power Fluctuations */}
      <ambientLight ref={ambientLightRef} intensity={isEmergency ? 0.2 : 0.6} color={isEmergency ? '#260a0a' : '#061824'} />
      <directionalLight
        ref={dirLightRef}
        position={[2.5, 5.5, 2.0]}
        intensity={isEmergency ? 0.6 : 1.5}
        color={isEmergency ? '#fca5a5' : '#e0f2fe'}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
        shadow-camera-left={-9}
        shadow-camera-right={9}
        shadow-camera-top={9}
        shadow-camera-bottom={-9}
        shadow-camera-near={0.5}
        shadow-camera-far={22}
      />
      <pointLight ref={centerPointLightRef} position={[0, 3.4, 0]} intensity={isEmergency ? 0.8 : 2.0} distance={12} color={isEmergency ? '#dc2626' : '#00f0ff'} />
      <pointLight ref={leftPointLightRef} position={[-3.0, 2.0, -1.5]} intensity={isEmergency ? 0.4 : 1.5} distance={7} color="#00ffcc" />
      <pointLight ref={rightPointLightRef} position={[3.0, 2.0, -1.5]} intensity={isEmergency ? 0.4 : 1.5} distance={7} color="#00ffcc" />
      <pointLight ref={rearAlertLightRef} position={[0, 1.8, -4.8]} intensity={isEmergency ? 4.0 : 1.1} distance={10} color="#ef4444" />

      {/* Rotating Red Emergency Ceiling Strobes with Fluctuating Power (Active on Health < 30% or Scenario 3 DDoS) */}
      {isEmergency && (
        <group name="EmergencyCeilingStrobes">
          {/* Strobe 1 on Left Ceiling */}
          <group position={[-2.0, 3.9, -1.5]}>
            {/* Siren Housing Mount */}
            <mesh>
              <cylinderGeometry args={[0.18, 0.22, 0.14, 16]} />
              <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
            </mesh>
            <mesh position={[0, -0.09, 0]}>
              <sphereGeometry args={[0.12, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshBasicMaterial color="#ef4444" />
            </mesh>
            {/* Rotating Dual Red Beams */}
            <group ref={strobe1Ref} position={[0, -0.1, 0]}>
              <pointLight ref={strobe1LightRef} color="#ef4444" intensity={4.5} distance={10} />
              <mesh rotation={[0.4, 0, 0]} position={[0, -1.2, 0.8]}>
                <cylinderGeometry args={[0.02, 0.7, 2.6, 16, 1, true]} />
                <meshBasicMaterial
                  ref={strobe1BeamMat1Ref}
                  color="#ef4444"
                  transparent
                  opacity={0.04}
                  blending={THREE.AdditiveBlending}
                  depthWrite={false}
                  side={THREE.DoubleSide}
                />
              </mesh>
              <mesh rotation={[-0.4, 0, Math.PI]} position={[0, -0.6, -0.4]}>
                <cylinderGeometry args={[0.02, 0.35, 1.4, 16, 1, true]} />
                <meshBasicMaterial
                  ref={strobe1BeamMat2Ref}
                  color="#ef4444"
                  transparent
                  opacity={0.04}
                  blending={THREE.AdditiveBlending}
                  depthWrite={false}
                  side={THREE.DoubleSide}
                />
              </mesh>
            </group>
          </group>

          {/* Strobe 2 on Right Ceiling */}
          <group position={[2.0, 3.9, -1.5]}>
            <mesh>
              <cylinderGeometry args={[0.18, 0.22, 0.14, 16]} />
              <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
            </mesh>
            <mesh position={[0, -0.09, 0]}>
              <sphereGeometry args={[0.12, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshBasicMaterial color="#ef4444" />
            </mesh>
            <group ref={strobe2Ref} position={[0, -0.1, 0]}>
              <pointLight ref={strobe2LightRef} color="#ef4444" intensity={3.5} distance={8} />
              <mesh rotation={[0.4, 0, 0]} position={[0, -0.6, 0.4]}>
                <cylinderGeometry args={[0.02, 0.35, 1.4, 16, 1, true]} />
                <meshBasicMaterial
                  ref={strobe2BeamMat1Ref}
                  color="#ef4444"
                  transparent
                  opacity={0.04}
                  blending={THREE.AdditiveBlending}
                  depthWrite={false}
                  side={THREE.DoubleSide}
                />
              </mesh>
              <mesh rotation={[-0.4, 0, Math.PI]} position={[0, -0.6, -0.4]}>
                <cylinderGeometry args={[0.02, 0.35, 1.4, 16, 1, true]} />
                <meshBasicMaterial
                  ref={strobe2BeamMat2Ref}
                  color="#ef4444"
                  transparent
                  opacity={0.04}
                  blending={THREE.AdditiveBlending}
                  depthWrite={false}
                  side={THREE.DoubleSide}
                />
              </mesh>
            </group>
          </group>
        </group>
      )}

      {/* Main Floor: reflective plated deck with procedural seams and grain */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 24]} />
        <meshStandardMaterial
          color="#050b16"
          roughness={0.34}
          metalness={0.94}
          roughnessMap={roomTextures.panel}
          bumpMap={roomTextures.panel}
          bumpScale={0.03}
          envMapIntensity={1.35}
        />
      </mesh>

      {/* Hexagonal Player Security Platform */}
      <group position={[0, 0, 0]}>
        <mesh position={[0, 0.02, 0]} receiveShadow>
          <cylinderGeometry args={[1.6, 1.6, 0.04, 6]} />
          <meshStandardMaterial
            color="#081022"
            roughness={0.3}
            metalness={0.8}
          />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.041, 0]}>
          <ringGeometry args={[1.52, 1.58, 32]} />
          <meshBasicMaterial color="#00f0ff" transparent opacity={0.6} toneMapped={false} />
        </mesh>
      </group>

      {/* Floor Conduits with Glowing Fiber Lines */}
      {[-1.5, 0, 1.5].map((xOffset, i) => (
        <group key={`conduit-${i}`} position={[xOffset, 0.025, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.08, 18]} />
            <meshStandardMaterial
              color="#0284c7"
              emissive="#00f0ff"
              emissiveIntensity={0.6}
            />
          </mesh>
        </group>
      ))}

      {/* Ceiling & Overhead Cable Trays */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 4.2, 0]}>
        <planeGeometry args={[20, 24]} />
        <meshStandardMaterial color="#020612" roughness={0.7} metalness={0.5} />
      </mesh>

      {/* Ceiling Laser Security Grid */}
      <group ref={ceilingGridRef} position={[0, 4.0, 0]}>
        {[-3, -1.5, 0, 1.5, 3].map((x, i) => (
          <mesh key={`laser-line-x-${i}`} position={[x, 0, 0]}>
            <boxGeometry args={[0.015, 0.015, 18]} />
            <meshBasicMaterial color="#00ffcc" transparent opacity={0.4} toneMapped={false} />
          </mesh>
        ))}
        {[-6, -3, 0, 3, 6].map((z, j) => (
          <mesh key={`laser-line-z-${j}`} position={[0, 0, z]}>
            <boxGeometry args={[12, 0.015, 0.015]} />
            <meshBasicMaterial color="#00ffcc" transparent opacity={0.4} toneMapped={false} />
          </mesh>
        ))}
      </group>

      {/* Overhead Volumetric Light Shafts */}
      {[-1.8, 1.8].map((x, i) => (
        <group key={`shaft-${i}`} position={[x, 3.2, -1.5]} rotation={[0.2, 0, i === 0 ? 0.15 : -0.15]}>
          <mesh>
            <cylinderGeometry args={[0.15, 0.9, 3.2, 16, 1, true]} />
            <meshBasicMaterial
              color="#00f0ff"
              transparent
              opacity={0.06}
              blending={THREE.AdditiveBlending}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
        </group>
      ))}

      {/* Fiber Optic Cables with Traveling Pulse Packets */}
      <group position={[0, 3.8, 0]}>
        {[-1.5, 1.5].map((x, i) => (
          <group key={`fiber-cable-${i}`}>
            {/* Dark Cable Housing */}
            <mesh position={[x, 0, 0]}>
              <boxGeometry args={[0.08, 0.08, 16]} />
              <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
            </mesh>
          </group>
        ))}
        {/* Traveling light pulses */}
        <group ref={fiberPulsesRef}>
          {[-1.5, 1.5].map((x, i) => (
            <mesh key={`pulse-${i}`} position={[x, -0.05, 0]}>
              <sphereGeometry args={[0.06, 8, 8]} />
              <meshBasicMaterial color="#00ffcc" toneMapped={false} />
            </mesh>
          ))}
        </group>
      </group>

      {/* Instanced rack assembly: chassis, doors, blades, vents, plinths,
          corner rails, handles, exhaust tops, hazard stripes, cable trays */}
      <primitive object={rackGroup} />

      {/* Rotating Server Cooling Fans on Exhaust Columns */}
      <group ref={fansGroupRef}>
        {[-3.2, 3.2].map((x, i) => (
          <group key={`fan-col-${i}`} position={[x, 3.0, -4.5]}>
            {/* Fan Housing Grille */}
            <mesh rotation={[0, i === 0 ? Math.PI / 2 : -Math.PI / 2, 0]}>
              <torusGeometry args={[0.22, 0.03, 16, 24]} />
              <meshStandardMaterial color="#475569" metalness={0.9} />
            </mesh>
            {/* Rotating 4-Blade Fan */}
            <group rotation={[0, i === 0 ? Math.PI / 2 : -Math.PI / 2, 0]}>
              {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((angle, bIdx) => (
                <mesh key={`blade-part-${bIdx}`} rotation={[0, 0, angle]}>
                  <boxGeometry args={[0.04, 0.2, 0.005]} />
                  <meshStandardMaterial color="#0f172a" metalness={0.8} />
                </mesh>
              ))}
            </group>
          </group>
        ))}
      </group>

      {/* Instanced Server LEDs */}
      <instancedMesh
        ref={ledsMeshRef}
        args={[ledGeo, ledMat, TOTAL_LEDS]}
        frustumCulled={false}
      />

      {/* Deep defence corridor: Phase 2 warps the camera to Z ~ -25 and the core
          sits at Z ~ -30, which used to fall outside the modelled room and left a
          black void behind the HUD. This section keeps the world solid there. */}
      <group name="DeepDefenseCorridor" position={[0, 0, -27]}>
        {/* Local lighting: the bay sat outside the main rig and read as a void */}
        <pointLight position={[0, 3.9, 3]} intensity={26} distance={20} color="#22d3ee" />
        <pointLight position={[0, 2.4, -7]} intensity={18} distance={18} color="#0ea5e9" />
        <pointLight position={[0, 0.8, 12]} intensity={12} distance={14} color="#0f172a" />
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[28, 30]} />
          <meshStandardMaterial
            color="#050b16"
            roughness={0.34}
            metalness={0.94}
            roughnessMap={roomTextures.panel}
            bumpMap={roomTextures.panel}
            bumpScale={0.03}
            envMapIntensity={1.2}
          />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 4.6, 0]}>
          <planeGeometry args={[28, 30]} />
          <meshStandardMaterial color="#020612" roughness={0.7} metalness={0.5} />
        </mesh>
        {[-13.8, 13.8].map((x, i) => (
          <mesh
            key={`deep-wall-${i}`}
            position={[x, 2.4, 0]}
            rotation={[0, i === 0 ? Math.PI / 2 : -Math.PI / 2, 0]}
            receiveShadow
          >
            <planeGeometry args={[30, 5.4]} />
            <meshStandardMaterial color="#030712" metalness={0.8} roughness={0.42} />
          </mesh>
        ))}
        <mesh position={[0, 2.4, -14.6]}>
          <planeGeometry args={[28, 5.4]} />
          <meshStandardMaterial color="#030712" metalness={0.8} roughness={0.42} />
        </mesh>
        {[-1.5, 0, 1.5].map((x, i) => (
          <mesh key={`deep-conduit-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.02, 0]}>
            <planeGeometry args={[0.07, 26]} />
            <meshStandardMaterial color="#0284c7" emissive="#00f0ff" emissiveIntensity={0.55} />
          </mesh>
        ))}
        {[-4.6, 4.6].map((x, i) => (
          <mesh key={`deep-strip-${i}`} position={[x, 3.4, 0]}>
            <boxGeometry args={[0.06, 0.06, 26]} />
            <meshBasicMaterial color="#00ffcc" toneMapped={false} />
          </mesh>
        ))}
        {Array.from({ length: 8 }, (_, i) => {
          const side = i % 2 === 0 ? -1 : 1;
          const z = -8 + Math.floor(i / 2) * 4.6;
          return (
            <mesh key={`deep-rack-${i}`} position={[side * 4.9, 1.5, z]} castShadow receiveShadow>
              <boxGeometry args={[1.6, 3.0, 3.2]} />
              <meshStandardMaterial color="#080f1c" metalness={0.9} roughness={0.4} />
            </mesh>
          );
        })}
      </group>

      {/* Room Enclosing Boundaries */}
      <mesh position={[0, 2.1, -7]} receiveShadow>
        <planeGeometry args={[20, 5]} />
        <meshStandardMaterial color="#030712" metalness={0.8} roughness={0.4} />
      </mesh>
      <mesh position={[-6, 2.1, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[24, 5]} />
        <meshStandardMaterial color="#030712" metalness={0.8} roughness={0.4} />
      </mesh>
      <mesh position={[6, 2.1, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[24, 5]} />
        <meshStandardMaterial color="#030712" metalness={0.8} roughness={0.4} />
      </mesh>
    </group>
  );
};
