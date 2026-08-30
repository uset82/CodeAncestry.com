import { AgentSection } from '@/components/marketing/AgentSection';
import { BeatScaffold } from '@/components/marketing/BeatScaffold';
import { CodeBlastSection } from '@/components/marketing/CodeBlastSection';
import { CodeTreeSection } from '@/components/marketing/CodeTreeSection';
import { Endgame } from '@/components/marketing/Endgame';
import { EvolutionSection } from '@/components/marketing/EvolutionSection';
import { GenesSection } from '@/components/marketing/GenesSection';
import { GenomeSection } from '@/components/marketing/GenomeSection';
import { JoinSection } from '@/components/marketing/JoinSection';
import { MachineSection } from '@/components/marketing/MachineSection';
import { MutationSection } from '@/components/marketing/MutationSection';
import { PlatformSection } from '@/components/marketing/PlatformSection';
import { ProblemSection } from '@/components/marketing/ProblemSection';
import { PropagationStrip } from '@/components/marketing/PropagationStrip';
import { TraceSection } from '@/components/marketing/TraceSection';
import { TrustLadder } from '@/components/marketing/TrustLadder';
import { Reveal } from '@/components/motion/Reveal';
import { HelixHero } from '@/components/viz/helix/HelixHero';
import { HelixStage } from '@/components/viz/helix/HelixStage';

/**
 * Current composition is the pre-rebuild argument plus twelve helix anchors.
 * `data-beat` is the mapping — swap two values and the pose follows, no helix
 * edit. Claude’s 17-section bodies fill from Phase 3 onward.
 */
export default function HomePage() {
  return (
    <HelixStage>
      <HelixHero />
      <Reveal>
        <ProblemSection />
      </Reveal>
      <Reveal>
        <PlatformSection />
      </Reveal>
      <Reveal>
        <GenomeSection />
      </Reveal>
      <Reveal>
        <GenesSection />
      </Reveal>
      <Reveal>
        <CodeTreeSection />
      </Reveal>
      <Reveal>
        <MutationSection />
      </Reveal>
      <Reveal>
        <AgentSection />
      </Reveal>
      <Reveal>
        <EvolutionSection />
      </Reveal>
      <Reveal>
        <PropagationStrip />
      </Reveal>
      <Reveal>
        <CodeBlastSection />
      </Reveal>
      <Reveal>
        <TrustLadder />
      </Reveal>
      <Reveal>
        <MachineSection />
      </Reveal>
      <Reveal>
        <Endgame />
      </Reveal>
      <TraceSection />
      <BeatScaffold
        beat={10}
        id="health"
        index="14"
        title="Lineage Health"
        arrives="Arrives in Phase 10"
      />
      <Reveal>
        <JoinSection />
      </Reveal>
      {/* No `data-beat`: the scene suspends once this region owns the viewport. */}
      <div className="min-h-screen" aria-hidden="true" data-helix-idle />
    </HelixStage>
  );
}
