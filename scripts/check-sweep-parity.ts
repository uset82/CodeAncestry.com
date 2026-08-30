/**
 * Prove the live sweep cannot drift from the geometry it replaces.
 *
 * Three assertions, all browser-free:
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
 * Run with `npx tsx scripts/check-sweep-parity.ts`.
 */
import { CatmullRomCurve3, TubeGeometry, Vector3 } from 'three';
import {
  STRANDS,
  applyConvergeInto,
  axisPointAtInto,
  sampleBackbone,
  strandBasis,
  type StrandBasis,
  type StrandSpec,
} from '../components/viz/helix/strands';
import {
  advanceLive,
  createStrandLive,
  createSweepGeometry,
  sampleLiveInto,
  setLivePose,
  sweepTuningFor,
} from '../components/viz/helix/sweep';

const LIMIT = 1e-6;
const RINGS = 120;
const RADIAL = 8;

let failed = 0;
const fail = (message: string) => {
  failed += 1;
  console.error(`FAIL ${message}`);
};

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

if (failed) {
  console.error(`${failed} check(s) failed`);
  process.exit(1);
}
console.log('sweep parity ok');
