/**
 * Documentation information architecture.
 *
 * The pages behind these links are compiled from `lib/schema` and the KEYLIT
 * fixtures — not from a frozen Markdown dump. If a vocabulary entry or a Zod
 * field changes, the specification changes with it.
 */

export type DocsNavItem = {
  href: string;
  label: string;
  detail: string;
};

export type DocsNavGroup = {
  heading: string;
  items: readonly DocsNavItem[];
};

export const DOCS_NAV: readonly DocsNavGroup[] = [
  {
    heading: 'Protocol',
    items: [
      {
        href: '/docs',
        label: 'Overview',
        detail: 'What the lineage layer is, and what it is not',
      },
      {
        href: '/docs/ontology',
        label: 'Ontology',
        detail: 'Capability terms, GO-style, live from the schema',
      },
      {
        href: '/docs/accessions',
        label: 'Accessions',
        detail: 'Stable identifiers in the NCBI tradition',
      },
      {
        href: '/docs/edges',
        label: 'Edges',
        detail: 'Typed lineage relations on a DAG, not a tree',
      },
      {
        href: '/docs/evidence',
        label: 'Evidence',
        detail: 'Codes, tiers, and the threshold control',
      },
      {
        href: '/docs/mutations',
        label: 'Mutations',
        detail: 'State machine, propagation, trust ladder',
      },
    ],
  },
  {
    heading: 'Reference',
    items: [
      {
        href: '/docs/schema',
        label: 'Live schemas',
        detail: 'JSON Schema Draft 2020-12 from Zod',
      },
      {
        href: '/docs/formats',
        label: 'File formats',
        detail: 'genome.json, gene.json, mutation.cavcf',
      },
      {
        href: '/docs/standards',
        label: 'Standards',
        detail: 'PROV, SLSA, in-toto, CycloneDX, SPDX, MCP',
      },
    ],
  },
  {
    heading: 'Practice',
    items: [
      {
        href: '/docs/language',
        label: 'Language and ethics',
        detail: 'What the metaphor may and may not say',
      },
      {
        href: '/research',
        label: 'Research',
        detail: 'Working paper v0.1',
      },
    ],
  },
] as const;

export function docsNavItem(href: string): DocsNavItem | null {
  for (const group of DOCS_NAV) {
    const match = group.items.find((item) => item.href === href);
    if (match) return match;
  }
  return null;
}
