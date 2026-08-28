import { z } from 'zod';
import { ACCESSION_PREFIXES, type AccessionPrefix } from './accession';
import {
  EVIDENCE_CODES,
  EVIDENCE_TIERS,
  EXPRESSION_STATES,
  FITNESS_AXES,
  INHERITANCE_MODES,
  LINEAGE_STATES,
} from './vocabulary';

export const SCHEMA_BASE = 'https://codeancestry.com/schemas';
export const SCHEMA_VERSION = '0.1';

/** A content digest. Everything the registry points at is immutable. */
export const digestSchema = z
  .string()
  .regex(/^sha256:[0-9a-f]{6,64}$/, 'digest must be sha256:<hex>');

export const commitShaSchema = z
  .string()
  .regex(/^[0-9a-f]{7,40}$/, 'commit must be a hex sha');

export const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expected YYYY-MM-DD');

export const confidenceSchema = z.number().min(0).max(1);

/** Builds a validator for a specific accession prefix. */
export function accessionSchema<P extends AccessionPrefix>(prefix: P) {
  return z
    .string()
    .refine((value) => value.startsWith(`${prefix}:`) && value.length > prefix.length + 1, {
      message: `expected a ${prefix}: accession`,
    }) as unknown as z.ZodType<`${P}:${string}`>;
}

/** Any accession, whatever the entity type. */
export const anyAccessionSchema = z.string().refine(
  (value) => {
    const separator = value.indexOf(':');
    if (separator < 1) return false;
    return (ACCESSION_PREFIXES as readonly string[]).includes(value.slice(0, separator));
  },
  { message: 'expected a CodeAncestry accession' },
);

export const evidenceCodeSchema = z.enum(EVIDENCE_CODES);
export const evidenceTierSchema = z.enum(EVIDENCE_TIERS);
export const lineageStateSchema = z.enum(LINEAGE_STATES);
export const inheritanceModeSchema = z.enum(INHERITANCE_MODES);
export const expressionStateSchema = z.enum(EXPRESSION_STATES);

/** Where a capability physically lives. The bridge from semantics to source. */
export const anchorSchema = z.object({
  repository: z.string().min(1),
  commit: commitShaSchema,
  path: z.string().min(1),
  symbols: z.array(z.string().min(1)).default([]),
  /** Optional line range, used by the repository coordinate mode. */
  range: z.tuple([z.number().int().nonnegative(), z.number().int().nonnegative()]).optional(),
});

export type Anchor = z.infer<typeof anchorSchema>;

/** A single evidence record. Every claim in the registry references one. */
export const evidenceSchema = z.object({
  id: accessionSchema('CAEV'),
  code: evidenceCodeSchema,
  summary: z.string().min(1),
  /** Free-form count, e.g. 214 for a test suite. */
  count: z.number().int().nonnegative().optional(),
  observedAt: isoDateSchema,
  digest: digestSchema.optional(),
});

export type Evidence = z.infer<typeof evidenceSchema>;

/** An evidence-backed claim attached to an entity. */
export const annotationSchema = z.object({
  term: z.string().min(1),
  statement: z.string().min(1),
  evidence: z.array(accessionSchema('CAEV')).min(1),
  confidence: confidenceSchema,
});

export type Annotation = z.infer<typeof annotationSchema>;

/** Attestations bind claims to immutable artifacts, in the in-toto tradition. */
export const attestationSchema = z.object({
  type: z.enum([
    'slsa-provenance',
    'in-toto-test-result',
    'cyclonedx-pedigree',
    'spdx-document',
    'github-artifact-attestation',
  ]),
  predicateType: z.string().min(1),
  subjectDigest: digestSchema,
  issuer: z.string().min(1),
  issuedAt: isoDateSchema,
  verified: z.boolean(),
});

export type Attestation = z.infer<typeof attestationSchema>;

export const fitnessScoresSchema = z.object(
  Object.fromEntries(FITNESS_AXES.map((axis) => [axis, confidenceSchema])) as {
    [K in (typeof FITNESS_AXES)[number]]: typeof confidenceSchema;
  },
);

export type FitnessScoresValue = z.infer<typeof fitnessScoresSchema>;

export const fitnessDeltaSchema = z.object({
  metric: z.string().min(1),
  before: z.string().min(1),
  after: z.string().min(1),
  change: z.string().min(1),
  direction: z.enum(['better', 'worse', 'neutral']),
});

export const sourceSchema = z.object({
  provider: z.enum(['github', 'gitlab', 'bitbucket', 'local']),
  repository: z.string().min(1),
  commit: commitShaSchema,
  treeDigest: digestSchema,
  defaultBranch: z.string().min(1).default('main'),
});

export type Source = z.infer<typeof sourceSchema>;
