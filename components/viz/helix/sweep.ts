/**
 * Live CPU tube sweep — the one technique Vine Overgrowth actually runs on.
 *
 * The reference (`experiments.thisiswhitespace.com/vine-overgrowth`) does not
 * use `TubeGeometry`. It pre-allocates a position/normal buffer once and
 * **re-sweeps the ring stack on the CPU every frame**, carrying the frame
 * forward by Gram-Schmidt instead of recomputing Frenet frames. That is why
 * its coils can screw forward forever without the tube twisting or flipping,
 * and why the radius can undulate along the strand.
 *
 * Two rules this module exists to protect:
 *
 * 1. **`uv.x` is the analytic parameter `t` of the ring.** `organic.ts` keys
 *    the fbm growth front and both tapers off `vPath = uv.x`, and collapses
 *    toward `mix(uStart, uEnd, vPath)`. Every organic offset below is therefore
 *    projected onto the cross-section plane: a displacement along `dir` would
 *    silently break `t ⇔ uv.x` and slide the growth front off the ladder.
 *
 * 2. **The flatten/converge collapse is exact, not approximate.** For a
 *    surface vertex `P = C + n·r`, `mix(P, A, w) = mix(C, A, w) + n·(r·(1-w))`,
 *    so collapsing the centre and scaling the radius reproduces what the
 *    shader does to the baked geometry bit for bit — provided `axisPointAtInto`
 *    and `applyConvergeInto` stay affine in `t`, which both do.
 *
 * No React, no R3F: this is pure math over typed arrays. Nothing in the frame
 * path allocates.
 */

import { BufferAttribute, BufferGeometry, DynamicDrawUsage, Vector3 } from 'three';
import {
  FLATTEN_MIX,
  applyConvergeInto,
  axisPointAtInto,
  strandBasis,
  type StrandBasis,
  type StrandSpec,
} from './strands';

const TAU = Math.PI * 2;

/**
 * How far back from the growth frontier the cursor lean still reaches, in `t`.
 * The reference weights `max(0, 1 - n/0.32)²` behind a tip pinned at `n = 0`;
 * here the frontier stands at `t = grow`, so the lean follows it down the
 * strand instead of being stranded at the far end of a tube the coverage
 * shader has already cut off.
 */
const TIP_FALLOFF = 0.32;
const LEAN_DAMP = 5;
/** Guards the Gram-Schmidt projection against a degenerate seed. */
const MIN_NORMAL = 1e-6;

export type SweepTuning = {
  /**
   * Master scalar over every organic term. **0 must reduce the sweep to the
   * exact baked geometry** — that is what `check-sweep-parity.ts` asserts, and
   * what `?sweep=0` relies on to be a true revert.
   */
  amplitude: number;
  /** Screw rate, world units per second. One coil turn per strand length. */
  speed: number;
  /** Cross-section wobble amplitude, world units. */
  wobble: number;
  /** Cursor lean amplitude, world units. */
  lean: number;
  /** Radius modulation, first harmonic. */
  radiusWave1: number;
  /** Radius modulation, second harmonic. */
  radiusWave2: number;
  /**
   * Non-circular cross-section, as a fraction of the tube radius.
   *
   * **Ships at 0 and is meant to stay there.** It costs three `Math.sin` per
   * vertex — roughly 52 000 trig calls a frame at high tier — and a lumpy
   * cross-section is wrong for a sugar-phosphate backbone. This is a vine
   * term. It is exposed through `?sweepLump=` so the cost and the look can be
   * judged rather than argued about; 0.02–0.04 is the ceiling for a hint.
   */
  lump: number;
};

/**
 * Tuned for DNA, not for vine.
 *
 * The reference values this started from (`speed 0.34`, `wobble 0.03`,
 * `radiusWave 0.13/0.09`) describe a plant: a slow screw, a wandering
 * cross-section and a ±13% thickness ripple that reads as a pinch. A
 * backbone is a clean regular helix, so the screw is ~3× faster and every
 * irregularity is roughly halved — except `lean`, the one term that is alive
 * rather than noisy, which goes slightly up.
 */
export const SWEEP_TUNING: SweepTuning = {
  amplitude: 1,
  speed: 1.1,
  wobble: 0.015,
  lean: 0.14,
  radiusWave1: 0.05,
  radiusWave2: 0.03,
  lump: 0,
};

/**
 * Every knob, in one table.
 *
 * It used to be two ad-hoc branches that clamped `sweepAmp` and forgot
 * everything else, so each new knob was one more place to forget a clamp. A
 * knob added here cannot be read without one.
 */
const SWEEP_KNOBS = [
  { param: 'sweepAmp', key: 'amplitude', min: 0, max: 3 },
  { param: 'sweepSpeed', key: 'speed', min: 0, max: 4 },
  { param: 'sweepWobble', key: 'wobble', min: 0, max: 0.2 },
  { param: 'sweepLean', key: 'lean', min: 0, max: 0.6 },
  { param: 'sweepLump', key: 'lump', min: 0, max: 0.08 },
  { param: 'sweepR1', key: 'radiusWave1', min: 0, max: 0.5 },
  { param: 'sweepR2', key: 'radiusWave2', min: 0, max: 0.5 },
] as const satisfies ReadonlyArray<{
  param: string;
  key: keyof SweepTuning;
  min: number;
  max: number;
}>;

/**
 * `?sweep=0` reverts; every other knob is optional and clamped. Follows the
 * `?tubular=` idiom.
 */
export function sweepTuningFor(search: string): SweepTuning {
  const params = new URLSearchParams(search);

  /* The master revert, and it wins over every other knob: `?sweep=0` has to
     mean "the baked geometry and nothing else" no matter what else is in the
     query string. */
  if (params.get('sweep') === '0') return { ...SWEEP_TUNING, amplitude: 0 };

  let tuning: SweepTuning = SWEEP_TUNING;
  for (const knob of SWEEP_KNOBS) {
    const raw = params.get(knob.param);
    if (raw === null) continue;
    const value = Number(raw);
    /* Garbage falls through to the default rather than becoming NaN. A NaN
       reaches a vertex position and the strand never comes back. */
    if (!Number.isFinite(value)) continue;
    const clamped = Math.min(knob.max, Math.max(knob.min, value));
    if (clamped === tuning[knob.key]) continue;
    /* Shared with `SWEEP_TUNING` until something actually moves, so the
       common case — no query string — allocates nothing. */
    tuning = { ...tuning, [knob.key]: clamped };
  }
  return tuning;
}

/* ------------------------------------------------------------- geometry */

export type SweepBuffers = {
  geometry: BufferGeometry;
  position: Float32Array;
  normal: Float32Array;
  /**
   * The same arrays three.js sees. Held here so the frame path can flag them
   * dirty without a `getAttribute` lookup and a cast on every strand.
   */
  positionAttribute: BufferAttribute;
  normalAttribute: BufferAttribute;
  rings: number;
  /** Rings around the tube — note `(radial + 1)` columns: the seam vertex is
   *  duplicated, exactly as `TubeGeometry` emits it. */
  radial: number;
  /**
   * `-cos(2πj/radial)` per column. The negation is `TubeGeometry`'s, and it is
   * load-bearing: dropping it reverses the ring's angular direction and with
   * it the triangle winding, turning every tube inside out.
   */
  cos: Float32Array;
  /** `sin(2πj/radial)` per column. */
  sin: Float32Array;
  /** `2πj/radial` per column, for the cross-section lumps. */
  angle: Float32Array;
  /**
   * `sin`/`cos` of the column angle again, but *not* negated: the converge
   * "track" wobble the shader adds runs on `uv.y`, whose sign convention is
   * the opposite of the ring's. Precomputed so the hot path stays trig-free.
   */
  trackSin: Float32Array;
  trackCos: Float32Array;
};

/**
 * A pre-allocated tube buffer laid out exactly like `TubeGeometry`:
 * `(rings + 1) * (radial + 1)` vertices, `uv.x = i/rings`, `uv.y = j/radial`.
 *
 * `boundingSphere` is deliberately left alone. The reference fakes one at
 * radius 1e5 to defeat frustum culling; `frustumCulled={false}` on the mesh
 * does the same thing without keeping a sphere that lies about the geometry,
 * because `projectObject` skips `Frustum.intersectsObject` entirely.
 */
export function createSweepGeometry(rings: number, radial: number): SweepBuffers {
  const columns = radial + 1;
  const vertices = (rings + 1) * columns;

  const position = new Float32Array(vertices * 3);
  const normal = new Float32Array(vertices * 3);
  const uv = new Float32Array(vertices * 2);

  for (let i = 0; i <= rings; i += 1) {
    for (let j = 0; j < columns; j += 1) {
      const k = (i * columns + j) * 2;
      uv[k] = i / rings;
      uv[k + 1] = j / radial;
    }
  }

  const indices = new (vertices > 65535 ? Uint32Array : Uint16Array)(rings * radial * 6);
  let n = 0;
  for (let i = 1; i <= rings; i += 1) {
    for (let j = 1; j <= radial; j += 1) {
      const a = columns * (i - 1) + (j - 1);
      const b = columns * i + (j - 1);
      const c = columns * i + j;
      const d = columns * (i - 1) + j;
      indices[n] = a;
      indices[n + 1] = b;
      indices[n + 2] = d;
      indices[n + 3] = b;
      indices[n + 4] = c;
      indices[n + 5] = d;
      n += 6;
    }
  }

  const cos = new Float32Array(columns);
  const sin = new Float32Array(columns);
  const angle = new Float32Array(columns);
  const trackSin = new Float32Array(columns);
  const trackCos = new Float32Array(columns);
  for (let j = 0; j < columns; j += 1) {
    const a = (j / radial) * TAU;
    angle[j] = a;
    cos[j] = -Math.cos(a);
    sin[j] = Math.sin(a);
    trackSin[j] = Math.sin(a);
    trackCos[j] = Math.cos(a);
  }

  const geometry = new BufferGeometry();
  const positionAttribute = new BufferAttribute(position, 3);
  const normalAttribute = new BufferAttribute(normal, 3);
  positionAttribute.setUsage(DynamicDrawUsage);
  normalAttribute.setUsage(DynamicDrawUsage);
  geometry.setAttribute('position', positionAttribute);
  geometry.setAttribute('normal', normalAttribute);
  geometry.setAttribute('uv', new BufferAttribute(uv, 2));
  geometry.setIndex(new BufferAttribute(indices, 1));

  return {
    geometry,
    position,
    normal,
    positionAttribute,
    normalAttribute,
    rings,
    radial,
    cos,
    sin,
    angle,
    trackSin,
    trackCos,
  };
}

/**
 * Sweep one tube. Writes position and normal in place; allocates nothing.
 *
 * The frame is carried forward by Gram-Schmidt (`n -= t·(n·t)`) rather than
 * rebuilt per ring, which is what keeps a helix of constant pitch from
 * twisting. `seedNormal` must be perpendicular to the centreline's tangent —
 * `strandBasis(spec).u` is, by construction.
 *
 * `Math.cos`/`Math.sin` per column are hoisted into `buffers`. The reference
 * recomputes them per vertex, which would be 17,424 trig pairs a frame here.
 *
 * `track` reproduces the converge wobble `patchTrackConverge` injects into the
 * vertex shader (`transformed.y += sin(uv.y·2π)·0.07·uConverge`). Once the CPU
 * owns the pose the shader stops applying it, so the sweep has to — and it can,
 * exactly: the wobble is keyed on `uv.y`, i.e. a per-column *cross-section*
 * displacement, so it cannot disturb `t ⇔ uv.x`.
 */
export function sweepInto(
  buffers: SweepBuffers,
  centers: Float32Array,
  radii: Float32Array,
  phases: Float32Array,
  lump: number,
  seedNormal: Vector3,
  track = 0,
): void {
  const { position, normal, rings, radial, cos, sin, angle, trackSin, trackCos } = buffers;
  const columns = radial + 1;
  const lumpOn = lump !== 0;
  const trackOn = track !== 0;

  let nx = seedNormal.x;
  let ny = seedNormal.y;
  let nz = seedNormal.z;

  for (let e = 0; e <= rings; e += 1) {
    /* Central difference: one ring of slack at each end rather than a
       one-sided difference that kinks the terminus. */
    const i0 = Math.max(e - 1, 0) * 3;
    const i1 = Math.min(e + 1, rings) * 3;
    let tx = centers[i1]! - centers[i0]!;
    let ty = centers[i1 + 1]! - centers[i0 + 1]!;
    let tz = centers[i1 + 2]! - centers[i0 + 2]!;
    const tl = Math.hypot(tx, ty, tz) || 1;
    tx /= tl;
    ty /= tl;
    tz /= tl;

    const d = nx * tx + ny * ty + nz * tz;
    nx -= tx * d;
    ny -= ty * d;
    nz -= tz * d;
    let nl = Math.hypot(nx, ny, nz);
    if (nl < MIN_NORMAL) {
      nx = seedNormal.x;
      ny = seedNormal.y;
      nz = seedNormal.z;
      const again = nx * tx + ny * ty + nz * tz;
      nx -= tx * again;
      ny -= ty * again;
      nz -= tz * again;
      nl = Math.hypot(nx, ny, nz) || 1;
    }
    nx /= nl;
    ny /= nl;
    nz /= nl;

    /* B = T × N — matches TubeGeometry's frame handedness. */
    const bx = ty * nz - tz * ny;
    const by = tz * nx - tx * nz;
    const bz = tx * ny - ty * nx;

    const cx = centers[e * 3]!;
    const cy = centers[e * 3 + 1]!;
    const cz = centers[e * 3 + 2]!;
    const r = radii[e]!;
    const phase = phases[e]!;

    for (let j = 0; j < columns; j += 1) {
      const c = cos[j]!;
      const s = sin[j]!;
      const dx = nx * c + bx * s;
      const dy = ny * c + by * s;
      const dz = nz * c + bz * s;

      let rr = r;
      if (lumpOn) {
        const a = angle[j]!;
        rr =
          r *
          (1 +
            lump *
              (0.38 * Math.sin(2 * a + phase) +
                0.3 * Math.sin(3 * a - phase * 1.7) +
                0.18 * Math.sin(5 * a + phase * 0.6)));
      }

      const k = (e * columns + j) * 3;
      normal[k] = dx;
      normal[k + 1] = dy;
      normal[k + 2] = dz;
      position[k] = cx + dx * rr;
      /* Applied after the collapse, matching the shader's order. */
      position[k + 1] = cy + dy * rr + (trackOn ? trackSin[j]! * track : 0);
      position[k + 2] = cz + dz * rr + (trackOn ? trackCos[j]! * track : 0);
    }
  }
}

/* ----------------------------------------------------------- live state */

export type StrandLive = {
  spec: StrandSpec;
  basis: StrandBasis;
  rings: number;
  length: number;
  /** Accumulated world distance — the screw and wobble phase source. */
  distance: number;
  /** Damped cursor lean, world space. */
  lean: Vector3;
  leanTarget: Vector3;
  /** Beat pose, set once per frame and read by every consumer. */
  flatten: number;
  converge: number;
  grow: number;
  /** `clamp(flatten * FLATTEN_MIX + converge, 0, 1)` — the collapse weight. */
  w: number;
  /** Tuning already scaled by amplitude, so the hot path stays lean. */
  amp: number;
  wobble: number;
  /** Bumped once per swept frame, for staleness detection. */
  frame: number;
};

export function createStrandLive(spec: StrandSpec, rings: number): StrandLive {
  return {
    spec,
    basis: strandBasis(spec),
    rings,
    length: spec.start.distanceTo(spec.end),
    distance: 0,
    lean: new Vector3(),
    leanTarget: new Vector3(),
    flatten: 0,
    converge: 0,
    grow: 1,
    w: 0,
    amp: SWEEP_TUNING.amplitude,
    wobble: SWEEP_TUNING.wobble * SWEEP_TUNING.amplitude,
    frame: 0,
  };
}

/** Per-strand ring buffers. `radii` and `phases` are shared by both rails. */
export type StrandRings = {
  rings: number;
  centersA: Float32Array;
  centersB: Float32Array;
  radii: Float32Array;
  phases: Float32Array;
};

export function createStrandRings(rings: number): StrandRings {
  return {
    rings,
    centersA: new Float32Array((rings + 1) * 3),
    centersB: new Float32Array((rings + 1) * 3),
    radii: new Float32Array(rings + 1),
    phases: new Float32Array(rings + 1),
  };
}

export function setLivePose(
  live: StrandLive,
  flatten: number,
  converge: number,
  grow: number,
): void {
  live.flatten = flatten;
  live.converge = converge;
  live.grow = grow;
  live.w = Math.min(1, Math.max(0, flatten * FLATTEN_MIX + converge));
}

/** Coil drift in radians: one full turn per strand length travelled. */
function screwOf(live: StrandLive): number {
  return (live.distance / live.length) * TAU;
}

/**
 * Advance the screw accumulator and damp the cursor lean toward its target.
 *
 * The damping is `1 - exp(-k·dt)`, not a fixed-rate lerp: the latter makes the
 * settle speed depend on frame rate, which is exactly wrong for something
 * driving a 60 fps attraction.
 */
export function advanceLive(
  live: StrandLive,
  dt: number,
  time: number,
  pointer: { x: number; y: number },
  tuning: SweepTuning,
): void {
  live.amp = tuning.amplitude;
  live.wobble = tuning.wobble * tuning.amplitude;

  if (tuning.amplitude <= 0) {
    live.distance = 0;
    live.lean.set(0, 0, 0);
    return;
  }

  /* Clamped so a backgrounded tab does not resume with a coil that has
     screwed forward by several turns in one frame. */
  live.distance += Math.min(dt, 0.1) * tuning.speed;

  const target = live.leanTarget;
  target.set(
    pointer.x * tuning.lean + Math.sin(time * 0.6) * 0.07,
    pointer.y * tuning.lean * 0.9 + Math.cos(time * 0.83) * 0.05,
    0.2 * tuning.lean,
  );
  target.multiplyScalar(tuning.amplitude);
  live.lean.lerp(target, 1 - Math.exp(-LEAN_DAMP * dt));
}

/** Read-only scratch for `sampleLiveInto`. */
const RING = new Float32Array(3);
const AXIS = new Vector3();

/**
 * One point on the live backbone, written into `out` at `offset`.
 *
 * Composition order matters. Wobble and lean are added in the cross-section
 * plane *first*, then the whole centreline is collapsed by `w`. Doing it the
 * other way round would leave the organic terms at full strength on a strand
 * the shader has already flattened, and the two would disagree by exactly the
 * amount this module promises they would not.
 */
function liveRingIntoArray(
  live: StrandLive,
  phase: number,
  t: number,
  out: Float32Array,
  offset: number,
): void {
  const { spec, basis, distance, lean, wobble, grow, w, length } = live;

  /* A(t) — the axis point the shader collapses onto. Affine in `t`. */
  axisPointAtInto(spec, t, live.flatten, AXIS);
  applyConvergeInto(spec, live.converge, AXIS, t);

  /* `f` is a material coordinate: distance along the strand minus the
     distance already travelled, so the wobble flows down the strand instead
     of being painted onto it. */
  const dist = t * length;
  const f = dist - distance;
  const angle = phase + screwOf(live) + t * spec.turns * TAU;

  const w1 = Math.sin(f * 1.35 + 0.7) * wobble;
  const w2 = Math.cos(f * 1.9 + 2.3) * wobble * 0.8;

  const behind = grow - t;
  const tip = behind <= 0 ? 0 : Math.max(0, 1 - behind / TIP_FALLOFF) ** 2;

  /* Radial offset in the (u, v) plane, plus the world-space lean. */
  const ru = Math.cos(angle) * spec.radius + w1;
  const rv = Math.sin(angle) * spec.radius + w2;

  let ox = basis.u.x * ru + basis.v.x * rv + lean.x * tip;
  let oy = basis.u.y * ru + basis.v.y * rv + lean.y * tip;
  let oz = basis.u.z * ru + basis.v.z * rv + lean.z * tip;

  /* Project onto the cross-section plane. Non-negotiable: any component
     along `dir` would desynchronise `t` from `uv.x` and drag the growth
     front off the rungs. `u` and `v` are already perpendicular to `dir`, so
     in practice this only trims the lean. */
  const along = ox * basis.dir.x + oy * basis.dir.y + oz * basis.dir.z;
  ox -= basis.dir.x * along;
  oy -= basis.dir.y * along;
  oz -= basis.dir.z * along;

  const cx = spec.start.x + basis.dir.x * dist + ox;
  const cy = spec.start.y + basis.dir.y * dist + oy;
  const cz = spec.start.z + basis.dir.z * dist + oz;

  out[offset] = cx + (AXIS.x - cx) * w;
  out[offset + 1] = cy + (AXIS.y - cy) * w;
  out[offset + 2] = cz + (AXIS.z - cz) * w;
}

/**
 * Write both rails' centreline, radii and lump phases for one strand.
 *
 * `radii` carries the vine's *modulation* only — never `pathTaper`. The shader
 * already tapers both ends and the growth front; baking it here as well would
 * needle every terminus.
 */
export function writeCenterlines(
  live: StrandLive,
  rings: StrandRings,
  tubeRadius: number,
  tuning: SweepTuning,
): void {
  const { distance, amp, length } = live;

  for (let i = 0; i <= rings.rings; i += 1) {
    const t = i / rings.rings;
    const k = i * 3;
    liveRingIntoArray(live, 0, t, rings.centersA, k);
    liveRingIntoArray(live, Math.PI, t, rings.centersB, k);

    const f = t * length - distance;
    rings.radii[i] =
      tubeRadius *
      (1 +
        amp *
          (tuning.radiusWave1 * Math.sin(f * 1.9 + 1.3) +
            tuning.radiusWave2 * Math.sin(f * 4.3 + 0.4)));
    rings.phases[i] = f * 2.6 * amp;
  }
}

/**
 * One point on the live backbone, for the rungs, loci, labels, tips and
 * pulses. Reads the pose stored on `live`, so a consumer cannot disagree with
 * the mesh about where the strand is this frame.
 */
export function sampleLiveInto(
  live: StrandLive,
  phase: number,
  t: number,
  target: Vector3,
): Vector3 {
  liveRingIntoArray(live, phase, t, RING, 0);
  return target.set(RING[0]!, RING[1]!, RING[2]!);
}

/** Second rail scratch for `rungCenterInto`. */
const RING_B = new Float32Array(3);

/**
 * Where the centre of the rung at `t` belongs: the midpoint of the two rails.
 *
 * Not the collapsed axis. The rails sit at `C ± (1−w)·radius·radial`, so their
 * midpoint is the axis **plus the organic wobble and lean** — and at
 * `flatten > 0` it is not even the axis, because `A` squashes `z` by
 * `1 − 0.85·flatten` while the rails only follow it by `w = 0.42`. Pinning the
 * rung to `A` therefore detaches it from the very thing it connects, by up to
 * 0.83 world units at full flatten.
 *
 * `Rungs` calls this, and `check-sweep-parity.ts` asserts it against an
 * independent average of two `sampleLiveInto` calls, so the two cannot drift.
 */
export function rungCenterInto(live: StrandLive, t: number, target: Vector3): Vector3 {
  liveRingIntoArray(live, 0, t, RING, 0);
  liveRingIntoArray(live, Math.PI, t, RING_B, 0);
  return target.set(
    (RING[0]! + RING_B[0]!) * 0.5,
    (RING[1]! + RING_B[1]!) * 0.5,
    (RING[2]! + RING_B[2]!) * 0.5,
  );
}

/**
 * The radial axis of the helix at `t`, screw included.
 *
 * `rungDirection` is the same axis without the screw. Once the backbone
 * screws, an unscrewed radial axis points between the two rails instead of
 * along them, so every consumer of that axis has to use this instead.
 */
export function liveRadialInto(live: StrandLive, t: number, target: Vector3): Vector3 {
  const angle = screwOf(live) + t * live.spec.turns * TAU;
  const { u, v } = live.basis;
  return target
    .set(0, 0, 0)
    .addScaledVector(u, Math.cos(angle))
    .addScaledVector(v, Math.sin(angle))
    .normalize();
}

/**
 * How far each cylinder end buries into the tube, as a fraction of the live
 * tube radius. Centreline-to-centreline (`2 * spec.radius`) is the air-gap
 * bug: the backbone has thickness, so the mesh stopped short of the surface.
 * 0.72 puts the cap inside the tube without punching out the far wall.
 */
export const RUNG_BURY = 0.72;

/** Instantaneous tube radius at `t` — the same modulation `writeCenterlines` writes. */
export function liveRadiusAt(
  live: StrandLive,
  t: number,
  tubeRadius: number,
  tuning: SweepTuning = SWEEP_TUNING,
): number {
  const f = t * live.length - live.distance;
  return (
    tubeRadius *
    (1 +
      live.amp *
        (tuning.radiusWave1 * Math.sin(f * 1.9 + 1.3) +
          tuning.radiusWave2 * Math.sin(f * 4.3 + 0.4)))
  );
}

/**
 * Cylinder length that reaches **into** both rails.
 *
 * `distance(rail0, rail1)` is the centreline span. Adding `2 * liveRadius * bury`
 * is what closes the air gap. Direction stays `liveRadialInto` — this helper
 * never returns a vector, so `converge → 1` cannot emit NaN.
 */
export function rungSpanInto(
  live: StrandLive,
  t: number,
  tubeRadius: number,
  tuning: SweepTuning = SWEEP_TUNING,
  bury: number = RUNG_BURY,
): number {
  liveRingIntoArray(live, 0, t, RING, 0);
  liveRingIntoArray(live, Math.PI, t, RING_B, 0);
  const rail = Math.hypot(
    RING[0]! - RING_B[0]!,
    RING[1]! - RING_B[1]!,
    RING[2]! - RING_B[2]!,
  );
  return rail + 2 * liveRadiusAt(live, t, tubeRadius, tuning) * bury;
}

/**
 * Same contract when the live sweep is off (`?sweep=0`, low tier): rail
 * separation from the collapse weight, bury against the baked tube radius.
 */
export function rungSpanBaked(
  spec: StrandSpec,
  flatten: number,
  converge: number,
  tubeRadius: number,
  bury: number = RUNG_BURY,
): number {
  const w = Math.min(1, Math.max(0, flatten * FLATTEN_MIX + converge));
  return 2 * spec.radius * (1 - w) + 2 * tubeRadius * bury;
}
