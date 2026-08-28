/**
 * The registry query layer.
 *
 * Every screen reads through these functions and nothing imports the fixtures
 * directly. When `api.codeancestry.com` exists, these signatures stay and the
 * bodies become fetches — no component changes.
 */

import { AGENTS, AGENTS_BY_ID } from '@/data/keylit/agents';
import { EDGES } from '@/data/keylit/edges';
import { EVIDENCE, EVIDENCE_BY_ID } from '@/data/keylit/evidence';
import { ALLELES_BY_ID, GENES, GENES_BY_ID } from '@/data/keylit/genes';
import { GENOMES, GENOMES_BY_ID, GENOMES_BY_PROJECT, GENOMES_BY_SLUG } from '@/data/keylit/genomes';
import { HERO_MUTATION_ID, MUTATIONS, MUTATIONS_BY_ID } from '@/data/keylit/mutations';
import type { AgentDna } from '@/lib/schema/agentDna';
import type { Evidence } from '@/lib/schema/common';
import type { Allele, Gene } from '@/lib/schema/gene';
import type { Genome } from '@/lib/schema/genome';
import type { LineageEdge } from '@/lib/schema/lineageEdge';
import type { Mutation } from '@/lib/schema/mutation';
import { parseAccession } from '@/lib/schema/accession';
import {
  EVIDENCE_CODE_META,
  EVIDENCE_TIER_RANK,
  INHERITANCE_MODES,
  type EvidenceCode,
  type EvidenceTier,
  type InheritanceMode,
} from '@/lib/schema/vocabulary';

/* ==========================================================================
   Genomes and projects
   ========================================================================== */

export function listGenomes(): Genome[] {
  return [...GENOMES].sort((a, b) => a.generation - b.generation || a.name.localeCompare(b.name));
}

/** Resolves a CAGENOME or CAPROJ accession, or a slug. */
export function getGenome(idOrSlug: string): Genome | null {
  const parsed = parseAccession(idOrSlug);
  if (parsed?.prefix === 'CAGENOME') return GENOMES_BY_ID.get(parsed.accession) ?? null;
  if (parsed?.prefix === 'CAPROJ') return GENOMES_BY_PROJECT.get(parsed.accession) ?? null;
  return GENOMES_BY_SLUG.get(idOrSlug) ?? null;
}

export function getRootGenome(): Genome {
  const root = GENOMES.find((g) => g.generation === 0 && g.parents.length === 0);
  if (!root) throw new Error('Seed data has no generation-zero genome');
  return root;
}

/** Direct children only. */
export function getChildren(genomeId: string): Genome[] {
  return GENOMES.filter((g) => g.parents.some((p) => p.genome === genomeId));
}

/** Every descendant, breadth-first, deduplicated across hybrid paths. */
export function getDescendants(genomeId: string): Genome[] {
  const seen = new Set<string>();
  const out: Genome[] = [];
  let frontier = getChildren(genomeId);

  while (frontier.length > 0) {
    const next: Genome[] = [];
    for (const genome of frontier) {
      if (seen.has(genome.id)) continue;
      seen.add(genome.id);
      out.push(genome);
      next.push(...getChildren(genome.id));
    }
    frontier = next;
  }

  return out;
}

/** The full ancestor set, nearest first. */
export function getAncestors(genomeId: string): Genome[] {
  const seen = new Set<string>();
  const out: Genome[] = [];
  let frontier: string[] = (getGenome(genomeId)?.parents ?? []).map((p) => p.genome);

  while (frontier.length > 0) {
    const next: string[] = [];
    for (const id of frontier) {
      if (seen.has(id)) continue;
      seen.add(id);
      const genome = GENOMES_BY_ID.get(id);
      if (!genome) continue;
      out.push(genome);
      next.push(...genome.parents.map((p) => p.genome));
    }
    frontier = next;
  }

  return out;
}

export function getSiblings(genomeId: string): Genome[] {
  const genome = getGenome(genomeId);
  if (!genome) return [];
  const parentIds = new Set(genome.parents.map((p) => p.genome));
  return GENOMES.filter(
    (g) => g.id !== genomeId && g.parents.some((p) => parentIds.has(p.genome)),
  );
}

/* ==========================================================================
   Genes and alleles
   ========================================================================== */

export function listGenes(): Gene[] {
  return [...GENES].sort((a, b) => b.stats.carrierCount - a.stats.carrierCount);
}

export function getGene(id: string): Gene | null {
  const parsed = parseAccession(id);
  return parsed ? (GENES_BY_ID.get(parsed.accession) ?? null) : null;
}

export function getAllele(id: string): { allele: Allele; gene: Gene } | null {
  const parsed = parseAccession(id);
  return parsed ? (ALLELES_BY_ID.get(parsed.accession) ?? null) : null;
}

/** Genomes that carry any allele of this gene, with which allele each carries. */
export function getGeneCarriers(geneId: string): { genome: Genome; allele: Allele }[] {
  const gene = getGene(geneId);
  if (!gene) return [];

  const out: { genome: Genome; allele: Allele }[] = [];
  for (const genome of listGenomes()) {
    const ref = genome.genes.find((g) => g.gene === gene.id);
    if (!ref) continue;
    const allele = gene.alleles.find((a) => a.id === ref.allele);
    if (allele) out.push({ genome, allele });
  }
  return out;
}

/** Genes present in a genome, resolved to their full records. */
export function getGenomeGenes(genomeId: string) {
  const genome = getGenome(genomeId);
  if (!genome) return [];

  return genome.genes.flatMap((ref) => {
    const gene = GENES_BY_ID.get(ref.gene);
    if (!gene) return [];
    const allele = gene.alleles.find((a) => a.id === ref.allele);
    if (!allele) return [];
    return [{ ref, gene, allele }];
  });
}

export type ResolvedGenomeGene = ReturnType<typeof getGenomeGenes>[number];

/* ==========================================================================
   Code Painting

   The 23andMe chromosome-painting analogue: what share of this project came
   from where. Weights are declared per gene in the genome, so the composition
   is a property of the data rather than something the UI invents.
   ========================================================================== */

export type PaintSegment = {
  mode: InheritanceMode;
  /** Normalised share of the genome, 0–1. */
  share: number;
  genes: ResolvedGenomeGene[];
  /** Nearest ancestor each gene arrived from, deduplicated. */
  sources: string[];
};

export type CodePainting = {
  genome: Genome;
  segments: PaintSegment[];
  /** Weighted mean gene confidence — how strongly the composition is evidenced. */
  confidence: number;
};

export function getCodePainting(genomeId: string): CodePainting | null {
  const genome = getGenome(genomeId);
  if (!genome) return null;

  const resolved = getGenomeGenes(genome.id);
  const total = resolved.reduce((sum, g) => sum + g.ref.weight, 0) || 1;

  const segments = INHERITANCE_MODES.flatMap<PaintSegment>((mode) => {
    const genes = resolved.filter((g) => g.ref.inheritance === mode);
    if (genes.length === 0) return [];

    const share = genes.reduce((sum, g) => sum + g.ref.weight, 0) / total;
    const sources = [
      ...new Set(genes.flatMap((g) => (g.ref.origin ? [g.ref.origin] : []))),
    ];

    return [{ mode, share, genes, sources }];
  });

  const confidence =
    resolved.reduce((sum, g) => sum + g.ref.confidence * g.ref.weight, 0) / total;

  return { genome, segments, confidence };
}

/** Compact, serialisable Code Painting for client components. */
export type PaintSegmentView = {
  mode: InheritanceMode;
  share: number;
  genes: { accession: string; name: string; share: number; origin: string | null }[];
  sources: { accession: string; name: string }[];
};

export type CodePaintingView = {
  genome: { accession: string; name: string; generation: number; slug: string };
  segments: PaintSegmentView[];
  confidence: number;
};

export function getCodePaintingView(genomeId: string): CodePaintingView | null {
  const painting = getCodePainting(genomeId);
  if (!painting) return null;

  const total =
    painting.segments.reduce((sum, s) => sum + s.share, 0) || 1;

  return {
    genome: {
      accession: painting.genome.id,
      name: painting.genome.name,
      generation: painting.genome.generation,
      slug: painting.genome.slug,
    },
    segments: painting.segments.map((segment) => ({
      mode: segment.mode,
      share: segment.share / total,
      genes: segment.genes
        .map((g) => ({
          accession: g.gene.id,
          name: g.gene.name,
          share: g.ref.weight,
          origin: g.ref.origin ? (GENOMES_BY_PROJECT.get(g.ref.origin)?.name ?? null) : null,
        }))
        .sort((a, b) => b.share - a.share),
      sources: segment.sources.flatMap((project) => {
        const source = GENOMES_BY_PROJECT.get(project);
        return source ? [{ accession: source.id, name: source.name }] : [];
      }),
    })),
    confidence: painting.confidence,
  };
}

/* ==========================================================================
   Mutations
   ========================================================================== */

export function listMutations(): Mutation[] {
  return [...MUTATIONS].sort((a, b) => b.proposedAt.localeCompare(a.proposedAt));
}

export function getMutation(id: string): Mutation | null {
  const parsed = parseAccession(id);
  return parsed ? (MUTATIONS_BY_ID.get(parsed.accession) ?? null) : null;
}

export function getHeroMutation(): Mutation {
  const mutation = MUTATIONS_BY_ID.get(HERO_MUTATION_ID);
  if (!mutation) throw new Error(`Hero mutation ${HERO_MUTATION_ID} missing from seed data`);
  return mutation;
}

export function getMutationsForGene(geneId: string): Mutation[] {
  return listMutations().filter((m) => m.gene === geneId);
}

const listed = (ids: readonly string[], id: string) => ids.some((entry) => entry === id);

export function getMutationsForGenome(genomeId: string): Mutation[] {
  return listMutations().filter(
    (m) =>
      m.originGenome === genomeId ||
      listed(m.offeredTo, genomeId) ||
      listed(m.adoptedBy, genomeId),
  );
}

/** Mutations another genome has offered to this one and not yet resolved. */
export function getIncomingMutations(genomeId: string): Mutation[] {
  return listMutations().filter(
    (m) =>
      listed(m.offeredTo, genomeId) &&
      !listed(m.adoptedBy, genomeId) &&
      !listed(m.rejectedBy, genomeId),
  );
}

/* ==========================================================================
   Agents
   ========================================================================== */

export function listAgents(): AgentDna[] {
  return [...AGENTS].sort((a, b) => a.generation - b.generation);
}

export function getAgent(id: string): AgentDna | null {
  const parsed = parseAccession(id);
  return parsed ? (AGENTS_BY_ID.get(parsed.accession) ?? null) : null;
}

export function getAgentsForGenome(genomeId: string): AgentDna[] {
  return AGENTS.filter((a) => a.genome === genomeId);
}

/* ==========================================================================
   Evidence
   ========================================================================== */

export function listEvidence(): Evidence[] {
  return EVIDENCE;
}

export function getEvidence(id: string): Evidence | null {
  const parsed = parseAccession(id);
  return parsed ? (EVIDENCE_BY_ID.get(parsed.accession) ?? null) : null;
}

export function resolveEvidence(ids: readonly string[]): Evidence[] {
  return ids.flatMap((id) => {
    const record = EVIDENCE_BY_ID.get(id);
    return record ? [record] : [];
  });
}

export function evidenceCodesFor(ids: readonly string[]): EvidenceCode[] {
  return [...new Set(resolveEvidence(ids).map((e) => e.code))];
}

/** Strongest tier among a set of evidence accessions. */
export function tierFor(ids: readonly string[]): EvidenceTier {
  let best: EvidenceTier = 'inferred';
  for (const code of evidenceCodesFor(ids)) {
    const tier = EVIDENCE_CODE_META[code].tier;
    if (EVIDENCE_TIER_RANK[tier] > EVIDENCE_TIER_RANK[best]) best = tier;
  }
  return best;
}

export function passesThreshold(ids: readonly string[], threshold: EvidenceTier): boolean {
  return EVIDENCE_TIER_RANK[tierFor(ids)] >= EVIDENCE_TIER_RANK[threshold];
}

/* ==========================================================================
   Lineage graph
   ========================================================================== */

export function listEdges(): LineageEdge[] {
  return EDGES;
}

export function getEdgesFor(accession: string): LineageEdge[] {
  return EDGES.filter((e) => e.from === accession || e.to === accession);
}

export function getDescentEdges(): LineageEdge[] {
  return EDGES.filter(
    (e) =>
      e.type === 'DERIVED_FROM' || e.type === 'MUTATED_FROM' || e.type === 'RECOMBINED_FROM',
  );
}

export function getTransferEdges(): LineageEdge[] {
  return EDGES.filter((e) => e.type === 'TRANSFERRED_FROM');
}

export function getProposalEdges(): LineageEdge[] {
  return EDGES.filter(
    (e) => e.type === 'PROPOSED_TO' || e.type === 'ADOPTED_FROM' || e.type === 'REJECTED_FROM',
  );
}

/* ==========================================================================
   Family-wide aggregates
   ========================================================================== */

export type FamilyStats = {
  genomes: number;
  generations: number;
  genes: number;
  alleles: number;
  mutations: number;
  agents: number;
  adoptedMutations: number;
  quarantined: number;
  unsafeAutoAdoptions: 0;
};

export function getFamilyStats(): FamilyStats {
  return {
    genomes: GENOMES.length,
    generations: Math.max(...GENOMES.map((g) => g.generation)) + 1,
    genes: GENES.length,
    alleles: GENES.reduce((sum, g) => sum + g.alleles.length, 0),
    mutations: MUTATIONS.length,
    agents: AGENTS.length,
    adoptedMutations: MUTATIONS.filter((m) => m.adoptedBy.length > 0).length,
    quarantined: MUTATIONS.filter((m) => m.state === 'quarantined').length,
    // Structural guarantee, not a measurement: nothing propagates without a decision.
    unsafeAutoAdoptions: 0,
  };
}

/** Projects x genes presence matrix — the family pangenome. */
export function getPangenome() {
  const genomes = listGenomes();
  const genes = listGenes();

  const cells = genes.map((gene) => ({
    gene,
    row: genomes.map((genome) => {
      const ref = genome.genes.find((g) => g.gene === gene.id);
      if (!ref) return null;
      const allele = gene.alleles.find((a) => a.id === ref.allele);
      return { ref, allele: allele ?? null };
    }),
  }));

  // Core genes are carried by every member; the rest are accessory.
  const core = cells.filter((c) => c.row.every((cell) => cell !== null)).length;

  return { genomes, genes, cells, core, accessory: genes.length - core };
}

export type Pangenome = ReturnType<typeof getPangenome>;
