'use client';

import { Environment, Lightformer } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useLayoutEffect, useMemo, useRef } from 'react';
import {
  Color,
  FogExp2,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Vector3,
  type DirectionalLight,
  type HemisphereLight,
  type PointLight,
} from 'three';
import {
  climaxAmount,
  daylight,
  holdProgress,
  pixelsPerUnit,
  type BeatState,
} from './beats';
import { patchGrowingMaterial } from './organic';
import { RUNG_RADIUS, STRANDS, strandEased } from './strands';

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
  amber: new Color('#ffb340'),
  rose: new Color('#ff5c7a'),
} as const;

const KEY_LIGHT = new Vector3(4.4, 6.6, 3.6);

type ShadowBox = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
};

type ShadowProjection = {
  minR: number;
  maxR: number;
  minU: number;
  maxU: number;
  minD: number;
  maxD: number;
};

/**
 * Strands count as present at the same threshold `grownFamilyY` already uses,
 * so the shadow box and the camera can never disagree about what exists.
 */
const GROWN_EPSILON = 0.08;
const SHADOW_SLACK = 0.4;

function emptyBox(): ShadowBox {
  return {
    minX: Infinity,
    maxX: -Infinity,
    minY: Infinity,
    maxY: -Infinity,
    minZ: Infinity,
    maxZ: -Infinity,
  };
}

/** Bounds of the whole lineage, the way the old fitted frustum measured it. */
function familyBounds(): ShadowBox {
  const out = emptyBox();
  for (const spec of STRANDS) {
    const pad = spec.radius + 0.2;
    for (const point of [spec.start, spec.end]) {
      out.minX = Math.min(out.minX, point.x - pad);
      out.maxX = Math.max(out.maxX, point.x + pad);
      out.minY = Math.min(out.minY, point.y - pad);
      out.maxY = Math.max(out.maxY, point.y + pad);
      out.minZ = Math.min(out.minZ, point.z - pad);
      out.maxZ = Math.max(out.maxZ, point.z + pad);
    }
  }
  return out;
}

const FAMILY_BOX = familyBounds();

/**
 * The light basis, fixed for the whole scroll. Only the ortho extents move.
 *
 * Re-aiming the light would mean moving its `target`, and R3F attaches that
 * outside the scene graph — its world matrix then only refreshes when
 * something asks it to, while the shadow camera reads it raw every frame. A
 * fixed basis with asymmetric extents gets the same tight fit with none of
 * that. `right` and `up` are both perpendicular to `forward`, and `forward` is
 * the light-to-centre line, so the frustum origin projects to zero on both and
 * needs no offset.
 */
const SHADOW_BASIS = (() => {
  const center = new Vector3(
    (FAMILY_BOX.minX + FAMILY_BOX.maxX) / 2,
    (FAMILY_BOX.minY + FAMILY_BOX.maxY) / 2,
    (FAMILY_BOX.minZ + FAMILY_BOX.maxZ) / 2,
  );
  const forward = center.clone().sub(KEY_LIGHT).normalize();
  const up = new Vector3(0, 1, 0);
  if (Math.abs(forward.y) > 0.92) up.set(0, 0, 1);
  const right = new Vector3().crossVectors(forward, up).normalize();
  up.crossVectors(right, forward).normalize();
  return { center, forward, right, up };
})();

const GROWN_BOX: ShadowBox = emptyBox();
const SHADOW_PROJECTION: ShadowProjection = {
  minR: 0,
  maxR: 0,
  minU: 0,
  maxU: 0,
  minD: 0,
  maxD: 0,
};
const SHADOW_POINT = new Vector3();

/**
 * Bounds of the strands that exist at `generations`, grown ends included.
 *
 * A strand mid-reveal only reaches part of the way along its own axis, so a
 * box taken from `spec.end` would overshoot by the unrevealed remainder — the
 * same reason `grownFamilyY` interpolates instead of jumping.
 */
function grownBoxInto(generations: number, out: ShadowBox) {
  Object.assign(out, emptyBox());
  for (const spec of STRANDS) {
    const grow = strandEased(generations, spec.generation);
    if (grow < GROWN_EPSILON) continue;
    const pad = spec.radius + 0.2;
    const ex = spec.start.x + (spec.end.x - spec.start.x) * grow;
    const ey = spec.start.y + (spec.end.y - spec.start.y) * grow;
    const ez = spec.start.z + (spec.end.z - spec.start.z) * grow;
    out.minX = Math.min(out.minX, spec.start.x - pad, ex - pad);
    out.maxX = Math.max(out.maxX, spec.start.x + pad, ex + pad);
    out.minY = Math.min(out.minY, spec.start.y - pad, ey - pad);
    out.maxY = Math.max(out.maxY, spec.start.y + pad, ey + pad);
    out.minZ = Math.min(out.minZ, spec.start.z - pad, ez - pad);
    out.maxZ = Math.max(out.maxZ, spec.start.z + pad, ez + pad);
  }
  if (out.minX > out.maxX) Object.assign(out, FAMILY_BOX);
}

/** Box corners onto the fixed light basis. Allocation-free; runs every frame. */
function projectBoxInto(box: ShadowBox, out: ShadowProjection): ShadowProjection {
  const { forward, right, up } = SHADOW_BASIS;
  out.minR = Infinity;
  out.maxR = -Infinity;
  out.minU = Infinity;
  out.maxU = -Infinity;
  out.minD = Infinity;
  out.maxD = -Infinity;
  for (const x of [box.minX, box.maxX]) {
    for (const y of [box.minY, box.maxY]) {
      for (const z of [box.minZ, box.maxZ]) {
        SHADOW_POINT.set(x, y, z).sub(KEY_LIGHT);
        const r = SHADOW_POINT.dot(right);
        const u = SHADOW_POINT.dot(up);
        const d = SHADOW_POINT.dot(forward);
        if (r < out.minR) out.minR = r;
        if (r > out.maxR) out.maxR = r;
        if (u < out.minU) out.minU = u;
        if (u > out.maxU) out.maxU = u;
        if (d < out.minD) out.minD = d;
        if (d > out.maxD) out.maxD = d;
      }
    }
  }
  return out;
}

/**
 * How far the shadow lookup is pushed along the surface normal, in *screen
 * pixels* — held constant instead of constant in world units.
 *
 * The old flat 0.02 was added to kill acne from the tighter frustum, but it is
 * a world-space offset, so the 2.5x hero zoom made it 2.5x worse on screen.
 * Worse, 0.02 is exactly `RUNG_RADIUS`: the rungs — the thinnest casters in
 * the scene — had their lookup lifted a full radius clear of the surface,
 * which is why they read as floating rather than joined.
 */
const SHADOW_BIAS_PX = 2;

function normalBiasFor(ppu: number): number {
  return Math.min(0.25 * RUNG_RADIUS, Math.max(0.0015, SHADOW_BIAS_PX / ppu));
}

/**
 * Refit the key light's ortho box to whatever is on screen this beat.
 *
 * Beats 0 to 2 draw one trunk and the map was sized for eight branches, so
 * 2.87x of its 1024² was spent on empty void at exactly the beats the hero is
 * zoomed hardest into. Beat 0's texel drops from 6.91px to 2.41px.
 */
function aimShadow(light: DirectionalLight, generations: number, ppu: number) {
  grownBoxInto(generations, GROWN_BOX);
  const p = projectBoxInto(GROWN_BOX, SHADOW_PROJECTION);
  const cam = light.shadow.camera;
  cam.left = p.minR - SHADOW_SLACK;
  cam.right = p.maxR + SHADOW_SLACK;
  cam.bottom = p.minU - SHADOW_SLACK;
  cam.top = p.maxU + SHADOW_SLACK;
  cam.near = Math.max(0.4, p.minD - SHADOW_SLACK);
  cam.far = p.maxD + SHADOW_SLACK;
  cam.updateProjectionMatrix();
  light.shadow.normalBias = normalBiasFor(ppu);
}

/** Boot fit, before the first frame tightens it. Covers the whole family. */
const SHADOW_FRUSTUM = (() => {
  const p = projectBoxInto(FAMILY_BOX, {
    minR: 0,
    maxR: 0,
    minU: 0,
    maxU: 0,
    minD: 0,
    maxD: 0,
  });
  return {
    left: p.minR - SHADOW_SLACK,
    right: p.maxR + SHADOW_SLACK,
    bottom: p.minU - SHADOW_SLACK,
    top: p.maxU + SHADOW_SLACK,
    near: Math.max(0.4, p.minD - SHADOW_SLACK),
    far: p.maxD + SHADOW_SLACK,
  };
})();

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
    emissiveIntensity: 0.22,
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
    emissiveIntensity: 0.25,
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
    emissiveIntensity: 0.17,
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
      emissiveIntensity: 0.2,
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
    <Environment resolution={256} background={false}>
      {/* Key: a wide soft ceiling panel, the long highlight down each strand. */}
      <Lightformer
        form="rect"
        intensity={2.6}
        color="#c5d4dc"
        position={[0, 7, -3]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[14, 9, 1]}
      />
      {/* Cold rim from behind-left: separates the strands from the void. */}
      <Lightformer
        form="rect"
        intensity={1.3}
        color="#63e7ff"
        position={[-7, 1, -4]}
        rotation={[0, Math.PI / 2, 0]}
        scale={[9, 10, 1]}
      />
      {/* Fill from the family side. Kept cool — a warm panel here is what
          painted the close beat cream. */}
      <Lightformer
        form="rect"
        intensity={1.4}
        color="#3aa9c4"
        position={[6, -5, 2]}
        rotation={[0, -Math.PI / 2, 0]}
        scale={[9, 12, 1]}
      />
    </Environment>
  );
}

/**
 * Background and fog stay on the void. `daylight()` only thins the fog and
 * lifts environment intensity — it must not move the ground colour.
 */
const VOID = new Color('#07090d');

function GroundRig({ state }: { state: React.RefObject<BeatState> }) {
  const { scene } = useThree();
  const fog = useMemo(() => new FogExp2(VOID.getHex(), 0.022), []);
  const ground = useMemo(() => VOID.clone(), []);

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
    const hold = holdProgress(current);

    ground.copy(VOID);
    fog.color.copy(VOID);
    /* eslint-disable react-hooks/immutability -- driving a three.js scene by
       mutating it every frame is what `useFrame` is for; the rule sees a value
       that came from `useMemo`/`useThree` and cannot tell that the whole point
       of these objects is to be written to. Both are torn down in the layout
       effect above. */
    fog.density = 0.022 - day * 0.0125 - hold * 0.006;
    scene.environmentIntensity = 0.22 + day * 0.2 + hold * 0.4;
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
  const violet = useRef<PointLight>(null);
  const sky = useRef<HemisphereLight>(null);
  const rim = useRef<DirectionalLight>(null);

  useFrame(() => {
    const current = state.current;
    if (!current) return;
    const climax = climaxAmount(current);
    const day = daylight(current.progress);
    const hold = holdProgress(current);

    /* White key stays modest on the hold — it was washing the family to bone.
       The lift is the coloured practicals, which keep the specimen acid / cyan
       / violet while pushing more pixels over the luminance gate. */
    if (key.current) key.current.intensity = 2.3 + climax * 1.15 + day * 1.1 + hold * 1.1;
    if (acid.current) acid.current.intensity = 2.4 + climax * 4.4 + hold * 5.4;
    if (violet.current) violet.current.intensity = 1.8 + climax * 2.2 + hold * 4.6;

    if (sky.current) {
      sky.current.intensity = 0.7 + day * 0.55 + hold * 1.7;
      sky.current.groundColor.copy(VOID);
    }
    if (rim.current) rim.current.intensity = 0.7 + hold * 0.55;

    /* Refit the shadow box every frame, not once at module scope. `generations`
       moves continuously and the grown set grows in steps, so this is the only
       way the map tracks what is actually drawn. */
    if (key.current) {
      aimShadow(key.current, current.generations, pixelsPerUnit(current.cameraMultiple));
    }
  });

  return (
    <>
      <GroundRig state={state} />
      <SpecimenEnvironment />
      <hemisphereLight ref={sky} args={['#63e7ff', '#07090d', 0.55]} />
      <directionalLight
        ref={key}
        position={[KEY_LIGHT.x, KEY_LIGHT.y, KEY_LIGHT.z]}
        intensity={1.55}
        color="#f4ffe8"
        castShadow={shadows}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.00035}
        shadow-normalBias={0.25 * RUNG_RADIUS}
        shadow-camera-near={SHADOW_FRUSTUM.near}
        shadow-camera-far={SHADOW_FRUSTUM.far}
        shadow-camera-left={SHADOW_FRUSTUM.left}
        shadow-camera-right={SHADOW_FRUSTUM.right}
        shadow-camera-top={SHADOW_FRUSTUM.top}
        shadow-camera-bottom={SHADOW_FRUSTUM.bottom}
      >
        <object3D
          attach="target"
          position={[SHADOW_BASIS.center.x, SHADOW_BASIS.center.y, SHADOW_BASIS.center.z]}
        />
      </directionalLight>
      <directionalLight ref={rim} position={[-5.4, 1.1, -3.2]} intensity={0.7} color="#63e7ff" />
      <pointLight
        ref={acid}
        position={[0, 2.5, 0.7]}
        color="#b7ff39"
        intensity={2.4}
        distance={10}
        decay={2}
      />
      <pointLight
        ref={violet}
        position={[-4.4, -6.6, 0.5]}
        color="#a985ff"
        intensity={1.8}
        distance={8}
        decay={2}
      />
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
