'use client';

import { useMemo, useState, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import {
  AXIS_IDS,
  axisFamily,
  axisLineageKinds,
  demoAccession,
  LINEAGE_KIND_META,
  type LineageKind,
} from '@/data/demo';
import type { FamilyTree } from '@/lib/registry/tree';
import { edgeStyle } from './edgeStyle';
import { tidyLayout, NODE_HEIGHT, NODE_WIDTH } from './layout';

/**
 * Homepage CodeTree. AXIS family, tidy layout only. Reuses FamilyTree geometry
 * without loading KEYLIT. No rAF — the helix scroll path stays idle.
 */

const DEFAULT_COLLAPSED = new Set<string>([AXIS_IDS.field]);

const pruneFamily = (family: FamilyTree, collapsed: Set<string>): FamilyTree => {
  const hidden = new Set<string>();
  const hideFrom = (id: string) => {
    const node = family.nodes.find((entry) => entry.accession === id);
    if (!node) return;
    for (const child of node.children) {
      hidden.add(child);
      hideFrom(child);
    }
  };
  for (const id of collapsed) hideFrom(id);

  const nodes = family.nodes.filter((node) => !hidden.has(node.accession));
  const visible = new Set(nodes.map((node) => node.accession));
  return {
    ...family,
    nodes,
    edges: family.edges.filter((edge) => visible.has(edge.from) && visible.has(edge.to)),
    spine: family.spine.filter((entry) => visible.has(entry.id)),
  };
};

export function AxisCodeTree({
  defaultSelected = AXIS_IDS.core,
}: {
  defaultSelected?: string;
}) {
  const [selected, setSelected] = useState<string | null>(defaultSelected);
  const [compare, setCompare] = useState<string[]>([]);
  const [collapsed, setCollapsed] = useState<Set<string>>(DEFAULT_COLLAPSED);
  const [view, setView] = useState({ scale: 1, x: 0, y: 0 });
  const [comparing, setComparing] = useState(false);

  const visible = useMemo(() => pruneFamily(axisFamily, collapsed), [collapsed]);
  const geometry = useMemo(() => tidyLayout(visible), [visible]);
  const node = visible.nodes.find((entry) => entry.accession === selected) ?? null;
  const kindOf = (id: string): LineageKind => axisLineageKinds[id] ?? 'CHILD';

  const { minX, minY, maxX, maxY } = geometry.bounds;
  const width = Math.max(1, maxX - minX);
  const height = Math.max(1, maxY - minY);

  const handleSelect = (id: string) => {
    if (comparing) {
      setCompare((prev) => {
        if (prev.includes(id)) return prev.filter((item) => item !== id);
        if (prev.length >= 2) return [prev[1]!, id];
        return [...prev, id];
      });
      return;
    }
    setSelected(id);
  };

  const handleToggleCollapse = (id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleFollowMutation = () => {
    setComparing(false);
    setSelected(AXIS_IDS.mutant);
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.delete(AXIS_IDS.mutant);
      return next;
    });
  };

  const handleResetView = () => {
    setView({ scale: 1, x: 0, y: 0 });
  };

  const handleZoomIn = () => {
    setView((prev) => ({ ...prev, scale: Math.min(2.4, prev.scale * 1.2) }));
  };

  const handleZoomOut = () => {
    setView((prev) => ({ ...prev, scale: Math.max(0.5, prev.scale / 1.2) }));
  };

  const handlePan = (dx: number, dy: number) => {
    setView((prev) => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
  };

  const handleKeyDown = (event: KeyboardEvent<SVGSVGElement>) => {
    const step = event.shiftKey ? 80 : 36;
    switch (event.key) {
      case 'ArrowLeft':
        handlePan(step, 0);
        break;
      case 'ArrowRight':
        handlePan(-step, 0);
        break;
      case 'ArrowUp':
        handlePan(0, step);
        break;
      case 'ArrowDown':
        handlePan(0, -step);
        break;
      case '+':
      case '=':
        handleZoomIn();
        break;
      case '-':
        handleZoomOut();
        break;
      case '0':
        handleResetView();
        break;
      case 'Escape':
        setSelected(null);
        setCompare([]);
        return;
      default:
        return;
    }
    event.preventDefault();
  };

  const handleToggleCompare = () => {
    setComparing((prev) => !prev);
    setCompare([]);
  };

  return (
    <div className="border-line bg-panel rounded-sm border">
      <div className="border-line flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
        <div>
          <p className="text-muted font-mono text-nano uppercase">DEMO LINEAGE</p>
          <p className="mt-1 text-[15px] font-semibold tracking-tight">AXIS family · {visible.nodes.length} projects</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <TreeButton label="Zoom in" onClick={handleZoomIn}>
            +
          </TreeButton>
          <TreeButton label="Zoom out" onClick={handleZoomOut}>
            −
          </TreeButton>
          <TreeButton label="Reset view" onClick={handleResetView}>
            Fit
          </TreeButton>
          <TreeButton
            label="Follow mutation M-94012"
            onClick={handleFollowMutation}
            active={selected === AXIS_IDS.mutant}
          >
            Follow mutation
          </TreeButton>
          <TreeButton label="Compare two descendants" onClick={handleToggleCompare} active={comparing}>
            Compare
          </TreeButton>
        </div>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_220px]">
        <div className="min-w-0 overflow-hidden">
          <svg
            role="img"
            tabIndex={0}
            aria-label="AXIS family CodeTree. Arrow keys pan, plus and minus zoom, 0 fits."
            onKeyDown={handleKeyDown}
            viewBox={`${minX} ${minY} ${width} ${height}`}
            className="h-[min(520px,70vh)] w-full bg-void outline-none focus-visible:ring-2 focus-visible:ring-acid/50"
          >
            <g transform={`translate(${view.x} ${view.y}) scale(${view.scale})`}>
              {geometry.edges.map((placed) => {
                const style = edgeStyle(placed.edge);
                const mutant = placed.edge.mutation === 'DEMO:M-94012';
                const dimmed =
                  selected !== null &&
                  placed.edge.from !== selected &&
                  placed.edge.to !== selected;
                return (
                  <g key={placed.edge.id} opacity={dimmed ? 0.22 : 1}>
                    {style.doubled && (
                      <path
                        d={placed.path}
                        fill="none"
                        stroke={style.stroke}
                        strokeWidth={style.width + 2.4}
                        opacity={0.28}
                      />
                    )}
                    <path
                      d={placed.path}
                      fill="none"
                      stroke={style.stroke}
                      strokeWidth={mutant ? style.width + 0.8 : style.width}
                      strokeDasharray={style.dash}
                      opacity={style.opacity}
                      markerEnd={style.marker === 'ca-arrow-open' ? undefined : undefined}
                    />
                    {mutant && (
                      <text
                        x={placed.mid.x}
                        y={placed.mid.y - 8}
                        textAnchor="middle"
                        fill="var(--color-amber)"
                        className="font-mono"
                        fontSize={9}
                      >
                        M-94012
                      </text>
                    )}
                  </g>
                );
              })}

              {[...geometry.placed.values()].map((placed) => {
                const kind = kindOf(placed.node.accession);
                const meta = LINEAGE_KIND_META[kind];
                const isSelected = placed.node.accession === selected;
                const inCompare = compare.includes(placed.node.accession);
                const hasKids = placed.node.children.length > 0;
                const isCollapsed = collapsed.has(placed.node.accession);
                const x = placed.x - NODE_WIDTH / 2;
                const y = placed.y - NODE_HEIGHT / 2;

                return (
                  <g key={placed.node.accession} transform={`translate(${x} ${y})`}>
                    <rect
                      width={NODE_WIDTH}
                      height={NODE_HEIGHT}
                      rx={meta.shape === 'circle' ? 18 : meta.shape === 'square' ? 2 : 8}
                      fill="var(--color-panel-2)"
                      stroke={
                        isSelected || inCompare ? 'var(--color-acid)' : 'var(--color-line)'
                      }
                      strokeWidth={isSelected || inCompare ? 2 : 1}
                      strokeDasharray={
                        meta.connection === 'dashed'
                          ? '5 4'
                          : meta.connection === 'dotted'
                            ? '2 3'
                            : undefined
                      }
                    />
                    <text
                      x={12}
                      y={22}
                      fill="var(--color-text)"
                      fontSize={11}
                      fontWeight={600}
                    >
                      {meta.glyph} {placed.node.name}
                    </text>
                    <text
                      x={12}
                      y={40}
                      fill="var(--color-muted)"
                      className="font-mono"
                      fontSize={9}
                    >
                      {kind} · G{placed.node.generation}
                    </text>
                    <text
                      x={12}
                      y={56}
                      fill="var(--color-muted)"
                      className="font-mono"
                      fontSize={8}
                    >
                      {placed.node.geneCount} genes
                    </text>
                    <rect
                      width={NODE_WIDTH}
                      height={NODE_HEIGHT}
                      rx={8}
                      fill="transparent"
                      className="cursor-pointer"
                      role="button"
                      tabIndex={0}
                      aria-label={`${placed.node.name}, ${kind}, generation ${placed.node.generation}`}
                      onClick={() => handleSelect(placed.node.accession)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          handleSelect(placed.node.accession);
                        }
                      }}
                    />
                    {hasKids && (
                      <text
                        x={NODE_WIDTH - 14}
                        y={20}
                        textAnchor="end"
                        fill="var(--color-acid)"
                        className="font-mono cursor-pointer"
                        fontSize={11}
                        onClick={(event) => {
                          event.stopPropagation();
                          handleToggleCollapse(placed.node.accession);
                        }}
                      >
                        {isCollapsed ? '+' : '–'}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>
          <p className="border-line text-muted border-t px-4 py-2 font-mono text-nano">
            Arrows pan · + − zoom · 0 fit · +/– on a node collapses a family
          </p>
        </div>

        <aside className="border-line bg-void min-w-0 border-t p-4 lg:border-t-0 lg:border-l">
          {comparing ? (
            <ComparePane ids={compare} kindOf={kindOf} />
          ) : node ? (
            <NodeReadout
              node={node}
              kind={kindOf(node.accession)}
              family={visible}
              onSelect={handleSelect}
              onCollapse={
                node.children.length > 0 ? () => handleToggleCollapse(node.accession) : undefined
              }
              collapsed={collapsed.has(node.accession)}
            />
          ) : (
            <p className="text-muted text-[14px]">Select a project to inspect it.</p>
          )}
        </aside>
      </div>
    </div>
  );
}

const TreeButton = ({
  label,
  onClick,
  active,
  children,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  children: ReactNode;
}) => (
  <button
    type="button"
    aria-label={label}
    aria-pressed={active}
    onClick={onClick}
    className={cn(
      'rounded-xs border px-2 py-1 font-mono text-nano uppercase',
      active ? 'border-acid/50 bg-acid/10 text-acid' : 'border-line text-muted hover:text-text',
    )}
  >
    {children}
  </button>
);

const NodeReadout = ({
  node,
  kind,
  family,
  onSelect,
  onCollapse,
  collapsed,
}: {
  node: FamilyTree['nodes'][number];
  kind: LineageKind;
  family: FamilyTree;
  onSelect: (id: string) => void;
  onCollapse?: () => void;
  collapsed?: boolean;
}) => {
  const meta = LINEAGE_KIND_META[kind];
  const byId = new Map(family.nodes.map((entry) => [entry.accession, entry]));
  const parents = node.parents.flatMap((parent) => {
    const record = byId.get(parent.genome);
    return record ? [{ ...parent, record }] : [];
  });
  const children = node.children.flatMap((id) => {
    const record = byId.get(id);
    return record ? [record] : [];
  });

  return (
    <article className="font-ui">
      <p className="text-muted font-mono text-nano uppercase">DEMO LINEAGE</p>
      <p className="text-cyan mt-2 font-mono text-micro">{demoAccession(node.accession)}</p>
      <h3 className="mt-1 text-[16px] leading-tight font-semibold tracking-tight">{node.name}</h3>
      <p className="text-text-soft mt-2 text-[13.5px] leading-relaxed">{node.tagline}</p>
      <p
        className={cn(
          'border-line mt-3 inline-flex items-center gap-1.5 rounded-xs border px-2 py-1 font-mono text-nano uppercase',
          meta.tone,
        )}
      >
        <span aria-hidden="true">{meta.glyph}</span>
        {kind}
      </p>
      <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2">
        <Datum label="Generation" value={String(node.generation)} />
        <Datum label="Genes" value={String(node.geneCount)} />
        <Datum label="Authored" value={String(node.mutationsAuthored)} />
        <Datum label="Adopted" value={String(node.mutationsAdopted)} />
      </dl>
      {onCollapse && (
        <button
          type="button"
          onClick={onCollapse}
          className="border-line text-muted mt-4 rounded-xs border px-2 py-1 font-mono text-nano uppercase"
        >
          {collapsed ? 'Expand descendants' : 'Collapse family'}
        </button>
      )}
      {parents.length > 0 && (
        <RelationList title="Ancestors">
          {parents.map((parent) => (
            <button
              key={parent.genome}
              type="button"
              onClick={() => onSelect(parent.genome)}
              className="text-text-soft hover:text-text block w-full text-left text-[13px]"
            >
              {parent.record.name}
              <span className="text-muted ml-2 font-mono text-nano">
                {Math.round(parent.contribution * 100)}%
              </span>
            </button>
          ))}
        </RelationList>
      )}
      {children.length > 0 && (
        <RelationList title={`Descendants (${children.length})`}>
          {children.map((child) => (
            <button
              key={child.accession}
              type="button"
              onClick={() => onSelect(child.accession)}
              className="text-text-soft hover:text-text block w-full text-left text-[13px]"
            >
              {child.name}
            </button>
          ))}
        </RelationList>
      )}
    </article>
  );
};

const ComparePane = ({
  ids,
  kindOf,
}: {
  ids: string[];
  kindOf: (id: string) => LineageKind;
}) => {
  const pair = ids
    .map((id) => axisFamily.nodes.find((node) => node.accession === id))
    .filter((node): node is NonNullable<typeof node> => Boolean(node));

  return (
    <div>
      <p className="text-muted font-mono text-nano uppercase">Compare · demo</p>
      <p className="text-text-soft mt-2 text-[13.5px]">
        Select two descendants. Shape and symbol stay with the type.
      </p>
      {pair.length === 0 && <p className="text-muted mt-4 text-[13px]">Pick a first project.</p>}
      <ul className="mt-4 space-y-3">
        {pair.map((node) => {
          const kind = kindOf(node.accession);
          const meta = LINEAGE_KIND_META[kind];
          return (
            <li key={node.accession} className="border-line rounded-xs border px-3 py-2">
              <p className={cn('font-mono text-nano uppercase', meta.tone)}>
                {meta.glyph} {kind}
              </p>
              <p className="mt-1 text-[14px] font-semibold">{node.name}</p>
              <p className="text-muted font-mono text-nano">
                G{node.generation} · {node.geneCount} genes
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

const RelationList = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="border-line mt-4 border-t pt-3">
    <p className="text-muted font-mono text-nano uppercase">{title}</p>
    <div className="mt-2 space-y-1">{children}</div>
  </div>
);

const Datum = ({ label, value }: { label: string; value: string }) => (
  <div>
    <dt className="text-muted font-mono text-nano uppercase">{label}</dt>
    <dd className="text-text mt-0.5 text-[13px]">{value}</dd>
  </div>
);
