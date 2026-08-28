'use client';

import Link from 'next/link';
import { useMemo, useRef } from 'react';
import { cn } from '@/lib/cn';
import type { FamilyTree, TreeEdge, TreeNode } from '@/lib/registry/tree';
import { INHERITANCE_META } from '@/lib/schema/vocabulary';

/**
 * The non-visual equivalent of the CodeTree, and a first-class view in its own
 * right.
 *
 * A screen reader walks this as "KEYLIT, generation 0, root of the family.
 * Child: KEYLIT Kids, generation 1, inherits…". Roving tabindex with arrow-key
 * navigation follows the WAI-ARIA tree pattern, so one Tab stop covers the whole
 * family and the arrows move within it.
 */

type Row = {
  node: TreeNode;
  depth: number;
  /** The edge that brought us here, for the relation phrase. */
  via: TreeEdge | null;
  /** Extra parents this node has beyond the one it is nested under. */
  alsoFrom: TreeNode[];
};

export function NestedList({
  family,
  selected,
  onSelect,
}: {
  family: FamilyTree;
  selected: string | null;
  onSelect: (accession: string | null) => void;
}) {
  const listRef = useRef<HTMLUListElement>(null);

  const rows = useMemo(() => flatten(family), [family]);
  const activeIndex = Math.max(
    0,
    rows.findIndex((row) => row.node.accession === selected),
  );

  const focusRow = (index: number) => {
    const clamped = Math.min(rows.length - 1, Math.max(0, index));
    onSelect(rows[clamped]!.node.accession);
    const items = listRef.current?.querySelectorAll<HTMLElement>('[role="treeitem"]');
    items?.[clamped]?.focus();
  };

  const handleKeyDown = (event: React.KeyboardEvent, index: number) => {
    switch (event.key) {
      case 'ArrowDown':
        focusRow(index + 1);
        break;
      case 'ArrowUp':
        focusRow(index - 1);
        break;
      case 'Home':
        focusRow(0);
        break;
      case 'End':
        focusRow(rows.length - 1);
        break;
      case 'ArrowLeft': {
        // Move to the parent row, mirroring the tree pattern.
        const current = rows[index]!;
        for (let i = index - 1; i >= 0; i -= 1) {
          if (rows[i]!.depth < current.depth) {
            focusRow(i);
            break;
          }
        }
        break;
      }
      case 'ArrowRight':
        if (rows[index + 1] && rows[index + 1]!.depth > rows[index]!.depth) focusRow(index + 1);
        break;
      default:
        return;
    }
    event.preventDefault();
  };

  return (
    <div>
      <p className="text-faint mb-4 text-[13px] leading-relaxed">
        The same graph as text. Arrow keys move through the family, left and right step out of and
        into a branch, Home and End jump to the ends. Every relation is named, so nothing here
        depends on seeing a line.
      </p>

      <ul
        ref={listRef}
        role="tree"
        aria-label={`${family.name} family lineage`}
        className="flex flex-col gap-px"
      >
        {rows.map((row, index) => (
          <li key={`${row.node.accession}-${row.depth}`} role="none">
            <div
              role="treeitem"
              aria-label={rowLabel(row)}
              aria-selected={selected === row.node.accession}
              aria-level={row.depth + 1}
              tabIndex={index === activeIndex ? 0 : -1}
              onKeyDown={(event) => handleKeyDown(event, index)}
              onClick={() => onSelect(row.node.accession)}
              onFocus={() => onSelect(row.node.accession)}
              className={cn(
                'bg-void hover:bg-panel cursor-pointer border-l-2 px-4 py-3 transition-colors',
                selected === row.node.accession
                  ? 'border-l-acid bg-panel'
                  : 'border-l-line hover:border-l-line-strong',
              )}
              style={{ marginInlineStart: `${row.depth * 20}px` }}
            >
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                {row.via && (
                  <span className={cn('font-mono text-nano uppercase', row.via.tone)}>
                    {row.via.verb}
                  </span>
                )}
                {!row.via && (
                  <span className="text-acid font-mono text-nano uppercase">root of the family</span>
                )}

                <span className="text-[15.5px] font-semibold tracking-[-0.02em]">
                  {row.node.name}
                </span>

                <span className="text-faint font-mono text-nano uppercase">
                  Generation {row.node.generation}
                </span>

                <span className="text-muted font-mono text-nano tabular-nums">
                  {row.node.geneCount} genes
                </span>
              </div>

              <p className="text-muted mt-1.5 text-[13.5px] leading-relaxed">{row.node.tagline}</p>

              <p className="text-faint mt-2 text-[12.5px]">
                {row.node.composition
                  .map(
                    (segment) =>
                      `${Math.round(segment.share * 100)}% ${INHERITANCE_META[
                        segment.mode
                      ].label.toLowerCase()}`,
                  )
                  .join(' · ')}
              </p>

              {row.alsoFrom.length > 0 && (
                <p className="text-violet mt-2 text-[12.5px]">
                  Also descends from {row.alsoFrom.map((parent) => parent.name).join(' and ')} — a
                  hybrid with {row.alsoFrom.length + 1} parents.
                </p>
              )}

              <p className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1">
                <Link
                  href={`/project/${row.node.accession}`}
                  className="text-text-soft hover:text-acid font-mono text-nano uppercase underline decoration-dotted"
                >
                  Open genome
                </Link>
                {row.node.children.length > 0 && (
                  <span className="text-faint font-mono text-nano uppercase">
                    {row.node.children.length}{' '}
                    {row.node.children.length === 1 ? 'descendant' : 'descendants'}
                  </span>
                )}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <LateralRelations family={family} onSelect={onSelect} />
    </div>
  );
}

/**
 * Relations that are not descent get their own section rather than being
 * squeezed into the nesting, because they are the ones a nested list cannot
 * express structurally.
 */
function LateralRelations({
  family,
  onSelect,
}: {
  family: FamilyTree;
  onSelect: (accession: string | null) => void;
}) {
  const byId = new Map(family.nodes.map((node) => [node.accession, node]));
  const lateral = family.edges.filter(
    (edge) => edge.upstream || edge.type === 'TRANSFERRED_FROM',
  );

  if (lateral.length === 0) return null;

  return (
    <section className="border-line/60 mt-8 border-t pt-6">
      <h3 className="text-muted font-mono text-nano uppercase">
        Relations that are not descent
        <span className="text-faint ml-2 tabular-nums">{lateral.length}</span>
      </h3>
      <p className="text-faint mt-2 text-[13px] leading-relaxed">
        Lateral transfer and upstream offers cannot be nested, because they run sideways and
        backwards through the family. They are listed here in full.
      </p>

      <ul className="mt-4 flex flex-col gap-2">
        {lateral.map((edge) => {
          const from = byId.get(edge.from);
          const to = byId.get(edge.to);
          if (!from || !to) return null;

          return (
            <li key={edge.id}>
              <button
                type="button"
                onClick={() => onSelect(edge.from)}
                className="border-line bg-panel hover:border-line-strong w-full rounded-md border px-3.5 py-3 text-left transition-colors"
              >
                <span className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                  <span className={cn('font-mono text-nano uppercase', edge.tone)}>
                    {edge.label}
                  </span>
                  <span className="text-text-soft text-[14px]">{from.name}</span>
                  <span aria-hidden="true" className="text-faint text-[12px]">
                    →
                  </span>
                  <span className="text-text-soft text-[14px]">{to.name}</span>
                  <span className="text-faint ml-auto font-mono text-nano tabular-nums">
                    {edge.createdAt}
                  </span>
                </span>
                <span className="text-muted mt-1 block text-[13px]">
                  {from.name} {edge.verb} {to.name}. Confidence {edge.confidence.toFixed(2)}.
                  {edge.gene && ` Capability ${edge.gene}.`}
                  {edge.mutation && ` Mutation ${edge.mutation}.`}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/**
 * The spoken form of a row.
 *
 * Name-from-content would run the adjacent spans together — "Generation 010
 * genes" — and tack "Open genome" onto every item, so each row states its own
 * label instead. Phrased as a sentence, because this is the version a screen
 * reader user actually hears.
 */
function rowLabel(row: Row): string {
  const parts = [
    row.via ? `${row.via.verb} its parent:` : 'Root of the family:',
    `${row.node.name},`,
    `generation ${row.node.generation},`,
    `${row.node.geneCount} ${row.node.geneCount === 1 ? 'capability' : 'capabilities'}.`,
    `${row.node.tagline}`,
    row.node.composition
      .map(
        (segment) =>
          `${Math.round(segment.share * 100)} percent ${INHERITANCE_META[
            segment.mode
          ].label.toLowerCase()}`,
      )
      .join(', ') + '.',
  ];

  if (row.alsoFrom.length > 0) {
    parts.push(
      `Also descends from ${row.alsoFrom.map((parent) => parent.name).join(' and ')}, a hybrid with ${
        row.alsoFrom.length + 1
      } parents.`,
    );
  }

  if (row.node.children.length > 0) {
    parts.push(
      `${row.node.children.length} ${
        row.node.children.length === 1 ? 'descendant' : 'descendants'
      }.`,
    );
  }

  return parts.join(' ');
}

/** Depth-first walk of the spanning tree, recording the edge used at each step. */
function flatten(family: FamilyTree): Row[] {
  const byId = new Map(family.nodes.map((node) => [node.accession, node]));
  const spine = new Map(family.spine.map((entry) => [entry.id, entry]));
  const rows: Row[] = [];

  const edgeBetween = (childId: string, parentId: string) =>
    family.edges.find(
      (edge) => !edge.upstream && edge.from === childId && edge.to === parentId,
    ) ?? null;

  const walk = (id: string, depth: number, via: TreeEdge | null) => {
    const node = byId.get(id);
    if (!node) return;

    const entry = spine.get(id);
    rows.push({
      node,
      depth,
      via,
      alsoFrom: (entry?.secondaryParents ?? []).flatMap((parentId) => {
        const parent = byId.get(parentId);
        return parent ? [parent] : [];
      }),
    });

    const children = node.children
      .filter((childId) => spine.get(childId)?.parent === id)
      .map((childId) => byId.get(childId)!)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

    for (const child of children) {
      walk(child.accession, depth + 1, edgeBetween(child.accession, id));
    }
  };

  walk(family.root, 0, null);
  return rows;
}
