import { Vector3 } from 'three';

/**
 * The strand layout: one double helix per genome, arranged so the eight seeded
 * projects form a legible tree descending through the frame. Scrolling the hero
 * literally descends through the generations.
 */

export type StrandSpec = {
  id: string;
  label: string;
  generation: number;
  start: Vector3;
  end: Vector3;
  turns: number;
  radius: number;
  /** How many gene loci sit along this strand. */
  loci: number;
  parent?: string;
  /** Second parent, for the hybrid. */
  parentB?: string;
  /** The one strand that authors the upstream mutation. */
  origin?: boolean;
};

/* Every child starts exactly on its parent's `end`. Generation 1 used to start
   near it but not on it — offsets of up to 0.235 world units, which read as a
   gap at the one junction the camera looks straight at. Generations 2 and 3
   already followed this rule; now all of them do. */
export const STRANDS: StrandSpec[] = [
  {
    id: 'keylit',
    label: 'KEYLIT',
    generation: 0,
    start: new Vector3(0, 3.6, 0),
    end: new Vector3(0, -0.2, 0),
    turns: 2.4,
    radius: 0.46,
    loci: 6,
  },
  {
    id: 'kids',
    label: 'KEYLIT Kids',
    generation: 1,
    start: new Vector3(0, -0.2, 0),
    end: new Vector3(-3.1, -3.6, -0.5),
    turns: 2.1,
    radius: 0.38,
    loci: 5,
    parent: 'keylit',
  },
  {
    id: 'studio',
    label: 'KEYLIT Studio',
    generation: 1,
    start: new Vector3(0, -0.2, 0),
    end: new Vector3(0.5, -3.9, 1.1),
    turns: 2.1,
    radius: 0.38,
    loci: 5,
    parent: 'keylit',
  },
  {
    id: 'accessible',
    label: 'KEYLIT Accessibility',
    generation: 1,
    start: new Vector3(0, -0.2, 0),
    end: new Vector3(3.2, -3.4, -0.7),
    turns: 2.1,
    radius: 0.38,
    loci: 5,
    parent: 'keylit',
  },
  {
    id: 'kidsEs',
    label: 'KEYLIT Kids ES',
    generation: 2,
    start: new Vector3(-3.1, -3.6, -0.5),
    end: new Vector3(-4.7, -7.0, 0.5),
    turns: 1.8,
    radius: 0.32,
    loci: 4,
    parent: 'kids',
    origin: true,
  },
  {
    id: 'classroom',
    label: 'KEYLIT Classroom',
    generation: 2,
    start: new Vector3(-3.1, -3.6, -0.5),
    end: new Vector3(-1.7, -7.2, -1.3),
    turns: 1.8,
    radius: 0.32,
    loci: 4,
    parent: 'kids',
  },
  {
    id: 'producer',
    label: 'Music Producer',
    generation: 2,
    start: new Vector3(0.5, -3.9, 1.1),
    end: new Vector3(1.6, -7.1, 1.7),
    turns: 1.8,
    radius: 0.32,
    loci: 4,
    parent: 'studio',
  },
  {
    id: 'tutor',
    label: 'Junior Music Tutor',
    generation: 3,
    start: new Vector3(-4.7, -7.0, 0.5),
    end: new Vector3(-2.4, -9.9, 1.0),
    turns: 1.5,
    radius: 0.27,
    loci: 3,
    parent: 'kidsEs',
    parentB: 'producer',
  },
];

export const STRANDS_BY_ID = new Map(STRANDS.map((s) => [s.id, s]));

/** The path a mutation walks from its origin strand back to generation zero. */
export const UPSTREAM_PATH = ['kidsEs', 'kids', 'keylit'] as const;

/**
 * The labelled loci. Only two strands are annotated — generation zero, where
 * every capability starts, and the descendant that discovered the mutation —
 * because labelling all eight would read as noise rather than as a genome.
 */
export type LocusLabel = {
  strand: string;
  /** Index into the strand's loci, 0-based from the top. */
  index: number;
  short: string;
  gene: string;
  origin: string;
  accession: string;
  mutated?: boolean;
};

export const LOCUS_LABELS: LocusLabel[] = [
  {
    strand: 'keylit',
    index: 0,
    short: 'MIDI',
    gene: 'MIDI event scheduling',
    origin: 'KEYLIT · generation 0',
    accession: 'CAGENE:MIDI-SCHEDULING',
  },
  {
    strand: 'keylit',
    index: 1,
    short: 'AUDIO',
    gene: 'Sampled audio engine',
    origin: 'KEYLIT · generation 0',
    accession: 'CAGENE:AUDIO-ENGINE',
  },
  {
    strand: 'keylit',
    index: 2,
    short: 'UI',
    gene: 'Piano keyboard renderer',
    origin: 'KEYLIT · generation 0',
    accession: 'CAGENE:PIANO-RENDERER',
  },
  {
    strand: 'keylit',
    index: 3,
    short: 'LESSON',
    gene: 'Lesson progression engine',
    origin: 'KEYLIT · generation 0',
    accession: 'CAGENE:LESSON-ENGINE',
  },
  {
    strand: 'keylit',
    index: 4,
    short: 'AGENT',
    gene: 'Teacher agent surface',
    origin: 'KEYLIT · generation 0',
    accession: 'CAGENE:TEACHER-AGENT',
  },
  {
    strand: 'keylit',
    index: 5,
    short: 'STORE',
    gene: 'Local persistence',
    origin: 'KEYLIT · generation 0',
    accession: 'CAGENE:PERSISTENCE',
  },
  {
    strand: 'kidsEs',
    index: 2,
    short: 'MIDI',
    gene: 'Adaptive MIDI buffering',
    origin: 'Mutated here · inherited from KEYLIT',
    accession: 'CAALLELE:MIDI-SCHEDULING:5',
    mutated: true,
  },
];

/**
 * Samples one backbone of a strand's double helix.
 *
 * `phase` offsets the second backbone by π. `flatten` collapses the helix radius
 * and the depth axis toward zero, turning the organism into a lineage diagram.
 */
export function sampleBackbone(
  spec: StrandSpec,
  phase: number,
  samples: number,
  flatten: number,
): Vector3[] {
  const axis = new Vector3().subVectors(spec.end, spec.start);
  const length = axis.length();
  const dir = axis.clone().normalize();

  const reference = Math.abs(dir.y) > 0.95 ? new Vector3(1, 0, 0) : new Vector3(0, 1, 0);
  const u = new Vector3().crossVectors(dir, reference).normalize();
  const v = new Vector3().crossVectors(dir, u).normalize();

  const radius = spec.radius * (1 - flatten);
  const points: Vector3[] = [];

  for (let i = 0; i <= samples; i += 1) {
    const t = i / samples;
    const angle = phase + t * spec.turns * Math.PI * 2;
    const point = spec.start
      .clone()
      .addScaledVector(dir, t * length)
      .addScaledVector(u, Math.cos(angle) * radius)
      .addScaledVector(v, Math.sin(angle) * radius);
    point.z *= 1 - flatten * 0.85;
    points.push(point);
  }

  return points;
}

const GROW_WIDTH = 0.08;

/** Smoothstep the generation counter so a strand extends instead of popping. */
export function strandEased(generations: number, generation: number): number {
  const reveal = Math.min(1, Math.max(0, generations - generation));
  return reveal * reveal * (3 - 2 * reveal);
}

/**
 * How far past this slot the growth front has travelled. 0 = still ahead of
 * the tip, 1 = the tip has moved on and this detail should be fully on.
 */
export function growthAlong(eased: number, t: number, width = GROW_WIDTH): number {
  return Math.min(1, Math.max(0, (eased - t) / width));
}

/** Centre-line position at parameter t. Writes into `target` — no allocation. */
export function axisPointAtInto(
  spec: StrandSpec,
  t: number,
  flatten: number,
  target: Vector3,
): Vector3 {
  target.lerpVectors(spec.start, spec.end, t);
  target.z *= 1 - flatten * 0.85;
  return target;
}

/** Centre-line position at parameter t, where the rungs and loci sit. */
export function axisPointAt(spec: StrandSpec, t: number, flatten: number): Vector3 {
  return axisPointAtInto(spec, t, flatten, new Vector3());
}

/**
 * One point on a backbone (phase 0 or π). Used by pulses so they follow the
 * live flatten value instead of a curve baked at construction.
 */
export function backbonePointAtInto(
  spec: StrandSpec,
  basis: StrandBasis,
  phase: number,
  t: number,
  flatten: number,
  target: Vector3,
): Vector3 {
  const length = spec.start.distanceTo(spec.end);
  const radius = spec.radius * (1 - flatten);
  const angle = phase + t * spec.turns * Math.PI * 2;
  target.copy(spec.start).addScaledVector(basis.dir, t * length);
  target.addScaledVector(basis.u, Math.cos(angle) * radius);
  target.addScaledVector(basis.v, Math.sin(angle) * radius);
  target.z *= 1 - flatten * 0.85;
  return target;
}

export type StrandBasis = {
  /** Unit vector along the strand, start to end. */
  dir: Vector3;
  /** The two vectors spanning the plane the helix rotates in. */
  u: Vector3;
  v: Vector3;
};

/** Orthonormal frame for a strand, shared by the rung and locus placement. */
export function strandBasis(spec: StrandSpec): StrandBasis {
  const dir = new Vector3().subVectors(spec.end, spec.start).normalize();
  const reference = Math.abs(dir.y) > 0.95 ? new Vector3(1, 0, 0) : new Vector3(0, 1, 0);
  const u = new Vector3().crossVectors(dir, reference).normalize();
  const v = new Vector3().crossVectors(dir, u).normalize();
  return { dir, u, v };
}

/**
 * The direction a base-pair rung points at parameter t: the radial axis of the
 * helix, since the two backbones are exactly half a turn apart.
 */
export function rungDirection(spec: StrandSpec, basis: StrandBasis, t: number): Vector3 {
  const angle = t * spec.turns * Math.PI * 2;
  return new Vector3()
    .addScaledVector(basis.u, Math.cos(angle))
    .addScaledVector(basis.v, Math.sin(angle))
    .normalize();
}
