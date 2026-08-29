import { z } from 'zod';
import { agentDnaSchema } from '@/lib/schema/agentDna';
import { evidenceSchema, SCHEMA_VERSION } from '@/lib/schema/common';
import { alleleSchema, geneSchema } from '@/lib/schema/gene';
import { genomeSchema } from '@/lib/schema/genome';
import { lineageEdgeSchema } from '@/lib/schema/lineageEdge';
import { mutationSchema, phenotypeSchema } from '@/lib/schema/mutation';
import { featureRecordSchema } from '@/lib/docs/formats';

/**
 * Live JSON Schema Draft 2020-12 documents, produced from the Zod schemas the
 * registry already validates against. The `$schema` URLs on fixtures resolve
 * here: `/schemas/genome/v0.1.json`.
 */

export const JSON_SCHEMA_DRAFT = 'https://json-schema.org/draft/2020-12/schema';

export type SchemaCatalogEntry = {
  /** Path segment used in `/schemas/{id}/v0.1.json`. */
  id: string;
  title: string;
  description: string;
  version: typeof SCHEMA_VERSION;
  zod: z.ZodType;
};

export const SCHEMA_CATALOG: readonly SchemaCatalogEntry[] = [
  {
    id: 'genome',
    title: 'genome.json',
    description: 'Versioned composition of a project: genes, parents, source, privacy.',
    version: SCHEMA_VERSION,
    zod: genomeSchema,
  },
  {
    id: 'gene',
    title: 'gene.json',
    description: 'A stable semantic capability and the alleles that implement it.',
    version: SCHEMA_VERSION,
    zod: geneSchema,
  },
  {
    id: 'allele',
    title: 'allele',
    description: 'One implementation of a gene. Embedded in gene.json, addressable alone.',
    version: SCHEMA_VERSION,
    zod: alleleSchema,
  },
  {
    id: 'mutation',
    title: 'mutation.json',
    description: 'A typed change with evidence, fitness vector and adoption state.',
    version: SCHEMA_VERSION,
    zod: mutationSchema,
  },
  {
    id: 'agent-dna',
    title: 'agent-dna.json',
    description: 'Portable, consented agent identity. Never weights or private reasoning.',
    version: SCHEMA_VERSION,
    zod: agentDnaSchema,
  },
  {
    id: 'lineage-edge',
    title: 'lineage edge',
    description: 'A typed, evidence-bearing relation on the lineage DAG.',
    version: SCHEMA_VERSION,
    zod: lineageEdgeSchema,
  },
  {
    id: 'evidence',
    title: 'evidence',
    description: 'A single reason to believe a claim, with a GO-style code.',
    version: SCHEMA_VERSION,
    zod: evidenceSchema,
  },
  {
    id: 'phenotype',
    title: 'phenotype',
    description: 'Measured behaviour of a genome in a stated environment.',
    version: SCHEMA_VERSION,
    zod: phenotypeSchema,
  },
  {
    id: 'feature',
    title: 'features.jsonl',
    description: 'GFF-inspired locus records mapping source ranges onto genes.',
    version: SCHEMA_VERSION,
    zod: featureRecordSchema,
  },
] as const;

export type JsonSchemaDocument = {
  id: string;
  title: string;
  description: string;
  version: string;
  href: string;
  schema: Record<string, unknown>;
};

export function toDraft2020(schema: z.ZodType): Record<string, unknown> {
  return z.toJSONSchema(schema, { target: 'draft-2020-12' }) as Record<string, unknown>;
}

export function getJsonSchema(id: string): JsonSchemaDocument | null {
  const entry = SCHEMA_CATALOG.find((item) => item.id === id);
  if (!entry) return null;

  const schema = toDraft2020(entry.zod);
  schema.$id = `https://codeancestry.com/schemas/${entry.id}/v${entry.version}.json`;
  schema.title = entry.title;
  schema.description = entry.description;

  return {
    id: entry.id,
    title: entry.title,
    description: entry.description,
    version: entry.version,
    href: `/schemas/${entry.id}/v${entry.version}.json`,
    schema,
  };
}

export function listJsonSchemas(): JsonSchemaDocument[] {
  return SCHEMA_CATALOG.map((entry) => {
    const document = getJsonSchema(entry.id);
    if (!document) throw new Error(`Schema catalog entry ${entry.id} failed to compile`);
    return document;
  });
}
