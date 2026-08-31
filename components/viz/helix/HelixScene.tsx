'use client';

import { Html } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import {
  CatmullRomCurve3,
  Color,
  Matrix4,
  Quaternion,
  TubeGeometry,
  Vector3,
  type BufferGeometry,
  type Group,
  type InstancedMesh,
  type Mesh,
  type MeshStandardMaterial,
} from 'three';
import {
  LOCUS_LABELS,
  STRANDS,
  STRANDS_BY_ID,
  UPSTREAM_PATH,
  FAMILY_HALF_HEIGHT,
  FAMILY_LOOK_LIFT,
  FLATTEN_MIX,
  grownFamilyY,
  applyConvergeInto,
  axisPointAtInto,
  backbonePointAtInto,
  GROW_WIDTH,
  RUNG_RADIUS,
  growthAlong,
  growthJitterAt,
  pathTaper,
  rungDirection,
  rungInset,
  startTaperWidth,
  sampleBackbone,
  strandBasis,
  strandEased,
  type StrandSpec,
} from './strands';
import {
  advanceLive,
  createStrandLive,
  createStrandRings,
  createSweepGeometry,
  liveRadialInto,
  rungCenterInto,
  rungSpanBaked,
  rungSpanInto,
  sampleLiveInto,
  setLivePose,
  sweepInto,
  sweepTuningFor,
  writeCenterlines,
  type StrandLive,
  type StrandRings,
  type SweepBuffers,
  type SweepTuning,
} from './sweep';
import {
  climaxAmount,
  daylight,
  framingZoom,
  holdProgress,
  lookXExtent,
  widthFit,
  type BeatState,
} from './beats';
import {
  climaxEmissive,
  depthMaterialOf,
  patchGrowingMaterial,
  syncOrganic,
  tickClimax,
  tickOrganic,
} from './organic';
import {
  HELIX,
  StudioRig,
  backboneMaterial,
  createHelixMaterials,
  disposeHelixMaterials,
  type HelixMaterials,
} from './studio';

/* Scratch for the per-mesh axis sync below. Safe to share: onBeforeRender runs
   synchronously and the values are consumed before the next call. */
const AXIS_A = new Vector3();
const AXIS_B = new Vector3();

/**
 * Cost of the CPU sweep, in milliseconds.
 *
 * This is **sweep cost only** — the maths that refills the pre-allocated ring
 * stack. It deliberately excludes everything downstream of it: the ~418 KB of
 * `bufferSubData` happens later, inside `gl.render`, and belongs to the GPU
 * upload, not to this number. Read them together or read neither.
 *
 * Two statistics, because each hides what the other catches. The EMA is the
 * headline — one number, no allocation, no per-frame sort. The ring-backed p95
 * is refreshed once every 120 frames (~2 s at 60 fps) and is what exposes a
 * 40 ms GC hitch that an EMA will smooth into invisibility.
 */
const SWEEP_STATS = {
  ema: 0,
  p95: 0,
  n: 0,
  verts: 0,
  at: 0,
  ring: new Float32Array(120),
  sorted: new Float32Array(120),
};

/** ~0.5 s at 60 fps. Long enough to be readable, short enough to react. */
const SWEEP_EMA_ALPHA = 1 / 30;
/** The first frames pay for cold arrays and JIT tiering. Do not report them. */
const SWEEP_WARMUP = 30;
/** DOM writes are the expensive half of publishing. Throttle them. */
const SWEEP_PUBLISH_EVERY = 15;

function resetSweepStats() {
  SWEEP_STATS.ema = 0;
  SWEEP_STATS.p95 = 0;
  SWEEP_STATS.n = 0;
  SWEEP_STATS.verts = 0;
  SWEEP_STATS.at = 0;
  SWEEP_STATS.ring.fill(0);
}

function recordSweep(ms: number, verts: number) {
  const s = SWEEP_STATS;
  s.verts = verts;

  /* Only `always` frames count. A `demand` frame is a one-off fired by a
     scroll or a resize: cold arrays, cold JIT, and a number that would be a
     lie about the steady state. The sweep still runs — only the meter waits. */
  if (typeof window === 'undefined' || window.__HELIX_LOOP !== 'always') return;

  s.ring[s.at] = ms;
  s.at += 1;
  if (s.at >= s.ring.length) {
    s.at = 0;
    /* Typed-array sort is numeric and in place — no comparator allocation. */
    s.sorted.set(s.ring);
    s.sorted.sort();
    s.p95 = s.sorted[Math.floor(s.sorted.length * 0.95)]!;
  }

  s.n += 1;
  if (s.n <= SWEEP_WARMUP) {
    s.ema = ms;
    return;
  }
  s.ema += SWEEP_EMA_ALPHA * (ms - s.ema);
}

let sweepPublishTick = 0;

function publishSweepStats() {
  const s = SWEEP_STATS;
  if (typeof window !== 'undefined') {
    window.__HELIX_SWEEP_MS = s.ema;
    window.__HELIX_SWEEP_P95 = s.p95;
    window.__HELIX_SWEEP_N = s.n;
    window.__HELIX_SWEEP_VERTS = s.verts;
  }
  sweepPublishTick += 1;
  if (sweepPublishTick % SWEEP_PUBLISH_EVERY !== 0) return;
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.helixSweepMs = s.ema.toFixed(2);
  }
}

/** Sticky header height. Chips that project into this band sit under chrome. */
const HEADER_CLEAR = 74;
const EDGE_CLEAR = 8;
/** A chip may slide this far in screen space and still name its locus. */
const MAX_CHIP_NUDGE = 48;
/* FAMILY_LOOK_X is no longer a constant. CameraRig reads `state.lookX`,
   which lerps with data-beat-side: copy left → lineage right (negative). */

const TICK_UP = new Vector3(0, 1, 0);

/**
 * The converge "track" wobble, interpolated into the GLSL below *and* passed
 * to `sweepInto`, so the baked and swept paths braid by the same amount.
 */
const TRACK_WOBBLE = 0.07;

/**
 * `uCpuPose` is the hand-over switch. When the live CPU sweep owns the
 * geometry it has *already* applied this exact collapse and this exact track
 * wobble, so leaving them on would apply both twice. It gates the pair with
 * `(1.0 - uCpuPose)` rather than removing them, which keeps the low tier —
 * which still runs baked `TubeGeometry` — untouched.
 */
function patchTrackConverge(material: MeshStandardMaterial) {
  const rewrite = (shader: {
    uniforms: Record<string, { value: number }>;
    vertexShader: string;
  }) => {
    shader.uniforms.uConverge = { value: 0 };
    shader.uniforms.uCpuPose = { value: 0 };
    shader.vertexShader = shader.vertexShader
      .replace(
        'uniform float uFlatten;',
        'uniform float uFlatten;\n       uniform float uConverge;\n       uniform float uCpuPose;',
      )
      .replace(
        `transformed = mix(transformed, axisPoint, uFlatten * ${FLATTEN_MIX});`,
        [
          'float poseGate = 1.0 - uCpuPose;',
          `float poseW = clamp(uFlatten * ${FLATTEN_MIX} + uConverge, 0.0, 1.0) * poseGate;`,
          'transformed = mix(transformed, axisPoint, poseW);',
          'float trackAng = uv.y * 6.2831853;',
          /* Braid is the transition. A finished ledger is still. */
          `float braid = uConverge * (1.0 - uConverge) * 4.0;`,
          `transformed.y += sin(trackAng) * ${TRACK_WOBBLE} * braid * poseGate;`,
          `transformed.z += cos(trackAng) * ${TRACK_WOBBLE} * braid * poseGate;`,
        ].join('\n       '),
      );
  };

  const previous = material.onBeforeCompile;
  material.onBeforeCompile = (shader, renderer) => {
    previous?.(shader, renderer);
    rewrite(shader);
  };
  material.customProgramCacheKey = () => 'helix-track-converge-braid';

  const depth = material.userData.depthMaterial as MeshStandardMaterial | undefined;
  if (!depth) return;
  const previousDepth = depth.onBeforeCompile;
  depth.onBeforeCompile = (shader, renderer) => {
    previousDepth?.(shader, renderer);
    rewrite(shader);
  };
  depth.customProgramCacheKey = () => 'helix-track-converge-braid-depth';
}

type PoseUniforms = { uConverge?: { value: number }; uCpuPose?: { value: number } };

function writeConverge(material: MeshStandardMaterial, converge: number, cpuPose: number) {
  const write = (uniforms: PoseUniforms | undefined) => {
    if (!uniforms) return;
    if (uniforms.uConverge) uniforms.uConverge.value = converge;
    if (uniforms.uCpuPose) uniforms.uCpuPose.value = cpuPose;
  };

  write((material.userData.shader as { uniforms?: PoseUniforms } | undefined)?.uniforms);
  write(
    (
      material.userData.depthMaterial as
        { userData?: { shader?: { uniforms?: PoseUniforms } } } | undefined
    )?.userData?.shader?.uniforms,
  );
}

const RUNGS_PER_STRAND = 24;
const UPSTREAM_PULSES = 3;

type Quality = { tubular: number; radial: number; radius: number; sphere: number };

const QUALITY: Record<'low' | 'high', Quality> = {
  low: { tubular: 48, radial: 5, radius: 0.034, sphere: 10 },
  /* 120: the 0.035 end taper is ~4.2 segments. 96 was a cut with no frame-cost
     number behind it. `?tubular=` overrides for the capture measurement. */
  high: { tubular: 120, radial: 8, radius: 0.04, sphere: 16 },
};

/**
 * `?tubular=` overrides, for the capture measurement.
 *
 * The result has to be **referentially stable**: `Backbones` keys a `useMemo`
 * on it, and returning a fresh `{ ...base, tubular }` rebuilt all sixteen
 * tube geometries on every render. Callers must memoize on `tier` alone.
 */
function qualityFor(tier: 'low' | 'high'): Quality {
  const base = QUALITY[tier];
  if (tier !== 'high' || typeof window === 'undefined') return base;
  const tubular = Number(new URLSearchParams(window.location.search).get('tubular'));
  if (!Number.isFinite(tubular) || tubular < 32 || tubular > 160) return base;
  return { ...base, tubular: Math.round(tubular) };
}

type Props = {
  state: React.RefObject<BeatState>;
  tier: 'low' | 'high';
  materials: HelixMaterials;
  pointer: React.RefObject<{ x: number; y: number }>;
};

type StrandGeometry = {
  spec: (typeof STRANDS)[number];
  origin: boolean;
  geometries: [BufferGeometry, BufferGeometry];
  curve: CatmullRomCurve3;
  material: MeshStandardMaterial;
};

/** One strand's live sweep: pose state, ring centres, and both rails' buffers. */
type SweepStrand = {
  live: StrandLive;
  rings: StrandRings;
  buffers: [SweepBuffers, SweepBuffers];
};

/**
 * The live sweep, or `null` when the baked tubes still own the geometry —
 * which is both the low tier and `?sweep=0`, so the revert is a real revert
 * and not "the same code with the amplitude dialled down".
 */
type SweepRuntime = {
  tuning: SweepTuning;
  strands: SweepStrand[];
};

/**
 * Shared so rungs, loci, labels and pulses can read the same live pose the
 * tubes just wrote. A ref, not the object itself: `Backbones` creates the
 * runtime in an effect-free memo, and every consumer has to see the *current*
 * frame, not the one that happened to be current when they rendered.
 */
const SweepHolderContext = createContext<React.MutableRefObject<SweepRuntime | null> | null>(
  null,
);

function liveOf(sweep: SweepRuntime | null | undefined, spec: StrandSpec): StrandLive | null {
  if (!sweep) return null;
  const i = STRANDS.findIndex((entry) => entry.id === spec.id);
  const live = i >= 0 ? sweep.strands[i]?.live : undefined;
  return live && live.amp > 0 ? live : null;
}

function radialInto(
  live: StrandLive | null,
  fallback: Vector3,
  t: number,
  target: Vector3,
): Vector3 {
  return live ? liveRadialInto(live, t, target) : target.copy(fallback);
}

/** Pointer lean may pull toward the specimen, never toward the copy. */
const LEAN_CURSOR = { x: 0, y: 0 };

function leanCursor(
  beat: BeatState,
  pointer: { x: number; y: number },
): { x: number; y: number } {
  LEAN_CURSOR.x = pointer.x;
  LEAN_CURSOR.y = pointer.y;
  if (beat.lookX < -0.2) LEAN_CURSOR.x = Math.max(0, LEAN_CURSOR.x);
  if (beat.lookX > 0.2) LEAN_CURSOR.x = Math.min(0, LEAN_CURSOR.x);
  return LEAN_CURSOR;
}

/**
 * One full sweep: pose, advance, re-centreline, re-sweep both rails, flag the
 * buffers dirty.
 *
 * Extracted so the same code can prime the buffers once at creation. That
 * primer is not optional: `createSweepGeometry` hands back zero-filled arrays,
 * and `HelixStage` drops the canvas to `frameloop="demand"` on beats the helix
 * does not own — so a strand would render as a degenerate point at the origin
 * until the first frame happened to run.
 *
 * Returns the number of vertices written, which is what the cost is quoted
 * against — `?tubular=` moves both.
 */
function runSweep(
  sweep: SweepRuntime,
  strands: StrandGeometry[],
  radius: number,
  beat: BeatState,
  delta: number,
  time: number,
  cursor: { x: number; y: number },
): number {
  /* Braid is the transition into the column. A finished ledger is still —
     `c * (1-c) * 4` peaks at the same 0.07 the shader used to hold at c = 1. */
  const track = beat.converge * (1 - beat.converge) * 4 * TRACK_WOBBLE;
  const ledger = {
    ...sweep.tuning,
    amplitude: sweep.tuning.amplitude * (1 - beat.converge),
  };

  let swept = 0;

  sweep.strands.forEach((entry, i) => {
    const strand = strands[i];
    if (!strand) return;
    const { live, rings, buffers } = entry;

    setLivePose(
      live,
      beat.flatten,
      beat.converge,
      strandEased(beat.generations, strand.spec.generation),
    );
    advanceLive(live, delta, time, leanCursor(beat, cursor), ledger);
    writeCenterlines(live, rings, radius, ledger);

    /* Scaled by `amplitude` like wobble, lean and the radius waves, so
       `?sweepAmp=` really is one master scalar and not five. */
    const lump = ledger.lump * ledger.amplitude;

    sweepInto(buffers[0], rings.centersA, rings.radii, rings.phases, lump, live.basis.u, track);
    sweepInto(buffers[1], rings.centersB, rings.radii, rings.phases, lump, live.basis.u, track);

    buffers[0].positionAttribute.needsUpdate = true;
    buffers[0].normalAttribute.needsUpdate = true;
    buffers[1].positionAttribute.needsUpdate = true;
    buffers[1].normalAttribute.needsUpdate = true;

    swept += buffers[0].positionAttribute.count + buffers[1].positionAttribute.count;
    live.frame += 1;
  });

  return swept;
}

/** `tickClimax` writes values that fill the contact the shadow map is for. */
const EMISSIVE_SHADOW_READ = 0.4;

function OrganicTicker({
  materials,
  pointer,
  drift,
  state,
}: {
  materials: HelixMaterials;
  pointer: React.RefObject<{ x: number; y: number }>;
  drift: number;
  state: React.RefObject<BeatState>;
}) {
  useFrame(({ clock }) => {
    const time = clock.elapsedTime;
    const current = state.current;
    const climax = current ? climaxAmount(current) : 0;

    tickOrganic(materials.backboneOrigin, time, drift, pointer.current);
    tickOrganic(materials.backboneMutated, time, drift, pointer.current);
    tickOrganic(materials.backboneDescendant, time, drift, pointer.current);
    /* `tickClimax` lives in closed `organic.ts`. Scale here so Lambert and
       the one shadow map can show strand-on-rung contact. Colour stays. */
    tickClimax(materials, climax, daylight(current?.progress ?? 0));
    /* eslint-disable react-hooks/immutability -- three.js materials are
       mutated every frame; that is what `useFrame` is for. */
    materials.backboneOrigin.emissiveIntensity *= EMISSIVE_SHADOW_READ;
    materials.backboneMutated.emissiveIntensity *= EMISSIVE_SHADOW_READ;
    materials.backboneDescendant.emissiveIntensity *= EMISSIVE_SHADOW_READ;
    materials.rung.emissiveIntensity *= EMISSIVE_SHADOW_READ;
    /* eslint-enable react-hooks/immutability */
  });

  return null;
}

/* ------------------------------------------------------------- backbones */

function Backbones({ state, tier, materials, pointer }: Props) {
  const quality = useMemo(() => qualityFor(tier), [tier]);
  const holderRef = useContext(SweepHolderContext);

  const strands = useMemo<StrandGeometry[]>(
    () =>
      STRANDS.map((spec) => {
        const build = (phase: number) => {
          const curve = new CatmullRomCurve3(
            sampleBackbone(spec, phase, quality.tubular, 0),
            false,
            'catmullrom',
            0.5,
          );
          return new TubeGeometry(
            curve,
            quality.tubular,
            quality.radius,
            quality.radial,
            false,
          );
        };

        const role = backboneMaterial(materials, spec.generation, spec.origin ?? false);
        const material = role.clone();
        patchGrowingMaterial(
          material,
          spec.id,
          spec.generation === 0 ? HELIX.acid : spec.origin ? HELIX.violet : HELIX.cyan,
        );
        patchTrackConverge(material);

        return {
          spec,
          origin: spec.origin ?? false,
          geometries: [build(0), build(Math.PI)] as [BufferGeometry, BufferGeometry],
          curve: new CatmullRomCurve3(
            sampleBackbone(spec, 0, Math.min(24, quality.tubular), 0),
            false,
          ),
          material,
        };
      }),
    [quality, materials],
  );

  const sweep = useMemo<SweepRuntime | null>(() => {
    /* Low tier keeps the baked `TubeGeometry` and the shader's own drift: the
       sweep is a high-tier effect, and `?sweep=0` is what reverts it there. */
    if (tier !== 'high') return null;
    const tuning = sweepTuningFor(typeof window === 'undefined' ? '' : window.location.search);
    if (tuning.amplitude <= 0) return null;
    const runtime: SweepRuntime = {
      tuning,
      strands: STRANDS.map((spec) => ({
        live: createStrandLive(spec, quality.tubular),
        rings: createStrandRings(quality.tubular),
        buffers: [
          createSweepGeometry(quality.tubular, quality.radial),
          createSweepGeometry(quality.tubular, quality.radial),
        ] as [SweepBuffers, SweepBuffers],
      })),
    };

    return runtime;
  }, [tier, quality]);

  useEffect(() => {
    return () => {
      strands.forEach((strand) => {
        strand.geometries[0].dispose();
        strand.geometries[1].dispose();
        strand.material.userData.depthMaterial?.dispose?.();
        strand.material.dispose();
      });
    };
  }, [strands]);

  /**
   * Prime the buffers before the first paint.
   *
   * A layout effect, not a plain effect: it has to land before the first
   * rAF-driven R3F frame, or the strands are briefly sixteen points stacked at
   * the origin. It also cannot move into the `useMemo` above — reading
   * `state.current` during render is impure, and the React Compiler rejects it.
   */
  useLayoutEffect(() => {
    if (holderRef) holderRef.current = sweep;
    if (!sweep) return;
    runSweep(sweep, strands, quality.radius, state.current, 0, 0, pointer.current);
  }, [sweep, strands, quality, state, pointer, holderRef]);

  useEffect(() => {
    if (!sweep) return;
    /* A `?tubular=` change is a different sweep. The old number describes
       buffers that are about to be disposed, so it must not survive. */
    resetSweepStats();
    return () => {
      if (holderRef && holderRef.current === sweep) holderRef.current = null;
      sweep.strands.forEach((entry) => {
        entry.buffers[0].geometry.dispose();
        entry.buffers[1].geometry.dispose();
      });
    };
  }, [sweep, holderRef]);

  const group = useRef<Mesh[]>([]);

  /**
   * Priority **-1**: R3F sorts subscribers ascending, and only *positive*
   * priorities disable auto-rendering — so this runs before every default
   * callback while the renderer still draws by itself.
   *
   * That ordering is the point. `GrowingTips`, `Rungs`, `Loci` and `Pulses`
   * all read the live centrelines later in the same frame; run them against
   * last frame's buffers and every attached element lags the tube it is
   * attached to by one frame, which reads as the helix coming apart at the
   * seams while it moves.
   */
  useFrame(({ clock }, delta) => {
    const current = state.current;

    /* No sweep (`?sweep=0`, or low tier) must read exactly zero. That zero is
       what proves the revert is real rather than merely quieter. */
    if (!sweep || !current) {
      if (SWEEP_STATS.n !== 0 || SWEEP_STATS.ema !== 0) resetSweepStats();
      publishSweepStats();
      return;
    }

    /* Timed here, not inside `runSweep`, so the number is one sweep and only
       one sweep: the priming `useLayoutEffect` call (cold arrays, cold JIT)
       and the layout pass that reads the buffers afterwards are both outside
       the measured window. */
    const started = performance.now();
    const verts = runSweep(
      sweep,
      strands,
      quality.radius,
      current,
      delta,
      clock.elapsedTime,
      pointer.current,
    );
    recordSweep(performance.now() - started, verts);
    publishSweepStats();
  }, -1);

  useFrame(({ clock }) => {
    const current = state.current;
    if (!current) return;
    const time = clock.elapsedTime;

    const climax = climaxAmount(current);

    strands.forEach((strand, i) => {
      const eased = strandEased(current.generations, strand.spec.generation);
      tickOrganic(strand.material, time, tier === 'high' ? 1 : 0, pointer.current);
      strand.material.emissiveIntensity = climaxEmissive(
        strand.spec.generation,
        strand.origin,
        climax,
        daylight(current.progress),
      );
      const visible = eased > 0.012;
      for (let side = 0; side < 2; side += 1) {
        const mesh = group.current[i * 2 + side];
        if (!mesh) continue;
        mesh.visible = visible;
      }
    });
  });

  return (
    <>
      {strands.map((strand, i) =>
        strand.geometries.map((geometry, side) => (
          <mesh
            key={`${strand.spec.id}-${side}`}
            ref={(node) => {
              if (node) group.current[i * 2 + side] = node;
            }}
            geometry={sweep ? sweep.strands[i]!.buffers[side]!.geometry : geometry}
            material={strand.material}
            customDepthMaterial={depthMaterialOf(strand.material)}
            castShadow
            receiveShadow
            /* The swept buffer is rewritten in world space every frame, so any
               bounding sphere would be stale the moment it was computed — and
               `projectObject` skips `Frustum.intersectsObject` entirely for a
               non-culled object, so no sphere is ever needed. This is the
               honest alternative to the reference's `boundingSphere = 1e5`,
               which defeats culling with a sphere that lies. */
            frustumCulled={!sweep}
            onBeforeRender={() => {
              const current = state.current;
              if (!current) return;
              /* The axis handed to the shader has to be the SAME axis every
                 other element collapses onto. `axisPointAtInto` additionally
                 squashes depth by `1 - flatten * 0.85`; passing the raw
                 start/end here meant the tubes collapsed toward a line at full
                 Z while the rungs, loci and labels collapsed toward a line at
                 z * 0.388 — so the dots visibly came off their strands on the
                 closing beat. */
              axisPointAtInto(strand.spec, 0, current.flatten, AXIS_A);
              axisPointAtInto(strand.spec, 1, current.flatten, AXIS_B);
              applyConvergeInto(strand.spec, current.converge, AXIS_A, 0);
              applyConvergeInto(strand.spec, current.converge, AXIS_B, 1);
              writeConverge(strand.material, current.converge, sweep ? 1 : 0);
              syncOrganic(strand.material, {
                grow: strandEased(current.generations, strand.spec.generation),
                flatten: current.flatten,
                start: AXIS_A,
                end: AXIS_B,
                startTaper: startTaperWidth(strand.spec.generation),
                seed: strand.spec.seed,
              });
            }}
          />
        )),
      )}
      <GrowingTips strands={strands} state={state} materials={materials} sweep={sweep} />
    </>
  );
}

function GrowingTips({
  strands,
  state,
  materials,
  sweep,
}: {
  strands: StrandGeometry[];
  state: React.RefObject<BeatState>;
  materials: HelixMaterials;
  sweep: SweepRuntime | null;
}) {
  const mesh = useRef<InstancedMesh>(null);
  const scratch = useMemo(
    () => ({
      matrix: new Matrix4(),
      position: new Vector3(),
      axis: new Vector3(),
      quaternion: new Quaternion(),
      scale: new Vector3(),
    }),
    [],
  );

  useFrame(() => {
    const node = mesh.current;
    const current = state.current;
    if (!node || !current) return;
    const { matrix, position, axis, quaternion, scale } = scratch;

    strands.forEach((strand, i) => {
      /* Half the live jitter: sit on the frontier, not ahead of a receding
         noise field. The trail vanishes at grow = 1 so a finished tip rests
         on a real end, not a stub. */
      const grow = strandEased(current.generations, strand.spec.generation);
      const eased = grow - growthJitterAt(grow);
      const t = Math.min(0.999, Math.max(0, eased));
      const live = liveOf(sweep, strand.spec);
      if (live) {
        /* The live rail already carries flatten, converge, screw, wobble and
           lean. A second lerp toward the axis would collapse twice. */
        sampleLiveInto(live, 0, t, position);
      } else {
        strand.curve.getPoint(t, position);
        axisPointAtInto(strand.spec, t, current.flatten, axis);
        applyConvergeInto(strand.spec, current.converge, axis, t);
        /* Follow the tube as it tapers onto the axis, then as flatten collapses
           the whole strand. Otherwise the tip sits on the full-radius helix
           while the backbone has already closed to a point. */
        const taper = pathTaper(t, eased, startTaperWidth(strand.spec.generation));
        position.lerp(axis, 1 - taper * (1 - current.flatten));
        applyConvergeInto(strand.spec, current.converge, position, t);
      }
      const growing = eased > 0.03 && eased < 0.985;
      const settled = eased >= 0.985 ? 0.046 : 0;
      scale.setScalar(growing ? 0.068 : settled);
      matrix.compose(position, quaternion, scale);
      node.setMatrixAt(i, matrix);
    });

    node.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={mesh}
      args={[undefined, undefined, strands.length]}
      frustumCulled={false}
      material={materials.locus}
    >
      <sphereGeometry args={[1, 12, 12]} />
    </instancedMesh>
  );
}

/* ----------------------------------------------------------------- rungs */

function Rungs({ state, materials, tier }: Pick<Props, 'state' | 'materials' | 'tier'>) {
  const mesh = useRef<InstancedMesh>(null);
  const holderRef = useContext(SweepHolderContext);
  const tubeRadius = QUALITY[tier].radius;
  const total = STRANDS.length * RUNGS_PER_STRAND;

  const slots = useMemo(
    () =>
      STRANDS.flatMap((spec) => {
        const basis = strandBasis(spec);
        return Array.from({ length: RUNGS_PER_STRAND }, (_, i) => {
          const inset = rungInset(spec.generation);
          const t =
            inset.start + ((i + 0.5) / RUNGS_PER_STRAND) * (1 - inset.start - inset.end);
          return { spec, t, direction: rungDirection(spec, basis, t) };
        });
      }),
    [],
  );

  const scratch = useMemo(
    () => ({
      matrix: new Matrix4(),
      position: new Vector3(),
      quaternion: new Quaternion(),
      scale: new Vector3(),
      up: new Vector3(0, 1, 0),
      direction: new Vector3(),
      other: new Vector3(),
    }),
    [],
  );

  useFrame(({ clock }) => {
    const node = mesh.current;
    const current = state.current;
    if (!node || !current) return;

    const time = clock.elapsedTime;

    slots.forEach((slot, i) => {
      const grow = strandEased(current.generations, slot.spec.generation);
      const eased = grow - growthJitterAt(grow);
      const front = growthAlong(eased, slot.t);
      const { matrix, position, quaternion, scale, up, direction } = scratch;
      const live = liveOf(holderRef?.current, slot.spec);

      if (live) {
        /* Between the two rails, not on the axis. The axis is where the
           strand collapses *to*; the rails only follow it by `w`, so at
           `flatten > 0` the rung would hang off the ladder it is meant to be
           a step of. `?sweep=0` and the low tier keep the axis below. */
        rungCenterInto(live, slot.t, position);
      } else {
        axisPointAtInto(slot.spec, slot.t, current.flatten, position);
        applyConvergeInto(slot.spec, current.converge, position, slot.t);
      }

      /* Direction stays analytic. `rungDirection` is radial at any `t`, so it
         can never degenerate — taking it from `p1 - p0` would emit NaN
         matrices at `converge = 1`, where the two rails coincide. The screw is
         folded in separately below. */
      radialInto(live, slot.direction, slot.t, direction);
      direction.lerp(TICK_UP, current.converge).normalize();
      quaternion.setFromUnitVectors(up, direction);

      const breathe = 1 + Math.sin(time * 1.1 + i * 0.7) * 0.06 * (1 - current.flatten);
      const sweep = holderRef?.current;
      const railSpan = live
        ? rungSpanInto(live, slot.t, tubeRadius, sweep?.tuning)
        : rungSpanBaked(slot.spec, current.flatten, current.converge, tubeRadius);
      /* Same end / growth profile as the tube. A full-width rung on a
         needle-thin backbone is the floating dash at every terminus.
         Converge still collapses the ledger — this is a layout, not a vine. */
      const taper = pathTaper(slot.t, eased, startTaperWidth(slot.spec.generation));
      /* `breathe` belongs on the thickness, not the length.

         A rung's length is fully determined by geometry: it has to span the two
         rails plus the bury that sinks each cap into them. That bury is
         `RUNG_BURY * tubeRadius` — 5.89% of the span — so the old +/-6% length
         pulse was larger than the entire margin it was eating. At the bottom of
         the cycle the tip stopped 0.8px short of the rail centreline; at the
         top it punched 7.8px out through the far wall of the backbone.

         Breathing the thickness reads the same and cannot detach anything. */
      scale.set(breathe, railSpan * front * taper * (1 - current.converge * 0.82), breathe);

      matrix.compose(position, quaternion, scale);
      node.setMatrixAt(i, matrix);
    });

    node.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={mesh}
      args={[undefined, undefined, total]}
      frustumCulled={false}
      material={materials.rung}
      castShadow
      receiveShadow
    >
      <cylinderGeometry args={[RUNG_RADIUS, RUNG_RADIUS, 1, 8]} />
    </instancedMesh>
  );
}

/* ------------------------------------------------------------------ loci */

function Loci({ state, tier, materials }: Props) {
  const mesh = useRef<InstancedMesh>(null);
  const holderRef = useContext(SweepHolderContext);
  const quality = QUALITY[tier];

  const slots = useMemo(
    () =>
      STRANDS.flatMap((spec) => {
        const basis = strandBasis(spec);
        const genes = Array.from({ length: spec.loci }, (_, i) => {
          const t = (i + 0.5) / spec.loci;
          return {
            spec,
            t,
            direction: rungDirection(spec, basis, t),
            mutated: (spec.origin ?? false) && i === spec.loci - 2,
            seed: (i * 2.399963 + spec.generation * 0.7) % (Math.PI * 2),
            kind: 'gene' as const,
          };
        });
        const junctions = ([0, 1] as const).map((t) => ({
          spec,
          t,
          direction: rungDirection(spec, basis, t),
          mutated: false,
          seed: t * 4.1 + spec.generation,
          kind: 'junction' as const,
        }));
        return [...junctions, ...genes];
      }),
    [],
  );

  const scratch = useMemo(
    () => ({
      matrix: new Matrix4(),
      position: new Vector3(),
      quaternion: new Quaternion(),
      scale: new Vector3(),
      color: new Color(),
      alarm: new Color(),
      direction: new Vector3(),
    }),
    [],
  );

  useFrame(({ clock }) => {
    const node = mesh.current;
    const current = state.current;
    if (!node || !current) return;

    const time = clock.elapsedTime;

    slots.forEach((slot, i) => {
      const grow = strandEased(current.generations, slot.spec.generation);
      const eased = grow - growthJitterAt(grow);
      const overshoot = slot.kind === 'junction' && slot.t === 1 && grow >= 1 ? GROW_WIDTH : 0;
      const front = growthAlong(eased, slot.t, overshoot);
      const { matrix, position, quaternion, scale, color, alarm, direction } = scratch;
      const live = liveOf(holderRef?.current, slot.spec);

      if (slot.kind === 'gene' && live) {
        sampleLiveInto(live, 0, slot.t, position);
      } else {
        axisPointAtInto(slot.spec, slot.t, current.flatten, position);
        applyConvergeInto(slot.spec, current.converge, position, slot.t);
        if (slot.kind === 'gene') {
          position.addScaledVector(slot.direction, slot.spec.radius * (1 - current.flatten));
        }
      }

      radialInto(live, slot.direction, slot.t, direction);

      const agentLocus =
        slot.kind === 'gene' &&
        slot.spec.generation > 0 &&
        Math.floor(slot.t * slot.spec.loci) % 2 === 0;
      if (agentLocus) {
        position.addScaledVector(direction, slot.spec.radius * 0.45 * current.agents);
      }
      if (slot.mutated) {
        position.addScaledVector(direction, 0.08 * current.mutate);
      }

      const pulse =
        1 + Math.sin(time * 2 + slot.seed) * (slot.kind === 'junction' ? 0.06 : 0.16);
      const terminal = slot.kind === 'junction' && slot.t === 1;
      const emphasis = slot.mutated
        ? 1.7 + current.upstream * 0.6 + current.recovery * 0.4
        : terminal
          ? 1.2
          : slot.kind === 'junction'
            ? 1.45
            : 1;
      const focus = slot.kind === 'gene' ? 0.4 + current.geneFocus * 0.6 : 1;
      /* Loci grow as the helix flattens. The closing beat collapses the
         structure toward a line, which sheds visual mass exactly where the
         story peaks; the nodes carrying that mass have to compensate. */
      const bulk = 1 + current.flatten * 0.5;
      const size =
        (slot.kind === 'junction' ? 0.15 : 0.055) * pulse * emphasis * front * bulk * focus;

      const alarmed =
        slot.mutated ||
        (slot.spec.origin === true && slot.kind === 'gene') ||
        (slot.spec.id === 'tutor' && slot.kind === 'gene');
      if (alarmed && current.alarm > 0) {
        scale.set(
          size * (1 + current.alarm * 0.55),
          size * (1 - current.alarm * 0.5),
          size * (1 + current.alarm * 0.55),
        );
      } else {
        scale.setScalar(size);
      }

      matrix.compose(position, quaternion, scale);
      node.setMatrixAt(i, matrix);

      if (slot.spec.generation === 0) {
        color.copy(HELIX.acid).lerp(HELIX.cyan, slot.kind === 'junction' ? 0.08 : 0.22);
      } else {
        color.copy(HELIX.cyan).lerp(HELIX.dim, 0.42 - current.inheritance * 0.36);
      }
      if (terminal) color.lerp(HELIX.acid, 0.28);
      if (slot.mutated && current.mutate > 0) color.lerp(HELIX.violet, current.mutate);
      if (agentLocus && current.agents > 0) color.lerp(HELIX.violet, current.agents * 0.55);
      if (alarmed && current.alarm > 0) {
        alarm.copy(HELIX.amber).lerp(HELIX.rose, current.alarm);
        color.lerp(alarm, current.alarm);
      }
      if (
        (slot.mutated ||
          (slot.spec.generation === 0 && slot.kind === 'junction' && slot.t === 0)) &&
        current.recovery > 0
      ) {
        color.lerp(HELIX.acid, current.recovery);
      }
      node.setColorAt(i, color);
    });

    node.instanceMatrix.needsUpdate = true;
    if (node.instanceColor) node.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={mesh}
      args={[undefined, undefined, slots.length]}
      frustumCulled={false}
      material={materials.locus}
    >
      <sphereGeometry args={[1, quality.sphere, quality.sphere]} />
    </instancedMesh>
  );
}

/* --------------------------------------------------------- locus labels */

/**
 * Screen-space pin. The 3D point stays on the locus; the chip may slide a
 * few pixels so it does not sit under the header or clip the frame. Past
 * `MAX_CHIP_NUDGE` the name would be lying, and the caller hides it.
 */
function chipNudgeInto(
  rect: DOMRect,
  applied: { x: number; y: number },
  target: { x: number; y: number },
): { x: number; y: number } {
  const top = rect.top - applied.y;
  const left = rect.left - applied.x;
  const right = rect.right - applied.x;
  target.x = 0;
  target.y = 0;
  if (top < HEADER_CLEAR) target.y = HEADER_CLEAR - top;
  if (right > window.innerWidth - EDGE_CLEAR) {
    target.x = window.innerWidth - EDGE_CLEAR - right;
  } else if (left < EDGE_CLEAR) {
    target.x = EDGE_CLEAR - left;
  }
  if (Math.abs(target.x) > MAX_CHIP_NUDGE) target.x = 0;
  if (Math.abs(target.y) > MAX_CHIP_NUDGE) target.y = 0;
  return target;
}

function labelHitsChrome(box: {
  top: number;
  left: number;
  right: number;
  width: number;
  height: number;
}): boolean {
  if (box.width < 2 || box.height < 2) return false;
  if (box.top < HEADER_CLEAR - 0.5) return true;
  if (box.left < EDGE_CLEAR - 0.5) return true;
  if (box.right > window.innerWidth - EDGE_CLEAR + 0.5) return true;
  return false;
}

function LocusLabels({ state }: Pick<Props, 'state'>) {
  const holderRef = useContext(SweepHolderContext);
  const anchors = useMemo(
    () =>
      LOCUS_LABELS.flatMap((label) => {
        const spec = STRANDS_BY_ID.get(label.strand);
        if (!spec) return [];
        const basis = strandBasis(spec);
        const t = (label.index + 0.5) / spec.loci;
        return [{ label, spec, t, direction: rungDirection(spec, basis, t) }];
      }),
    [],
  );

  const groups = useRef<(HTMLDivElement | null)[]>([]);
  const frames = useRef<(Group | null)[]>([]);
  const lastOpacity = useRef<number[]>([]);
  const nudges = useRef<{ x: number; y: number }[]>([]);
  const scratch = useMemo(
    () => ({
      position: new Vector3(),
      direction: new Vector3(),
      nudge: { x: 0, y: 0 },
    }),
    [],
  );

  useFrame(() => {
    const current = state.current;
    if (!current) return;

    anchors.forEach((anchor, i) => {
      const node = groups.current[i];
      const frame = frames.current[i];
      if (frame) {
        const live = liveOf(holderRef?.current, anchor.spec);
        const { position, direction } = scratch;
        if (live) {
          sampleLiveInto(live, 0, anchor.t, position);
          liveRadialInto(live, anchor.t, direction);
          /* Live sample is already on the rail. The extra 0.9·radius keeps
             the chip outside the tube, matching the baked 1.9·radius offset
             from the axis. */
          position.addScaledVector(direction, anchor.spec.radius * 0.9 * (1 - current.flatten));
        } else {
          axisPointAtInto(anchor.spec, anchor.t, current.flatten, position);
          applyConvergeInto(anchor.spec, current.converge, position, anchor.t);
          position.addScaledVector(
            anchor.direction,
            anchor.spec.radius * 1.9 * (1 - current.flatten),
          );
        }
        /* Keep the chip on the specimen side of the locus. */
        if (current.flatten < 0.95 && current.lookX !== 0) {
          position.x += Math.sign(-current.lookX) * anchor.spec.radius * 0.55;
        }
        frame.position.copy(position);
      }
      if (!node) return;

      const grow = strandEased(current.generations, anchor.spec.generation);
      const eased = grow - growthJitterAt(grow);
      const front = growthAlong(eased, anchor.t);
      /* geneFocus fades labels in. Converge and zoomOut fade them out — the
         machine ledger is eight tracks, not six chips on the origin strand. */
      const reveal =
        current.geneFocus * (1 - holdProgress(current) * 0.9) * (1 - current.converge);
      let opacity =
        front > 0.55 ? Math.round(Math.min(1, (front - 0.55) / 0.45) * reveal * 100) / 100 : 0;
      const prev = nudges.current[i] ?? { x: 0, y: 0 };
      const rect = node.getBoundingClientRect();
      chipNudgeInto(rect, prev, scratch.nudge);
      const nx = scratch.nudge.x;
      const ny = scratch.nudge.y;
      if (prev.x !== nx || prev.y !== ny) {
        nudges.current[i] = { x: nx, y: ny };
        node.style.transform = nx || ny ? `translate(${nx}px, ${ny}px)` : '';
      }
      const predicted = {
        top: rect.top - prev.y + ny,
        left: rect.left - prev.x + nx,
        right: rect.right - prev.x + nx,
        width: rect.width,
        height: rect.height,
      };
      /* Copy half, header, or a frame edge the chip cannot reach without
         leaving its locus — hide. Do not slide into the reading field. */
      if (opacity > 0.02) {
        if (current.side !== 'full') {
          const mid = window.innerWidth * 0.5;
          if (current.side === 'left' ? predicted.left < mid : predicted.right > mid) {
            opacity = 0;
          }
        }
        if (opacity > 0.02 && labelHitsChrome(predicted)) opacity = 0;
      }
      const mark = node.querySelector('[data-locus-mark]');
      if (mark) {
        mark.textContent = current.recovery > 0.45 && anchor.label.mutated ? '✓' : '';
      }
      if (lastOpacity.current[i] === opacity) return;
      lastOpacity.current[i] = opacity;
      node.style.opacity = String(opacity);
      node.style.visibility = opacity < 0.02 ? 'hidden' : 'visible';
    });
  });

  return (
    <>
      {anchors.map((anchor, i) => (
        <group
          key={`${anchor.label.strand}-${anchor.label.index}`}
          ref={(node) => {
            frames.current[i] = node;
          }}
        >
          <Html center zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
            <div
              ref={(node) => {
                groups.current[i] = node;
              }}
              className="group/locus relative w-max opacity-0"
            >
              <button
                type="button"
                /* Opaque void plate. The scene stays dark; a translucent chip
                   disappeared into the tubes. */
                className={`bg-void inline-flex items-center gap-1.5 rounded-xs border px-1.5 py-[3px] font-mono text-[9px] tracking-[0.14em] uppercase hover:border-current focus-visible:border-current ${
                  anchor.label.mutated
                    ? 'border-violet/50 text-violet'
                    : 'border-acid/30 text-acid'
                }`}
                style={{ pointerEvents: 'auto' }}
              >
                <span
                  aria-hidden="true"
                  data-locus-mark
                  className="size-[3px] rounded-full bg-current text-[8px] leading-none"
                />
                {anchor.label.short}
              </button>

              <div className="border-line bg-void pointer-events-none absolute top-full left-0 mt-1.5 hidden w-max max-w-[220px] rounded-xs border p-2 group-focus-within/locus:block group-hover/locus:block">
                <p className="text-text text-[12px] font-semibold">{anchor.label.gene}</p>
                <p className="text-muted mt-0.5 text-[11px]">{anchor.label.origin}</p>
                <p className="text-muted mt-1 font-mono text-[10px]">
                  {anchor.label.accession}
                </p>
              </div>
            </div>
          </Html>
        </group>
      ))}
    </>
  );
}

/* --------------------------------------------------------------- pulses */

function Pulses({ state, tier, materials }: Props) {
  const down = useRef<InstancedMesh>(null);
  const up = useRef<InstancedMesh>(null);
  const holderRef = useContext(SweepHolderContext);
  const quality = QUALITY[tier];

  const downSlots = useMemo(
    () =>
      STRANDS.filter((spec) => spec.generation > 0).map((spec) => ({
        spec,
        basis: strandBasis(spec),
      })),
    [],
  );

  const upSlots = useMemo(
    () =>
      UPSTREAM_PATH.map((id) => {
        const spec = STRANDS.find((entry) => entry.id === id);
        if (!spec) return null;
        return { spec, basis: strandBasis(spec) };
      }).filter(
        (
          entry,
        ): entry is { spec: (typeof STRANDS)[number]; basis: ReturnType<typeof strandBasis> } =>
          Boolean(entry),
      ),
    [],
  );

  const scratch = useMemo(
    () => ({
      matrix: new Matrix4(),
      position: new Vector3(),
      quaternion: new Quaternion(),
      scale: new Vector3(),
    }),
    [],
  );

  useFrame(({ clock }) => {
    const current = state.current;
    if (!current) return;
    const time = clock.elapsedTime;
    const { matrix, position, quaternion, scale } = scratch;

    const downNode = down.current;
    if (downNode) {
      downSlots.forEach((slot, i) => {
        const raw = (time * 0.34 + i * 0.21) % 1;
        const t = raw + (1 - 2 * raw) * current.rewind;
        const live = liveOf(holderRef?.current, slot.spec);
        if (live) {
          sampleLiveInto(live, 0, t, position);
        } else {
          backbonePointAtInto(slot.spec, slot.basis, 0, t, current.flatten, position);
          applyConvergeInto(slot.spec, current.converge, position, t);
        }
        const edge = Math.min(1, Math.min(t, 1 - t) * 7);
        const grow = strandEased(current.generations, slot.spec.generation);
        const grown = growthAlong(grow - growthJitterAt(grow), t);
        const feed = current.inheritance + current.sources * (1 - t) * 0.85;
        scale.setScalar(0.036 * edge * feed * grown);
        matrix.compose(position, quaternion, scale);
        downNode.setMatrixAt(i, matrix);
      });
      downNode.instanceMatrix.needsUpdate = true;
    }

    const upNode = up.current;
    if (upNode && upSlots.length > 0) {
      for (let i = 0; i < UPSTREAM_PULSES; i += 1) {
        const raw = (time * 0.2 + i / UPSTREAM_PULSES) % 1;
        const t = raw + (1 - 2 * raw) * current.rewind;
        const scaled = (1 - t) * upSlots.length;
        const index = Math.min(upSlots.length - 1, Math.floor(scaled));
        const local = scaled - index;
        const slot = upSlots[index];
        if (!slot) continue;
        axisPointAtInto(slot.spec, local, current.flatten, position);
        applyConvergeInto(slot.spec, current.converge, position, local);
        const edge = Math.min(1, Math.min(t, 1 - t) * 5);
        scale.setScalar(0.062 * edge * current.upstream);
        matrix.compose(position, quaternion, scale);
        upNode.setMatrixAt(i, matrix);
      }
      upNode.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <>
      <instancedMesh
        ref={down}
        args={[undefined, undefined, Math.max(1, downSlots.length)]}
        frustumCulled={false}
        material={materials.pulseDown}
      >
        <sphereGeometry args={[1, quality.sphere, quality.sphere]} />
      </instancedMesh>

      <instancedMesh
        ref={up}
        args={[undefined, undefined, UPSTREAM_PULSES]}
        frustumCulled={false}
        material={materials.pulseUp}
      >
        <sphereGeometry args={[1, quality.sphere, quality.sphere]} />
      </instancedMesh>
    </>
  );
}

/* --------------------------------------------------------------- camera */

function CameraRig({
  state,
  pointer,
}: {
  state: React.RefObject<BeatState>;
  pointer: React.RefObject<{ x: number; y: number }>;
}) {
  const { camera } = useThree();
  const settled = useRef(false);
  const target = useMemo(
    () => new Vector3(-lookXExtent(), grownFamilyY(1) + FAMILY_LOOK_LIFT, 0),
    [],
  );
  const desired = useMemo(() => new Vector3(), []);
  const lookAt = useMemo(() => new Vector3(), []);
  /* Read once. `?zoom=` scales the distance so framing can be swept without
     recompiling; the query string is not a per-frame concern. */
  const zoom = useMemo(() => framingZoom(), []);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      pointer.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = -((event.clientY / window.innerHeight) * 2 - 1);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    return () => window.removeEventListener('pointermove', handlePointerMove);
  }, [pointer]);

  useFrame((_, delta) => {
    const current = state.current;
    if (!current) return;
    const orbit = 1 - current.flatten;
    /* Distance is a multiple of the fit already computed here. No 0.82 fudge.
       lookX follows the reading side so the lineage never sits on the copy. */
    const fov = 'fov' in camera ? (camera.fov as number) : 42;
    const fit = FAMILY_HALF_HEIGHT / Math.tan((fov * Math.PI) / 360);
    const z = fit * current.cameraMultiple * zoom * widthFit();
    const lookY = grownFamilyY(current.generations) + FAMILY_LOOK_LIFT;
    const lookX = current.lookX;

    /* Pointer may orbit toward the specimen, never toward the copy. */
    let orbitX = pointer.current.x * 0.48 * orbit;
    if (lookX < -0.2) orbitX = Math.max(0, orbitX);
    if (lookX > 0.2) orbitX = Math.min(0, orbitX);

    desired.set(lookX + orbitX, lookY + pointer.current.y * 0.24 * orbit, z);
    lookAt.set(lookX, lookY, 0);

    const snap = window.__HELIX_SNAP === true || !settled.current;
    settled.current = true;
    if (window.__HELIX_SNAP === true) window.__HELIX_SNAP = false;
    const lerp = snap ? 1 : Math.min(1, delta * 3.2);
    camera.position.lerp(desired, lerp);
    target.lerp(lookAt, lerp);
    camera.lookAt(target);
    window.__HELIX_CAM_Z = camera.position.z;
  });

  return null;
}

/* --------------------------------------------------------------- export */

export function HelixScene({ state, tier }: Omit<Props, 'materials' | 'pointer'>) {
  const materials = useMemo(() => createHelixMaterials(), []);
  const pointer = useRef({ x: 0, y: 0 });
  const sweepHolderRef = useRef<SweepRuntime | null>(null);
  const shadows = tier === 'high';

  useEffect(() => () => disposeHelixMaterials(materials), [materials]);

  return (
    <SweepHolderContext.Provider value={sweepHolderRef}>
      <StudioRig state={state} shadows={shadows} />
      <OrganicTicker
        materials={materials}
        pointer={pointer}
        drift={tier === 'high' ? 1 : 0}
        state={state}
      />
      <CameraRig state={state} pointer={pointer} />
      <Backbones state={state} tier={tier} materials={materials} pointer={pointer} />
      <Rungs state={state} materials={materials} tier={tier} />
      <Loci state={state} tier={tier} materials={materials} pointer={pointer} />
      <Pulses state={state} tier={tier} materials={materials} pointer={pointer} />
      {tier === 'high' && <LocusLabels state={state} />}
    </SweepHolderContext.Provider>
  );
}
