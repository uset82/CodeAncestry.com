/**
 * Fidelity budget for the specimen at its *on-screen* size.
 *
 * The hero beat moved from `cameraMultiple` 0.45 to ~0.195, which is a ~2.3x
 * zoom. Tessellation, shadow-map resolution and shadow bias are all fixed in
 * world units, so none of them were re-tuned — but every one of them is paid
 * for in pixels. Anything that was a sub-pixel blemish at 287px wide is now a
 * visible defect at 728px.
 *
 * This prints the budget in pixels so the trade is a measured length rather
 * than a screenshot opinion. Browser-free on purpose: `framingAt` is pure.
 *
 *   npx tsx scripts/measure-specimen-fidelity.ts
 */
import { Vector3 } from 'three';
import { BEATS, framingAt } from '../components/viz/helix/beats';
import { STRANDS } from '../components/viz/helix/strands';

/** `HelixScene.tsx`. */
const QUALITY = {
  low: { tubular: 48, radial: 5, radius: 0.034 },
  high: { tubular: 120, radial: 8, radius: 0.04 },
} as const;

/** `studio.tsx`. */
const SHADOW_MAP = 1024;
const SHADOW_NORMAL_BIAS = 0.02;
const KEY_LIGHT = new Vector3(4.4, 6.6, 3.6);
const FRUSTUM_SLACK = 0.4;

/**
 * `HelixScene.tsx:859` — `<cylinderGeometry args={[0.02, 0.02, 1, 8]} />`.
 * The rungs are half the backbone's thickness, which is what makes the shared
 * normalBias a problem: one world-space offset cannot suit both.
 */
const RUNG_RADIUS = 0.02;

/** Mirrors `normalBiasFor` in `studio.tsx` — a bias held constant in pixels. */
const SHADOW_BIAS_PX = 2;

function normalBiasFor(ppu: number): number {
  return Math.min(0.25 * RUNG_RADIUS, Math.max(0.0015, SHADOW_BIAS_PX / ppu));
}

/** The zoom the hero sat at before the gap work. */
const BASELINE_CAMERA_MULTIPLE = 0.45;

const WIDTH = 1600;
const HEIGHT = 900;

function shadowFrustum() {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  for (const spec of STRANDS) {
    const pad = spec.radius + 0.2;
    for (const p of [spec.start, spec.end]) {
      minX = Math.min(minX, p.x - pad);
      maxX = Math.max(maxX, p.x + pad);
      minY = Math.min(minY, p.y - pad);
      maxY = Math.max(maxY, p.y + pad);
      minZ = Math.min(minZ, p.z - pad);
      maxZ = Math.max(maxZ, p.z + pad);
    }
  }
  const center = new Vector3((minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2);
  const forward = center.clone().sub(KEY_LIGHT).normalize();
  const up = new Vector3(0, 1, 0);
  if (Math.abs(forward.y) > 0.92) up.set(0, 0, 1);
  const right = new Vector3().crossVectors(forward, up).normalize();
  up.crossVectors(right, forward).normalize();

  let minR = Infinity;
  let maxR = -Infinity;
  let minU = Infinity;
  let maxU = -Infinity;
  const w = new Vector3();
  for (const x of [minX, maxX]) {
    for (const y of [minY, maxY]) {
      for (const z of [minZ, maxZ]) {
        w.set(x, y, z).sub(KEY_LIGHT);
        minR = Math.min(minR, w.dot(right));
        maxR = Math.max(maxR, w.dot(right));
        minU = Math.min(minU, w.dot(up));
        maxU = Math.max(maxU, w.dot(up));
      }
    }
  }
  return {
    width: maxR - minR + 2 * FRUSTUM_SLACK,
    height: maxU - minU + 2 * FRUSTUM_SLACK,
    center,
  };
}

/** Arc length of a strand's helix, not its axis — the coil is longer than its span. */
function helixArcLength(spec: (typeof STRANDS)[number]) {
  const axis = spec.end.clone().sub(spec.start).length();
  const coil = 2 * Math.PI * spec.turns * spec.radius;
  return Math.hypot(axis, coil);
}

/** Only the strands that exist at `generations`, the way `grownFamilyY` sees them. */
function grownSpecs(generations: number) {
  return STRANDS.filter((spec) => {
    const grow = Math.min(1, Math.max(0, generations - spec.generation));
    return grow >= 0.08;
  });
}

/** Frustum extent needed to cover just the grown strands. */
function grownFrustum(generations: number) {
  const specs = grownSpecs(generations);
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  for (const spec of specs) {
    const pad = spec.radius + 0.2;
    for (const p of [spec.start, spec.end]) {
      minX = Math.min(minX, p.x - pad);
      maxX = Math.max(maxX, p.x + pad);
      minY = Math.min(minY, p.y - pad);
      maxY = Math.max(maxY, p.y + pad);
      minZ = Math.min(minZ, p.z - pad);
      maxZ = Math.max(maxZ, p.z + pad);
    }
  }
  const center = new Vector3((minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2);
  const forward = center.clone().sub(KEY_LIGHT).normalize();
  const up = new Vector3(0, 1, 0);
  if (Math.abs(forward.y) > 0.92) up.set(0, 0, 1);
  const right = new Vector3().crossVectors(forward, up).normalize();
  up.crossVectors(right, forward).normalize();

  let minR = Infinity;
  let maxR = -Infinity;
  let minU = Infinity;
  let maxU = -Infinity;
  const w = new Vector3();
  for (const x of [minX, maxX]) {
    for (const y of [minY, maxY]) {
      for (const z of [minZ, maxZ]) {
        w.set(x, y, z).sub(KEY_LIGHT);
        minR = Math.min(minR, w.dot(right));
        maxR = Math.max(maxR, w.dot(right));
        minU = Math.min(minU, w.dot(up));
        maxU = Math.max(maxU, w.dot(up));
      }
    }
  }
  return {
    extent: Math.max(maxR - minR, maxU - minU) + 2 * FRUSTUM_SLACK,
    center,
  };
}

const FRUSTUM = shadowFrustum();
const texelWorld = Math.max(FRUSTUM.width, FRUSTUM.height) / SHADOW_MAP;

console.log('what the frustum *needs* to cover, per beat');
for (const [i, beat] of BEATS.entries()) {
  const g = grownFrustum(beat.generations);
  const texel = g.extent / SHADOW_MAP;
  const { ppu } = framingAt(WIDTH, HEIGHT, beat.cameraMultiple);
  console.log(
    `  beat ${String(i).padStart(2)}  generations ${String(beat.generations).padEnd(4)}  ` +
      `strands ${String(grownSpecs(beat.generations).length).padStart(2)}  ` +
      `extent ${g.extent.toFixed(2).padStart(5)}  ` +
      `texel ${(texel * ppu).toFixed(2).padStart(5)}px  ` +
      `(now ${(texelWorld * ppu).toFixed(2)}px)`,
  );
}
console.log();

console.log('shadow budget');
console.log(
  `  full-family ortho box ${FRUSTUM.width.toFixed(2)} x ${FRUSTUM.height.toFixed(2)} world`,
);
console.log(`  map                   ${SHADOW_MAP}^2`);
console.log(
  `  full-family texel     ${texelWorld.toFixed(5)} world ` +
    `(${SHADOW_NORMAL_BIAS / texelWorld > 0 ? 'old bias was ' + SHADOW_NORMAL_BIAS : ''})`,
);
console.log(
  `  OLD normalBias        ${SHADOW_NORMAL_BIAS} world  ` +
    `= ${(SHADOW_NORMAL_BIAS / RUNG_RADIUS).toFixed(2)}x the rung radius  <- leaked light`,
);
console.log(
  `  NEW normalBias        min(0.25 x RUNG_RADIUS, ${SHADOW_BIAS_PX}px / ppu), ` +
    `floor 0.0015  ->  ${(normalBiasFor(349) * 349).toFixed(1)}px at the hero`,
);
console.log();

function row(label: string, cm: number, tier: 'low' | 'high', generations: number) {
  const q = QUALITY[tier];
  const { ppu, span } = framingAt(WIDTH, HEIGHT, cm);
  const strand = STRANDS[0]!;
  const arc = helixArcLength(strand);
  const segment = arc / q.tubular;
  const tubeDiameter = 2 * q.radius;
  /* The box the light is actually fitted to at this beat. */
  const fitted = grownFrustum(generations).extent / SHADOW_MAP;
  const bias = normalBiasFor(ppu);
  console.log(
    `${label.padEnd(26)} cm ${cm.toFixed(3)}  ${tier.padEnd(4)}  ` +
      `span ${span.toFixed(0).padStart(4)}px  ppu ${ppu.toFixed(0).padStart(4)}  ` +
      `seg ${(segment * ppu).toFixed(1).padStart(5)}px  ` +
      `tube ${(tubeDiameter * ppu).toFixed(1).padStart(5)}px  ` +
      `rung ${(2 * RUNG_RADIUS * ppu).toFixed(1).padStart(5)}px  ` +
      `texel ${(fitted * ppu).toFixed(2).padStart(5)}px  ` +
      `bias ${(bias * ppu).toFixed(1).padStart(4)}px ` +
      `(${(100 * bias / RUNG_RADIUS).toFixed(0)}% of a rung)`,
  );
}

console.log(`fidelity budget at ${WIDTH}x${HEIGHT} (high tier is the desktop default)`);
console.log();
/* BEFORE the old frustum was fitted to the whole family whatever the beat,
   so its rows carry `generations: 4` — the full box. */
row('BEFORE gap work', BASELINE_CAMERA_MULTIPLE, 'high', 4);
row(
  'hero blend (beat0+1)/2',
  (BEATS[0]!.cameraMultiple + BEATS[1]!.cameraMultiple) / 2,
  'high',
  BEATS[0]!.generations,
);
console.log();
for (const [i, beat] of BEATS.entries()) {
  row(`beat ${i} ${beat.id ?? ''}`.slice(0, 26), beat.cameraMultiple, 'high', beat.generations);
}
console.log();
row('BEFORE gap work', BASELINE_CAMERA_MULTIPLE, 'low', 4);
row(
  'hero blend (beat0+1)/2',
  (BEATS[0]!.cameraMultiple + BEATS[1]!.cameraMultiple) / 2,
  'low',
  BEATS[0]!.generations,
);

console.log();
console.log('tube cross-section faceting (sagitta of the silhouette, px)');
for (const [tier, q] of Object.entries(QUALITY)) {
  for (const cm of [BASELINE_CAMERA_MULTIPLE, (BEATS[0]!.cameraMultiple + BEATS[1]!.cameraMultiple) / 2]) {
    const { ppu } = framingAt(WIDTH, HEIGHT, cm);
    const rPx = q.radius * ppu;
    const sagitta = rPx * (1 - Math.cos(Math.PI / q.radial));
    console.log(
      `  ${tier.padEnd(4)} radial ${String(q.radial).padStart(2)}  cm ${cm.toFixed(3)}  ` +
        `tube ${(2 * rPx).toFixed(1).padStart(5)}px  sagitta ${sagitta.toFixed(2)}px`,
    );
  }
}
