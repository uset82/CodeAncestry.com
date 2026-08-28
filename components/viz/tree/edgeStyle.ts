import type { TreeEdge } from '@/lib/registry/tree';
import { EDGE_TYPE_META, type EdgeType } from '@/lib/schema/vocabulary';

/**
 * The edge legend, in one place.
 *
 * Stroke pattern carries the relation type and is never redundant with colour:
 * a monochrome print of the CodeTree still distinguishes inheritance from a
 * proposal from a quarantined transfer.
 */

export type EdgeStyle = {
  stroke: string;
  width: number;
  dash?: string;
  /** Second, offset stroke used to draw a "double" line for recombination. */
  doubled: boolean;
  opacity: number;
  marker: 'ca-arrow' | 'ca-arrow-open';
};

const STROKE_VAR: Record<EdgeType, string> = {
  DERIVED_FROM: 'var(--color-cyan)',
  MUTATED_FROM: 'var(--color-acid)',
  RECOMBINED_FROM: 'var(--color-violet)',
  TRANSFERRED_FROM: 'var(--color-amber)',
  ADOPTED_FROM: 'var(--color-acid)',
  PROPOSED_TO: 'var(--color-violet)',
  REJECTED_FROM: 'var(--color-rose)',
};

export function edgeStyle(edge: TreeEdge): EdgeStyle {
  const base: EdgeStyle = {
    stroke: STROKE_VAR[edge.type],
    width: 1.6,
    doubled: false,
    opacity: 0.75,
    marker: 'ca-arrow',
  };

  switch (edge.type) {
    case 'RECOMBINED_FROM':
      return { ...base, doubled: true, width: 1.3 };
    case 'TRANSFERRED_FROM':
      return { ...base, dash: '7 5', width: 1.8, opacity: 0.9 };
    case 'PROPOSED_TO':
      return { ...base, dash: '5 5', marker: 'ca-arrow-open', opacity: 0.85 };
    case 'REJECTED_FROM':
      return { ...base, dash: '2 4', marker: 'ca-arrow-open', opacity: 0.6 };
    case 'ADOPTED_FROM':
      return { ...base, width: 2.2, opacity: 0.95 };
    case 'MUTATED_FROM':
      return { ...base, width: 1.9 };
    default:
      return base;
  }
}

/** Quarantined relations are frozen: hatched, dimmed, and never animated. */
export function isFrozen(edge: TreeEdge): boolean {
  return edge.state === 'quarantined';
}

export const EDGE_LEGEND: { type: EdgeType; label: string; detail: string }[] = [
  {
    type: 'DERIVED_FROM',
    label: EDGE_TYPE_META.DERIVED_FROM.label,
    detail: 'A fork or a port. Solid line.',
  },
  {
    type: 'MUTATED_FROM',
    label: EDGE_TYPE_META.MUTATED_FROM.label,
    detail: 'A specialisation of the parent. Heavier solid line.',
  },
  {
    type: 'RECOMBINED_FROM',
    label: EDGE_TYPE_META.RECOMBINED_FROM.label,
    detail: 'Two parents met. Double line.',
  },
  {
    type: 'TRANSFERRED_FROM',
    label: EDGE_TYPE_META.TRANSFERRED_FROM.label,
    detail: 'A capability crossed family lines. Long-dashed arc.',
  },
  {
    type: 'PROPOSED_TO',
    label: EDGE_TYPE_META.PROPOSED_TO.label,
    detail: 'An offer awaiting a decision. Short-dashed arc, open head.',
  },
  {
    type: 'ADOPTED_FROM',
    label: EDGE_TYPE_META.ADOPTED_FROM.label,
    detail: 'The offer was accepted. Thick solid arc.',
  },
  {
    type: 'REJECTED_FROM',
    label: EDGE_TYPE_META.REJECTED_FROM.label,
    detail: 'The offer was declined, and the record kept. Dotted arc.',
  },
];
