import type { Metadata } from 'next';
import { DocsArticle } from '@/components/docs/DocsShell';
import { AccessionBadge } from '@/components/ui/AccessionBadge';
import { CodeBlock, DocSection } from '@/components/registry/RegistryShell';
import { listGenes } from '@/lib/registry';
import {
  CAPABILITY_ONTOLOGY,
  ONTOLOGY_LABELS,
  ontologyPath,
  type OntologyNode,
} from '@/lib/schema/gene';
import { pageMeta } from '@/lib/seo/metadata';

export const metadata: Metadata = pageMeta({
  title: 'Capability ontology',
  description:
    'The CodeAncestry capability ontology: machine-readable terms, human-readable labels, Gene Ontology spirit.',
  path: '/docs/ontology',
});

export default function OntologyPage() {
  const genes = listGenes();
  const genesByTerm = new Map<string, { id: string; name: string }[]>();
  for (const gene of genes) {
    const bucket = genesByTerm.get(gene.ontology.term) ?? [];
    bucket.push({ id: gene.id, name: gene.name });
    genesByTerm.set(gene.ontology.term, bucket);
  }

  return (
    <DocsArticle
      eyebrow="Documentation · Protocol"
      title="Capability ontology"
      lede="A lightweight, Gene Ontology-inspired tree. Machine-readable terms, human-readable labels. The tree lives in lib/schema/gene.ts — this page renders that module."
    >
      <DocSection heading="A gene is a term, not a file">
        <p>
          <code>input.music.midi.scheduling</code> is a gene. <code>src/midi/buffer.ts</code> is an
          anchor that currently implements one. That separation is what lets two projects in
          different languages be recognised as carrying the same capability.
        </p>
        <p>
          Terms are dotted, lowercase, and stable. Labels can be edited. The seeded catalogue maps{' '}
          {genes.length} genes onto {ONTOLOGY_LABELS.size} terms, including the root.
        </p>
        <CodeBlock>
          {`ontology: {
  term: "input.music.midi.scheduling",
  tags: ["midi", "audio", "latency", "realtime"]
}

${ontologyPath('input.music.midi.scheduling')
  .map((step) => `${step.term}  →  ${step.label}`)
  .join('\n')}`}
        </CodeBlock>
      </DocSection>

      <DocSection heading="The live tree">
        <p>
          Carriers listed beside a leaf come from the seeded genes. Empty leaves are reserved
          vocabulary — they exist so a later project can land on a term that is already defined.
        </p>
        <ul className="border-line rounded-lg border px-4 py-3">
          <OntologyBranch node={CAPABILITY_ONTOLOGY} genesByTerm={genesByTerm} />
        </ul>
      </DocSection>
    </DocsArticle>
  );
}

const OntologyBranch = ({
  node,
  genesByTerm,
}: {
  node: OntologyNode;
  genesByTerm: Map<string, { id: string; name: string }[]>;
}) => {
  const carriers = genesByTerm.get(node.term) ?? [];

  return (
    <li className="border-line border-b py-3 last:border-0">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <code className="text-[13px]">{node.term}</code>
        <span className="text-text-soft">{node.label}</span>
        {carriers.map((gene) => (
          <AccessionBadge key={gene.id} accession={gene.id} size="xs" />
        ))}
      </div>
      {node.description && <p className="text-muted mt-1 text-[13px]">{node.description}</p>}
      {node.children && node.children.length > 0 && (
        <ul className="border-line mt-2 ml-4 border-l pl-4">
          {node.children.map((child) => (
            <OntologyBranch key={child.term} node={child} genesByTerm={genesByTerm} />
          ))}
        </ul>
      )}
    </li>
  );
};
