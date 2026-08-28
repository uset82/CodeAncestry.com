import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DecisionConsole } from '@/components/registry/DecisionConsole';
import { ProvenanceViewer } from '@/components/registry/ProvenanceViewer';
import { EvidenceChipRow } from '@/components/ui/EvidenceChip';
import { FitnessVector } from '@/components/ui/FitnessVector';
import { StatRail } from '@/components/ui/Panel';
import { StateBadge } from '@/components/ui/StateBadge';
import { getMutationRecord, type DecisionView } from '@/lib/registry/mutation';
import { getProvenanceForMutation } from '@/lib/registry/provenance';

/**
 * The mutation record, read as a variant interpretation report.
 *
 * The order of the page is the order of the argument: what changed, what the
 * evidence is, what it measurably did, who it applies to, and only then the
 * decision. Putting the buttons last is deliberate — a registry whose adopt
 * button sits above its evidence is a registry that expects nobody to read.
 */

/* Not prerendered — an accession contains a colon, which cannot be a filename
   on Windows. See the note in app/project/[accession]/page.tsx. */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ accession: string }>;
}): Promise<Metadata> {
  const { accession } = await params;
  const record = getMutationRecord(decodeURIComponent(accession));
  if (!record) return { title: 'Mutation not found' };

  return {
    title: `${record.shortId} ${record.title} — ${record.accession}`,
    description: `${record.summary} State: ${record.stateLabel}. Adopted by ${record.adopted.length}, declined by ${record.rejected.length}.`,
  };
}

export default async function MutationPage({
  params,
}: {
  params: Promise<{ accession: string }>;
}) {
  const { accession } = await params;
  const record = getMutationRecord(decodeURIComponent(accession));
  if (!record) notFound();

  const passed = record.checklist.filter((item) => item.passed).length;
  const reachedRung = record.ladder.filter((rung) => rung.reached).at(-1);
  /*
   * Decide on behalf of someone who still has a decision to make. Offering an
   * Adopt button to a genome that already adopted would be nonsense, and the
   * origin is the last resort rather than the first.
   */
  const decidingFor = record.offered[0] ?? record.undecided[0] ?? record.origin;
  const provenance = getProvenanceForMutation(record.accession);

  return (
    <div className="shell py-10 md:py-14">
      {/* ============================================================== identity */}
      <header>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <p className="text-violet font-mono text-micro uppercase">Mutation</p>
          <p className="text-faint font-mono text-micro">{record.accession}</p>
          <StateBadge state={record.lineageState} className="ml-auto" />
        </div>

        <div className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <p className="text-violet font-mono text-[18px] font-semibold">{record.shortId}</p>
          <span className="text-faint font-mono text-nano uppercase">{record.kind}</span>
        </div>

        <h1 className="text-headline mt-2 text-balance">{record.title}</h1>
        <p className="text-text-soft mt-4 max-w-[72ch] leading-relaxed">{record.summary}</p>

        {/* --------------------------------------------------- the change in one line */}
        {record.gene && record.from && record.to && (
          <p className="border-line/70 text-muted mt-6 border-t pt-4 text-[14.5px] leading-relaxed">
            Changes{' '}
            <Link
              href={`/gene/${record.gene.accession}`}
              className="text-cyan hover:text-cyan/80 font-medium transition-colors"
            >
              {record.gene.name}
            </Link>{' '}
            from allele {record.from.number} ({record.from.version} — {record.from.label}) to allele{' '}
            {record.to.number} ({record.to.version} — {record.to.label}). Proposed{' '}
            {record.proposedAt}
            {record.proposer && (
              <>
                {' '}
                by{' '}
                <Link
                  href={`/agent/${record.proposer.accession}`}
                  className="text-amber hover:text-amber/80 font-medium transition-colors"
                >
                  {record.proposer.displayName}
                </Link>{' '}
                <span className="font-mono text-[12.5px]">
                  ({record.proposer.provider}, identity {record.proposer.verification})
                </span>
              </>
            )}
            {record.origin && (
              <>
                {' '}
                in{' '}
                <Link
                  href={`/project/${record.origin.accession}`}
                  className="text-acid hover:text-acid/80 font-medium transition-colors"
                >
                  {record.origin.name}
                </Link>
              </>
            )}
            .
          </p>
        )}
      </header>

      <StatRail
        className="mt-9"
        stats={[
          { label: 'Stage', value: record.stateLabel, hint: record.terminal ? 'terminal' : 'in flight' },
          { label: 'Evidence gates', value: `${passed}/${record.checklist.length}`, hint: 'cleared' },
          { label: 'Confidence', value: record.confidence.toFixed(2), hint: 'proposer' },
          { label: 'Adopted by', value: record.adopted.length },
          { label: 'Declined by', value: record.rejected.length },
          {
            label: 'Symbols changed',
            value: record.change.symbolsChanged,
            hint: `${record.change.apiBreaks} API breaks`,
          },
        ]}
      />

      {/* ========================================================= trust ladder */}
      <section className="mt-12">
        <h2 className="text-[22px] leading-tight font-semibold tracking-tight">
          How far up the trust ladder
        </h2>
        <p className="text-muted mt-2 max-w-[74ch] leading-relaxed">
          Each rung is a claim that has actually been checked, and they are climbed in order — a
          later check passing while an earlier one has not does not earn the rung. This mutation has
          reached <strong className="text-text font-semibold">{reachedRung?.rung}</strong>.
        </p>

        <ol className="mt-5 space-y-px">
          {record.ladder.map((rung, index) => (
            <li
              key={rung.rung}
              className={
                rung.reached
                  ? 'border-line bg-panel flex flex-wrap items-baseline gap-x-4 gap-y-1 border-l-2 border-l-acid/60 px-4 py-2.5'
                  : 'border-line/50 flex flex-wrap items-baseline gap-x-4 gap-y-1 border-l-2 border-l-transparent px-4 py-2.5'
              }
            >
              <span
                className={
                  rung.reached
                    ? 'text-acid w-6 shrink-0 font-mono text-nano'
                    : 'text-faint w-6 shrink-0 font-mono text-nano'
                }
              >
                {rung.reached ? '✓' : String(index + 1).padStart(2, '0')}
              </span>
              <span
                className={
                  rung.reached
                    ? 'text-text w-[190px] shrink-0 text-[14px] font-medium'
                    : 'text-faint w-[190px] shrink-0 text-[14px]'
                }
              >
                {rung.rung}
              </span>
              <span
                className={
                  rung.reached
                    ? 'text-text-soft text-[13.5px] leading-snug'
                    : 'text-faint text-[13.5px] leading-snug'
                }
              >
                {rung.detail}
              </span>
              {!rung.trusted && (
                <span className="text-amber ml-auto font-mono text-nano uppercase">
                  Not trust on its own
                </span>
              )}
            </li>
          ))}
        </ol>
      </section>

      {/* ====================================================== evidence checklist */}
      <section className="mt-14">
        <h2 className="text-[22px] leading-tight font-semibold tracking-tight">Evidence checklist</h2>
        <p className="text-muted mt-2 max-w-[74ch] leading-relaxed">
          The six gates a mutation clears before it can be offered onward. Each one states what
          passing it establishes, because &ldquo;tests passed&rdquo; means nothing without knowing
          whose tests.
        </p>

        <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
          {record.checklist.map((item) => (
            <li
              key={item.key}
              className={
                item.passed
                  ? 'border-acid/30 bg-acid/5 rounded-lg border p-4'
                  : 'border-line bg-panel rounded-lg border p-4'
              }
            >
              <div className="flex items-baseline gap-2">
                <span
                  aria-hidden="true"
                  className={item.passed ? 'text-acid font-mono' : 'text-rose font-mono'}
                >
                  {item.passed ? '✓' : '✗'}
                </span>
                <p className="text-[14.5px] font-semibold">{item.label}</p>
                <span className="sr-only">{item.passed ? 'cleared' : 'not cleared'}</span>
                <span className="text-faint ml-auto font-mono text-nano">{item.rung}</span>
              </div>
              <p className="text-muted mt-1.5 text-[13.5px] leading-relaxed">{item.meaning}</p>
            </li>
          ))}
        </ul>

        {record.evidence.length > 0 && (
          <ul className="border-line bg-panel mt-5 divide-y divide-line/60 rounded-lg border">
            {record.evidence.map((item) => (
              <li key={item.accession} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-4 py-3">
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
        )}
      </section>

      {/* ============================================================== phenotype */}
      <section className="mt-14">
        <h2 className="text-[22px] leading-tight font-semibold tracking-tight">
          Measured phenotype
        </h2>
        <p className="text-muted mt-2 max-w-[74ch] leading-relaxed">
          What the change did when it ran, against what it did before. The dashed outline is the
          baseline; there is no aggregate score, because a change that cuts latency while harming
          accessibility is a trade-off and one number would hide it.
        </p>
        <div className="border-line bg-panel mt-5 rounded-lg border p-4 sm:p-6">
          <FitnessVector
            scores={record.fitness.scores}
            baseline={record.fitness.baseline}
            deltas={record.fitness.deltas}
          />
        </div>
      </section>

      {/* ================================================================= change */}
      <section className="mt-14">
        <h2 className="text-[22px] leading-tight font-semibold tracking-tight">
          The change itself
        </h2>
        <p className="text-muted mt-2 max-w-[74ch] leading-relaxed">
          An illustrative before and after, pinned to content digests. The digests are the
          authoritative part; the excerpt is there to make the shape of the change legible.
        </p>

        <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-3">
          <Pin label="Reference digest" value={record.change.refDigest} />
          <Pin label="Alternate digest" value={record.change.altDigest} />
          <Pin label="Commit" value={`commit:${record.change.commit.slice(0, 10)}`} />
          <Pin label="Test suites touched" value={String(record.change.testSuitesTouched)} />
        </dl>

        {(record.change.before.length > 0 || record.change.after.length > 0) && (
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <Excerpt label="Before" lines={record.change.before} tone="rose" />
            <Excerpt label="After" lines={record.change.after} tone="acid" />
          </div>
        )}
      </section>

      {/* ============================================================== sandboxes */}
      {record.sandboxRuns.length > 0 && (
        <section className="mt-14">
          <h2 className="text-[22px] leading-tight font-semibold tracking-tight">Sandbox runs</h2>
          <p className="text-muted mt-2 max-w-[74ch] leading-relaxed">
            The mutation applied in isolation, with the adopter&rsquo;s own suite run against it.
            This is the step that turns a proposal into a measurement.
          </p>

          <ul className="mt-5 space-y-4">
            {record.sandboxRuns.map((run) => (
              <li key={run.id} className="border-line bg-panel rounded-lg border p-4 sm:p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
                  <p className="text-[14.5px] font-semibold">
                    {run.environment.runtime} on {run.environment.os}
                    {run.environment.browser && ` · ${run.environment.browser}`}
                    {run.environment.deviceProfile && ` · ${run.environment.deviceProfile}`}
                  </p>
                  <p
                    className={
                      run.outcome === 'pass'
                        ? 'text-acid font-mono text-nano uppercase'
                        : 'text-rose font-mono text-nano uppercase'
                    }
                  >
                    {run.outcome} · {run.testsPassed}/{run.testsTotal} ·{' '}
                    {run.durationSeconds.toFixed(1)}s
                  </p>
                </div>

                <p className="text-faint mt-1.5 font-mono text-nano">
                  {run.id} · {run.runDigest}
                </p>

                {run.log.length > 0 && (
                  <pre className="border-line bg-void text-text-soft mt-3 overflow-x-auto rounded border p-3 font-mono text-[11.5px] leading-relaxed">
                    {run.log.join('\n')}
                  </pre>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ========================================================= compatibility */}
      <section className="mt-14">
        <h2 className="text-[22px] leading-tight font-semibold tracking-tight">
          Who this applies to
        </h2>
        <p className="text-muted mt-2 max-w-[74ch] leading-relaxed">
          {record.compatibility.relativesEligible.toLocaleString()} relatives are eligible and{' '}
          {record.compatibility.relativesNeedingReview.toLocaleString()} would need manual review,
          at a parent compatibility of {record.compatibility.parentCompatibility.toFixed(2)}.
          Eligibility is not adoption: every one of them decides for itself.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <DecisionColumn title="Adopted" tone="acid" genomes={record.adopted} />
          <DecisionColumn title="Declined" tone="rose" genomes={record.rejected} />
          <DecisionColumn title="Offered, undecided" tone="amber" genomes={record.offered} />
          <DecisionColumn title="Carries the gene, not offered" tone="muted" genomes={record.undecided} />
        </div>
      </section>

      {/* =========================================================== provenance */}
      {provenance && (
        <section className="mt-14">
          <h2 className="text-[22px] leading-tight font-semibold tracking-tight">Provenance</h2>
          <p className="text-muted mt-2 max-w-[74ch] leading-relaxed">
            Claims bound to immutable artifacts. An attestation is not a promise that the change is
            good — it is a signed statement about how it was produced, read here as SLSA, in-toto,
            CycloneDX pedigree and W3C PROV triples.
          </p>
          <div className="mt-5">
            <ProvenanceViewer record={provenance} />
          </div>
        </section>
      )}

      {/* =============================================================== decision */}
      <section className="mt-14">
        <h2 className="text-[22px] leading-tight font-semibold tracking-tight">Decision</h2>
        <p className="text-muted mt-2 max-w-[74ch] leading-relaxed">
          A decision is itself a record: attributable, reasoned and signed. Choose one to see what
          would be written{decidingFor && ` on behalf of ${decidingFor.name}`}.
        </p>
        <div className="border-line bg-panel mt-5 rounded-lg border p-4 sm:p-6">
          <DecisionConsole
            mutation={record.accession}
            shortId={record.shortId}
            checklist={record.checklist}
            genomeName={decidingFor?.name ?? 'this genome'}
            genomeAccession={decidingFor?.accession ?? 'CAGENOME:unknown'}
          />
        </div>
      </section>

      <p className="border-line/70 text-faint mt-14 max-w-[80ch] border-t pt-5 text-[13px] leading-relaxed">
        This record describes a proposed change to a capability, not a merge. Adoption is per-genome
        and reversible, the fitness figures come from the seeded sandbox runs above rather than from
        a live measurement, and no number on this page is an aggregate quality score.
      </p>
    </div>
  );
}

/* ==========================================================================
   Parts
   ========================================================================== */

function Pin({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-faint font-mono text-nano uppercase">{label}</dt>
      <dd className="text-text-soft mt-1 font-mono text-[13px] break-all">{value}</dd>
    </div>
  );
}

function Excerpt({ label, lines, tone }: { label: string; lines: string[]; tone: 'rose' | 'acid' }) {
  return (
    <figure className="m-0">
      <figcaption
        className={
          tone === 'rose'
            ? 'text-rose font-mono text-nano uppercase'
            : 'text-acid font-mono text-nano uppercase'
        }
      >
        {label}
      </figcaption>
      <pre className="border-line bg-void text-text-soft mt-2 overflow-x-auto rounded border p-3 font-mono text-[11.5px] leading-relaxed">
        {lines.length === 0 ? 'Not recorded.' : lines.join('\n')}
      </pre>
    </figure>
  );
}

const RELATION_LABEL: Record<DecisionView['relation'], string> = {
  origin: 'where it started',
  ancestor: 'ancestor',
  descendant: 'descendant',
  relative: 'relative',
};

function DecisionColumn({
  title,
  tone,
  genomes,
}: {
  title: string;
  tone: 'acid' | 'rose' | 'amber' | 'muted';
  genomes: DecisionView[];
}) {
  const toneClass =
    tone === 'acid'
      ? 'text-acid'
      : tone === 'rose'
        ? 'text-rose'
        : tone === 'amber'
          ? 'text-amber'
          : 'text-muted';

  return (
    <div className="border-line bg-panel rounded-lg border p-4">
      <p className={`font-mono text-nano uppercase ${toneClass}`}>
        {title} · {genomes.length}
      </p>
      {genomes.length === 0 ? (
        <p className="text-faint mt-2 text-[13px]">None.</p>
      ) : (
        <ul className="mt-2.5 space-y-2">
          {genomes.map((genome) => (
            <li key={genome.accession}>
              <Link
                href={`/project/${genome.accession}`}
                className="hover:text-acid block text-[13.5px] font-medium transition-colors"
              >
                {genome.name}
              </Link>
              <p className="text-faint font-mono text-nano">
                Gen {genome.generation} · {RELATION_LABEL[genome.relation]}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
