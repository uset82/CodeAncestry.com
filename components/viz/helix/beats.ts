/**
 * Twelve scroll-driven poses of the same node set.
 *
 * Beats no longer own scroll fractions. The driver finds the `[data-beat]`
 * section at the viewport centre and calls `beatStateAt(index, t)` where `t`
 * is how far through that section the centre has travelled. See
 * `docs/interaction-spec.md` → DECISION — the twelve-position map.
 */

export type Beat = {
  id: string;
  index: string;
  headline: string;
  outlined?: string;
  body: string;
  generations: number;
  inheritance: number;
  upstream: number;
  flatten: number;
  geneFocus: number;
  mutate: number;
  agents: number;
  sources: number;
  converge: number;
  alarm: number;
  rewind: number;
  recovery: number;
  zoomOut: number;
  /** Multiple of FAMILY_HALF_HEIGHT / tan(fov/2). */
  cameraMultiple: number;
};

const ZERO_POSE = {
  inheritance: 0,
  upstream: 0,
  flatten: 0,
  geneFocus: 0,
  mutate: 0,
  agents: 0,
  sources: 0,
  converge: 0,
  alarm: 0,
  rewind: 0,
  recovery: 0,
  zoomOut: 0,
} as const;

export const BEATS: Beat[] = [
  {
    id: 'project',
    index: '01',
    headline: 'One project.',
    body: 'A browser piano tutor. Four hundred commits, ten capabilities, no idea it was about to become a family.',
    ...ZERO_POSE,
    generations: 1,
    cameraMultiple: 0.45,
  },
  {
    id: 'genes',
    index: '02',
    headline: 'Capabilities light up.',
    body: 'Each locus on the strand is one thing the project can do — a software gene, not a file.',
    ...ZERO_POSE,
    generations: 1,
    geneFocus: 1,
    cameraMultiple: 0.45,
  },
  {
    id: 'mutation',
    index: '03',
    headline: 'One locus changes.',
    outlined: 'A mutation.',
    body: 'Software is evolving faster than we can understand it. One capability shifts, and the shift has an origin.',
    ...ZERO_POSE,
    generations: 1,
    geneFocus: 1,
    mutate: 1,
    cameraMultiple: 0.45,
  },
  {
    id: 'descendant',
    index: '04',
    headline: 'A genealogy layer',
    outlined: 'for software.',
    body: 'The helix splits. A descendant appears. CodeAncestry does not replace Git — it connects history living across it.',
    ...ZERO_POSE,
    generations: 2,
    inheritance: 0.4,
    geneFocus: 1,
    mutate: 1,
    cameraMultiple: 0.75,
  },
  {
    id: 'codetree',
    index: '05',
    headline: 'One genome becomes',
    outlined: 'generations.',
    body: 'Branches multiply. The same node set flattens toward a lineage you can read as a family.',
    ...ZERO_POSE,
    generations: 4,
    inheritance: 1,
    flatten: 0.4,
    geneFocus: 1,
    mutate: 1,
    cameraMultiple: 0.75,
  },
  {
    id: 'agents',
    index: '06',
    headline: 'AI agents leave',
    outlined: 'ancestry too.',
    body: 'Existing loci on the edges they authored shift into the agent register — same instances, a different pose.',
    ...ZERO_POSE,
    generations: 4,
    inheritance: 1,
    flatten: 0.4,
    geneFocus: 1,
    mutate: 1,
    agents: 1,
    cameraMultiple: 1,
  },
  {
    id: 'sources',
    index: '07',
    headline: 'Repositories connect.',
    body: 'Streams along the same pulse curves feed the roots. Provenance is a pose, not a new mesh.',
    ...ZERO_POSE,
    generations: 4,
    inheritance: 1,
    flatten: 0.4,
    geneFocus: 1,
    mutate: 1,
    agents: 1,
    sources: 1,
    cameraMultiple: 1,
  },
  {
    id: 'machine',
    index: '08',
    headline: 'Meet AX-2041.',
    body: 'No robot model. The lineage re-poses into a capability column — a machine genome is a layout.',
    ...ZERO_POSE,
    generations: 4,
    inheritance: 0.6,
    flatten: 1,
    geneFocus: 1,
    mutate: 1,
    agents: 0.6,
    sources: 0.6,
    converge: 1,
    cameraMultiple: 1,
  },
  {
    id: 'failure',
    index: '09',
    headline: 'One mutation becomes',
    outlined: 'a warning.',
    body: 'A gene and its descendants go amber, then rose. Colour is never the only encoding — the marker changes shape.',
    ...ZERO_POSE,
    generations: 4,
    flatten: 1,
    geneFocus: 1,
    mutate: 1,
    converge: 1,
    alarm: 1,
    cameraMultiple: 0.8,
  },
  {
    id: 'trace',
    index: '10',
    headline: 'Trace Failure.',
    body: 'The path lights backward. Ancestor to failure, reversed. Same pulses, inverted parameter.',
    ...ZERO_POSE,
    generations: 4,
    flatten: 1,
    geneFocus: 1,
    mutate: 1,
    converge: 1,
    alarm: 1,
    rewind: 1,
    cameraMultiple: 0.8,
  },
  {
    id: 'recovery',
    index: '11',
    headline: 'Last healthy ancestor.',
    body: 'A verified fix propagates from generation 118. Acid, and a verified mark — not colour alone.',
    ...ZERO_POSE,
    generations: 4,
    upstream: 1,
    flatten: 1,
    geneFocus: 1,
    converge: 1,
    recovery: 1,
    cameraMultiple: 0.8,
  },
  {
    id: 'network',
    index: '12',
    headline: 'Every machine',
    outlined: 'has ancestors.',
    body: 'The whole network, calm. Git tracks code. CodeAncestry tracks evolution.',
    ...ZERO_POSE,
    generations: 4,
    flatten: 0.72,
    geneFocus: 0.7,
    zoomOut: 1,
    cameraMultiple: 1.25,
  },
];

const SCALAR_KEYS = [
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
] as const;

export type BeatScalar = (typeof SCALAR_KEYS)[number];

/** Interpolate between beat `index` and the next. `t` is 0 at the top of the section. */
export function beatStateAt(index: number, t = 0) {
  const last = BEATS.length - 1;
  const i = Math.min(last, Math.max(0, Math.floor(index)));
  const lower = BEATS[i] as Beat;
  const upper = (BEATS[i + 1] ?? lower) as Beat;
  const mixT = i === last ? 0 : Math.min(1, Math.max(0, t));
  const mix = (a: number, b: number) => a + (b - a) * mixT;

  const scalars = Object.fromEntries(
    SCALAR_KEYS.map((key) => [key, mix(lower[key], upper[key])]),
  ) as Record<BeatScalar, number>;

  return {
    progress: last === 0 ? 0 : (i + mixT) / last,
    activeIndex: i,
    ...scalars,
  };
}

export type BeatState = ReturnType<typeof beatStateAt>;

export function measureViewportBeat(): { state: BeatState; owns3d: boolean } {
  if (typeof window === 'undefined') return { state: beatStateAt(0, 0), owns3d: false };

  const mid = window.innerHeight / 2;
  const viewH = window.innerHeight;
  const nodes = [...document.querySelectorAll<HTMLElement>('[data-beat]')]
    .map((el) => ({ el, beat: Number(el.dataset.beat), rect: el.getBoundingClientRect() }))
    .filter((node) => Number.isFinite(node.beat))
    .sort((a, b) => a.beat - b.beat);

  if (nodes.length === 0) return { state: beatStateAt(0, 0), owns3d: false };

  const intersecting = nodes.some((node) => node.rect.bottom > 0 && node.rect.top < viewH);

  for (const node of nodes) {
    if (node.rect.top <= mid && node.rect.bottom > mid) {
      const span = node.rect.height;
      const t = span > 0 ? (mid - node.rect.top) / span : 0;
      return { state: beatStateAt(node.beat, t), owns3d: true };
    }
  }

  for (let i = 0; i < nodes.length - 1; i += 1) {
    const lower = nodes[i];
    const upper = nodes[i + 1];
    if (!lower || !upper) continue;
    if (lower.rect.bottom <= mid && upper.rect.top > mid) {
      return { state: beatStateAt(lower.beat, 1), owns3d: true };
    }
  }

  const first = nodes[0];
  const lastNode = nodes[nodes.length - 1];
  if (first && first.rect.top > mid) {
    return { state: beatStateAt(first.beat, 0), owns3d: intersecting };
  }
  if (lastNode) return { state: beatStateAt(lastNode.beat, 0), owns3d: intersecting };
  return { state: beatStateAt(0, 0), owns3d: false };
}

/** Closing hold. Replaces the old runway-after-last-fraction. */
export function holdProgress(state: Pick<BeatState, 'zoomOut'>): number {
  return state.zoomOut;
}

export function climaxAmount(state: Pick<BeatState, 'progress' | 'upstream' | 'recovery' | 'zoomOut'>): number {
  return Math.max(state.upstream, state.recovery) + state.zoomOut * 1.15;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * Lighting intensity only. Written to `--daylight`. Does not move the ground.
 */
export function daylight(progress: number): number {
  return smoothstep(0.45, 0.92, Math.min(1, Math.max(0, progress)));
}
