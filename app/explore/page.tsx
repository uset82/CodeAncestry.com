import type { Metadata } from 'next';
import { ExploreShell } from '@/components/registry/ExploreShell';
import { getExplorePayload, getOntologyTree } from '@/lib/registry/search';
import { pageMeta } from '@/lib/seo/metadata';

export const metadata: Metadata = pageMeta({
  title: 'Explore the registry',
  description:
    'Search project genomes, capability genes, mutations and agent DNA as separate record types, each with its own evidence and confidence.',
  path: '/explore',
});

export default function ExplorePage() {
  // The seeded registry is small enough to hand to the client whole, which keeps
  // every keystroke local. The same component shape survives a live API: this
  // becomes the first page of results and filtering moves back to the server.
  const payload = getExplorePayload();
  const ontology = getOntologyTree();

  return <ExploreShell payload={payload} ontology={ontology} />;
}
