import { AgentDnaProfile } from '@/components/viz/agent/AgentDnaProfile';
import { ThreeLineage } from '@/components/viz/agent/ThreeLineage';
import { Eyebrow, Section } from './Section';

/**
 * Homepage 08 — Agent DNA. Beat 5. Provenance of A-184, not a social profile.
 * The helix is already in the `agents` pose; this names the three-graph join.
 */

export function AgentSection() {
  return (
    <Section id="agents" beat={5} beatSide="left">
      <div className="max-w-[640px]">
        <Eyebrow index="08">Agent DNA</Eyebrow>
        <h2 className="text-headline mt-4 text-balance">
          AI agents leave
          <br />
          <span className="text-emphasis">ancestry too.</span>
        </h2>
        <p className="text-text-soft mt-6 leading-relaxed">
          An agent is not a username. It is a lineage: the model family it came from, the runtime it
          runs in, the projects it touched, the genes it authored, the mutations it offered. Violet
          loci on the helix are the same idea — nodes on the edges they wrote.
        </p>
      </div>

      <figure className="border-line bg-panel mt-12 max-w-[560px] rounded-sm border p-5 md:p-7">
        <AgentDnaProfile />
        <figcaption className="text-muted mt-6 border-t border-line pt-4 font-mono text-nano uppercase">
          Provenance · not a profile
        </figcaption>
      </figure>

      <figure className="border-line bg-panel mt-8 max-w-[720px] rounded-sm border p-5 md:p-7">
        <ThreeLineage />
        <figcaption className="text-muted mt-6 border-t border-line pt-4 font-mono text-nano uppercase">
          Agent · project · gene · coupled at A-184
        </figcaption>
      </figure>
    </Section>
  );
}
