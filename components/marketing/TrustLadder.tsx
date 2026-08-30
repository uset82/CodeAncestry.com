import { EvidencePlate } from '@/components/viz/trust/EvidencePlate';
import { Eyebrow, Section } from './Section';

/**
 * Homepage 11 — Trust and provenance. Beat 6. M-94012 is the worked record.
 * Security remains WARNING — that is a fact about the mutation, not a missing
 * illustration.
 */

export function TrustLadder() {
  return (
    <Section id="trust" beat={6} beatSide="left">
      <div className="max-w-[640px]">
        <Eyebrow index="11">Trust and provenance</Eyebrow>
        <h2 className="text-headline mt-4 text-balance">
          An ancestry record is useless
          <br />
          <span className="text-emphasis">if you cannot trust it.</span>
        </h2>
        <p className="text-text-soft mt-6 leading-relaxed">
          Without evidence, genealogy is branding. The streams on the helix at this beat are
          provenance arriving at the roots. The plate names what those streams must prove — and
          what is still only a future integration.
        </p>
      </div>

      <figure className="border-line bg-panel mt-12 max-w-[560px] rounded-sm border p-5 md:p-7">
        <EvidencePlate />
        <figcaption className="text-muted mt-6 border-t border-line pt-4 font-mono text-nano uppercase">
          Source · build · creator · review · test · security · lineage
        </figcaption>
      </figure>
    </Section>
  );
}
