import { z } from 'zod';
import {
  accessionSchema,
  anchorSchema,
  annotationSchema,
  commitShaSchema,
  confidenceSchema,
  digestSchema,
  isoDateSchema,
} from './common';

/**
 * gene.json — a stable semantic capability.
 *
 * A gene is deliberately not a file or a function. "MIDI scheduling",
 * "authentication", "PDF export" are genes; `src/midi/buffer.ts` is an anchor
 * that currently implements one. That separation is what lets two projects in
 * different languages be recognised as carrying the same capability.
 */

export const alleleSchema = z.object({
  id: accessionSchema('CAALLELE'),
  /** Monotonic allele number within the gene. */
  number: z.number().int().positive(),
  version: z.string().min(1),
  digest: digestSchema,
  label: z.string().min(1),
  summary: z.string().min(1),
  /** Alleles this one descends from. */
  parents: z.array(accessionSchema('CAALLELE')).default([]),
  originProject: accessionSchema('CAPROJ'),
  firstObservedAt: isoDateSchema,
  language: z.enum(['typescript', 'javascript', 'python', 'rust', 'swift', 'kotlin', 'go']),
  anchors: z.array(anchorSchema).default([]),
  interfaces: z.object({
    inputs: z.array(z.string().min(1)),
    outputs: z.array(z.string().min(1)),
  }),
  tests: z.array(z.string().min(1)).default([]),
  /** Which genomes currently carry this allele. */
  carriedBy: z.array(accessionSchema('CAGENOME')).default([]),
  /** The mutation that produced this allele, when it was not the original. */
  producedBy: accessionSchema('CAMUT').optional(),
});

export type Allele = z.infer<typeof alleleSchema>;

export const geneSchema = z.object({
  $schema: z.string().url().optional(),
  schemaVersion: z.literal('0.1'),

  id: accessionSchema('CAGENE'),
  name: z.string().min(1),
  description: z.string().min(1),

  ontology: z.object({
    /** Dotted capability-ontology term, e.g. input.music.midi.scheduling */
    term: z.string().regex(/^[a-z0-9]+(\.[a-z0-9-]+)*$/),
    tags: z.array(z.string().min(1)).default([]),
  }),

  currentAllele: accessionSchema('CAALLELE'),
  alleles: z.array(alleleSchema).min(1),

  origin: z.object({
    project: accessionSchema('CAPROJ'),
    firstObservedCommit: commitShaSchema,
    firstObservedAt: isoDateSchema,
  }),

  license: z.object({ spdx: z.string().min(1) }),

  annotations: z.array(annotationSchema).default([]),

  confidence: z.object({
    /** How sure we are the boundary of this capability is drawn correctly. */
    semanticBoundary: confidenceSchema,
    /** How sure we are about where it first appeared. */
    origin: confidenceSchema,
  }),

  /** Denormalised registry counters, cheap to render in search results. */
  stats: z.object({
    carrierCount: z.number().int().nonnegative(),
    alleleCount: z.number().int().nonnegative(),
    mutationCount: z.number().int().nonnegative(),
    descendantProjects: z.number().int().nonnegative(),
  }),
});

export type Gene = z.infer<typeof geneSchema>;

/* ==========================================================================
   Capability ontology

   A lightweight, GO-inspired tree. Machine-readable terms, human-readable
   labels, no giant taxonomy hard-coded into components.
   ========================================================================== */

export type OntologyNode = {
  term: string;
  label: string;
  description?: string;
  children?: OntologyNode[];
};

export const CAPABILITY_ONTOLOGY: OntologyNode = {
  term: 'capability',
  label: 'Software capability',
  description: 'The root of the CodeAncestry capability ontology.',
  children: [
    {
      term: 'input',
      label: 'Input',
      description: 'Getting intent and data from the outside world.',
      children: [
        {
          term: 'input.music',
          label: 'Music input',
          children: [
            {
              term: 'input.music.midi',
              label: 'MIDI',
              children: [
                { term: 'input.music.midi.scheduling', label: 'MIDI scheduling' },
                { term: 'input.music.midi.device', label: 'MIDI device detection' },
              ],
            },
          ],
        },
        { term: 'input.keyboard', label: 'Keyboard input' },
        { term: 'input.voice', label: 'Voice input' },
      ],
    },
    {
      term: 'audio',
      label: 'Audio',
      children: [
        { term: 'audio.synthesis', label: 'Synthesis' },
        { term: 'audio.generation', label: 'Generative audio' },
      ],
    },
    {
      term: 'persistence',
      label: 'Persistence',
      children: [
        { term: 'persistence.sql', label: 'SQL storage' },
        { term: 'persistence.object', label: 'Object storage' },
        { term: 'persistence.sync', label: 'Offline sync' },
      ],
    },
    {
      term: 'intelligence',
      label: 'Intelligence',
      children: [
        { term: 'intelligence.retrieval', label: 'Retrieval' },
        { term: 'intelligence.generation', label: 'Generation' },
        { term: 'intelligence.planning', label: 'Planning' },
        { term: 'intelligence.tutoring', label: 'Tutoring' },
      ],
    },
    {
      term: 'interface',
      label: 'Interface',
      children: [
        { term: 'interface.visualization', label: 'Visualization' },
        { term: 'interface.accessibility', label: 'Accessibility' },
        { term: 'interface.localization', label: 'Localization' },
        { term: 'interface.gamification', label: 'Gamification' },
        { term: 'interface.embodiment', label: 'Embodiment' },
      ],
    },
    {
      term: 'pedagogy',
      label: 'Pedagogy',
      children: [
        { term: 'pedagogy.lessons', label: 'Lesson sequencing' },
        { term: 'pedagogy.scoring', label: 'Scoring and feedback' },
        { term: 'pedagogy.progress', label: 'Progress tracking' },
      ],
    },
    {
      term: 'operations',
      label: 'Operations',
      children: [
        { term: 'operations.telemetry', label: 'Telemetry' },
        { term: 'operations.fleet', label: 'Fleet management' },
      ],
    },
  ],
};

/** Flatten the ontology into term -> label for quick lookups. */
export function flattenOntology(node: OntologyNode = CAPABILITY_ONTOLOGY): Map<string, string> {
  const out = new Map<string, string>();
  const walk = (n: OntologyNode) => {
    out.set(n.term, n.label);
    n.children?.forEach(walk);
  };
  walk(node);
  return out;
}

export const ONTOLOGY_LABELS = flattenOntology();

/** Human-readable breadcrumb for a dotted ontology term. */
export function ontologyPath(term: string): { term: string; label: string }[] {
  const parts = term.split('.');
  const out: { term: string; label: string }[] = [];
  for (let i = 0; i < parts.length; i += 1) {
    const partial = parts.slice(0, i + 1).join('.');
    out.push({ term: partial, label: ONTOLOGY_LABELS.get(partial) ?? (parts[i] as string) });
  }
  return out;
}
