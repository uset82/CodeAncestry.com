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
