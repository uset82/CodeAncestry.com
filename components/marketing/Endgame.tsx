import { Section } from './Section';

/**
 * The one section that is allowed to be a claim about the future rather than a
 * description of the product. Kept short, and immediately grounded by naming
 * what actually has to exist first.
 *
 * Set as a folio epigraph: ruled off top and bottom, the claim in display
 * italic, the correction underneath in small type. The old version put a
 * blurred violet orb behind it, which said "AI product" and nothing else.
 */
export function Endgame() {
  return (
    <Section id="endgame">
      <figure className="relative m-0 mx-auto max-w-[980px]">
        <div className="border-line flex items-center gap-5 border-t pt-4">
          <span className="text-acid label text-[10px]">Epigraph</span>
          <span className="bg-line h-px flex-1" />
          <span className="text-muted label text-[10px]">The long horizon</span>
        </div>

        <blockquote className="mt-12 mb-12">
          <p className="font-sans text-[clamp(2rem,5.4vw,4.25rem)] leading-[1.02] font-medium tracking-[-0.02em] text-balance">
            In 2045, a robot should be able to ask{' '}
            <span className="text-acid">who was my great-great-grandfather</span> — and get an
            answer with evidence attached.
          </p>
        </blockquote>

        <figcaption className="border-line grid gap-6 border-t pt-6 md:grid-cols-[auto_1fr] md:gap-12">
          <span className="text-faint label text-[9.5px] whitespace-nowrap">
            Note to the elevated
          </span>
          <p className="text-text-soft max-w-[62ch] text-[15.5px] leading-[1.65]">
            That is a long way off, and it starts somewhere unglamorous: being able to say which
            project a single capability came from, and proving it. Everything on this site is that
            first step, built on eight seeded projects so the shape is arguable before it is real.
          </p>
        </figcaption>
      </figure>
    </Section>
  );
}
