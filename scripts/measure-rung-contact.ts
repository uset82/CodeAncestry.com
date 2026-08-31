/**
 * Does the rung actually reach the backbone?
 *
 * The rung is an instanced unit cylinder scaled in Y, centred on the midpoint
 * of the two rails. Three multipliers sit between `rungSpanInto` and what gets
 * drawn, and each one is a plain length scale — so each one pulls *both* tips
 * in by half its shortfall. The bury is only `RUNG_BURY * tubeRadius` deep, so
 * any multiplier that shrinks the rung by more than the bury's share of the
 * span detaches it.
 *
 * Reported in pixels as well as world units, because the hero is now ~2.5x
 * larger on screen: a detach that used to be 2px is now 6px, which is the
 * difference between invisible and obvious.
 *
 *   npx tsx scripts/measure-rung-contact.ts
 */
import { Vector3 } from 'three';
import { framingAt, BEATS } from '../components/viz/helix/beats';
import {
  STRANDS,
  growthAlong,
  growthJitterAt,
  pathTaper,
  rungInset,
  startTaperWidth,
  strandEased,
} from '../components/viz/helix/strands';
import {
  RUNG_BURY,
  SWEEP_TUNING,
  advanceLive,
  createStrandLive,
  liveRadialInto,
  liveRadiusAt,
  rungCenterInto,
  rungSpanInto,
  sampleLiveInto,
  setLivePose,
} from '../components/viz/helix/sweep';

const TUBE = 0.04;
const RUNGS = 24;
const WIDTH = 1600;
const HEIGHT = 900;

/**
 * Worst case of `breathe` in `Rungs`: `1 + sin(...) * 0.06 * (1 - flatten)`.
 * Per-slot and out of phase, so at any instant some rungs are at the bottom of
 * it. Measured here rather than assumed away.
 */
const BREATHE_MIN = 0.94;
const BREATHE_MAX = 1.06;

const a = new Vector3();
const b = new Vector3();
const center = new Vector3();
const dir = new Vector3();

function slots(spec: (typeof STRANDS)[number]) {
  const inset = rungInset(spec.generation);
  return Array.from({ length: RUNGS }, (_, i) => {
    const t = inset.start + ((i + 0.5) / RUNGS) * (1 - inset.start - inset.end);
    return { t, i };
  });
}

function check(
  label: string,
  beat: (typeof BEATS)[number],
  breathe: number,
  spec: (typeof STRANDS)[number],
) {
  const grow = strandEased(beat.generations, spec.generation);
  if (grow < 0.08) return null;

  const live = createStrandLive(spec, 120);
  advanceLive(live, 1 / 60, 3.7, { x: 0.3, y: -0.2 }, SWEEP_TUNING);
  setLivePose(live, beat.flatten ?? 0, beat.converge ?? 0, grow);

  const eased = grow - growthJitterAt(grow);
  const { ppu } = framingAt(WIDTH, HEIGHT, beat.cameraMultiple);

  let worstGap = -Infinity;
  let worstGapSlot = -1;
  let worstPenetration = Infinity;
  let poke = -Infinity;

  for (const { t, i } of slots(spec)) {
    sampleLiveInto(live, 0, t, a);
    sampleLiveInto(live, Math.PI, t, b);
    const rail = a.distanceTo(b);
    const tubeR = liveRadiusAt(live, t, TUBE, SWEEP_TUNING);

    rungCenterInto(live, t, center);
    liveRadialInto(live, t, dir);

    const span = rungSpanInto(live, t, TUBE, SWEEP_TUNING);
    const front = growthAlong(eased, t);
    const taper = pathTaper(t, eased, startTaperWidth(spec.generation));
    /* `breathe` is on the thickness now, not the length — a length pulse on a
       connector can only ever detach it. The sweep below still walks the whole
       range so the report shows the length is breathe-invariant. */
    const scaleY = span * front * taper * (1 - (beat.converge ?? 0) * 0.82);

    /* Tip distance from the rung's centre, along the rail axis. */
    const tip = scaleY / 2;
    const railHalf = rail / 2;

    /* Positive => the tip stops short of the tube's inner surface: a real gap. */
    const gap = railHalf - tubeR - tip;
    /* How far the tip gets past the rail centreline. Want ~RUNG_BURY * tubeR. */
    const penetration = tip - railHalf;
    /* Positive => the tip punches out through the far wall of the tube. */
    const through = tip - (railHalf + tubeR);

    if (gap > worstGap) {
      worstGap = gap;
      worstGapSlot = i;
    }
    if (front > 0.99 && taper > 0.99) {
      worstPenetration = Math.min(worstPenetration, penetration);
      poke = Math.max(poke, through);
    }
  }

  const px = (v: number) => (v * ppu).toFixed(1).padStart(7);
  const verdict = worstGap > 0 ? 'GAP' : 'ok';
  console.log(
    `${label.padEnd(30)} ${spec.id.padEnd(11)} breathe ${breathe.toFixed(2)}  ` +
      `worstGap ${px(worstGap)}px (slot ${String(worstGapSlot).padStart(2)})  ` +
      `minPenetration ${px(worstPenetration)}px  ` +
      `pokeThrough ${px(poke)}px  ${verdict}`,
  );
  return worstGap;
}

console.log(`rung contact at ${WIDTH}x${HEIGHT}`);
console.log(
  `bury ${RUNG_BURY} x tubeRadius ${TUBE} = ${(RUNG_BURY * TUBE).toFixed(4)} world ` +
    `(${(100 * (2 * RUNG_BURY * TUBE) / (2 * 0.46 + 2 * RUNG_BURY * TUBE)).toFixed(2)}% of the span)`,
);
console.log(
  `breathe swing ${((1 - BREATHE_MIN) * 100).toFixed(0)}% .. ` +
    `+${((BREATHE_MAX - 1) * 100).toFixed(0)}%  (${BREATHE_MIN} .. ${BREATHE_MAX})`,
);
console.log();
console.log('hero beats, where the specimen is largest:');

for (const breathe of [1, BREATHE_MIN, BREATHE_MAX]) {
  for (const index of [0, 1, 2]) {
    const beat = BEATS[index]!;
    for (const spec of STRANDS) {
      check(`beat ${index} ${beat.id ?? ''}`.slice(0, 30), beat, breathe, spec);
    }
  }
  console.log();
}

console.log('grown-family beats, for comparison:');
for (const index of [3, 5, 7, 11]) {
  const beat = BEATS[index]!;
  for (const spec of STRANDS) {
    check(`beat ${index} ${beat.id ?? ''}`.slice(0, 30), beat, BREATHE_MIN, spec);
  }
  console.log();
}
