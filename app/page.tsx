import { CodePaintingTeaser } from '@/components/marketing/CodePaintingTeaser';
import { ConceptCards } from '@/components/marketing/ConceptCards';
import { Endgame } from '@/components/marketing/Endgame';
import { JoinSection } from '@/components/marketing/JoinSection';
import { MeaningLayer } from '@/components/marketing/MeaningLayer';
import { PropagationStrip } from '@/components/marketing/PropagationStrip';
import { TrustLadder } from '@/components/marketing/TrustLadder';
import { Reveal } from '@/components/motion/Reveal';
import { HelixHero } from '@/components/viz/helix/HelixHero';

/**
 * The homepage argument, in order:
 * hero → what the registry answers → where it sits relative to Git →
 * what composition looks like → how a change travels → why to trust any of it →
 * the long horizon → join.
 */
export default function HomePage() {
  return (
    <>
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
      <Reveal>
        <JoinSection />
      </Reveal>
    </>
  );
}
