import type { Metadata } from 'next';
import Link from 'next/link';
import { CodeBlock, DocSection, ReadingShell } from '@/components/registry/RegistryShell';

export const metadata: Metadata = {
  title: 'Protocol specification',
  description:
    'The CodeAncestry lineage protocol: accessions, genomes, genes, alleles, mutations, typed lineage edges and evidence tiers.',
};

const PAGES = [
  { href: '/docs/formats', label: 'File formats', detail: 'genome.json, gene.json, agent-dna.json' },
  { href: '/docs/standards', label: 'Standards interop', detail: 'PROV, SLSA, in-toto, CycloneDX, SPDX' },
  { href: '/docs/language', label: 'Language and ethics', detail: 'What the metaphor may and may not say' },
];

export default function DocsPage() {
  return (
    <ReadingShell
      eyebrow="Documentation"
      title="The lineage protocol"
      lede="A semantic layer above Git. Git keeps every commit; this records what a capability is, where it came from, and why you should believe it."
    >
      <DocSection heading="What this is not">
        <p>
          It is not a code host, a replacement for Git, or another SBOM. CycloneDX already models
          component pedigree — ancestors, descendants, variants, commits, patches. Recording that
          software has ancestry is not, on its own, a contribution.
        </p>
        <p>
          What sits above that layer is the contribution: semantic capability genes, alleles, a
          genotype/phenotype separation, evidence-backed annotations, agent lineage, and controlled
          inheritance between living descendants.
        </p>
      </DocSection>

      <DocSection heading="Accessions">
        <p>
          Stable identifiers matter more than human labels. Names like <code>KEYLIT</code> or{' '}
          <code>MIDI Scheduler</code> stay editable; accessions do not.
        </p>
        <CodeBlock>{`CAPROJ:01J…     project
CAGENOME:01J…   versioned genome
CAGENE:…        semantic capability
CAALLELE:…      one implementation of a capability
CAMUT:…         a recorded change
CAAGENT:…       an agent identity
CAEV:…          a piece of evidence`}</CodeBlock>
      </DocSection>

      <DocSection heading="The core objects">
        <p>
          A <strong>gene</strong> is a stable semantic capability — &ldquo;MIDI input
          handling&rdquo;, &ldquo;adaptive lesson scoring&rdquo;. It is deliberately not a file or a
          function: one capability may span many files, and one utility file may serve ten
          capabilities.
        </p>
        <p>
          An <strong>allele</strong> is one implementation of that capability. Two distant
          descendants can carry functionally equivalent alleles even though their source, language
          and version numbers differ — which is why allele is a better concept than
          &ldquo;version&rdquo;.
        </p>
        <p>
          A <strong>mutation</strong> is one capability changing, carrying the measurement that
          justified it. A <strong>genome</strong> is the versioned composition of a project at a
          point in its history.
        </p>
      </DocSection>

      <DocSection heading="Lineage is a graph, not a tree">
        <p>
          Hybrids have more than one parent, so the structure is a directed acyclic graph with typed
          edges, not a family tree.
        </p>
        <CodeBlock>{`DERIVED_FROM      child genome from a parent
RECOMBINED_FROM   multi-parent hybrid
MUTATED_FROM      allele from a previous allele
TRANSFERRED_FROM  capability across unrelated families
PROPOSED_TO       an offer awaiting a decision
ADOPTED_FROM      an offer that was accepted
REJECTED_FROM     an offer that was declined`}</CodeBlock>
      </DocSection>

      <DocSection heading="Evidence tiers">
        <p>
          Every record states how it came to be known. This is the difference between &ldquo;Git
          proves commit X descended from Y&rdquo; and &ldquo;a model believes this code implements
          MIDI scheduling&rdquo;. Both are useful; they are not the same claim.
        </p>
        <CodeBlock>{`OBSERVED   read directly from a repository or API
DECLARED   asserted by the project owner
INFERRED   derived from analysis or a model, with a confidence
REVIEWED   accepted by an authorised human
VERIFIED   confirmed cryptographically or by measurement`}</CodeBlock>
      </DocSection>

      <DocSection heading="Nothing propagates on its own">
        <p>
          A descendant can offer an improvement to its ancestors. It can never install one. Every
          arrow that carries a change ends at a decision made by the receiving project, under rules
          that project wrote.
        </p>
        <CodeBlock>{`Discover → Describe → Attest → Sandbox → Test
        → Evaluate fitness → Policy → Adopt / Reject / Quarantine`}</CodeBlock>
        <p>
          Connected does not mean synchronised. That single rule is what stops a lineage network
          from becoming a worm.
        </p>
      </DocSection>

      <DocSection heading="Continue">
        <ul className="flex flex-col gap-px">
          {PAGES.map((page) => (
            <li key={page.href}>
              <Link
                href={page.href}
                className="border-line hover:bg-panel-2 group flex items-baseline justify-between gap-4 border-b py-4 transition-colors"
              >
                <span className="group-hover:text-acid font-medium transition-colors">
                  {page.label}
                </span>
                <span className="text-faint text-[13px]">{page.detail}</span>
              </Link>
            </li>
          ))}
        </ul>
      </DocSection>
    </ReadingShell>
  );
}
