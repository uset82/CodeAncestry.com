import type { Metadata } from 'next';
import { DocSection, ReadingShell } from '@/components/registry/RegistryShell';

export const metadata: Metadata = {
  title: 'Language and ethics',
  description:
    'Genetics is used here as an information-system model, not as a metaphor for human worth. The vocabulary rules that follow from that.',
};

const VOCABULARY = [
  { avoid: 'Superior / inferior gene', use: 'Higher-scoring allele under environment X' },
  { avoid: 'Purity', use: 'Contribution share' },
  { avoid: 'Bloodline', use: 'Lineage' },
  { avoid: 'Dominant', use: 'Most adopted' },
  { avoid: 'Fitness score', use: 'Fitness vector, per axis, per environment' },
  { avoid: 'Breeding / selection pressure', use: 'Adoption policy' },
];

export default function LanguagePage() {
  return (
    <ReadingShell
      eyebrow="Documentation · Language"
      title="Genetics as a model, not a verdict"
      lede="The first rule: use genetics as an information-system model, never as a metaphor for human worth."
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

      <DocSection heading="Vocabulary">
        <div className="border-line overflow-x-auto rounded-lg border">
          <table className="w-full text-left text-[14px]">
            <thead className="bg-panel-2 border-line border-b">
              <tr>
                <th scope="col" className="label text-muted px-4 py-3">
                  Do not use
                </th>
                <th scope="col" className="label text-muted px-4 py-3">
                  Use instead
                </th>
              </tr>
            </thead>
            <tbody>
              {VOCABULARY.map((row) => (
                <tr key={row.avoid} className="border-line border-b last:border-0">
                  <td className="text-rose px-4 py-3 align-top line-through">{row.avoid}</td>
                  <td className="text-text-soft px-4 py-3 align-top">{row.use}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DocSection>

      <DocSection heading="Fitness is never one number">
        <p>
          There is no scientifically meaningful software equivalent of a universally stronger gene.
          A change that lowers latency may cost memory. One that improves accessibility may add
          bundle size. An enterprise security policy may reject behaviour that is ideal for a
          hobbyist.
        </p>
        <p>
          Fitness is therefore stored and displayed as a vector across correctness, security,
          performance, compatibility, maintainability and user outcome — measured in a stated
          environment. Any aggregate is a policy-specific view, never the canonical truth.
        </p>
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
    </ReadingShell>
  );
}
