import { AxisGenomeBrowser } from '@/components/viz/genome/AxisGenomeBrowser';
import { Eyebrow, Section } from './Section';

/**
 * Homepage 04 — digital genome. Beat 4. The helix is flattening toward tracks;
 * this instrument is the same idea in HTML. AXIS ROBOT CORE, not KEYLIT.
 */

export function GenomeSection() {
  return (
    <Section id="genome" beat={4} beatSide="left">
      <div className="max-w-[640px]">
        <Eyebrow index="04">Digital genome</Eyebrow>
        <h2 className="text-headline mt-4 text-balance">
          Every project
          <br />
          <span className="text-emphasis">has a genome.</span>
        </h2>
        <p className="text-text-soft mt-6 leading-relaxed">
          A genome here is a stack of capability tracks, not a literal biological sequence. Select
          NAVIGATION to open the gene that steers the machine.
        </p>
      </div>

      <figure className="mt-12 max-w-[720px]">
        <AxisGenomeBrowser defaultTrack="navigation" />
        <figcaption className="text-muted mt-3 font-mono text-nano uppercase">
          Tracks, not a biological genome · NAV-G288 is selected
        </figcaption>
      </figure>
    </Section>
  );
}
