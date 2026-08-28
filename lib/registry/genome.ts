import {
  anchorUrl,
  evidenceCodesFor,
  getAgent,
  getAncestors,
  getCodePaintingView,
  getDescendants,
  getGene,
  getGenome,
  getGenomeGenes,
  getMutationsForGenome,
  listGenomes,
  tierFor,
  type CodePaintingView,
} from '@/lib/registry';
import { ontologyPath } from '@/lib/schema/gene';
import type { EvidenceCode, EvidenceTier, InheritanceMode } from '@/lib/schema/vocabulary';

/**
 * View models for the Project Genome Browser.
 *
 * The browser is a UCSC-style stack of tracks over one shared axis. The axis has
 * three coordinate modes, and rather than re-deriving geometry in the client on
 * every switch, every feature carries its position under each mode up front.
 *
 * A feature's position is `null` where the mode genuinely does not apply — a test
 * run has no place in a file tree, and a dependency has no capability. The UI
 * reports those as unplaced rather than inventing a coordinate for them, because
 * a browser that fakes positions teaches the reader something false about the
 * data.
 */

export const COORDINATE_MODES = ['temporal', 'repository', 'semantic'] as const;
export type CoordinateMode = (typeof COORDINATE_MODES)[number];

export const COORDINATE_META: Record<
  CoordinateMode,
  { label: string; axisLabel: string; description: string }
> = {
  temporal: {
    label: 'Temporal',
    axisLabel: 'Project history',
    description:
      'Commits and releases from first commit to current head. Every track has a position here.',
  },
  repository: {
    label: 'Repository',
    axisLabel: 'Source tree',
    description:
      'Where capabilities physically live, ordered by path. Tracks with no file of their own are listed as unplaced.',
  },
  semantic: {
    label: 'Semantic',
    axisLabel: 'Capability ontology',
    description:
      'Grouped by what the code does, not where it lives. Sibling capabilities sit together.',
  },
};

export const TRACK_KINDS = [
  'genes',
  'mutations',
  'fitness',
  'agents',
  'tests',
  'security',
  'dependencies',
  'license',
  'releases',
  'children',
] as const;

export type TrackKind = (typeof TRACK_KINDS)[number];

/** How a track's features are drawn. Bands span, markers are points. */
export type TrackRender = 'band' | 'marker' | 'area' | 'span';

export type Feature = {
  id: string;
  /** Short label drawn on the canvas when there is room. */
  label: string;
  /** Secondary label drawn only when zoom leaves room for it. */
  sublabel: string;
  /** Full sentence for the table, the tooltip and the screen reader. */
  detail: string;
  /** Position per coordinate mode, 0–1, or null where the mode does not apply. */
  pos: Record<CoordinateMode, number | null>;
  /** Width per coordinate mode, 0–1. Zero for point features. */
  span: Record<CoordinateMode, number>;
  /** Vertical share for area tracks, 0–1. */
  value?: number;
  /** Drives colour and glyph within a track. */
  variant: string;
  evidence: EvidenceCode[];
  tier: EvidenceTier;
  confidence: number | null;
  /** Set when this feature resolves to a record elsewhere in the registry. */
  href?: string;
  /** Set for features anchored in source. `url` is null for non-web providers. */
  anchor?: {
    repository: string;
    commit: string;
    path: string;
    symbols: string[];
    url: string | null;
  };
  /** Set for gene features, so the locus panel can trace origin. */
  gene?: string;
  /**
   * Generation-by-generation trace of how this feature reached the genome, root
   * first. One entry means it started here.
   */
  chain?: { accession: string; name: string; generation: number }[];
};

export type Track = {
  kind: TrackKind;
  label: string;
  description: string;
  render: TrackRender;
  /** Rows of stacked features, computed per mode to avoid overlap. */
  height: number;
  features: Feature[];
  /** Column headers for the table equivalent. */
  columns: string[];
};

export type AxisTick = { pos: number; label: string; major: boolean };

export type GenomeBrowserModel = {
  genome: {
    accession: string;
    project: string;
    name: string;
    slug: string;
    tagline: string;
    description: string;
    generation: number;
    visibility: string;
    createdAt: string;
    commit: string;
    repository: string;
    provider: string;
    defaultBranch: string;
    treeDigest: string;
    license: string;
    lineageAssurance: EvidenceTier;
  };
  stats: {
    generation: number;
    genes: number;
    parents: number;
    verifiedReleases: number;
    totalReleases: number;
    descendants: number;
    mutations: number;
    coverage: number | null;
  };
  parents: { accession: string; name: string; generation: number; relationship: string; contribution: number; bornFromCommit: string }[];
  children: { accession: string; name: string; generation: number; createdAt: string }[];
  /** Root-to-here chain, for the locus panel's origin trace. */
  lineage: { accession: string; name: string; generation: number }[];
  painting: CodePaintingView;
  tracks: Track[];
  axis: Record<CoordinateMode, AxisTick[]>;
  /** Distinct source paths, in axis order, for the repository mode legend. */
  paths: string[];
};

/* ==========================================================================
   Helpers
   ========================================================================== */

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/** Evenly space n items across the axis, centred in their slot. */
const slot = (index: number, count: number) => (count <= 1 ? 0.5 : (index + 0.5) / count);

const pct = (value: number) => `${Math.round(value * 100)}%`;

const noSpan: Record<CoordinateMode, number> = { temporal: 0, repository: 0, semantic: 0 };

/** A position that only exists on the temporal axis. */
const temporalOnly = (at: number): Record<CoordinateMode, number | null> => ({
  temporal: clamp01(at),
  repository: null,
  semantic: null,
});

function tierAndCodes(evidence: readonly string[]): { evidence: EvidenceCode[]; tier: EvidenceTier } {
  return { evidence: evidenceCodesFor(evidence), tier: tierFor(evidence) };
}

/* ==========================================================================
   The model
   ========================================================================== */

export function getGenomeBrowserModel(idOrSlug: string): GenomeBrowserModel | null {
  const genome = getGenome(idOrSlug);
  if (!genome) return null;

  const painting = getCodePaintingView(genome.id);
  if (!painting) return null;

  const resolved = getGenomeGenes(genome.id);
  const mutations = getMutationsForGenome(genome.id);
  const descendants = getDescendants(genome.id);
  const ancestors = getAncestors(genome.id);
  const all = listGenomes();

  /* ------------------------------------------------ repository axis: paths */
  const paths = [
    ...new Set(resolved.flatMap((entry) => entry.ref.anchors.map((anchor) => anchor.path))),
  ].sort();
  const pathIndex = new Map(paths.map((path, index) => [path, index]));

  /* ------------------------------------------- semantic axis: ontology order */
  const semanticOrder: string[] = resolved
    .slice()
    .sort((a, b) => {
      const byTerm = a.gene.ontology.term.localeCompare(b.gene.ontology.term);
      return byTerm !== 0 ? byTerm : a.gene.name.localeCompare(b.gene.name);
    })
    .map((entry) => entry.gene.id);
  const semanticIndex = new Map<string, number>(semanticOrder.map((id, index) => [id, index]));

  /* --------------------------------------------- temporal axis: date window */
  const dates = [
    genome.createdAt,
    ...genome.releases.map((release) => release.date),
    ...mutations.map((mutation) => mutation.proposedAt),
    ...descendants.map((child) => child.createdAt),
  ].sort();
  const first = dates[0] ?? genome.createdAt;
  const last = dates.at(-1) ?? genome.createdAt;
  const fromTime = Date.parse(first);
  const toTime = Date.parse(last);
  const dateToPos = (date: string) =>
    toTime === fromTime ? 0.5 : clamp01((Date.parse(date) - fromTime) / (toTime - fromTime));

  /**
   * The lineage entries that actually carry a gene, root first.
   *
   * This is the "Origin: KEYLIT Gen 0 → Kids Gen 1 → Kids ES Gen 2" trace: not
   * the whole ancestry, only the generations in which the capability was present,
   * which is the honest answer to "where did this come from".
   */
  const chainFor = (geneId: string) =>
    [...ancestors.slice().reverse(), genome]
      .filter((entry) => entry.genes.some((ref) => ref.gene === geneId))
      .map((entry) => ({
        accession: entry.id,
        name: entry.name,
        generation: entry.generation,
      }));

  /** Where a gene sits under each mode. */
  const genePos = (geneId: string, path: string | undefined) => ({
    temporal: null as number | null,
    repository: path !== undefined && pathIndex.has(path) ? slot(pathIndex.get(path)!, paths.length) : null,
    semantic: semanticIndex.has(geneId) ? slot(semanticIndex.get(geneId)!, semanticOrder.length) : null,
  });

  const tracks: Track[] = [];

  /* ------------------------------------------------------------ 1. genes */
  tracks.push({
    kind: 'genes',
    label: 'Capability genes',
    description:
      'One band per capability. Colour and hatch are the inheritance mode. Under the repository and semantic views a band fills its slot on the axis; under the temporal view it starts where the capability was first observed and its width is the share of the project it accounts for, which is a proportion rather than a duration.',
    render: 'band',
    height: 1,
    columns: ['Capability', 'Accession', 'Inheritance', 'Origin', 'Share', 'Confidence', 'Evidence', 'Path'],
    features: resolved.map((entry) => {
      const anchor = entry.ref.anchors[0];
      const origin = entry.ref.origin
        ? (all.find((candidate) => candidate.project === entry.ref.origin)?.name ?? null)
        : null;
      const { evidence, tier } = tierAndCodes(entry.ref.evidence);
      const position = genePos(entry.gene.id, anchor?.path);

      return {
        id: entry.gene.id,
        label: entry.gene.name,
        sublabel: pct(entry.ref.weight),
        detail: `${entry.gene.name} (${entry.gene.id}), ${entry.ref.inheritance}${
          origin ? ` from ${origin}` : ''
        }. ${pct(entry.ref.weight)} of the project, confidence ${entry.ref.confidence.toFixed(2)}.`,
        pos: {
          temporal: dateToPos(entry.allele.firstObservedAt),
          repository: position.repository,
          semantic: position.semantic,
        },
        span: {
          // Wide enough on every axis to read as a band rather than a tick.
          temporal: Math.max(0.03, entry.ref.weight),
          repository: paths.length > 0 ? 1 / paths.length : 0,
          semantic: semanticOrder.length > 0 ? 1 / semanticOrder.length : 0,
        },
        value: entry.ref.weight,
        variant: entry.ref.inheritance,
        evidence,
        tier,
        confidence: entry.ref.confidence,
        href: `/gene/${entry.gene.id}`,
        ...(anchor
          ? {
              anchor: {
                repository: anchor.repository,
                commit: anchor.commit,
                path: anchor.path,
                symbols: anchor.symbols,
                url: anchorUrl(anchor.repository, anchor.commit, anchor.path),
              },
            }
          : {}),
        gene: entry.gene.id,
        chain: chainFor(entry.gene.id),
      };
    }),
  });

  /* -------------------------------------------------------- 2. mutations */
  tracks.push({
    kind: 'mutations',
    label: 'Mutations',
    description:
      'Proposed changes to a capability. Marker shape follows the decision: adopted, declined, or still open.',
    render: 'marker',
    height: 1,
    columns: ['Mutation', 'Title', 'Capability', 'State', 'Proposed', 'Author', 'Confidence', 'Evidence'],
    features: mutations.map((mutation) => {
      const gene = getGene(mutation.gene);
      const anchor = resolved.find((entry) => entry.gene.id === mutation.gene)?.ref.anchors[0];
      const { evidence, tier } = tierAndCodes(mutation.evidence.map((entry) => entry.id));
      const position = genePos(mutation.gene, anchor?.path);
      const decided = mutation.adoptedBy.includes(genome.id)
        ? 'adopted'
        : mutation.rejectedBy.includes(genome.id)
          ? 'declined'
          : mutation.originGenome === genome.id
            ? 'authored'
            : 'offered';

      return {
        id: mutation.id,
        label: mutation.shortId,
        sublabel: decided,
        detail: `${mutation.shortId} (${mutation.id}): ${mutation.title}. ${decided} — ${
          gene?.name ?? mutation.gene
        }, proposed ${mutation.proposedAt} by ${
          getAgent(mutation.proposedBy)?.displayName ?? mutation.proposedBy
        }.`,
        pos: {
          temporal: dateToPos(mutation.proposedAt),
          repository: position.repository,
          semantic: position.semantic,
        },
        span: noSpan,
        variant: decided,
        evidence,
        tier,
        confidence: mutation.confidence,
        href: `/mutation/${mutation.id}`,
        ...(anchor
          ? {
              anchor: {
                repository: anchor.repository,
                commit: anchor.commit,
                path: anchor.path,
                symbols: anchor.symbols,
                url: anchorUrl(anchor.repository, anchor.commit, anchor.path),
              },
            }
          : {}),
        gene: mutation.gene,
        chain: chainFor(mutation.gene),
      };
    }),
  });

  /* ---------------------------------------------------------- 3. fitness */
  tracks.push({
    kind: 'fitness',
    label: 'Fitness deltas',
    description:
      'What each mutation measurably changed. Direction is encoded by the bar, not only by colour.',
    render: 'marker',
    height: 1,
    columns: ['Metric', 'Before', 'After', 'Change', 'Direction', 'Mutation'],
    features: mutations.flatMap((mutation) => {
      const anchor = resolved.find((entry) => entry.gene.id === mutation.gene)?.ref.anchors[0];
      const position = genePos(mutation.gene, anchor?.path);
      const { evidence, tier } = tierAndCodes(mutation.evidence.map((entry) => entry.id));

      return mutation.fitness.deltas.map((delta, index) => ({
        id: `${mutation.id}:${delta.metric}`,
        label: delta.change,
        sublabel: delta.metric,
        detail: `${delta.metric}: ${delta.before} → ${delta.after} (${delta.change}, ${delta.direction}) from ${mutation.shortId}.`,
        pos: {
          temporal: clamp01(dateToPos(mutation.proposedAt) + index * 0.004),
          repository: position.repository,
          semantic: position.semantic,
        },
        span: noSpan,
        variant: delta.direction,
        evidence,
        tier,
        confidence: mutation.confidence,
        href: `/mutation/${mutation.id}`,
        gene: mutation.gene,
      }));
    }),
  });

  /* ----------------------------------------------------- 4. agent activity */
  tracks.push({
    kind: 'agents',
    label: 'Agent activity',
    description: 'Who touched this genome and what they did. Human review is marked as such.',
    render: 'marker',
    height: 1,
    columns: ['Agent', 'Action', 'Summary', 'Position'],
    features: genome.agentActivity.map((activity, index) => {
      const agent = getAgent(activity.agent);
      const shortId = agent ? `A${agent.id.split(':').at(-1)}` : activity.agent;

      return {
        id: `${activity.agent}:${index}`,
        label: activity.action === 'review' ? 'Human' : shortId,
        sublabel: activity.action,
        detail: `${agent?.displayName ?? activity.agent} (${
          agent?.identity.provider ?? 'unknown provider'
        }) — ${activity.action}: ${activity.summary}`,
        pos: temporalOnly(activity.at),
        span: noSpan,
        variant: activity.action,
        evidence: [],
        tier: 'inferred' as EvidenceTier,
        confidence: null,
        href: `/agent/${activity.agent}`,
      };
    }),
  });

  /* ------------------------------------------------------------- 5. tests */
  const coverage = genome.tests.at(-1)?.coverage ?? null;
  tracks.push({
    kind: 'tests',
    label: 'Tests',
    description: 'Coverage over project history, with the pass rate at each run.',
    render: 'area',
    height: 1,
    columns: ['Run', 'Passed', 'Total', 'Pass rate', 'Coverage'],
    features: genome.tests.map((run, index) => ({
      id: `test:${index}`,
      label: pct(run.coverage),
      sublabel: `${run.passed}/${run.total}`,
      detail: `Run ${index + 1}: ${run.passed} of ${run.total} passing (${pct(
        run.total === 0 ? 0 : run.passed / run.total,
      )}), coverage ${pct(run.coverage)}.`,
      pos: temporalOnly(run.at),
      span: noSpan,
      value: run.coverage,
      variant: run.passed === run.total ? 'green' : 'amber',
      evidence: ['TST'] as EvidenceCode[],
      tier: 'verified' as EvidenceTier,
      confidence: run.total === 0 ? null : run.passed / run.total,
    })),
  });

  /* ---------------------------------------------------------- 6. security */
  tracks.push({
    kind: 'security',
    label: 'Security',
    description:
      'Advisories raised against this genome. A resolved finding spans from raised to fixed.',
    render: 'span',
    height: 1,
    columns: ['Advisory', 'Severity', 'Status', 'Summary', 'Raised', 'Resolved'],
    features: genome.security.map((finding) => {
      const width =
        finding.resolvedAt === undefined ? 0.02 : Math.max(0.012, finding.resolvedAt - finding.raisedAt);

      return {
        id: finding.id,
        label: `${finding.status === 'resolved' ? '⚠→✓' : '⚠'} ${finding.id}`,
        sublabel: finding.severity,
        detail: `${finding.id} (${finding.severity}, ${finding.status}): ${finding.summary}${
          finding.resolvedAt === undefined ? '' : ' Resolved later in the same history.'
        }`,
        pos: temporalOnly(finding.raisedAt),
        span: { temporal: width, repository: 0, semantic: 0 },
        variant: finding.status === 'resolved' ? 'resolved' : finding.severity,
        evidence: ['SEC'] as EvidenceCode[],
        tier: 'verified' as EvidenceTier,
        confidence: null,
      };
    }),
  });

  /* ------------------------------------------------------ 7. dependencies */
  tracks.push({
    kind: 'dependencies',
    label: 'Dependencies',
    description:
      'Third-party packages and when each entered the tree. Advisory state is shown where one exists.',
    render: 'marker',
    height: 1,
    columns: ['Package', 'Version', 'Ecosystem', 'License', 'Advisory', 'Introduced'],
    features: genome.dependencies.map((dependency) => ({
      id: `dep:${dependency.name}`,
      label: dependency.name,
      sublabel: dependency.version,
      detail: `${dependency.name}@${dependency.version} (${dependency.ecosystem}, ${
        dependency.license
      })${
        dependency.advisory === 'none'
          ? ''
          : `, advisory ${dependency.advisory}`
      }.`,
      pos: temporalOnly(dependency.introducedAt),
      span: noSpan,
      variant: dependency.advisory,
      evidence: ['DEP'] as EvidenceCode[],
      tier: 'reviewed' as EvidenceTier,
      confidence: null,
    })),
  });

  /* ----------------------------------------------------------- 8. license */
  tracks.push({
    kind: 'license',
    label: 'License',
    description:
      'The SPDX expression in force across the genome, plus the licence of every dependency that differs from it.',
    render: 'span',
    height: 1,
    columns: ['SPDX', 'Scope', 'Applies to'],
    features: [
      {
        id: 'license:project',
        label: genome.licenses.spdxExpression,
        sublabel: 'whole genome',
        detail: `${genome.licenses.spdxExpression} applies to the whole genome.`,
        pos: { temporal: 0, repository: 0, semantic: 0 },
        span: { temporal: 1, repository: 1, semantic: 1 },
        variant: 'project',
        evidence: ['UPR'] as EvidenceCode[],
        tier: 'verified' as EvidenceTier,
        confidence: null,
      },
      ...[
        ...new Set(
          genome.dependencies
            .filter((dependency) => dependency.license !== genome.licenses.spdxExpression)
            .map((dependency) => dependency.license),
        ),
      ].map((spdx, index, list) => {
        const carriers = genome.dependencies.filter((dependency) => dependency.license === spdx);
        return {
          id: `license:${spdx}`,
          label: spdx,
          sublabel: `${carriers.length} dep${carriers.length === 1 ? '' : 's'}`,
          detail: `${spdx} arrives with ${carriers.length} ${
            carriers.length === 1 ? 'dependency' : 'dependencies'
          }: ${carriers.map((dependency) => dependency.name).join(', ')}.`,
          pos: temporalOnly(slot(index, list.length)),
          span: { temporal: 0.08, repository: 0, semantic: 0 },
          variant: 'dependency',
          evidence: ['DEP'] as EvidenceCode[],
          tier: 'reviewed' as EvidenceTier,
          confidence: null,
        };
      }),
    ],
  });

  /* ---------------------------------------------------------- 9. releases */
  tracks.push({
    kind: 'releases',
    label: 'Releases',
    description: 'Tagged versions. A verified release carries a provenance attestation.',
    render: 'marker',
    height: 1,
    columns: ['Version', 'Date', 'Commit', 'Verified'],
    features: genome.releases.map((release) => ({
      id: `release:${release.version}`,
      label: release.version,
      sublabel: release.date,
      detail: `${release.version} released ${release.date} at commit:${release.commit.slice(0, 10)}${
        release.verified ? ', provenance verified' : ', provenance unverified'
      }.`,
      pos: temporalOnly(dateToPos(release.date)),
      span: noSpan,
      variant: release.verified ? 'verified' : 'unverified',
      evidence: release.verified ? (['STA'] as EvidenceCode[]) : [],
      tier: release.verified ? ('verified' as EvidenceTier) : ('inferred' as EvidenceTier),
      confidence: null,
    })),
  });

  /* ---------------------------------------------------------- 10. children */
  tracks.push({
    kind: 'children',
    label: 'Children',
    description:
      'Projects that descend from this genome, placed at the date they were founded.',
    render: 'marker',
    height: 1,
    columns: ['Project', 'Accession', 'Generation', 'Founded'],
    features: descendants
      .filter((child) => child.parents.some((parent) => parent.genome === genome.id))
      .map((child) => ({
        id: child.id,
        label: child.name,
        sublabel: `G${child.generation}`,
        detail: `${child.name} (${child.id}), generation ${child.generation}, founded ${child.createdAt}. ${child.tagline}`,
        pos: temporalOnly(dateToPos(child.createdAt)),
        span: noSpan,
        variant: child.parents.length > 1 ? 'hybrid' : 'direct',
        evidence: [],
        tier: child.lineageAssurance,
        confidence: null,
        href: `/project/${child.id}`,
      })),
  });

  /* -------------------------------------------------------------- the axes */
  const axis: Record<CoordinateMode, AxisTick[]> = {
    temporal: buildTemporalTicks(genome.releases, dateToPos, first, last),
    repository: paths.map((path, index) => ({
      pos: slot(index, paths.length),
      label: shortPath(path),
      major: index === 0 || path.split('/')[1] !== paths[index - 1]?.split('/')[1],
    })),
    semantic: semanticOrder.map((geneId, index) => {
      const gene = getGene(geneId);
      const trail = gene ? ontologyPath(gene.ontology.term) : [];
      return {
        pos: slot(index, semanticOrder.length),
        label: gene?.name ?? geneId,
        major: index === 0 || trail[0]?.term !== previousRoot(semanticOrder, index),
      };
    }),
  };

  return {
    genome: {
      accession: genome.id,
      project: genome.project,
      name: genome.name,
      slug: genome.slug,
      tagline: genome.tagline,
      description: genome.description,
      generation: genome.generation,
      visibility: genome.visibility,
      createdAt: genome.createdAt,
      commit: genome.source.commit,
      repository: genome.source.repository,
      provider: genome.source.provider,
      defaultBranch: genome.source.defaultBranch,
      treeDigest: genome.source.treeDigest,
      license: genome.licenses.spdxExpression,
      lineageAssurance: genome.lineageAssurance,
    },
    stats: {
      generation: genome.generation,
      genes: genome.genes.length,
      parents: genome.parents.length,
      verifiedReleases: genome.releases.filter((release) => release.verified).length,
      totalReleases: genome.releases.length,
      descendants: descendants.length,
      mutations: mutations.length,
      coverage,
    },
    parents: genome.parents.flatMap((parent) => {
      const record = getGenome(parent.genome);
      return record
        ? [
            {
              accession: record.id,
              name: record.name,
              generation: record.generation,
              relationship: parent.relationship,
              contribution: parent.contribution,
              bornFromCommit: parent.bornFromCommit,
            },
          ]
        : [];
    }),
    children: descendants
      .filter((child) => child.parents.some((parent) => parent.genome === genome.id))
      .map((child) => ({
        accession: child.id,
        name: child.name,
        generation: child.generation,
        createdAt: child.createdAt,
      })),
    lineage: [...ancestors.slice().reverse(), genome].map((entry) => ({
      accession: entry.id,
      name: entry.name,
      generation: entry.generation,
    })),
    painting,
    tracks,
    axis,
    paths,
  };
}

/** The root ontology segment of the gene before `index`, for tick grouping. */
function previousRoot(order: string[], index: number): string | null {
  const previous = order[index - 1];
  if (previous === undefined) return null;
  const gene = getGene(previous);
  return gene ? (gene.ontology.term.split('.')[0] ?? null) : null;
}

/** `src/midi-scheduling/index.ts` reads better as `midi-scheduling/index.ts`. */
function shortPath(path: string): string {
  const parts = path.split('/');
  return parts.length > 2 ? parts.slice(1).join('/') : path;
}

/**
 * Releases make the best temporal ticks: they are the dates a reader recognises.
 * The endpoints are added so the axis always states its own range.
 */
function buildTemporalTicks(
  releases: { version: string; date: string }[],
  dateToPos: (date: string) => number,
  first: string,
  last: string,
): AxisTick[] {
  const ticks: AxisTick[] = releases.map((release) => ({
    pos: dateToPos(release.date),
    label: release.version,
    major: true,
  }));

  ticks.unshift({ pos: 0, label: first, major: false });
  ticks.push({ pos: 1, label: last, major: false });

  return ticks.sort((a, b) => a.pos - b.pos);
}

/** Tracks that can be positioned under a given mode, and how many cannot. */
export function placeable(track: Track, mode: CoordinateMode) {
  const placed = track.features.filter((feature) => feature.pos[mode] !== null);
  return { placed, unplaced: track.features.length - placed.length };
}

export const INHERITANCE_VARIANTS: InheritanceMode[] = [
  'native',
  'inherited',
  'mutated',
  'local',
  'transferred',
];
