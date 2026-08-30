import type { FamilyTree, TreeEdge, TreeNode } from '@/lib/registry/tree';
import type { EdgeType, EvidenceCode, EvidenceTier, InheritanceMode, LineageState } from '@/lib/schema/vocabulary';
import { EDGE_TYPE_META } from '@/lib/schema/vocabulary';
import { DEMO_KIND, type DemoMeta } from './kind';
import type { LineageKind } from './lineage-kinds';

/**
 * AXIS family for the homepage CodeTree. Not KEYLIT. Built as a FamilyTree so
 * the existing tidy layout can place it without loading the registry.
 */

export const AXIS_IDS = {
  rover: 'DEMO:ROVERNAV',
  vision: 'DEMO:OPENVISION',
  nav: 'DEMO:AXIS-NAV',
  core: 'DEMO:AXIS-ROBOT-CORE',
  field: 'DEMO:AXIS-FIELD',
  fieldEu: 'DEMO:AXIS-FIELD-EU',
  fieldUs: 'DEMO:AXIS-FIELD-US',
  fieldJp: 'DEMO:AXIS-FIELD-JP',
  fieldBr: 'DEMO:AXIS-FIELD-BR',
  cover: 'DEMO:AXIS-COVER',
  remix: 'DEMO:AXIS-REMIX',
  mutant: 'DEMO:AXIS-MUTANT',
  agent: 'DEMO:AXIS-AGENT',
  verified: 'DEMO:AXIS-VERIFIED',
  quarantine: 'DEMO:AXIS-QUARANTINE',
} as const;

export const axisLineageKinds: Record<string, LineageKind> = {
  [AXIS_IDS.rover]: 'ORIGINAL',
  [AXIS_IDS.vision]: 'ORIGINAL',
  [AXIS_IDS.nav]: 'CHILD',
  [AXIS_IDS.core]: 'HYBRID',
  [AXIS_IDS.field]: 'FORK',
  [AXIS_IDS.fieldEu]: 'CHILD',
  [AXIS_IDS.fieldUs]: 'CHILD',
  [AXIS_IDS.fieldJp]: 'CHILD',
  [AXIS_IDS.fieldBr]: 'CHILD',
  [AXIS_IDS.cover]: 'COVER',
  [AXIS_IDS.remix]: 'REMIX',
  [AXIS_IDS.mutant]: 'MUTATION',
  [AXIS_IDS.agent]: 'AGENT-CREATED',
  [AXIS_IDS.verified]: 'VERIFIED',
  [AXIS_IDS.quarantine]: 'MUTATION',
};

const EMPTY_COMPOSITION: TreeNode['composition'] = [];

const compose = (
  ...parts: { mode: InheritanceMode; count: number; share: number }[]
): TreeNode['composition'] => parts;

type NodeSpec = {
  id: string;
  name: string;
  tagline: string;
  generation: number;
  parents: { genome: string; relationship: string; contribution: number }[];
  children: string[];
  composition: TreeNode['composition'];
  geneCount: number;
  mutationsAuthored?: number;
  mutationsAdopted?: number;
  openProposals?: number;
  lineageAssurance?: EvidenceTier;
  agents?: TreeNode['agents'];
};

const makeNode = (spec: NodeSpec): TreeNode => ({
  accession: spec.id,
  project: spec.name,
  name: spec.name,
  slug: spec.id.replace(/^DEMO:/, '').toLowerCase(),
  tagline: spec.tagline,
  generation: spec.generation,
  commit: spec.id.slice(-7).toLowerCase(),
  repository: 'github:demo/axis-family',
  createdAt: `2024-0${Math.min(9, spec.generation + 1)}-12T00:00:00Z`,
  lineageAssurance: spec.lineageAssurance ?? 'reviewed',
  visibility: 'public',
  composition: spec.composition.length > 0 ? spec.composition : EMPTY_COMPOSITION,
  geneCount: spec.geneCount,
  parents: spec.parents,
  children: spec.children,
  agents: spec.agents ?? [],
  releases: [{ version: `g${spec.generation}`, verified: spec.lineageAssurance === 'verified' }],
  mutationsAuthored: spec.mutationsAuthored ?? 0,
  mutationsAdopted: spec.mutationsAdopted ?? 0,
  openProposals: spec.openProposals ?? 0,
});

const makeEdge = (
  id: string,
  type: EdgeType,
  from: string,
  to: string,
  state: LineageState,
  extras: Partial<Pick<TreeEdge, 'upstream' | 'mutation' | 'gene' | 'confidence' | 'evidence'>> = {},
): TreeEdge => {
  const meta = EDGE_TYPE_META[type];
  return {
    id,
    type,
    from,
    to,
    label: meta.label,
    verb: meta.verb,
    state,
    stroke: meta.stroke,
    tone: meta.tone,
    confidence: extras.confidence ?? 0.92,
    evidence: extras.evidence ?? (['STA'] satisfies EvidenceCode[]),
    createdAt: '2024-06-01T00:00:00Z',
    gene: extras.gene,
    mutation: extras.mutation,
    upstream: extras.upstream ?? false,
  };
};

const nodes: TreeNode[] = [
  makeNode({
    id: AXIS_IDS.rover,
    name: 'RoverNav',
    tagline: 'Founding navigation genome.',
    generation: 0,
    parents: [],
    children: [AXIS_IDS.vision, AXIS_IDS.nav],
    composition: compose({ mode: 'native', count: 4, share: 1 }),
    geneCount: 4,
    lineageAssurance: 'verified',
  }),
  makeNode({
    id: AXIS_IDS.vision,
    name: 'OpenVision',
    tagline: 'Founding vision genome. Secondary parent of AXIS Robot Core.',
    generation: 0,
    parents: [{ genome: AXIS_IDS.rover, relationship: 'founding peer', contribution: 1 }],
    children: [AXIS_IDS.core],
    composition: compose({ mode: 'native', count: 5, share: 1 }),
    geneCount: 5,
    lineageAssurance: 'verified',
  }),
  makeNode({
    id: AXIS_IDS.nav,
    name: 'AXIS Navigator',
    tagline: 'Direct child of RoverNav.',
    generation: 1,
    parents: [{ genome: AXIS_IDS.rover, relationship: 'child', contribution: 1 }],
    children: [AXIS_IDS.core],
    composition: compose(
      { mode: 'inherited', count: 3, share: 0.7 },
      { mode: 'local', count: 2, share: 0.3 },
    ),
    geneCount: 5,
  }),
  makeNode({
    id: AXIS_IDS.core,
    name: 'AXIS Robot Core',
    tagline: 'Hybrid of Navigator and OpenVision.',
    generation: 2,
    parents: [
      { genome: AXIS_IDS.nav, relationship: 'hybrid', contribution: 0.62 },
      { genome: AXIS_IDS.vision, relationship: 'hybrid', contribution: 0.38 },
    ],
    children: [
      AXIS_IDS.field,
      AXIS_IDS.cover,
      AXIS_IDS.remix,
      AXIS_IDS.mutant,
      AXIS_IDS.verified,
    ],
    composition: compose(
      { mode: 'inherited', count: 4, share: 0.48 },
      { mode: 'mutated', count: 3, share: 0.36 },
      { mode: 'local', count: 1, share: 0.16 },
    ),
    geneCount: 8,
    mutationsAuthored: 1,
  }),
  makeNode({
    id: AXIS_IDS.field,
    name: 'AXIS Field',
    tagline: 'Fork for outdoor deployment.',
    generation: 3,
    parents: [{ genome: AXIS_IDS.core, relationship: 'fork', contribution: 1 }],
    children: [AXIS_IDS.fieldEu, AXIS_IDS.fieldUs, AXIS_IDS.fieldJp, AXIS_IDS.fieldBr],
    composition: compose(
      { mode: 'inherited', count: 6, share: 0.8 },
      { mode: 'local', count: 2, share: 0.2 },
    ),
    geneCount: 8,
  }),
  makeNode({
    id: AXIS_IDS.fieldEu,
    name: 'AXIS Field EU',
    tagline: 'Regional child of the field fork.',
    generation: 4,
    parents: [{ genome: AXIS_IDS.field, relationship: 'child', contribution: 1 }],
    children: [],
    composition: compose({ mode: 'inherited', count: 8, share: 1 }),
    geneCount: 8,
  }),
  makeNode({
    id: AXIS_IDS.fieldUs,
    name: 'AXIS Field US',
    tagline: 'Regional child of the field fork.',
    generation: 4,
    parents: [{ genome: AXIS_IDS.field, relationship: 'child', contribution: 1 }],
    children: [],
    composition: compose({ mode: 'inherited', count: 8, share: 1 }),
    geneCount: 8,
  }),
  makeNode({
    id: AXIS_IDS.fieldJp,
    name: 'AXIS Field JP',
    tagline: 'Regional child of the field fork.',
    generation: 4,
    parents: [{ genome: AXIS_IDS.field, relationship: 'child', contribution: 1 }],
    children: [],
    composition: compose({ mode: 'inherited', count: 8, share: 1 }),
    geneCount: 8,
  }),
  makeNode({
    id: AXIS_IDS.fieldBr,
    name: 'AXIS Field BR',
    tagline: 'Regional child of the field fork.',
    generation: 4,
    parents: [{ genome: AXIS_IDS.field, relationship: 'child', contribution: 1 }],
    children: [],
    composition: compose({ mode: 'inherited', count: 8, share: 1 }),
    geneCount: 8,
  }),
  makeNode({
    id: AXIS_IDS.cover,
    name: 'AXIS Cover',
    tagline: 'A cover: the same genome restated.',
    generation: 3,
    parents: [{ genome: AXIS_IDS.core, relationship: 'cover', contribution: 1 }],
    children: [],
    composition: compose({ mode: 'inherited', count: 8, share: 1 }),
    geneCount: 8,
  }),
  makeNode({
    id: AXIS_IDS.remix,
    name: 'AXIS Remix',
    tagline: 'A remix of Robot Core capabilities.',
    generation: 3,
    parents: [{ genome: AXIS_IDS.core, relationship: 'remix', contribution: 1 }],
    children: [],
    composition: compose(
      { mode: 'inherited', count: 5, share: 0.55 },
      { mode: 'mutated', count: 2, share: 0.25 },
      { mode: 'local', count: 2, share: 0.2 },
    ),
    geneCount: 9,
  }),
  makeNode({
    id: AXIS_IDS.mutant,
    name: 'AXIS Mutant',
    tagline: 'Carries mutation M-94012 on NAV-G288.',
    generation: 3,
    parents: [{ genome: AXIS_IDS.core, relationship: 'mutation', contribution: 1 }],
    children: [AXIS_IDS.agent, AXIS_IDS.quarantine],
    composition: compose(
      { mode: 'inherited', count: 6, share: 0.62 },
      { mode: 'mutated', count: 2, share: 0.38 },
    ),
    geneCount: 8,
    mutationsAuthored: 1,
    openProposals: 1,
    agents: [
      {
        accession: 'DEMO:A-918',
        name: 'Agent A-918',
        provider: 'demo',
        generation: 6,
        memory: { summaries: 12, accepted: 4, rejected: 1, artifacts: 3 },
        authored: 1,
      },
    ],
  }),
  makeNode({
    id: AXIS_IDS.agent,
    name: 'AXIS Agent Build',
    tagline: 'Authored by an agent from the mutant line.',
    generation: 4,
    parents: [{ genome: AXIS_IDS.mutant, relationship: 'agent-created', contribution: 1 }],
    children: [],
    composition: compose(
      { mode: 'inherited', count: 5, share: 0.5 },
      { mode: 'mutated', count: 2, share: 0.3 },
      { mode: 'local', count: 2, share: 0.2 },
    ),
    geneCount: 9,
    agents: [
      {
        accession: 'DEMO:A-184',
        name: 'Agent A-184',
        provider: 'OpenAI',
        generation: 8,
        memory: { summaries: 40, accepted: 18, rejected: 3, artifacts: 9 },
        authored: 4,
      },
    ],
  }),
  makeNode({
    id: AXIS_IDS.verified,
    name: 'AXIS Verified',
    tagline: 'Adopted M-94012 after review.',
    generation: 4,
    parents: [{ genome: AXIS_IDS.core, relationship: 'child', contribution: 1 }],
    children: [],
    composition: compose(
      { mode: 'inherited', count: 6, share: 0.7 },
      { mode: 'mutated', count: 2, share: 0.3 },
    ),
    geneCount: 8,
    mutationsAdopted: 1,
    lineageAssurance: 'verified',
  }),
  makeNode({
    id: AXIS_IDS.quarantine,
    name: 'AXIS Quarantine',
    tagline: 'A later mutation held in quarantine.',
    generation: 4,
    parents: [{ genome: AXIS_IDS.mutant, relationship: 'mutation', contribution: 1 }],
    children: [],
    composition: compose(
      { mode: 'inherited', count: 6, share: 0.7 },
      { mode: 'mutated', count: 2, share: 0.3 },
    ),
    geneCount: 8,
    mutationsAuthored: 1,
    lineageAssurance: 'inferred',
  }),
];

const edges: TreeEdge[] = [
  makeEdge('e-nav', 'DERIVED_FROM', AXIS_IDS.nav, AXIS_IDS.rover, 'verified'),
  makeEdge('e-vision', 'DERIVED_FROM', AXIS_IDS.vision, AXIS_IDS.rover, 'verified'),
  makeEdge('e-core-nav', 'DERIVED_FROM', AXIS_IDS.core, AXIS_IDS.nav, 'reviewed'),
  makeEdge('e-core-vision', 'RECOMBINED_FROM', AXIS_IDS.core, AXIS_IDS.vision, 'reviewed'),
  makeEdge('e-field', 'DERIVED_FROM', AXIS_IDS.field, AXIS_IDS.core, 'reviewed'),
  makeEdge('e-field-eu', 'DERIVED_FROM', AXIS_IDS.fieldEu, AXIS_IDS.field, 'reviewed'),
  makeEdge('e-field-us', 'DERIVED_FROM', AXIS_IDS.fieldUs, AXIS_IDS.field, 'reviewed'),
  makeEdge('e-field-jp', 'DERIVED_FROM', AXIS_IDS.fieldJp, AXIS_IDS.field, 'reviewed'),
  makeEdge('e-field-br', 'DERIVED_FROM', AXIS_IDS.fieldBr, AXIS_IDS.field, 'reviewed'),
  makeEdge('e-cover', 'DERIVED_FROM', AXIS_IDS.cover, AXIS_IDS.core, 'inferred'),
  makeEdge('e-remix', 'RECOMBINED_FROM', AXIS_IDS.remix, AXIS_IDS.core, 'reviewed'),
  makeEdge('e-mutant', 'MUTATED_FROM', AXIS_IDS.mutant, AXIS_IDS.core, 'reviewed', {
    mutation: 'DEMO:M-94012',
    gene: 'DEMO:NAV-G288',
    confidence: 0.88,
    evidence: ['TST', 'SEC'],
  }),
  makeEdge('e-agent', 'DERIVED_FROM', AXIS_IDS.agent, AXIS_IDS.mutant, 'inferred'),
  makeEdge('e-quarantine', 'MUTATED_FROM', AXIS_IDS.quarantine, AXIS_IDS.mutant, 'quarantined', {
    mutation: 'DEMO:M-94013',
  }),
  makeEdge('e-verified', 'DERIVED_FROM', AXIS_IDS.verified, AXIS_IDS.core, 'verified'),
  makeEdge('e-propose', 'PROPOSED_TO', AXIS_IDS.mutant, AXIS_IDS.verified, 'proposed', {
    upstream: true,
    mutation: 'DEMO:M-94012',
    confidence: 0.81,
  }),
  makeEdge('e-adopt', 'ADOPTED_FROM', AXIS_IDS.verified, AXIS_IDS.mutant, 'verified', {
    upstream: true,
    mutation: 'DEMO:M-94012',
    confidence: 0.94,
    evidence: ['HVR', 'TST'],
  }),
];

const spine = nodes.map((node) => {
  const ranked = [...node.parents].sort((a, b) => b.contribution - a.contribution);
  const [primary, ...rest] = ranked;
  return {
    id: node.accession,
    parent: primary?.genome ?? null,
    secondaryParents: rest.map((parent) => parent.genome),
  };
});

export const axisFamily: FamilyTree = {
  slug: 'axis',
  name: 'AXIS',
  root: AXIS_IDS.rover,
  generations: 5,
  nodes,
  edges,
  spine,
  sankey: { nodes: [], links: [] },
  propagation: [
    {
      id: 'p-m94012',
      mutation: 'DEMO:M-94012',
      shortId: 'M-94012',
      title: 'Navigation buffer',
      from: AXIS_IDS.mutant,
      to: AXIS_IDS.verified,
      outcome: 'adopted',
      at: '2024-09-18T00:00:00Z',
      span: 1,
    },
  ],
  transfers: [],
  stats: {
    projects: nodes.length,
    genes: nodes.reduce((sum, node) => sum + node.geneCount, 0),
    mutations: 2,
    agents: 2,
    hybrids: 1,
    transfers: 0,
    upstreamProposals: 1,
  },
};

export const axisFamilyMeta = {
  meta: { kind: DEMO_KIND, label: 'DEMO LINEAGE' } satisfies DemoMeta,
} as const;

export function getAxisNode(id: string) {
  return axisFamily.nodes.find((node) => node.accession === id);
}
