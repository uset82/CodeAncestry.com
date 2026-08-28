'use client';

import { useMemo, useState } from 'react';
import { cn } from '@/lib/cn';
import type { FamilyTree } from '@/lib/registry/tree';
import { CodeTree } from '@/components/viz/tree/CodeTree';

/**
 * The Lineage Explorer.
 *
 * Research report 11 calls this "the signature application screen" and gives a
 * three-pane wireframe: filters, family graph, inspector, with a timeline
 * across the bottom.
 *
 * This composes rather than reimplements. `CodeTree` already owns the graph,
 * its six layouts, selection and the node inspector; the Explorer adds the
 * filter rail and the time scrubber around it, and narrows the family it hands
 * down. Filtering happens here so every layout inside CodeTree — tidy, radial,
 * force, Sankey, arcs, list — reacts to the same controls.
 */

type Props = {
  family: FamilyTree;
  pulseEdgeId?: string;
};

/** Years spanned by the family, used to lay the timeline out. */
function yearBounds(family: FamilyTree) {
  const years = family.nodes.map((node) => new Date(node.createdAt).getFullYear());
  const min = Math.min(...years);
  const max = Math.max(...years);
  return { min, max: max === min ? min + 1 : max };
}

function FilterGroup({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-line border-t py-5 first:border-t-0 first:pt-0">
      <h3 className="text-muted label mb-3">{heading}</h3>
      {children}
    </div>
  );
}

export function LineageExplorer({ family, pulseEdgeId }: Props) {
  const bounds = useMemo(() => yearBounds(family), [family]);

  const [maxGeneration, setMaxGeneration] = useState(family.generations);
  const [year, setYear] = useState(bounds.max);
  const [genes, setGenes] = useState<Set<string>>(new Set());
  const [assurance, setAssurance] = useState<'all' | 'verified'>('all');

  /* Every capability that actually travels an edge in this family. The Sankey
     model already carries gene names per link, so the facet is derived from
     real inheritance rather than a hand-kept list. */
  const allGenes = useMemo(() => {
    const names = new Set<string>();
    for (const link of family.sankey.links) for (const gene of link.genes) names.add(gene);
    return [...names].sort();
  }, [family]);

  /* Which projects carry a selected capability, either end of the link. */
  const carriers = useMemo(() => {
    if (genes.size === 0) return null;
    const ids = new Set<string>();
    for (const link of family.sankey.links) {
      if (link.genes.some((gene) => genes.has(gene))) {
        ids.add(link.source);
        ids.add(link.target);
      }
    }
    return ids;
  }, [family.sankey.links, genes]);

  const filtered = useMemo<FamilyTree>(() => {
    const keep = new Set(
      family.nodes
        .filter((node) => {
          if (node.accession === family.root) return true; // never orphan the root
          if (node.generation > maxGeneration) return false;
          if (new Date(node.createdAt).getFullYear() > year) return false;
          if (assurance === 'verified' && node.lineageAssurance !== 'verified') return false;
          if (carriers && !carriers.has(node.accession)) return false;
          return true;
        })
        .map((node) => node.accession),
    );

    const nodes = family.nodes.filter((node) => keep.has(node.accession));
    const edges = family.edges.filter((edge) => keep.has(edge.from) && keep.has(edge.to));

    return {
      ...family,
      nodes,
      edges,
      spine: family.spine
        .filter((entry) => keep.has(entry.id))
        .map((entry) => ({
          ...entry,
          parent: entry.parent && keep.has(entry.parent) ? entry.parent : null,
          secondaryParents: entry.secondaryParents.filter((id) => keep.has(id)),
        })),
      transfers: family.transfers.filter((edge) => keep.has(edge.from) && keep.has(edge.to)),
      propagation: family.propagation,
      stats: { ...family.stats, projects: nodes.length },
    };
  }, [family, maxGeneration, year, assurance, carriers]);

  const hidden = family.nodes.length - filtered.nodes.length;

  return (
    <div className="shell-wide py-8 md:py-10">
      <header className="border-line flex flex-wrap items-end justify-between gap-4 border-b pb-5">
        <div>
          <p className="text-acid label">Lineage Explorer</p>
          <h1 className="text-headline mt-2">{family.name} family</h1>
        </div>
        <p className="text-muted max-w-[44ch] text-[14.5px] leading-relaxed">
          Filters narrow the graph, the inspector explains one node, and the timeline replays the
          family as it actually grew.
        </p>
      </header>

      <div className="mt-6 grid gap-6 xl:grid-cols-[15rem_minmax(0,1fr)]">
        {/* ------------------------------------------------------- filters */}
        <aside aria-label="Filters" className="xl:sticky xl:top-24 xl:self-start">
          <FilterGroup heading="Generation">
            <label htmlFor="lx-generation" className="sr-only">
              Maximum generation
            </label>
            <input
              id="lx-generation"
              type="range"
              min={0}
              max={family.generations}
              value={maxGeneration}
              onChange={(event) => setMaxGeneration(Number(event.target.value))}
              className="accent-acid h-11 w-full cursor-pointer"
            />
            <p className="text-faint mt-1 flex justify-between font-mono text-[11px]" data-numeric>
              <span>0</span>
              <span className="text-text">≤ {maxGeneration}</span>
              <span>{family.generations}</span>
            </p>
          </FilterGroup>

          <FilterGroup heading="Evidence">
            <div role="radiogroup" aria-label="Lineage assurance" className="flex flex-col gap-1">
              {(
                [
                  { value: 'all', label: 'All descent claims' },
                  { value: 'verified', label: 'Verified only' },
                ] as const
              ).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={assurance === option.value}
                  onClick={() => setAssurance(option.value)}
                  className={cn(
                    'flex h-11 items-center gap-2.5 rounded-md px-3 text-left text-[13.5px] transition-colors',
                    assurance === option.value
                      ? 'bg-panel-2 text-text'
                      : 'text-muted hover:bg-hover hover:text-text',
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      'grid size-4 shrink-0 place-items-center rounded-full border',
                      assurance === option.value ? 'border-acid' : 'border-line-strong',
                    )}
                  >
                    {assurance === option.value && (
                      <span className="bg-acid size-2 rounded-full" />
                    )}
                  </span>
                  {option.label}
                </button>
              ))}
            </div>
          </FilterGroup>

          {allGenes.length > 0 && (
            <FilterGroup heading="Capabilities in family">
              <ul className="flex flex-wrap gap-1.5">
                {allGenes.map((gene) => {
                  const on = genes.has(gene);
                  return (
                    <li key={gene}>
                      <button
                        type="button"
                        aria-pressed={on}
                        onClick={() =>
                          setGenes((prev) => {
                            const next = new Set(prev);
                            if (next.has(gene)) next.delete(gene);
                            else next.add(gene);
                            return next;
                          })
                        }
                        className={cn(
                          'rounded-full border px-2.5 py-1 font-mono text-[11px] transition-colors',
                          on
                            ? 'border-acid text-acid bg-acid/10'
                            : 'border-line text-muted hover:border-line-strong hover:text-text',
                        )}
                      >
                        {gene}
                      </button>
                    </li>
                  );
                })}
              </ul>
              <p className="text-faint mt-2.5 text-[12px] leading-relaxed">
                Narrows the graph to the projects that inherited or transferred the selected
                capabilities. Nothing selected shows the whole family.
              </p>
            </FilterGroup>
          )}

          <FilterGroup heading="Showing">
            <dl className="flex flex-col gap-1.5 text-[13px]">
              <div className="flex justify-between">
                <dt className="text-muted">Projects</dt>
                <dd data-numeric className="font-mono">
                  {filtered.nodes.length}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Relations</dt>
                <dd data-numeric className="font-mono">
                  {filtered.edges.length}
                </dd>
              </div>
              {hidden > 0 && (
                <div className="flex justify-between">
                  <dt className="text-amber">Filtered out</dt>
                  <dd data-numeric className="text-amber font-mono">
                    {hidden}
                  </dd>
                </div>
              )}
            </dl>
          </FilterGroup>
        </aside>

        {/* --------------------------------------- graph, and its inspector */}
        <div className="min-w-0">
          <CodeTree family={filtered} pulseEdgeId={pulseEdgeId} />

          {/* ------------------------------------------------- the timeline */}
          <section aria-label="Timeline" className="border-line mt-6 border-t pt-5">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="text-muted label">Timeline</h2>
              <p className="text-faint text-[12.5px]">
                Replays the family as it grew. Projects born after the selected year are hidden.
              </p>
            </div>

            <label htmlFor="lx-year" className="sr-only">
              Show the family as it stood in this year
            </label>
            <input
              id="lx-year"
              type="range"
              min={bounds.min}
              max={bounds.max}
              value={year}
              onChange={(event) => setYear(Number(event.target.value))}
              className="accent-acid mt-3 h-11 w-full cursor-pointer"
            />

            <ol className="text-faint mt-1 flex justify-between font-mono text-[11px]" data-numeric>
              {Array.from({ length: bounds.max - bounds.min + 1 }, (_, i) => bounds.min + i).map(
                (tick) => (
                  <li key={tick} className={cn(tick === year && 'text-acid')}>
                    {tick}
                  </li>
                ),
              )}
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}
