import Link from 'next/link';
import { KeylitOrigin } from '@/components/viz/origin/KeylitOrigin';
import { keylitOrigin } from '@/data/demo/origin';
import { Eyebrow, Section } from './Section';

/**
 * Homepage 15 — Where the idea began. Beat 11. The only place KEYLIT is
 * prominent. The helix zooms out; this names the first family as history.
 */

export function OriginSection() {
  return (
    <Section id="origin" beat={11} beatSide="left">
      <div className="max-w-[640px]">
        <Eyebrow index="15">Origin</Eyebrow>
        <h2 className="text-headline mt-4 text-balance">
          Where the idea
          <br />
          <span className="text-emphasis">began.</span>
        </h2>
        <p className="text-text-soft mt-6 leading-relaxed">
          CodeAncestry started from a simple question while building KEYLIT. What happens when one
          project becomes many? A children’s version. A classroom version. An accessibility version.
          A different-language version. How do those descendants stay connected to the original
          while remaining free to evolve?
        </p>
      </div>

      <figure className="border-line bg-panel mt-12 max-w-[640px] rounded-sm border p-5 md:p-7">
        <KeylitOrigin />
        <figcaption className="text-muted mt-6 border-t border-line pt-4 font-mono text-nano uppercase">
          Sketch of the question · seeded family on /family/keylit
        </figcaption>
      </figure>

      <div className="mt-16 max-w-[640px]">
        <p className="text-title text-balance">KEYLIT was the example.</p>
        <p className="text-headline mt-3 text-balance">
          CodeAncestry became the
          <br />
          <span className="text-emphasis">bigger question.</span>
        </p>
        <p className="text-text-soft mt-6 leading-relaxed">
          The helix on this beat is that first family, pulled back. Everything above this section
          is the product that question became.
        </p>
        <Link
          href={keylitOrigin.familyHref}
          className="text-text-soft hover:text-text mt-4 inline-block text-[15px] underline decoration-dotted"
        >
          Open the seeded KEYLIT family
        </Link>
      </div>
    </Section>
  );
}
