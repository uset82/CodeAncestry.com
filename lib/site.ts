import { AGENT, GENOME } from '@/data/keylit/ids';

export const site = {
  name: 'CodeAncestry',
  domain: 'codeancestry.com',
  url: 'https://codeancestry.com',
  tagline: 'Every machine has ancestors.',
  description:
    'A living genealogy for software, AI agents and robots. Trace what a project inherited, what it mutated, what it learned, and which descendant made the family smarter.',
  /* Reserved subdomains from the ecosystem map. Rendered in the footer so the
     shape of the platform is legible before the services exist. */
  subdomains: [
    { host: 'app.codeancestry.com', role: 'Main product' },
    { host: 'registry.codeancestry.com', role: 'Genes, genomes, lineage' },
    { host: 'api.codeancestry.com', role: 'Protocol and API' },
    { host: 'docs.codeancestry.com', role: 'Technical specification' },
    { host: 'research.codeancestry.com', role: 'Paper and experiments' },
    { host: 'lab.codeancestry.com', role: 'Experimental agent evolution' },
  ],
} as const;

/**
 * Canonical entry points into the seeded demo. Every marketing link goes
 * through here so a fixture rename never leaves a dead link behind.
 */
export const demo = {
  family: '/family/keylit',
  rootGenome: `/project/${GENOME.keylit}`,
  kidsGenome: `/project/${GENOME.kids}`,
  kidsEsGenome: `/project/${GENOME.kidsEs}`,
  heroGene: '/gene/CAGENE:MIDI-SCHEDULING',
  heroMutation: '/mutation/CAMUT:882',
  heroAgent: `/agent/${AGENT.kidsEs}`,
  compare: `/compare?a=${GENOME.keylit}&b=${GENOME.kidsEs}`,
} as const;

export const nav = [
  { href: '/explore', label: 'Explore' },
  { href: '/lineage', label: 'Lineage' },
  { href: demo.family, label: 'CodeTree' },
  { href: demo.rootGenome, label: 'Genome' },
  { href: '/blast', label: 'CodeBLAST' },
  { href: '/docs', label: 'Docs' },
  { href: '/research', label: 'Research' },
] as const;
