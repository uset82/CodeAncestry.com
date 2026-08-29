'use client';

import { Environment, Lightformer } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useLayoutEffect, useMemo, useRef } from 'react';
import {
  Color,
  FogExp2,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  type DirectionalLight,
  type HemisphereLight,
  type PointLight,
} from 'three';
import { climaxAmount, daylight, type BeatState } from './beats';
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
  /* `dithering` on every large smooth surface. A backbone lit by a soft area
     source is a long, very gradual ramp, which is exactly the case 8-bit output
     banks into visible bands; the reference turns it on throughout. */
  const backboneOrigin = new MeshPhysicalMaterial({
    color: HELIX.acidDim,
    emissive: HELIX.acid,
    emissiveIntensity: 0.55,
    roughness: 0.34,
    metalness: 0.12,
    clearcoat: 0.22,
    clearcoatRoughness: 0.5,
    /* Sheen is the "living tissue" term — a soft retroreflective rim that
       picks up grazing light the way skin, velvet and leaf surfaces do. The
       reference leans on it heavily, and it is what stops a lit tube from
       reading as polished plastic once the environment is doing real work. */
    sheen: 0.45,
    sheenRoughness: 0.55,
    sheenColor: HELIX.acid,
    dithering: true,
  });
  const backboneMutated = new MeshPhysicalMaterial({
    color: HELIX.violet,
    emissive: HELIX.violet,
    emissiveIntensity: 0.62,
    roughness: 0.36,
    metalness: 0.1,
    sheen: 0.4,
    sheenRoughness: 0.55,
    sheenColor: HELIX.violet,
    dithering: true,
  });
  const backboneDescendant = new MeshPhysicalMaterial({
    color: HELIX.cyanDim,
    emissive: HELIX.cyan,
    emissiveIntensity: 0.42,
    roughness: 0.4,
    metalness: 0.08,
    sheen: 0.4,
    sheenRoughness: 0.55,
    sheenColor: HELIX.cyan,
    dithering: true,
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
 * The environment the specimen reflects.
 *
 * `RoomEnvironment` used to stand here, and it is why the strands read as flat
 * plastic: it is a grey box, so `roughness`, `metalness` and `clearcoat` had
 * almost nothing to work with. Three shaped emitters give the backbone a
 * specular that moves with the camera, which is the single largest realism
 * lever in this scene and the reason the reference carries an environment on
 * every material.
 *
 * Baked once, not per frame. The dawn is carried by `scene.environmentIntensity`
 * — a scalar, free to animate — rather than by re-rendering the cube map.
 */
function SpecimenEnvironment() {
  return (
    <Environment resolution={256}>
      {/* Key: a wide soft ceiling panel, the long highlight down each strand. */}
      <Lightformer
        form="rect"
        intensity={3.4}
        color="#fffdf6"
        position={[0, 7, -3]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[14, 9, 1]}
      />
      {/* Cold rim from behind-left: separates the strands from the ground. */}
      <Lightformer
        form="rect"
        intensity={1.3}
        color="#63e7ff"
        position={[-7, 1, -4]}
        rotation={[0, Math.PI / 2, 0]}
        scale={[9, 10, 1]}
      />
      {/* The dawn itself, low and warm on the right, where the family ends. */}
      <Lightformer
        form="rect"
        intensity={2.1}
        color="#ffe6bd"
        position={[6, -5, 2]}
        rotation={[0, -Math.PI / 2, 0]}
        scale={[9, 12, 1]}
      />
    </Environment>
  );
}

/**
 * Background and fog, both driven by `daylight()`.
 *
 * The fog colour has to track the background exactly or the horizon tears —
 * distant strands fade toward one colour while the empty canvas behind them is
 * another. Density drops as the world lights up: fog is what buried the closing
 * frame, and a lit scene should not be hazier than an unlit one.
 */
const NIGHT_GROUND = new Color('#07090d');
/* Not bone. A light ground made the specimen read as material, but it turned
   the closing frame white and cut the page in half along the canvas edge. The
   ground stays in the dark and warms by a few percent; what actually lights the
   specimen is the environment and the key, which keep rising. */
const DAWN_GROUND = new Color('#12140e');

function GroundRig({ state }: { state: React.RefObject<BeatState> }) {
  const { scene } = useThree();
  const fog = useMemo(() => new FogExp2(NIGHT_GROUND.getHex(), 0.022), []);
  const ground = useMemo(() => NIGHT_GROUND.clone(), []);

  useLayoutEffect(() => {
    /* eslint-disable react-hooks/immutability -- `scene` comes from useThree(),
       and mutating the three.js scene graph is the entire React Three Fiber
       programming model; the rule cannot see that the object is intentionally
       mutable. The cleanup below restores everything set here. */
    scene.fog = fog;
    scene.background = ground;
    /* eslint-enable react-hooks/immutability */
    return () => {
      if (scene.fog === fog) scene.fog = null;
      if (scene.background === ground) scene.background = null;
    };
  }, [scene, fog, ground]);

  useFrame(() => {
    const current = state.current;
    if (!current) return;
    const day = daylight(current.progress);

    ground.copy(NIGHT_GROUND).lerp(DAWN_GROUND, day);
    fog.color.copy(ground);
    /* eslint-disable react-hooks/immutability -- driving a three.js scene by
       mutating it every frame is what `useFrame` is for; the rule sees a value
       that came from `useMemo`/`useThree` and cannot tell that the whole point
       of these objects is to be written to. Both are torn down in the layout
       effect above. */
    fog.density = 0.022 - day * 0.0125;
    scene.environmentIntensity = 0.34 + day * 1.05;
    /* eslint-enable react-hooks/immutability */
  });

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
  const sky = useRef<HemisphereLight>(null);
  const rim = useRef<DirectionalLight>(null);

  useFrame(() => {
    const current = state.current;
    if (!current) return;
    const climax = climaxAmount(current);
    const day = daylight(current.progress);

    if (key.current) key.current.intensity = 2.3 + climax * 1.6 + day * 2.2;
    if (acid.current) acid.current.intensity = 2.4 + climax * 4.4;

    /* The sky term is what makes a lit world read as lit rather than as a dark
       world with a brighter lamp in it: it fills the shadow side. Its ground
       colour has to follow the actual ground or the bounce is a lie. */
    if (sky.current) {
      sky.current.intensity = 0.7 + day * 1.3;
      sky.current.groundColor.copy(NIGHT_GROUND).lerp(DAWN_GROUND, day);
    }
    /* The cold rim earns its keep against a dark ground and only muddies a
       light one, so it retreats as the dawn arrives. */
    if (rim.current) rim.current.intensity = 0.7 - day * 0.42;
  });

  return (
    <>
      <GroundRig state={state} />
      <SpecimenEnvironment />
      <hemisphereLight ref={sky} args={['#63e7ff', '#07090d', 0.55]} />
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
      <directionalLight ref={rim} position={[-5.4, 1.1, -3.2]} intensity={0.7} color="#63e7ff" />
      <pointLight
        ref={acid}
        position={[0, 2.5, 0.7]}
        color="#b7ff39"
        intensity={2.4}
        distance={10}
        decay={2}
      />
      <pointLight position={[-4.4, -6.6, 0.5]} color="#a985ff" intensity={1.8} distance={8} decay={2} />
      {/* Still no ground plane, and deliberately no `ContactShadows` either.
          A 36x36 receiver used to sit at y = -10.7 and read as a grey slab that
          the descending camera brought into frame as a rectangle floating in
          the void. A contact-shadow plane would reproduce exactly that: this
          lineage hangs from y = 3.6 down to y = -9.9 rather than resting on
          anything, so a catcher placed under it is 13 units from most of what
          it is meant to catch and resolves to a vague smudge.

          What actually carries the depth here is strand-on-strand shadowing
          plus the environment's moving specular. */}
    </>
  );
}
