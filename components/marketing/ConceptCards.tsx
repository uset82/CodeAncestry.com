import Link from 'next/link';
import { demo } from '@/lib/site';
import { Eyebrow, Section } from './Section';

/**
 * Four questions, four answers, one principle each.
 *
 * Deliberately restrained: no swarms, no epigenetics, no lateral transfer. The
 * homepage teaches one idea at a time and lets the registry carry the rest.
 *
 * Each card is a specimen entry: roman numeral, the figure mounted on its own
 * dark  chip, then the caption. The figures inherit their colours
 * from the . scope, so the same SVG that reads as ink on paper reads
 * as phosphor on the chip without a second set of classes.
 */

type Concept = {
  id: string;
  numeral: string;
  kicker: string;
  question: string;
  answer: string;
  href: string;
  cta: string;
  /** Small inline diagram, one per card, all built from the same 44×44 grid. */
  figure: React.ReactNode;
  tone: string;
};

const CONCEPTS: Concept[] = [
  {
    id: 'genomes',
    numeral: 'i',
    kicker: 'Genomes',
    question: 'What is your project made of?',
    answer:
      'Not files and folders — capabilities. A genome lists the ten or fifty things your project can actually do, each with a digest, a location in the source, and a reason to believe it is there.',
    href: demo.rootGenome,
    cta: 'Open a genome',
    tone: 'text-acid',
    figure: (
      <svg viewBox="0 0 44 44" className="size-full" aria-hidden="true">
        <rect x="4" y="6" width="36" height="4" rx="1" className="fill-acid/70" />
        <rect x="4" y="14" width="24" height="4" rx="1" className="fill-acid/45" />
        <rect x="4" y="22" width="31" height="4" rx="1" className="fill-acid/60" />
        <rect x="4" y="30" width="14" height="4" rx="1" className="fill-acid/30" />
        <rect x="22" y="30" width="18" height="4" rx="1" className="fill-acid/45" />
      </svg>
    ),
  },
  {
    id: 'lineage',
    numeral: 'ii',
    kicker: 'Lineage',
    question: 'Where did it come from?',
    answer:
      'Every capability has a first appearance. Lineage is the typed graph connecting your project to the ancestor a capability was born in — through forks Git never linked, and rewrites that kept nothing but the idea.',
    href: demo.family,
    cta: 'Walk the CodeTree',
    tone: 'text-cyan',
    figure: (
      <svg viewBox="0 0 44 44" className="size-full" aria-hidden="true">
        <path
          d="M22 8 V18 M22 18 H10 V30 M22 18 H34 V30 M10 30 V36 M34 30 V36"
          className="stroke-cyan/60"
          strokeWidth="1.6"
          fill="none"
        />
        <circle cx="22" cy="7" r="3.4" className="fill-void stroke-cyan" strokeWidth="1.6" />
        <circle cx="10" cy="37" r="3" className="fill-void stroke-cyan/70" strokeWidth="1.6" />
        <circle cx="34" cy="37" r="3" className="fill-void stroke-cyan/70" strokeWidth="1.6" />
      </svg>
    ),
  },
  {
    id: 'mutations',
    numeral: 'iii',
    kicker: 'Mutations',
    question: 'How did it evolve?',
    answer:
      'A mutation is one capability changing, with the measurement that justified it. Latency, coverage, complexity, compatibility — recorded before and after, so a change can be argued about instead of merely merged.',
    href: demo.heroMutation,
    cta: 'Read one mutation',
    tone: 'text-violet',
    figure: (
      <svg viewBox="0 0 44 44" className="size-full" aria-hidden="true">
        <path d="M6 30 H18" className="stroke-line-strong" strokeWidth="1.6" fill="none" />
        <path
          d="M18 30 C26 30 26 14 34 14"
          className="stroke-violet"
          strokeWidth="1.8"
          fill="none"
        />
        <path
          d="M18 30 C26 30 26 38 34 38"
          className="stroke-line-strong"
          strokeWidth="1.4"
          strokeDasharray="3 3"
          fill="none"
        />
        <circle cx="18" cy="30" r="2.6" className="fill-violet" />
        <circle cx="35" cy="14" r="3" className="fill-void stroke-violet" strokeWidth="1.6" />
      </svg>
    ),
  },
  {
    id: 'agents',
    numeral: 'iv',
    kicker: 'Agents',
    question: 'What did its agents learn?',
    answer:
      'AI agents already write and refactor most of this code. Each carries a portable identity: what it can do, what it was allowed to read, and what it produced — signed, attributable, and reviewable by the next maintainer.',
    href: demo.heroAgent,
    cta: 'Inspect an agent',
    tone: 'text-amber',
    figure: (
      <svg viewBox="0 0 44 44" className="size-full" aria-hidden="true">
        <rect
          x="12"
          y="12"
          width="20"
          height="20"
          rx="2"
          className="fill-void stroke-amber/80"
          strokeWidth="1.7"
        />
        <circle cx="18.5" cy="21" r="1.9" className="fill-amber" />
        <circle cx="25.5" cy="21" r="1.9" className="fill-amber" />
        <path d="M18 27 H26" className="stroke-amber/60" strokeWidth="1.5" />
        <path
          d="M22 12 V6 M12 22 H6 M32 22 H38 M22 32 V38"
          className="stroke-amber/40"
          strokeWidth="1.4"
        />
      </svg>
    ),
  },
];

export function ConceptCards() {
  return (
    <Section id="concepts">
      <div className="grid gap-10 lg:grid-cols-[1fr_minmax(280px,26%)] lg:items-end lg:gap-20">
        <div className="max-w-[820px]">
          <Eyebrow index="01">Four questions the registry answers</Eyebrow>
          <h2 className="text-headline mt-6 text-balance">
            Software already behaves like a species.{' '}
            <span className="text-acid">Nothing records it.</span>
          </h2>
        </div>

        <p className="text-text-soft border-line border-t pt-5 text-[15.5px] leading-[1.65]">
          Forks, rewrites, ports and agent refactors move capabilities between projects every day.
          Git captures the diff and loses the descent. CodeAncestry records the descent.
        </p>
      </div>

      {/* Hairline elevated block: the gap is the rule, the cells are the stock. */}
      <ul className="bg-line mt-16 grid gap-px sm:grid-cols-2 xl:grid-cols-4">
        {CONCEPTS.map((concept) => (
          <li key={concept.id} className="group bg-void">
            <div className="hover:bg-panel-2 flex h-full flex-col p-7 transition-colors md:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-acid font-sans text-[22px] leading-none italic">
                    {concept.numeral}
                  </span>
                  <span className={`label mt-2.5 block text-[10px] ${concept.tone}`}>
                    {concept.kicker}
                  </span>
                </div>

                {/* the specimen chip: a lit  set into the page */}
                <div className=" border-line-strong size-14 shrink-0 border p-2.5 shadow-[inset_0_1px_6px_rgb(0_0_0/0.5)]">
                  {concept.figure}
                </div>
              </div>

              <h3 className="mt-8 text-[26px] leading-[1.08] tracking-[-0.015em] text-balance">
                {concept.question}
              </h3>
              <p className="text-text-soft mt-4 flex-1 text-[14.5px] leading-[1.62]">
                {concept.answer}
              </p>

              <Link
                href={concept.href}
                className="border-line group-hover:border-line-strong text-muted group-hover:text-text label mt-8 inline-flex items-center gap-2 border-t pt-4 text-[9.5px] transition-colors"
              >
                {concept.cta}
                <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">
                  →
                </span>
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
}
