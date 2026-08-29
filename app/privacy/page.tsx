import type { Metadata } from 'next';
import { DocSection, ReadingShell } from '@/components/registry/RegistryShell';
import { pageMeta } from '@/lib/seo/metadata';

export const metadata: Metadata = pageMeta({
  title: 'Privacy',
  description: 'What this concept site collects, which is very little, and what a future product would commit to.',
  path: '/privacy',
});

export default function PrivacyPage() {
  return (
    <ReadingShell
      eyebrow="Policy"
      title="Privacy"
      lede="This site is a working concept with no backend, no accounts and no repository access. That makes most of this page short."
    >
      <DocSection heading="What this site collects today">
        <p>
          Nothing is transmitted to a server by the registry screens. Every genome, gene, mutation
          and agent shown here comes from fixtures compiled into the page.
        </p>
        <p>
          The waitlist form does not post anywhere — the confirmation it shows says so explicitly.
          The assistant panel is the one exception: messages you type there are sent to OpenRouter
          to generate a reply, and are not stored by this site.
        </p>
      </DocSection>

      <DocSection heading="What the product would commit to">
        <p>
          A lineage record can reveal a great deal: developer identities, commit activity, corporate
          architecture, unreleased capabilities, failed experiments and AI interactions. Provenance
          visibility is therefore an explicit scope, never an automatic consequence of connecting a
          repository.
        </p>
        <p>Visibility is set independently at each layer:</p>
        <ul className="ml-5 flex list-disc flex-col gap-1.5">
          <li>Project</li>
          <li>Genome metadata</li>
          <li>Gene names</li>
          <li>Source loci</li>
          <li>Mutation content</li>
        </ul>
      </DocSection>

      <DocSection heading="Agent telemetry">
        <p>
          The rule is that the registry stores what an agent <strong>did, asserted, tested and
          shared</strong> — not a compulsory copy of everything it thought or everything you said to
          it.
        </p>
        <p>Metadata only is the default. Anything richer is opt-in, per project:</p>
        <ul className="ml-5 flex list-disc flex-col gap-1.5">
          <li>None</li>
          <li>Metadata only — the default</li>
          <li>Tool inputs and outputs</li>
          <li>Conversation excerpts</li>
          <li>Full authorised traces</li>
        </ul>
        <p className="text-muted">
          Never collected under any setting: private model weights, provider-internal reasoning, or
          data not available through an authorised interface.
        </p>
      </DocSection>

      <DocSection heading="Contact">
        <p>
          This is a concept, not a company, and there is no data controller to write to yet. When
          that changes, this page changes with it.
        </p>
        <p className="text-faint mt-6 font-mono text-[12px]">Updated 28 August 2026 · stub</p>
      </DocSection>
    </ReadingShell>
  );
}
