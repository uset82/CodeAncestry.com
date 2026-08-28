import {
  anchorUrl,
  evidenceCodesFor,
  getGene,
  getGenome,
  getMutationsForGene,
  listGenomes,
  resolveEvidence,
  tierFor,
} from '@/lib/registry';
import { ontologyPath } from '@/lib/schema/gene';
import type { EvidenceCode, EvidenceTier, ExpressionState, InheritanceMode } from '@/lib/schema/vocabulary';

/**
 * View model for the capability gene record.
 *
 * The page it feeds is a UniProt entry, not a GitHub file view: the accession
 * and the ontology class lead, the alleles are the versions of the capability
 * rather than versions of a file, and the carriers answer the only question a
 * reader of a gene record actually has — who has this, and which variant.
 *
 * An allele is the unit of change here. Two projects can carry the same gene
 * with different alleles and be honestly described as sharing a capability
 * while differing in implementation, which is the whole reason the gene and the
 * file are kept apart.
 */

export type AnchorView = {
  repository: string;
  commit: string;
  path: string;
  symbols: string[];
  range: [number, number] | null;
  url: string | null;
};

export type AlleleView = {
  accession: string;
  number: number;
  version: string;
  label: string;
  summary: string;
  digest: string;
  language: string;
  firstObservedAt: string;
  /** The project the allele was first observed in, resolved to a name. */
  originProject: { accession: string; name: string } | null;
  /** Allele versions this one descends from. Empty for the original. */
  parents: { accession: string; version: string; number: number }[];
  /** The mutation that produced it, when it was not the original. */
  producedBy: { accession: string; shortId: string; title: string } | null;
  interfaces: { inputs: string[]; outputs: string[] };
  tests: string[];
  anchors: AnchorView[];
  carriers: { accession: string; name: string; generation: number }[];
  isCurrent: boolean;
};

export type CarrierView = {
  accession: string;
  name: string;
  slug: string;
  generation: number;
  allele: { accession: string; number: number; version: string };
  inheritance: InheritanceMode;
  expression: ExpressionState;
  /** Share of that project this capability accounts for, 0–1. */
  weight: number;
  confidence: number;
  evidence: EvidenceCode[];
  tier: EvidenceTier;
  /** The ancestor it arrived from, resolved to a name. Null when native. */
  origin: string | null;
  anchors: AnchorView[];
};

export type AnnotationView = {
  term: string;
  statement: string;
  confidence: number;
  tier: EvidenceTier;
  evidence: {
    accession: string;
    code: EvidenceCode;
    summary: string;
    count: number | null;
    observedAt: string;
    digest: string | null;
  }[];
};

export type GeneMutationView = {
  accession: string;
  shortId: string;
  title: string;
  state: string;
  kind: string;
  proposedAt: string;
  fromAllele: string;
  toAllele: string;
  adopted: number;
  rejected: number;
  confidence: number;
};

export type GeneRecord = {
  accession: string;
  name: string;
  description: string;
  ontology: { term: string; path: { term: string; label: string }[]; tags: string[] };
  license: string;
  origin: {
    project: string;
    projectName: string | null;
    commit: string;
    at: string;
  };
  confidence: { semanticBoundary: number; origin: number };
  stats: {
    carriers: number;
    alleles: number;
    mutations: number;
    descendantProjects: number;
    generationsSpanned: number;
  };
  currentAllele: string;
  alleles: AlleleView[];
  carriers: CarrierView[];
  mutations: GeneMutationView[];
  annotations: AnnotationView[];
  /** Carriers grouped by generation — how far the capability has travelled. */
  spread: { generation: number; carriers: { accession: string; name: string; version: string }[] }[];
};

/* ==========================================================================
   Helpers
   ========================================================================== */

function toAnchorView(anchor: {
  repository: string;
  commit: string;
  path: string;
  symbols: string[];
  range?: [number, number] | undefined;
}): AnchorView {
  return {
    repository: anchor.repository,
    commit: anchor.commit,
    path: anchor.path,
    symbols: anchor.symbols,
    range: anchor.range ?? null,
    url: anchorUrl(anchor.repository, anchor.commit, anchor.path),
  };
}

/* ==========================================================================
   The model
   ========================================================================== */

export function getGeneRecord(id: string): GeneRecord | null {
  const gene = getGene(id);
  if (!gene) return null;

  const genomes = listGenomes();
  const mutations = getMutationsForGene(gene.id);

  /** Project accession → the genome that is that project, for name lookups. */
  const byProject = new Map(genomes.map((genome) => [genome.project, genome]));

  const alleleByAccession = new Map(gene.alleles.map((allele) => [allele.id, allele]));

  const alleles: AlleleView[] = gene.alleles
    .slice()
    .sort((a, b) => a.number - b.number)
    .map((allele) => {
      const producer = mutations.find((mutation) => mutation.id === allele.producedBy);
      const origin = byProject.get(allele.originProject) ?? null;

      return {
        accession: allele.id,
        number: allele.number,
        version: allele.version,
        label: allele.label,
        summary: allele.summary,
        digest: allele.digest,
        language: allele.language,
        firstObservedAt: allele.firstObservedAt,
        originProject: origin ? { accession: origin.id, name: origin.name } : null,
        parents: allele.parents.flatMap((parent) => {
          const record = alleleByAccession.get(parent);
          return record
            ? [{ accession: record.id, version: record.version, number: record.number }]
            : [];
        }),
        producedBy: producer
          ? { accession: producer.id, shortId: producer.shortId, title: producer.title }
          : null,
        interfaces: allele.interfaces,
        tests: allele.tests,
        anchors: allele.anchors.map(toAnchorView),
        carriers: allele.carriedBy.flatMap((carrier) => {
          const record = getGenome(carrier);
          return record
            ? [{ accession: record.id, name: record.name, generation: record.generation }]
            : [];
        }),
        isCurrent: allele.id === gene.currentAllele,
      };
    });

  const carriers: CarrierView[] = genomes.flatMap((genome) => {
    const ref = genome.genes.find((entry) => entry.gene === gene.id);
    if (!ref) return [];

    const allele = alleleByAccession.get(ref.allele);
    if (!allele) return [];

    const origin = ref.origin ? (byProject.get(ref.origin)?.name ?? null) : null;

    return [
      {
        accession: genome.id,
        name: genome.name,
        slug: genome.slug,
        generation: genome.generation,
        allele: { accession: allele.id, number: allele.number, version: allele.version },
        inheritance: ref.inheritance,
        expression: ref.expression,
        weight: ref.weight,
        confidence: ref.confidence,
        evidence: evidenceCodesFor(ref.evidence),
        tier: tierFor(ref.evidence),
        origin,
        anchors: ref.anchors.map(toAnchorView),
      },
    ];
  });

  const annotations: AnnotationView[] = gene.annotations.map((annotation) => ({
    term: annotation.term,
    statement: annotation.statement,
    confidence: annotation.confidence,
    tier: tierFor(annotation.evidence),
    evidence: resolveEvidence(annotation.evidence).map((record) => ({
      accession: record.id,
      code: record.code,
      summary: record.summary,
      count: record.count ?? null,
      observedAt: record.observedAt,
      digest: record.digest ?? null,
    })),
  }));

  const generations = [...new Set(carriers.map((carrier) => carrier.generation))].sort(
    (a, b) => a - b,
  );

  return {
    accession: gene.id,
    name: gene.name,
    description: gene.description,
    ontology: {
      term: gene.ontology.term,
      path: ontologyPath(gene.ontology.term),
      tags: gene.ontology.tags,
    },
    license: gene.license.spdx,
    origin: {
      project: gene.origin.project,
      projectName: byProject.get(gene.origin.project)?.name ?? null,
      commit: gene.origin.firstObservedCommit,
      at: gene.origin.firstObservedAt,
    },
    confidence: gene.confidence,
    stats: {
      carriers: gene.stats.carrierCount,
      alleles: gene.stats.alleleCount,
      mutations: gene.stats.mutationCount,
      descendantProjects: gene.stats.descendantProjects,
      generationsSpanned: generations.length,
    },
    currentAllele: gene.currentAllele,
    alleles,
    carriers,
    mutations: mutations.map((mutation) => ({
      accession: mutation.id,
      shortId: mutation.shortId,
      title: mutation.title,
      state: mutation.state,
      kind: mutation.kind,
      proposedAt: mutation.proposedAt,
      fromAllele: alleleByAccession.get(mutation.fromAllele)?.version ?? mutation.fromAllele,
      toAllele: alleleByAccession.get(mutation.toAllele)?.version ?? mutation.toAllele,
      adopted: mutation.adoptedBy.length,
      rejected: mutation.rejectedBy.length,
      confidence: mutation.confidence,
    })),
    annotations,
    spread: generations.map((generation) => ({
      generation,
      carriers: carriers
        .filter((carrier) => carrier.generation === generation)
        .map((carrier) => ({
          accession: carrier.accession,
          name: carrier.name,
          version: carrier.allele.version,
        })),
    })),
  };
}

/**
 * A field-by-field comparison of two alleles of one gene.
 *
 * `same` and `diverged` are the interesting verdicts; `onlyA` / `onlyB` cover a
 * field one allele declares and the other does not, which is different from the
 * two declaring different values and is worth saying so.
 */
export type AlleleDiffRow = {
  field: string;
  a: string[];
  b: string[];
  verdict: 'same' | 'diverged' | 'onlyA' | 'onlyB' | 'absent';
};

export function diffAlleles(a: AlleleView, b: AlleleView): AlleleDiffRow[] {
  const row = (field: string, left: string[], right: string[]): AlleleDiffRow => {
    const leftSet = left.filter((value) => value !== '');
    const rightSet = right.filter((value) => value !== '');

    const verdict: AlleleDiffRow['verdict'] =
      leftSet.length === 0 && rightSet.length === 0
        ? 'absent'
        : leftSet.length === 0
          ? 'onlyB'
          : rightSet.length === 0
            ? 'onlyA'
            : leftSet.length === rightSet.length && leftSet.every((v, i) => v === rightSet[i])
              ? 'same'
              : 'diverged';

    return { field, a: leftSet, b: rightSet, verdict };
  };

  return [
    row('Version', [a.version], [b.version]),
    row('Language', [a.language], [b.language]),
    row('Content digest', [a.digest], [b.digest]),
    row('First observed', [a.firstObservedAt], [b.firstObservedAt]),
    row('Origin project', [a.originProject?.name ?? ''], [b.originProject?.name ?? '']),
    row('Inputs', a.interfaces.inputs, b.interfaces.inputs),
    row('Outputs', a.interfaces.outputs, b.interfaces.outputs),
    row('Test suites', a.tests, b.tests),
    row(
      'Source anchors',
      a.anchors.map((anchor) => anchor.path),
      b.anchors.map((anchor) => anchor.path),
    ),
    row(
      'Exported symbols',
      a.anchors.flatMap((anchor) => anchor.symbols),
      b.anchors.flatMap((anchor) => anchor.symbols),
    ),
    row(
      'Carried by',
      a.carriers.map((carrier) => carrier.name),
      b.carriers.map((carrier) => carrier.name),
    ),
    row(
      'Produced by',
      [a.producedBy ? `${a.producedBy.shortId} — ${a.producedBy.title}` : ''],
      [b.producedBy ? `${b.producedBy.shortId} — ${b.producedBy.title}` : ''],
    ),
  ];
}
