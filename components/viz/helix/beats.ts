/**
 * The five scroll-driven beats of the hero.
 *
 * Copy and 3D state are defined together so the animation is never illustrating
 * something the words do not say. Each beat owns a slice of scroll progress in
 * [0, 1] and a target visual state the scene lerps toward.
 */

export type Beat = {
  id: string;
  index: string;
  headline: string;
  outlined?: string;
  body: string;
  /** Scroll progress at which this beat is fully expressed. */
  at: number;
  /** How many generations of strands are visible. */
  generations: number;
  /** Downward inheritance pulses. */
  inheritance: number;
  /** The upstream mutation pulse, carrying evidence back to the ancestor. */
  upstream: number;
  /** 0 = helix, 1 = flattened lineage tree. */
  flatten: number;
};

export const BEATS: Beat[] = [
  {
    id: 'origin',
    index: '01',
    headline: 'One project.',
    body: 'A browser piano tutor. Four hundred commits, ten capabilities, no idea it was about to become a family.',
    at: 0,
    generations: 1,
    inheritance: 0,
    upstream: 0,
    flatten: 0,
  },
  {
    id: 'descent',
    index: '02',
    headline: 'Then it had',
    outlined: 'descendants.',
    body: 'Someone forked it for six-year-olds. Someone else rebuilt it as a studio. An accessibility collective made it playable without sight. Git recorded three unrelated repositories.',
    at: 0.22,
    generations: 2,
    inheritance: 0.2,
    upstream: 0,
    flatten: 0,
  },
  {
    id: 'inheritance',
    index: '03',
    headline: 'They inherited',
    outlined: 'capabilities.',
    body: 'Not files. Capabilities. MIDI scheduling, sample playback, a tool surface for agents — carried forward, some unchanged, some rewritten, each traceable to where it started.',
    at: 0.44,
    generations: 3,
    inheritance: 1,
    upstream: 0,
    flatten: 0,
  },
  {
    id: 'mutation',
    index: '04',
    headline: 'A great-grandchild',
    outlined: 'learned something.',
    body: 'Four generations down, an agent measured jitter its ancestor never looked at, replaced the fixed buffer, and cut input latency by twenty-two milliseconds.',
    at: 0.65,
    generations: 4,
    inheritance: 0.35,
    upstream: 0.3,
    flatten: 0.1,
  },
  {
    id: 'propagation',
    index: '05',
    headline: 'And sent it back',
    outlined: 'up the family.',
    body: 'With a signed test run, a measured fitness vector and a reproducible sandbox. Nothing merged automatically. Four ancestors were offered the change and each one decides.',
    /* Lands before the end of the runway so the closing beat gets a hold. */
    at: 0.86,
    generations: 4,
    inheritance: 0.25,
    upstream: 1,
    flatten: 0.72,
  },
];

/** Interpolate the scene state for an arbitrary scroll progress. */
export function beatStateAt(progress: number) {
  const p = Math.min(1, Math.max(0, progress));

  let lower = BEATS[0] as Beat;
  let upper = BEATS[0] as Beat;

  for (let i = 0; i < BEATS.length; i += 1) {
    const beat = BEATS[i] as Beat;
    if (beat.at <= p) {
      lower = beat;
      upper = (BEATS[i + 1] ?? beat) as Beat;
    }
  }

  const span = upper.at - lower.at;
  const t = span > 0 ? (p - lower.at) / span : 0;
  const mix = (a: number, b: number) => a + (b - a) * t;

  return {
    progress: p,
    activeIndex: BEATS.indexOf(lower),
    generations: mix(lower.generations, upper.generations),
    inheritance: mix(lower.inheritance, upper.inheritance),
    upstream: mix(lower.upstream, upper.upstream),
    flatten: mix(lower.flatten, upper.flatten),
  };
}

export type BeatState = ReturnType<typeof beatStateAt>;

const LAST_BEAT_AT = BEATS[BEATS.length - 1]!.at;

/**
 * Camera follows the five beats, then holds. Progress after the last beat is
 * a written hold, not more descent — that extra dive is what used to dim the
 * closing frame (more fog, more empty canvas).
 */
export function cameraProgress(progress: number): number {
  return Math.min(Math.max(0, progress), LAST_BEAT_AT);
}

/** 0 until the last beat, 1 at the end of the runway. */
export function holdProgress(progress: number): number {
  if (progress <= LAST_BEAT_AT) return 0;
  return Math.min(1, (progress - LAST_BEAT_AT) / (1 - LAST_BEAT_AT));
}

/**
 * How hard the specimen is lit. Rises with the upstream pulse, then a little
 * more on the written hold so the closing frame — not the mutation beat —
 * is the brightest.
 */
export function climaxAmount(state: { progress: number; upstream: number }): number {
  const rise = Math.max(0, (state.progress - 0.62) / 0.38);
  return Math.max(state.upstream, rise) + holdProgress(state.progress) * 1.15;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * How hard the specimen is lit. 0 is the unlit origin. 1 is the closing frame.
 * This does not move the ground colour — the void stays `#07090d`.
 *
 * `HelixHero` writes it to `--daylight`. `StudioRig` uses the same number for
 * lights and fog density.
 */
export function daylight(progress: number): number {
  return smoothstep(0.62, 0.78, Math.min(1, Math.max(0, progress)));
}
