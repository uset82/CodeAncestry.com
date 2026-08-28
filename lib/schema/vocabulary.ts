/**
 * The controlled vocabularies that make CodeAncestry a registry rather than a
 * visualisation. Evidence codes follow the spirit of Gene Ontology evidence
 * codes: every claim in the system carries a machine-readable reason to
 * believe it, and inference is never silently promoted to fact.
 */

/* ==========================================================================
   Evidence
   ========================================================================== */

export const EVIDENCE_CODES = [
  'HVR',
  'TST',
  'RUN',
  'STA',
  'DEP',
  'UPR',
  'SEC',
  'PHY',
  'AII',
] as const;

export type EvidenceCode = (typeof EVIDENCE_CODES)[number];

/** Three-tier strength used by the Evidence Threshold control. Moving the
 *  slider toward `verified` dissolves everything weaker from every view. */
export const EVIDENCE_TIERS = ['inferred', 'reviewed', 'verified'] as const;
export type EvidenceTier = (typeof EVIDENCE_TIERS)[number];

export const EVIDENCE_TIER_RANK: Record<EvidenceTier, number> = {
  inferred: 0,
  reviewed: 1,
  verified: 2,
};

export const EVIDENCE_TIER_META: Record<
  EvidenceTier,
  { label: string; description: string; tone: string }
> = {
  inferred: {
    label: 'Inferred',
    description: 'Proposed by a model or read off ancestry. Nothing has confirmed it yet.',
    tone: 'text-muted',
  },
  reviewed: {
    label: 'Reviewed',
    description: 'Backed by static analysis, declared metadata or an upstream maintainer.',
    tone: 'text-cyan',
  },
  verified: {
    label: 'Verified',
    description: 'Backed by an executed test, a runtime measurement or a human sign-off.',
    tone: 'text-acid',
  },
};

export type EvidenceCodeMeta = {
  code: EvidenceCode;
  label: string;
  description: string;
  tier: EvidenceTier;
  /** Single glyph. Paired with the code text, never used alone. */
  glyph: string;
  tone: string;
};

export const EVIDENCE_CODE_META: Record<EvidenceCode, EvidenceCodeMeta> = {
  HVR: {
    code: 'HVR',
    label: 'Human verified',
    description: 'A person inspected this claim and confirmed it.',
    tier: 'verified',
    glyph: '◆',
    tone: 'text-acid',
  },
  TST: {
    code: 'TST',
    label: 'Automated test',
    description: 'A test suite executed and asserted this behaviour.',
    tier: 'verified',
    glyph: '▣',
    tone: 'text-acid',
  },
  RUN: {
    code: 'RUN',
    label: 'Runtime observation',
    description: 'Measured from a real or sandboxed execution.',
    tier: 'verified',
    glyph: '◉',
    tone: 'text-acid',
  },
  UPR: {
    code: 'UPR',
    label: 'Upstream maintainer',
    description: 'Asserted by the maintainer of the upstream project.',
    tier: 'reviewed',
    glyph: '◈',
    tone: 'text-cyan',
  },
  STA: {
    code: 'STA',
    label: 'Static analysis',
    description: 'Derived from parsing source without executing it.',
    tier: 'reviewed',
    glyph: '▤',
    tone: 'text-cyan',
  },
  DEP: {
    code: 'DEP',
    label: 'Dependency metadata',
    description: 'Read from a manifest, lockfile or SBOM.',
    tier: 'reviewed',
    glyph: '▥',
    tone: 'text-cyan',
  },
  SEC: {
    code: 'SEC',
    label: 'Security scanner',
    description: 'Reported by an advisory database or scanner.',
    tier: 'reviewed',
    glyph: '▲',
    tone: 'text-amber',
  },
  PHY: {
    code: 'PHY',
    label: 'Lineage inference',
    description: 'Inferred from ancestry or capability homology.',
    tier: 'inferred',
    glyph: '◇',
    tone: 'text-violet',
  },
  AII: {
    code: 'AII',
    label: 'AI-inferred',
    description: 'Proposed by a model and not yet verified by test or human.',
    tier: 'inferred',
    glyph: '◌',
    tone: 'text-muted',
  },
};

/** The strongest tier present in a set of evidence codes. */
export function strongestTier(codes: readonly EvidenceCode[]): EvidenceTier {
  let best: EvidenceTier = 'inferred';
  for (const code of codes) {
    const tier = EVIDENCE_CODE_META[code].tier;
    if (EVIDENCE_TIER_RANK[tier] > EVIDENCE_TIER_RANK[best]) best = tier;
  }
  return best;
}

export function meetsTier(codes: readonly EvidenceCode[], threshold: EvidenceTier): boolean {
  return EVIDENCE_TIER_RANK[strongestTier(codes)] >= EVIDENCE_TIER_RANK[threshold];
}

/* ==========================================================================
   Lineage states

   Rendered by StateBadge with colour + glyph + pattern + text, so no state is
   ever communicated by hue alone.
   ========================================================================== */

export const LINEAGE_STATES = [
  'verified',
  'reviewed',
  'inferred',
  'proposed',
  'quarantined',
  'rejected',
] as const;

export type LineageState = (typeof LINEAGE_STATES)[number];

export type LineageStateMeta = {
  state: LineageState;
  label: string;
  description: string;
  glyph: string;
  tone: string;
  border: string;
  bg: string;
  /** SVG pattern id from <StatePatterns>, giving a non-colour encoding. */
  pattern: 'solid' | 'grid' | 'dots' | 'diagonal' | 'frozen' | 'cross';
  /** Stroke style for graph edges in this state. */
  stroke: 'solid' | 'dashed' | 'dotted';
};

export const LINEAGE_STATE_META: Record<LineageState, LineageStateMeta> = {
  verified: {
    state: 'verified',
    label: 'Verified',
    description: 'Backed by tests, runtime measurement or human review.',
    glyph: '◆',
    tone: 'text-acid',
    border: 'border-acid/35',
    bg: 'bg-acid/10',
    pattern: 'solid',
    stroke: 'solid',
  },
  reviewed: {
    state: 'reviewed',
    label: 'Reviewed',
    description: 'Derived from static analysis or declared metadata.',
    glyph: '◈',
    tone: 'text-cyan',
    border: 'border-cyan/35',
    bg: 'bg-cyan/10',
    pattern: 'grid',
    stroke: 'solid',
  },
  inferred: {
    state: 'inferred',
    label: 'Inferred',
    description: 'A model proposed this. Not yet verified. Correctable.',
    glyph: '◌',
    tone: 'text-muted',
    border: 'border-line-strong',
    bg: 'bg-panel-2',
    pattern: 'dots',
    stroke: 'dotted',
  },
  proposed: {
    state: 'proposed',
    label: 'Proposed',
    description: 'Offered to this project but not adopted.',
    glyph: '⇢',
    tone: 'text-violet',
    border: 'border-violet/35',
    bg: 'bg-violet/10',
    pattern: 'diagonal',
    stroke: 'dashed',
  },
  quarantined: {
    state: 'quarantined',
    label: 'Quarantined',
    description: 'Held back pending review. Cannot propagate.',
    glyph: '⊘',
    tone: 'text-amber',
    border: 'border-amber/35',
    bg: 'bg-amber/10',
    pattern: 'frozen',
    stroke: 'dashed',
  },
  rejected: {
    state: 'rejected',
    label: 'Rejected',
    description: 'Evaluated and declined. Retained for the record.',
    glyph: '✕',
    tone: 'text-rose',
    border: 'border-rose/35',
    bg: 'bg-rose/10',
    pattern: 'cross',
    stroke: 'dotted',
  },
};

/* ==========================================================================
   Mutation lifecycle

   A mutation never spreads because a related agent recommends it. It walks
   this machine, and a human or an explicit policy makes the final call.
   ========================================================================== */

export const MUTATION_STATES = [
  'observed',
  'proposed',
  'sandboxing',
  'evaluated',
  'accepted',
  'rejected',
  'quarantined',
  'eligible-for-propagation',
  'offered-to-relatives',
  'adopted',
] as const;

export type MutationState = (typeof MUTATION_STATES)[number];

export const MUTATION_STATE_META: Record<
  MutationState,
  { label: string; lineageState: LineageState; terminal: boolean }
> = {
  observed: { label: 'Observed', lineageState: 'inferred', terminal: false },
  proposed: { label: 'Proposed', lineageState: 'proposed', terminal: false },
  sandboxing: { label: 'Sandboxing', lineageState: 'proposed', terminal: false },
  evaluated: { label: 'Evaluated', lineageState: 'reviewed', terminal: false },
  accepted: { label: 'Accepted', lineageState: 'verified', terminal: false },
  rejected: { label: 'Rejected', lineageState: 'rejected', terminal: true },
  quarantined: { label: 'Quarantined', lineageState: 'quarantined', terminal: true },
  'eligible-for-propagation': {
    label: 'Eligible for propagation',
    lineageState: 'verified',
    terminal: false,
  },
  'offered-to-relatives': {
    label: 'Offered to relatives',
    lineageState: 'proposed',
    terminal: false,
  },
  adopted: { label: 'Adopted', lineageState: 'verified', terminal: true },
};

/** The linear happy path, used to render progress rails. */
export const MUTATION_HAPPY_PATH: readonly MutationState[] = [
  'observed',
  'proposed',
  'sandboxing',
  'evaluated',
  'accepted',
  'eligible-for-propagation',
  'offered-to-relatives',
  'adopted',
];

/* ==========================================================================
   Lineage edge types
   ========================================================================== */

export const EDGE_TYPES = [
  'DERIVED_FROM',
  'RECOMBINED_FROM',
  'MUTATED_FROM',
  'TRANSFERRED_FROM',
  'ADOPTED_FROM',
  'REJECTED_FROM',
  'PROPOSED_TO',
] as const;

export type EdgeType = (typeof EDGE_TYPES)[number];

export const EDGE_TYPE_META: Record<
  EdgeType,
  { label: string; verb: string; stroke: 'solid' | 'dashed' | 'dotted' | 'double'; tone: string }
> = {
  DERIVED_FROM: {
    label: 'Derived from',
    verb: 'inherits',
    stroke: 'solid',
    tone: 'text-cyan',
  },
  RECOMBINED_FROM: {
    label: 'Recombined from',
    verb: 'recombines',
    stroke: 'double',
    tone: 'text-violet',
  },
  MUTATED_FROM: {
    label: 'Mutated from',
    verb: 'specialises',
    stroke: 'solid',
    tone: 'text-acid',
  },
  TRANSFERRED_FROM: {
    label: 'Transferred from',
    verb: 'acquired laterally',
    stroke: 'dashed',
    tone: 'text-amber',
  },
  ADOPTED_FROM: {
    label: 'Adopted from',
    verb: 'adopted',
    stroke: 'solid',
    tone: 'text-acid',
  },
  REJECTED_FROM: {
    label: 'Rejected from',
    verb: 'declined',
    stroke: 'dotted',
    tone: 'text-rose',
  },
  PROPOSED_TO: {
    label: 'Proposed to',
    verb: 'proposes to',
    stroke: 'dashed',
    tone: 'text-violet',
  },
};

/* ==========================================================================
   Gene inheritance and expression
   ========================================================================== */

export const INHERITANCE_MODES = ['native', 'inherited', 'mutated', 'local', 'transferred'] as const;
export type InheritanceMode = (typeof INHERITANCE_MODES)[number];

export const INHERITANCE_META: Record<
  InheritanceMode,
  { label: string; description: string; tone: string; swatch: string }
> = {
  native: {
    label: 'Native',
    description: 'Originated in this project. Generation zero material.',
    tone: 'text-acid',
    swatch: 'bg-acid',
  },
  inherited: {
    label: 'Inherited',
    description: 'Carried unchanged from an ancestor.',
    tone: 'text-cyan',
    swatch: 'bg-cyan',
  },
  mutated: {
    label: 'Mutated',
    description: 'Inherited then changed here.',
    tone: 'text-violet',
    swatch: 'bg-violet',
  },
  local: {
    label: 'Local',
    description: 'Newly evolved in this project.',
    tone: 'text-amber',
    swatch: 'bg-amber',
  },
  transferred: {
    label: 'Transferred',
    description: 'Acquired from an unrelated family.',
    tone: 'text-rose',
    swatch: 'bg-rose',
  },
};

export const EXPRESSION_STATES = ['active', 'inactive', 'conditional'] as const;
export type ExpressionState = (typeof EXPRESSION_STATES)[number];

/* ==========================================================================
   Fitness

   Never a single magic score. A mutation that cuts latency but harms
   accessibility has trade-offs, and the UI must show them.
   ========================================================================== */

export const FITNESS_AXES = [
  'correctness',
  'security',
  'performance',
  'compatibility',
  'maintainability',
  'userOutcome',
] as const;

export type FitnessAxis = (typeof FITNESS_AXES)[number];

export const FITNESS_AXIS_META: Record<
  FitnessAxis,
  { symbol: string; label: string; description: string }
> = {
  correctness: {
    symbol: 'C',
    label: 'Correctness',
    description: 'Test and assertion evidence that behaviour is right.',
  },
  security: {
    symbol: 'S',
    label: 'Security',
    description: 'Scanner, advisory and policy outcomes.',
  },
  performance: {
    symbol: 'P',
    label: 'Performance',
    description: 'Measured latency, throughput and resource cost.',
  },
  compatibility: {
    symbol: 'K',
    label: 'Compatibility',
    description: 'Whether relatives can adopt this without breaking.',
  },
  maintainability: {
    symbol: 'M',
    label: 'Maintainability',
    description: 'Complexity, coupling and review burden.',
  },
  userOutcome: {
    symbol: 'U',
    label: 'User outcome',
    description: 'Measured effect on the people using the software.',
  },
};

/* ==========================================================================
   Coordinate systems for the genome browser
   ========================================================================== */

export const COORDINATE_MODES = ['repository', 'semantic', 'temporal'] as const;
export type CoordinateMode = (typeof COORDINATE_MODES)[number];

export const COORDINATE_MODE_META: Record<
  CoordinateMode,
  { label: string; axisLabel: string; description: string }
> = {
  repository: {
    label: 'Repository',
    axisLabel: 'Path / symbol',
    description: 'Order loci the way the source tree does. The developer view.',
  },
  semantic: {
    label: 'Semantic',
    axisLabel: 'Capability',
    description: 'Group loci by the capability they implement. The product view.',
  },
  temporal: {
    label: 'Temporal',
    axisLabel: 'Version / commit',
    description: 'Lay loci along release history. The provenance view.',
  },
};
