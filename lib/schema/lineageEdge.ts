import { z } from 'zod';
import { EDGE_TYPES } from './vocabulary';
import {
  accessionSchema,
  anyAccessionSchema,
  commitShaSchema,
  confidenceSchema,
  digestSchema,
  evidenceTierSchema,
  isoDateSchema,
} from './common';

/**
 * A typed lineage edge.
 *
 * The lineage graph is a DAG, not a tree: hybrids have several parents, and
 * capabilities can move sideways between unrelated families. Every edge that
 * matters carries evidence, so the UI can tell "Git proves this descent" apart
 * from "a model guessed at this descent".
 */

export const edgeTypeSchema = z.enum(EDGE_TYPES);

export const lineageEdgeSchema = z.object({
  id: z.string().min(1),
  type: edgeTypeSchema,
  /** Descendant. */
  from: anyAccessionSchema,
  /** Ancestor. */
  to: anyAccessionSchema,

  source: z
    .object({
      provider: z.enum(['github', 'gitlab', 'bitbucket', 'local']),
      parentCommit: commitShaSchema,
      childInitialCommit: commitShaSchema,
    })
    .optional(),

  assertion: evidenceTierSchema,
  attestation: digestSchema.optional(),
  evidence: z.array(accessionSchema('CAEV')).default([]),
  confidence: confidenceSchema,
  createdAt: isoDateSchema,

  /** Set on TRANSFERRED_FROM edges: the capability that moved. */
  gene: accessionSchema('CAGENE').optional(),
  /** Set on PROPOSED_TO / ADOPTED_FROM edges: the mutation in flight. */
  mutation: accessionSchema('CAMUT').optional(),
  label: z.string().optional(),
});

export type LineageEdge = z.infer<typeof lineageEdgeSchema>;
