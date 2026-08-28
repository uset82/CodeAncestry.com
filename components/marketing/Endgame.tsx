import { Section } from './Section';

/**
 * The one section that is allowed to be a claim about the future rather than a
 * description of the product. Kept short, and immediately grounded by naming
 * what actually has to exist first.
 */
export function Endgame() {
  return (
    <Section id="endgame" className="overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 size-[720px] -translate-1/2 rounded-full opacity-60 blur-3xl"
        style={{
          background:
            'radial-gradient(circle, rgb(169 133 255 / 0.12), rgb(99 231 255 / 0.05) 45%, transparent 70%)',
        }}
      />

      <figure className="relative m-0 mx-auto max-w-[900px] text-center">
        <p className="text-acid font-mono text-micro uppercase">The long horizon</p>

        <blockquote className="mt-7">
          <p className="text-[clamp(1.75rem,4.2vw,3.25rem)] leading-[1.06] font-bold tracking-[-0.05em] text-balance">
            In 2045, a robot should be able to ask{' '}
            <span className="text-outline">who was my great-great-grandfather</span> — and get an
            answer with evidence attached.
          </p>
        </blockquote>

        <figcaption className="text-muted mx-auto mt-9 max-w-[620px] text-[15px] leading-relaxed">
          That is a long way off, and it starts somewhere unglamorous: being able to say which
          project a single capability came from, and proving it. Everything on this site is that
          first step, built on eight seeded projects so the shape is arguable before it is real.
        </figcaption>
      </figure>
    </Section>
  );
}
