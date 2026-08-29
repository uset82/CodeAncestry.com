import { getFamilyStats } from '@/lib/registry';
import { StatRail } from '@/components/ui/Panel';
import { Eyebrow, Section } from './Section';
import { WaitlistForm } from './Waitlist';

/**
 * The closing section. The stat rail is computed from the seeded fixtures, so
 * the numbers next to the form are the same numbers the registry pages show.
 */
export function JoinSection() {
  const stats = getFamilyStats();

  return (
    <Section id="join" beat={11} className="min-h-screen">
      <div className="grid gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
        <div>
          <Eyebrow index="06">Alpha</Eyebrow>
          <h2 className="text-headline mt-4 text-balance">
            Generate your project&rsquo;s
            <br />
            <span className="text-emphasis">first genome.</span>
          </h2>
          <p className="text-text-soft mt-6 max-w-[540px] leading-relaxed">
            The alpha reads a repository you already own, proposes its capability genes, and shows
            you what it believes and why. You correct it. Nothing is published without you saying
            so, and inference is never presented as fact.
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
        </div>

        <div className="bg-void/90 relative rounded-xl">
          <WaitlistForm />

          <div className="border-line/60 mt-10 border-t pt-6">
            <p className="text-muted font-mono text-nano uppercase">What the alpha will not do</p>
            <ul className="text-faint mt-3 space-y-1.5 text-[13.5px]">
              <li>Write to your repository, open pull requests, or push commits.</li>
              <li>Publish anything about a private project without explicit consent.</li>
              <li>Store agent reasoning traces or prompt contents.</li>
              <li>Adopt a change into any project on its own.</li>
            </ul>
          </div>
        </div>
      </div>
    </Section>
  );
}
