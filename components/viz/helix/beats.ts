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

export type BeatSide = 'left' | 'right' | 'full';

import { FAMILY_HALF_HEIGHT } from './strands';

/**
 * The composition, in pixels.
 *
 * The aim used to be one world-unit constant shared by all twelve beats. World
 * units are the wrong currency: the beats do not share a camera distance, so a
 * beat at `cameraMultiple: 0.45` aimed its specimen about 640px off centre
 * while a beat at `1.25` aimed the same specimen about 230px off centre. The
 * frame was never composed — it was a side effect of the distance.
 *
 * On the hero it produced a 598px hole between the last glyph (x 707) and the
 * first rail (x 1305), which is the gap this replaces.
 */
/** Room the specimen keeps from the right edge of the shell. */
const SPECIMEN_RIGHT_MARGIN = 40;
/**
 * Mirrors `.shell-wide` in `app/globals.css`. The page is not full-bleed, so
 * the specimen has to park against the *shell*, not the window. Parking
 * against the window put it 200px outside the layout on a 1920 screen and
 * left a 411px hole between it and the copy.
 */
const SHELL_MAX_WIDTH = 1480;
const SHELL_GUTTER = 40;
/**
 * Width of the drawn specimen in world units. Measured, not assumed:
 * `scripts/measure-hero-gap.mjs` differences a frame against one with the
 * canvas hidden and reports 287px at 139.8px per world unit.
 */
const SPECIMEN_WORLD_WIDTH = 2.05;
/** The frame the composition is authored against. Narrower frames pull back. */
const REFERENCE_WIDTH = 1600;
/** Reference height, for the server render where there is no window. */
const REFERENCE_HEIGHT = 900;

function viewportWidth(): number {
  return typeof window === 'undefined' ? REFERENCE_WIDTH : Math.max(1, window.innerWidth);
}

function viewportHeight(): number {
  return typeof window === 'undefined' ? REFERENCE_HEIGHT : Math.max(1, window.innerHeight);
}

/**
 * Debug framing overrides, read once and cached.
 *
 * `?extent=` pins the horizontal aim in world units, `?zoom=` scales every
 * beat's camera distance. They exist so the hero framing can be swept by
 * measurement instead of by eye: `scripts/measure-hero-gap.mjs` reports where
 * the specimen actually lands. The gap between copy and helix was guessed at
 * for a long time and was wrong by hundreds of pixels every time.
 */
let cachedFraming: { extent: number | null; zoom: number | null } | null = null;

function framingOverrides(): { extent: number | null; zoom: number | null } {
  if (cachedFraming) return cachedFraming;
  if (typeof window === 'undefined') {
    cachedFraming = { extent: null, zoom: null };
    return cachedFraming;
  }
  const params = new URLSearchParams(window.location.search);
  const extent = Number(params.get('extent'));
  const zoom = Number(params.get('zoom'));
  cachedFraming = {
    extent: Number.isFinite(extent) && extent >= 0.4 && extent <= 8 ? extent : null,
    zoom: Number.isFinite(zoom) && zoom >= 0.2 && zoom <= 4 ? zoom : null,
  };
  return cachedFraming;
}

/** Debug camera-distance scale. `1` unless `?zoom=` asks otherwise. */
export function framingZoom(): number {
  return framingOverrides().zoom ?? 1;
}

/**
 * Extra camera distance for frames narrower than the reference.
 *
 * The copy column is text at fixed pixel sizes, so it gives up very little
 * when the window narrows. Whatever room is left has to come out of the
 * specimen instead, or the two collide. `1` at the reference width and above;
 * grows as the window narrows, never shrinks.
 */
export function widthFit(width: number = viewportWidth()): number {
  return Math.max(1, REFERENCE_WIDTH / Math.max(320, width));
}

/**
 * The whole framing, as pure arithmetic over one viewport.
 *
 * Kept pure and exported so `scripts/check-beats.ts` can assert the
 * composition at several widths. The window-reading helpers below are thin
 * wrappers over it.
 *
 * Vertical fov is fixed, so the horizontal scale follows viewport height and
 * the distance — never the width. That is exactly why width has to be handled
 * separately, by `widthFit`.
 */
export function framingAt(width: number, height: number, cameraMultiple: number) {
  const ppu = height / (2 * FAMILY_HALF_HEIGHT * cameraMultiple * widthFit(width));
  const span = SPECIMEN_WORLD_WIDTH * ppu;
  const centre = specimenRightEdge(width) - span / 2;
  return { ppu, span, centre, lookX: (centre - width / 2) / ppu };
}

/** Pixels per world unit at a beat's camera distance. */
export function pixelsPerUnit(cameraMultiple: number): number {
  return framingAt(viewportWidth(), viewportHeight(), cameraMultiple).ppu;
}

/** On-screen width of the specimen at a beat's camera distance, in pixels. */
export function specimenSpan(cameraMultiple: number): number {
  return framingAt(viewportWidth(), viewportHeight(), cameraMultiple).span;
}

/**
 * Screen x of the specimen's right edge, in a viewport `width` px wide.
 *
 * Measured from the shell, so a 1920 screen parks the specimen in the same
 * place relative to the copy as a 1600 one instead of sliding it out past the
 * layout's right edge.
 */
export function specimenRightEdge(width: number): number {
  const shell = Math.min(SHELL_MAX_WIDTH, Math.max(320, width - SHELL_GUTTER));
  return (width + shell) / 2 - SPECIMEN_RIGHT_MARGIN;
}

/**
 * World-space aim that parks the specimen against the right of the shell.
 *
 * Stated as a target in pixels and converted, so every beat lands its specimen
 * in the same place however far away its own camera sits.
 */
export function lookXExtent(cameraMultiple: number = BEATS[0]!.cameraMultiple): number {
  const forced = framingOverrides().extent;
  if (forced !== null) return forced;
  const w = typeof window === 'undefined' ? REFERENCE_WIDTH : window.innerWidth;
  const centre = specimenRightEdge(w) - specimenSpan(cameraMultiple) / 2;
  return (centre - w / 2) / pixelsPerUnit(cameraMultiple);
}

export function lookXForSide(
  side: BeatSide,
  cameraMultiple: number = BEATS[0]!.cameraMultiple,
): number {
  const extent = lookXExtent(cameraMultiple);
  if (side === 'left') return -extent;
  if (side === 'right') return extent;
  return 0;
}

export function parseBeatSide(value: string | undefined): BeatSide | null {
  if (value === 'left' || value === 'right' || value === 'full') return value;
  return null;
}

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
    headline: 'Every machine has ancestors.',
    body: 'CodeAncestry creates a living genealogy for software, AI agents, and machines — tracking the capabilities they inherit, the mutations they acquire, and the generations that shaped them.',
    ...ZERO_POSE,
    generations: 1,
    /* 0.45 framed the specimen at 287px of a 1600px frame — 18% of the width,
       pinned to the right edge, with a 598px hole between it and the copy.
       0.20 puts it at roughly 645px, which is the right side of the page
       actually being occupied.

       Both this beat and beat 1 are set together on purpose. The hero section
       is one viewport tall, so `measureViewportBeat` reads t = 0.5 at the top
       of the page and the opening frame is a blend of the two — beat 0 on its
       own is never actually seen. 0.16 and 0.24 blend to 0.20, which is the
       size the opening frame needs. Beat 1 is a gene close-up, so sitting
       closer suits it anyway. */
    cameraMultiple: 0.15,
  },
  {
    id: 'genes',
    index: '02',
    headline: 'Capabilities light up.',
    body: 'Each locus on the strand is one thing the project can do — a software gene, not a file.',
    ...ZERO_POSE,
    generations: 1,
    geneFocus: 1,
    /* Paired with beat 0 — see the note there. Was 0.45. */
    cameraMultiple: 0.21,
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
    /* Aimed per beat. `cameraMultiple` is interpolated with everything else,
       so the specimen slides to the same place on the way between beats
       instead of jumping when the scalar does. */
    lookX: -lookXExtent(scalars.cameraMultiple),
    side: 'left' as BeatSide,
    ...scalars,
  };
}

export type BeatState = ReturnType<typeof beatStateAt>;

function sideOf(el: HTMLElement, beat: number, previous?: BeatSide): BeatSide {
  const side = parseBeatSide(el.dataset.beatSide);
  if (side) return side;
  /* Missing side is a contract bug. Inherit the previous section in
     production so a marketing page never 500s; centre if there is no
     previous, so the overlap stays visible. */
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.helixSideMissing = String(beat);
  }
  console.error(`[helix] [data-beat="${beat}"] is missing data-beat-side`);
  return previous ?? 'full';
}

function withSide(index: number, t: number, from: BeatSide, to: BeatSide): BeatState {
  const mixT = Math.min(1, Math.max(0, t));
  const base = beatStateAt(index, t);
  /* The aim has to be taken at the *interpolated* distance. Resolving it from
     the beat's own scalar alone used beat 0's camera multiple for every beat,
     so the specimen was aimed by one distance and drawn at another: on the
     hero that put it 250px further right than the composition asked for. */
  const aim = (side: BeatSide) => lookXForSide(side, base.cameraMultiple);
  const lookX = aim(from) + (aim(to) - aim(from)) * mixT;
  return { ...base, lookX, side: mixT < 0.5 ? from : to };
}

export function measureViewportBeat(): { state: BeatState; owns3d: boolean } {
  if (typeof window === 'undefined') return { state: beatStateAt(0, 0), owns3d: false };

  const mid = window.innerHeight / 2;
  const viewH = window.innerHeight;
  const nodes = [...document.querySelectorAll<HTMLElement>('[data-beat]')]
    .map((el) => ({
      el,
      beat: Number(el.dataset.beat),
      rect: el.getBoundingClientRect(),
    }))
    .filter((node) => Number.isFinite(node.beat))
    .sort((a, b) => a.beat - b.beat);

  if (nodes.length === 0) return { state: beatStateAt(0, 0), owns3d: false };

  const intersecting = nodes.some((node) => node.rect.bottom > 0 && node.rect.top < viewH);

  const lastDeclaredSide = (before: number): BeatSide | undefined => {
    for (let j = before - 1; j >= 0; j -= 1) {
      const declared = parseBeatSide(nodes[j]?.el.dataset.beatSide);
      if (declared) return declared;
    }
    return undefined;
  };

  const neighbour = (i: number) => {
    const node = nodes[i];
    const next = nodes[i + 1];
    if (!node) return { from: 'left' as BeatSide, to: 'left' as BeatSide };
    const from = sideOf(node.el, node.beat, lastDeclaredSide(i));
    return { from, to: next ? sideOf(next.el, next.beat, from) : from };
  };

  for (let i = 0; i < nodes.length; i += 1) {
    const node = nodes[i];
    if (!node) continue;
    if (node.rect.top <= mid && node.rect.bottom > mid) {
      const span = node.rect.height;
      const t = span > 0 ? (mid - node.rect.top) / span : 0;
      const { from, to } = neighbour(i);
      return { state: withSide(node.beat, t, from, to), owns3d: true };
    }
  }

  for (let i = 0; i < nodes.length - 1; i += 1) {
    const lower = nodes[i];
    const upper = nodes[i + 1];
    if (!lower || !upper) continue;
    if (lower.rect.bottom <= mid && upper.rect.top > mid) {
      const { from, to } = neighbour(i);
      return { state: withSide(lower.beat, 1, from, to), owns3d: true };
    }
  }

  const first = nodes[0];
  const lastNode = nodes[nodes.length - 1];
  if (first && first.rect.top > mid) {
    const side = sideOf(first.el, first.beat);
    return { state: withSide(first.beat, 0, side, side), owns3d: intersecting };
  }
  if (lastNode) {
    const side = sideOf(lastNode.el, lastNode.beat, lastDeclaredSide(nodes.length));
    return { state: withSide(lastNode.beat, 0, side, side), owns3d: intersecting };
  }
  return { state: beatStateAt(0, 0), owns3d: false };
}

/** Closing hold. Replaces the old runway-after-last-fraction. */
export function holdProgress(state: Pick<BeatState, 'zoomOut'>): number {
  return state.zoomOut;
}

export function climaxAmount(
  state: Pick<BeatState, 'progress' | 'upstream' | 'recovery' | 'zoomOut'>,
): number {
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
