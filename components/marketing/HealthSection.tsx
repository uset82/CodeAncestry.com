import { LineageHealth } from '@/components/viz/health/LineageHealth';
import { Eyebrow, Section } from './Section';

/**
 * Homepage 14 — Lineage Health. Beat 10. Digital Immunity as a product name.
 * The helix already recovers; this names the fan-out. KEYLIT is not the demo.
 */

export function HealthSection() {
  return (
    <Section id="health" beat={10} beatSide="left">
      <div className="max-w-[640px]">
        <Eyebrow index="14">Lineage Health</Eyebrow>
        <h2 className="text-headline mt-4 text-balance">
          One mutation.
          <br />
          <span className="text-emphasis">Thousands of descendants.</span>
        </h2>
        <p className="text-text-soft mt-6 leading-relaxed">
          Digital Immunity is the story. Lineage Health is the instrument. When this section owns
          the viewport the helix sends a verified fix upstream from generation 118. The plate is
          the same fan-out if the canvas is a still — marks, not colour alone, and no robot mesh.
        </p>
      </div>

      <figure className="border-line bg-panel mt-12 max-w-[640px] rounded-sm border p-5 md:p-7">
        <LineageHealth />
        <figcaption className="text-muted mt-6 border-t border-line pt-4 font-mono text-nano uppercase">
          Fan-out · last safe ancestor · replacement · demo
        </figcaption>
      </figure>
    </Section>
  );
}
