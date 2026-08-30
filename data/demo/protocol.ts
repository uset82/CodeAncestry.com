import { site } from '@/lib/site';
import { DEMO_KIND, type DemoHonesty, type DemoMeta } from './kind';

/**
 * Homepage 16 — protocol index. Points at pages that already exist.
 * Track length encodes how specified the object is, not importance.
 * Do not invent a /protocol route.
 */

export type ProtocolGroup = 'protocol' | 'research';

export type ProtocolStatus = 'LIVE' | 'WORKING' | 'OPEN';

export type ProtocolKind =
  | 'schema'
  | 'identity'
  | 'event'
  | 'evidence'
  | 'contract'
  | 'paper'
  | 'specimen'
  | 'open';

export type ProtocolLocus = {
  id: string;
  name: string;
  group: ProtocolGroup;
  kind: ProtocolKind;
  mark: string;
  /** 0–1. Live Zod + dedicated page is 1. Open questions stay short. */
  specified: number;
  status: ProtocolStatus;
  meaning: string;
  href: string;
};

export const protocolIndex = {
  meta: { kind: DEMO_KIND, label: 'CONCEPT' as DemoHonesty } satisfies DemoMeta,
  paperHref: '/research',
  protocolHref: '/docs',
  schemasHref: '/docs/schema',
  githubHref: site.github,
} as const;

export const PROTOCOL_LOCI: readonly ProtocolLocus[] = [
  {
    id: 'genome-schema',
    name: 'Genome schema',
    group: 'protocol',
    kind: 'schema',
    mark: '■',
    specified: 1,
    status: 'LIVE',
    meaning: 'Versioned composition of a project. genome.json, compiled from the live Zod module.',
    href: '/docs/formats#genome',
  },
  {
    id: 'gene-identity',
    name: 'Gene identity',
    group: 'protocol',
    kind: 'identity',
    mark: '●',
    specified: 1,
    status: 'LIVE',
    meaning: 'A capability keeps one accession when the files are rewritten. NCBI-style identifiers.',
    href: '/docs/accessions',
  },
  {
    id: 'mutation-schema',
    name: 'Mutation schema',
    group: 'protocol',
    kind: 'schema',
    mark: '■',
    specified: 1,
    status: 'LIVE',
    meaning: 'A typed change with evidence, a fitness vector, and a state machine that cannot skip.',
    href: '/docs/mutations',
  },
  {
    id: 'agent-identity',
    name: 'Agent identity',
    group: 'protocol',
    kind: 'identity',
    mark: '●',
    specified: 0.85,
    status: 'LIVE',
    meaning: 'Portable, consented manifest. Never weights or private reasoning. agent-dna.json.',
    href: '/docs/formats#agent',
  },
  {
    id: 'lineage-events',
    name: 'Lineage events',
    group: 'protocol',
    kind: 'event',
    mark: '◆',
    specified: 1,
    status: 'LIVE',
    meaning: 'Typed edges on a DAG: parent, offer, recombination. A mashup is not an error.',
    href: '/docs/edges',
  },
  {
    id: 'evidence-model',
    name: 'Evidence model',
    group: 'protocol',
    kind: 'evidence',
    mark: '○',
    specified: 1,
    status: 'LIVE',
    meaning: 'GO-style codes and tiers. Declared ancestry and inferred ancestry stay separate.',
    href: '/docs/evidence',
  },
  {
    id: 'compatibility',
    name: 'Compatibility',
    group: 'protocol',
    kind: 'contract',
    mark: '◇',
    specified: 0.55,
    status: 'WORKING',
    meaning: 'This layer sits on PROV, SLSA, in-toto, CycloneDX. It does not replace them.',
    href: '/docs/standards',
  },
  {
    id: 'signatures',
    name: 'Signatures',
    group: 'protocol',
    kind: 'contract',
    mark: '◇',
    specified: 0.55,
    status: 'WORKING',
    meaning: 'Attestations bind a record to how it was produced. The homepage does not fake a signer.',
    href: '/docs/standards',
  },
  {
    id: 'provenance',
    name: 'Provenance',
    group: 'protocol',
    kind: 'evidence',
    mark: '○',
    specified: 0.7,
    status: 'WORKING',
    meaning: 'Entities, activities, agents. Recording ancestors is not the contribution by itself.',
    href: '/docs/standards',
  },
  {
    id: 'concept-paper',
    name: 'Concept paper',
    group: 'research',
    kind: 'paper',
    mark: '◇',
    specified: 0.7,
    status: 'WORKING',
    meaning: 'Working paper v0.1. Not peer-reviewed. No experimental results.',
    href: '/research',
  },
  {
    id: 'experiments',
    name: 'Experiments',
    group: 'research',
    kind: 'open',
    mark: '?',
    specified: 0.35,
    status: 'OPEN',
    meaning: 'Nothing here has been measured against a live corpus. The open questions name the work.',
    href: '/research#questions',
  },
  {
    id: 'keylit-gen0',
    name: 'KEYLIT Gen-0',
    group: 'research',
    kind: 'specimen',
    mark: '●',
    specified: 0.9,
    status: 'LIVE',
    meaning: 'The seeded family that holds project time and gene time at once. A specimen, not a result.',
    href: '/research#specimen',
  },
  {
    id: 'evaluation',
    name: 'Evaluation',
    group: 'research',
    kind: 'open',
    mark: '?',
    specified: 0.35,
    status: 'OPEN',
    meaning: 'The limits section is the evaluation: what is fixture, and what does not exist yet.',
    href: '/research#limits',
  },
  {
    id: 'future-work',
    name: 'Future work',
    group: 'research',
    kind: 'open',
    mark: '?',
    specified: 0.35,
    status: 'OPEN',
    meaning: 'Connect a repository. Propose genes. Offer one mutation. Decide in public.',
    href: '/research#questions',
  },
];

export const protocolLoci = (group: ProtocolGroup) =>
  PROTOCOL_LOCI.filter((locus) => locus.group === group);
