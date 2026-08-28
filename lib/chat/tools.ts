import { tool } from '@openrouter/agent';
import { z } from 'zod';
import {
  getAgent,
  getAncestors,
  getDescendants,
  getGene,
  getGeneCarriers,
  getGenome,
  getGenomeGenes,
  getMutation,
  getMutationsForGenome,
  listGenes,
  listGenomes,
  listMutations,
} from '@/lib/registry';
import { getFamilyTree } from '@/lib/registry/tree';
import { codeBlast, searchRegistry, type EntityType } from '@/lib/registry/search';

/**
 * Tools that let the assistant read the registry instead of guessing at it.
 *
 * Everything here returns plain, already-summarised objects. The point is that
 * the assistant quotes the same accessions and counts the pages render, so a
 * visitor can check any claim it makes by clicking through.
 */

const searchTools = tool({
  name: 'search_registry',
  description:
    'Search the CodeAncestry registry for projects, capabilities (genes), mutations or AI agents. Use this for any question about what is in the registry, including "what projects exist", "which project has X", or a partial name.',
  inputSchema: z.object({
    query: z.string().describe('Free text: a name, capability, accession or keyword. Empty lists everything.'),
    type: z
      .enum(['project', 'gene', 'mutation', 'agent'])
      .optional()
      .describe('Restrict to one entity type. Omit to search all four.'),
  }),
  execute: async ({ query, type }) => {
    const types: EntityType[] = type ? [type] : ['project', 'gene', 'mutation', 'agent'];
    const grouped = searchRegistry(query, types);

    return {
      results: types.flatMap((entity) =>
        grouped[entity].slice(0, 8).map((hit) => ({
          type: entity,
          accession: hit.accession,
          title: hit.title,
          subtitle: hit.subtitle,
          href: hit.href,
          confidence: hit.confidence,
          evidence: hit.evidence,
        })),
      ),
    };
  },
});

const genomeTool = tool({
  name: 'get_project',
  description:
    'Full detail on one project genome: its capabilities and how each was inherited, its parents and descendants, its agents, and its mutations. Accepts an accession like CAGENOME:0001 or a slug.',
  inputSchema: z.object({
    project: z.string().describe('Genome accession or slug, for example "CAGENOME:0001" or "keylit-kids-es".'),
  }),
  execute: async ({ project }) => {
    const genome = getGenome(project);
    if (!genome) return { error: `No project matches "${project}".` };

    return {
      accession: genome.id,
      name: genome.name,
      tagline: genome.tagline,
      generation: genome.generation,
      founded: genome.createdAt,
      repository: genome.source.repository,
      commit: genome.source.commit,
      lineageAssurance: genome.lineageAssurance,
      visibility: genome.visibility,
      parents: genome.parents.map((parent) => ({
        genome: parent.genome,
        name: getGenome(parent.genome)?.name ?? parent.genome,
        relationship: parent.relationship,
        contribution: parent.contribution,
      })),
      descendants: getDescendants(genome.id).map((child) => ({
        accession: child.id,
        name: child.name,
        generation: child.generation,
      })),
      ancestors: getAncestors(genome.id).map((ancestor) => ({
        accession: ancestor.id,
        name: ancestor.name,
        generation: ancestor.generation,
      })),
      capabilities: getGenomeGenes(genome.id).map((resolved) => ({
        gene: resolved.gene.id,
        name: resolved.gene.name,
        inheritance: resolved.ref.inheritance,
        origin: resolved.ref.origin,
        weight: resolved.ref.weight,
      })),
      mutations: getMutationsForGenome(genome.id).map((mutation) => ({
        accession: mutation.id,
        shortId: mutation.shortId,
        title: mutation.title,
        state: mutation.state,
      })),
    };
  },
});

const geneTool = tool({
  name: 'get_capability',
  description:
    'Detail on one capability (gene): what it does, its alleles, which projects carry it, and where it originated. Accepts an accession like CAGENE:MIDI-SCHEDULING.',
  inputSchema: z.object({
    gene: z.string().describe('Gene accession, for example "CAGENE:MIDI-SCHEDULING".'),
  }),
  execute: async ({ gene }) => {
    const record = getGene(gene);
    if (!record) {
      return {
        error: `No capability matches "${gene}".`,
        available: listGenes().map((entry) => ({ accession: entry.id, name: entry.name })),
      };
    }

    return {
      accession: record.id,
      name: record.name,
      description: record.description,
      ontology: record.ontology,
      license: record.license.spdx,
      currentAllele: record.currentAllele,
      stats: record.stats,
      alleles: record.alleles.map((allele) => ({
        accession: allele.id,
        version: allele.version,
        label: allele.label,
        summary: allele.summary,
        language: allele.language,
        firstObservedAt: allele.firstObservedAt,
        producedByMutation: allele.producedBy,
        parents: allele.parents,
      })),
      carriers: getGeneCarriers(record.id).map((carrier) => ({
        project: carrier.genome.name,
        accession: carrier.genome.id,
        allele: carrier.allele.id,
      })),
    };
  },
});

const mutationTool = tool({
  name: 'get_mutation',
  description:
    'Detail on one mutation: what changed, who authored it, its evidence, which projects adopted, declined or are still deciding. Accepts an accession like CAMUT:882 or a short id like M-83F12.',
  inputSchema: z.object({
    mutation: z.string().describe('Mutation accession or short id.'),
  }),
  execute: async ({ mutation }) => {
    const record =
      getMutation(mutation) ??
      listMutations().find(
        (entry) => entry.shortId.toLowerCase() === mutation.toLowerCase().replace(/^m-/i, 'M-'),
      ) ??
      listMutations().find((entry) => entry.shortId.toLowerCase() === mutation.toLowerCase());

    if (!record) {
      return {
        error: `No mutation matches "${mutation}".`,
        available: listMutations().map((entry) => ({
          accession: entry.id,
          shortId: entry.shortId,
          title: entry.title,
        })),
      };
    }

    const named = (ids: readonly string[]) =>
      ids.map((id) => getGenome(id)?.name ?? getAgent(id)?.displayName ?? id);

    return {
      accession: record.id,
      shortId: record.shortId,
      title: record.title,
      summary: record.summary,
      gene: record.gene,
      state: record.state,
      kind: record.kind,
      proposedAt: record.proposedAt,
      proposedByAgent: getAgent(record.proposedBy)?.displayName ?? record.proposedBy,
      originProject: getGenome(record.originGenome)?.name ?? record.originGenome,
      fromAllele: record.fromAllele,
      toAllele: record.toAllele,
      offeredTo: named(record.offeredTo),
      adoptedBy: named(record.adoptedBy),
      rejectedBy: named(record.rejectedBy),
      fitness: record.fitness,
      checklist: record.checklist,
      evidence: record.evidence.map((entry) => ({
        accession: entry.id,
        code: entry.code,
        summary: entry.summary,
      })),
    };
  },
});

const agentTool = tool({
  name: 'get_agent',
  description:
    'Detail on one AI agent DNA record: its provider and model, its authorised memory, and the mutations it authored. Accepts an accession like CAGENT:0003.',
  inputSchema: z.object({
    agent: z.string().describe('Agent accession, for example "CAGENT:0003".'),
  }),
  execute: async ({ agent }) => {
    const record = getAgent(agent);
    if (!record) return { error: `No agent matches "${agent}".` };

    return {
      accession: record.id,
      name: record.displayName,
      provider: record.identity.provider,
      identityVerification: record.identity.verification,
      generation: record.generation,
      operatesOn: getGenome(record.genome)?.name ?? record.genome,
      parentAgent: record.parentAgent,
      policies: record.policies,
      authorizedMemory: {
        mode: record.authorizedMemory.mode,
        lineageSummaries: record.authorizedMemory.lineageSummaries,
        acceptedMutations: record.authorizedMemory.acceptedMutations,
        rejectedMutations: record.authorizedMemory.rejectedMutations,
        artifacts: record.authorizedMemory.artifacts.map((artifact) => ({
          accession: artifact.id,
          kind: artifact.kind,
          summary: artifact.summary,
        })),
      },
      telemetry: record.telemetry.mode,
      trust: record.trust,
      mutationsAuthored: record.knowledgeProduced.map(
        (id) => getMutation(id)?.shortId ?? id,
      ),
    };
  },
});

const lineageTool = tool({
  name: 'get_family_lineage',
  description:
    'The whole KEYLIT family graph: every project with its generation and gene composition, and every typed relation between them, including lateral transfers and upstream offers. Use this for questions about the shape of the family or how capabilities flowed.',
  inputSchema: z.object({}),
  execute: async () => {
    const tree = getFamilyTree('keylit');
    if (!tree) return { error: 'The family tree is unavailable.' };

    return {
      family: tree.name,
      root: tree.root,
      generations: tree.generations,
      stats: tree.stats,
      projects: tree.nodes.map((node) => ({
        accession: node.accession,
        name: node.name,
        generation: node.generation,
        geneCount: node.geneCount,
        composition: node.composition.map(
          (segment) => `${Math.round(segment.share * 100)}% ${segment.mode}`,
        ),
        parents: node.parents.map((parent) => parent.genome),
      })),
      relations: tree.edges.map((edge) => ({
        type: edge.type,
        label: edge.label,
        from: getGenome(edge.from)?.name ?? edge.from,
        to: getGenome(edge.to)?.name ?? edge.to,
        confidence: edge.confidence,
        evidence: edge.evidence,
        againstDescent: edge.upstream || edge.type === 'TRANSFERRED_FROM',
      })),
      capabilityFlow: tree.sankey.links.map((link) => ({
        from: getGenome(link.source)?.name ?? link.source,
        to: getGenome(link.target)?.name ?? link.target,
        weight: Number(link.value.toFixed(3)),
        capabilities: link.genes,
      })),
    };
  },
});

const blastTool = tool({
  name: 'code_blast',
  description:
    'Match a code snippet against known alleles in the registry, the way BLAST matches a sequence against a database. Use when a visitor pastes code and asks where it came from or whether it is known.',
  inputSchema: z.object({
    snippet: z.string().describe('The code to match. A few lines is enough.'),
  }),
  execute: async ({ snippet }) => ({
    hits: codeBlast(snippet, 5).map((hit) => ({
      allele: hit.alleleAccession,
      alleleLabel: hit.alleleLabel,
      gene: hit.geneAccession,
      geneName: hit.geneName,
      identity: hit.identity,
      carriedBy: hit.carriedBy,
      basis: hit.basis.map((entry) => `${entry.label} ${Math.round(entry.score * 100)}%`),
    })),
    note: 'Identity scores come from a demonstration fingerprint matcher over seeded fixtures, not a production BLAST engine.',
  }),
});

const overviewTool = tool({
  name: 'registry_overview',
  description:
    'Counts and a listing of everything in the registry. Cheap starting point when a visitor asks what is on the site.',
  inputSchema: z.object({}),
  execute: async () => ({
    projects: listGenomes().map((genome) => ({
      accession: genome.id,
      name: genome.name,
      generation: genome.generation,
      tagline: genome.tagline,
    })),
    capabilities: listGenes().map((gene) => ({ accession: gene.id, name: gene.name })),
    mutations: listMutations().map((mutation) => ({
      accession: mutation.id,
      shortId: mutation.shortId,
      title: mutation.title,
      state: mutation.state,
    })),
    note: 'Seeded fixture data for a working concept, not live repository ingestion.',
  }),
});

export const registryTools = [
  overviewTool,
  searchTools,
  genomeTool,
  geneTool,
  mutationTool,
  agentTool,
  lineageTool,
  blastTool,
];
