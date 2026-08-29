import { z } from 'zod';
import { accessionSchema } from '@/lib/schema/common';
import type { Genome, GenomeGeneRef } from '@/lib/schema/genome';
import type { Mutation } from '@/lib/schema/mutation';
import { INHERITANCE_MODES, EXPRESSION_STATES } from '@/lib/schema/vocabulary';

/**
 * Portable interchange formats that sit beside genome.json.
 *
 * Bioinformatics never forces everything into one file. FASTA carries sequence,
 * GFF carries features, VCF carries variants. The same separation applies:
 * genome.json is the archival record; features.jsonl annotates loci;
 * mutation.cavcf is the variant call.
 */

export const featureRecordSchema = z.object({
  seqid: z.string().min(1),
  source: z.literal('codeancestry'),
  type: z.enum(['gene', 'allele', 'test', 'interface']),
  path: z.string().min(1),
  start: z.number().int().positive(),
  end: z.number().int().positive(),
  strand: z.literal('.'),
  gene: accessionSchema('CAGENE'),
  allele: accessionSchema('CAALLELE'),
  inheritance: z.enum(INHERITANCE_MODES),
  expression: z.enum(EXPRESSION_STATES),
  evidence: z.array(accessionSchema('CAEV')),
  commit: z.string().min(1),
  symbols: z.array(z.string()),
  score: z.number().min(0).max(1),
});

export type FeatureRecord = z.infer<typeof featureRecordSchema>;

export function genomeToFeatures(genome: Genome): FeatureRecord[] {
  return genome.genes.flatMap((ref) =>
    ref.anchors.map((anchor) => ({
      seqid: genome.source.repository,
      source: 'codeancestry' as const,
      type: 'gene' as const,
      path: anchor.path,
      start: anchor.range?.[0] ?? 1,
      end: anchor.range?.[1] ?? 1,
      strand: '.' as const,
      gene: ref.gene,
      allele: ref.allele,
      inheritance: ref.inheritance,
      expression: ref.expression,
      evidence: ref.evidence,
      commit: anchor.commit,
      symbols: anchor.symbols,
      score: ref.confidence,
    })),
  );
}

export function featuresToJsonl(records: FeatureRecord[]): string {
  return records.map((record) => JSON.stringify(record)).join('\n') + (records.length ? '\n' : '');
}

/** VCF-inspired variant call for a mutation. Digests stand in for sequence. */
export function mutationToCavcf(mutation: Mutation): string {
  const qual = Math.round(mutation.confidence * 100);
  const failed = Object.entries(mutation.checklist)
    .filter(([, passed]) => !passed)
    .map(([gate]) => gate);
  const filter = failed.length === 0 ? 'PASS' : failed.join(',');

  const info = [
    `STATE=${mutation.state}`,
    `KIND=${mutation.kind}`,
    `ORIGIN=${mutation.originGenome}`,
    `GEN=${mutation.originGeneration}`,
    `PROPOSED=${mutation.proposedBy}`,
    `COMMIT=${mutation.change.commit}`,
    `SYMBOLS=${mutation.change.symbolsChanged}`,
    `APIBREAKS=${mutation.change.apiBreaks}`,
    `CONF=${mutation.confidence}`,
  ].join(';');

  const header = [
    '##fileformat=CAVCF/v0.1',
    `##fileDate=${mutation.proposedAt}`,
    '##source=CodeAncestry',
    `##gene=${mutation.gene}`,
    `##reference=${mutation.fromAllele}`,
    '##INFO=<ID=STATE,Number=1,Type=String,Description="Mutation lifecycle state">',
    '##INFO=<ID=KIND,Number=1,Type=String,Description="optimization|feature|fix|refactor|security|accessibility">',
    '##INFO=<ID=ORIGIN,Number=1,Type=String,Description="Origin genome accession">',
    '##INFO=<ID=GEN,Number=1,Type=Integer,Description="Origin generation">',
    '##INFO=<ID=PROPOSED,Number=1,Type=String,Description="Proposing agent accession">',
    '##INFO=<ID=COMMIT,Number=1,Type=String,Description="Source commit">',
    '##INFO=<ID=SYMBOLS,Number=1,Type=Integer,Description="Symbols changed">',
    '##INFO=<ID=APIBREAKS,Number=1,Type=Integer,Description="Public API breaks">',
    '##INFO=<ID=CONF,Number=1,Type=Float,Description="Record confidence 0-1">',
    '#CHROM\tPOS\tID\tREF\tALT\tQUAL\tFILTER\tINFO',
  ];

  const row = [
    mutation.gene,
    mutation.fromAllele,
    mutation.id,
    mutation.change.refDigest,
    mutation.change.altDigest,
    String(qual),
    filter,
    info,
  ].join('\t');

  return `${header.join('\n')}\n${row}\n`;
}

/** Compact genome payload for the format reference — real fields, fewer genes. */
export function abridgeGenome(genome: Genome, geneLimit = 2) {
  return {
    $schema: genome.$schema,
    schemaVersion: genome.schemaVersion,
    id: genome.id,
    project: genome.project,
    name: genome.name,
    slug: genome.slug,
    tagline: genome.tagline,
    generation: genome.generation,
    visibility: genome.visibility,
    createdAt: genome.createdAt,
    source: genome.source,
    parents: genome.parents,
    genes: genome.genes.slice(0, geneLimit).map(abridgeGeneRef),
    agents: genome.agents,
    licenses: genome.licenses,
    lineageAssurance: genome.lineageAssurance,
    privacy: genome.privacy,
    attestations: genome.attestations,
  };
}

function abridgeGeneRef(ref: GenomeGeneRef) {
  return {
    gene: ref.gene,
    allele: ref.allele,
    version: ref.version,
    digest: ref.digest,
    expression: ref.expression,
    inheritance: ref.inheritance,
    ...(ref.origin ? { origin: ref.origin } : {}),
    confidence: ref.confidence,
    evidence: ref.evidence,
    anchors: ref.anchors,
    weight: ref.weight,
  };
}
