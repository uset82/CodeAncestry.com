'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { cn } from '@/lib/cn';
import type { FamilyTree, PropagationEvent } from '@/lib/registry/tree';
import { OUTCOME_META } from '@/lib/registry/tree';
import { LINEAGE_STATE_META } from '@/lib/schema/vocabulary';

/**
 * The propagation record as an arc diagram.
 *
 * Projects sit on a timeline in the order they were created. Each arc is one
 * mutation being offered to one project. Arcs above the axis went downstream to a
 * descendant; arcs below went upstream to an ancestor — which is the direction
 * the whole registry exists to make possible.
 */

const WIDTH = 940;
const HEIGHT = 400;
/** Arcs bow both ways around the axis, so the labels get their own band below. */
const AXIS_Y = 176;
const LABEL_BAND = 306;

const OUTCOME_STROKE: Record<PropagationEvent['outcome'], string> = {
  adopted: 'var(--color-acid)',
  proposed: 'var(--color-violet)',
  rejected: 'var(--color-rose)',
  quarantined: 'var(--color-amber)',
};

const OUTCOME_DASH: Record<PropagationEvent['outcome'], string | undefined> = {
  adopted: undefined,
  proposed: '5 5',
  rejected: '2 4',
  quarantined: '3 3',
};

export function ArcsView({ family }: { family: FamilyTree }) {
  const [active, setActive] = useState<string | null>(null);
  const [outcomeFilter, setOutcomeFilter] = useState<PropagationEvent['outcome'] | 'all'>('all');

  const { positions, ordered } = useMemo(() => {
    const ordered = [...family.nodes].sort(
      (a, b) => a.createdAt.localeCompare(b.createdAt) || a.generation - b.generation,
    );
    const step = (WIDTH - 120) / Math.max(1, ordered.length - 1);
    const positions = new Map(ordered.map((node, i) => [node.accession, 60 + i * step]));
    return { positions, ordered };
  }, [family.nodes]);

  /** Labels drop the family name; the page heading already established it. */
  const shortName = (name: string) =>
    name.startsWith(`${family.name} `) ? name.slice(family.name.length + 1) : name;

  const events = useMemo(
    () =>
      family.propagation.filter(
        (event) => outcomeFilter === 'all' || event.outcome === outcomeFilter,
      ),
    [family.propagation, outcomeFilter],
  );

  const counts = useMemo(() => {
    const tally = { adopted: 0, proposed: 0, rejected: 0, quarantined: 0 };
    for (const event of family.propagation) tally[event.outcome] += 1;
    return tally;
  }, [family.propagation]);

  const focused = events.find((event) => event.id === active) ?? null;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-faint font-mono text-nano uppercase">Outcome</span>
        <FilterChip
          active={outcomeFilter === 'all'}
          onClick={() => setOutcomeFilter('all')}
          label="All"
          count={family.propagation.length}
        />
        {(['adopted', 'proposed', 'rejected', 'quarantined'] as const).map((outcome) => (
          <FilterChip
            key={outcome}
            active={outcomeFilter === outcome}
            onClick={() => setOutcomeFilter(outcome)}
            label={OUTCOME_META[outcome].label}
            count={counts[outcome]}
            tone={LINEAGE_STATE_META[OUTCOME_META[outcome].state].tone}
          />
        ))}
      </div>

      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={`${events.length} propagation events between ${ordered.length} projects, ordered by creation date. Arcs above the axis travelled to descendants, arcs below travelled to ancestors.`}
        className="border-line bg-panel/30 block h-[clamp(300px,44vh,420px)] w-full rounded-xl border"
      >
        <line
          x1={40}
          x2={WIDTH - 40}
          y1={AXIS_Y}
          y2={AXIS_Y}
          stroke="var(--color-line)"
          strokeWidth={1}
        />

        <text
          x={44}
          y={AXIS_Y - 128}
          fill="var(--color-faint)"
          className="font-mono"
          fontSize={9}
          letterSpacing="0.14em"
        >
          ↑ TO DESCENDANTS
        </text>
        <text
          x={WIDTH - 44}
          y={AXIS_Y + 122}
          textAnchor="end"
          fill="var(--color-faint)"
          className="font-mono"
          fontSize={9}
          letterSpacing="0.14em"
        >
          ↓ TO ANCESTORS
        </text>
        <text
          x={WIDTH - 44}
          y={AXIS_Y - 128}
          textAnchor="end"
          fill="var(--color-faint)"
          className="font-mono"
          fontSize={9}
          letterSpacing="0.14em"
        >
          PROJECTS BY DATE FOUNDED →
        </text>

        <g>
          {events.map((event) => {
            const from = positions.get(event.from);
            const to = positions.get(event.to);
            if (from === undefined || to === undefined) return null;

            const span = Math.abs(to - from);
            // Upstream offers bow downward so direction is legible at a glance.
            const upward = event.span > 0;
            // Capped so the deepest arc still clears the label band.
            const lift = Math.min(128, 34 + span * 0.42) * (upward ? -1 : 1);
            const dimmed = active !== null && active !== event.id;

            return (
              <path
                key={event.id}
                d={`M${from},${AXIS_Y} Q${(from + to) / 2},${AXIS_Y + lift * 1.7} ${to},${AXIS_Y}`}
                fill="none"
                stroke={OUTCOME_STROKE[event.outcome]}
                strokeDasharray={OUTCOME_DASH[event.outcome]}
                strokeWidth={active === event.id ? 2.6 : 1.5}
                opacity={dimmed ? 0.1 : active === event.id ? 1 : 0.55}
                strokeLinecap="round"
                onPointerEnter={() => setActive(event.id)}
                onPointerLeave={() => setActive(null)}
                className="transition-opacity duration-200"
              >
                <title>{`${event.shortId}: ${event.title} — ${OUTCOME_META[event.outcome].label}`}</title>
              </path>
            );
          })}
        </g>

        <g>
          {ordered.map((node, i) => {
            const x = positions.get(node.accession)!;
            const involved =
              focused !== null && (focused.from === node.accession || focused.to === node.accession);
            // Two staggered rows: eight labels on one line would collide.
            const labelY = LABEL_BAND + (i % 2) * 24;

            return (
              <g key={node.accession}>
                <line
                  x1={x}
                  x2={x}
                  y1={AXIS_Y + 6}
                  y2={labelY - 11}
                  stroke={involved ? 'var(--color-acid)' : 'var(--color-line)'}
                  strokeWidth={1}
                  strokeDasharray="2 4"
                  opacity={involved ? 0.8 : 0.5}
                />
                <circle
                  cx={x}
                  cy={AXIS_Y}
                  r={involved ? 6 : 4}
                  fill={involved ? 'var(--color-acid)' : 'var(--color-panel-3)'}
                  stroke={involved ? 'var(--color-acid)' : 'var(--color-line-strong)'}
                  strokeWidth={1.4}
                />
                <text
                  x={x}
                  y={labelY}
                  textAnchor={i === 0 ? 'start' : i === ordered.length - 1 ? 'end' : 'middle'}
                  fill={involved ? 'var(--color-text)' : 'var(--color-muted)'}
                  fontSize={11}
                  fontWeight={involved ? 600 : 400}
                >
                  {shortName(node.name)}
                </text>
                <text
                  x={x}
                  y={labelY + 13}
                  textAnchor={i === 0 ? 'start' : i === ordered.length - 1 ? 'end' : 'middle'}
                  fill="var(--color-faint)"
                  className="font-mono"
                  fontSize={8.5}
                  letterSpacing="0.1em"
                >
                  {node.createdAt.slice(0, 7)}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      <div className="border-line/60 mt-5 min-h-[92px] border-t pt-4">
        {focused ? (
          <div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <code className="text-violet font-mono text-[12px]">{focused.shortId}</code>
              <span
                className={cn(
                  'font-mono text-nano uppercase',
                  LINEAGE_STATE_META[OUTCOME_META[focused.outcome].state].tone,
                )}
              >
                {OUTCOME_META[focused.outcome].label}
              </span>
              <span className="text-faint font-mono text-nano">{focused.at}</span>
              <span className="text-faint font-mono text-nano uppercase">
                {focused.span > 0
                  ? `${focused.span} generation${focused.span === 1 ? '' : 's'} downstream`
                  : focused.span < 0
                    ? `${Math.abs(focused.span)} generation${
                        Math.abs(focused.span) === 1 ? '' : 's'
                      } upstream`
                    : 'same generation'}
              </span>
            </div>
            <p className="mt-2 text-[16px] font-semibold tracking-[-0.02em]">
              <Link href={`/mutation/${focused.mutation}`} className="hover:text-acid">
                {focused.title}
              </Link>
            </p>
            <p className="text-muted mt-1 text-[13.5px]">
              {family.nodes.find((n) => n.accession === focused.from)?.name}
              <span aria-hidden="true" className="mx-2">
                →
              </span>
              {family.nodes.find((n) => n.accession === focused.to)?.name}
            </p>
          </div>
        ) : (
          <p className="text-muted text-[14.5px] leading-relaxed">
            {counts.adopted} adopted, {counts.proposed} still awaiting a decision, {counts.rejected}{' '}
            declined, {counts.quarantined} quarantined. Hover an arc to read the mutation.
            <br />
            <span className="text-faint text-[13px]">
              Nothing here moved on its own. Every arc ends at a decision.
            </span>
          </p>
        )}
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  count,
  tone,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  tone?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'flex items-baseline gap-1.5 rounded-sm border px-2 py-1 font-mono text-[11px] transition-colors',
        active
          ? 'border-acid/40 bg-acid/10 text-text'
          : 'border-line bg-panel-2 text-muted hover:border-line-strong hover:text-text',
      )}
    >
      <span className={active ? undefined : tone}>{label}</span>
      <span className="text-faint tabular-nums">{count}</span>
    </button>
  );
}
