import {
  evidenceCodesFor,
  getAncestors,
  getGene,
  getGenome,
  listGenomes,
  tierFor,
} from '@/lib/registry';
import type { Genome } from '@/lib/schema/genome';
import { ONTOLOGY_LABELS } from '@/lib/schema/gene';
import type {
  EvidenceCode,
  EvidenceTier,
  ExpressionState,
  InheritanceMode,
} from '@/lib/schema/vocabulary';

/**
 * Two-genome comparison.
 *
 * The unit of comparison is the capability, not the file, which is the only
 * reason this view can say anything useful: two projects in different languages
 * with no shared line of code can still carry the same gene, and a diff would
 * report that as total divergence.
 *
 * Four verdicts, kept distinct on purpose. `same` and `diverged` both mean both
 * projects have the capability and differ only in whether the implementation
 * matches. `onlyA` / `onlyB` mean one of them does not have it at all, which is
 * a different claim and should not be collapsed into "different".
 */

export type Verdict = 'same' | 'diverged' | 'onlyA' | 'onlyB';

export type SideView = {
  allele: { accession: string; number: number; version: string; label: string };
  inheritance: InheritanceMode;
  expression: ExpressionState;
  /** Share of that project this capability accounts for, 0–1. */
  weight: number;
  confidence: number;
  tier: EvidenceTier;
  evidence: EvidenceCode[];
  /** Nearest ancestor the gene arrived from, when it was not native. */
  origin: string | null;
};

export type CompareRow = {
  gene: { accession: string; name: string; term: string };
  verdict: Verdict;
  a: SideView | null;
  b: SideView | null;
  /**
   * When both carry the gene, how far apart the alleles are in allele numbers.
   * Zero for `same`. A large gap means one side is several mutations behind.
   */
  distance: number;
};

export type CompareGroup = {
  term: string;
  label: string;
  rows: CompareRow[];
  counts: Record<Verdict, number>;
};

export type GenomeSummary = {
  accession: string;
  name: string;
  slug: string;
  generation: number;
  tagline: string;
  repository: string;
  commit: string;
  license: string;
  createdAt: string;
  geneCount: number;
};

export type Relationship = {
  kind: 'same' | 'ancestor' | 'descendant' | 'siblings' | 'related' | 'unrelated';
  /** Most recent common ancestor, when the two share one. */
  ancestor: { accession: string; name: string; generation: number } | null;
  /** Generations from the common ancestor down to each side. */
  distance: { a: number; b: number };
  /** One sentence naming the relation, for the page to use directly. */
  summary: string;
};

export type Comparison = {
  a: GenomeSummary;
  b: GenomeSummary;
  relationship: Relationship;
  groups: CompareGroup[];
  counts: Record<Verdict, number>;
  /** Share of each genome, by weight, that the shared genes account for. */
  shared: { a: number; b: number };
  /** Genes both carry, as a fraction of the union. */
  jaccard: number;
};

function summarise(genome: Genome): GenomeSummary {
  return {
    accession: genome.id,
    name: genome.name,
    slug: genome.slug,
    generation: genome.generation,
    tagline: genome.tagline,
    repository: genome.source.repository,
    commit: genome.source.commit,
    license: genome.licenses.spdxExpression,
    createdAt: genome.createdAt,
    geneCount: genome.genes.length,
  };
}

function sideFor(genome: Genome, geneId: string): SideView | null {
  const ref = genome.genes.find((entry) => entry.gene === geneId);
  if (!ref) return null;

  const gene = getGene(geneId);
  const allele = gene?.alleles.find((entry) => entry.id === ref.allele);

  return {
    allele: {
      accession: ref.allele,
      number: allele?.number ?? 0,
      version: ref.version,
      label: allele?.label ?? ref.version,
    },
    inheritance: ref.inheritance,
    expression: ref.expression,
    weight: ref.weight,
    confidence: ref.confidence,
    tier: tierFor(ref.evidence),
    evidence: evidenceCodesFor(ref.evidence),
    origin: ref.origin ? (getGenome(ref.origin)?.name ?? ref.origin) : null,
  };
}

/**
 * The most recent common ancestor, and what to call the relation.
 *
 * Worth computing rather than guessing from generation numbers: two genomes at
 * the same generation are only siblings if they descend from the same parent,
 * and the difference between "sibling" and "cousin" changes how surprised a
 * reader should be by a divergence.
 */
function relate(a: Genome, b: Genome): Relationship {
  if (a.id === b.id) {
    return {
      kind: 'same',
      ancestor: null,
      distance: { a: 0, b: 0 },
      summary: 'The same genome on both sides. Pick a second project to compare.',
    };
  }

  /* Root-first chains, each ending at the genome itself. */
  const chainA = [...getAncestors(a.id).slice().reverse(), a];
  const chainB = [...getAncestors(b.id).slice().reverse(), b];

  let shared = 0;
  while (
    shared < chainA.length &&
    shared < chainB.length &&
    chainA[shared]?.id === chainB[shared]?.id
  ) {
    shared += 1;
  }

  const ancestorNode = shared > 0 ? chainA[shared - 1] : null;
  const ancestor = ancestorNode
    ? {
        accession: ancestorNode.id,
        name: ancestorNode.name,
        generation: ancestorNode.generation,
      }
    : null;

  const stepsA = chainA.length - shared;
  const stepsB = chainB.length - shared;

  if (ancestorNode?.id === a.id) {
    return {
      kind: 'ancestor',
      ancestor,
      distance: { a: 0, b: stepsB },
      summary: `${a.name} is an ancestor of ${b.name}, ${stepsB} ${
        stepsB === 1 ? 'generation' : 'generations'
      } up.`,
    };
  }

  if (ancestorNode?.id === b.id) {
    return {
      kind: 'descendant',
      ancestor,
      distance: { a: stepsA, b: 0 },
      summary: `${b.name} is an ancestor of ${a.name}, ${stepsA} ${
        stepsA === 1 ? 'generation' : 'generations'
      } up.`,
    };
  }

  if (!ancestor) {
    return {
      kind: 'unrelated',
      ancestor: null,
      distance: { a: chainA.length, b: chainB.length },
      summary:
        'No common ancestor on record. Any capability both carry arrived independently, or by transfer rather than descent.',
    };
  }

  if (stepsA === 1 && stepsB === 1) {
    return {
      kind: 'siblings',
      ancestor,
      distance: { a: 1, b: 1 },
      summary: `Siblings: both forked directly from ${ancestor.name}.`,
    };
  }

  return {
    kind: 'related',
    ancestor,
    distance: { a: stepsA, b: stepsB },
    summary: `Both descend from ${ancestor.name} — ${a.name} ${stepsA} ${
      stepsA === 1 ? 'generation' : 'generations'
    } below it, ${b.name} ${stepsB}.`,
  };
}

const EMPTY_COUNTS = (): Record<Verdict, number> => ({
  same: 0,
  diverged: 0,
  onlyA: 0,
  onlyB: 0,
});

/** The top-level ontology domain a term belongs to, e.g. `input.music.midi` -> `input`. */
function domainOf(term: string): string {
  return term.split('.')[0] ?? term;
}

export function getComparison(aId: string, bId: string): Comparison | null {
  const a = getGenome(aId);
  const b = getGenome(bId);
  if (!a || !b) return null;

  const geneIds = [...new Set([...a.genes, ...b.genes].map((ref) => ref.gene))];

  const rows: CompareRow[] = geneIds.flatMap((geneId) => {
    const gene = getGene(geneId);
    if (!gene) return [];

    const sideA = sideFor(a, geneId);
    const sideB = sideFor(b, geneId);

    const verdict: Verdict = !sideA
      ? 'onlyB'
      : !sideB
        ? 'onlyA'
        : sideA.allele.accession === sideB.allele.accession
          ? 'same'
          : 'diverged';

    return [
      {
        gene: { accession: gene.id, name: gene.name, term: gene.ontology.term },
        verdict,
        a: sideA,
        b: sideB,
        distance:
          sideA && sideB ? Math.abs(sideA.allele.number - sideB.allele.number) : 0,
      },
    ];
  });

  /* Group by ontology domain, and order rows so divergences surface first: a
     reader scanning a long matrix wants the differences, not the agreements. */
  const order: Record<Verdict, number> = { diverged: 0, onlyA: 1, onlyB: 2, same: 3 };

  const byDomain = new Map<string, CompareRow[]>();
  for (const row of rows) {
    const domain = domainOf(row.gene.term);
    const bucket = byDomain.get(domain);
    if (bucket) bucket.push(row);
    else byDomain.set(domain, [row]);
  }

  const groups: CompareGroup[] = [...byDomain.entries()]
    .map(([term, groupRows]) => {
      const counts = EMPTY_COUNTS();
      for (const row of groupRows) counts[row.verdict] += 1;

      return {
        term,
        label: ONTOLOGY_LABELS.get(term) ?? term,
        rows: groupRows
          .slice()
          .sort(
            (left, right) =>
              order[left.verdict] - order[right.verdict] ||
              left.gene.name.localeCompare(right.gene.name),
          ),
        counts,
      };
    })
    .sort(
      (left, right) =>
        right.counts.diverged - left.counts.diverged ||
        right.rows.length - left.rows.length ||
        left.label.localeCompare(right.label),
    );

  const counts = EMPTY_COUNTS();
  for (const row of rows) counts[row.verdict] += 1;

  const sharedRows = rows.filter((row) => row.a && row.b);
  const weightOf = (side: 'a' | 'b') =>
    sharedRows.reduce((total, row) => total + (row[side]?.weight ?? 0), 0);

  return {
    a: summarise(a),
    b: summarise(b),
    relationship: relate(a, b),
    groups,
    counts,
    shared: { a: weightOf('a'), b: weightOf('b') },
    jaccard: rows.length > 0 ? sharedRows.length / rows.length : 0,
  };
}

/** Genome options for the two selectors, cheapest possible shape. */
export function listCompareOptions(): { accession: string; name: string; generation: number }[] {
  return listGenomes()
    .map((genome) => ({
      accession: genome.id,
      name: genome.name,
      generation: genome.generation,
    }))
    .sort((left, right) => left.generation - right.generation || left.name.localeCompare(right.name));
}
