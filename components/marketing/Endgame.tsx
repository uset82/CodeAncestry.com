import { Section } from './Section';

/**
 * The one section that is allowed to be a claim about the future rather than a
 * description of the product. Kept short, and immediately grounded by naming
 * what actually has to exist first.
 */
export function Endgame() {
  return (
    <Section id="endgame" className="overflow-hidden">
      <figure className="relative m-0 mx-auto max-w-[900px] text-center">
        <p className="text-acid font-mono text-micro uppercase">The long horizon</p>

        <blockquote className="mt-7">
          <p className="text-[clamp(1.75rem,4.2vw,3.25rem)] leading-[1.06] font-bold tracking-[-0.05em] text-balance">
            In 2045, a robot should be able to ask{' '}
            <span className="text-emphasis">who was my great-great-grandfather</span> — and get an
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
