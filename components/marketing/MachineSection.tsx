import { MachineGenome } from '@/components/viz/machine/MachineGenome';
import { Eyebrow, Section } from './Section';

/**
 * Homepage 12 — AX-2041. Beat 7. The helix has already converged; this names
 * the column. Simulation, not a robot. KEYLIT is not the demo.
 */

export function MachineSection() {
  return (
    <Section id="machine" beat={7} beatSide="left">
      <div className="max-w-[640px]">
        <Eyebrow index="12">Future machine</Eyebrow>
        <h2 className="text-headline mt-4 text-balance">
          Meet
          <br />
          <span className="text-emphasis">AX-2041.</span>
        </h2>
        <p className="text-text-soft mt-6 leading-relaxed">
          A machine genome is a layout, not a mesh. When this section owns the viewport the lineage
          re-poses into a capability column. The plate below is the same information if the canvas
          is a still, or missing.
        </p>
      </div>

      <figure className="border-line bg-panel mt-12 max-w-[640px] rounded-sm border p-5 md:p-7">
        <MachineGenome />
        <figcaption className="text-muted mt-6 border-t border-line pt-4 font-mono text-nano uppercase">
          Simulation · capability column · no robot
        </figcaption>
      </figure>
    </Section>
  );
}
