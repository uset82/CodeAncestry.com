import type { Metadata } from 'next';
import { DocsArticle } from '@/components/docs/DocsShell';
import { SpecTable } from '@/components/docs/SpecTable';
import { DocSection } from '@/components/registry/RegistryShell';
import { FITNESS_AXIS_META, FITNESS_AXES } from '@/lib/schema/vocabulary';
import { pageMeta } from '@/lib/seo/metadata';

export const metadata: Metadata = pageMeta({
  title: 'Language and ethics',
  description:
    'Genetics is used here as an information-system model, not as a metaphor for human worth. The vocabulary rules that follow from that.',
  path: '/docs/language',
});

const MANDATED = [
  { use: 'Lineage', avoid: 'Bloodline' },
  { use: 'Variant / allele', avoid: 'Dominant / recessive' },
  { use: 'Capability', avoid: 'Superior / inferior gene' },
  { use: 'Fitness under environment X', avoid: 'Fitness score, breeding, selection pressure' },
  { use: 'Contribution share', avoid: 'Purity' },
  { use: 'Most adopted', avoid: 'Dominant' },
  { use: 'Adoption policy', avoid: 'Breeding / selection pressure' },
];

export default function LanguagePage() {
  return (
    <DocsArticle
      eyebrow="Documentation · Practice"
      title="Genetics as a model, not a verdict"
      lede="The first rule: use genetics as an information-system model, never as a metaphor for human worth. Use lineage, variant, capability, fitness under environment X. Never bloodline, purity, dominant, superior genes."
    >
      <DocSection heading="Why this page exists">
        <p>
          Words like <em>fitness</em>, <em>selection</em>, <em>purity</em> and{' '}
          <em>superior genes</em> carry historical and social weight far beyond software. Eugenics
          is a discredited ideology associated with scientific racism, colonialism and ableism, and
          its vocabulary is not available for reuse just because the objects here are repositories.
        </p>
        <p>
          The metaphor earns its place by making lineage legible. It loses that place the moment it
          starts ranking things as intrinsically better or worse.
        </p>
      </DocSection>

      <DocSection heading="Mandated vocabulary">
        <p>
          This table is a rule, not a suggestion. Copy on this site, in the protocol, and in any
          paper that cites the protocol is expected to stay on the right-hand column.
        </p>
        <SpecTable
          caption="Forbidden genetic metaphors and the terms that replace them"
          columns={[
            { key: 'avoid', label: 'Do not use' },
            { key: 'use', label: 'Use instead' },
          ]}
          rows={MANDATED.map((row) => ({
            avoid: row.avoid,
            use: row.use,
          }))}
        />
      </DocSection>

      <DocSection heading="Fitness is never one number">
        <p>
          There is no scientifically meaningful software equivalent of a universally stronger gene.
          A change that lowers latency may cost memory. One that improves accessibility may add
          bundle size. An enterprise security policy may reject behaviour that is ideal for a
          hobbyist.
        </p>
        <p>
          Fitness is therefore stored and displayed as a vector across {FITNESS_AXES.length} axes,
          measured in a stated environment. Any aggregate is a policy-specific view, never the
          canonical truth.
        </p>
        <SpecTable
          caption="Fitness axes. There is no seventh combined score."
          columns={[
            { key: 'symbol', label: 'Axis', mono: true },
            { key: 'label', label: 'Name' },
            { key: 'description', label: 'What it measures' },
          ]}
          rows={FITNESS_AXES.map((axis) => ({
            symbol: FITNESS_AXIS_META[axis].symbol,
            label: FITNESS_AXIS_META[axis].label,
            description: FITNESS_AXIS_META[axis].description,
          }))}
        />
      </DocSection>

      <DocSection heading="Compatibility is not permission">
        <p>
          An ancestry record must never imply that technical compatibility equals legal permission.
          Horizontal capability transfer in software means copying or adapting protected work. Every
          inherited gene carries license metadata, attribution and an explicit inheritance decision.
        </p>
        <p>An unknown license means unknown — not &ldquo;probably reusable&rdquo;.</p>
      </DocSection>

      <DocSection heading="Authorship">
        <p>
          Human authorship, AI-assisted operation, source material and subsequent human review are
          recorded separately. An agent is never automatically declared a copyright owner, and
          prompting a system does not by itself establish authorship in generated material.
        </p>
      </DocSection>

      <DocSection heading="Accessibility of the metaphor">
        <p>
          Colour is never the only encoding for inherited, mutated, inferred, quarantined or
          verified. Every state pairs colour with a glyph, a pattern and a text label, and every
          visualisation has a keyboard-navigable, screen-readable equivalent.
        </p>
      </DocSection>
    </DocsArticle>
  );
}
