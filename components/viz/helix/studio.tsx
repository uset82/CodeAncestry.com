'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useLayoutEffect, useRef } from 'react';
import {
  Color,
  FogExp2,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PMREMGenerator,
  type DirectionalLight,
  type PointLight,
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { BeatState } from './beats';
import { patchGrowingMaterial } from './organic';

/** Token-locked specimen palette. Same hexes as `app/globals.css`. */
export const HELIX = {
  acid: new Color('#b7ff39'),
  acidDim: new Color('#8ecb22'),
  cyan: new Color('#63e7ff'),
  cyanDim: new Color('#3aa9c4'),
  violet: new Color('#a985ff'),
  dim: new Color('#1d2735'),
  void: new Color('#07090d'),
  /* Base pairs. Lifted off the old #1d2735, which was black on black against
     the void and left the chain looking severed. */
  rung: new Color('#33465c'),
  rungGlow: new Color('#4b6b84'),
} as const;

/**
 * Shared material kit — one role, many meshes. Named the way a Three.js
 * editor scene graph would name them, so the helix reads as a lit specimen
 * instead of an unlit wire.
 */
export function createHelixMaterials() {
  const backboneOrigin = new MeshPhysicalMaterial({
    color: HELIX.acidDim,
    emissive: HELIX.acid,
    emissiveIntensity: 0.55,
    roughness: 0.34,
    metalness: 0.12,
    clearcoat: 0.22,
    clearcoatRoughness: 0.5,
  });
  const backboneMutated = new MeshStandardMaterial({
    color: HELIX.violet,
    emissive: HELIX.violet,
    emissiveIntensity: 0.62,
    roughness: 0.36,
    metalness: 0.1,
  });
  const backboneDescendant = new MeshStandardMaterial({
    color: HELIX.cyanDim,
    emissive: HELIX.cyan,
    emissiveIntensity: 0.42,
    roughness: 0.4,
    metalness: 0.08,
  });

  patchGrowingMaterial(backboneOrigin, 'origin', HELIX.acid);
  patchGrowingMaterial(backboneMutated, 'mutated', HELIX.violet);
  patchGrowingMaterial(backboneDescendant, 'descendant', HELIX.cyan);

  return {
    backboneOrigin,
    backboneMutated,
    backboneDescendant,
    rung: new MeshStandardMaterial({
      color: HELIX.rung,
      emissive: HELIX.rungGlow,
      emissiveIntensity: 0.5,
      roughness: 0.5,
      metalness: 0.2,
    }),
    locus: new MeshStandardMaterial({
      color: '#ffffff',
      emissive: '#9aa8b8',
      emissiveIntensity: 0.22,
      roughness: 0.22,
      metalness: 0.18,
    }),
    pulseDown: new MeshStandardMaterial({
      color: HELIX.cyan,
      emissive: HELIX.cyan,
      emissiveIntensity: 1.1,
      roughness: 0.18,
      metalness: 0.1,
    }),
    pulseUp: new MeshStandardMaterial({
      color: HELIX.violet,
      emissive: HELIX.violet,
      emissiveIntensity: 1.25,
      roughness: 0.18,
      metalness: 0.1,
    }),
  };
}

export type HelixMaterials = ReturnType<typeof createHelixMaterials>;

export function disposeHelixMaterials(materials: HelixMaterials) {
  Object.values(materials).forEach((material) => {
    const depth = material.userData.depthMaterial as { dispose?: () => void } | undefined;
    depth?.dispose?.();
    material.dispose();
  });
}

function backboneMaterial(materials: HelixMaterials, generation: number, origin: boolean) {
  if (generation === 0) return materials.backboneOrigin;
  if (origin) return materials.backboneMutated;
  return materials.backboneDescendant;
}

export { backboneMaterial };

/**
 * The same IBL the official Three.js editor uses (`RoomEnvironment` + PMREM).
 * Without it, metal/clearcoat reads as charcoal.
 */
function EditorEnvironment() {
  const { gl, scene } = useThree();

  useLayoutEffect(() => {
    const pmrem = new PMREMGenerator(gl);
    const envScene = new RoomEnvironment();
    const env = pmrem.fromScene(envScene, 0.04).texture;

    /* eslint-disable react-hooks/immutability -- `scene` comes from useThree(),
       and mutating the three.js scene graph is the entire React Three Fiber
       programming model; the rule cannot see that the object is intentionally
       mutable. The cleanup below restores and disposes everything set here. */
    scene.environment = env;
    scene.environmentIntensity = 0.7;
    /* eslint-enable react-hooks/immutability */

    return () => {
      scene.environment = null;
      env.dispose();
      envScene.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);

  return null;
}

function FogRig() {
  const { scene } = useThree();

  useLayoutEffect(() => {
    const fog = new FogExp2('#07090d', 0.022);
    /* eslint-disable react-hooks/immutability -- three.js scene graph */
    scene.fog = fog;
    return () => {
      if (scene.fog === fog) scene.fog = null;
    };
    /* eslint-enable react-hooks/immutability */
  }, [scene]);

  return null;
}

/**
 * Three.js-editor lighting stack: key, cyan fill, acid practical on generation
 * zero, violet practical on the mutation origin. Fog is exponential so near
 * strands stay bright. No scene background — the CSS glow behind the canvas
 * is the void.
 */
export function StudioRig({
  state,
  shadows,
}: {
  state: React.RefObject<BeatState>;
  shadows: boolean;
}) {
  const key = useRef<DirectionalLight>(null);
  const acid = useRef<PointLight>(null);

  useFrame(() => {
    const current = state.current;
    if (!current) return;
    const climax = Math.max(current.upstream, Math.max(0, (current.progress - 0.62) / 0.38));
    if (key.current) key.current.intensity = 1.55 + climax * 1.35;
    if (acid.current) acid.current.intensity = 2.4 + climax * 4.4;
  });

  return (
    <>
      <FogRig />
      <EditorEnvironment />
      <hemisphereLight args={['#63e7ff', '#07090d', 0.55]} />
      <directionalLight
        ref={key}
        position={[4.4, 6.6, 3.6]}
        intensity={1.55}
        color="#f4ffe8"
        castShadow={shadows}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.00035}
        shadow-camera-near={1}
        shadow-camera-far={28}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={6}
        shadow-camera-bottom={-12}
      />
      <directionalLight position={[-5.4, 1.1, -3.2]} intensity={0.7} color="#63e7ff" />
      <pointLight
        ref={acid}
        position={[0, 2.5, 0.7]}
        color="#b7ff39"
        intensity={2.4}
        distance={10}
        decay={2}
      />
      <pointLight position={[-4.4, -6.6, 0.5]} color="#a985ff" intensity={1.8} distance={8} decay={2} />
      {shadows && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -10.7, 0]} receiveShadow>
          <planeGeometry args={[36, 36]} />
          <meshStandardMaterial color="#07090d" roughness={1} metalness={0} />
        </mesh>
      )}
    </>
  );
}
