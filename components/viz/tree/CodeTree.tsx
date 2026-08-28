'use client';

import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';
import { cn } from '@/lib/cn';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';
import { LAYOUTS, ZOOM_LEVELS, type FamilyTree, type LayoutId, type ZoomLevel } from '@/lib/registry/tree';
import { EDGE_LEGEND } from './edgeStyle';
import { ArcsView } from './ArcsView';
import { NestedList } from './NestedList';
import { NodeInspector } from './NodeInspector';
import { SankeyView } from './SankeyView';
import { TreeCanvas } from './TreeCanvas';

/* Cytoscape is ~400 KB. It loads only if a reader actually asks for the force
   layout, and never during server rendering. */
const ForceGraph = dynamic(() => import('./ForceGraph').then((m) => m.ForceGraph), {
  ssr: false,
  loading: () => (
    <div
      role="status"
      className="border-line bg-panel text-muted grid h-[clamp(420px,62vh,720px)] place-items-center rounded-xl border font-mono text-nano uppercase"
    >
      Loading the graph engine…
    </div>
  ),
});

export function CodeTree({
  family,
  pulseEdgeId,
}: {
  family: FamilyTree;
  /** Edge to animate a propagation pulse along, when motion is allowed. */
  pulseEdgeId?: string;
}) {
  const [layout, setLayout] = useState<LayoutId>('tidy');
  const [zoom, setZoom] = useState<ZoomLevel>('projects');
  const [selected, setSelected] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);

  const reducedMotion = useReducedMotion();
  // Reduced motion wins outright; the pause control only governs the rest.
  const animate = !reducedMotion && !paused;

  const node = useMemo(
    () => family.nodes.find((entry) => entry.accession === selected) ?? null,
    [family.nodes, selected],
  );

  const active = LAYOUTS.find((entry) => entry.id === layout)!;
  const spatial = layout === 'tidy' || layout === 'radial' || layout === 'force';

  return (
    <div>
      <div className="border-line flex flex-wrap items-end justify-between gap-4 border-b pb-3">
        <div role="tablist" aria-label="Layout" className="flex flex-wrap gap-1">
          {LAYOUTS.map((entry) => (
            <button
              key={entry.id}
              type="button"
              role="tab"
              aria-selected={layout === entry.id}
              onClick={() => setLayout(entry.id)}
              title={entry.detail}
              className={cn(
                '-mb-[13px] border-b-2 px-3 py-2 text-[14px] transition-colors',
                layout === entry.id
                  ? 'border-acid text-text'
                  : 'text-muted hover:text-text hover:border-line-strong border-transparent',
              )}
            >
              {entry.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {spatial && (
            <label className="text-faint flex items-center gap-2 font-mono text-nano uppercase">
              Detail
              <select
                value={zoom}
                onChange={(event) => setZoom(event.target.value as ZoomLevel)}
                className="border-line bg-panel-2 text-text-soft rounded-sm border px-2 py-1 font-mono text-[11px]"
              >
                {ZOOM_LEVELS.map((level) => (
                  <option key={level.id} value={level.id}>
                    {level.label}
                  </option>
                ))}
              </select>
            </label>
          )}

          {/* Only the layouts that actually move offer a pause; a stop button on a
              still diagram is just a lie about what it does. */}
          {spatial && (
            <button
              type="button"
              onClick={() => setPaused((prev) => !prev)}
              aria-pressed={paused}
              disabled={reducedMotion}
              title={
                reducedMotion
                  ? 'Your system asks for reduced motion, so nothing here animates.'
                  : 'Stop the propagation pulse and the force simulation.'
              }
              className={cn(
                'rounded-md border px-2.5 py-1.5 font-mono text-nano uppercase transition-colors',
                reducedMotion
                  ? 'border-line text-faint cursor-not-allowed'
                  : paused
                    ? 'border-amber/40 bg-amber/10 text-amber'
                    : 'border-line bg-panel-2 text-text-soft hover:border-line-strong',
              )}
            >
              {reducedMotion ? 'Motion off' : paused ? 'Paused' : 'Pause motion'}
            </button>
          )}
        </div>
      </div>

      <p className="text-faint mt-3 text-[13px]">
        {active.detail} <span className="text-faint/70">Suits: {active.suits.toLowerCase()}.</span>
      </p>

      <div
        className={cn(
          'mt-6 grid gap-6',
          spatial || layout === 'list' ? 'xl:grid-cols-[1fr_312px]' : '',
        )}
      >
        <div className="min-w-0">
          {/* The graph itself is an instrument: a lit plate recessed into the
              page. The nested list is prose, so it stays on paper. */}
          {layout === 'list' ? (
            <NestedList family={family} selected={selected} onSelect={setSelected} />
          ) : (
            <div className="instrument recessed border-line border p-1">
              {(layout === 'tidy' || layout === 'radial') && (
                // Keyed so switching layouts starts from a fitted viewport
                // rather than leaving the reader panned into empty space.
                <TreeCanvas
                  key={layout}
                  family={family}
                  mode={layout}
                  zoom={zoom}
                  selected={selected}
                  onSelect={setSelected}
                  pulseEdgeId={pulseEdgeId}
                  animate={animate}
                />
              )}

              {layout === 'force' && (
                <ForceGraph
                  family={family}
                  zoom={zoom}
                  selected={selected}
                  onSelect={setSelected}
                  animate={animate}
                />
              )}

              {layout === 'sankey' && <SankeyView family={family} />}
              {layout === 'arcs' && <ArcsView family={family} />}
            </div>
          )}

          {spatial && <EdgeLegend />}
        </div>

        {(spatial || layout === 'list') && (
          <NodeInspector
            family={family}
            node={node}
            onSelect={setSelected}
            className="xl:sticky xl:top-24 xl:self-start"
          />
        )}
      </div>
    </div>
  );
}

function EdgeLegend() {
  return (
    <details className="border-line/60 mt-5 border-t pt-4">
      <summary className="text-muted hover:text-text cursor-pointer font-mono text-nano uppercase">
        What the lines mean
      </summary>
      <dl className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2">
        {EDGE_LEGEND.map((entry) => (
          <div key={entry.type} className="flex items-baseline gap-3">
            <dt className="text-text-soft shrink-0 text-[13px] font-semibold">{entry.label}</dt>
            <dd className="text-faint text-[12.5px] leading-relaxed">{entry.detail}</dd>
          </div>
        ))}
      </dl>
      <p className="text-faint mt-4 text-[12.5px] leading-relaxed">
        Arcs that bow away from the tree run against descent: a capability crossing family lines, or
        a descendant offering something back to an ancestor. Nothing on an arc has been adopted
        unless the line is solid and heavy.
      </p>
    </details>
  );
}
