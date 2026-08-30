import { DirectionMap } from '@/components/viz/evolution/DirectionMap';
import { Eyebrow, Section } from './Section';

/**
 * Homepage 09 — Distributed evolution. Beat 5. Four directions, then the name
 * of the idea. The eight-lock protocol follows in PropagationStrip.
 */

export function EvolutionSection() {
  return (
    <Section id="evolution" beat={5} beatSide="left">
      <div className="max-w-[640px]">
        <Eyebrow index="09">Distributed evolution</Eyebrow>
        <h2 className="text-headline mt-4 text-balance">
          Descendants can improve
          <br />
          <span className="text-emphasis">their ancestors.</span>
        </h2>
        <p className="text-text-soft mt-6 leading-relaxed">
          Descent is only one arrow. Knowledge can move up, sideways, and across families. Every
          arrow is an offer. The helix holds the agent pose; this instrument names the directions
          those agents can propose.
        </p>
      </div>

      <figure className="border-line bg-panel mt-12 max-w-[560px] rounded-sm border p-5 md:p-7">
        <DirectionMap />
        <figcaption className="text-muted mt-6 border-t border-line pt-4 font-mono text-nano uppercase">
          Arrow keys follow the compass
        </figcaption>
      </figure>

      <p className="text-headline mt-16 max-w-[720px] text-balance">
        Distributed Evolutionary Development
      </p>
      <p className="text-text-soft mt-4 max-w-[560px] leading-relaxed">
        A descendant can teach an ancestor. A sibling can share a gene. A foreign family can
        recombine. Nothing writes itself — the protocol after this section is the lock on every
        arrow.
      </p>
    </Section>
  );
}
