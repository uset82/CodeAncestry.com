'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { cn } from '@/lib/cn';
import {
  FREQUENCY_META,
  type Frequency,
  type Pangenome,
  type PangenomeCell,
} from '@/lib/registry/pangenome';
import { INHERITANCE_META } from '@/lib/schema/vocabulary';

/**
 * The family pangenome heatmap.
 *
 * It is a real table, not a canvas or a grid of divs, because the honest version
 * of a heatmap is one where every cell can be read as a value: the colour is a
 * summary for scanning, the number inside it is the datum, and a screen reader
 * gets a properly headed cell either way. That removes the need for a separate
 * accessible fallback — the fallback is the markup.
 *
 * Absence is drawn as absence rather than as zero. A capability a project never
 * had and one it has but never touched are different facts, and a single cold
 * colour for both would erase the distinction.
 */

const FREQUENCY_TONE: Record<Frequency, string> = {
  core: 'text-acid border-acid/40',
  shell: 'text-cyan border-cyan/40',
  cloud: 'text-violet border-violet/40',
};

type Selection = { row: number; column: number } | null;

export function PangenomeHeatmap({ pangenome }: { pangenome: Pangenome }) {
  const [frequency, setFrequency] = useState<Frequency | 'all'>('all');
  const [selected, setSelected] = useState<Selection>(null);

  const rows = useMemo(
    () =>
      pangenome.rows
        .map((row, index) => ({ row, index }))
        .filter(({ row }) => frequency === 'all' || row.frequency === frequency),
    [pangenome.rows, frequency],
  );

  const active = selected ? pangenome.rows[selected.row] : null;
  const activeCell = active?.cells[selected?.column ?? -1] ?? null;
  const activeColumn = selected ? pangenome.columns[selected.column] : null;

  return (
    <div>
      {/* ================================================================= legend */}
      <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-4">
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            aria-pressed={frequency === 'all'}
            onClick={() => setFrequency('all')}
            className={cn(
              'rounded border px-2.5 py-1 font-mono text-nano uppercase transition-colors',
              frequency === 'all'
                ? 'border-line-strong text-text bg-panel-2'
                : 'border-line text-muted hover:border-line-strong hover:text-text-soft',
            )}
          >
            All {pangenome.rows.length}
          </button>
          {(['core', 'shell', 'cloud'] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={frequency === value}
              disabled={pangenome.counts[value] === 0}
              onClick={() => setFrequency(value)}
              title={FREQUENCY_META[value].detail}
              className={cn(
                'rounded border px-2.5 py-1 font-mono text-nano uppercase transition-colors',
                pangenome.counts[value] === 0
                  ? 'border-line text-faint cursor-not-allowed'
                  : frequency === value
                    ? cn('bg-panel-2', FREQUENCY_TONE[value])
                    : 'border-line text-muted hover:border-line-strong hover:text-text-soft',
              )}
            >
              {FREQUENCY_META[value].label} {pangenome.counts[value]}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-faint font-mono text-nano uppercase">Mutation events</span>
          <span className="text-faint font-mono text-nano tabular-nums">0</span>
          <span aria-hidden="true" className="flex">
            {[0, 0.25, 0.5, 0.75, 1].map((step) => (
              <span
                key={step}
                className="border-line h-3.5 w-5 border-y border-r first:border-l"
                style={{ backgroundColor: heatColor(step) }}
              />
            ))}
          </span>
          <span className="text-faint font-mono text-nano tabular-nums">{pangenome.peak}</span>
        </div>
      </div>

      <p className="text-faint mt-3 max-w-[80ch] text-[13px] leading-relaxed">
        A cell is hot when that project has done something to that capability — authored a change to
        it, adopted one, or refused one. Blank cells with a dash are capabilities the project does
        not carry, which is a different fact from carrying one and never touching it.
      </p>

      {/* ================================================================= matrix */}
      <div className="border-line bg-panel mt-5 overflow-x-auto rounded-lg border">
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">
            Family pangenome: {pangenome.rows.length} capabilities against{' '}
            {pangenome.columns.length} project genomes. Each cell gives the number of mutation
            events that project recorded against that capability, or a dash where the project does
            not carry it.
          </caption>
          <thead>
            <tr className="border-line bg-panel-2/70 border-b">
              <th scope="col" className="text-faint px-3 py-2 font-mono text-nano uppercase">
                Capability
              </th>
              <th scope="col" className="text-faint px-2 py-2 text-center font-mono text-nano uppercase">
                Freq
              </th>
              {pangenome.columns.map((column) => (
                <th
                  key={column.accession}
                  scope="col"
                  className="text-faint px-1 py-2 text-center align-bottom font-mono text-nano"
                >
                  <span className="text-text-soft block leading-tight">{column.shortName}</span>
                  <span className="block tabular-nums">gen {column.generation}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ row, index }) => (
              <tr key={row.gene.accession} className="border-line/60 border-b last:border-0">
                <th scope="row" className="px-3 py-1.5 align-middle font-normal">
                  <Link
                    href={`/gene/${row.gene.accession}`}
                    className="text-text-soft hover:text-acid text-[13px] font-semibold transition-colors"
                  >
                    {row.gene.name}
                  </Link>
                  <span className="text-faint block font-mono text-nano">
                    {row.carriers} of {pangenome.columns.length} · {row.mutations}{' '}
                    {row.mutations === 1 ? 'mutation' : 'mutations'}
                  </span>
                </th>

                <td className="px-2 py-1.5 text-center align-middle">
                  <span
                    title={FREQUENCY_META[row.frequency].detail}
                    className={cn(
                      'rounded-sm border px-1.5 py-[2px] font-mono text-nano uppercase',
                      FREQUENCY_TONE[row.frequency],
                    )}
                  >
                    {FREQUENCY_META[row.frequency].label}
                  </span>
                </td>

                {row.cells.map((cell, column) => (
                  <Cell
                    key={pangenome.columns[column]?.accession ?? column}
                    cell={cell}
                    gene={row.gene.name}
                    project={pangenome.columns[column]?.shortName ?? ''}
                    selected={selected?.row === index && selected?.column === column}
                    onSelect={() =>
                      setSelected((current) =>
                        current?.row === index && current?.column === column
                          ? null
                          : { row: index, column },
                      )
                    }
                  />
                ))}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-line bg-panel-2/70 border-t">
              <th scope="row" className="text-faint px-3 py-2 font-mono text-nano uppercase">
                Events per project
              </th>
              <td />
              {pangenome.columns.map((column) => (
                <td
                  key={column.accession}
                  className="text-text-soft px-1 py-2 text-center font-mono text-nano tabular-nums"
                >
                  {column.activity}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>

      {/* ================================================================= readout */}
      {active && activeCell && activeColumn ? (
        <Readout
          gene={active.gene}
          frequency={active.frequency}
          column={activeColumn}
          cell={activeCell}
          onClear={() => setSelected(null)}
        />
      ) : (
        <p className="text-faint mt-4 max-w-[74ch] text-[13px] leading-relaxed">
          Select a cell for the full record behind it: which allele the project carries, how it
          arrived, and how the mutation events break down between authored, adopted and refused.
        </p>
      )}
    </div>
  );
}

/** Sequential single-hue ramp. One hue, because the value is one magnitude. */
function heatColor(heat: number): string {
  if (heat <= 0) return 'transparent';
  /* Floor at 12% so a single event is visible without reading as noise. */
  const mix = Math.round(12 + heat * 68);
  return `color-mix(in oklab, var(--color-cyan) ${mix}%, transparent)`;
}

function Cell({
  cell,
  gene,
  project,
  selected,
  onSelect,
}: {
  cell: PangenomeCell;
  gene: string;
  project: string;
  selected: boolean;
  onSelect: () => void;
}) {
  if (!cell.present) {
    return (
      <td className="border-line-soft border-l p-0 text-center align-middle">
        <span
          className="text-faint block px-1 py-2 font-mono text-nano"
          title={`${project} does not carry ${gene}`}
        >
          <span aria-hidden="true">—</span>
          <span className="sr-only">Not carried</span>
        </span>
      </td>
    );
  }

  const label = [
    `${project}, ${gene}`,
    `carries ${cell.allele?.version ?? 'an allele'}`,
    cell.activity === 0
      ? 'no mutation events'
      : `${cell.activity} mutation ${cell.activity === 1 ? 'event' : 'events'}`,
    cell.pending > 0 && `${cell.pending} awaiting a decision`,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <td className="border-line-soft border-l p-0 text-center align-middle">
      <button
        type="button"
        aria-pressed={selected}
        aria-label={label}
        onClick={onSelect}
        style={{ backgroundColor: heatColor(cell.heat) }}
        className={cn(
          'focus-visible:outline-acid relative block w-full px-1 py-2 font-mono text-[11.5px] tabular-nums transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2',
          selected && 'ring-acid ring-2 ring-inset',
          cell.activity > 0 ? 'text-text' : 'text-faint',
        )}
      >
        {cell.activity > 0 ? cell.activity : '·'}
        {cell.pending > 0 && (
          <span
            aria-hidden="true"
            className="bg-amber absolute top-[3px] right-[3px] size-[5px] rounded-full"
          />
        )}
      </button>
    </td>
  );
}

function Readout({
  gene,
  frequency,
  column,
  cell,
  onClear,
}: {
  gene: { accession: string; name: string; term: string };
  frequency: Frequency;
  column: { accession: string; name: string; generation: number };
  cell: PangenomeCell;
  onClear: () => void;
}) {
  return (
    <div className="border-line bg-panel-2/50 mt-5 rounded-lg border p-4 md:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <p className="text-[15px] font-semibold">
          <Link href={`/project/${column.accession}`} className="hover:text-acid transition-colors">
            {column.name}
          </Link>
          <span className="text-faint mx-2 font-normal">×</span>
          <Link href={`/gene/${gene.accession}`} className="hover:text-acid transition-colors">
            {gene.name}
          </Link>
        </p>
        <button
          type="button"
          onClick={onClear}
          className="text-faint hover:text-text-soft font-mono text-nano uppercase transition-colors"
        >
          Clear
        </button>
      </div>

      <p aria-live="polite" className="text-muted mt-2 max-w-[78ch] text-[13.5px] leading-relaxed">
        {cell.activity === 0
          ? `${column.name} carries ${cell.allele?.version} and has recorded nothing against it. A quiet cell is not a problem — a capability that works and needs no change should be quiet.`
          : `${cell.activity} mutation ${cell.activity === 1 ? 'event' : 'events'} recorded here: ${[
              cell.originated > 0 && `${cell.originated} authored in this project`,
              cell.adopted > 0 && `${cell.adopted} adopted from a relative`,
              cell.rejected > 0 && `${cell.rejected} refused`,
            ]
              .filter(Boolean)
              .join(', ')}.`}
        {cell.pending > 0 &&
          ` ${cell.pending} ${cell.pending === 1 ? 'is' : 'are'} offered and undecided.`}
      </p>

      <dl className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Allele" value={`${cell.allele?.version} · allele ${cell.allele?.number}`} />
        <Field
          label="Inheritance"
          value={cell.inheritance ? INHERITANCE_META[cell.inheritance].label : '—'}
        />
        <Field label="Share of genome" value={`${Math.round(cell.weight * 100)}%`} />
        <Field label="Evidence tier" value={cell.tier ?? '—'} />
        <Field label="Frequency class" value={FREQUENCY_META[frequency].label} />
        <Field label="Authored here" value={String(cell.originated)} />
        <Field label="Adopted" value={String(cell.adopted)} />
        <Field label="Refused" value={String(cell.rejected)} />
      </dl>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-faint font-mono text-nano uppercase">{label}</dt>
      <dd className="text-text-soft mt-0.5 font-mono text-[12.5px]">{value}</dd>
    </div>
  );
}
