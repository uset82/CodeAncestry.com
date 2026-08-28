'use client';

import Link from 'next/link';
import { useId, useState } from 'react';
import { cn } from '@/lib/cn';
import { diffAlleles, type AlleleDiffRow, type AlleleView } from '@/lib/registry/gene';

/**
 * The allele lineage: every variant of one capability, in the order it appeared,
 * with any two of them comparable side by side.
 *
 * Alleles form a DAG rather than a line — a variant can descend from more than
 * one predecessor — so the chain is drawn as a sequence with its parentage
 * stated on each step instead of pretending the history is linear.
 */

const VERDICT_META: Record<
  AlleleDiffRow['verdict'],
  { label: string; tone: string; glyph: string }
> = {
  same: { label: 'Same', tone: 'text-acid', glyph: '=' },
  diverged: { label: 'Diverged', tone: 'text-amber', glyph: '≠' },
  onlyA: { label: 'Only in A', tone: 'text-cyan', glyph: '◀' },
  onlyB: { label: 'Only in B', tone: 'text-cyan', glyph: '▶' },
  absent: { label: 'Neither', tone: 'text-faint', glyph: '—' },
};

export function AlleleLineage({ alleles, geneName }: { alleles: AlleleView[]; geneName: string }) {
  const current = alleles.find((allele) => allele.isCurrent) ?? alleles.at(-1);
  const [selected, setSelected] = useState(current?.accession ?? alleles[0]?.accession ?? '');
  const [against, setAgainst] = useState<string>('');
  const compareId = useId();

  const primary = alleles.find((allele) => allele.accession === selected) ?? alleles[0];
  const secondary = alleles.find((allele) => allele.accession === against) ?? null;

  if (!primary) return null;

  return (
    <div>
      {/* ------------------------------------------------------------- the chain */}
      <div
        className="flex flex-wrap items-stretch gap-x-1 gap-y-2"
        role="radiogroup"
        aria-label={`Alleles of ${geneName}`}
      >
        {alleles.map((allele, index) => (
          <span key={allele.accession} className="flex items-stretch gap-1">
            {index > 0 && (
              <span
                aria-hidden="true"
                className="text-faint self-center px-0.5 font-mono text-nano"
              >
                →
              </span>
            )}
            <button
              type="button"
              role="radio"
              aria-checked={allele.accession === primary.accession}
              onClick={() => setSelected(allele.accession)}
              className={cn(
                'rounded border px-2.5 py-1.5 text-left transition-colors',
                allele.accession === primary.accession
                  ? 'border-cyan/50 bg-cyan/10'
                  : 'border-line hover:border-line-strong',
              )}
            >
              <span
                className={cn(
                  'block font-mono text-[13px] font-semibold',
                  allele.accession === primary.accession ? 'text-cyan' : 'text-text-soft',
                )}
              >
                {allele.version}
              </span>
              <span className="text-faint block font-mono text-nano">
                allele {allele.number}
                {allele.isCurrent && ' · current'}
              </span>
            </button>
          </span>
        ))}
      </div>

      {/* ------------------------------------------------------- compare control */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <label htmlFor={compareId} className="text-faint font-mono text-nano">
          Compare {primary.version} with
        </label>
        <select
          id={compareId}
          value={against}
          onChange={(event) => setAgainst(event.target.value)}
          className="border-line bg-panel-2 text-text-soft focus-visible:outline-acid rounded border px-2 py-1 font-mono text-[12px] focus-visible:outline-2"
        >
          <option value="">nothing — show its own record</option>
          {alleles
            .filter((allele) => allele.accession !== primary.accession)
            .map((allele) => (
              <option key={allele.accession} value={allele.accession}>
                {allele.version} (allele {allele.number})
              </option>
            ))}
        </select>
      </div>

      {secondary ? (
        <AlleleDiff a={primary} b={secondary} />
      ) : (
        <AlleleDetail allele={primary} />
      )}
    </div>
  );
}

/* ==========================================================================
   One allele
   ========================================================================== */

function AlleleDetail({ allele }: { allele: AlleleView }) {
  return (
    <article className="border-line bg-panel mt-5 rounded-lg border p-4 sm:p-5">
      <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h3 className="text-[17px] leading-tight font-semibold tracking-tight">{allele.label}</h3>
        <p className="text-faint font-mono text-nano">{allele.accession}</p>
      </header>

      <p className="text-text-soft mt-2.5 max-w-[74ch] text-[14.5px] leading-relaxed">
        {allele.summary}
      </p>

      <dl className="border-line/70 mt-4 grid gap-x-8 gap-y-3.5 border-t pt-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Version" value={allele.version} />
        <Field label="Language" value={allele.language} />
        <Field label="First observed" value={allele.firstObservedAt} />
        <Field label="Content digest" value={allele.digest} mono />
        <Field
          label="Origin project"
          value={allele.originProject?.name ?? 'unrecorded'}
          href={allele.originProject ? `/project/${allele.originProject.accession}` : undefined}
        />
        <Field
          label="Descends from"
          value={
            allele.parents.length === 0
              ? 'nothing — the original'
              : allele.parents.map((parent) => parent.version).join(', ')
          }
        />
      </dl>

      {allele.producedBy && (
        <p className="text-muted mt-4 text-[13.5px] leading-relaxed">
          Produced by{' '}
          <Link
            href={`/mutation/${allele.producedBy.accession}`}
            className="text-violet hover:text-violet/80 font-mono transition-colors"
          >
            {allele.producedBy.shortId}
          </Link>{' '}
          — {allele.producedBy.title}.
        </p>
      )}

      {/* ------------------------------------------------------------ interfaces */}
      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <List label="Inputs" items={allele.interfaces.inputs} />
        <List label="Outputs" items={allele.interfaces.outputs} />
      </div>

      {allele.tests.length > 0 && (
        <div className="mt-5">
          <List label="Test suites" items={allele.tests} mono />
        </div>
      )}

      {/* --------------------------------------------------------------- anchors */}
      {allele.anchors.length > 0 && (
        <div className="mt-5">
          <p className="text-faint font-mono text-nano uppercase">Loci</p>
          <ul className="mt-2 space-y-2">
            {allele.anchors.map((anchor) => (
              <li
                key={`${anchor.repository}:${anchor.path}`}
                className="border-line/70 bg-panel-2/50 rounded border p-3"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <code className="text-text-soft font-mono text-[12.5px] break-all">
                    {anchor.path}
                    {anchor.range && `:${anchor.range[0]}–${anchor.range[1]}`}
                  </code>
                  {anchor.url ? (
                    <a
                      href={anchor.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-cyan hover:text-cyan/80 shrink-0 font-mono text-nano transition-colors"
                    >
                      Jump to code ↗
                    </a>
                  ) : (
                    <span className="text-faint shrink-0 font-mono text-nano">
                      No web view for {anchor.repository.split(':')[0]}
                    </span>
                  )}
                </div>
                <p className="text-faint mt-1.5 font-mono text-nano">
                  {anchor.repository} · commit:{anchor.commit.slice(0, 10)}
                  {anchor.symbols.length > 0 && ` · ${anchor.symbols.join(', ')}`}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* -------------------------------------------------------------- carriers */}
      {allele.carriers.length > 0 && (
        <div className="mt-5">
          <p className="text-faint font-mono text-nano uppercase">
            Carried by {allele.carriers.length}{' '}
            {allele.carriers.length === 1 ? 'genome' : 'genomes'}
          </p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {allele.carriers.map((carrier) => (
              <li key={carrier.accession}>
                <Link
                  href={`/project/${carrier.accession}`}
                  className="border-line bg-panel-2 text-text-soft hover:border-line-strong block rounded-sm border px-2 py-1 font-mono text-nano transition-colors"
                >
                  {carrier.name} · Gen {carrier.generation}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}

/* ==========================================================================
   Two alleles
   ========================================================================== */

function AlleleDiff({ a, b }: { a: AlleleView; b: AlleleView }) {
  const rows = diffAlleles(a, b);
  const diverged = rows.filter((row) => row.verdict === 'diverged').length;
  const same = rows.filter((row) => row.verdict === 'same').length;
  const oneSided = rows.filter(
    (row) => row.verdict === 'onlyA' || row.verdict === 'onlyB',
  ).length;

  return (
    <div className="mt-5">
      <p className="text-muted text-[13.5px] leading-relaxed">
        Of {rows.length} fields, {same} are identical and {diverged} diverged
        {oneSided > 0 && `, with ${oneSided} present on one side only`}. A diverged field is not a
        defect: it is how two projects can carry the same capability and still differ in
        implementation.
      </p>

      <div className="border-line bg-panel mt-3 overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[560px] border-collapse text-left">
          <caption className="sr-only">
            {a.version} compared with {b.version}, field by field.
          </caption>
          <thead>
            <tr className="border-line bg-panel-2/70 border-b">
              <th scope="col" className="text-faint px-3 py-2 font-mono text-nano uppercase">
                Field
              </th>
              <th scope="col" className="text-cyan px-3 py-2 font-mono text-nano uppercase">
                A · {a.version}
              </th>
              <th scope="col" className="text-violet px-3 py-2 font-mono text-nano uppercase">
                B · {b.version}
              </th>
              <th scope="col" className="text-faint px-3 py-2 font-mono text-nano uppercase">
                Verdict
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const meta = VERDICT_META[row.verdict];
              return (
                <tr key={row.field} className="border-line/60 border-b last:border-0">
                  <th
                    scope="row"
                    className="text-text-soft px-3 py-2.5 align-top text-[13px] font-medium"
                  >
                    {row.field}
                  </th>
                  <Cell values={row.a} highlight={row.verdict === 'diverged'} />
                  <Cell values={row.b} highlight={row.verdict === 'diverged'} />
                  <td className="px-3 py-2.5 align-top">
                    <span className={cn('font-mono text-nano uppercase', meta.tone)}>
                      <span aria-hidden="true" className="mr-1">
                        {meta.glyph}
                      </span>
                      {meta.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Cell({ values, highlight }: { values: string[]; highlight: boolean }) {
  // "None" rather than "not declared": for a field like Carried by, the field is
  // declared and simply empty, which means nobody carries it — a fact, not a gap.
  if (values.length === 0) {
    return <td className="text-faint px-3 py-2.5 align-top font-mono text-[12px]">none</td>;
  }

  return (
    <td
      className={cn(
        'px-3 py-2.5 align-top font-mono text-[12px] break-all',
        highlight ? 'text-text' : 'text-muted',
      )}
    >
      {values.map((value) => (
        <span key={value} className="block">
          {value}
        </span>
      ))}
    </td>
  );
}

/* ==========================================================================
   Small parts
   ========================================================================== */

function Field({
  label,
  value,
  href,
  mono = false,
}: {
  label: string;
  value: string;
  href?: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-faint font-mono text-nano uppercase">{label}</dt>
      <dd
        className={cn(
          'text-text-soft mt-1 text-[13.5px]',
          mono && 'font-mono text-[12px] break-all',
        )}
      >
        {href ? (
          <Link href={href} className="hover:text-acid transition-colors">
            {value}
          </Link>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}

function List({ label, items, mono = false }: { label: string; items: string[]; mono?: boolean }) {
  return (
    <div>
      <p className="text-faint font-mono text-nano uppercase">{label}</p>
      {items.length === 0 ? (
        <p className="text-faint mt-1.5 text-[13px]">None declared.</p>
      ) : (
        <ul className="mt-1.5 space-y-1">
          {items.map((item) => (
            <li
              key={item}
              className={cn(
                'text-text-soft text-[13.5px] leading-snug',
                mono && 'font-mono text-[12px] break-all',
              )}
            >
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
