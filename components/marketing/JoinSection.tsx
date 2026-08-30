import { getFamilyStats } from '@/lib/registry';
import { StatRail } from '@/components/ui/Panel';
import { Eyebrow, Section } from './Section';
import { WaitlistForm } from './Waitlist';

/**
 * The closing section. All body copy sits in the reading column — including
 * the honesty list — so the specimen cannot run through it.
 */
export function JoinSection() {
  const stats = getFamilyStats();

  return (
    <Section id="join" beat={11} beatSide="left" className="min-h-screen">
      <div className="max-w-[560px]">
        <Eyebrow index="17">Alpha</Eyebrow>
        <h2 className="text-headline mt-4 text-balance">
          Connect your
          <br />
          <span className="text-emphasis">repository.</span>
        </h2>
        <p className="text-text-soft mt-6 leading-relaxed">
          The alpha reads a repository you already own, proposes its first genome — the capability
          genes it believes are there — and shows you what it believes and why. You correct it.
          Nothing is published without you saying so, and inference is never presented as fact.
        </p>

        <StatRail
          className="mt-10"
          stats={[
            { label: 'Seeded genomes', value: stats.genomes, hint: `${stats.generations} gens` },
            { label: 'Capability genes', value: stats.genes, hint: `${stats.alleles} alleles` },
            { label: 'Mutations recorded', value: stats.mutations },
            {
              label: 'Automatic adoptions',
              value: stats.unsafeAutoAdoptions,
              hint: 'by design',
            },
          ]}
        />

        <div className="mt-12">
          <WaitlistForm />
        </div>

        <div className="border-line/60 mt-10 border-t pt-6">
          <p className="text-muted font-mono text-nano uppercase">What the alpha will not do</p>
          <ul className="text-muted mt-3 space-y-1.5 text-[13.5px]">
            <li>Write to your repository, open pull requests, or push commits.</li>
            <li>Publish anything about a private project without explicit consent.</li>
            <li>Store agent reasoning traces or prompt contents.</li>
            <li>Adopt a change into any project on its own.</li>
          </ul>
        </div>
      </div>
    </Section>
  );
}
