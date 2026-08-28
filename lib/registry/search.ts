import { ACCESSION_KINDS, parseAccession, type AccessionPrefix } from '@/lib/schema/accession';
import { ontologyPath } from '@/lib/schema/gene';
import type { EvidenceTier } from '@/lib/schema/vocabulary';
import {
  evidenceCodesFor,
  listAgents,
  listGenes,
  listGenomes,
  listMutations,
  tierFor,
} from './index';
import type { EvidenceCode } from '@/lib/schema/vocabulary';

/**
 * Registry search.
 *
 * Behaves like UniProt or AmiGO rather than like GitHub search: a query for
 * "MIDI buffering" returns genes, projects, mutations and agents as separate
 * entity types, each with its own evidence and confidence.
 */

export type EntityType = 'project' | 'gene' | 'mutation' | 'agent';

export const ENTITY_TABS: { type: EntityType; label: string; prefix: AccessionPrefix }[] = [
  { type: 'project', label: 'Projects', prefix: 'CAGENOME' },
  { type: 'gene', label: 'Genes', prefix: 'CAGENE' },
  { type: 'mutation', label: 'Mutations', prefix: 'CAMUT' },
  { type: 'agent', label: 'Agents', prefix: 'CAAGENT' },
];

export type SearchHit = {
  type: EntityType;
  accession: string;
  title: string;
  subtitle: string;
  detail: string;
  href: string;
  evidence: EvidenceCode[];
  tier: EvidenceTier;
  confidence: number;
  facets: {
    generation?: number;
    language?: string;
    ecosystem?: string;
    license?: string;
    family?: string;
    host?: string;
    ontology?: string;
    state?: string;
    provider?: string;
  };
  /** Relevance, 0–1. Only meaningful within one result set. */
  score: number;
};

export type SearchFacets = {
  generation?: number[];
  language?: string[];
  license?: string[];
  host?: string[];
  ontologyRoot?: string[];
  state?: string[];
  provider?: string[];
  minTier?: EvidenceTier;
};

function matches(query: string, ...fields: (string | undefined)[]): number {
  if (!query) return 0.5;
  const needle = query.toLowerCase().trim();
  const terms = needle.split(/\s+/).filter(Boolean);
  if (terms.length === 0) return 0.5;

  let hits = 0;
  const haystack = fields.filter(Boolean).join(' \u0000 ').toLowerCase();

  for (const term of terms) {
    if (haystack.includes(term)) hits += 1;
  }

  if (hits === 0) return 0;
  // Exact appearance of the whole query ranks above scattered term matches.
  return haystack.includes(needle) ? 1 : 0.4 + 0.5 * (hits / terms.length);
}

function projectHits(query: string): SearchHit[] {
  return listGenomes().flatMap((genome) => {
    const score = matches(
      query,
      genome.name,
      genome.slug,
      genome.tagline,
      genome.description,
      genome.source.repository,
      genome.id,
      genome.project,
    );
    if (score === 0) return [];

    const evidenceIds = genome.genes.flatMap((g) => g.evidence);
    return [
      {
        type: 'project' as const,
        accession: genome.id,
        title: genome.name,
        subtitle: `Generation ${genome.generation} · ${genome.genes.length} genes`,
        detail: genome.tagline,
        href: `/project/${genome.id}`,
        evidence: evidenceCodesFor(evidenceIds),
        tier: genome.lineageAssurance,
        confidence:
          genome.genes.reduce((sum, g) => sum + g.confidence, 0) / genome.genes.length,
        facets: {
          generation: genome.generation,
          license: genome.licenses.spdxExpression,
          host: genome.source.provider,
          family: 'KEYLIT',
        },
        score,
      },
    ];
  });
}

function geneHits(query: string): SearchHit[] {
  return listGenes().flatMap((gene) => {
    const score = matches(
      query,
      gene.name,
      gene.description,
      gene.id,
      gene.ontology.term,
      gene.ontology.tags.join(' '),
      gene.alleles.map((a) => `${a.label} ${a.summary}`).join(' '),
    );
    if (score === 0) return [];

    const evidenceIds = gene.annotations.flatMap((a) => a.evidence);
    return [
      {
        type: 'gene' as const,
        accession: gene.id,
        title: gene.name,
        subtitle: `${gene.stats.alleleCount} alleles · carried by ${gene.stats.carrierCount} genomes`,
        detail: gene.description,
        href: `/gene/${gene.id}`,
        evidence: evidenceCodesFor(evidenceIds),
        tier: evidenceIds.length > 0 ? tierFor(evidenceIds) : 'inferred',
        confidence: gene.confidence.semanticBoundary,
        facets: {
          language: gene.alleles[0]?.language,
          license: gene.license.spdx,
          ontology: gene.ontology.term.split('.')[0],
          family: 'KEYLIT',
        },
        score,
      },
    ];
  });
}

function mutationHits(query: string): SearchHit[] {
  return listMutations().flatMap((mutation) => {
    const score = matches(
      query,
      mutation.title,
      mutation.summary,
      mutation.id,
      mutation.shortId,
      mutation.gene,
      mutation.kind,
      mutation.change.commit,
    );
    if (score === 0) return [];

    return [
      {
        type: 'mutation' as const,
        accession: mutation.id,
        title: mutation.title,
        subtitle: `${mutation.shortId} · ${mutation.kind} · ${mutation.state}`,
        detail: mutation.summary,
        href: `/mutation/${mutation.id}`,
        evidence: [...new Set(mutation.evidence.map((e) => e.code))],
        tier:
          mutation.evidence.length > 0
            ? tierFor(mutation.evidence.map((e) => e.id))
            : 'inferred',
        confidence: mutation.confidence,
        facets: { state: mutation.state, family: 'KEYLIT' },
        score,
      },
    ];
  });
}

function agentHits(query: string): SearchHit[] {
  return listAgents().flatMap((agent) => {
    const score = matches(
      query,
      agent.displayName,
      agent.id,
      agent.identity.provider,
      agent.capabilities.join(' '),
    );
    if (score === 0) return [];

    return [
      {
        type: 'agent' as const,
        accession: agent.id,
        title: agent.displayName,
        subtitle: `Generation ${agent.generation} · ${agent.identity.provider} · ${agent.knowledgeProduced.length} mutations authored`,
        detail: `${agent.capabilities.length} capabilities, ${agent.authorizedMemory.artifacts.length} published artifacts, telemetry ${agent.telemetry.mode}.`,
        href: `/agent/${agent.id}`,
        evidence: agent.trust.outputsSigned ? ['HVR'] : ['AII'],
        tier: agent.trust.identityVerified ? 'verified' : 'inferred',
        confidence: agent.trust.reliability,
        facets: { generation: agent.generation, provider: agent.identity.provider },
        score,
      },
    ];
  });
}

const HIT_BUILDERS: Record<EntityType, (query: string) => SearchHit[]> = {
  project: projectHits,
  gene: geneHits,
  mutation: mutationHits,
  agent: agentHits,
};

export function searchRegistry(
  query: string,
  types: EntityType[] = ['project', 'gene', 'mutation', 'agent'],
  facets: SearchFacets = {},
): Record<EntityType, SearchHit[]> {
  const out = {} as Record<EntityType, SearchHit[]>;

  for (const type of ['project', 'gene', 'mutation', 'agent'] as EntityType[]) {
    if (!types.includes(type)) {
      out[type] = [];
      continue;
    }

    let hits = HIT_BUILDERS[type](query);

    if (facets.generation?.length) {
      hits = hits.filter(
        (h) => h.facets.generation === undefined || facets.generation!.includes(h.facets.generation),
      );
    }
    if (facets.language?.length) {
      hits = hits.filter(
        (h) => !h.facets.language || facets.language!.includes(h.facets.language),
      );
    }
    if (facets.license?.length) {
      hits = hits.filter((h) => !h.facets.license || facets.license!.includes(h.facets.license));
    }
    if (facets.host?.length) {
      hits = hits.filter((h) => !h.facets.host || facets.host!.includes(h.facets.host));
    }
    if (facets.ontologyRoot?.length) {
      hits = hits.filter(
        (h) => !h.facets.ontology || facets.ontologyRoot!.includes(h.facets.ontology),
      );
    }
    if (facets.state?.length) {
      hits = hits.filter((h) => !h.facets.state || facets.state!.includes(h.facets.state));
    }
    if (facets.provider?.length) {
      hits = hits.filter(
        (h) => !h.facets.provider || facets.provider!.includes(h.facets.provider),
      );
    }
    if (facets.minTier) {
      const rank = { inferred: 0, reviewed: 1, verified: 2 };
      hits = hits.filter((h) => rank[h.tier] >= rank[facets.minTier!]);
    }

    out[type] = hits.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
  }

  return out;
}

/** Exact accession resolution, so typing an ID jumps straight to the record. */
export function resolveExact(query: string): { href: string; label: string } | null {
  const trimmed = query.trim();

  const parsed = parseAccession(trimmed);
  if (parsed) {
    const kind = ACCESSION_KINDS[parsed.prefix];
    const all = searchRegistry(parsed.accession);
    for (const hits of Object.values(all)) {
      const exact = hits.find((h) => h.accession === parsed.accession);
      if (exact) return { href: exact.href, label: `${kind.label}: ${exact.title}` };
    }
  }

  // commit:<sha> resolves to the genome built from it.
  const commitMatch = /^commit:([0-9a-f]{7,40})$/i.exec(trimmed);
  if (commitMatch) {
    const sha = commitMatch[1]!.toLowerCase();
    const genome = listGenomes().find((g) => g.source.commit.startsWith(sha));
    if (genome) return { href: `/project/${genome.id}`, label: `Genome at ${sha}` };
  }

  return null;
}

/* ==========================================================================
   CodeBLAST

   Similarity search over capability fingerprints. The point is finding a
   capability you have no name for: paste an implementation, get the alleles in
   the registry that do the same job.
   ========================================================================== */

export type BlastBasis = {
  facet: 'structure' | 'imports' | 'contracts' | 'tests' | 'dependencies' | 'semantics';
  label: string;
  weight: number;
  score: number;
};

export type BlastHit = {
  geneAccession: string
  geneName: string;
  alleleAccession: string;
  alleleLabel: string;
  href: string;
  identity: number;
  basis: BlastBasis[];
  carriedBy: number;
  ontology: { term: string; label: string }[];
};

const BASIS_WEIGHTS: { facet: BlastBasis['facet']; label: string; weight: number }[] = [
  { facet: 'structure', label: 'AST structure', weight: 0.28 },
  { facet: 'contracts', label: 'Public contracts', weight: 0.24 },
  { facet: 'semantics', label: 'Semantic embedding', weight: 0.2 },
  { facet: 'imports', label: 'Import graph', weight: 0.12 },
  { facet: 'tests', label: 'Test shape', weight: 0.1 },
  { facet: 'dependencies', label: 'Dependency closure', weight: 0.06 },
];

/** Deterministic pseudo-random in [0,1) from a string, so results are stable. */
function hashUnit(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}

/**
 * A demonstration fingerprint matcher. Real CodeBLAST would compare AST
 * shape, import graphs, declared contracts, test structure and semantic
 * embeddings; this scores lexical overlap against those same facets so the
 * interface can be designed honestly before the engine exists.
 */
export function codeBlast(snippet: string, limit = 6): BlastHit[] {
  const tokens = new Set(
    snippet
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length > 2),
  );

  if (tokens.size === 0) return [];

  const hits: BlastHit[] = [];

  for (const gene of listGenes()) {
    for (const allele of gene.alleles) {
      const corpus = [
        gene.name,
        gene.description,
        gene.ontology.term,
        gene.ontology.tags.join(' '),
        allele.label,
        allele.summary,
        allele.interfaces.inputs.join(' '),
        allele.interfaces.outputs.join(' '),
        allele.tests.join(' '),
        allele.anchors.flatMap((a) => [a.path, ...a.symbols]).join(' '),
      ]
        .join(' ')
        .toLowerCase();

      const corpusTokens = new Set(corpus.split(/[^a-z0-9]+/).filter((t) => t.length > 2));
      let overlap = 0;
      for (const token of tokens) if (corpusTokens.has(token)) overlap += 1;
      if (overlap === 0) continue;

      const base = overlap / tokens.size;
      const seed = `${allele.id}:${overlap}`;

      const basis = BASIS_WEIGHTS.map((facet, i) => ({
        ...facet,
        // Spread the per-facet score around the lexical base, deterministically.
        score: Math.min(1, Math.max(0.05, base * (0.6 + 0.8 * hashUnit(`${seed}:${i}`)))),
      }));

      const identity = basis.reduce((sum, b) => sum + b.weight * b.score, 0);

      hits.push({
        geneAccession: gene.id,
        geneName: gene.name,
        alleleAccession: allele.id,
        alleleLabel: allele.label,
        href: `/gene/${gene.id}#allele-${allele.number}`,
        identity,
        basis,
        carriedBy: allele.carriedBy.length,
        ontology: ontologyPath(gene.ontology.term),
      });
    }
  }

  return hits.sort((a, b) => b.identity - a.identity).slice(0, limit);
}

/** Example queries offered on the CodeBLAST page. */
export const BLAST_EXAMPLES = [
  {
    label: 'A scheduler that buffers MIDI events',
    snippet: `const BUFFER_FRAMES = 128;

export class MidiScheduler {
  schedule(event: MidiEvent) {
    const at = this.context.currentTime + BUFFER_FRAMES / this.sampleRate;
    this.voices.start(event.note, at);
  }
}`,
  },
  {
    label: 'Something that narrates state to a screen reader',
    snippet: `export function announce(text: string) {
  liveRegion.textContent = '';
  requestAnimationFrame(() => {
    liveRegion.textContent = text;
  });
}`,
  },
  {
    label: 'A lesson picker driven by past attempts',
    snippet: `function nextExercise(history: Attempt[]) {
  const recent = history.slice(-5);
  const accuracy = mean(recent.map((a) => a.score));
  return accuracy > 0.85 ? syllabus.harder() : syllabus.repeat();
}`,
  },
] as const;
