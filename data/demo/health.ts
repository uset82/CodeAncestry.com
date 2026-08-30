import { DEMO_KIND, type DemoMeta } from './kind';
import { AXIS_IDS } from './axis-family';
import { mutationM94012 } from './mutation-m94012';
import type { LineageKind } from './lineage-kinds';

export type HealthViewId = 'impact' | 'repair';

export type HealthStatus = 'WARNING' | 'QUARANTINE' | 'AGGREGATE';

export type HealthInheritor = {
  id: string;
  name: string;
  kind: LineageKind | 'AGGREGATE';
  status: HealthStatus;
  generation: number;
  role: string;
  href?: string;
};

export const HEALTH_VIEWS = [
  { id: 'impact', label: 'Inherited warning', mark: '!' },
  { id: 'repair', label: 'Replacement', mark: '✓' },
] as const;

/**
 * Named inheritors of M-94012 on the AXIS family, plus the undrawn remainder.
 * These are genomes, not robots. 4 + 3,838 = 3,842.
 */
export const healthInheritors: readonly HealthInheritor[] = [
  {
    id: AXIS_IDS.mutant,
    name: 'AXIS Mutant',
    kind: 'MUTATION',
    status: 'WARNING',
    generation: 3,
    role: 'Authored the write on NAV-G288.',
    href: '#codetree',
  },
  {
    id: AXIS_IDS.agent,
    name: 'AXIS Agent Build',
    kind: 'AGENT-CREATED',
    status: 'WARNING',
    generation: 4,
    role: 'Inherited through the mutant line.',
    href: '#agents',
  },
  {
    id: AXIS_IDS.verified,
    name: 'AXIS Verified',
    kind: 'VERIFIED',
    status: 'WARNING',
    generation: 4,
    role: 'Adopted M-94012 after review. The write still stands.',
    href: '#trust',
  },
  {
    id: AXIS_IDS.quarantine,
    name: 'AXIS Quarantine',
    kind: 'MUTATION',
    status: 'QUARANTINE',
    generation: 4,
    role: 'Held. The labelled successor on this edge is M-94013.',
    href: '#mutation',
  },
  {
    id: 'DEMO:HEALTH-REMAINDER',
    name: '3,838 more inheritors',
    kind: 'AGGREGATE',
    status: 'AGGREGATE',
    generation: 0,
    role: 'Not drawn. Impact is a count. The helix lights the set, not five meshes.',
  },
];

export const lineageHealth = {
  meta: { kind: DEMO_KIND, label: 'DEMO LINEAGE' } satisfies DemoMeta,
  id: 'DEMO:HEALTH-M94012',
  mutationId: mutationM94012.id,
  geneId: 'DEMO:NAV-G288',
  replacementId: mutationM94012.replacement,
  lastSafeAncestor: mutationM94012.lastSafeAncestor,
  descendants: mutationM94012.inheritedBy,
  sample: healthInheritors,
  remainder: mutationM94012.inheritedBy - (healthInheritors.length - 1),
} as const;
