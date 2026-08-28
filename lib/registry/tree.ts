import {
  evidenceCodesFor,
  getAgentsForGenome,
  getGenome,
  getGenomeGenes,
  listAgents,
  listEdges,
  listGenomes,
  listMutations,
} from './index';
import type { EvidenceTier } from '@/lib/schema/vocabulary';
import {
  EDGE_TYPE_META,
  INHERITANCE_MODES,
  LINEAGE_STATE_META,
  MUTATION_STATE_META,
  type EdgeType,
  type EvidenceCode,
  type InheritanceMode,
  type LineageState,
} from '@/lib/schema/vocabulary';

/**
 * View models for the Family CodeTree.
 *
 * Layouts are the visualisation's business; this module's job is to hand over a
 * single serialisable description of the family that a tidy tree, a radial tree,
 * a force DAG, a Sankey and a plain nested list can all render from — so no two
 * views can disagree about what the family actually is.
 */

export type TreeNode = {
  accession: string;
  project: string;
  name: string;
  slug: string;
  tagline: string;
  generation: number;
  commit: string;
  repository: string;
  createdAt: string;
  lineageAssurance: EvidenceTier;
  visibility: 'public' | 'organization' | 'private';
  /** Gene composition, the counts the node inspector reports. */
  composition: { mode: InheritanceMode; count: number; share: number }[];
  geneCount: number;
  /** Parents in declaration order, with the share each contributed. */
  parents: { genome: string; relationship: string; contribution: number }[];
  children: string[];
  agents: {
    accession: string;
    name: string;
    provider: string;
    generation: number;
    /** Authorised-memory counters, the agent's institutional knowledge. */
    memory: { summaries: number; accepted: number; rejected: number; artifacts: number };
    authored: number;
  }[];
  releases: { version: string; verified: boolean }[];
  /** Mutations that originated here. */
  mutationsAuthored: number;
  /** Mutations this genome adopted from elsewhere. */
  mutationsAdopted: number;
  openProposals: number;
};

export type TreeEdge = {
  id: string;
  type: EdgeType;
  /** The descendant, or the proposer for upstream edges. */
  from: string;
  /** The ancestor, or the recipient for upstream edges. */
  to: string;
  label: string;
  verb: string;
  state: LineageState;
  stroke: 'solid' | 'dashed' | 'dotted' | 'double';
  tone: string;
  confidence: number;
  evidence: EvidenceCode[];
  createdAt: string;
  gene?: string;
  mutation?: string;
  /** True for edges that run against descent — a child teaching a parent. */
  upstream: boolean;
};

export type SankeyModel = {
  nodes: { id: string; name: string; generation: number }[];
  links: { source: string; target: string; value: number; genes: string[] }[];
};

export type PropagationEvent = {
  id: string;
  mutation: string;
  shortId: string;
  title: string;
  from: string;
  to: string;
  outcome: 'adopted' | 'proposed' | 'rejected' | 'quarantined';
  at: string;
  /** Generation distance travelled; negative means it went upstream. */
  span: number;
};

export type FamilyTree = {
  slug: string;
  name: string;
  root: string;
  generations: number;
  nodes: TreeNode[];
  edges: TreeEdge[];
  /** Spanning tree for hierarchy layouts: one primary parent per node. */
  spine: { id: string; parent: string | null; secondaryParents: string[] }[];
  sankey: SankeyModel;
  propagation: PropagationEvent[];
  transfers: TreeEdge[];
  stats: {
    projects: number;
    genes: number;
    mutations: number;
    agents: number;
    hybrids: number;
    transfers: number;
    upstreamProposals: number;
  };
};

/* ==========================================================================
   Construction
   ========================================================================== */

/** Edges that describe descent, i.e. the ones a hierarchy layout may use. */
const DESCENT: EdgeType[] = ['DERIVED_FROM', 'MUTATED_FROM', 'RECOMBINED_FROM'];

/** Edges that run against descent, from a younger project to an older one. */
const UPSTREAM: EdgeType[] = ['PROPOSED_TO', 'ADOPTED_FROM', 'REJECTED_FROM'];

function buildNode(genomeId: string): TreeNode | null {
  const genome = getGenome(genomeId);
  if (!genome) return null;

  const resolved = getGenomeGenes(genome.id);
  const totalWeight = resolved.reduce((sum, g) => sum + g.ref.weight, 0) || 1;

  const composition = INHERITANCE_MODES.flatMap((mode) => {
    const genes = resolved.filter((g) => g.ref.inheritance === mode);
    if (genes.length === 0) return [];
    return [
      {
        mode,
        count: genes.length,
        share: genes.reduce((sum, g) => sum + g.ref.weight, 0) / totalWeight,
      },
    ];
  });

  const mutations = listMutations();

  return {
    accession: genome.id,
    project: genome.project,
    name: genome.name,
    slug: genome.slug,
    tagline: genome.tagline,
    generation: genome.generation,
    commit: genome.source.commit,
    repository: genome.source.repository,
    createdAt: genome.createdAt,
    lineageAssurance: genome.lineageAssurance,
    visibility: genome.visibility,
    composition,
    geneCount: resolved.length,
    parents: genome.parents.map((parent) => ({
      genome: parent.genome,
      relationship: parent.relationship,
      contribution: parent.contribution,
    })),
    children: listGenomes()
      .filter((candidate) => candidate.parents.some((p) => p.genome === genome.id))
      .map((candidate) => candidate.id),
    agents: getAgentsForGenome(genome.id).map((agent) => ({
      accession: agent.id,
      name: agent.displayName,
      provider: agent.identity.provider,
      generation: agent.generation,
      memory: {
        summaries: agent.authorizedMemory.lineageSummaries,
        accepted: agent.authorizedMemory.acceptedMutations,
        rejected: agent.authorizedMemory.rejectedMutations,
        artifacts: agent.authorizedMemory.artifacts.length,
      },
      authored: agent.knowledgeProduced.length,
    })),
    releases: genome.releases.map((release) => ({
      version: release.version,
      verified: release.verified,
    })),
    mutationsAuthored: mutations.filter((m) => m.originGenome === genome.id).length,
    mutationsAdopted: mutations.filter((m) => m.adoptedBy.some((id) => id === genome.id)).length,
    openProposals: mutations.filter(
      (m) =>
        m.offeredTo.some((id) => id === genome.id) &&
        !m.adoptedBy.some((id) => id === genome.id) &&
        !m.rejectedBy.some((id) => id === genome.id),
    ).length,
  };
}

function buildEdge(edge: ReturnType<typeof listEdges>[number]): TreeEdge {
  const meta = EDGE_TYPE_META[edge.type];
  const state: LineageState =
    edge.type === 'REJECTED_FROM'
      ? 'rejected'
      : edge.type === 'PROPOSED_TO'
        ? 'proposed'
        : edge.assertion;

  return {
    id: edge.id,
    type: edge.type,
    from: edge.from,
    to: edge.to,
    label: edge.label ?? meta.label,
    verb: meta.verb,
    state,
    stroke: meta.stroke,
    tone: meta.tone,
    confidence: edge.confidence,
    evidence: evidenceCodesFor(edge.evidence),
    createdAt: edge.createdAt,
    gene: edge.gene,
    mutation: edge.mutation,
    upstream: UPSTREAM.includes(edge.type),
  };
}

/**
 * Capability flow between projects, aggregated for the Sankey view.
 *
 * A link's value is the summed weight of the genes the child received from that
 * parent, so a thick band means "most of what this project is came from there".
 */
function buildSankey(nodes: TreeNode[]): SankeyModel {
  const byProject = new Map(nodes.map((node) => [node.project, node]));
  const links = new Map<string, { value: number; genes: string[] }>();

  for (const node of nodes) {
    for (const { ref, gene } of getGenomeGenes(node.accession)) {
      if (!ref.origin || ref.origin === node.project) continue;
      const source = byProject.get(ref.origin);
      if (!source) continue;

      const key = `${source.accession}→${node.accession}`;
      const entry = links.get(key) ?? { value: 0, genes: [] };
      entry.value += ref.weight;
      entry.genes.push(gene.name);
      links.set(key, entry);
    }
  }

  return {
    nodes: nodes.map((node) => ({
      id: node.accession,
      name: node.name,
      generation: node.generation,
    })),
    links: [...links.entries()].map(([key, entry]) => {
      const [source, target] = key.split('→') as [string, string];
      return { source, target, value: entry.value, genes: entry.genes };
    }),
  };
}

/** Every propagation attempt in the family, for the chronological arc diagram. */
function buildPropagation(nodes: TreeNode[]): PropagationEvent[] {
  const generationOf = new Map(nodes.map((node) => [node.accession, node.generation]));
  const events: PropagationEvent[] = [];

  for (const mutation of listMutations()) {
    const origin = mutation.originGenome;
    const originGeneration = generationOf.get(origin);
    if (originGeneration === undefined) continue;

    const recipients = new Set<string>([
      ...mutation.offeredTo,
      ...mutation.adoptedBy,
      ...mutation.rejectedBy,
    ]);

    for (const recipient of recipients) {
      const recipientGeneration = generationOf.get(recipient);
      if (recipientGeneration === undefined) continue;

      const outcome = mutation.adoptedBy.some((id) => id === recipient)
        ? 'adopted'
        : mutation.rejectedBy.some((id) => id === recipient)
          ? 'rejected'
          : mutation.state === 'quarantined'
            ? 'quarantined'
            : 'proposed';

      events.push({
        id: `${mutation.id}→${recipient}`,
        mutation: mutation.id,
        shortId: mutation.shortId,
        title: mutation.title,
        from: origin,
        to: recipient,
        outcome,
        at: mutation.proposedAt,
        span: recipientGeneration - originGeneration,
      });
    }
  }

  return events.sort((a, b) => a.at.localeCompare(b.at));
}

/**
 * Choose one primary parent per node so hierarchy layouts have a spanning tree.
 * The highest-contribution parent wins, which puts a hybrid on the branch it
 * mostly came from and records the other parent as a secondary edge to overlay.
 */
function buildSpine(nodes: TreeNode[]) {
  return nodes.map((node) => {
    const ranked = [...node.parents].sort((a, b) => b.contribution - a.contribution);
    const [primary, ...rest] = ranked;
    return {
      id: node.accession,
      parent: primary?.genome ?? null,
      secondaryParents: rest.map((parent) => parent.genome),
    };
  });
}

/* ==========================================================================
   Public API
   ========================================================================== */

/** The seeded registry holds exactly one family; the slug keeps the route honest. */
const FAMILIES: Record<string, { name: string }> = {
  keylit: { name: 'KEYLIT' },
};

export function listFamilies() {
  return Object.entries(FAMILIES).map(([slug, family]) => ({ slug, name: family.name }));
}

export function getFamilyTree(slug: string): FamilyTree | null {
  const family = FAMILIES[slug];
  if (!family) return null;

  const nodes = listGenomes().flatMap((genome) => {
    const node = buildNode(genome.id);
    return node ? [node] : [];
  });

  if (nodes.length === 0) return null;

  const edges = listEdges().map(buildEdge);
  const root = nodes.find((node) => node.parents.length === 0)?.accession ?? nodes[0]!.accession;

  return {
    slug,
    name: family.name,
    root,
    generations: Math.max(...nodes.map((node) => node.generation)) + 1,
    nodes,
    edges,
    spine: buildSpine(nodes),
    sankey: buildSankey(nodes),
    propagation: buildPropagation(nodes),
    transfers: edges.filter((edge) => edge.type === 'TRANSFERRED_FROM'),
    stats: {
      projects: nodes.length,
      genes: new Set(nodes.flatMap((node) => getGenomeGenes(node.accession).map((g) => g.gene.id)))
        .size,
      mutations: listMutations().length,
      agents: listAgents().length,
      hybrids: nodes.filter((node) => node.parents.length > 1).length,
      transfers: edges.filter((edge) => edge.type === 'TRANSFERRED_FROM').length,
      upstreamProposals: edges.filter((edge) => edge.type === 'PROPOSED_TO').length,
    },
  };
}

/* ==========================================================================
   Presentation vocabulary shared by every CodeTree view
   ========================================================================== */

export const LAYOUTS = [
  {
    id: 'tidy',
    label: 'Tidy tree',
    detail: 'Generations as rows. Best for reading descent at a glance.',
    suits: 'Small families',
  },
  {
    id: 'radial',
    label: 'Radial',
    detail: 'Root at the centre, generations as rings. Best for deep lineages.',
    suits: 'Deep single-root lineages',
  },
  {
    id: 'force',
    label: 'Force DAG',
    detail: 'Physical layout that lets hybrids and lateral transfer find room.',
    suits: 'Interconnected families',
  },
  {
    id: 'sankey',
    label: 'Capability flow',
    detail: 'Where capabilities went, weighted by how much of each project they are.',
    suits: 'Answering "what moved?"',
  },
  {
    id: 'arcs',
    label: 'Propagation arcs',
    detail: 'Every mutation offer in chronological order, with its outcome.',
    suits: 'Reading the record over time',
  },
  {
    id: 'list',
    label: 'Nested list',
    detail: 'The same graph as text. Fully keyboard and screen-reader navigable.',
    suits: 'Non-visual reading',
  },
] as const;

export type LayoutId = (typeof LAYOUTS)[number]['id'];

/** Four semantic zoom levels, in the spirit of a genome browser's detail tiers. */
export const ZOOM_LEVELS = [
  { id: 'family', label: 'Family', detail: 'Names and generations only.' },
  { id: 'projects', label: 'Projects', detail: 'Adds composition bars and gene counts.' },
  { id: 'genes', label: 'Genes', detail: 'Adds the capabilities each project carries.' },
  { id: 'mutations', label: 'Mutations', detail: 'Adds authored and adopted mutation counts.' },
] as const;

export type ZoomLevel = (typeof ZOOM_LEVELS)[number]['id'];

export const OUTCOME_META: Record<
  PropagationEvent['outcome'],
  { label: string; state: LineageState }
> = {
  adopted: { label: 'Adopted', state: 'verified' },
  proposed: { label: 'Awaiting decision', state: 'proposed' },
  rejected: { label: 'Declined', state: 'rejected' },
  quarantined: { label: 'Quarantined', state: 'quarantined' },
};

export const DESCENT_TYPES = DESCENT;
export const UPSTREAM_TYPES = UPSTREAM;
export { LINEAGE_STATE_META, MUTATION_STATE_META };
