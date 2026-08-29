import type { Metadata } from 'next';
import { site } from '@/lib/site';

/**
 * Per-route metadata. Titles stay short; Open Graph and Twitter cards inherit
 * the same description and a canonical URL so a shared helix OG image still
 * names the record being shared.
 */

export function absoluteUrl(path: string): string {
  return new URL(path, `${site.url}/`).toString();
}

export function pageMeta({
  title,
  description,
  path,
  robots,
}: {
  title: string;
  description: string;
  path: string;
  robots?: Metadata['robots'];
}): Metadata {
  const url = absoluteUrl(path);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      siteName: site.name,
      title: `${title} · ${site.name}`,
      description,
      url,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} · ${site.name}`,
      description,
    },
    robots,
  };
}
