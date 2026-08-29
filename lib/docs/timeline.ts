import { getGene, listGenomes } from '@/lib/registry';

/**
 * Dual timeline in the Human Genome Project tradition: project time (when
 * members of the family were born) next to gene time (when a capability
 * changed). They are not the same clock.
 */

export type TimelineEvent = {
  date: string;
  label: string;
  detail: string;
  href?: string;
};

export function getProjectTimeline(): TimelineEvent[] {
  return listGenomes()
    .slice()
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.generation - b.generation)
    .map((genome) => ({
      date: genome.createdAt,
      label: genome.name,
      detail: `Generation ${genome.generation}${genome.parents.length > 1 ? ' · hybrid' : ''}`,
      href: `/project/${genome.id}`,
    }));
}

export function getGeneTimeline(geneId = 'CAGENE:MIDI-SCHEDULING'): {
  geneName: string;
  geneId: string;
  events: TimelineEvent[];
} {
  const gene = getGene(geneId);
  if (!gene) throw new Error(`Seed gene ${geneId} is missing`);

  const events: TimelineEvent[] = gene.alleles
    .slice()
    .sort((a, b) => a.number - b.number)
    .map((allele) => ({
      date: allele.firstObservedAt,
      label: `${allele.label} · allele ${allele.number}`,
      detail: `${allele.version} · ${allele.language}${allele.producedBy ? ` · ${allele.producedBy}` : ''}`,
      href: `/gene/${gene.id}#allele-${allele.number}`,
    }));

  return { geneName: gene.name, geneId: gene.id, events };
}

export const OPEN_QUESTIONS = [
  {
    title: 'Where does a gene start and stop?',
    body: 'A capability is not a file. Drawing a semantic boundary that two maintainers would agree on is still a research problem. The registry records confidence in that boundary; it does not pretend the boundary is natural.',
  },
  {
    title: 'When are two implementations the same allele?',
    body: 'Ports, rewrites and language changes can implement the same capability. Homology without identity is the BLAST problem. Fingerprints help; they do not decide.',
  },
  {
    title: 'What is a fair coordinate system?',
    body: 'Software has no chromosome. Repository, semantic and temporal axes are three readings of the same genome. None of them is the genome.',
  },
  {
    title: 'How far can inference go without becoming a claim?',
    body: 'A model can propose a parent edge. Promoting that proposal to verified descent without a test or a human is how registries become fiction. The evidence threshold exists because this question is unsettled.',
  },
  {
    title: 'How does horizontal transfer stay legal?',
    body: 'Copying a capability between unrelated families is easy technically and often restricted legally. An unknown license is unknown, not reusable. Compatible-enough at scale is unsolved.',
  },
  {
    title: 'What may an agent remember?',
    body: 'The registry records what an agent did, asserted, tested and shared. It never owns model internals. The line between a public decision record and a private trace is a product decision, not a solved one.',
  },
  {
    title: 'Can fitness ever be one number?',
    body: 'No scientifically meaningful software equivalent of a universally stronger gene exists. Aggregates are policy views. The open question is how to keep those views from being mistaken for the record.',
  },
] as const;
