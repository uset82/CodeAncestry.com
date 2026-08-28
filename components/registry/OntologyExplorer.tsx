'use client';

import { useState } from 'react';
import { cn } from '@/lib/cn';
import type { OntologyTreeNode } from '@/lib/registry/search';

/**
 * A capability-ontology browser in the spirit of AmiGO's term tree: terms are
 * machine-readable, labels are human, and every node reports how many genes sit
 * at or beneath it. Clicking a term filters the result set rather than
 * navigating away, so the tree stays a lens on the search.
 */
export function OntologyExplorer({
  tree,
  selected,
  onSelect,
  className,
}: {
  tree: OntologyTreeNode;
  /** Currently filtered term, or null for the whole ontology. */
  selected: string | null;
  onSelect: (term: string | null) => void;
  className?: string;
}) {
  // Depth 1 open by default: enough shape to orient, not a wall of terms.
  const [open, setOpen] = useState<Set<string>>(
    () => new Set([tree.term, ...tree.children.map((child) => child.term)]),
  );

  const toggle = (term: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(term)) next.delete(term);
      else next.add(term);
      return next;
    });

  return (
    <div className={className}>
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-muted font-mono text-nano uppercase">Capability ontology</h3>
        {selected && (
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="text-faint hover:text-text font-mono text-nano uppercase underline decoration-dotted"
          >
            Clear
          </button>
        )}
      </div>

      <ul role="tree" aria-label="Capability ontology" className="mt-3 -ml-1">
        <OntologyBranch
          node={tree}
          depth={0}
          open={open}
          toggle={toggle}
          selected={selected}
          onSelect={onSelect}
        />
      </ul>
    </div>
  );
}

function OntologyBranch({
  node,
  depth,
  open,
  toggle,
  selected,
  onSelect,
}: {
  node: OntologyTreeNode;
  depth: number;
  open: Set<string>;
  toggle: (term: string) => void;
  selected: string | null;
  onSelect: (term: string | null) => void;
}) {
  const expandable = node.children.length > 0;
  const expanded = open.has(node.term);
  const active = selected === node.term;
  // Terms with no genes anywhere beneath them are structure, not data.
  const empty = node.count === 0;

  return (
    <li
      role="treeitem"
      aria-expanded={expandable ? expanded : undefined}
      aria-selected={active}
    >
      <div
        className="flex items-center gap-1"
        style={{ paddingInlineStart: `${depth * 12}px` }}
      >
        {expandable ? (
          <button
            type="button"
            onClick={() => toggle(node.term)}
            aria-label={`${expanded ? 'Collapse' : 'Expand'} ${node.label}`}
            className="text-faint hover:text-text grid size-5 shrink-0 place-items-center font-mono text-[10px] transition-colors"
          >
            <span aria-hidden="true">{expanded ? '−' : '+'}</span>
          </button>
        ) : (
          <span aria-hidden="true" className="text-faint grid size-5 shrink-0 place-items-center text-[10px]">
            ·
          </span>
        )}

        <button
          type="button"
          onClick={() => onSelect(active ? null : node.term)}
          disabled={empty}
          title={node.description ?? node.term}
          className={cn(
            'flex min-w-0 flex-1 items-baseline gap-2 rounded-sm px-1.5 py-1 text-left transition-colors',
            empty && 'cursor-default',
            active ? 'bg-acid/10 text-acid' : empty ? 'text-faint' : 'text-text-soft hover:bg-panel-2',
          )}
        >
          <span className="truncate text-[13.5px]">{node.label}</span>
          <span
            className={cn(
              'ml-auto shrink-0 font-mono text-nano tabular-nums',
              active ? 'text-acid' : 'text-faint',
            )}
          >
            {node.count}
          </span>
        </button>
      </div>

      {expandable && expanded && (
        <ul role="group">
          {node.children.map((child) => (
            <OntologyBranch
              key={child.term}
              node={child}
              depth={depth + 1}
              open={open}
              toggle={toggle}
              selected={selected}
              onSelect={onSelect}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
