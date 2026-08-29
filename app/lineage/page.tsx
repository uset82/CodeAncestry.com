import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LineageExplorer } from '@/components/registry/LineageExplorer';
import { getFamilyTree } from '@/lib/registry/tree';
import { pageMeta } from '@/lib/seo/metadata';

export const metadata: Metadata = pageMeta({
  title: 'Lineage Explorer',
  description:
    'Filter, inspect and replay a software family: descent, hybrids, capability transfer and upstream mutation proposals on one navigable graph.',
  path: '/lineage',
});

/** The hero mutation's upstream offer — the edge the graph animates. */
const PULSE_EDGE_ID = 'e-kidses-keylit-m882';

export default function LineagePage() {
  const family = getFamilyTree('keylit');
  if (!family) notFound();

  return <LineageExplorer family={family} pulseEdgeId={PULSE_EDGE_ID} />;
}
