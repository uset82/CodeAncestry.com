/**
 * The homepage cinematic sequence.
 *
 * This is the scroll script from research report 11 ("Home page cinematic
 * sequence"), implemented literally: an opening hold on a single helix, then
 * six scroll movements ending on the call to action.
 *
 *   00  a single floating helix                  "Every machine has ancestors."
 *   01  camera approaches one base pair          it resolves into a named gene
 *   02  the helix stretches into a track         CORE — MIDI — AUDIO — …
 *   03  the genome replicates                    KEYLIT → Kids, Studio
 *   04  the children mutate                      new capabilities appear
 *   05  a mutation travels back upstream         as a signed, evidenced offer
 *   06  pull back                                one family among millions
 *
 * Copy and 3D state are defined together so the animation never illustrates
 * something the words do not say. Each beat owns a point on the scroll axis and
 * a target scene state; `beatStateAt` eases between them.
 */

export type Beat = {
  id: string;
  index: string;
  headline: string;
  /** Emphasised tail of the headline, set in the accent. */
  outlined?: string;
  body: string;
  /** Scroll progress at which this beat is fully expressed. */
  at: number;

  /* ---------------------------------------------------------- scene state */
  /** How many generations of strands are visible. 1 = origin only. */
  generations: number;
  /** Camera dolly toward a single locus. 0 = wide, 1 = one base pair fills. */
  focus: number;
  /** 0 = helix, 1 = horizontal genomic track. */
  stretch: number;
  /** 0 = helix, 1 = flattened lineage tree. */
  flatten: number;
  /** Downward inheritance pulses. */
  inheritance: number;
  /** Mutation markers on the descendant strands. */
  mutate: number;
  /** The upstream mutation packet carrying evidence back to the ancestor. */
  upstream: number;
  /** Pull-back to the wider field of families. */
  zoomOut: number;
};

export const BEATS: Beat[] = [
  {
    id: 'origin',
    index: '00',
    headline: 'One project.',
    body: 'A browser piano tutor. Four hundred commits, ten capabilities, and no idea it was about to become a family.',
    at: 0,
    generations: 1,
    focus: 0,
    stretch: 0,
    flatten: 0,
    inheritance: 0,
    mutate: 0,
    upstream: 0,
    zoomOut: 0,
  },
  {
    id: 'gene',
    index: '01',
    headline: 'Every base pair is',
    outlined: 'a capability.',
    body: 'Not a file and not a function. MIDI scheduling is one thing the project can do — with a digest, a location in the source, and a reason to believe it is there.',
    at: 0.16,
    generations: 1,
    focus: 1,
    stretch: 0,
    flatten: 0,
    inheritance: 0,
    mutate: 0,
    upstream: 0,
    zoomOut: 0,
  },
  {
    id: 'track',
    index: '02',
    headline: 'Laid end to end,',
    outlined: 'they are a genome.',
    body: 'The whole composition on one axis: core, MIDI, audio, teacher, lessons. This is the same view the registry gives you, on a coordinate system you can zoom.',
    at: 0.34,
    generations: 1,
    focus: 0.15,
    stretch: 1,
    flatten: 0,
    inheritance: 0,
    mutate: 0,
    upstream: 0,
    zoomOut: 0,
  },
  {
    id: 'replicate',
    index: '03',
    headline: 'Then it',
    outlined: 'reproduced.',
    body: 'Someone forked it for six-year-olds. Someone else rebuilt it as a studio. Git recorded two unrelated repositories and lost the descent entirely.',
    at: 0.52,
    generations: 3,
    focus: 0,
    stretch: 0.25,
    flatten: 0.35,
    inheritance: 1,
    mutate: 0,
    upstream: 0,
    zoomOut: 0.1,
  },
  {
    id: 'mutate',
    index: '04',
    headline: 'The children',
    outlined: 'changed.',
    body: 'Gamification and adaptive difficulty in one branch. Composition and generative accompaniment in the other. Each change recorded against the capability it altered.',
    at: 0.68,
    generations: 4,
    focus: 0,
    stretch: 0.1,
    flatten: 0.6,
    inheritance: 0.4,
    mutate: 1,
    upstream: 0,
    zoomOut: 0.15,
  },
  {
    id: 'upstream',
    index: '05',
    headline: 'One improvement went',
    outlined: 'back up the family.',
    body: 'Four generations down, an agent cut input latency by twenty-two milliseconds — then offered it upward with a signed test run and a measured fitness vector. Nothing merged automatically.',
    at: 0.84,
    generations: 4,
    focus: 0,
    stretch: 0,
    flatten: 0.8,
    inheritance: 0.25,
    mutate: 0.5,
    upstream: 1,
    zoomOut: 0.2,
  },
  {
    id: 'network',
    index: '06',
    headline: 'And this is',
    outlined: 'one family.',
    body: 'Across every forge there are millions more, already related and already exchanging capabilities — with none of it written down.',
    /* Lands before the end of the runway so the closing frame holds long
       enough to read, rather than existing only at progress exactly 1. */
    at: 0.92,
    generations: 4,
    focus: 0,
    stretch: 0,
    flatten: 1,
    inheritance: 0.15,
    mutate: 0.3,
    upstream: 0.3,
    zoomOut: 1,
  },
];

/* Eased rather than linear. A straight lerp between keyframes reads mechanical;
   this is the standard Nightglass emphasised curve, applied per segment. */
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/** Interpolate the scene state for an arbitrary scroll progress. */
export function beatStateAt(progress: number) {
  const p = Math.min(1, Math.max(0, progress));

  let lowerIndex = 0;
  for (let i = 0; i < BEATS.length; i += 1) {
    if ((BEATS[i] as Beat).at <= p) lowerIndex = i;
  }

  const lower = BEATS[lowerIndex] as Beat;
  const upper = (BEATS[lowerIndex + 1] ?? lower) as Beat;

  const span = upper.at - lower.at;
  const raw = span > 0 ? (p - lower.at) / span : 0;
  const t = easeInOutCubic(Math.min(1, Math.max(0, raw)));
  const mix = (a: number, b: number) => a + (b - a) * t;

  return {
    progress: p,
    activeIndex: lowerIndex,
    generations: mix(lower.generations, upper.generations),
    focus: mix(lower.focus, upper.focus),
    stretch: mix(lower.stretch, upper.stretch),
    flatten: mix(lower.flatten, upper.flatten),
    inheritance: mix(lower.inheritance, upper.inheritance),
    mutate: mix(lower.mutate, upper.mutate),
    upstream: mix(lower.upstream, upper.upstream),
    zoomOut: mix(lower.zoomOut, upper.zoomOut),
  };
}

export type BeatState = ReturnType<typeof beatStateAt>;

/**
 * The labels that appear on the loci when the camera moves in.
 *
 * Report 11: the base pairs "reveal themselves as code abstractions" — these are
 * the exact tokens it lists.
 */
export const BASE_PAIR_TOKENS = ['{}', '()', '<>', '01', 'SHA', 'API', 'AST', 'TEST', 'MCP'];

/** The capability track revealed at beat 02, in genome order. */
export const TRACK_SEGMENTS = [
  { id: 'core', label: 'CORE' },
  { id: 'midi', label: 'MIDI' },
  { id: 'audio', label: 'AUDIO' },
  { id: 'teacher', label: 'TEACHER' },
  { id: 'lessons', label: 'LESSONS' },
];
