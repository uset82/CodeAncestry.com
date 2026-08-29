import { DEMO_KIND, type DemoMeta } from './kind';

export const mutationM94012 = {
  meta: { kind: DEMO_KIND, label: 'DEMO LINEAGE' } satisfies DemoMeta,
  id: 'DEMO:M-94012',
  capability: 'Navigation',
  parentGene: 'NAV-G288.118',
  introducedGeneration: 119,
  createdBy: 'DEMO:A-918',
  reviewedBy: 'DEMO:A-771',
  testsPassed: 98,
  testsTotal: 100,
  performance: '+8.4%',
  security: 'WARNING',
  inheritedBy: 3842,
  lastSafeAncestor: 118,
  replacement: 'DEMO:M-94013',
  actions: ['ADOPT', 'TEST', 'SIMULATE', 'REJECT', 'QUARANTINE'] as const,
} as const;
