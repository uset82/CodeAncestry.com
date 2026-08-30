import { DEMO_KIND, type DemoMeta } from './kind';

export const BLAST_MODES = [
  { id: 'capability', label: 'Search capability' },
  { id: 'paste', label: 'Paste code' },
  { id: 'url', label: 'Repository URL' },
] as const;

export type BlastModeId = (typeof BLAST_MODES)[number]['id'];

export const BLAST_ACTIONS = [
  {
    id: 'compare',
    label: 'Compare Genomes',
    detail: 'NAV-G288 against NavigationCore. Same job, different family record. Demo only.',
  },
  {
    id: 'ancestors',
    label: 'View Ancestors',
    detail: 'NAV-G288 originates on RoverNav, then AXIS Navigator. Open the CodeTree.',
    href: '#codetree',
  },
  {
    id: 'descendant',
    label: 'Find Best Descendant',
    detail: 'AXIS Verified is the labelled healthy child of AXIS Mutant on this demo tree.',
    href: '#codetree',
  },
  {
    id: 'compat',
    label: 'Test Compatibility',
    detail:
      'Licence compatible. Tests 98 / 100. Security WARNING — this rung does not clear a write.',
  },
] as const;

export type BlastActionId = (typeof BLAST_ACTIONS)[number]['id'];

export const blastQuery = {
  meta: { kind: DEMO_KIND, label: 'PROTOTYPE' } satisfies DemoMeta,
  capability: 'adaptive navigation buffering',
  paste: `// Demo snippet — not a live fingerprint.
function bufferNav(sample, horizon) {
  return sample.stabilize(horizon);
}`,
  url: 'https://github.com/rovernav/core',
} as const;

/** Seeded relatives for the example query. Percentages are lexical demo ranks. */
export const blastHits = [
  {
    id: 'DEMO:NAV-G288',
    name: 'NAV-G288',
    family: 'AXIS / RoverNav',
    identity: 98,
    mark: '△',
    href: '#genome',
  },
  {
    id: 'DEMO:NAV-CORE',
    name: 'NavigationCore',
    family: 'Adjacent family',
    identity: 94,
    mark: '△',
  },
  {
    id: 'DEMO:ROVER-BUF',
    name: 'RoverNav Buffer',
    family: 'RoverNav',
    identity: 91,
    mark: '△',
    href: '#codetree',
  },
  {
    id: 'DEMO:AUTO-NAV',
    name: 'AutonomyStack NAV',
    family: 'Cross-family',
    identity: 88,
    mark: '△',
  },
] as const;

export type BlastHit = (typeof blastHits)[number];

const CAPABILITY_HIT = /adaptive|navigation|buffer/i;

export function demoBlastHits(mode: BlastModeId, query: string): readonly BlastHit[] {
  const trimmed = query.trim();
  if (!trimmed) return [];
  if (mode === 'capability' && !CAPABILITY_HIT.test(trimmed)) return [];
  return blastHits;
}
