import { z } from 'zod';
import { accessionSchema, confidenceSchema, isoDateSchema } from './common';

/**
 * agent-dna.json — an agent's portable, consented identity.
 *
 * Deliberately NOT model weights, not hidden reasoning, not a compulsory copy
 * of everything the agent thought. CodeAncestry records what an agent did,
 * asserted, tested and shared.
 */

export const learningArtifactSchema = z.object({
  id: accessionSchema('CAMEM'),
  kind: z.enum(['lesson', 'test', 'fix', 'observation', 'benchmark']),
  summary: z.string().min(1),
  producedAt: isoDateSchema,
  /** Relatives this artifact has been offered to. */
  offeredTo: z.array(accessionSchema('CAGENOME')).default([]),
  /** Whether the artifact carries a signature. */
  signed: z.boolean(),
});

export type LearningArtifact = z.infer<typeof learningArtifactSchema>;

export const agentDnaSchema = z.object({
  $schema: z.string().url().optional(),
  schemaVersion: z.literal('0.1'),

  id: accessionSchema('CAAGENT'),
  displayName: z.string().min(1),
  generation: z.number().int().nonnegative(),

  identity: z.object({
    /** What the provider says it is. We do not claim to verify model internals. */
    provider: z.enum(['external', 'codex', 'claude', 'grok', 'cursor', 'self-hosted']),
    providerAgentId: z.string().optional(),
    verification: z.enum(['self-declared', 'signed', 'verified']),
    /** Decentralised identifier used to sign outputs. */
    signingKey: z.string().min(1).optional(),
  }),

  project: accessionSchema('CAPROJ'),
  genome: accessionSchema('CAGENOME'),
  /** The agent this one descends from, mirroring project lineage. */
  parentAgent: accessionSchema('CAAGENT').optional(),

  capabilities: z
    .array(
      z.enum([
        'analyze-genome',
        'analyze-code',
        'propose-mutation',
        'run-tests',
        'review-lineage',
        'compare-relative',
        'request-test',
        'open-pull-request',
      ]),
    )
    .min(1),

  interfaces: z.object({ mcp: z.boolean(), a2a: z.boolean() }),

  tools: z
    .array(
      z.object({
        name: z.string().min(1),
        uri: z.string().min(1),
        scope: z.enum(['repository', 'test-only', 'read-only', 'registry']),
      }),
    )
    .default([]),

  /** The safety envelope. Nothing propagates without passing these. */
  policies: z.object({
    canAutoMerge: z.boolean(),
    canPropagateMutations: z.boolean(),
    requiresHumanApproval: z.boolean(),
    requiresAttestation: z.boolean(),
    trustedRelations: z.array(z.enum(['parent', 'sibling', 'child', 'unrelated'])).default([]),
  }),

  authorizedMemory: z.object({
    mode: z.enum(['none', 'summaries-only', 'full-authorized']),
    lineageSummaries: z.number().int().nonnegative(),
    acceptedMutations: z.number().int().nonnegative(),
    rejectedMutations: z.number().int().nonnegative(),
    artifacts: z.array(learningArtifactSchema).default([]),
  }),

  telemetry: z.object({
    mode: z.enum(['none', 'metadata-only', 'tool-io', 'excerpts', 'full']),
    capturePrompts: z.boolean(),
    captureCompletions: z.boolean(),
    captureToolMetadata: z.boolean(),
    captureTokenMetrics: z.boolean(),
  }),

  /** Mutations this agent authored. */
  knowledgeProduced: z.array(accessionSchema('CAMUT')).default([]),

  trust: z.object({
    identityVerified: z.boolean(),
    outputsSigned: z.boolean(),
    privateReasoningStored: z.literal(false),
    reliability: confidenceSchema,
  }),
});

export type AgentDna = z.infer<typeof agentDnaSchema>;

export type AgentCapability = AgentDna['capabilities'][number];
export type AgentProvider = AgentDna['identity']['provider'];
export type AgentVerification = AgentDna['identity']['verification'];
export type ToolScope = AgentDna['tools'][number]['scope'];
export type MemoryMode = AgentDna['authorizedMemory']['mode'];
export type TelemetryMode = AgentDna['telemetry']['mode'];

/**
 * What each capability actually permits. Written as a permission rather than a
 * skill: the registry cares about what an agent is allowed to do to a genome,
 * not about how good it is at doing it.
 */
export const CAPABILITY_META: Record<
  AgentCapability,
  { label: string; detail: string; writes: boolean }
> = {
  'analyze-genome': {
    label: 'Analyse genome',
    detail: 'Read a genome record and its capability set.',
    writes: false,
  },
  'analyze-code': {
    label: 'Analyse code',
    detail: 'Read source at an authorized anchor.',
    writes: false,
  },
  'review-lineage': {
    label: 'Review lineage',
    detail: 'Walk ancestors and descendants to check where something came from.',
    writes: false,
  },
  'compare-relative': {
    label: 'Compare relative',
    detail: 'Diff its own genome against another in the family.',
    writes: false,
  },
  'run-tests': {
    label: 'Run tests',
    detail: 'Execute a suite in a sandbox and record the result.',
    writes: false,
  },
  'request-test': {
    label: 'Request test',
    detail: 'Ask another agent or a human for evidence it cannot produce itself.',
    writes: false,
  },
  'propose-mutation': {
    label: 'Propose mutation',
    detail: 'Author a change proposal against a capability. Proposing is not adopting.',
    writes: true,
  },
  'open-pull-request': {
    label: 'Open pull request',
    detail: 'Raise a change on the host for humans to review.',
    writes: true,
  },
};

export const PROVIDER_META: Record<AgentProvider, { label: string }> = {
  codex: { label: 'OpenAI Codex' },
  claude: { label: 'Anthropic Claude' },
  grok: { label: 'xAI Grok' },
  cursor: { label: 'Cursor' },
  'self-hosted': { label: 'Self-hosted' },
  external: { label: 'External / unspecified' },
};

/** How much of the identity claim the registry can stand behind. */
export const VERIFICATION_META: Record<
  AgentVerification,
  { label: string; detail: string; tone: 'weak' | 'medium' | 'strong' }
> = {
  'self-declared': {
    label: 'Self-declared',
    detail: 'The agent says who it is. Nothing corroborates it.',
    tone: 'weak',
  },
  signed: {
    label: 'Signed',
    detail: 'Outputs carry a signature that resolves to the declared key.',
    tone: 'medium',
  },
  verified: {
    label: 'Verified',
    detail: 'The key is signed and bound to an identity the registry checked.',
    tone: 'strong',
  },
};

export const TOOL_SCOPE_META: Record<ToolScope, { label: string; writes: boolean }> = {
  'read-only': { label: 'Read only', writes: false },
  'test-only': { label: 'Test only', writes: false },
  registry: { label: 'Registry', writes: true },
  repository: { label: 'Repository', writes: true },
};

export const MEMORY_MODE_META: Record<MemoryMode, { label: string; detail: string }> = {
  none: { label: 'None', detail: 'The agent keeps nothing between sessions.' },
  'summaries-only': {
    label: 'Summaries only',
    detail: 'Short authored lessons and counts. No transcripts, no raw context.',
  },
  'full-authorized': {
    label: 'Full authorized',
    detail: 'Everything the owner explicitly authorized, and nothing beyond it.',
  },
};

export const ARTIFACT_KIND_META: Record<
  LearningArtifact['kind'],
  { label: string; abbr: string }
> = {
  lesson: { label: 'Lesson', abbr: 'LSN' },
  test: { label: 'Test', abbr: 'TST' },
  fix: { label: 'Fix', abbr: 'FIX' },
  observation: { label: 'Observation', abbr: 'OBS' },
  benchmark: { label: 'Benchmark', abbr: 'BCH' },
};

/** The five agent telemetry levels, for the privacy control UI. */
export const TELEMETRY_LEVELS = [
  {
    value: 'none',
    label: 'None',
    detail: 'No agent activity is recorded at all.',
  },
  {
    value: 'metadata-only',
    label: 'Metadata only',
    detail: 'Which tools ran, token counts, durations. No content. This is the default.',
  },
  {
    value: 'tool-io',
    label: 'Tool inputs and outputs',
    detail: 'Adds the arguments and results of tool calls.',
  },
  {
    value: 'excerpts',
    label: 'Conversation excerpts',
    detail: 'Adds quoted fragments the agent chose to publish.',
  },
  {
    value: 'full',
    label: 'Full authorized traces',
    detail: 'Complete prompt and completion capture. Requires explicit consent.',
  },
] as const;

/** Stated plainly on the agent page, because the boundary is the product. */
export const NEVER_COLLECTED = [
  'Private model weights',
  'Provider-internal reasoning',
  'Data unavailable through authorized interfaces',
] as const;
