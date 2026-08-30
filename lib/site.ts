import { AGENT, GENOME } from '@/data/keylit/ids';

export const site = {
  name: 'CodeAncestry',
  domain: 'codeancestry.com',
  url: 'https://codeancestry.com',
  tagline: 'Every machine has ancestors.',
  description:
    'A genealogy and provenance layer for software, AI agents, and machines. Git tracks code. CodeAncestry tracks evolution.',
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
 * Canonical entry points into the seeded KEYLIT demo. Homepage narrative
 * fixtures live in `data/demo/` and must not reuse these accessions.
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

export type NavLink = {
  href: string;
  label: string;
};

export type NavItem = NavLink & {
  menu?: readonly NavLink[];
};

/**
 * Claude’s primary IA. Trace stays out of the header until section 13 exists
 * as `#trace` (Phase 9), then retargets `/trace` when that route exists.
 * Connect Repository is the alpha waitlist — not a fake OAuth.
 */
export const exploreMenu = [
  { href: '/explore', label: 'Projects' },
  { href: '/explore', label: 'Genes' },
  { href: '/explore', label: 'Mutations' },
  { href: '/explore', label: 'Agents' },
  { href: '/blast', label: 'CodeBLAST' },
] as const satisfies readonly NavLink[];

export const researchMenu = [
  { href: '/docs', label: 'Protocol' },
  { href: '/research', label: 'Paper' },
  { href: '/docs/schema', label: 'Schemas' },
  { href: '/research', label: 'Experiments' },
  { href: '/docs', label: 'Docs' },
] as const satisfies readonly NavLink[];

export const nav: readonly NavItem[] = [
  { href: '/explore', label: 'Explore', menu: exploreMenu },
  { href: '/lineage', label: 'Lineage' },
  { href: '/#trace', label: 'Trace' },
  { href: '/explore', label: 'Genome' },
  { href: '/explore', label: 'Agents' },
  { href: '/research', label: 'Research', menu: researchMenu },
];

export const connectCta = {
  href: '/#join',
  label: 'Connect Repository',
  hint: 'Alpha',
} as const;
