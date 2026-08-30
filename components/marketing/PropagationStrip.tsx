import Link from 'next/link';
import { demoAccession, mutationM94012 } from '@/data/demo';
import { Eyebrow, Section } from './Section';

/**
 * The propagation protocol, stated as a sequence with the safety guarantee in
 * plain language. This is the section that has to defuse the obvious fear:
 * that a registry of related projects means code spreading on its own.
 */

const STEPS = [
  {
    id: 'discover',
    label: 'Discover',
    detail: 'An agent or a person notices a capability behaving worse than it could.',
  },
  {
    id: 'describe',
    label: 'Describe',
    detail: 'The change is recorded as one gene moving from one allele to another.',
  },
  {
    id: 'attest',
    label: 'Attest',
    detail: 'Source digest, build provenance and authorship are signed and pinned.',
  },
  {
    id: 'sandbox',
    label: 'Sandbox',
    detail: 'It is applied to a copy of the relative, isolated, with no network.',
  },
  {
    id: 'test',
    label: 'Test',
    detail: "The relative's own suite runs. Not the proposer's.",
  },
  {
    id: 'evaluate',
    label: 'Evaluate',
    detail: 'Six fitness axes measured before and after, trade-offs included.',
  },
  {
    id: 'policy',
    label: 'Policy',
    detail: 'Licence, security and compatibility rules of the receiving project apply.',
  },
  {
    id: 'decide',
    label: 'Adopt · Reject · Quarantine',
    detail: 'A maintainer decides, or an explicit policy the maintainer wrote decides.',
  },
] as const;

export function PropagationStrip() {
  const mutation = demoAccession(mutationM94012.id);

  return (
    <Section id="propagation" beat={5} beatSide="left">
      <div className="max-w-[640px]">
        <Eyebrow>Offer protocol</Eyebrow>
        <h2 className="text-headline mt-4 text-balance">
          Eight locks between
          <br />
          <span className="text-emphasis">an offer and a write.</span>
        </h2>
        <p className="text-text-soft mt-6 max-w-[540px] leading-relaxed">
          When {mutation} improved navigation on generation 119, ancestors were{' '}
          <em>offered</em> the change. Eight steps stand between noticing something and anything
          moving. Nothing is adopted automatically.
        </p>
      </div>

      {/* --------------------------------------------------------- the sequence */}
      <ol className="mt-14 grid gap-px sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, i) => {
          const terminal = i === STEPS.length - 1;
          return (
            <li key={step.id} className="bg-line/40">
              <div className="bg-void relative h-full p-5 md:p-6">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`font-mono text-nano tabular-nums ${terminal ? 'text-amber' : 'text-acid'}`}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span
                    aria-hidden="true"
                    className={`h-px flex-1 ${terminal ? 'bg-amber/30' : 'bg-acid/25'}`}
                  />
                  {!terminal && (
                    <span aria-hidden="true" className="text-muted text-[10px]">
                      →
                    </span>
                  )}
                </div>

                <h3 className="mt-4 text-[15.5px] leading-snug font-semibold tracking-tight">
                  {step.label}
                </h3>
                <p className="text-muted mt-2 text-[13.5px] leading-relaxed">{step.detail}</p>
              </div>
            </li>
          );
        })}
      </ol>

      {/* ------------------------------------------------ the safety guarantee */}
      <div className="border-acid/20 bg-void mt-10 max-w-[560px] rounded-xl border p-6 md:p-8">
        <p className="text-[19px] leading-[1.45] font-semibold tracking-[-0.02em] text-balance">
          Nothing is ever adopted automatically. Not by an agent, not by the registry, not by a
          related project.
        </p>
        <p className="text-muted mt-5 text-[14.5px] leading-relaxed">
          Propagation is always an offer. Every arrow in the CodeTree that carries a change ends at
          a decision made by the receiving project&rsquo;s maintainer, under rules that maintainer
          wrote.{' '}
          <Link href="#mutation" className="text-text-soft hover:text-text underline decoration-dotted">
            See the decision surface
          </Link>
          .
        </p>
      </div>
    </Section>
  );
}
