import { AxisCodeTree } from '@/components/viz/tree/AxisCodeTree';
import { LINEAGE_KIND_META, LINEAGE_KINDS } from '@/data/demo';
import { Eyebrow, Section } from './Section';

/**
 * Homepage 06 — CodeTree. Beat 4. AXIS family, not KEYLIT Kids.
 */

export function CodeTreeSection() {
  return (
    <Section id="codetree" beat={4} beatSide="left">
      <div className="max-w-[640px]">
        <Eyebrow index="06">CodeTree</Eyebrow>
        <h2 className="text-headline mt-4 text-balance">
          One genome
          <br />
          <span className="text-emphasis">becomes generations.</span>
        </h2>
        <p className="text-text-soft mt-6 leading-relaxed">
          The helix splits into a family you can read. Type is shape, connection, and symbol — not
          colour alone. Follow M-94012 from AXIS Mutant, or compare two descendants.
        </p>
      </div>

      <ul className="mt-8 flex max-w-[720px] flex-wrap gap-1.5">
        {LINEAGE_KINDS.map((kind) => {
          const meta = LINEAGE_KIND_META[kind];
          return (
            <li
              key={kind}
              className="border-line bg-panel text-muted rounded-xs border px-2 py-1 font-mono text-nano uppercase"
            >
              <span className={meta.tone} aria-hidden="true">
                {meta.glyph}
              </span>{' '}
              {kind}
            </li>
          );
        })}
      </ul>

      <figure className="mt-8 max-w-[800px]">
        <AxisCodeTree />
        <figcaption className="text-muted mt-3 font-mono text-nano uppercase">
          AXIS family · 15 projects · Field fork starts collapsed
        </figcaption>
      </figure>
    </Section>
  );
}
