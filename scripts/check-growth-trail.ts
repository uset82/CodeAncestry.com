/**
 * Prove rungs and gene loci stay behind the tube's worst-case front.
 * Throwaway for HANDOFF.md cause 2 — run with `npx tsx scripts/check-growth-trail.ts`.
 */
import {
  GROWTH_SPREAD,
  STRANDS,
  growthAlong,
  growthJitterAt,
  growthNoiseLive,
  rungInset,
} from '../components/viz/helix/strands';

const RUNGS = 24;
const recede = 0.5 * GROWTH_SPREAD / (1 + GROWTH_SPREAD);

const tubeWorst = (grow: number) => grow - recede * growthNoiseLive(grow);

const maxDrawnT = (grow: number) => {
  const eased = grow - growthJitterAt(grow);
  let max = -Infinity;
  for (const spec of STRANDS) {
    const inset = rungInset(spec.generation);
    for (let i = 0; i < RUNGS; i += 1) {
      const t = inset.start + ((i + 0.5) / RUNGS) * (1 - inset.start - inset.end);
      if (growthAlong(eased, t) > 0.001) max = Math.max(max, t);
    }
    for (let i = 0; i < spec.loci; i += 1) {
      const t = (i + 0.5) / spec.loci;
      if (growthAlong(eased, t) > 0.001) max = Math.max(max, t);
    }
  }
  return max;
};

console.log('grow  trail   maxT    tube    delta   ok');
let failed = 0;
for (let grow = 0.1; grow <= 1.001; grow += 0.05) {
  const g = Math.min(1, Number(grow.toFixed(2)));
  const maxT = maxDrawnT(g);
  const tube = tubeWorst(g);
  const drawn = Number.isFinite(maxT);
  const ok = !drawn || maxT < tube;
  if (!ok) failed += 1;
  console.log(
    [
      g.toFixed(2),
      growthJitterAt(g).toFixed(4),
      drawn ? maxT.toFixed(4) : 'none',
      tube.toFixed(4),
      drawn ? (tube - maxT).toFixed(4) : '—',
      ok ? 'yes' : 'NO',
    ].join('  '),
  );
}

console.log('');
console.log('growthJitterAt', { 0.5: growthJitterAt(0.5), 0.9: growthJitterAt(0.9), 1: growthJitterAt(1) });
if (failed) {
  console.error(`${failed} grow values failed`);
  process.exit(1);
}
