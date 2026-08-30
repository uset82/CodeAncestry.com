import { DEMO_KIND, type DemoMeta } from './kind';
import { mutationM94012 } from './mutation-m94012';

export const TRACE_ACTIONS = [
  'ROLLBACK',
  'PATCH',
  'QUARANTINE',
  'SIMULATE FIX',
  'WARN DESCENDANTS',
  'TRACE SIBLING MUTATIONS',
] as const;

export type TraceActionId = (typeof TRACE_ACTIONS)[number];

export type TracePhase = 'armed' | 'playing' | 'settled';

export const TRACE_ACTION_COPY: Record<TraceActionId, string> = {
  ROLLBACK: 'Would restore generation 118 on receiving genomes. Demo only — nothing is rolled back.',
  PATCH: 'Would apply replacement M-94013. Demo only — the successor is labelled, not written.',
  QUARANTINE: 'Would freeze M-94012 propagation. Demo only — AXIS Quarantine is the labelled hold.',
  'SIMULATE FIX': 'Would replay generation 118 → 119 on a sandbox descendant. Demo only.',
  'WARN DESCENDANTS':
    'Would notify the 3,842 inheritors. Demo only — no messages are sent. The fan-out is Lineage Health.',
  'TRACE SIBLING MUTATIONS': 'Would walk other writes on NAV-G288. Demo only.',
};

export const TRACE_STEPS = [
  {
    id: 'behavior',
    mark: '!',
    kind: 'BEHAVIOR',
    title: 'Unexpected navigation behavior',
    detail: 'Detected on the live capability. The specimen changes shape, not only colour.',
  },
  {
    id: 'gene',
    mark: '△',
    kind: 'GENE',
    title: 'NAV-G288',
    detail: 'Adaptive navigation buffering. Parent of the mutation.',
    href: '#genome',
  },
  {
    id: 'mutation',
    mark: '◆',
    kind: 'MUTATION',
    title: 'M-94012',
    detail: 'Write on NAV-G288.118. Security stays WARNING.',
    href: '#mutation',
  },
  {
    id: 'generation',
    mark: '#',
    kind: 'GENERATION',
    title: 'Generation 119',
    detail: 'The generation that accepted the write.',
    href: '#codetree',
  },
  {
    id: 'author',
    mark: '●',
    kind: 'AGENT',
    title: 'Agent A-918',
    detail: 'Created the mutation.',
    href: '#agents',
  },
  {
    id: 'reviewer',
    mark: '●',
    kind: 'AGENT',
    title: 'Agent A-771',
    detail: 'Reviewed the mutation.',
    href: '#agents',
  },
  {
    id: 'descendants',
    mark: '▣',
    kind: 'DESCENDANTS',
    title: '3,842 descendants',
    detail: 'Inherited the write. Impact is a count, not a colour.',
    href: '#health',
  },
  {
    id: 'confirmed',
    mark: '!',
    kind: 'CONFIRM',
    title: 'Abnormal behavior confirmed',
    detail: 'The warning is a mark. Colour is secondary.',
    href: '#trust',
  },
  {
    id: 'safe',
    mark: '✓',
    kind: 'KNOWN-GOOD',
    title: 'Generation 118',
    detail: 'Last safe ancestor. Replacement recorded as M-94013.',
    href: '#mutation',
  },
] as const;

export const traceFailure = {
  meta: { kind: DEMO_KIND, label: 'DEMO LINEAGE' } satisfies DemoMeta,
  id: 'DEMO:TRACE-M94012',
  trigger: 'Unexpected navigation behavior detected.',
  mutationId: mutationM94012.id,
  geneId: 'DEMO:NAV-G288',
  introducedGeneration: mutationM94012.introducedGeneration,
  lastSafeAncestor: mutationM94012.lastSafeAncestor,
  createdBy: mutationM94012.createdBy,
  reviewedBy: mutationM94012.reviewedBy,
  descendants: mutationM94012.inheritedBy,
  replacement: mutationM94012.replacement,
  steps: TRACE_STEPS,
  actions: TRACE_ACTIONS,
} as const;
