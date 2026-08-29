import { site } from '@/lib/site';
import { absoluteUrl } from './metadata';

export type JsonLd = Record<string, unknown>;

const ORG_ID = `${site.url}/#organization`;
const SITE_ID = `${site.url}/#website`;

/** Site-wide graph: the organisation, the website, and the seeded registry. */
export function websiteJsonLd(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': ORG_ID,
        name: site.name,
        url: site.url,
        description: site.description,
      },
      {
        '@type': 'WebSite',
        '@id': SITE_ID,
        name: site.name,
        url: site.url,
        description: site.description,
        publisher: { '@id': ORG_ID },
        inLanguage: 'en',
      },
      {
        '@type': 'Dataset',
        '@id': `${site.url}/#keylit`,
        name: 'KEYLIT family registry',
        description:
          'Seeded demonstration records for the KEYLIT software family: project genomes, capability genes, mutations and agent DNA. Not live repository data.',
        creator: { '@id': ORG_ID },
        isPartOf: { '@id': SITE_ID },
        license: 'https://creativecommons.org/licenses/by/4.0/',
      },
    ],
  };
}

export function genomeJsonLd(record: {
  accession: string;
  name: string;
  tagline: string;
  description: string;
}): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareSourceCode',
    name: record.name,
    identifier: record.accession,
    description: record.description,
    abstract: record.tagline,
    url: absoluteUrl(`/project/${record.accession}`),
    isPartOf: { '@id': SITE_ID },
  };
}

export function geneJsonLd(record: {
  accession: string;
  name: string;
  description: string;
}): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'DefinedTerm',
    name: record.name,
    identifier: record.accession,
    description: record.description,
    url: absoluteUrl(`/gene/${record.accession}`),
    inDefinedTermSet: absoluteUrl('/docs/ontology'),
    isPartOf: { '@id': SITE_ID },
  };
}

export function mutationJsonLd(record: {
  accession: string;
  shortId: string;
  title: string;
  summary: string;
}): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    name: `${record.shortId} ${record.title}`,
    identifier: record.accession,
    description: record.summary,
    url: absoluteUrl(`/mutation/${record.accession}`),
    isPartOf: { '@id': SITE_ID },
  };
}

export function agentJsonLd(record: {
  accession: string;
  displayName: string;
  identity: { providerLabel: string };
}): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: record.displayName,
    identifier: record.accession,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: record.identity.providerLabel,
    url: absoluteUrl(`/agent/${record.accession}`),
    isPartOf: { '@id': SITE_ID },
  };
}

export function paperJsonLd(paper: {
  title: string;
  runningTitle: string;
  version: string;
  dated: string;
  status: string;
  keywords: readonly string[];
}): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'ScholarlyArticle',
    name: paper.title,
    headline: `${paper.runningTitle}: ${paper.title}`,
    abstract:
      'A living lineage protocol for software genomes, agent inheritance, and evolutionary software ecosystems. Working concept; no experimental results.',
    datePublished: '2026-08-28',
    version: paper.version,
    keywords: paper.keywords.join(', '),
    url: absoluteUrl('/research'),
    creativeWorkStatus: paper.status,
    publisher: { '@id': ORG_ID },
    isPartOf: { '@id': SITE_ID },
    inLanguage: 'en',
  };
}

export function familyJsonLd(record: { slug: string; name: string; description: string }): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: `${record.name} CodeTree`,
    description: record.description,
    url: absoluteUrl(`/family/${record.slug}`),
    creator: { '@id': ORG_ID },
    isPartOf: { '@id': `${site.url}/#keylit` },
  };
}
