import { DEMO_KIND, type DemoMeta } from './kind';
import { GENOME } from '@/data/keylit/ids';

/**
 * The origin sketch Claude specified — not the full seeded KEYLIT graph.
 * Quechua is part of the question and is not a seeded genome. Live records
 * stay on `/family/keylit`. Do not load the registry tree on the homepage.
 */

export type OriginNode = {
  id: string;
  name: string;
  generation: number;
  parent: string | null;
  role: string;
  href?: string;
  seeded: boolean;
};

export const ORIGIN_NODES: readonly OriginNode[] = [
  {
    id: 'keylit',
    name: 'KEYLIT',
    generation: 0,
    parent: null,
    role: 'Generation 0. The project that asked what happens when one codebase becomes many.',
    href: '/family/keylit',
    seeded: true,
  },
  {
    id: 'kids',
    name: 'Kids',
    generation: 1,
    parent: 'keylit',
    role: 'A children’s version. Still connected. Free to evolve.',
    href: `/project/${GENOME.kids}`,
    seeded: true,
  },
  {
    id: 'spanish',
    name: 'Spanish',
    generation: 2,
    parent: 'kids',
    role: 'A different-language descendant. Seeded as KEYLIT Kids ES.',
    href: `/project/${GENOME.kidsEs}`,
    seeded: true,
  },
  {
    id: 'quechua',
    name: 'Quechua',
    generation: 2,
    parent: 'kids',
    role: 'Asked in the origin question. Not a seeded genome — the registry does not invent it.',
    seeded: false,
  },
  {
    id: 'accessibility',
    name: 'Accessibility',
    generation: 2,
    parent: 'kids',
    role: 'An accessibility version. In the seeded family this genome sits as KEYLIT Accessibility.',
    href: `/project/${GENOME.accessible}`,
    seeded: true,
  },
  {
    id: 'studio',
    name: 'Studio',
    generation: 1,
    parent: 'keylit',
    role: 'Rebuilt as a studio. Same ancestry, different job.',
    href: `/project/${GENOME.studio}`,
    seeded: true,
  },
  {
    id: 'classroom',
    name: 'Classroom',
    generation: 1,
    parent: 'keylit',
    role: 'A classroom version. Descendants stay named, not forked into silence.',
    href: `/project/${GENOME.classroom}`,
    seeded: true,
  },
];

export const keylitOrigin = {
  meta: { kind: DEMO_KIND, label: 'CONCEPT' } satisfies DemoMeta,
  id: 'DEMO:ORIGIN-KEYLIT',
  familyHref: '/family/keylit',
  nodes: ORIGIN_NODES,
} as const;

export function originChildren(parent: string | null) {
  return ORIGIN_NODES.filter((node) => node.parent === parent);
}
