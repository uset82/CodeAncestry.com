import { z } from 'zod';
import { accessionSchema, anchorSchema, attestationSchema, commitShaSchema, confidenceSchema, digestSchema, evidenceTierSchema, expressionStateSchema, inheritanceModeSchema, isoDateSchema, sourceSchema } from './common';

/**
 * genome.json — the canonical repository-level manifest.
 *
 * A genome is NOT the repository. Git remains the source of truth for source
 * code; the genome is a versioned statement about what capabilities the project
 * is composed of, where they came from, and how strongly that is evidenced.
 */

export const genomeGeneRefSchema = z.object({
  gene: accessionSchema('CAGENE'),
  allele: accessionSchema('CAALLELE'),
  version: z.string().min(1),
  digest: digestSchema,
  expression: expressionStateSchema,
  inheritance: inheritanceModeSchema,
  /** Which ancestor this gene arrived from, when it was not native. */
  origin: accessionSchema('CAPROJ').optional(),
  confidence: confidenceSchema,
  evidence: z.array(accessionSchema('CAEV')).default([]),
  anchors: z.array(anchorSchema).default([]),
  /** Share of the project this capability accounts for, 0–1. Drives Code Painting. */
  weight: z.number().min(0).max(1),
});

export type GenomeGeneRef = z.infer<typeof genomeGeneRefSchema>;

export const genomeParentSchema = z.object({
  project: accessionSchema('CAPROJ'),
  genome: accessionSchema('CAGENOME'),
  relationship: z.enum(['child', 'remix', 'cover', 'hybrid']),
  bornFromCommit: commitShaSchema,
  /** Fraction of this genome attributable to the parent, 0–1. */
  contribution: z.number().min(0).max(1),
});

export const genomeReleaseSchema = z.object({
  version: z.string().min(1),
  date: isoDateSchema,
  commit: commitShaSchema,
  verified: z.boolean(),
});

export const genomeDependencySchema = z.object({
  name: z.string().min(1),
  version: z.string().min(1),
  ecosystem: z.enum(['npm', 'pypi', 'cargo', 'maven', 'oci', 'go']),
  license: z.string().min(1),
  /** Position along the temporal axis where this dependency entered, 0–1. */
  introducedAt: z.number().min(0).max(1),
  advisory: z.enum(['none', 'open', 'resolved']).default('none'),
});

export const genomeSecurityFindingSchema = z.object({
  id: z.string().min(1),
  summary: z.string().min(1),
  severity: z.enum(['low', 'moderate', 'high', 'critical']),
  status: z.enum(['open', 'resolved']),
  raisedAt: z.number().min(0).max(1),
  resolvedAt: z.number().min(0).max(1).optional(),
});

export const genomeAgentActivitySchema = z.object({
  agent: accessionSchema('CAAGENT'),
  at: z.number().min(0).max(1),
  action: z.enum(['analyze', 'edit', 'test', 'propose', 'review']),
  summary: z.string().min(1),
});

export const genomeTestRunSchema = z.object({
  at: z.number().min(0).max(1),
  passed: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
  coverage: z.number().min(0).max(1),
});

export const genomeSchema = z.object({
  $schema: z.string().url().optional(),
  schemaVersion: z.literal('0.1'),

  id: accessionSchema('CAGENOME'),
  project: accessionSchema('CAPROJ'),
  name: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  tagline: z.string().min(1),
  description: z.string().min(1),
  generation: z.number().int().nonnegative(),
  visibility: z.enum(['public', 'organization', 'private']),
  createdAt: isoDateSchema,

  source: sourceSchema,
  parents: z.array(genomeParentSchema).default([]),
  genes: z.array(genomeGeneRefSchema).min(1),
  agents: z.array(accessionSchema('CAAGENT')).default([]),
  releases: z.array(genomeReleaseSchema).default([]),
  dependencies: z.array(genomeDependencySchema).default([]),
  security: z.array(genomeSecurityFindingSchema).default([]),
  agentActivity: z.array(genomeAgentActivitySchema).default([]),
  tests: z.array(genomeTestRunSchema).default([]),
  attestations: z.array(attestationSchema).default([]),

  licenses: z.object({ spdxExpression: z.string().min(1) }),

  /** How strongly the ancestry claim itself is evidenced. */
  lineageAssurance: evidenceTierSchema,

  privacy: z.object({
    registryVisibility: z.enum(['public', 'organization', 'private']),
    sourceVisibility: z.enum(['inherit-provider', 'metadata-only', 'hidden']),
    agentTelemetry: z.enum(['none', 'metadata-only', 'tool-io', 'excerpts', 'full']),
  }),
});

export type Genome = z.infer<typeof genomeSchema>;
