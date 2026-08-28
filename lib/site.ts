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

export const nav = [
  { href: '/explore', label: 'Explore' },
  { href: '/family/keylit', label: 'CodeTree' },
  { href: '/project/CAGENOME:01JKEYLIT7H2', label: 'Genome' },
  { href: '/blast', label: 'CodeBLAST' },
  { href: '/docs', label: 'Docs' },
  { href: '/research', label: 'Research' },
] as const;
