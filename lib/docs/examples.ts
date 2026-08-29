import { getAgent, getGene, getHeroMutation, getRootGenome, listEdges } from '@/lib/registry';
import { abridgeGenome } from '@/lib/docs/formats';

/**
 * Example payloads taken from the seeded KEYLIT family. Field names match the
 * Zod schemas. Nothing here is invented for the documentation.
 */

export function getGenomeExample() {
  const genome = getRootGenome();
  return abridgeGenome(genome, 2);
}

export function getGeneExample() {
  const gene = getGene('CAGENE:MIDI-SCHEDULING');
  if (!gene) throw new Error('Seed gene CAGENE:MIDI-SCHEDULING is missing');

  return {
    $schema: gene.$schema,
    schemaVersion: gene.schemaVersion,
    id: gene.id,
    name: gene.name,
    description: gene.description,
    ontology: gene.ontology,
    currentAllele: gene.currentAllele,
    alleles: gene.alleles.slice(0, 2).map((allele) => ({
      id: allele.id,
      number: allele.number,
      version: allele.version,
      digest: allele.digest,
      label: allele.label,
      summary: allele.summary,
      parents: allele.parents,
      originProject: allele.originProject,
      firstObservedAt: allele.firstObservedAt,
      language: allele.language,
      anchors: allele.anchors,
      interfaces: allele.interfaces,
      tests: allele.tests,
      carriedBy: allele.carriedBy,
      ...(allele.producedBy ? { producedBy: allele.producedBy } : {}),
    })),
    origin: gene.origin,
    license: gene.license,
    confidence: gene.confidence,
    stats: gene.stats,
  };
}

export function getAgentExample() {
  const agent = getAgent('CAAGENT:KEYLIT:1');
  if (!agent) throw new Error('Seed agent CAAGENT:KEYLIT:1 is missing');
  return agent;
}

export function getMutationExample() {
  const mutation = getHeroMutation();
  return {
    $schema: mutation.$schema,
    schemaVersion: mutation.schemaVersion,
    id: mutation.id,
    shortId: mutation.shortId,
    title: mutation.title,
    summary: mutation.summary,
    state: mutation.state,
    kind: mutation.kind,
    gene: mutation.gene,
    fromAllele: mutation.fromAllele,
    toAllele: mutation.toAllele,
    originGenome: mutation.originGenome,
    originGeneration: mutation.originGeneration,
    proposedBy: mutation.proposedBy,
    proposedAt: mutation.proposedAt,
    offeredTo: mutation.offeredTo,
    adoptedBy: mutation.adoptedBy,
    rejectedBy: mutation.rejectedBy,
    change: {
      refDigest: mutation.change.refDigest,
      altDigest: mutation.change.altDigest,
      commit: mutation.change.commit,
      symbolsChanged: mutation.change.symbolsChanged,
      testSuitesTouched: mutation.change.testSuitesTouched,
      apiBreaks: mutation.change.apiBreaks,
    },
    checklist: mutation.checklist,
    evidence: mutation.evidence.map((item) => ({
      id: item.id,
      code: item.code,
      summary: item.summary,
      count: item.count,
      observedAt: item.observedAt,
      digest: item.digest,
    })),
    attestations: mutation.attestations,
    fitness: mutation.fitness,
    compatibility: mutation.compatibility,
    confidence: mutation.confidence,
  };
}

export function getEdgeExample() {
  const edge = listEdges().find((item) => item.type === 'DERIVED_FROM');
  if (!edge) throw new Error('Seed data has no DERIVED_FROM edge');
  return edge;
}

export function pretty(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}
