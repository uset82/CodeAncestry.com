import type { Metadata } from 'next';
import { DocsArticle } from '@/components/docs/DocsShell';
import { SpecTable } from '@/components/docs/SpecTable';
import { EvidenceChip } from '@/components/ui/EvidenceChip';
import { StateBadge } from '@/components/ui/StateBadge';
import { CodeBlock, DocSection } from '@/components/registry/RegistryShell';
import {
  EVIDENCE_CODE_META,
  EVIDENCE_CODES,
  EVIDENCE_TIER_META,
  EVIDENCE_TIERS,
  LINEAGE_STATE_META,
  LINEAGE_STATES,
} from '@/lib/schema/vocabulary';
import { pageMeta } from '@/lib/seo/metadata';

export const metadata: Metadata = pageMeta({
  title: 'Evidence vocabulary',
  description:
    'Evidence codes and tiers used by the CodeAncestry registry, in the spirit of Gene Ontology evidence codes.',
  path: '/docs/evidence',
});

export default function EvidencePage() {
  return (
    <DocsArticle
      eyebrow="Documentation · Protocol"
      title="Evidence vocabulary"
      lede="Every claim states how it came to be known. That is the difference between “Git proves commit X descended from Y” and “a model believes this code implements MIDI scheduling”. Both are useful; they are not the same claim."
    >
      <DocSection heading="Three tiers">
        <p>
          The Evidence Threshold control on every registry surface dissolves anything weaker than
          the selected tier. Moving toward <em>verified</em> is how speculative inference leaves
          the picture without being deleted from the record.
        </p>
        <SpecTable
          caption="Evidence tiers from weakest to strongest"
          columns={[
            { key: 'tier', label: 'Tier', mono: true },
            { key: 'label', label: 'Label' },
            { key: 'description', label: 'Meaning' },
          ]}
          rows={EVIDENCE_TIERS.map((tier) => ({
            tier,
            label: EVIDENCE_TIER_META[tier].label,
            description: EVIDENCE_TIER_META[tier].description,
          }))}
        />
        <p>
          An earlier draft of this page listed <code>OBSERVED</code> and <code>DECLARED</code>.
          Those words are not in the live vocabulary. The registry uses the three tiers above, plus
          the nine codes below.
        </p>
      </DocSection>

      <DocSection heading="Nine codes">
        <p>
          Codes follow the spirit of Gene Ontology evidence codes: a short machine token, a human
          label, a glyph, and a tier. The glyph is never used alone.
        </p>
        <SpecTable
          caption="Evidence codes and the tier each one occupies"
          columns={[
            { key: 'chip', label: 'Code' },
            { key: 'label', label: 'Label' },
            { key: 'tier', label: 'Tier' },
            { key: 'description', label: 'Meaning' },
          ]}
          rows={EVIDENCE_CODES.map((code) => {
            const meta = EVIDENCE_CODE_META[code];
            return {
              chip: <EvidenceChip code={code} />,
              label: meta.label,
              tier: meta.tier,
              description: meta.description,
            };
          })}
        />
      </DocSection>

      <DocSection heading="Lineage states">
        <p>
          A record also carries a lineage state — a rendering concern that pairs colour, glyph,
          pattern and text so no state is hue-only.
        </p>
        <div className="flex flex-wrap gap-2">
          {LINEAGE_STATES.map((state) => (
            <StateBadge key={state} state={state} />
          ))}
        </div>
        <CodeBlock>
          {LINEAGE_STATES.map((state) => {
            const meta = LINEAGE_STATE_META[state];
            return `${meta.glyph}  ${meta.label.padEnd(12)}  ${meta.pattern.padEnd(8)}  ${meta.stroke}`;
          }).join('\n')}
        </CodeBlock>
      </DocSection>
    </DocsArticle>
  );
}
