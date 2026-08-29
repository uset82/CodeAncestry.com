import type { MetadataRoute } from 'next';
import { DOCS_NAV } from '@/lib/docs/nav';
import { listAgents, listGenes, listGenomes, listMutations } from '@/lib/registry';
import { listFamilies } from '@/lib/registry/tree';
import { absoluteUrl } from '@/lib/seo/metadata';
import { demo } from '@/lib/site';

/**
 * Indexable surfaces. `/design` stays off the map — it is an internal
 * specimen page, not a public record. Accession URLs keep the colon; that is
 * legal in a sitemap even though Windows will not prerender them as files.
 */

const STATIC: { path: string; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']; priority: number }[] =
  [
    { path: '/', changeFrequency: 'weekly', priority: 1 },
    { path: '/explore', changeFrequency: 'weekly', priority: 0.9 },
    { path: '/lineage', changeFrequency: 'weekly', priority: 0.8 },
    { path: '/blast', changeFrequency: 'monthly', priority: 0.7 },
    { path: demo.compare, changeFrequency: 'monthly', priority: 0.6 },
    { path: '/privacy', changeFrequency: 'yearly', priority: 0.2 },
    { path: '/terms', changeFrequency: 'yearly', priority: 0.2 },
  ];

export default function sitemap(): MetadataRoute.Sitemap {
  const docs = DOCS_NAV.flatMap((group) =>
    group.items.map((item) => ({
      url: absoluteUrl(item.href),
      changeFrequency: 'monthly' as const,
      priority: item.href === '/docs' ? 0.8 : 0.6,
    })),
  );

  const families = listFamilies().map((family) => ({
    url: absoluteUrl(`/family/${family.slug}`),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  const genomes = listGenomes().map((genome) => ({
    url: absoluteUrl(`/project/${genome.id}`),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  const genes = listGenes().map((gene) => ({
    url: absoluteUrl(`/gene/${gene.id}`),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  const mutations = listMutations().map((mutation) => ({
    url: absoluteUrl(`/mutation/${mutation.id}`),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  const agents = listAgents().map((agent) => ({
    url: absoluteUrl(`/agent/${agent.id}`),
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }));

  const entries = [
    ...STATIC.map((entry) => ({
      url: absoluteUrl(entry.path),
      changeFrequency: entry.changeFrequency,
      priority: entry.priority,
    })),
    ...docs,
    ...families,
    ...genomes,
    ...genes,
    ...mutations,
    ...agents,
  ];

  return [...new Map(entries.map((entry) => [entry.url, entry])).values()];
}
