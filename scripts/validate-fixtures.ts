/**
 * Validates every seeded fixture against its Zod schema and checks the
 * cross-references between them.
 *
 * This is the guard that keeps the demo honest: if a genome points at an allele
 * that no gene declares, or a mutation cites evidence that does not exist, the
 * build fails rather than rendering a plausible-looking lie.
 */

import { AGENTS } from '../data/keylit/agents';
import { EDGES } from '../data/keylit/edges';
import { EVIDENCE } from '../data/keylit/evidence';
import { GENES } from '../data/keylit/genes';
import { GENOMES } from '../data/keylit/genomes';
import { MUTATIONS } from '../data/keylit/mutations';
import { agentDnaSchema } from '../lib/schema/agentDna';
import { evidenceSchema } from '../lib/schema/common';
import { geneSchema } from '../lib/schema/gene';
import { genomeSchema } from '../lib/schema/genome';
import { lineageEdgeSchema } from '../lib/schema/lineageEdge';
import { mutationSchema } from '../lib/schema/mutation';
import { ONTOLOGY_LABELS } from '../lib/schema/gene';
import { parseAccession } from '../lib/schema/accession';
import type { z } from 'zod';

let failures = 0;
let checks = 0;

function fail(context: string, message: string) {
  failures += 1;
  console.error(`  ✕ ${context}: ${message}`);
}

function ok(message: string) {
  console.log(`  ✓ ${message}`);
}

function validateAll<T>(label: string, schema: z.ZodType<T>, records: unknown[], idOf: (r: unknown) => string) {
  let bad = 0;
  for (const record of records) {
    checks += 1;
    const result = schema.safeParse(record);
    if (!result.success) {
      bad += 1;
      const issues = result.error.issues
        .slice(0, 4)
        .map((i) => `${i.path.join('.') || '<root>'} — ${i.message}`)
        .join('; ');
      fail(`${label} ${idOf(record)}`, issues);
    }
  }
  if (bad === 0) ok(`${records.length} ${label} records match the schema`);
}

function idOf(record: unknown): string {
  return typeof record === 'object' && record !== null && 'id' in record
    ? String((record as { id: unknown }).id)
    : '<no id>';
}

console.log('\nCodeAncestry fixture validation\n');

console.log('Schemas');
validateAll('evidence', evidenceSchema, EVIDENCE, idOf);
validateAll('gene', geneSchema, GENES, idOf);
validateAll('genome', genomeSchema, GENOMES, idOf);
validateAll('mutation', mutationSchema, MUTATIONS, idOf);
validateAll('agent-dna', agentDnaSchema, AGENTS, idOf);
validateAll('lineage-edge', lineageEdgeSchema, EDGES, idOf);

/* ---------------------------------------------------------------- indexes */

const evidenceIds = new Set<string>(EVIDENCE.map((e) => e.id));
const geneIds = new Set<string>(GENES.map((g) => g.id));
const alleleIds = new Set<string>(GENES.flatMap((g) => g.alleles.map((a) => a.id)));
const genomeIds = new Set<string>(GENOMES.map((g) => g.id));
const projectIds = new Set<string>(GENOMES.map((g) => g.project));
const mutationIds = new Set<string>(MUTATIONS.map((m) => m.id));
const agentIds = new Set<string>(AGENTS.map((a) => a.id));

console.log('\nCross-references');

/* ------------------------------------------------------------- accessions */
for (const record of [...EVIDENCE, ...GENES, ...GENOMES, ...MUTATIONS, ...AGENTS]) {
  checks += 1;
  if (!parseAccession(record.id)) fail('accession', `${record.id} is not a valid accession`);
}
ok('every record id parses as an accession');

/* ------------------------------------------------------------------ genes */
for (const gene of GENES) {
  checks += 1;
  if (!ONTOLOGY_LABELS.has(gene.ontology.term)) {
    fail(gene.id, `ontology term "${gene.ontology.term}" is not in the capability ontology`);
  }

  if (!alleleIds.has(gene.currentAllele)) {
    fail(gene.id, `currentAllele ${gene.currentAllele} does not exist`);
  }

  const numbers = gene.alleles.map((a) => a.number);
  if (new Set(numbers).size !== numbers.length) {
    fail(gene.id, 'allele numbers are not unique');
  }

  for (const allele of gene.alleles) {
    if (!allele.id.startsWith(`CAALLELE:${gene.id.slice('CAGENE:'.length)}:`)) {
      fail(allele.id, `allele accession does not belong to ${gene.id}`);
    }
    if (allele.id !== `CAALLELE:${gene.id.slice('CAGENE:'.length)}:${allele.number}`) {
      fail(allele.id, `allele accession does not match its number (${allele.number})`);
    }
    for (const parent of allele.parents) {
      if (!alleleIds.has(parent)) fail(allele.id, `parent allele ${parent} does not exist`);
    }
    if (!projectIds.has(allele.originProject)) {
      fail(allele.id, `originProject ${allele.originProject} is not a seeded project`);
    }
    for (const carrier of allele.carriedBy) {
      if (!genomeIds.has(carrier)) fail(allele.id, `carriedBy ${carrier} does not exist`);
    }
    if (allele.producedBy && !mutationIds.has(allele.producedBy)) {
      fail(allele.id, `producedBy ${allele.producedBy} does not exist`);
    }
  }

  for (const annotation of gene.annotations) {
    for (const id of annotation.evidence) {
      if (!evidenceIds.has(id)) fail(gene.id, `annotation cites missing evidence ${id}`);
    }
  }

  if (!projectIds.has(gene.origin.project)) {
    fail(gene.id, `origin.project ${gene.origin.project} is not a seeded project`);
  }
}
ok('gene alleles, ontology terms and evidence all resolve');

/* ---------------------------------------------------------------- genomes */
for (const genome of GENOMES) {
  checks += 1;

  for (const parent of genome.parents) {
    if (!genomeIds.has(parent.genome)) {
      fail(genome.id, `parent genome ${parent.genome} does not exist`);
    }
    if (!projectIds.has(parent.project)) {
      fail(genome.id, `parent project ${parent.project} does not exist`);
    }
    const parentGenome = GENOMES.find((g) => g.id === parent.genome);
    if (parentGenome && parentGenome.generation >= genome.generation) {
      fail(
        genome.id,
        `parent ${parent.genome} is generation ${parentGenome.generation}, not below ${genome.generation}`,
      );
    }
  }

  if (genome.generation === 0 && genome.parents.length > 0) {
    fail(genome.id, 'generation 0 must have no parents');
  }
  if (genome.generation > 0 && genome.parents.length === 0) {
    fail(genome.id, `generation ${genome.generation} must have at least one parent`);
  }

  const seenGenes = new Set<string>();
  let weight = 0;

  for (const ref of genome.genes) {
    if (!geneIds.has(ref.gene)) fail(genome.id, `carries unknown gene ${ref.gene}`);
    if (!alleleIds.has(ref.allele)) fail(genome.id, `carries unknown allele ${ref.allele}`);
    if (seenGenes.has(ref.gene)) fail(genome.id, `carries ${ref.gene} more than once`);
    seenGenes.add(ref.gene);

    const gene = GENES.find((g) => g.id === ref.gene);
    const allele = gene?.alleles.find((a) => a.id === ref.allele);
    if (gene && !allele) fail(genome.id, `${ref.allele} is not an allele of ${ref.gene}`);
    if (allele && !allele.carriedBy.includes(genome.id)) {
      fail(genome.id, `${ref.allele} does not list this genome in carriedBy`);
    }

    if (ref.inheritance === 'native' && genome.generation !== 0) {
      fail(genome.id, `${ref.gene} is marked native but this is generation ${genome.generation}`);
    }
    if (ref.inheritance !== 'native' && ref.inheritance !== 'local' && !ref.origin) {
      fail(genome.id, `${ref.gene} is ${ref.inheritance} but has no origin project`);
    }
    if (ref.origin && !projectIds.has(ref.origin)) {
      fail(genome.id, `${ref.gene} origin ${ref.origin} is not a seeded project`);
    }

    for (const id of ref.evidence) {
      if (!evidenceIds.has(id)) fail(genome.id, `${ref.gene} cites missing evidence ${id}`);
    }

    weight += ref.weight;
  }

  // Weights drive Code Painting proportions, so they must sum to roughly 1.
  if (Math.abs(weight - 1) > 0.02) {
    fail(genome.id, `gene weights sum to ${weight.toFixed(3)}, expected 1.00 ± 0.02`);
  }

  for (const agent of genome.agents) {
    if (!agentIds.has(agent)) fail(genome.id, `references unknown agent ${agent}`);
  }
}
ok('genome parents, genes, weights and agents all resolve');

/* -------------------------------------------------------------- mutations */
for (const mutation of MUTATIONS) {
  checks += 1;

  if (!geneIds.has(mutation.gene)) fail(mutation.id, `unknown gene ${mutation.gene}`);
  if (!alleleIds.has(mutation.fromAllele)) {
    fail(mutation.id, `unknown fromAllele ${mutation.fromAllele}`);
  }
  if (!alleleIds.has(mutation.toAllele)) {
    fail(mutation.id, `unknown toAllele ${mutation.toAllele}`);
  }
  if (!genomeIds.has(mutation.originGenome)) {
    fail(mutation.id, `unknown originGenome ${mutation.originGenome}`);
  }
  if (!agentIds.has(mutation.proposedBy)) {
    fail(mutation.id, `unknown proposedBy ${mutation.proposedBy}`);
  }

  for (const id of [...mutation.offeredTo, ...mutation.adoptedBy, ...mutation.rejectedBy]) {
    if (!genomeIds.has(id)) fail(mutation.id, `references unknown genome ${id}`);
  }

  for (const record of mutation.evidence) {
    if (!evidenceIds.has(record.id)) fail(mutation.id, `evidence ${record.id} is not in the pool`);
  }

  // The safety invariant the whole product rests on.
  const propagating =
    mutation.state === 'eligible-for-propagation' ||
    mutation.state === 'offered-to-relatives' ||
    mutation.state === 'adopted';

  if (propagating) {
    const { checklist } = mutation;
    if (!checklist.sourceDigestVerified || !checklist.testsPassed || !checklist.securityPolicyPassed) {
      fail(
        mutation.id,
        `state "${mutation.state}" without source, test and policy verification`,
      );
    }
  }

  if (mutation.state === 'adopted' && mutation.adoptedBy.length === 0) {
    fail(mutation.id, 'state is adopted but adoptedBy is empty');
  }
  if (mutation.state === 'quarantined' && mutation.offeredTo.length > 0) {
    fail(mutation.id, 'quarantined mutations must not be offered to relatives');
  }
}
ok('mutation references resolve and no unverified mutation is propagating');

/* ----------------------------------------------------------------- agents */
for (const agent of AGENTS) {
  checks += 1;
  if (!genomeIds.has(agent.genome)) fail(agent.id, `unknown genome ${agent.genome}`);
  if (!projectIds.has(agent.project)) fail(agent.id, `unknown project ${agent.project}`);
  if (agent.parentAgent && !agentIds.has(agent.parentAgent)) {
    fail(agent.id, `unknown parentAgent ${agent.parentAgent}`);
  }
  for (const id of agent.knowledgeProduced) {
    if (!mutationIds.has(id)) fail(agent.id, `knowledgeProduced cites missing mutation ${id}`);
  }
  for (const artifact of agent.authorizedMemory.artifacts) {
    for (const id of artifact.offeredTo) {
      if (!genomeIds.has(id)) fail(agent.id, `artifact ${artifact.id} offered to unknown ${id}`);
    }
  }
  if (agent.policies.canAutoMerge) {
    fail(agent.id, 'canAutoMerge must be false in the seeded family');
  }
}
ok('agent lineage, authored mutations and policies are consistent');

/* ------------------------------------------------------------------ edges */
const edgeIds = new Set<string>();
for (const edge of EDGES) {
  checks += 1;
  if (edgeIds.has(edge.id)) fail('edges', `duplicate edge id ${edge.id}`);
  edgeIds.add(edge.id);

  for (const endpoint of [edge.from, edge.to]) {
    if (!genomeIds.has(endpoint) && !geneIds.has(endpoint) && !alleleIds.has(endpoint)) {
      fail(edge.id, `endpoint ${endpoint} is not a seeded entity`);
    }
  }
  for (const id of edge.evidence) {
    if (!evidenceIds.has(id)) fail(edge.id, `cites missing evidence ${id}`);
  }
  if (edge.gene && !geneIds.has(edge.gene)) fail(edge.id, `unknown gene ${edge.gene}`);
  if (edge.mutation && !mutationIds.has(edge.mutation)) {
    fail(edge.id, `unknown mutation ${edge.mutation}`);
  }
  if (edge.from === edge.to) fail(edge.id, 'edge is a self-loop');
}
ok('lineage edges are unique, typed and fully resolved');

/* ---------------------------------------------- descent graph is acyclic */
{
  const descent = new Map<string, string[]>();
  for (const genome of GENOMES) {
    descent.set(
      genome.id,
      genome.parents.map((p) => p.genome),
    );
  }

  const state = new Map<string, 'visiting' | 'done'>();
  const walk = (node: string, path: string[]): void => {
    const current = state.get(node);
    if (current === 'done') return;
    if (current === 'visiting') {
      fail('descent graph', `cycle detected: ${[...path, node].join(' → ')}`);
      return;
    }
    state.set(node, 'visiting');
    for (const parent of descent.get(node) ?? []) walk(parent, [...path, node]);
    state.set(node, 'done');
  };

  checks += 1;
  for (const genome of GENOMES) walk(genome.id, []);
  ok('descent graph is a DAG');
}

/* --------------------------------------------------------------- reporting */

console.log(
  `\n${failures === 0 ? '✓' : '✕'} ${checks} checks run, ${failures} failure${failures === 1 ? '' : 's'}\n`,
);

if (failures > 0) process.exit(1);
