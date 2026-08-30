/**
 * Prove the live sweep cannot drift from the geometry it replaces.
 *
 * Nine checks, all browser-free. The first three came with the sweep; the
 * other six exist because parity alone is not enough — it proves `sweep.ts`
 * agrees with the *shader*, and says nothing about whether the rails, the
 * rungs and the ring stack agree with each other.
 *
 * 1. **Layout.** `createSweepGeometry` emits exactly the vertex, index and uv
 *    arrays `TubeGeometry` does. If this drifts, `uv.x` stops being the path
 *    parameter and the growth front silently moves.
 *
 * 2. **Parity.** With `amplitude = 0`, `sampleLiveInto` equals
 *    `mix(analyticBackbone(t), axis(t), w)` to < 1e-6. This is the invariant
 *    the whole design rests on: it says the CPU sweep reproduces what the
 *    shader already does to the baked geometry, so `helixCoverage`, the
 *    `discard` and depth-material parity cannot change.
 *
 * 3. **Curve drift.** The analytic helix versus the `CatmullRomCurve3` the
 *    sweep drops. Not an error — an upper bound on how much the tube moves
 *    when we stop interpolating through sampled points.
 *
 * 4. **Rail diameter.** The two rails are exactly `2(1-w)·radius` apart and
 *    the separation points along `liveRadialInto`. Cancels at every amplitude,
 *    so it catches a radial axis pointing between coiled rails with no
 *    epsilon fudge.
 *
 * 5. **Radial axis identity.** Pins the screw's sign and rate.
 *
 * 6. **Ring integrity.** Vertex radii, normals and the `uv.y` seam.
 *
 * 7. **Rung midpoint.** Scoped on `w`, with the inherited axis gap printed as
 *    information rather than passed or failed.
 *
 * 8. **Frame-rate independence.** The screw accumulator and the exponential
 *    lean damping must not depend on `dt`.
 *
 * 9. **Tuning parser.** `?sweepAmp` clamps instead of trusting its input.
 *
 * 10. **Rung span.** Live rail distance plus bury; ≥ rail gap when grown;
 *     finite at `converge = 1`; matches the baked helper at `amplitude = 0`.
 *
 * Run with `npx tsx scripts/check-sweep-parity.ts`.
 */
import { CatmullRomCurve3, TubeGeometry, Vector3 } from 'three';
import {
  STRANDS,
  applyConvergeInto,
  axisPointAtInto,
  rungDirection,
  sampleBackbone,
  strandBasis,
  type StrandBasis,
  type StrandSpec,
} from '../components/viz/helix/strands';
import {
  SWEEP_TUNING,
  advanceLive,
  createStrandLive,
  createStrandRings,
  createSweepGeometry,
  liveRadialInto,
  RUNG_BURY,
  rungCenterInto,
  rungSpanBaked,
  rungSpanInto,
  sampleLiveInto,
  setLivePose,
  sweepInto,
  sweepTuningFor,
  writeCenterlines,
  type StrandLive,
  type SweepTuning,
} from '../components/viz/helix/sweep';

const LIMIT = 1e-6;
const RINGS = 120;
const RADIAL = 8;
/** High-tier tube radius — `QUALITY.high.radius` in `HelixScene.tsx`. */
const TUBE_RADIUS = 0.04;

/**
 * Every live sample is written through a `Float32Array`, so a *difference* of
 * two samples inherits roughly two ulp of the coordinate magnitude (up to ~10
 * world units here), not of the 0.05–0.9 separation being measured. Assertions
 * on such differences therefore floor their tolerance at the storage noise
 * instead of at `LIMIT`: a real defect in this code is an error of order
 * `spec.radius` (0.27–0.46), four to five orders of magnitude above.
 */
const EPS32 = 2 ** -23;
const quant = (scale: number) => 2 * EPS32 * scale;

/** Fixed seed so every run reports the same numbers. */
const SEED_TIME = 3.7;
const SEED_POINTER = { x: 0.3, y: -0.2 };

/** `flatten × converge` poses worth sweeping. Covers `w` from 0 to 1. */
const POSES: Array<[number, number]> = [
  [0, 0],
  [0, 0.5],
  [0, 1],
  [0.4, 0],
  [0.4, 0.5],
  [0.4, 1],
  [1, 0],
  [1, 0.5],
  [1, 1],
];

const AMPLITUDES = [0, 1, 2];
const SAMPLES = 21;

let failed = 0;
const fail = (message: string) => {
  failed += 1;
  console.error(`FAIL ${message}`);
};

const tuningAt = (amplitude: number): SweepTuning => ({
  ...SWEEP_TUNING,
  amplitude,
});

/** A strand brought to the same reproducible state every time. */
function seedLive(spec: StrandSpec, amplitude: number): StrandLive {
  const live = createStrandLive(spec, RINGS);
  advanceLive(live, 1 / 60, SEED_TIME, SEED_POINTER, tuningAt(amplitude));
  return live;
}

/**
 * Worst sample seen, measured against the tolerance *that* sample had.
 *
 * The tolerance is not a constant: it scales with the coordinate magnitude
 * being quantised to float32, and with the separation being normalised. So a
 * check cannot simply keep the largest absolute error and compare it against
 * one number at the end — it has to remember how much slack the offending
 * sample was actually allowed.
 */
type Worst = { ratio: number; value: number; tol: number; at: string };

const worst = (): Worst => ({ ratio: 0, value: 0, tol: 0, at: '' });

function note(w: Worst, value: number, tol: number, at: string): void {
  const ratio = tol > 0 ? value / tol : 0;
  if (ratio > w.ratio) {
    w.ratio = ratio;
    w.value = value;
    w.tol = tol;
    w.at = at;
  }
}

function blame(w: Worst, label: string): void {
  if (w.ratio > 1) {
    fail(
      `${label} off by ${w.value.toExponential(3)} — ${w.ratio.toFixed(1)}x the ` +
        `${w.tol.toExponential(1)} tolerance — at ${w.at}`,
    );
  }
}

/* ------------------------------------------------------- 1. layout ------ */

function checkLayout() {
  const spec = STRANDS[0]!;
  const curve = new CatmullRomCurve3(
    sampleBackbone(spec, 0, RINGS, 0),
    false,
    'catmullrom',
    0.5,
  );
  const tube = new TubeGeometry(curve, RINGS, 1, RADIAL, false);
  const sweep = createSweepGeometry(RINGS, RADIAL);

  const tubePos = tube.getAttribute('position');
  const tubeUv = tube.getAttribute('uv');
  const sweepUv = sweep.geometry.getAttribute('uv');

  if (tubePos.count !== sweep.position.length / 3) {
    fail(`vertex count ${sweep.position.length / 3} != TubeGeometry ${tubePos.count}`);
  }

  const tubeIndex = tube.getIndex();
  const sweepIndex = sweep.geometry.getIndex();
  if (!tubeIndex || !sweepIndex) {
    fail('index buffer missing');
    return sweep;
  }
  if (tubeIndex.count !== sweepIndex.count) {
    fail(`index count ${sweepIndex.count} != ${tubeIndex.count}`);
  } else {
    for (let i = 0; i < tubeIndex.count; i += 1) {
      if (tubeIndex.getX(i) !== sweepIndex.getX(i)) {
        fail(`index differs at ${i}: ${sweepIndex.getX(i)} != ${tubeIndex.getX(i)}`);
        break;
      }
    }
  }

  if (tubeUv.count !== sweepUv.count) {
    fail(`uv count ${sweepUv.count} != ${tubeUv.count}`);
  } else {
    let worst = 0;
    for (let i = 0; i < tubeUv.count; i += 1) {
      worst = Math.max(
        worst,
        Math.abs(tubeUv.getX(i) - sweepUv.getX(i)),
        Math.abs(tubeUv.getY(i) - sweepUv.getY(i)),
      );
    }
    if (worst > LIMIT) fail(`uv differs by up to ${worst}`);
    else console.log(`layout   ok  ${tubePos.count} verts, uv delta ${worst.toExponential(1)}`);
  }

  tube.dispose();
  return sweep;
}

/* ------------------------------------------------------- 2. parity ------ */

/**
 * The point the shader produces today: the baked helix centre mixed `w` of the
 * way toward the (flatten-squashed, converge-posed) axis.
 */
function shaderPointInto(
  spec: StrandSpec,
  basis: StrandBasis,
  phase: number,
  t: number,
  flatten: number,
  converge: number,
  target: Vector3,
): Vector3 {
  const length = spec.start.distanceTo(spec.end);
  const angle = phase + t * spec.turns * Math.PI * 2;

  target
    .copy(spec.start)
    .addScaledVector(basis.dir, t * length)
    .addScaledVector(basis.u, Math.cos(angle) * spec.radius)
    .addScaledVector(basis.v, Math.sin(angle) * spec.radius);

  const axis = axisPointAtInto(spec, t, flatten, new Vector3());
  applyConvergeInto(spec, converge, axis, t);

  const w = Math.min(1, Math.max(0, flatten * 0.42 + converge));
  return target.lerp(axis, w);
}

function checkParity() {
  const off = sweepTuningFor('?sweep=0');
  if (off.amplitude !== 0) fail(`?sweep=0 gave amplitude ${off.amplitude}`);

  const flattens = [0, 0.4, 1];
  const converges = [0, 0.5, 1];
  const phases = [0, Math.PI];
  const samples = 21;

  let worst = 0;
  let worstAt = '';

  for (const spec of STRANDS) {
    const live = createStrandLive(spec, RINGS);
    advanceLive(live, 0, 0, { x: 0, y: 0 }, off);
    const basis = strandBasis(spec);

    for (const flatten of flattens) {
      for (const converge of converges) {
        for (const phase of phases) {
          for (let i = 0; i < samples; i += 1) {
            const t = i / (samples - 1);
            setPose(live, flatten, converge, 1);

            const got = sampleLiveInto(live, phase, t, new Vector3());
            const want = shaderPointInto(
              spec,
              basis,
              phase,
              t,
              flatten,
              converge,
              new Vector3(),
            );
            const delta = got.distanceTo(want);
            if (delta > worst) {
              worst = delta;
              worstAt = `${spec.id} phase=${phase.toFixed(2)} t=${t.toFixed(2)} flatten=${flatten} converge=${converge}`;
            }
          }
        }
      }
    }
  }

  if (worst > LIMIT) fail(`parity drift ${worst.toExponential(3)} at ${worstAt}`);
  else console.log(`parity   ok  max ${worst.toExponential(3)} (limit ${LIMIT})`);
}

/* -------------------------------------------------- 3. curve drift ------ */

function checkCurveDrift() {
  let worst = 0;
  let worstAt = '';

  for (const spec of STRANDS) {
    const basis = strandBasis(spec);
    const curve = new CatmullRomCurve3(
      sampleBackbone(spec, 0, RINGS, 0),
      false,
      'catmullrom',
      0.5,
    );
    const length = spec.start.distanceTo(spec.end);

    for (let i = 0; i <= 40; i += 1) {
      const t = i / 40;
      const analytic = new Vector3()
        .copy(spec.start)
        .addScaledVector(basis.dir, t * length)
        .addScaledVector(basis.u, Math.cos(t * spec.turns * Math.PI * 2) * spec.radius)
        .addScaledVector(basis.v, Math.sin(t * spec.turns * Math.PI * 2) * spec.radius);
      const interpolated = curve.getPointAt(t);
      const delta = analytic.distanceTo(interpolated);
      if (delta > worst) {
        worst = delta;
        worstAt = `${spec.id} t=${t.toFixed(2)}`;
      }
    }
  }

  console.log(
    `curve    info  dropping CatmullRomCurve3 moves the centre by at most ${worst.toFixed(4)} world units (${worstAt})`,
  );
  return worst;
}

/* ----------------------------------------------- 4. rail diameter ------ */

/**
 * The rails are `phase = 0` and `phase = π`, which negates `cos/sin · radius`
 * exactly. The wobble pair, the tip-weighted lean and the collapse weight are
 * all phase-independent, so the whole organic layer cancels and only the
 * screwing radial term survives:
 *
 *     D = sampleLive(0, t) − sampleLive(π, t) = 2·(1−w)·radius·liveRadial(t)
 *
 * That makes this the assertion which actually covers what the live sweep is
 * for. `rungDirection` — the same axis without the screw — points *between*
 * the two rails once they coil, and would fail here by a whole radius rather
 * than by an epsilon. It holds at every amplitude because the organic terms
 * cancel rather than shrink.
 */
function checkRailDiameter() {
  const before = failed;
  const a = new Vector3();
  const b = new Vector3();
  const d = new Vector3();
  const radial = new Vector3();

  const magnitude = worst();
  const direction = worst();
  const vanished = worst();
  let collapsed = 0;

  for (const spec of STRANDS) {
    for (const amplitude of AMPLITUDES) {
      const live = seedLive(spec, amplitude);

      for (const [flatten, converge] of POSES) {
        for (let i = 0; i < SAMPLES; i += 1) {
          const t = i / (SAMPLES - 1);
          setPose(live, flatten, converge, 1);

          sampleLiveInto(live, 0, t, a);
          sampleLiveInto(live, Math.PI, t, b);
          liveRadialInto(live, t, radial);

          d.copy(a).sub(b);
          const mag = d.length();
          const scale = Math.max(
            Math.abs(a.x),
            Math.abs(a.y),
            Math.abs(a.z),
            Math.abs(b.x),
            Math.abs(b.y),
            Math.abs(b.z),
          );
          const noise = quant(scale);
          const keep = 1 - live.w;
          const where =
            `${spec.id} t=${t.toFixed(2)} flatten=${flatten} ` +
            `converge=${converge} amp=${amplitude}`;

          if (keep <= 1e-3) {
            /* w → 1: the collapse is total, the rails genuinely coincide, and
               normalising a zero-length separation would be meaningless. */
            collapsed += 1;
            note(vanished, mag, Math.max(LIMIT, noise), where);
            continue;
          }

          note(
            magnitude,
            Math.abs(mag / 2 - keep * spec.radius),
            Math.max(LIMIT, noise),
            where,
          );
          note(
            direction,
            d.divideScalar(mag).distanceTo(radial),
            Math.max(LIMIT, noise / mag),
            where,
          );
        }
      }
    }
  }

  blame(vanished, 'rails at w = 1 should coincide but were separated by');
  blame(magnitude, 'rail half-diameter');
  blame(direction, 'rail separation axis');

  if (failed === before) {
    console.log(
      `rails    ok  half-diameter ${magnitude.value.toExponential(1)}, ` +
        `axis ${direction.value.toExponential(1)}, ` +
        `${collapsed} collapsed samples within ${vanished.value.toExponential(1)}`,
    );
  }
}

/* ------------------------------------------------ 5. radial axis ------ */

/**
 * Pins the screw's sign and rate.
 *
 * A screw running backwards, or at the wrong rate, still produces a plausible
 * tube — the coils simply do not line up with the radial axis every consumer
 * reads, and the rails drift off the rung ends by up to a full radius.
 */
function checkRadialAxis() {
  const before = failed;
  const got = new Vector3();

  const identity = worst();
  const cosine = worst();
  const unit = worst();
  const perpendicular = worst();

  for (const spec of STRANDS) {
    const basis = strandBasis(spec);
    /* Never advanced, so `distance` is still 0 — the unscrewed case. */
    const still = createStrandLive(spec, RINGS);

    for (const amplitude of AMPLITUDES) {
      const live = seedLive(spec, amplitude);
      const screw = (live.distance / live.length) * Math.PI * 2;

      for (let i = 0; i < SAMPLES; i += 1) {
        const t = i / (SAMPLES - 1);
        const unscrewed = rungDirection(spec, basis, t);
        const where = `${spec.id} t=${t.toFixed(2)} amp=${amplitude}`;

        note(identity, liveRadialInto(still, t, got).distanceTo(unscrewed), 1e-9, where);

        liveRadialInto(live, t, got);
        note(cosine, Math.abs(got.dot(unscrewed) - Math.cos(screw)), 1e-9, where);
        note(unit, Math.abs(got.length() - 1), 1e-9, where);
        note(perpendicular, Math.abs(got.dot(basis.dir)), 1e-9, where);
      }
    }
  }

  blame(identity, 'liveRadialInto at distance 0 differs from rungDirection by');
  blame(cosine, 'liveRadialInto · rungDirection differs from cos(screw) by');
  blame(unit, 'liveRadialInto departs from unit length by');
  blame(perpendicular, 'liveRadialInto is not perpendicular to dir by');

  if (failed === before) {
    console.log(
      `radial   ok  identity ${identity.value.toExponential(1)}, ` +
        `cos(screw) ${cosine.value.toExponential(1)}, ` +
        `unit ${unit.value.toExponential(1)}, perp ${perpendicular.value.toExponential(1)}`,
    );
  }
}

/* ----------------------------------------------- 6. ring integrity ------ */

/**
 * Layout is checked above; the numbers written into it are not.
 *
 * Deliberately frame-agnostic — it never asks whether Gram-Schmidt or Frenet
 * built the frame, only that each ring is a circle of the radius it was given,
 * that each vertex normal actually points from the centre at that vertex, and
 * that the `uv.y` seam closes. That is enough to catch a dropped `-cos` in
 * `createSweepGeometry` (which turns every tube inside out) and a seam
 * off-by-one, in one pass over the buffer.
 */
function checkRingIntegrity() {
  const before = failed;
  const buffers = createSweepGeometry(RINGS, RADIAL);
  const columns = RADIAL + 1;
  const rings = createStrandRings(RINGS);

  const center = new Vector3();
  const delta = new Vector3();
  const expect = new Vector3();

  const radius = worst();
  const normal = worst();
  const seam = worst();

  for (const spec of STRANDS) {
    const basis = strandBasis(spec);

    for (const amplitude of AMPLITUDES) {
      const tuning = tuningAt(amplitude);
      const live = seedLive(spec, amplitude);

      for (const [flatten, converge] of POSES) {
        setPose(live, flatten, converge, 1);
        writeCenterlines(live, rings, TUBE_RADIUS, tuning);
        sweepInto(buffers, rings.centersA, rings.radii, rings.phases, 0, basis.u, 0);

        const where = `${spec.id} flatten=${flatten} converge=${converge} amp=${amplitude}`;

        for (let i = 0; i <= RINGS; i += 1) {
          const base = i * 3;
          center.set(
            rings.centersA[base]!,
            rings.centersA[base + 1]!,
            rings.centersA[base + 2]!,
          );
          const r = rings.radii[i]!;
          const scale =
            Math.max(Math.abs(center.x), Math.abs(center.y), Math.abs(center.z)) + r;
          const noise = quant(scale);

          for (let j = 0; j < columns; j += 1) {
            const k = (i * columns + j) * 3;
            delta.set(
              buffers.position[k]! - center.x,
              buffers.position[k + 1]! - center.y,
              buffers.position[k + 2]! - center.z,
            );
            expect.set(buffers.normal[k]!, buffers.normal[k + 1]!, buffers.normal[k + 2]!);

            note(
              radius,
              Math.abs(delta.length() - r),
              Math.max(1e-5, noise),
              `${where} ring ${i}`,
            );
            /* Dividing by `r` amplifies the storage noise by 1/0.04, so this
               one carries the scaled tolerance rather than a flat 1e-5. */
            note(
              normal,
              delta.divideScalar(r).distanceTo(expect),
              Math.max(1e-5, noise / r),
              `${where} ring ${i} column ${j}`,
            );
          }

          /* Column `radial` is the duplicated seam of column 0. */
          const last = (i * columns + RADIAL) * 3;
          const first = (i * columns + 0) * 3;
          note(
            seam,
            Math.max(
              Math.abs(buffers.position[last]! - buffers.position[first]!),
              Math.abs(buffers.position[last + 1]! - buffers.position[first + 1]!),
              Math.abs(buffers.position[last + 2]! - buffers.position[first + 2]!),
            ),
            1e-6,
            `${where} ring ${i}`,
          );
        }
      }
    }
  }

  blame(radius, 'ring vertex radius');
  blame(normal, 'ring vertex normal');
  blame(seam, 'ring seam');

  if (failed === before) {
    console.log(
      `rings    ok  radius ${radius.value.toExponential(1)}, ` +
        `normal ${normal.value.toExponential(1)}, seam ${seam.value.toExponential(1)}`,
    );
  }

  buffers.geometry.dispose();
}

/* ----------------------------------------------- 7. rung midpoint ------ */

/**
 * Re-derived rather than imported, and the constant with it: importing
 * `TIP_FALLOFF` would let a change to either side pass silently, which is the
 * one thing this harness must not do.
 */
const TIP_FALLOFF = 0.32;

/**
 * The organic displacement the sweep adds to a centreline point, before the
 * cross-section projection. Reconstructed from `live` so the harness shares no
 * code with the thing it is checking.
 */
function organicInto(
  live: StrandLive,
  basis: StrandBasis,
  t: number,
  target: Vector3,
): Vector3 {
  const f = t * live.length - live.distance;
  const w1 = Math.sin(f * 1.35 + 0.7) * live.wobble;
  const w2 = Math.cos(f * 1.9 + 2.3) * live.wobble * 0.8;

  const behind = live.grow - t;
  const tip = behind <= 0 ? 0 : Math.max(0, 1 - behind / TIP_FALLOFF) ** 2;

  target
    .set(0, 0, 0)
    .addScaledVector(basis.u, w1)
    .addScaledVector(basis.v, w2)
    .addScaledVector(live.lean, tip);

  /* Project off `dir`, exactly as the sweep does. */
  return target.addScaledVector(basis.dir, -target.dot(basis.dir));
}

/**
 * The rung sits between its own rails.
 *
 * `Rungs` places every instance with `rungCenterInto`, whose contract is that
 * the centre is the midpoint of the two live rails — **not** `A(t)`, the
 * collapsed axis. The rails straddle `M(t) = (1−w)·[P + organic] + w·A`, so
 * the axis and the midpoint disagree by `(1−w)·(P + organic − A)`, which
 * reaches 0.83 world units at full flatten. Pinning the rung to the axis
 * detaches it from the ladder it is a step of.
 *
 * So there are two assertions and one measurement:
 *
 * 1. **Hard** — `rungCenterInto` equals an independently averaged pair of
 *    `sampleLiveInto` calls. This is the contract, and it is the guard against
 *    the axis placement coming back.
 * 2. **Hard** — at `w = 1` the collapse is total, so the midpoint, the axis
 *    and the rung centre are all the same point.
 * 3. **Info** — how far the fix actually moves the rungs, per pose. That is
 *    the number that says "the middle beats look different now", and it is
 *    printed rather than asserted because a large value is the *point*, not a
 *    defect.
 */
function checkRungMidpoint() {
  const before = failed;
  const a = new Vector3();
  const b = new Vector3();
  const mid = new Vector3();
  const center = new Vector3();
  const axis = new Vector3();
  const spine = new Vector3();
  const organic = new Vector3();
  const predicted = new Vector3();
  const residual = new Vector3();

  const contract = worst();
  const collapsed = worst();
  const model = worst();
  const gap = new Map<string, { abs: number; rel: number }>();

  for (const spec of STRANDS) {
    const basis = strandBasis(spec);

    for (const amplitude of AMPLITUDES) {
      const live = seedLive(spec, amplitude);

      for (const [flatten, converge] of POSES) {
        const key = `flatten=${flatten} converge=${converge}`;

        for (let i = 0; i < SAMPLES; i += 1) {
          const t = i / (SAMPLES - 1);
          setPose(live, flatten, converge, 1);

          /* M — the midpoint of the two rails, derived here independently. */
          sampleLiveInto(live, 0, t, a);
          sampleLiveInto(live, Math.PI, t, b);
          mid.copy(a).add(b).multiplyScalar(0.5);

          /* R — where `Rungs` actually puts the instance: `rungCenterInto`,
             the function under test. */
          rungCenterInto(live, t, center);

          /* The axis the placement used to use. Kept only to size the fix. */
          axisPointAtInto(spec, t, flatten, axis);
          applyConvergeInto(spec, converge, axis, t);

          const scale = Math.max(
            Math.abs(a.x),
            Math.abs(a.y),
            Math.abs(a.z),
            Math.abs(b.x),
            Math.abs(b.y),
            Math.abs(b.z),
          );
          const noise = quant(scale);
          const where =
            `${spec.id} t=${t.toFixed(2)} flatten=${flatten} ` +
            `converge=${converge} amp=${amplitude}`;

          /* 1. The contract: the placement is the midpoint, exactly. */
          note(contract, center.distanceTo(mid), Math.max(LIMIT, noise), where);

          /* 2. At `w = 1` the collapse is total, so midpoint, centre and axis
                are one point. This is the case with no slack in it. */
          if (live.w >= 1 - 1e-12) {
            note(collapsed, mid.distanceTo(axis), Math.max(LIMIT, noise), where);
            continue;
          }

          /* 3. The composition model: `M − A == (1−w)·(P + organic − A)`.
                This is not about placement — it is the only assertion that
                re-derives the wobble, the tip-weighted lean and the collapse
                independently of `liveRingIntoArray`, and it is what catches a
                wrong weight or a lost cross-section projection. The `cos/sin ·
                radius` terms cancel in the midpoint, so they never appear. */
          spine.copy(spec.start).addScaledVector(basis.dir, t * live.length);
          organicInto(live, basis, t, organic);
          predicted
            .copy(spine)
            .add(organic)
            .sub(axis)
            .multiplyScalar(1 - live.w);

          residual.copy(mid).sub(axis);
          note(model, residual.distanceTo(predicted), Math.max(LIMIT, noise), where);

          /* 4. How far the fix moves the rung off the axis it used to sit on. */
          const entry = gap.get(key) ?? { abs: 0, rel: 0 };
          entry.abs = Math.max(entry.abs, mid.distanceTo(axis));
          entry.rel = Math.max(entry.rel, mid.distanceTo(axis) / spec.radius);
          gap.set(key, entry);
        }
      }
    }
  }

  blame(contract, 'rung centre is not the midpoint of its rails');
  blame(collapsed, 'rung midpoint at w = 1');
  blame(model, 'rail midpoint composition');

  if (failed === before) {
    console.log(
      `midpoint ok  centre ${contract.value.toExponential(1)}, ` +
        `collapsed ${collapsed.value.toExponential(1)}, ` +
        `model ${model.value.toExponential(1)}`,
    );
  }
  console.log('midpoint info  how far the fix moves the rung off the axis:');
  for (const [key, entry] of gap) {
    console.log(
      `midpoint info    ${key}: max|M − A| ${entry.abs.toFixed(3)} ` +
        `(${entry.rel.toFixed(2)} radii)`,
    );
  }
}

/* ------------------------------------- 8. the sweep has to move -------- */

/**
 * The sweep has to actually move.
 *
 * Phase 3 raised `speed` from 0.34 to 1.1 for exactly this reason: at 0.34 a
 * strand of length 3.8 took roughly eleven seconds per turn, which does not
 * read as alive. Pinning the travelled distance and the resulting displacement
 * together means a later tidy-up cannot quietly put the crawl back — a change
 * to `speed` that is not reflected here fails this check.
 */
function checkMotion() {
  const before = failed;
  const tuning = tuningAt(1);
  const pointer = { x: 0.3, y: -0.2 };
  const start = new Vector3();
  const end = new Vector3();
  let slowest = Infinity;
  let slowestId = '';

  for (const spec of STRANDS) {
    const live = createStrandLive(spec, RINGS);
    setPose(live, 0, 0, 1);
    /* One frame first, so the reading below is a steady state and not the
       zero-distance initial condition. */
    advanceLive(live, 1 / 60, SEED_TIME, pointer, tuning);
    const travelled0 = live.distance;
    sampleLiveInto(live, 0, 0.5, start);

    for (let i = 0; i < 60; i += 1) {
      advanceLive(live, 1 / 60, SEED_TIME + i / 60, pointer, tuning);
    }
    sampleLiveInto(live, 0, 0.5, end);

    const travelled = live.distance - travelled0;
    if (Math.abs(travelled - SWEEP_TUNING.speed) > 1e-6) {
      fail(`${spec.id} travelled ${travelled} in 1 s, expected ${SWEEP_TUNING.speed}`);
    }

    const moved = start.distanceTo(end);
    if (moved < slowest) {
      slowest = moved;
      slowestId = spec.id;
    }
  }

  /* The floor is chosen against the old tuning, not the new one: at
     `speed 0.34` the slowest strand moved about a tenth of this, and that is
     the motion this number exists to rule out. */
  const FLOOR = 0.2;
  if (slowest < FLOOR) {
    fail(`slowest strand (${slowestId}) moved only ${slowest.toFixed(4)} world units in 1 s`);
  }

  if (failed === before) {
    console.log(
      `motion   ok  ${SWEEP_TUNING.speed} world units/s, slowest strand ` +
        `(${slowestId}) moves ${slowest.toFixed(3)} in 1 s`,
    );
  }
}

/* ------------------------------------- 9. frame-rate independence ------ */

/**
 * Two things have to be independent of `dt`, for different reasons.
 *
 * The screw accumulator is a plain sum, so it can only drift by rounding. The
 * lean damping is the interesting one: `1 − exp(−k·dt)` composes to
 * `exp(−k·T)` over any step sequence that covers the same `T`, whereas the
 * obvious `lerp(target, 0.1)` settles more than twenty times further in one
 * second at 60 fps than at 30. Asserting the two agree is what stops the
 * obvious version coming back.
 */
function checkFrameRate() {
  const before = failed;
  const tuning = tuningAt(1);
  const pointer = { x: 0.3, y: -0.2 };

  const screw = worst();
  const lean = worst();
  let impure = 0;

  const a = new Vector3();
  const b = new Vector3();

  for (const spec of STRANDS) {
    /* Screw: the clock advances, which is what production does. */
    const fast = createStrandLive(spec, RINGS);
    const slow = createStrandLive(spec, RINGS);
    let fastTime = 0;
    let slowTime = 0;
    for (let i = 0; i < 60; i += 1) {
      fastTime += 1 / 60;
      advanceLive(fast, 1 / 60, fastTime, pointer, tuning);
    }
    for (let i = 0; i < 30; i += 1) {
      slowTime += 1 / 30;
      advanceLive(slow, 1 / 30, slowTime, pointer, tuning);
    }
    note(screw, Math.abs(fast.distance - slow.distance), 1e-9, `${spec.id} 60x1/60 vs 30x1/30`);

    /* Lean: a frozen clock and pointer, so the only thing that can differ is
       the damping itself and not the target it is chasing. */
    const quick = createStrandLive(spec, RINGS);
    const lazy = createStrandLive(spec, RINGS);
    for (let i = 0; i < 60; i += 1) advanceLive(quick, 1 / 60, SEED_TIME, pointer, tuning);
    for (let i = 0; i < 30; i += 1) advanceLive(lazy, 1 / 30, SEED_TIME, pointer, tuning);
    note(lean, quick.lean.distanceTo(lazy.lean), 1e-9, `${spec.id} lean over 1 s`);

    /* Reading the strand must not advance it. */
    const live = seedLive(spec, 1);
    setPose(live, 0, 0, 1);
    const distance = live.distance;
    const frame = live.frame;
    sampleLiveInto(live, 0.3, 0.5, a);
    sampleLiveInto(live, 0.3, 0.5, b);
    if (
      live.distance !== distance ||
      live.frame !== frame ||
      a.x !== b.x ||
      a.y !== b.y ||
      a.z !== b.z
    ) {
      impure += 1;
    }
  }

  blame(screw, 'screw accumulator drifts with frame rate by');
  blame(lean, 'lean damping drifts with frame rate by');
  if (impure > 0) fail(`${impure} strand(s) mutated while being sampled`);

  if (failed === before) {
    console.log(
      `frames   ok  screw ${screw.value.toExponential(1)}, ` +
        `lean ${lean.value.toExponential(1)} over 1 s at 60 vs 30 fps`,
    );
  }
}

/* ------------------------------------------------- 9. tuning parser ------ */

/**
 * `?sweepAmp` is the one knob a reviewer will reach for, so it has to clamp
 * rather than trust. Pinned now, before tuning work starts adding to it.
 */
function checkTuningParser() {
  const before = failed;
  const table: Array<[string, number]> = [
    /* Not a number at all: fall through to the default, do not go NaN. */
    ['?sweepAmp=abc', 1],
    ['?sweepAmp=-4', 0],
    ['?sweepAmp=99', 3],
    ['?sweepAmp=0', 0],
    ['?sweepAmp=2', 2],
    /* `?sweep=0` is the true revert and has to win over any amplitude. */
    ['?sweep=0&sweepAmp=2', 0],
  ];

  for (const [search, want] of table) {
    const got = sweepTuningFor(search).amplitude;
    if (got !== want) fail(`${search} gave amplitude ${got}, expected ${want}`);
  }

  /*
   * Phase 3 replaced the two ad-hoc branches with one table. Every knob in it
   * has to be reachable, clamped at both ends, and inert when garbled —
   * a knob that forgets its clamp is the exact failure the table prevents.
   */
  const knobs: Array<[keyof SweepTuning, string, number]> = [
    ['speed', 'sweepSpeed', 4],
    ['wobble', 'sweepWobble', 0.2],
    ['lean', 'sweepLean', 0.6],
    ['lump', 'sweepLump', 0.08],
    ['radiusWave1', 'sweepR1', 0.5],
    ['radiusWave2', 'sweepR2', 0.5],
  ];

  for (const [key, param, max] of knobs) {
    const dflt = SWEEP_TUNING[key];
    const mid = max / 2;
    const cases: Array<[string, number]> = [
      [`?${param}=${mid}`, mid],
      /* Below the floor and above the ceiling both clamp, not throw. */
      [`?${param}=-1`, 0],
      [`?${param}=1e6`, max],
      /* Garbled is the dangerous one: NaN would reach a vertex position. */
      [`?${param}=abc`, dflt],
      [`?${param}=0`, 0],
    ];

    for (const [search, want] of cases) {
      const got = sweepTuningFor(search)[key];
      if (got !== want) fail(`${search} gave ${key} ${got}, expected ${want}`);
    }

    /* The master revert outranks every knob, not only the amplitude. */
    const reverted = sweepTuningFor(`?sweep=0&${param}=${mid}`);
    if (reverted.amplitude !== 0) {
      fail(`?sweep=0&${param}=${mid} left amplitude ${reverted.amplitude}`);
    }
  }

  /* No query string at all is the hot path: it must hand back the shared
     tuning rather than allocating a copy on every call. */
  if (sweepTuningFor('') !== SWEEP_TUNING) fail('empty search allocated a new tuning');

  const cases = table.length + knobs.length * 6 + 1;
  if (failed === before) console.log(`parser   ok  ${cases} cases`);
}

/* ------------------------------------------------- 10. rung span ------ */

/**
 * The cylinder must enter both tubes.
 *
 * `Rungs` used to set `scale.y = 2 * spec.radius` — centreline to centreline —
 * which leaves an air gap of about one tube radius at each end. The contract:
 *
 * 1. Span ≥ live rail distance when the strand is fully grown.
 * 2. The surplus is `2 * liveRadius * RUNG_BURY` (the bury into each wall).
 * 3. `converge = 1` is finite (no `p1 − p0` normalisation).
 * 4. At `amplitude = 0`, live and baked helpers agree.
 */
function checkRungSpan() {
  const before = failed;
  const a = new Vector3();
  const b = new Vector3();
  const surplus = worst();
  const baked = worst();
  let nan = 0;
  let short = 0;

  for (const spec of STRANDS) {
    for (const amplitude of AMPLITUDES) {
      const live = seedLive(spec, amplitude);
      const tuning = tuningAt(amplitude);

      for (const [flatten, converge] of POSES) {
        for (let i = 0; i < SAMPLES; i += 1) {
          const t = i / (SAMPLES - 1);
          setPose(live, flatten, converge, 1);

          const span = rungSpanInto(live, t, TUBE_RADIUS, tuning);
          if (!Number.isFinite(span)) {
            nan += 1;
            continue;
          }

          sampleLiveInto(live, 0, t, a);
          sampleLiveInto(live, Math.PI, t, b);
          const rail = a.distanceTo(b);
          const where =
            `${spec.id} t=${t.toFixed(2)} flatten=${flatten} ` +
            `converge=${converge} amp=${amplitude}`;

          if (span + 1e-9 < rail) {
            short += 1;
            fail(`${where} span ${span} < rail ${rail}`);
          }

          const f = t * live.length - live.distance;
          const radius =
            TUBE_RADIUS *
            (1 +
              live.amp *
                (tuning.radiusWave1 * Math.sin(f * 1.9 + 1.3) +
                  tuning.radiusWave2 * Math.sin(f * 4.3 + 0.4)));
          note(surplus, Math.abs(span - rail - 2 * radius * RUNG_BURY), Math.max(LIMIT, quant(rail + 1)), where);

          if (amplitude === 0) {
            const want = rungSpanBaked(spec, flatten, converge, TUBE_RADIUS);
            note(baked, Math.abs(span - want), Math.max(LIMIT, quant(rail + 1)), where);
          }
        }
      }
    }
  }

  if (nan > 0) fail(`${nan} rung span sample(s) were not finite`);
  blame(surplus, 'rung span surplus is not 2·radius·bury');
  blame(baked, 'rungSpanInto at amp=0 differs from rungSpanBaked');

  if (failed === before) {
    console.log(
      `span     ok  surplus ${surplus.value.toExponential(1)}, ` +
        `baked ${baked.value.toExponential(1)}, ${short} short, ${nan} nan`,
    );
  }
}

/**
 * `setLivePose` is what production calls, so the parity run below must go
 * through it rather than a local copy of the formula — otherwise a wrong weight
 * would pass the sweep test and still desynchronise the shader.
 *
 * The assertion is the independent half: it re-derives `w` from the GLSL in
 * `organic.ts` / `HelixScene.tsx` (`clamp(uFlatten * 0.42 + uConverge, 0, 1)`)
 * so a change to either side shows up here.
 */
function setPose(
  live: Parameters<typeof sampleLiveInto>[0],
  flatten: number,
  converge: number,
  grow: number,
) {
  setLivePose(live, flatten, converge, grow);
  const shaderW = Math.min(1, Math.max(0, flatten * 0.42 + converge));
  if (Math.abs(live.w - shaderW) > LIMIT) {
    fail(`setLivePose weight ${live.w} != shader clamp(flatten*0.42 + converge) ${shaderW}`);
  }
}

const sweep = checkLayout();
sweep.geometry.dispose();
checkParity();
checkCurveDrift();
checkRailDiameter();
checkRadialAxis();
checkRingIntegrity();
checkRungMidpoint();
checkFrameRate();
checkMotion();
checkTuningParser();
checkRungSpan();

if (failed) {
  console.error(`${failed} check(s) failed`);
  process.exit(1);
}
console.log('sweep parity ok');
