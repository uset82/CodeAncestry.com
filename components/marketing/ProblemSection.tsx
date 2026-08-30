import { Eyebrow, Section } from './Section';

/**
 * Homepage 02 — the problem. Beat 2. Copy and chain from
 * docs/content-architecture.md. Everything stays in the reading column so the
 * specimen can occupy the opposite side. The helix grows more complex here;
 * the HTML only names the questions.
 */

const CHAIN = [
  { who: 'Human Developer', what: 'Writes the first capability' },
  { who: 'AI Agent', what: 'Generates and modifies' },
  { who: 'AI Agent', what: 'Reviews, tests, repairs' },
  { who: 'AI Agent', what: 'Inherits without a record' },
  { who: 'Autonomous System', what: 'Runs. Origin unknown.' },
] as const;

const QUESTIONS = [
  'Where did this capability come from?',
  'Who created it?',
  'What did it inherit?',
  'Which mutation changed it?',
  'Who inherited the mutation?',
  'What was the last healthy generation?',
] as const;

export function ProblemSection() {
  return (
    <Section id="problem" beat={2} beatSide="left">
      <div className="max-w-[640px]">
        <Eyebrow index="02">The problem</Eyebrow>
        <h2 className="text-headline mt-4 text-balance">
          Software is evolving faster
          <br />
          <span className="text-emphasis">than we can understand it.</span>
        </h2>
        <p className="text-text-soft mt-6 leading-relaxed">
          AI systems increasingly generate, modify, review, test, and repair software. Understanding
          only the latest source code may eventually be insufficient to answer where a capability
          came from, why a behavior exists, which agent introduced it, or which descendants
          inherited it.
        </p>
      </div>

      <ol className="relative mt-12 max-w-[420px] list-none pl-0">
        <span aria-hidden="true" className="bg-line absolute top-3 bottom-3 left-[15px] w-px" />
        {CHAIN.map((step, i) => (
          <li key={`${step.who}-${i}`} className="relative flex gap-4 pb-5 last:pb-0">
            <span
              aria-hidden="true"
              className="bg-void border-acid relative z-10 mt-2 size-[9px] shrink-0 rounded-full border"
            />
            <div className="bg-panel border-line min-w-0 flex-1 rounded-xs border px-4 py-3">
              <p className="text-acid font-mono text-nano uppercase">
                {String(i + 1).padStart(2, '0')}
              </p>
              <p className="mt-1 text-[16px] font-semibold tracking-tight">{step.who}</p>
              <p className="text-muted mt-1 text-[13.5px] leading-snug">{step.what}</p>
            </div>
          </li>
        ))}
      </ol>

      <ol className="mt-12 max-w-[560px] space-y-3">
        {QUESTIONS.map((question, i) => (
          <li key={question} className="text-text-soft flex gap-3 text-[15px] leading-relaxed">
            <span className="text-muted mt-0.5 font-mono text-nano tabular-nums">
              {String(i + 1).padStart(2, '0')}
            </span>
            {question}
          </li>
        ))}
      </ol>
    </Section>
  );
}
