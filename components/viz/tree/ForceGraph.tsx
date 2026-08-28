'use client';

import cytoscape, { type Core, type ElementDefinition } from 'cytoscape';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import type { FamilyTree, TreeNode, ZoomLevel } from '@/lib/registry/tree';
import { EDGE_TYPE_META } from '@/lib/schema/vocabulary';

/**
 * The force-directed DAG.
 *
 * A tidy tree has to pick one parent per node, which quietly hides the most
 * interesting relations in the family: the hybrid with two lineages, the
 * capability that crossed family lines, the descendant teaching its ancestor.
 * A physical layout lets all of them coexist and find their own room.
 *
 * Cytoscape is loaded only for this view, behind a dynamic import, so a reader
 * who never leaves the tidy tree never pays for it.
 */

const EDGE_COLOR: Record<string, string> = {
  DERIVED_FROM: '#6ea4d4',
  MUTATED_FROM: '#86ab68',
  RECOMBINED_FROM: '#a58ad2',
  TRANSFERRED_FROM: '#d3a244',
  ADOPTED_FROM: '#86ab68',
  PROPOSED_TO: '#a58ad2',
  REJECTED_FROM: '#dd6a4e',
};

const EDGE_LINE_STYLE: Record<string, 'solid' | 'dashed' | 'dotted' | 'double'> = {
  DERIVED_FROM: 'solid',
  MUTATED_FROM: 'solid',
  RECOMBINED_FROM: 'double',
  TRANSFERRED_FROM: 'dashed',
  ADOPTED_FROM: 'solid',
  PROPOSED_TO: 'dashed',
  REJECTED_FROM: 'dotted',
};

/** Semantic zoom for the force view: the same tiers, expressed as node labels. */
function labelFor(node: TreeNode, zoom: ZoomLevel) {
  switch (zoom) {
    case 'family':
      return node.name;
    case 'genes':
      return `${node.name}\nG${node.generation} · ${node.geneCount} genes · ${node.agents.length} ${
        node.agents.length === 1 ? 'agent' : 'agents'
      }`;
    case 'mutations':
      return `${node.name}\n${node.mutationsAuthored} authored · ${node.mutationsAdopted} adopted`;
    default:
      return `${node.name}\nG${node.generation} · ${node.geneCount} genes`;
  }
}

export function ForceGraph({
  family,
  zoom,
  selected,
  onSelect,
  animate,
}: {
  family: FamilyTree;
  zoom: ZoomLevel;
  selected: string | null;
  onSelect: (accession: string | null) => void;
  animate: boolean;
}) {
  const container = useRef<HTMLDivElement>(null);
  const core = useRef<Core | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const host = container.current;
    if (!host) return;

    const elements: ElementDefinition[] = [
      ...family.nodes.map((node) => ({
        data: {
          id: node.accession,
          label: node.name,
          generation: node.generation,
          genes: node.geneCount,
          hybrid: node.parents.length > 1,
        },
      })),
      ...family.edges.map((edge) => ({
        data: {
          id: edge.id,
          // Cytoscape arrows point source -> target; descent reads ancestor first.
          source: edge.upstream || edge.type === 'TRANSFERRED_FROM' ? edge.from : edge.to,
          target: edge.upstream || edge.type === 'TRANSFERRED_FROM' ? edge.to : edge.from,
          type: edge.type,
          label: edge.label,
        },
      })),
    ];

    const instance = cytoscape({
      container: host,
      elements,
      wheelSensitivity: 0.25,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': '#1f2117',
            'border-color': '#4d5240',
            'border-width': 1.5,
            shape: 'round-rectangle',
            width: 'label',
            height: 'label',
            padding: '11px',
            label: 'data(label)',
            color: '#ece9dc',
            'font-family': 'var(--font-sans), system-ui, sans-serif',
            'font-size': 12,
            'font-weight': 600,
            'line-height': 1.45,
            'text-wrap': 'wrap',
            'text-valign': 'center',
            'text-halign': 'center',
          },
        },
        {
          selector: 'node[generation = 0]',
          style: { 'border-color': '#86ab68', 'border-width': 2 },
        },
        {
          selector: 'node[?hybrid]',
          style: { 'border-color': '#a58ad2', 'border-style': 'double', 'border-width': 3 },
        },
        {
          selector: 'node:selected',
          style: { 'border-color': '#86ab68', 'border-width': 2.5, 'background-color': '#262920' },
        },
        {
          selector: 'edge',
          style: {
            width: 1.6,
            'curve-style': 'bezier',
            'target-arrow-shape': 'triangle',
            'arrow-scale': 0.85,
            opacity: 0.7,
          },
        },
        ...Object.entries(EDGE_COLOR).map(([type, color]) => ({
          selector: `edge[type = "${type}"]`,
          style: {
            'line-color': color,
            'target-arrow-color': color,
            'line-style': EDGE_LINE_STYLE[type] ?? 'solid',
          },
        })),
        {
          selector: 'edge[type = "REJECTED_FROM"]',
          style: { opacity: 0.4 },
        },
        {
          selector: 'edge[type = "ADOPTED_FROM"]',
          style: { width: 2.6, opacity: 0.95 },
        },
        {
          selector: '.faded',
          style: { opacity: 0.12, 'text-opacity': 0.2 },
        },
      ],
      layout: {
        name: 'cose',
        animate: animate ? 'end' : false,
        animationDuration: 600,
        randomize: false,
        // Without the label dimensions the simulation treats every project as a
        // point and packs them into a narrow column.
        nodeDimensionsIncludeLabels: true,
        // Laying out inside the container's own box keeps the result as wide as
        // the frame instead of tall and thin.
        boundingBox: { x1: 0, y1: 0, w: host.clientWidth || 900, h: host.clientHeight || 560 },
        nodeRepulsion: () => 36000,
        idealEdgeLength: () => 165,
        edgeElasticity: () => 45,
        gravity: 0.18,
        numIter: 2400,
        fit: true,
        padding: 44,
      } as cytoscape.LayoutOptions,
    });

    instance.on('tap', 'node', (event) => onSelect(event.target.id() as string));
    instance.on('tap', (event) => {
      if (event.target === instance) onSelect(null);
    });

    core.current = instance;
    setReady(true);

    return () => {
      instance.destroy();
      core.current = null;
    };
  }, [family, animate, onSelect]);

  // Relabelling in place keeps the resolved positions; rebuilding the graph on
  // every detail change would reshuffle the whole family.
  useEffect(() => {
    const instance = core.current;
    if (!instance) return;

    const byId = new Map(family.nodes.map((node) => [node.accession, node]));
    instance.nodes().forEach((element) => {
      const node = byId.get(element.id());
      if (node) element.data('label', labelFor(node, zoom));
    });
  }, [family.nodes, zoom, ready]);

  // Selection is owned by React; mirror it into the graph rather than letting
  // Cytoscape hold a second source of truth.
  useEffect(() => {
    const instance = core.current;
    if (!instance) return;

    instance.elements().removeClass('faded');
    instance.nodes().unselect();

    if (!selected) return;

    const node = instance.getElementById(selected);
    if (node.empty()) return;

    node.select();
    const neighbourhood = node.closedNeighborhood();
    instance.elements().difference(neighbourhood).addClass('faded');
  }, [selected]);

  return (
    <div>
      <div className="relative">
        <div
          ref={container}
          className="border-line bg-panel h-[clamp(420px,62vh,720px)] w-full rounded-xl border"
        />

        {!ready && (
          <p
            role="status"
            className="text-muted absolute inset-0 grid place-items-center font-mono text-nano uppercase"
          >
            Resolving layout…
          </p>
        )}

        <div className="absolute right-3 bottom-3 flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => core.current?.fit(undefined, 44)}
            className={cn(
              'border-line bg-panel-2/90 text-text-soft hover:border-line-strong hover:text-text',
              'rounded-md border px-2 py-1.5 font-mono text-nano uppercase transition-colors',
            )}
          >
            Fit
          </button>
          <button
            type="button"
            onClick={() => core.current?.zoom(core.current.zoom() * 0.8)}
            aria-label="Zoom out"
            className="border-line bg-panel-2/90 text-text-soft hover:border-line-strong grid size-8 place-items-center rounded-md border font-mono text-[12px] transition-colors"
          >
            <span aria-hidden="true">−</span>
          </button>
          <button
            type="button"
            onClick={() => core.current?.zoom(core.current.zoom() * 1.25)}
            aria-label="Zoom in"
            className="border-line bg-panel-2/90 text-text-soft hover:border-line-strong grid size-8 place-items-center rounded-md border font-mono text-[12px] transition-colors"
          >
            <span aria-hidden="true">+</span>
          </button>
        </div>
      </div>

      <p className="text-faint mt-2.5 text-[13px] leading-relaxed">
        A double violet border marks a hybrid with more than one parent, and{' '}
        {EDGE_TYPE_META.TRANSFERRED_FROM.label.toLowerCase()} is the one relation here that is not
        descent at all. Line styles are listed under the graph. Drag to rearrange; the nested list
        gives the same graph to a keyboard.
      </p>
    </div>
  );
}
