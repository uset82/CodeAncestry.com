'use client';

import { useMemo, useState } from 'react';
import { sankey, sankeyLinkHorizontal, sankeyJustify } from 'd3-sankey';
import type { FamilyTree } from '@/lib/registry/tree';

/**
 * Capability flow.
 *
 * A Sankey answers a different question from the tree: not "who descends from
 * whom" but "how much of what this project is came from there". Band thickness
 * is the summed weight of the genes that moved, so it is a claim about substance
 * rather than about commit counts.
 */

type SankeyNode = {
  id: string;
  name: string;
  generation: number;
  x0?: number;
  x1?: number;
  y0?: number;
  y1?: number;
};

type SankeyLink = {
  source: SankeyNode | string | number;
  target: SankeyNode | string | number;
  value: number;
  genes: string[];
  width?: number;
  y0?: number;
  y1?: number;
};

const WIDTH = 900;
const HEIGHT = 460;

export function SankeyView({ family }: { family: FamilyTree }) {
  const [active, setActive] = useState<number | null>(null);

  const graph = useMemo(() => {
    const nodes: SankeyNode[] = family.sankey.nodes.map((node) => ({ ...node }));
    const index = new Map(nodes.map((node, i) => [node.id, i]));

    const links: SankeyLink[] = family.sankey.links.flatMap((link) => {
      const source = index.get(link.source);
      const target = index.get(link.target);
      if (source === undefined || target === undefined) return [];
      return [{ source, target, value: link.value, genes: link.genes }];
    });

    // Only projects that gave or received capabilities belong in a flow diagram.
    const connected = new Set<number>();
    for (const link of links) {
      connected.add(link.source as number);
      connected.add(link.target as number);
    }

    const kept = nodes.filter((_, i) => connected.has(i));
    const remap = new Map(
      nodes.flatMap((node, i) => (connected.has(i) ? [[i, kept.indexOf(node)] as const] : [])),
    );

    const layout = sankey<SankeyNode, SankeyLink>()
      .nodeWidth(15)
      .nodePadding(22)
      .nodeAlign(sankeyJustify)
      .extent([
        [1, 12],
        [WIDTH - 1, HEIGHT - 12],
      ]);

    return layout({
      nodes: kept.map((node) => ({ ...node })),
      links: links.map((link) => ({
        ...link,
        source: remap.get(link.source as number)!,
        target: remap.get(link.target as number)!,
      })),
    });
  }, [family.sankey]);

  const total = graph.links.reduce((sum, link) => sum + link.value, 0);

  return (
    <div>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={`Capability flow between ${graph.nodes.length} projects in the ${family.name} family.`}
        className="border-line bg-panel block h-[clamp(360px,52vh,560px)] w-full rounded-xl border"
      >
        <g>
          {graph.links.map((link, i) => {
            const path = sankeyLinkHorizontal<SankeyNode, SankeyLink>()(link);
            const dimmed = active !== null && active !== i;
            return (
              <path
                key={i}
                d={path ?? undefined}
                fill="none"
                stroke="var(--color-cyan)"
                strokeOpacity={dimmed ? 0.06 : active === i ? 0.5 : 0.22}
                strokeWidth={Math.max(1.5, link.width ?? 1)}
                onPointerEnter={() => setActive(i)}
                onPointerLeave={() => setActive(null)}
                className="transition-[stroke-opacity] duration-200"
              >
                <title>{`${(link.source as SankeyNode).name} → ${
                  (link.target as SankeyNode).name
                }: ${link.genes.join(', ')}`}</title>
              </path>
            );
          })}
        </g>

        <g>
          {graph.nodes.map((node) => (
            <g key={node.id}>
              <rect
                x={node.x0}
                y={node.y0}
                width={(node.x1 ?? 0) - (node.x0 ?? 0)}
                height={Math.max(2, (node.y1 ?? 0) - (node.y0 ?? 0))}
                rx={2}
                fill={node.generation === 0 ? 'var(--color-acid)' : 'var(--color-cyan)'}
                opacity={0.75}
              />
              <text
                x={(node.x0 ?? 0) < WIDTH / 2 ? (node.x1 ?? 0) + 8 : (node.x0 ?? 0) - 8}
                y={((node.y0 ?? 0) + (node.y1 ?? 0)) / 2}
                textAnchor={(node.x0 ?? 0) < WIDTH / 2 ? 'start' : 'end'}
                dominantBaseline="central"
                fill="var(--color-text-soft)"
                fontSize={11.5}
              >
                {node.name}
              </text>
            </g>
          ))}
        </g>
      </svg>

      <div className="mt-5 grid gap-6 md:grid-cols-[1fr_auto]">
        <div>
          <h3 className="text-muted font-mono text-nano uppercase">
            {active === null ? 'Every flow in the family' : 'Selected flow'}
          </h3>

          {active === null ? (
            <p className="text-text-soft mt-2 text-[14.5px] leading-relaxed">
              {graph.links.length} capability transfers between {graph.nodes.length} projects. Hover
              a band to see which capabilities moved along it. Bands are weighted by how much of the
              receiving project the capability accounts for, not by lines of code.
            </p>
          ) : (
            <div className="mt-2">
              <p className="text-[15px]">
                <span className="text-cyan font-semibold">
                  {(graph.links[active]!.source as SankeyNode).name}
                </span>
                <span className="text-faint mx-2" aria-hidden="true">
                  →
                </span>
                <span className="text-text font-semibold">
                  {(graph.links[active]!.target as SankeyNode).name}
                </span>
              </p>
              <ul className="mt-2.5 flex flex-wrap gap-1.5">
                {graph.links[active]!.genes.map((gene) => (
                  <li
                    key={gene}
                    className="border-line bg-panel-2 text-text-soft rounded-sm border px-2 py-[3px] font-mono text-nano"
                  >
                    {gene}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <dl className="text-faint flex gap-6 font-mono text-nano uppercase md:flex-col md:gap-2">
          <div>
            <dt>Flows</dt>
            <dd className="text-text-soft mt-0.5 text-[13px] tabular-nums">{graph.links.length}</dd>
          </div>
          <div>
            <dt>Weight moved</dt>
            <dd className="text-text-soft mt-0.5 text-[13px] tabular-nums">{total.toFixed(2)}</dd>
          </div>
        </dl>
      </div>

      {/* Non-visual equivalent: the same flows as a table. */}
      <details className="border-line/60 mt-6 border-t pt-4">
        <summary className="text-muted hover:text-text cursor-pointer font-mono text-nano uppercase">
          Read the flows as a table
        </summary>
        <table className="mt-4 w-full border-collapse text-left">
          <thead>
            <tr className="text-faint font-mono text-nano uppercase">
              <th scope="col" className="border-line border-b pb-2 font-normal">
                From
              </th>
              <th scope="col" className="border-line border-b pb-2 font-normal">
                To
              </th>
              <th scope="col" className="border-line border-b pb-2 text-right font-normal">
                Weight
              </th>
              <th scope="col" className="border-line border-b pb-2 font-normal">
                Capabilities
              </th>
            </tr>
          </thead>
          <tbody>
            {graph.links.map((link, i) => (
              <tr key={i} className="border-line/50 border-b last:border-0">
                <th scope="row" className="text-text-soft py-2 pr-4 text-[13px] font-normal">
                  {(link.source as SankeyNode).name}
                </th>
                <td className="text-text-soft py-2 pr-4 text-[13px]">
                  {(link.target as SankeyNode).name}
                </td>
                <td className="text-muted py-2 pr-4 text-right font-mono text-[12px] tabular-nums">
                  {link.value.toFixed(2)}
                </td>
                <td className="text-faint py-2 text-[12.5px]">{link.genes.join(', ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
