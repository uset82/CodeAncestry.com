import { notFound } from 'next/navigation';
import { GENOME } from '@/data/keylit/ids';
import { getCodePaintingView } from '@/lib/registry';
import { demo } from '@/lib/site';
import { ButtonLink } from '@/components/ui/Button';
import { CodePaintingStrip } from '@/components/registry/CodePaintingStrip';
import { Eyebrow, Section } from './Section';

/**
 * The comprehension moment, borrowed from consumer genomics: one bar that
 * answers "how much of this is actually yours?" before any technical vocabulary
 * is introduced.
 */
export function CodePaintingTeaser() {
  const painting = getCodePaintingView(GENOME.kids);
  if (!painting) notFound();

  const share = (mode: string) =>
    Math.round((painting.segments.find((s) => s.mode === mode)?.share ?? 0) * 100);

  const unchanged = share('inherited');
  const rewritten = share('mutated');
  const local = share('local');

  return (
    <Section id="painting" plate="Plate 03 — Composition">
      <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
        <div>
          <Eyebrow index="03">Code Painting</Eyebrow>
          <h2 className="text-headline mt-4 text-balance">
            How much of this
            <br />
            <span className="text-emphasis">is actually new?</span>
          </h2>
          <p className="text-text-soft mt-6 leading-relaxed">
            {painting.genome.name} feels like an original project. Measured against its parent, most
            of it is not — and that is not a criticism. Standing on an ancestor is how software has
            always worked. It has simply never been written down.
          </p>

          <p className="text-muted mt-5 text-[15px] leading-relaxed">
            {unchanged + rewritten}% of it descends from KEYLIT — {unchanged}% carried over
            untouched, {rewritten}% inherited and then rewritten. Only {local}% has no ancestor at
            all: the reward loop nobody upstream had thought of.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href={demo.kidsGenome} variant="secondary">
              Open this genome
            </ButtonLink>
            <ButtonLink href={demo.compare} variant="ghost">
              Compare with its ancestor
            </ButtonLink>
          </div>
        </div>

        <figure className="plate m-0 p-6 md:p-8">
          <figcaption className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
            <span className="text-[17px] font-semibold tracking-tight">
              {painting.genome.name}
              <span className="text-faint ml-2 font-mono text-nano uppercase">
                generation {painting.genome.generation}
              </span>
            </span>
            <span className="text-faint font-mono text-nano uppercase">
              Composition by capability weight
            </span>
          </figcaption>

          <CodePaintingStrip painting={painting} />
        </figure>
      </div>
    </Section>
  );
}
