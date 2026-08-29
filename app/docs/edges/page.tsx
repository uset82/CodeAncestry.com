import type { Metadata } from 'next';
import { DocsArticle } from '@/components/docs/DocsShell';
import { Mermaid } from '@/components/docs/Mermaid';
import { SpecTable } from '@/components/docs/SpecTable';
import { CodeBlock, DocSection } from '@/components/registry/RegistryShell';
import { LINEAGE_GRAPH_DIAGRAM } from '@/lib/docs/diagrams';
import { getEdgeExample, pretty } from '@/lib/docs/examples';
import { listEdges } from '@/lib/registry';
import { EDGE_TYPE_META, EDGE_TYPES, type EdgeType } from '@/lib/schema/vocabulary';
import { pageMeta } from '@/lib/seo/metadata';

export const metadata: Metadata = pageMeta({
  title: 'Lineage edges',
  description:
    'Typed lineage relations on a directed acyclic graph: derived, recombined, mutated, transferred, proposed, adopted, rejected.',
  path: '/docs/edges',
});

export default function EdgesPage() {
  const edges = listEdges();
  const counts = Object.fromEntries(
    EDGE_TYPES.map((type) => [type, edges.filter((edge) => edge.type === type).length]),
  ) as Record<EdgeType, number>;

  return (
    <DocsArticle
      eyebrow="Documentation · Protocol"
      title="Typed lineage edges"
      lede="Hybrids have more than one parent, so the structure is a directed acyclic graph, not a family tree. Every edge that matters carries evidence."
    >
      <DocSection heading="Why a graph">
        <p>
          A child declares what it inherited rather than silently copying it. A hybrid names every
          parent. A rejected offer stays on the graph so the refusal is a fact, not an absence.
        </p>
        <Mermaid
          chart={LINEAGE_GRAPH_DIAGRAM}
          caption="A slice of the KEYLIT family: descent, recombination, and a proposal travelling upstream."
        />
      </DocSection>

      <DocSection heading="Edge types">
        <p>
          Stroke style is a second encoding beside the type name, so a greyscale print still
          distinguishes a proposal from a descent. Colour is never the only channel.
        </p>
        <SpecTable
          caption="Lineage edge types, verbs, stroke styles and seeded counts"
          columns={[
            { key: 'type', label: 'Type', mono: true },
            { key: 'verb', label: 'Verb' },
            { key: 'stroke', label: 'Stroke' },
            { key: 'count', label: 'In seed' },
          ]}
          rows={EDGE_TYPES.map((type) => {
            const meta = EDGE_TYPE_META[type];
            return {
              type,
              verb: meta.verb,
              stroke: meta.stroke,
              count: String(counts[type]),
            };
          })}
        />
      </DocSection>

      <DocSection heading="An edge is a record">
        <p>
          The seeded family currently holds {edges.length} edges. A typical descent looks like
          this — field names taken from <code>lineageEdgeSchema</code>, values taken from the
          fixtures.
        </p>
        <CodeBlock>{pretty(getEdgeExample())}</CodeBlock>
      </DocSection>
    </DocsArticle>
  );
}
