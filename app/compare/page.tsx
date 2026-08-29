import type { Metadata } from 'next';
import Link from 'next/link';
import { ComparisonMatrix } from '@/components/registry/ComparisonMatrix';
import { AccessionBadge } from '@/components/ui/AccessionBadge';
import { getComparison, listCompareOptions } from '@/lib/registry/compare';
import { pageMeta } from '@/lib/seo/metadata';

/**
 * The two-genome comparative view.
 *
 * Phylo.io compares two trees and highlights the correspondence between them.
 * The same question here is which capabilities each project carries and where
 * they agree, so the gene set is the axis rather than the file tree — a textual
 * diff of two forks that drifted for a year reports noise, while a capability
 * comparison reports the four things a maintainer actually wants: shared,
 * diverged, and unique to either side.
 */

export const metadata: Metadata = pageMeta({
  title: 'Compare genomes',
  description:
    'Side-by-side capability comparison between two project genomes: what is shared, what diverged, and what is unique to each. Compared by capability rather than by file, so projects in different languages can still be recognised as carrying the same gene.',
  path: '/compare',
});

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; b?: string }>;
}) {
  const { a, b } = await searchParams;
  const comparison = a && b ? getComparison(a, b) : null;

  if (!comparison) {
    return <Picker a={a} b={b} />;
  }

  const total = Object.values(comparison.counts).reduce((sum, value) => sum + value, 0);
  const unique = comparison.counts.onlyA + comparison.counts.onlyB;

  return (
    <div className="shell-wide py-12 md:py-16">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <p className="text-acid label">Comparative view</p>
        <Link
          href="/compare"
          className="text-faint hover:text-text-soft label transition-colors"
        >
          Change pair
        </Link>
      </div>

      {/* ================================================================= the pair */}
      <div className="mt-4 grid gap-6 md:grid-cols-2">
        {[comparison.a, comparison.b].map((genome, index) => (
          <div key={genome.accession} className="border-line border-t pt-4">
            <p className="text-faint label">{index === 0 ? 'Left' : 'Right'}</p>
            <h1 className="text-title mt-2">
              <Link href={`/project/${genome.accession}`} className="hover:text-acid transition-colors">
                {genome.name}
              </Link>
            </h1>
            <p className="text-muted mt-1 text-[14px]">{genome.tagline}</p>
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
              <AccessionBadge accession={genome.accession} />
              <span className="text-faint text-[12.5px]" data-numeric>
                Generation {genome.generation} · {genome.geneCount} capabilities ·{' '}
                {genome.license}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ========================================================== the relationship */}
      <p className="text-text-soft mt-8 max-w-[80ch] leading-relaxed">
        {comparison.relationship.summary}{' '}
        {comparison.relationship.ancestor && comparison.relationship.kind !== 'same' && (
          <>
            Capabilities they share are most likely inherited from{' '}
            <Link
              href={`/project/${comparison.relationship.ancestor.accession}`}
              className="text-acid hover:text-acid/80 transition-colors"
            >
              {comparison.relationship.ancestor.name}
            </Link>{' '}
            rather than arrived at twice — though the record says which, per capability, below.
          </>
        )}
      </p>

      <dl className="border-line mt-8 flex flex-wrap gap-x-10 gap-y-4 border-t pt-4">
        {[
          { label: 'Capabilities compared', value: total, hint: 'union of both' },
          {
            label: 'Identical allele',
            value: comparison.counts.same,
            hint: 'same content digest',
          },
          {
            label: 'Diverged',
            value: comparison.counts.diverged,
            hint: 'same gene, different allele',
          },
          { label: 'Unique to one side', value: unique, hint: 'absent from the other' },
          {
            label: 'Overlap',
            value: `${Math.round(comparison.jaccard * 100)}%`,
            hint: 'shared ÷ union',
          },
          {
            label: 'Shared share',
            value: `${Math.round(comparison.shared.a * 100)}% / ${Math.round(
              comparison.shared.b * 100,
            )}%`,
            hint: 'of each genome, by weight',
          },
        ].map((stat) => (
          <div key={stat.label} className="min-w-[9rem]">
            <dt className="text-muted label">{stat.label}</dt>
            <dd data-numeric className="mt-1 font-mono text-lg font-medium">
              {stat.value}
            </dd>
            <p className="text-faint mt-0.5 font-mono text-nano">{stat.hint}</p>
          </div>
        ))}
      </dl>

      {/* ================================================================= the matrix */}
      <div className="mt-10">
        <ComparisonMatrix comparison={comparison} />
      </div>

      <p className="text-faint border-line mt-12 max-w-[80ch] border-t pt-6 text-[13px] leading-relaxed">
        Compared by capability, not by file. Two projects can carry the same gene in different
        languages and be honestly described as sharing it, and a project can drop a capability
        without deleting a line — which is why absence here is recorded rather than inferred.
        &ldquo;Overlap&rdquo; counts genes, and &ldquo;shared share&rdquo; weights them, because a
        project can share most of its gene list while the shared genes account for little of it.
      </p>
    </div>
  );
}

/**
 * The empty state. Two lists rather than two dropdowns: the family is small
 * enough to show whole, and seeing the generations laid out is most of the point
 * of choosing a pair.
 */
function Picker({ a, b }: { a?: string; b?: string }) {
  const options = listCompareOptions();
  const chosen = [a, b].filter(Boolean).length;

  return (
    <div className="shell py-16">
      <p className="text-acid label">Compare</p>
      <h1 className="text-headline mt-3">Choose two genomes</h1>
      <p className="text-muted mt-4 max-w-[52ch] text-lead">
        A comparison answers one question: which capabilities do these two projects share, and where
        did they diverge?
      </p>

      {chosen === 1 && (
        <p aria-live="polite" className="text-amber mt-4 max-w-[60ch] text-[14px] leading-relaxed">
          One side is chosen. Pick the other to run the comparison.
        </p>
      )}

      <div className="mt-10 grid gap-8 sm:grid-cols-2">
        {(['a', 'b'] as const).map((slot) => (
          <div key={slot}>
            <p className="text-muted label border-line mb-3 border-b pb-2">
              {slot === 'a' ? 'First genome' : 'Second genome'}
            </p>
            <ul className="flex flex-col">
              {options.map((option) => {
                const other = slot === 'a' ? b : a;
                const selected = (slot === 'a' ? a : b) === option.accession;

                /* Selecting the same genome on both sides compares nothing, so
                   the row that would do it is inert rather than misleading. */
                const clash = other === option.accession;

                const next =
                  slot === 'a'
                    ? `/compare?a=${encodeURIComponent(option.accession)}${b ? `&b=${encodeURIComponent(b)}` : ''}`
                    : `/compare?${a ? `a=${encodeURIComponent(a)}&` : ''}b=${encodeURIComponent(option.accession)}`;

                return (
                  <li key={option.accession}>
                    {clash ? (
                      <p className="border-line text-faint flex items-baseline justify-between gap-3 border-b py-3">
                        <span className="text-[14.5px]">{option.name}</span>
                        <span className="label">already on the other side</span>
                      </p>
                    ) : (
                      <Link
                        href={next}
                        aria-current={selected ? 'true' : undefined}
                        className={`border-line hover:bg-panel-2 flex items-baseline justify-between gap-3 border-b py-3 transition-colors ${
                          selected ? 'text-acid' : ''
                        }`}
                      >
                        <span className="text-[14.5px]">{option.name}</span>
                        <span className="text-faint text-[12px]" data-numeric>
                          Gen {option.generation}
                        </span>
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
