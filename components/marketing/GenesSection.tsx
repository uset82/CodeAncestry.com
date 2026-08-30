import { getDemoGene } from '@/data/demo';
import { DemoGeneInspector } from '@/components/viz/genome/DemoGeneInspector';
import { Eyebrow, Section } from './Section';

/**
 * Homepage 05 — software genes. Beat 4. A gene is a capability, not a file.
 * The worked record is G-VISION-204 from the AXIS demo pack.
 */

export function GenesSection() {
  const vision = getDemoGene('DEMO:G-VISION-204');
  if (!vision) {
    throw new Error('AXIS demo is missing DEMO:G-VISION-204');
  }

  return (
    <Section id="genes" beat={4} beatSide="left">
      <div className="max-w-[640px]">
        <Eyebrow index="05">Software genes</Eyebrow>
        <h2 className="text-headline mt-4 text-balance">
          Capabilities,
          <br />
          <span className="text-emphasis">not just files.</span>
        </h2>
        <p className="text-text-soft mt-6 leading-relaxed">
          A software gene is a meaningful capability — computer vision, navigation, safety — not an
          arbitrary source file. The record below is instrumentation, not a product tile.
        </p>
      </div>

      <figure className="border-line bg-panel mt-12 max-w-[560px] rounded-sm border p-5 md:p-7">
        <DemoGeneInspector gene={vision} />
        <figcaption className="text-muted mt-6 border-t border-line pt-4 font-mono text-nano uppercase">
          Example record · security VERIFIED
        </figcaption>
      </figure>
    </Section>
  );
}
