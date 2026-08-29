/**
 * Prove `beatStateAt` returns every named scalar at each of the twelve anchors.
 * Run with `npx tsx scripts/check-beats.ts`.
 */
import { BEATS, beatStateAt } from '../components/viz/helix/beats';

const SCALARS = [
  'generations',
  'inheritance',
  'upstream',
  'flatten',
  'geneFocus',
  'mutate',
  'agents',
  'sources',
  'converge',
  'alarm',
  'rewind',
  'recovery',
  'zoomOut',
  'cameraMultiple',
  'lookX',
] as const;

if (BEATS.length !== 12) {
  throw new Error(`expected 12 beats, got ${BEATS.length}`);
}

let failed = 0;
for (let i = 0; i < BEATS.length; i += 1) {
  const state = beatStateAt(i, 0);
  for (const key of SCALARS) {
    if (typeof state[key] !== 'number' || Number.isNaN(state[key])) {
      console.error(`beat ${i} missing ${key}`);
      failed += 1;
    }
  }
  if (state.activeIndex !== i) {
    console.error(`beat ${i} activeIndex ${state.activeIndex}`);
    failed += 1;
  }
}

const mid = beatStateAt(3, 0.5);
if (mid.generations <= 2 || mid.generations >= 4) {
  console.error(`beat 3→4 should lerp generations, got ${mid.generations}`);
  failed += 1;
}

console.log(`beats ${BEATS.length} anchors, ${failed} failures`);
if (failed > 0) process.exit(1);
