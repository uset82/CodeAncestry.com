import { z } from 'zod';
import {
  accessionSchema,
  attestationSchema,
  commitShaSchema,
  confidenceSchema,
  digestSchema,
  evidenceSchema,
  fitnessDeltaSchema,
  fitnessScoresSchema,
  isoDateSchema,
} from './common';
import { MUTATION_STATES } from './vocabulary';

/**
 * A mutation record. Modelled on clinical variant interpretation rather than on
 * a Git diff summary: the question is never "what lines changed" but "should a
 * relative adopt this, and what is the evidence".
 */

export const mutationStateSchema = z.enum(MUTATION_STATES);

export const sandboxRunSchema = z.object({
  id: accessionSchema('CAEV'),
  environment: z.object({
    runtime: z.string().min(1),
    os: z.string().min(1),
    browser: z.string().optional(),
    deviceProfile: z.string().optional(),
  }),
  testsPassed: z.number().int().nonnegative(),
  testsTotal: z.number().int().nonnegative(),
  durationSeconds: z.number().nonnegative(),
  runDigest: digestSchema,
  outcome: z.enum(['pass', 'fail', 'error']),
  /** Terminal excerpt shown in the sandbox console. */
  log: z.array(z.string()).default([]),
});

export type SandboxRun = z.infer<typeof sandboxRunSchema>;

export const phenotypeSchema = z.object({
  id: accessionSchema('CAPHENO'),
  genome: accessionSchema('CAGENOME'),
  environment: z.object({
    browser: z.string().min(1),
    os: z.string().min(1),
    deviceProfile: z.string().min(1),
  }),
  metrics: z.record(z.string(), z.number()),
  evidence: accessionSchema('CAEV'),
  runDigest: digestSchema,
});

export type Phenotype = z.infer<typeof phenotypeSchema>;

/** The evidence gate a mutation must clear before it can be offered onward. */
export const evidenceChecklistSchema = z.object({
  sourceDigestVerified: z.boolean(),
  buildProvenanceVerified: z.boolean(),
  testsPassed: z.boolean(),
  securityPolicyPassed: z.boolean(),
  licenseCompatible: z.boolean(),
  maintainerApproved: z.boolean(),
});

export type EvidenceChecklist = z.infer<typeof evidenceChecklistSchema>;

export const mutationSchema = z.object({
  $schema: z.string().url().optional(),
  schemaVersion: z.literal('0.1'),

  id: accessionSchema('CAMUT'),
  /** Short human label used in graph markers, e.g. M-83F12. */
  shortId: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),

  state: mutationStateSchema,
  kind: z.enum(['optimization', 'feature', 'fix', 'refactor', 'security', 'accessibility']),

  gene: accessionSchema('CAGENE'),
  fromAllele: accessionSchema('CAALLELE'),
  toAllele: accessionSchema('CAALLELE'),

  originGenome: accessionSchema('CAGENOME'),
  originGeneration: z.number().int().nonnegative(),
  proposedBy: accessionSchema('CAAGENT'),
  proposedAt: isoDateSchema,

  /** Where the mutation is being offered. Empty until it becomes eligible. */
  offeredTo: z.array(accessionSchema('CAGENOME')).default([]),
  adoptedBy: z.array(accessionSchema('CAGENOME')).default([]),
  rejectedBy: z.array(accessionSchema('CAGENOME')).default([]),

  change: z.object({
    refDigest: digestSchema,
    altDigest: digestSchema,
    commit: commitShaSchema,
    symbolsChanged: z.number().int().nonnegative(),
    testSuitesTouched: z.number().int().nonnegative(),
    apiBreaks: z.number().int().nonnegative(),
    /** Illustrative before/after, not a full diff. */
    before: z.array(z.string()).default([]),
    after: z.array(z.string()).default([]),
  }),

  checklist: evidenceChecklistSchema,
  evidence: z.array(evidenceSchema).default([]),
  attestations: z.array(attestationSchema).default([]),
  sandboxRuns: z.array(sandboxRunSchema).default([]),

  fitness: z.object({
    scores: fitnessScoresSchema,
    baseline: fitnessScoresSchema,
    deltas: z.array(fitnessDeltaSchema).default([]),
  }),

  compatibility: z.object({
    parentCompatibility: confidenceSchema,
    relativesEligible: z.number().int().nonnegative(),
    relativesNeedingReview: z.number().int().nonnegative(),
  }),

  confidence: confidenceSchema,
});

export type Mutation = z.infer<typeof mutationSchema>;

/** The seven-step propagation protocol. A mutation never skips a step. */
export const PROPAGATION_PROTOCOL = [
  { step: 'Discover', detail: 'An agent or a human notices a change worth describing.' },
  { step: 'Describe', detail: 'The change is written down as a typed mutation record.' },
  { step: 'Attest', detail: 'Claims are signed and bound to immutable digests.' },
  { step: 'Sandbox', detail: 'The mutation is applied in an isolated environment.' },
  { step: 'Test', detail: 'The relative\u2019s own test suite runs against it.' },
  { step: 'Evaluate', detail: 'A fitness vector is measured, not a single score.' },
  { step: 'Decide', detail: 'A policy or a maintainer adopts, rejects or quarantines.' },
] as const;

/** The trust ladder. Each rung is a claim that has actually been checked. */
export const TRUST_LADDER = [
  { rung: 'AI proposal', detail: 'A model asserts this change is beneficial.', trusted: false },
  { rung: 'Unverified proposal', detail: 'Recorded, but nothing is checked yet.', trusted: false },
  { rung: 'Source verified', detail: 'The referenced commit and digest resolve.', trusted: false },
  { rung: 'Build verified', detail: 'Provenance shows how the artifact was produced.', trusted: true },
  { rung: 'Tests passed', detail: 'The adopter\u2019s suite ran green in a sandbox.', trusted: true },
  { rung: 'Policy passed', detail: 'Security and licence gates were satisfied.', trusted: true },
  { rung: 'Maintainer approved', detail: 'A human with authority said yes.', trusted: true },
  { rung: 'Adopted allele', detail: 'The capability now lives in this genome.', trusted: true },
] as const;
