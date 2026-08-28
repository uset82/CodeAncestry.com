import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AlleleLineage } from '@/components/registry/AlleleLineage';
import { EvidenceChipRow } from '@/components/ui/EvidenceChip';
import { StatRail } from '@/components/ui/Panel';
import { getGeneRecord } from '@/lib/registry/gene';
import { INHERITANCE_META } from '@/lib/schema/vocabulary';

/**
 * The capability gene record.
 *
 * Read as a UniProt entry rather than a file view: identity and ontology class
 * first, then the alleles that have implemented the capability over time, then
 * the projects carrying each one. The gene is the stable thing; the code that
 * implements it is an anchor that can move without the capability changing.
 */

/* Not prerendered — an accession contains a colon, which cannot be a filename
   on Windows. See the note in app/project/[accession]/page.tsx. */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ accession: string }>;
}): Promise<Metadata> {
  const { accession } = await params;
  const record = getGeneRecord(decodeURIComponent(accession));
  if (!record) return { title: 'Gene not found' };

  return {
    title: `${record.name} — ${record.accession}`,
    description: `Capability gene ${record.accession}: ${record.description} Carried by ${record.stats.carriers} project genomes across ${record.stats.alleles} alleles.`,
  };
}

export default async function GenePage({
  params,
}: {
  params: Promise<{ accession: string }>;
}) {
  const { accession } = await params;
  const record = getGeneRecord(decodeURIComponent(accession));
  if (!record) notFound();

  const currentVersion =
    record.alleles.find((allele) => allele.isCurrent)?.version ?? record.alleles.at(-1)?.version;

  return (
    <div className="shell py-10 md:py-14">
      {/* ============================================================== identity */}
      <header>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <p className="text-cyan font-mono text-micro uppercase">Capability gene</p>
          <p className="text-faint font-mono text-micro">{record.accession}</p>
        </div>

        <h1 className="text-headline mt-3 text-balance">{record.name}</h1>

        {/* ------------------------------------------------- ontology breadcrumb */}
        <nav aria-label="Capability ontology" className="mt-4">
          <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
            {record.ontology.path.map((step, index) => (
              <li key={step.term} className="flex items-center gap-1.5">
                {index > 0 && (
                  <span aria-hidden="true" className="text-faint font-mono text-nano">
                    ›
                  </span>
                )}
                <Link
                  href={`/explore?q=${encodeURIComponent(step.term)}`}
                  className={
                    index === record.ontology.path.length - 1
                      ? 'text-cyan font-mono text-[12px]'
                      : 'text-muted hover:text-text-soft font-mono text-[12px] transition-colors'
                  }
                >
                  {step.label}
                </Link>
              </li>
            ))}
          </ol>
        </nav>

        <p className="text-text-soft mt-4 max-w-[72ch] leading-relaxed">{record.description}</p>

        {record.ontology.tags.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-1.5">
            {record.ontology.tags.map((tag) => (
              <li
                key={tag}
                className="border-line bg-panel-2 text-muted rounded-sm border px-2 py-[3px] font-mono text-nano"
              >
                {tag}
              </li>
            ))}
          </ul>
        )}
      </header>

      <StatRail
        className="mt-9"
        stats={[
          { label: 'Carried by', value: record.stats.carriers, hint: 'genomes' },
          { label: 'Alleles', value: record.stats.alleles, hint: `current ${currentVersion ?? '—'}` },
          { label: 'Mutations', value: record.stats.mutations },
          { label: 'Generations', value: record.stats.generationsSpanned, hint: 'spanned' },
          { label: 'License', value: record.license },
          {
            label: 'Boundary confidence',
            value: record.confidence.semanticBoundary.toFixed(2),
            hint: 'semantic',
          },
        ]}
      />

      {/* ---------------------------------------------------------------- origin */}
      <p className="text-muted mt-6 max-w-[80ch] text-[14px] leading-relaxed">
        First observed in{' '}
        {record.origin.projectName ? (
          <Link href={`/explore?q=${encodeURIComponent(record.origin.project)}`} className="text-acid hover:text-acid/80 transition-colors">
            {record.origin.projectName}
          </Link>
        ) : (
          record.origin.project
        )}{' '}
        at commit:{record.origin.commit.slice(0, 10)} on {record.origin.at}, with origin confidence{' '}
        {record.confidence.origin.toFixed(2)}. That confidence is about the claim of where the
        capability started, not about the quality of the code.
      </p>

      {/* ================================================================ alleles */}
      <section className="mt-12">
        <h2 className="text-[22px] leading-tight font-semibold tracking-tight">Allele lineage</h2>
        <p className="text-muted mt-2 max-w-[74ch] leading-relaxed">
          Each allele is a variant of the same capability. Select one for its own record, or compare
          two to see exactly where they diverge.
        </p>
        <div className="mt-5">
          <AlleleLineage alleles={record.alleles} geneName={record.name} />
        </div>
      </section>

      {/* =============================================================== carriers */}
      <section className="mt-14">
        <h2 className="text-[22px] leading-tight font-semibold tracking-tight">
          Carried by {record.carriers.length}{' '}
          {record.carriers.length === 1 ? 'genome' : 'genomes'}
        </h2>
        <p className="text-muted mt-2 max-w-[74ch] leading-relaxed">
          Which projects express this capability, which variant each carries, and how much of the
          project it accounts for.
        </p>

        <div className="border-line bg-panel mt-5 overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <caption className="sr-only">
              Genomes carrying {record.name}, with allele, inheritance mode, weight and evidence.
            </caption>
            <thead>
              <tr className="border-line bg-panel-2/70 border-b">
                {['Genome', 'Gen', 'Allele', 'Inheritance', 'Share', 'Confidence', 'Evidence'].map(
                  (heading) => (
                    <th
                      key={heading}
                      scope="col"
                      className="text-faint px-3 py-2 font-mono text-nano uppercase"
                    >
                      {heading}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {record.carriers.map((carrier) => {
                const inheritance = INHERITANCE_META[carrier.inheritance];
                return (
                  <tr key={carrier.accession} className="border-line/60 border-b last:border-0">
                    <th scope="row" className="px-3 py-3 align-top">
                      <Link
                        href={`/project/${carrier.accession}`}
                        className="hover:text-acid text-[13.5px] font-semibold transition-colors"
                      >
                        {carrier.name}
                      </Link>
                      <span className="text-faint block font-mono text-nano">
                        {carrier.accession}
                      </span>
                    </th>
                    <td className="text-muted px-3 py-3 align-top font-mono text-[12px]">
                      {carrier.generation}
                    </td>
                    <td className="px-3 py-3 align-top">
                      <span className="text-cyan font-mono text-[12.5px]">
                        {carrier.allele.version}
                      </span>
                      <span className="text-faint block font-mono text-nano">
                        allele {carrier.allele.number}
                      </span>
                    </td>
                    <td className="px-3 py-3 align-top">
                      <span className="text-text-soft font-mono text-[12px]">
                        {inheritance.label}
                      </span>
                      {carrier.origin && (
                        <span className="text-faint block font-mono text-nano">
                          from {carrier.origin}
                        </span>
                      )}
                      {carrier.expression !== 'active' && (
                        <span className="text-amber block font-mono text-nano">
                          {carrier.expression}
                        </span>
                      )}
                    </td>
                    <td className="text-muted px-3 py-3 align-top font-mono text-[12px] tabular-nums">
                      {Math.round(carrier.weight * 100)}%
                    </td>
                    <td className="text-muted px-3 py-3 align-top font-mono text-[12px] tabular-nums">
                      {carrier.confidence.toFixed(2)}
                    </td>
                    <td className="px-3 py-3 align-top">
                      <EvidenceChipRow codes={carrier.evidence} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* ================================================================ spread */}
      <section className="mt-14">
        <h2 className="text-[22px] leading-tight font-semibold tracking-tight">
          Descent through the family
        </h2>
        <p className="text-muted mt-2 max-w-[74ch] leading-relaxed">
          How far the capability has travelled, one row per generation. A generation with no carrier
          would break the chain, and would be visible here as a gap.
        </p>

        <ol className="mt-5 space-y-3">
          {record.spread.map((step) => (
            <li key={step.generation} className="flex flex-wrap items-start gap-x-4 gap-y-2">
              <span className="border-line bg-panel-2 text-muted w-[104px] shrink-0 rounded-sm border px-2 py-1.5 font-mono text-nano">
                Generation {step.generation}
              </span>
              <ul className="flex flex-wrap gap-1.5">
                {step.carriers.map((carrier) => (
                  <li key={carrier.accession}>
                    <Link
                      href={`/project/${carrier.accession}`}
                      className="border-line bg-panel text-text-soft hover:border-line-strong block rounded-sm border px-2 py-1.5 font-mono text-nano transition-colors"
                    >
                      {carrier.name}
                      <span className="text-faint ml-1.5">{carrier.version}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </section>

      {/* ============================================================= mutations */}
      {record.mutations.length > 0 && (
        <section className="mt-14">
          <h2 className="text-[22px] leading-tight font-semibold tracking-tight">
            Mutations on this gene
          </h2>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {record.mutations.map((mutation) => (
              <li key={mutation.accession}>
                <Link
                  href={`/mutation/${mutation.accession}`}
                  className="border-line bg-panel hover:border-line-strong block h-full rounded-lg border p-4 transition-colors"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <span className="text-violet font-mono text-[13px] font-semibold">
                      {mutation.shortId}
                    </span>
                    <span className="text-faint font-mono text-nano uppercase">
                      {mutation.state}
                    </span>
                  </div>
                  <p className="mt-2 text-[14.5px] leading-snug font-medium">{mutation.title}</p>
                  <p className="text-muted mt-2 font-mono text-nano">
                    {mutation.fromAllele} → {mutation.toAllele} · {mutation.kind} ·{' '}
                    {mutation.proposedAt}
                  </p>
                  <p className="text-faint mt-1 font-mono text-nano">
                    Adopted by {mutation.adopted}, declined by {mutation.rejected}, confidence{' '}
                    {mutation.confidence.toFixed(2)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ============================================================== evidence */}
      {record.annotations.length > 0 && (
        <section className="mt-14">
          <h2 className="text-[22px] leading-tight font-semibold tracking-tight">
            Evidence for the annotations
          </h2>
          <p className="text-muted mt-2 max-w-[74ch] leading-relaxed">
            Every statement the registry makes about this gene, with the record that backs it. An
            annotation with no evidence would not be shown at all.
          </p>

          <ul className="mt-5 space-y-4">
            {record.annotations.map((annotation) => (
              <li
                key={annotation.term}
                className="border-line bg-panel rounded-lg border p-4 sm:p-5"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                  <p className="text-cyan font-mono text-[12px]">{annotation.term}</p>
                  <p className="text-faint font-mono text-nano uppercase">
                    {annotation.tier} · confidence {annotation.confidence.toFixed(2)}
                  </p>
                </div>

                <p className="text-text-soft mt-2 max-w-[74ch] text-[14.5px] leading-relaxed">
                  {annotation.statement}
                </p>

                <ul className="border-line/70 mt-3.5 space-y-2 border-t pt-3.5">
                  {annotation.evidence.map((item) => (
                    <li key={item.accession} className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <EvidenceChipRow codes={[item.code]} />
                      <span className="text-text-soft text-[13.5px]">
                        {item.summary}
                        {item.count !== null && (
                          <span className="text-muted font-mono"> ({item.count})</span>
                        )}
                      </span>
                      <span className="text-faint ml-auto font-mono text-nano">
                        {item.observedAt}
                        {item.digest && ` · ${item.digest}`}
                      </span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="border-line/70 text-faint mt-14 max-w-[80ch] border-t pt-5 text-[13px] leading-relaxed">
        A gene here is a capability, not a file. &ldquo;{record.name}&rdquo; is the thing that
        persists; the paths under Loci are where it currently lives and can change without the
        capability changing. Every figure on this page is read from the seeded KEYLIT fixtures.
      </p>
    </div>
  );
}
