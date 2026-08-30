import { DemoMutationInspector } from '@/components/viz/mutation/DemoMutationInspector';
import { Eyebrow, Section } from './Section';

/**
 * Homepage 07 — Mutation Lab. Beat 4. M-94012 is the worked record.
 */

export function MutationSection() {
  return (
    <Section id="mutation" beat={4} beatSide="left">
      <div className="max-w-[640px]">
        <Eyebrow index="07">Mutation Lab</Eyebrow>
        <h2 className="text-headline mt-4 text-balance">
          Every mutation
          <br />
          <span className="text-emphasis">has an origin.</span>
        </h2>
        <p className="text-text-soft mt-6 leading-relaxed">
          M-94012 changed navigation on parent NAV-G288.118 at generation 119. The lab actions below
          are labelled demo states. They do not write to any genome.
        </p>
      </div>

      <figure className="border-line bg-panel mt-12 max-w-[560px] rounded-sm border p-5 md:p-7">
        <DemoMutationInspector />
        <figcaption className="text-muted mt-6 border-t border-line pt-4 font-mono text-nano uppercase">
          Origin · evidence · descendants · demo actions
        </figcaption>
      </figure>
    </Section>
  );
}
