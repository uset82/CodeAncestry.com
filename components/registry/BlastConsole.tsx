'use client';

import Link from 'next/link';
import { useId, useState, useTransition } from 'react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import type { BlastHit } from '@/lib/registry/search';
import { Bar } from './ResultSkeleton';

export type BlastExample = { label: string; snippet: string };

/**
 * CodeBLAST: paste an implementation, get the capabilities in the registry that
 * do the same job.
 *
 * The interface is modelled on NCBI BLAST — a query box, an identity score per
 * hit, and a breakdown of *which* facets drove the alignment — because the
 * useful part of BLAST was never the number, it was being able to argue with it.
 */
export function BlastConsole({
  examples,
  search,
}: {
  examples: readonly BlastExample[];
  /** Server action performing the fingerprint comparison. */
  search: (snippet: string) => Promise<BlastHit[]>;
}) {
  const inputId = useId();
  const [snippet, setSnippet] = useState('');
  const [hits, setHits] = useState<BlastHit[] | null>(null);
  const [submitted, setSubmitted] = useState('');
  const [pending, startTransition] = useTransition();

  const run = (source: string) => {
    const trimmed = source.trim();
    if (!trimmed) return;
    setSubmitted(trimmed);
    startTransition(async () => {
      setHits(await search(trimmed));
    });
  };

  return (
    /* On one column the results sit directly under the query box; the examples
       drop below them, because once you have hits the examples stop mattering. */
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-14">
      <div className="lg:col-start-1 lg:row-start-1">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            run(snippet);
          }}
        >
          <label htmlFor={inputId} className="text-muted font-mono text-nano uppercase">
            Query sequence
          </label>
          <textarea
            id={inputId}
            value={snippet}
            onChange={(event) => setSnippet(event.target.value)}
            rows={14}
            spellCheck={false}
            placeholder={'Paste a function, a class, a module…\n\nAny language. Structure matters more than syntax.'}
            className="border-line bg-panel-2 focus:border-line-strong placeholder:text-faint mt-2.5 w-full resize-y rounded-lg border p-4 font-mono text-[13px] leading-relaxed transition-colors"
          />

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={pending || snippet.trim().length === 0}>
              {pending ? 'Aligning…' : 'Run CodeBLAST'}
            </Button>
            {snippet && (
              <button
                type="button"
                onClick={() => {
                  setSnippet('');
                  setHits(null);
                  setSubmitted('');
                }}
                className="text-muted hover:text-text font-mono text-nano uppercase"
              >
                Clear
              </button>
            )}
            <span className="text-faint font-mono text-nano tabular-nums uppercase">
              {snippet.trim().length} chars
            </span>
          </div>
        </form>
      </div>

      <div className="border-line/60 border-t pt-6 lg:col-start-1 lg:row-start-2 lg:border-t-0 lg:pt-0">
        <p className="text-muted font-mono text-nano uppercase">Or start from an example</p>
        <ul className="mt-3 flex flex-col gap-2">
          {examples.map((example) => (
            <li key={example.label}>
              <button
                type="button"
                onClick={() => {
                  setSnippet(example.snippet);
                  run(example.snippet);
                }}
                className="border-line bg-panel/40 hover:border-line-strong hover:bg-panel w-full rounded-md border px-3.5 py-3 text-left transition-colors"
              >
                <span className="text-text-soft text-[14px]">{example.label}</span>
                <span aria-hidden="true" className="text-faint float-right text-[13px]">
                  →
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="min-w-0 lg:col-start-2 lg:row-span-2 lg:row-start-1">
        {pending && (
          <div>
            <span role="status" className="text-muted font-mono text-nano uppercase">
              Comparing fingerprints…
            </span>
            <div className="mt-4 flex flex-col gap-3" aria-hidden="true">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="border-line bg-panel/40 rounded-lg border p-4">
                  <Bar className="w-40" />
                  <Bar className="mt-3 h-1.5 w-full" />
                  <div className="mt-4 flex gap-2">
                    <Bar className="w-16" />
                    <Bar className="w-16" />
                    <Bar className="w-16" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!pending && hits === null && <BlastIdle />}

        {!pending && hits !== null && hits.length === 0 && <BlastEmpty query={submitted} />}

        {!pending && hits !== null && hits.length > 0 && (
          <div>
            <div className="border-line flex flex-wrap items-baseline justify-between gap-3 border-b pb-3">
              <h2 className="text-[15px] font-semibold tracking-tight">
                Aligned capabilities
                <span className="text-faint ml-2.5 font-mono text-nano tabular-nums">
                  {hits.length} hits
                </span>
              </h2>
              <span className="text-faint font-mono text-nano uppercase">
                Sorted by identity
              </span>
            </div>

            <ul className="mt-4 flex flex-col gap-3">
              {hits.map((hit) => (
                <BlastHitCard key={hit.alleleAccession} hit={hit} />
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function BlastHitCard({ hit }: { hit: BlastHit }) {
  const [open, setOpen] = useState(false);
  const identity = Math.round(hit.identity * 100);
  const tone =
    identity >= 60 ? 'text-acid' : identity >= 35 ? 'text-cyan' : 'text-muted';

  return (
    <li className="border-line bg-panel/40 rounded-lg border p-4 md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <h3 className="text-[16.5px] leading-tight font-semibold tracking-[-0.025em]">
            <Link href={hit.href} className="hover:text-acid transition-colors">
              {hit.geneName}
            </Link>
          </h3>
          <p className="text-muted mt-1 font-mono text-[11.5px]">
            {hit.alleleLabel} ·{' '}
            {hit.carriedBy === 0
              ? // An ancestral allele every descendant has since replaced.
                'superseded everywhere'
              : `carried by ${hit.carriedBy} ${hit.carriedBy === 1 ? 'genome' : 'genomes'}`}
          </p>
        </div>

        <div className="text-right">
          <span className={cn('font-mono text-[22px] leading-none tabular-nums', tone)}>
            {identity}%
          </span>
          <p className="text-faint mt-1 font-mono text-nano uppercase">identity</p>
        </div>
      </div>

      <div className="bg-panel-3 mt-3.5 h-1.5 overflow-hidden rounded-full">
        <div
          className={cn(
            'h-full rounded-full',
            identity >= 60 ? 'bg-acid' : identity >= 35 ? 'bg-cyan' : 'bg-muted',
          )}
          style={{ width: `${identity}%` }}
        />
      </div>

      <nav aria-label="Capability ontology path" className="mt-3.5 flex flex-wrap items-center gap-1">
        {hit.ontology.map((step, i) => (
          <span key={step.term} className="flex items-center gap-1">
            {i > 0 && (
              <span aria-hidden="true" className="text-faint text-[10px]">
                /
              </span>
            )}
            <span className="text-muted font-mono text-nano">{step.label}</span>
          </span>
        ))}
      </nav>

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="text-text-soft hover:text-text mt-4 font-mono text-nano uppercase underline decoration-dotted"
      >
        {open ? 'Hide' : 'Show'} fingerprint basis
      </button>

      {open && (
        <table className="mt-3.5 w-full border-collapse text-left">
          <caption className="text-faint mb-2 text-left text-[12.5px]">
            Which facets of the fingerprint produced this alignment.
          </caption>
          <thead>
            <tr className="text-faint font-mono text-nano uppercase">
              <th scope="col" className="border-line border-b pb-1.5 font-normal">
                Facet
              </th>
              <th scope="col" className="border-line border-b pb-1.5 text-right font-normal">
                Weight
              </th>
              <th scope="col" className="border-line border-b pb-1.5 text-right font-normal">
                Score
              </th>
              <th scope="col" className="border-line w-[38%] border-b pb-1.5 font-normal" />
            </tr>
          </thead>
          <tbody>
            {hit.basis.map((facet) => (
              <tr key={facet.facet} className="border-line/50 border-b last:border-0">
                <th scope="row" className="text-text-soft py-2 text-[13px] font-normal">
                  {facet.label}
                </th>
                <td className="text-faint py-2 text-right font-mono text-[12px] tabular-nums">
                  {facet.weight.toFixed(2)}
                </td>
                <td className="text-text-soft py-2 text-right font-mono text-[12px] tabular-nums">
                  {facet.score.toFixed(2)}
                </td>
                <td className="py-2 pl-3">
                  <span
                    aria-hidden="true"
                    className="bg-panel-3 block h-1 overflow-hidden rounded-full"
                  >
                    <span
                      className="bg-cyan/70 block h-full rounded-full"
                      style={{ width: `${facet.score * 100}%` }}
                    />
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </li>
  );
}

function BlastIdle() {
  return (
    <div className="border-line-strong rounded-xl border border-dashed p-6 md:p-8">
      <p className="text-muted font-mono text-nano uppercase">How this differs from grep</p>
      <p className="mt-4 text-[19px] leading-snug font-semibold tracking-[-0.02em] text-balance">
        You are not searching for text. You are searching for a job the code does.
      </p>
      <p className="text-muted mt-4 text-[14.5px] leading-relaxed">
        Two implementations can share no identifiers, no language and no dependencies, and still be
        the same capability. CodeBLAST compares fingerprints rather than characters, then tells you
        which facet of the fingerprint carried the match — so you can disagree with it.
      </p>

      <dl className="border-line/60 mt-6 grid gap-3 border-t pt-5 sm:grid-cols-2">
        {[
          ['AST structure', 'Shape of the control and data flow, names stripped.'],
          ['Public contracts', 'What goes in, what comes out, what can throw.'],
          ['Semantic embedding', 'Vector proximity of documentation and identifiers.'],
          ['Import graph', 'The neighbourhood the code lives in.'],
          ['Test shape', 'What the suite asserts about behaviour.'],
          ['Dependency closure', 'Transitive packages the capability needs.'],
        ].map(([term, detail]) => (
          <div key={term}>
            <dt className="text-text-soft text-[13.5px] font-semibold">{term}</dt>
            <dd className="text-faint mt-0.5 text-[13px] leading-relaxed">{detail}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function BlastEmpty({ query }: { query: string }) {
  return (
    <div className="border-line-strong rounded-xl border border-dashed p-8 text-center md:p-12">
      <p className="text-muted font-mono text-nano uppercase">No alignment</p>
      <p className="mx-auto mt-4 max-w-[42ch] text-[19px] leading-snug font-semibold tracking-[-0.02em] text-balance">
        Nothing in the seeded registry does this job.
      </p>
      <p className="text-muted mx-auto mt-4 max-w-[50ch] text-[14.5px] leading-relaxed">
        That is a real answer, not a failure. The registry holds sixteen capabilities from one family
        of eight projects; most code in the world has no relative here yet. A hit would have been
        more suspicious than a miss.
      </p>
      <p className="text-faint mt-5 font-mono text-[12px] break-all">
        {query.slice(0, 120)}
        {query.length > 120 && '…'}
      </p>
    </div>
  );
}
