import Link from 'next/link';
import { getHeroMutation } from '@/lib/registry';
import { demo } from '@/lib/site';
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
  const mutation = getHeroMutation();

  return (
    <Section id="propagation">
      <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end md:gap-12">
        <div className="max-w-[640px]">
          <Eyebrow index="04">Propagation protocol</Eyebrow>
          <h2 className="text-headline mt-4 text-balance">
            A descendant can teach
            <br />
            <span className="text-acid">its ancestor something.</span>
          </h2>
        </div>

        <p className="text-text-soft max-w-[420px] leading-relaxed">
          When {mutation.shortId} improved {mutation.title.toLowerCase()} four generations down, its
          ancestors were <em>offered</em> the change. Eight steps stand between noticing something
          and anything moving.
        </p>
      </div>

      {/* --------------------------------------------------------- the sequence */}
      <ol className="mt-14 grid gap-px sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, i) => {
          const terminal = i === STEPS.length - 1;
          return (
            <li key={step.id} className="bg-line">
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
                    <span aria-hidden="true" className="text-faint text-[10px]">
                      →
                    </span>
                  )}
                </div>

                <h3 className="mt-4 text-[19px] leading-[1.15] tracking-[-0.015em]">
                  {step.label}
                </h3>
                <p className="text-text-soft mt-2.5 text-[13.5px] leading-[1.6]">{step.detail}</p>
              </div>
            </li>
          );
        })}
      </ol>

      {/* ---------------------------------------------- the safety guarantee
          A struck notice, not a tinted card: heavy rule in the verified ink,
          the guarantee set in display type so it carries the weight it needs. */}
      <div className="border-acid bg-panel-2 mt-12 border-t-[3px] px-6 py-8 md:px-10 md:py-10">
        <p className="text-acid label text-[9.5px]">Guarantee</p>

        <div className="mt-6 flex flex-col gap-8 md:flex-row md:gap-14">
          <p className="font-sans text-[clamp(1.4rem,2.6vw,2rem)] leading-[1.14] tracking-[-0.015em] text-balance md:max-w-[19ch]">
            Nothing is ever adopted automatically. Not by an agent, not by the registry, not by a
            related project.
          </p>
          <p className="text-text-soft flex-1 text-[15px] leading-[1.65]">
            Propagation is always an offer. Every arrow in the CodeTree that carries a change ends at
            a decision made by the receiving project&rsquo;s maintainer, under rules that maintainer
            wrote.{' '}
            <Link
              href={demo.heroMutation}
              className="decoration-acid/60 hover:text-text underline underline-offset-[3px]"
            >
              See the decision surface
            </Link>
            .
          </p>
        </div>
      </div>
    </Section>
  );
}
