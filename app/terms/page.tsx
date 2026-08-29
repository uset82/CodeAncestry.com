import type { Metadata } from 'next';
import { DocSection, ReadingShell } from '@/components/registry/RegistryShell';
import { pageMeta } from '@/lib/seo/metadata';

export const metadata: Metadata = pageMeta({
  title: 'Terms',
  description: 'The status of this site, what the demonstration data is, and what is not being claimed.',
  path: '/terms',
});

export default function TermsPage() {
  return (
    <ReadingShell
      eyebrow="Policy"
      title="Terms"
      lede="A working concept published for discussion. No service is being offered and no guarantee is being made."
    >
      <DocSection heading="Status of this site">
        <p>
          CodeAncestry is a design and protocol proposal. It is not a product, and nothing here
          constitutes an offer of a service or a commitment to build one.
        </p>
      </DocSection>

      <DocSection heading="The demonstration data">
        <p>
          Every project, genome, gene, allele, mutation, agent and piece of evidence on this site is
          a seeded fixture describing a fictional eight-project KEYLIT family. The measurements —
          latencies, coverage figures, compatibility counts — are interface examples, not results.
        </p>
        <p>
          They are labelled as fixtures throughout precisely so nobody mistakes an illustration for
          a benchmark.
        </p>
      </DocSection>

      <DocSection heading="Names and marks">
        <p>
          Registering <span className="font-mono text-[13px]">codeancestry.com</span> does not by
          itself create trademark rights. Two questions remain open and must be cleared before
          company-wide branding, merchandise or a fundraise: a separate 2026 project already used
          the name “CodeAncestry”, and Ancestry is an existing brand with published trademark
          guidelines. Neither fact decides infringement on its own. They are why professional
          clearance is still required.
        </p>
        <p>
          The names of the genomics resources referenced in the research — NCBI, Ensembl, UCSC,
          UniProt, Gene Ontology, Nextstrain, 23andMe, DeepMind — belong to their respective
          owners. They are cited here as design precedents. No affiliation or endorsement is
          implied.
        </p>
      </DocSection>

      <DocSection heading="Ancestry is not permission">
        <p>
          Nothing on this site should be read as legal advice about reuse. A recorded lineage
          relationship describes where a capability came from; it never establishes that you are
          licensed to copy it. Technical compatibility and legal permission are separate questions,
          and only the second one is answered by a license.
        </p>
      </DocSection>

      <DocSection heading="No warranty">
        <p>
          The site is provided as-is, without warranty of any kind, and may change or disappear
          without notice.
        </p>
        <p className="text-faint mt-6 font-mono text-[12px]">Updated 28 August 2026 · stub</p>
      </DocSection>
    </ReadingShell>
  );
}
