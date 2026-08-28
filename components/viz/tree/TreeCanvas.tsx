'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import type { FamilyTree, TreeEdge, ZoomLevel } from '@/lib/registry/tree';
import { INHERITANCE_META } from '@/lib/schema/vocabulary';
import { edgeStyle, isFrozen } from './edgeStyle';
import {
  NODE_HEIGHT,
  NODE_WIDTH,
  RADIAL_NODE_HEIGHT,
  RADIAL_NODE_WIDTH,
  radialLayout,
  tidyLayout,
  type Geometry,
  type PlacedEdge,
} from './layout';

/**
 * The tidy and radial CodeTree views.
 *
 * Both render from the same geometry so hovering a node, focusing it with the
 * keyboard and reading it in the nested list all refer to the same thing. Pan
 * and zoom are exposed as buttons and arrow keys as well as drag, because a
 * drag-only graph is unusable without a pointer.
 */

const ZOOM_DETAIL: Record<ZoomLevel, number> = {
  family: 0,
  projects: 1,
  genes: 2,
  mutations: 3,
};

export function TreeCanvas({
  family,
  mode,
  zoom,
  selected,
  onSelect,
  pulseEdgeId,
  animate,
  className,
}: {
  family: FamilyTree;
  mode: 'tidy' | 'radial';
  zoom: ZoomLevel;
  selected: string | null;
  onSelect: (accession: string | null) => void;
  /** Edge to run the propagation pulse along, if any. */
  pulseEdgeId?: string;
  animate: boolean;
  className?: string;
}) {
  const geometry = useMemo<Geometry>(
    () => (mode === 'radial' ? radialLayout(family) : tidyLayout(family)),
    [family, mode],
  );

  const detail = ZOOM_DETAIL[zoom];
  const [view, setView] = useState({ scale: 1, x: 0, y: 0 });
  const [hovered, setHovered] = useState<string | null>(null);
  const [grabbing, setGrabbing] = useState(false);
  const dragging = useRef<{ x: number; y: number; startX: number; startY: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const { minX, minY, maxX, maxY } = geometry.bounds;
  const width = Math.max(1, maxX - minX);
  const height = Math.max(1, maxY - minY);

  /** The node the reader is attending to: hover wins over selection. */
  const touched = hovered ?? selected;
  const isDimmed = (from: string, to: string) =>
    touched !== null && from !== touched && to !== touched;

  const nudge = useCallback((dx: number, dy: number) => {
    setView((prev) => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
  }, []);

  const scaleBy = useCallback((factor: number) => {
    setView((prev) => ({
      ...prev,
      scale: Math.min(3, Math.max(0.4, prev.scale * factor)),
    }));
  }, []);

  const handleKeyDown = (event: React.KeyboardEvent<SVGSVGElement>) => {
    const step = event.shiftKey ? 120 : 40;
    switch (event.key) {
      case 'ArrowLeft':
        nudge(step, 0);
        break;
      case 'ArrowRight':
        nudge(-step, 0);
        break;
      case 'ArrowUp':
        nudge(0, step);
        break;
      case 'ArrowDown':
        nudge(0, -step);
        break;
      case '+':
      case '=':
        scaleBy(1.2);
        break;
      case '-':
      case '_':
        scaleBy(1 / 1.2);
        break;
      case '0':
        setView({ scale: 1, x: 0, y: 0 });
        break;
      case 'Escape':
        onSelect(null);
        return;
      default:
        return;
    }
    event.preventDefault();
  };

  return (
    <div className={cn('relative', className)}>
      <svg
        ref={svgRef}
        role="application"
        aria-label={`${family.name} lineage graph, ${mode} layout. Use arrow keys to pan, plus and minus to zoom, zero to reset.`}
        tabIndex={0}
        viewBox={`${minX} ${minY} ${width} ${height}`}
        onKeyDown={handleKeyDown}
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          dragging.current = { x: event.clientX, y: event.clientY, startX: view.x, startY: view.y };
          setGrabbing(true);
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          const drag = dragging.current;
          if (!drag) return;
          // Convert screen delta into layout units so drag tracks the cursor.
          const rect = event.currentTarget.getBoundingClientRect();
          const unitsPerPx = width / rect.width / view.scale;
          setView((prev) => ({
            ...prev,
            x: drag.startX + (event.clientX - drag.x) * unitsPerPx,
            y: drag.startY + (event.clientY - drag.y) * unitsPerPx,
          }));
        }}
        onPointerUp={() => {
          dragging.current = null;
          setGrabbing(false);
        }}
        onPointerCancel={() => {
          dragging.current = null;
          setGrabbing(false);
        }}
        className={cn(
          'bg-panel border-line block w-full rounded-xl border',
          // A square layout in a wide, short frame would be scaled down until the
          // labels stopped being readable, so the radial view gets more height.
          mode === 'radial'
            ? 'h-[clamp(440px,86vw,780px)]'
            : 'h-[clamp(420px,62vh,720px)]',
          grabbing ? 'cursor-grabbing' : 'cursor-grab',
        )}
      >
        <defs>
          <pattern id="tree-frozen" width="6" height="6" patternUnits="userSpaceOnUse">
            <path d="M3 0v6M0 3h6" stroke="currentColor" strokeWidth="0.7" opacity="0.5" />
          </pattern>
          <marker
            id="tree-arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto"
          >
            <path d="M0 0 10 5 0 10z" fill="context-stroke" />
          </marker>
          <marker
            id="tree-arrow-open"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
          >
            <path d="M0 1 9 5 0 9" fill="none" stroke="context-stroke" strokeWidth="1.6" />
          </marker>
        </defs>

        <g
          transform={`translate(${view.x} ${view.y}) scale(${view.scale}) translate(${
            (1 / view.scale - 1) * (minX + width / 2)
          } ${(1 / view.scale - 1) * (minY + height / 2)})`}
        >
          {mode === 'radial' && <GenerationRings geometry={geometry} />}

          <g aria-hidden="true">
            {geometry.edges.map((placed) => (
              <Edge
                key={placed.edge.id}
                placed={placed}
                dimmed={isDimmed(placed.edge.from, placed.edge.to)}
                pulse={animate && placed.edge.id === pulseEdgeId}
              />
            ))}
          </g>

          {[...geometry.placed.values()].map((placed) => (
            <NodeCard
              key={placed.node.accession}
              placed={placed}
              variant={mode === 'radial' ? 'chip' : 'card'}
              shortName={mode === 'radial' ? shorten(placed.node.name, family.name) : undefined}
              detail={detail}
              selected={selected === placed.node.accession}
              hovered={hovered === placed.node.accession}
              dimmed={
                touched !== null &&
                placed.node.accession !== touched &&
                !geometry.edges.some(
                  (edge) =>
                    (edge.edge.from === touched || edge.edge.to === touched) &&
                    (edge.edge.from === placed.node.accession ||
                      edge.edge.to === placed.node.accession),
                )
              }
              onSelect={onSelect}
              onHover={setHovered}
            />
          ))}

          {/* Labels ride above the nodes so a chip can never clip one. */}
          <g aria-hidden="true">
            {geometry.edges
              .filter((placed) =>
                mode === 'radial'
                  ? touched !== null &&
                    (placed.edge.from === touched || placed.edge.to === touched)
                  : detail >= 2 || placed.edge.upstream,
              )
              .map((placed) => (
                <EdgeLabel
                  key={placed.edge.id}
                  placed={placed}
                  dimmed={isDimmed(placed.edge.from, placed.edge.to)}
                />
              ))}
          </g>
        </g>
      </svg>

      <ViewControls
        scale={view.scale}
        onZoomIn={() => scaleBy(1.25)}
        onZoomOut={() => scaleBy(1 / 1.25)}
        onReset={() => setView({ scale: 1, x: 0, y: 0 })}
        onPan={nudge}
      />

      <p className="text-faint mt-2.5 text-[12.5px]">
        {mode === 'radial'
          ? 'Rings are generations, outward from the root. Hover or select a project to name the relations it takes part in.'
          : 'Drag to pan, or use the controls and arrow keys. Focus the graph and press 0 to reset the view.'}
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function GenerationRings({ geometry }: { geometry: Geometry }) {
  return (
    <g aria-hidden="true">
      {geometry.rings.map((ring) => (
        <g key={ring.radius}>
          <path
            d={ring.path}
            fill="none"
            stroke="var(--color-line)"
            strokeWidth={1}
            strokeDasharray="2 6"
          />
          <text
            x={ring.label.x}
            y={ring.label.y}
            textAnchor="middle"
            dominantBaseline="central"
            fill="var(--color-faint)"
            className="font-mono"
            fontSize={9}
            letterSpacing="0.14em"
          >
            GEN {ring.generation}
          </text>
        </g>
      ))}
    </g>
  );
}

function Edge({
  placed,
  dimmed,
  pulse,
}: {
  placed: PlacedEdge;
  dimmed: boolean;
  pulse: boolean;
}) {
  const style = edgeStyle(placed.edge);
  const frozen = isFrozen(placed.edge);

  return (
    <g opacity={dimmed ? 0.14 : 1} className="transition-opacity duration-300">
      <path
        d={placed.path}
        fill="none"
        stroke={style.stroke}
        strokeWidth={style.width}
        strokeDasharray={frozen ? '3 3' : style.dash}
        strokeLinecap="round"
        opacity={frozen ? 0.45 : style.opacity}
        markerEnd={`url(#${style.marker === 'ca-arrow' ? 'tree-arrow' : 'tree-arrow-open'})`}
      />

      {style.doubled && (
        /* Recombination reads as a double line: a second hairline inside the
           first, which survives greyscale printing. */
        <path
          d={placed.path}
          fill="none"
          stroke="var(--color-void)"
          strokeWidth={style.width * 0.5}
          opacity={0.9}
        />
      )}

      {pulse && <EdgePulse path={placed.path} tone={style.stroke} />}
    </g>
  );
}

function EdgeLabel({ placed, dimmed }: { placed: PlacedEdge; dimmed: boolean }) {
  const label = placed.edge.label;
  if (!label) return null;

  const style = edgeStyle(placed.edge);
  // Monospace at 9px runs about 6.2 units per character, close enough to size a
  // elevated that hides the line behind the text.
  const elevated = label.length * 6.2 + 12;

  return (
    <g
      transform={`translate(${placed.mid.x} ${placed.mid.y})`}
      opacity={dimmed ? 0.14 : 1}
      className="transition-opacity duration-300"
    >
      <rect
        x={-elevated / 2}
        y={-8}
        width={elevated}
        height={16}
        rx={4}
        fill="var(--color-void)"
        opacity={0.92}
      />
      <text
        textAnchor="middle"
        dominantBaseline="central"
        fill={style.stroke}
        className="font-mono"
        fontSize={9}
        letterSpacing="0.1em"
      >
        {label}
      </text>
    </g>
  );
}

/**
 * Semantic motion: a pulse travelling along an edge means information moved.
 * Driven by `getPointAtLength` rather than SMIL so it can be paused, respects
 * reduced motion, and never runs when the reader has asked for stillness.
 */
function EdgePulse({ path, tone }: { path: string; tone: string }) {
  const ref = useRef<SVGCircleElement>(null);
  const pathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const dot = ref.current;
    const geometry = pathRef.current;
    if (!dot || !geometry) return;

    const length = geometry.getTotalLength();
    let frame = 0;
    let start: number | null = null;
    const duration = 2600;

    const tick = (now: number) => {
      start ??= now;
      const progress = ((now - start) % duration) / duration;
      const point = geometry.getPointAtLength(progress * length);
      dot.setAttribute('cx', String(point.x));
      dot.setAttribute('cy', String(point.y));
      // Fade in and out at the ends so the pulse reads as a transmission
      // rather than a looping object.
      dot.setAttribute('opacity', String(Math.sin(progress * Math.PI) ** 0.6));
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [path]);

  return (
    <>
      <path ref={pathRef} d={path} fill="none" stroke="none" />
      <circle ref={ref} r={4.5} fill={tone} opacity={0}>
        <title>Information travelling along this relation</title>
      </circle>
    </>
  );
}

/** Drop the family name from a descendant's label; the page already said it. */
function shorten(name: string, family: string) {
  const stripped = name.startsWith(`${family} `) ? name.slice(family.length + 1) : name;
  return stripped.length > 20 ? `${stripped.slice(0, 19)}…` : stripped;
}

function NodeCard({
  placed,
  variant = 'card',
  shortName,
  detail,
  selected,
  hovered,
  dimmed,
  onSelect,
  onHover,
}: {
  placed: { node: FamilyTree['nodes'][number]; x: number; y: number };
  variant?: 'card' | 'chip';
  shortName?: string;
  detail: number;
  selected: boolean;
  hovered: boolean;
  dimmed: boolean;
  onSelect: (accession: string | null) => void;
  onHover: (accession: string | null) => void;
}) {
  const { node } = placed;
  const chip = variant === 'chip';
  const width = chip ? RADIAL_NODE_WIDTH : NODE_WIDTH;
  const showMeta = detail >= 1;
  const height = chip
    ? showMeta
      ? RADIAL_NODE_HEIGHT
      : 30
    : showMeta
      ? NODE_HEIGHT
      : 44;

  const label = shortName ?? (node.name.length > 22 ? `${node.name.slice(0, 21)}…` : node.name);
  const pad = chip ? 10 : 14;
  const titleY = chip ? (showMeta ? 17 : 20) : showMeta ? 21 : 27;

  return (
    <g
      transform={`translate(${placed.x - width / 2} ${placed.y - height / 2})`}
      opacity={dimmed ? 0.28 : 1}
      className="transition-opacity duration-300"
      onPointerEnter={() => onHover(node.accession)}
      onPointerLeave={() => onHover(null)}
    >
      <g
        role="button"
        tabIndex={0}
        aria-pressed={selected}
        aria-label={`${node.name}, generation ${node.generation}, ${node.geneCount} genes. ${node.tagline}`}
        onClick={() => onSelect(selected ? null : node.accession)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onSelect(selected ? null : node.accession);
          }
        }}
        className="cursor-pointer"
      >
        <rect
          width={width}
          height={height}
          rx={chip ? 6 : 8}
          fill="var(--color-panel-2)"
          stroke={
            selected ? 'var(--color-acid)' : hovered ? 'var(--color-line-strong)' : 'var(--color-line)'
          }
          strokeWidth={selected ? 2 : 1}
        />

        {/* Generation stripe: position in the family, readable without text. */}
        <rect
          width={4}
          height={height}
          rx={2}
          fill={node.generation === 0 ? 'var(--color-acid)' : 'var(--color-cyan)'}
          opacity={node.generation === 0 ? 0.9 : 0.35 + node.generation * 0.15}
        />

        <text
          x={pad}
          y={titleY}
          fill="var(--color-text)"
          fontSize={chip ? 12 : 13}
          fontWeight={600}
          letterSpacing="-0.02em"
        >
          {label}
        </text>

        {/* The radial view puts the generation on the ring, so the badge would
            only be repeating itself. */}
        {!chip && (
          <text
            x={width - 12}
            y={titleY}
            textAnchor="end"
            fill="var(--color-faint)"
            className="font-mono"
            fontSize={9}
            letterSpacing="0.12em"
          >
            G{node.generation}
          </text>
        )}

        {showMeta && (
          <>
            <CompositionBar node={node} y={chip ? 24 : 32} width={width} pad={pad} />
            <text
              x={pad}
              y={chip ? 39 : 60}
              fill="var(--color-muted)"
              className="font-mono"
              fontSize={chip ? 8 : 9}
              letterSpacing="0.1em"
            >
              {detail >= 3
                ? `${node.mutationsAuthored} authored · ${node.mutationsAdopted} adopted${
                    node.openProposals > 0 ? ` · ${node.openProposals} open` : ''
                  }`
                : detail >= 2
                  ? `${node.geneCount} genes · ${node.agents.length} ${
                      node.agents.length === 1 ? 'agent' : 'agents'
                    }`
                  : `${node.geneCount} genes`}
            </text>
          </>
        )}
      </g>
    </g>
  );
}

function CompositionBar({
  node,
  y,
  width = NODE_WIDTH,
  pad = 14,
}: {
  node: FamilyTree['nodes'][number];
  y: number;
  width?: number;
  pad?: number;
}) {
  const track = width - pad * 2;

  // Widths accumulate left to right, so each segment needs the sum before it.
  const segments = node.composition.reduce<
    { mode: string; share: number; x: number; width: number }[]
  >((acc, segment) => {
    const previous = acc.at(-1);
    const x = previous ? previous.x + previous.width : pad;
    return [...acc, { mode: segment.mode, share: segment.share, x, width: Math.max(2, segment.share * track) }];
  }, []);

  return (
    <g>
      {segments.map((segment) => {
        const meta = INHERITANCE_META[segment.mode as keyof typeof INHERITANCE_META];

        return (
          <rect
            key={segment.mode}
            x={segment.x}
            y={y}
            width={segment.width}
            height={5}
            rx={1.5}
            fill={`var(--color-${SWATCH_VAR[meta.swatch]})`}
          >
            <title>{`${meta.label}: ${Math.round(segment.share * 100)}% of ${node.name}`}</title>
          </rect>
        );
      })}
    </g>
  );
}

/** Tailwind swatch class -> CSS variable name, so SVG fills can reuse the tokens. */
const SWATCH_VAR: Record<string, string> = {
  'bg-acid': 'acid',
  'bg-cyan': 'cyan',
  'bg-violet': 'violet',
  'bg-amber': 'amber',
  'bg-rose': 'rose',
};

function ViewControls({
  scale,
  onZoomIn,
  onZoomOut,
  onReset,
  onPan,
}: {
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onPan: (dx: number, dy: number) => void;
}) {
  const button =
    'grid size-8 place-items-center rounded-md border border-line bg-panel-2/90 font-mono text-[12px] text-text-soft transition-colors hover:border-line-strong hover:text-text';

  return (
    <div className="absolute right-3 bottom-3 flex flex-col items-end gap-2">
      <div className="flex items-center gap-1.5">
        <span className="text-faint bg-void rounded-sm px-1.5 py-0.5 font-mono text-nano tabular-nums">
          {Math.round(scale * 100)}%
        </span>
        <button type="button" onClick={onZoomOut} aria-label="Zoom out" className={button}>
          <span aria-hidden="true">−</span>
        </button>
        <button type="button" onClick={onZoomIn} aria-label="Zoom in" className={button}>
          <span aria-hidden="true">+</span>
        </button>
        <button
          type="button"
          onClick={onReset}
          aria-label="Reset view"
          className={cn(button, 'w-auto px-2 text-nano uppercase')}
        >
          Fit
        </button>
      </div>

      <div className="grid grid-cols-3 gap-1">
        <span />
        <button
          type="button"
          onClick={() => onPan(0, 60)}
          aria-label="Pan up"
          className={cn(button, 'size-7')}
        >
          <span aria-hidden="true">↑</span>
        </button>
        <span />
        <button
          type="button"
          onClick={() => onPan(60, 0)}
          aria-label="Pan left"
          className={cn(button, 'size-7')}
        >
          <span aria-hidden="true">←</span>
        </button>
        <button
          type="button"
          onClick={() => onPan(0, -60)}
          aria-label="Pan down"
          className={cn(button, 'size-7')}
        >
          <span aria-hidden="true">↓</span>
        </button>
        <button
          type="button"
          onClick={() => onPan(-60, 0)}
          aria-label="Pan right"
          className={cn(button, 'size-7')}
        >
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  );
}

export type { TreeEdge };
