import { BeatScaffold } from '@/components/marketing/BeatScaffold';
import { CodePaintingTeaser } from '@/components/marketing/CodePaintingTeaser';
import { ConceptCards } from '@/components/marketing/ConceptCards';
import { Endgame } from '@/components/marketing/Endgame';
import { JoinSection } from '@/components/marketing/JoinSection';
import { MeaningLayer } from '@/components/marketing/MeaningLayer';
import { PropagationStrip } from '@/components/marketing/PropagationStrip';
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
        <ConceptCards />
      </Reveal>
      <Reveal>
        <MeaningLayer />
      </Reveal>
      <Reveal>
        <CodePaintingTeaser />
      </Reveal>
      <Reveal>
        <PropagationStrip />
      </Reveal>
      <Reveal>
        <TrustLadder />
      </Reveal>
      <Reveal>
        <Endgame />
      </Reveal>
      <BeatScaffold
        beat={8}
        id="trace"
        index="13"
        title="Trace Failure · entry"
        arrives="Arrives in Phase 9"
      />
      <BeatScaffold
        beat={9}
        index="13"
        title="Trace Failure · rewind"
        arrives="Arrives in Phase 9"
      />
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
