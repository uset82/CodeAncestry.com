import type { Metadata } from 'next';
import Link from 'next/link';
import { DocsArticle } from '@/components/docs/DocsShell';
import { Mermaid } from '@/components/docs/Mermaid';
import { CodeBlock, DocSection } from '@/components/registry/RegistryShell';
import { ARCHITECTURE_DIAGRAM } from '@/lib/docs/diagrams';
import { DOCS_NAV } from '@/lib/docs/nav';
import { ACCESSION_PREFIXES } from '@/lib/schema/accession';
import { EDGE_TYPES } from '@/lib/schema/vocabulary';
import { PROPAGATION_PROTOCOL } from '@/lib/schema/mutation';
import { pageMeta } from '@/lib/seo/metadata';

export const metadata: Metadata = pageMeta({
  title: 'Protocol specification',
  description:
    'The CodeAncestry lineage protocol: accessions, genomes, genes, alleles, mutations, typed lineage edges and evidence tiers.',
  path: '/docs',
});

export default function DocsPage() {
  return (
    <DocsArticle
      eyebrow="Documentation"
      title="The lineage protocol"
      lede="A semantic layer above Git. Git keeps every commit; this records what a capability is, where it came from, and why you should believe it."
    >
      <DocSection heading="How this specification is compiled">
        <p>
          These pages are not a frozen Markdown dump. They import the same TypeScript vocabularies,
          Zod schemas and KEYLIT fixtures the registry uses. If an evidence code, an accession
          prefix or a mutation state changes, the specification changes with it.
        </p>
        <p>
          That is the documentation pipeline: live modules, rendered as the protocol. Diagrams are
          Mermaid; schemas are JSON Schema Draft 2020-12 emitted by <code>z.toJSONSchema</code>.
        </p>
      </DocSection>

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

      <DocSection heading="Architecture">
        <p>
          Every screen reads through the query layer. Fixtures feed it today;{' '}
          <code>api.codeancestry.com</code> can replace the bodies later without touching a
          component.
        </p>
        <Mermaid
          chart={ARCHITECTURE_DIAGRAM}
          caption="Fixtures validate through Zod, then the query layer feeds every surface."
        />
      </DocSection>

      <DocSection heading="The core objects">
        <p>
          A <strong>gene</strong> is a stable semantic capability — MIDI input handling, adaptive
          lesson scoring. It is deliberately not a file or a function: one capability may span many
          files, and one utility file may serve ten capabilities.
        </p>
        <p>
          An <strong>allele</strong> is one implementation of that capability. Two distant
          descendants can carry functionally equivalent alleles even though their source, language
          and version numbers differ — which is why allele is a better concept than version.
        </p>
        <p>
          A <strong>mutation</strong> is one capability changing, carrying the measurement that
          justified it. A <strong>genome</strong> is the versioned composition of a project at a
          point in its history.
        </p>
      </DocSection>

      <DocSection heading="Accessions, edges, evidence — live counts">
        <p>
          The protocol currently names {ACCESSION_PREFIXES.length} accession prefixes,{' '}
          {EDGE_TYPES.length} typed edge kinds, and a {PROPAGATION_PROTOCOL.length}-step
          propagation sequence that a mutation cannot skip. The pages below expand each of those
          from the modules that define them.
        </p>
        <CodeBlock>
          {`${ACCESSION_PREFIXES.join(' · ')}
${EDGE_TYPES.join(' · ')}
${PROPAGATION_PROTOCOL.map((step) => step.step).join(' → ')}`}
        </CodeBlock>
      </DocSection>

      <DocSection heading="Nothing propagates on its own">
        <p>
          A descendant can offer an improvement to its ancestors. It can never install one. Every
          arrow that carries a change ends at a decision made by the receiving project, under rules
          that project wrote.
        </p>
        <p>
          Connected does not mean synchronised. That single rule is what stops a lineage network
          from becoming a worm.
        </p>
      </DocSection>

      <DocSection heading="Continue">
        <ul className="flex flex-col gap-px">
          {DOCS_NAV.flatMap((group) => group.items)
            .filter((page) => page.href !== '/docs')
            .map((page) => (
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
    </DocsArticle>
  );
}
