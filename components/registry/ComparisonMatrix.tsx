'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { EvidenceChipRow } from '@/components/ui/EvidenceChip';
import { cn } from '@/lib/cn';
import type { CompareRow, Comparison, SideView, Verdict } from '@/lib/registry/compare';
import { INHERITANCE_META } from '@/lib/schema/vocabulary';

/**
 * The two-genome capability matrix.
 *
 * Phylo.io's idea, applied to a table rather than a tree: the value is not in
 * either column on its own but in the correspondence between them, so hovering
 * or selecting anything lights up its counterpart on the other side and dims
 * everything unrelated. Reading across a row is the whole interaction.
 *
 * Rows are ordered divergences-first inside each capability domain, because a
 * reader comparing two forks is looking for where they parted, not for the
 * ninety percent they still agree on.
 */

const VERDICT_META: Record<
  Verdict,
  { label: string; short: string; tone: string; border: string; glyph: string }
> = {
  same: {
    label: 'Same allele',
    short: 'Same',
    tone: 'text-acid',
    border: 'border-acid/40',
    glyph: '=',
  },
  diverged: {
    label: 'Diverged',
    short: 'Diverged',
    tone: 'text-amber',
    border: 'border-amber/40',
    glyph: '≠',
  },
  onlyA: {
    label: 'Only on the left',
    short: 'Unique',
    tone: 'text-cyan',
    border: 'border-cyan/40',
    glyph: '◀',
  },
  onlyB: {
    label: 'Only on the right',
    short: 'Unique',
    tone: 'text-cyan',
    border: 'border-cyan/40',
    glyph: '▶',
  },
};

const FILTERS: { value: Verdict | 'all'; label: string }[] = [
  { value: 'all', label: 'Everything' },
  { value: 'diverged', label: 'Diverged' },
  { value: 'onlyA', label: 'Only left' },
  { value: 'onlyB', label: 'Only right' },
  { value: 'same', label: 'Identical' },
];

export function ComparisonMatrix({ comparison }: { comparison: Comparison }) {
  const [filter, setFilter] = useState<Verdict | 'all'>('all');
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  const groups = useMemo(
    () =>
      comparison.groups
        .map((group) => {
          const rows =
            filter === 'all' ? group.rows : group.rows.filter((row) => row.verdict === filter);

          /* The divergence hint is only meaningful on the unfiltered view. Under
             a verdict filter the row count already says it, and quoting the
             group's full count next to a filtered list reads as a mismatch. */
          const noun = rows.length === 1 ? 'capability' : 'capabilities';
          const hint =
            filter === 'all' && group.counts.diverged > 0
              ? `${rows.length} ${noun}, ${group.counts.diverged} diverged`
              : `${rows.length} ${noun}`;

          return { ...group, rows, hint };
        })
        .filter((group) => group.rows.length > 0),
    [comparison.groups, filter],
  );

  const active = selected ?? hovered;
  const selectedRow = selected
    ? comparison.groups.flatMap((group) => group.rows).find((row) => row.gene.accession === selected)
    : null;

  const shown = groups.reduce((total, group) => total + group.rows.length, 0);

  return (
    <div>
      {/* ================================================================ filters */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((option) => {
            const count =
              option.value === 'all'
                ? Object.values(comparison.counts).reduce((sum, value) => sum + value, 0)
                : comparison.counts[option.value];
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={filter === option.value}
                disabled={count === 0}
                onClick={() => setFilter(option.value)}
                className={cn(
                  'rounded border px-2.5 py-1 font-mono text-nano uppercase transition-colors',
                  count === 0
                    ? 'border-line text-faint cursor-not-allowed'
                    : filter === option.value
                      ? 'border-cyan/50 bg-cyan/10 text-cyan'
                      : 'border-line text-muted hover:border-line-strong hover:text-text-soft',
                )}
              >
                {option.label}
                <span className="ml-1.5 tabular-nums opacity-70">{count}</span>
              </button>
            );
          })}
        </div>

        {selected && (
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="text-faint hover:text-text-soft font-mono text-nano uppercase transition-colors"
          >
            Clear selection
          </button>
        )}
      </div>

      <p aria-live="polite" className="text-faint mt-2 font-mono text-nano">
        {shown} of {Object.values(comparison.counts).reduce((sum, value) => sum + value, 0)}{' '}
        capabilities shown
      </p>

      {/* ================================================================== matrix */}
      <div
        className="border-line bg-panel mt-4 overflow-x-auto rounded-lg border"
        onMouseLeave={() => setHovered(null)}
      >
        <table className="w-full min-w-[760px] border-collapse text-left">
          <caption className="sr-only">
            Capability comparison between {comparison.a.name} and {comparison.b.name}, grouped by
            capability domain. Each row states whether both carry the capability and whether the
            implementations match.
          </caption>
          <thead>
            <tr className="border-line bg-panel-2/70 border-b">
              <th scope="col" className="text-faint px-3 py-2 font-mono text-nano uppercase">
                Capability
              </th>
              <th scope="col" className="text-faint px-3 py-2 font-mono text-nano uppercase">
                {comparison.a.name}
              </th>
              <th scope="col" className="text-faint px-3 py-2 text-center font-mono text-nano uppercase">
                Verdict
              </th>
              <th scope="col" className="text-faint px-3 py-2 font-mono text-nano uppercase">
                {comparison.b.name}
              </th>
            </tr>
          </thead>

          {groups.map((group) => (
            <tbody key={group.term}>
              <tr className="bg-panel-2/40">
                <th
                  scope="colgroup"
                  colSpan={4}
                  className="border-line/60 border-y px-3 py-1.5 text-left font-normal"
                >
                  <span className="text-text-soft font-mono text-[12px] uppercase">
                    {group.label}
                  </span>
                  <span className="text-faint ml-3 font-mono text-nano">{group.hint}</span>
                </th>
              </tr>

              {group.rows.map((row) => (
                <Row
                  key={row.gene.accession}
                  row={row}
                  dimmed={active !== null && active !== row.gene.accession}
                  selected={selected === row.gene.accession}
                  onHover={setHovered}
                  onSelect={(accession) =>
                    setSelected((current) => (current === accession ? null : accession))
                  }
                />
              ))}
            </tbody>
          ))}
        </table>
      </div>

      {/* ============================================================ correspondence */}
      {selectedRow ? (
        <Correspondence row={selectedRow} comparison={comparison} />
      ) : (
        <p className="text-faint mt-4 max-w-[74ch] text-[13px] leading-relaxed">
          Select a capability to see the two sides in full. Hovering a row dims the rest so the pair
          reads as one statement rather than two lists.
        </p>
      )}
    </div>
  );
}

function Row({
  row,
  dimmed,
  selected,
  onHover,
  onSelect,
}: {
  row: CompareRow;
  dimmed: boolean;
  selected: boolean;
  onHover: (accession: string | null) => void;
  onSelect: (accession: string) => void;
}) {
  const meta = VERDICT_META[row.verdict];

  return (
    <tr
      onMouseEnter={() => onHover(row.gene.accession)}
      className={cn(
        /* De-emphasis stops at 60%: a selection persists, and dimming further
           would push the rows a reader is not looking at below AA contrast. */
        'border-line/60 border-b transition-opacity last:border-0',
        dimmed && 'opacity-60',
        selected && 'bg-cyan/5',
      )}
    >
      <th scope="row" className="px-3 py-2.5 align-top font-normal">
        <button
          type="button"
          aria-pressed={selected}
          onClick={() => onSelect(row.gene.accession)}
          className="focus-visible:outline-acid text-left focus-visible:outline-2"
        >
          <span className="text-text-soft hover:text-text text-[13.5px] font-semibold transition-colors">
            {row.gene.name}
          </span>
          <span className="text-faint block font-mono text-nano">{row.gene.term}</span>
        </button>
      </th>

      <Cell side={row.a} absent={row.verdict === 'onlyB'} />

      <td className="px-3 py-2.5 text-center align-top">
        <span className={cn('font-mono text-nano uppercase', meta.tone)}>
          <span aria-hidden="true" className="mr-1">
            {meta.glyph}
          </span>
          {meta.short}
        </span>
        {row.verdict === 'diverged' && row.distance > 0 && (
          <span className="text-faint block font-mono text-nano">
            {row.distance} {row.distance === 1 ? 'allele' : 'alleles'} apart
          </span>
        )}
      </td>

      <Cell side={row.b} absent={row.verdict === 'onlyA'} />
    </tr>
  );
}

function Cell({ side, absent }: { side: SideView | null; absent: boolean }) {
  if (!side) {
    return (
      <td className="px-3 py-2.5 align-top">
        <span className="text-faint font-mono text-[12px]" title="Not carried by this genome">
          <span aria-hidden="true">—</span>
          <span className="sr-only">Not carried</span>
        </span>
      </td>
    );
  }

  const inheritance = INHERITANCE_META[side.inheritance];

  return (
    <td className={cn('px-3 py-2.5 align-top', absent && 'opacity-60')}>
      <span className="text-cyan font-mono text-[12.5px]">{side.allele.version}</span>
      <span className="text-faint block font-mono text-nano">
        {inheritance.label.toLowerCase()}
        {side.origin && ` from ${side.origin}`}
        {side.expression !== 'active' && ` · ${side.expression}`}
      </span>
      <span className="text-muted block font-mono text-nano tabular-nums">
        {Math.round(side.weight * 100)}% of genome · {side.tier}
      </span>
    </td>
  );
}

/**
 * The selected pair, side by side. This is where the two columns stop being a
 * table and become a claim about one capability, so it repeats the allele detail
 * rather than making the reader hold the row in their head while they scroll.
 */
function Correspondence({ row, comparison }: { row: CompareRow; comparison: Comparison }) {
  const meta = VERDICT_META[row.verdict];

  return (
    <div className={cn('mt-5 rounded-lg border bg-panel-2/50 p-4 md:p-5', meta.border)}>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <Link
          href={`/gene/${row.gene.accession}`}
          className="hover:text-acid text-[16px] font-semibold transition-colors"
        >
          {row.gene.name}
        </Link>
        <span className={cn('font-mono text-nano uppercase', meta.tone)}>{meta.label}</span>
        <span className="text-faint font-mono text-nano">{row.gene.accession}</span>
      </div>

      <p className="text-muted mt-2 max-w-[76ch] text-[13.5px] leading-relaxed">
        {row.verdict === 'same' &&
          `Both carry allele ${row.a?.allele.version}. The implementations are the same content digest, so a change to one is a change both would recognise.`}
        {row.verdict === 'diverged' &&
          `${comparison.a.name} carries ${row.a?.allele.version} and ${comparison.b.name} carries ${row.b?.allele.version}. Same capability, different implementation — which is what makes the pair a candidate for a mutation rather than a merge.`}
        {row.verdict === 'onlyA' &&
          `Only ${comparison.a.name} carries this. Absence is recorded rather than inferred, so this is a capability ${comparison.b.name} does not claim, not one we failed to detect.`}
        {row.verdict === 'onlyB' &&
          `Only ${comparison.b.name} carries this. Absence is recorded rather than inferred, so this is a capability ${comparison.a.name} does not claim, not one we failed to detect.`}
      </p>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <SidePanel name={comparison.a.name} accession={comparison.a.accession} side={row.a} />
        <SidePanel name={comparison.b.name} accession={comparison.b.accession} side={row.b} />
      </div>
    </div>
  );
}

function SidePanel({
  name,
  accession,
  side,
}: {
  name: string;
  accession: string;
  side: SideView | null;
}) {
  return (
    <div className="border-line bg-void rounded-md border p-3">
      <Link
        href={`/project/${accession}`}
        className="text-text-soft hover:text-acid text-[13.5px] font-semibold transition-colors"
      >
        {name}
      </Link>

      {!side ? (
        <p className="text-faint mt-2 text-[13px] leading-relaxed">
          Does not carry this capability.
        </p>
      ) : (
        <dl className="mt-2 space-y-1.5">
          <Field label="Allele" value={`${side.allele.version} · allele ${side.allele.number}`} />
          <Field label="Label" value={side.allele.label} />
          <Field label="Inheritance" value={INHERITANCE_META[side.inheritance].label} />
          <Field label="Expression" value={side.expression} />
          <Field label="Share of genome" value={`${Math.round(side.weight * 100)}%`} />
          <Field label="Confidence" value={side.confidence.toFixed(2)} />
          <div className="flex flex-wrap items-baseline gap-x-2">
            <dt className="text-faint w-[112px] shrink-0 font-mono text-nano uppercase">
              Evidence
            </dt>
            <dd>
              <EvidenceChipRow codes={side.evidence} />
            </dd>
          </div>
        </dl>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-2">
      <dt className="text-faint w-[112px] shrink-0 font-mono text-nano uppercase">{label}</dt>
      <dd className="text-text-soft font-mono text-[12.5px]">{value}</dd>
    </div>
  );
}
