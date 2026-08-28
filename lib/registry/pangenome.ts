import { listGenes, listGenomes, listMutations, tierFor } from '@/lib/registry';
import type { EvidenceTier, ExpressionState, InheritanceMode } from '@/lib/schema/vocabulary';

/**
 * The family pangenome: every project against every capability.
 *
 * Borrowed wholesale from bacterial pangenomics, where the useful split is not
 * "which genes exist" but which are **core** (in every member), **shell** (in
 * several) and **cloud** (in one). That distinction is what turns a presence
 * grid into a claim about the family: core genes are its identity, cloud genes
 * are where members are actually experimenting.
 *
 * The heat is mutation activity rather than presence, because presence alone is
 * a nearly-full grid and says little. A cell is hot when that project has done
 * something to that capability — authored a change to it, adopted one, or
 * refused one.
 */

export type Frequency = 'core' | 'shell' | 'cloud';

export type PangenomeCell = {
  present: boolean;
  allele: { version: string; number: number } | null;
  inheritance: InheritanceMode | null;
  expression: ExpressionState | null;
  /** Share of that project the capability accounts for, 0–1. */
  weight: number;
  tier: EvidenceTier | null;
  /** Mutations on this gene that originated in this project. */
  originated: number;
  adopted: number;
  rejected: number;
  /** Offered and not yet decided — the open questions in the family. */
  pending: number;
  /** originated + adopted + rejected. Drives the heat. */
  activity: number;
  /** Activity scaled against the busiest cell in the matrix, 0–1. */
  heat: number;
};

export type PangenomeRow = {
  gene: { accession: string; name: string; term: string };
  frequency: Frequency;
  carriers: number;
  /** Total mutations recorded against this capability, family-wide. */
  mutations: number;
  cells: PangenomeCell[];
  /** Row activity, for sorting the busiest capabilities to the top. */
  activity: number;
};

export type PangenomeColumn = {
  accession: string;
  name: string;
  /** Short label for a cramped column header. */
  shortName: string;
  generation: number;
  genes: number;
  activity: number;
};

export type Pangenome = {
  columns: PangenomeColumn[];
  rows: PangenomeRow[];
  counts: Record<Frequency, number>;
  /** The busiest single cell, so a legend can state what full heat means. */
  peak: number;
  totals: { cells: number; present: number; mutations: number; pending: number };
};

const FREQUENCY_META: Record<Frequency, { label: string; detail: string }> = {
  core: {
    label: 'Core',
    detail: 'Carried by every member. These define what the family is.',
  },
  shell: {
    label: 'Shell',
    detail: 'Carried by several members, not all. Where branches specialise.',
  },
  cloud: {
    label: 'Cloud',
    detail: 'Carried by one member. Either a new idea or a dead end.',
  },
};

export { FREQUENCY_META };

/** "KEYLIT Kids ES" -> "Kids ES". The family name is the same in every column. */
function shorten(name: string, family: string): string {
  const stripped = name.startsWith(`${family} `) ? name.slice(family.length + 1) : name;
  return stripped === name && name !== family ? name : stripped || family;
}

export function getPangenomeMatrix(): Pangenome {
  const genomes = listGenomes()
    .slice()
    .sort((a, b) => a.generation - b.generation || a.name.localeCompare(b.name));
  const genes = listGenes();
  const mutations = listMutations();

  /* The root's name is the family name, and every descendant is prefixed with
     it. Stripping the prefix is what makes the column headers legible. */
  const family = genomes.find((genome) => genome.generation === 0)?.name ?? '';

  /* One pass over mutations, bucketed by gene so cells are a lookup rather than
     a scan per cell. */
  const byGene = new Map<string, typeof mutations>();
  for (const mutation of mutations) {
    const bucket = byGene.get(mutation.gene);
    if (bucket) bucket.push(mutation);
    else byGene.set(mutation.gene, [mutation]);
  }

  const rows: PangenomeRow[] = genes.map((gene) => {
    const geneMutations = byGene.get(gene.id) ?? [];

    const cells: PangenomeCell[] = genomes.map((genome) => {
      const ref = genome.genes.find((entry) => entry.gene === gene.id);
      const allele = ref ? gene.alleles.find((entry) => entry.id === ref.allele) : undefined;

      let originated = 0;
      let adopted = 0;
      let rejected = 0;
      let pending = 0;

      for (const mutation of geneMutations) {
        if (mutation.originGenome === genome.id) originated += 1;
        if (mutation.adoptedBy.includes(genome.id)) adopted += 1;
        if (mutation.rejectedBy.includes(genome.id)) rejected += 1;
        if (
          mutation.offeredTo.includes(genome.id) &&
          !mutation.adoptedBy.includes(genome.id) &&
          !mutation.rejectedBy.includes(genome.id)
        ) {
          pending += 1;
        }
      }

      return {
        present: Boolean(ref),
        allele: allele ? { version: allele.version, number: allele.number } : null,
        inheritance: ref?.inheritance ?? null,
        expression: ref?.expression ?? null,
        weight: ref?.weight ?? 0,
        tier: ref ? tierFor(ref.evidence) : null,
        originated,
        adopted,
        rejected,
        pending,
        activity: originated + adopted + rejected,
        /* Filled once the matrix maximum is known. */
        heat: 0,
      };
    });

    const carriers = cells.filter((cell) => cell.present).length;

    return {
      gene: { accession: gene.id, name: gene.name, term: gene.ontology.term },
      frequency:
        carriers === genomes.length ? 'core' : carriers === 1 ? 'cloud' : 'shell',
      carriers,
      mutations: geneMutations.length,
      cells,
      activity: cells.reduce((sum, cell) => sum + cell.activity, 0),
    };
  });

  const peak = Math.max(1, ...rows.flatMap((row) => row.cells.map((cell) => cell.activity)));
  for (const row of rows) {
    for (const cell of row.cells) cell.heat = cell.activity / peak;
  }

  /* Busiest capabilities first, then the widely-held ones: a reader scanning the
     matrix is looking for where the family is moving. */
  rows.sort(
    (left, right) =>
      right.activity - left.activity ||
      right.carriers - left.carriers ||
      left.gene.name.localeCompare(right.gene.name),
  );

  const counts: Record<Frequency, number> = { core: 0, shell: 0, cloud: 0 };
  for (const row of rows) counts[row.frequency] += 1;

  const columns: PangenomeColumn[] = genomes.map((genome, index) => ({
    accession: genome.id,
    name: genome.name,
    shortName: shorten(genome.name, family),
    generation: genome.generation,
    genes: genome.genes.length,
    activity: rows.reduce((sum, row) => sum + (row.cells[index]?.activity ?? 0), 0),
  }));

  return {
    columns,
    rows,
    counts,
    peak,
    totals: {
      cells: rows.length * columns.length,
      present: rows.reduce((sum, row) => sum + row.carriers, 0),
      mutations: mutations.length,
      pending: rows.reduce(
        (sum, row) => sum + row.cells.reduce((inner, cell) => inner + cell.pending, 0),
        0,
      ),
    },
  };
}
