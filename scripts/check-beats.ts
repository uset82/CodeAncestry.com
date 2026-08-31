/**
 * Prove `beatStateAt` returns every named scalar at each of the twelve anchors.
 * Run with `npx tsx scripts/check-beats.ts`.
 */
import {
  BEATS,
  beatStateAt,
  framingAt,
  specimenRightEdge,
} from '../components/viz/helix/beats';

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

/* The aim is stated in pixels and converted per beat, so it is no longer one
   constant. What has to hold is that every beat reaches the same target: the
   specimen's right edge parks a fixed margin in from the frame's right edge,
   whatever distance its own camera sits at. A beat that is twice as far away
   needs twice the world-space offset for the same on-screen result — which is
   exactly the property the old shared constant violated.

   Checked at three widths because the target is the shell's right edge, not
   the window's: a 1920 screen has to park the specimen beside the copy, not
   two hundred pixels outside the layout. */
for (const cm of [0.15, 0.21, 0.45, 1, 1.25]) {
  for (const width of [1280, 1600, 1920]) {
    const frame = framingAt(width, 900, cm);
    const rightEdge = width / 2 + frame.lookX * frame.ppu + frame.span / 2;
    const want = specimenRightEdge(width);
    if (Math.abs(rightEdge - want) > 0.5) {
      console.error(
        `cameraMultiple ${cm} at ${width}px parks the specimen at x ${rightEdge.toFixed(1)}, want ${want}`,
      );
      failed += 1;
    }
  }
}

const mid = beatStateAt(3, 0.5);
if (mid.generations <= 2 || mid.generations >= 4) {
  console.error(`beat 3→4 should lerp generations, got ${mid.generations}`);
  failed += 1;
}

console.log(`beats ${BEATS.length} anchors, ${failed} failures`);
if (failed > 0) process.exit(1);
