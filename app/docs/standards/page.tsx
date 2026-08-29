import type { Metadata } from 'next';
import { DocsArticle } from '@/components/docs/DocsShell';
import { SpecTable } from '@/components/docs/SpecTable';
import { CodeBlock, DocSection } from '@/components/registry/RegistryShell';
import { getMutationExample, pretty } from '@/lib/docs/examples';
import { pageMeta } from '@/lib/seo/metadata';

export const metadata: Metadata = pageMeta({
  title: 'Standards interop',
  description:
    'How CodeAncestry sits on top of W3C PROV, SLSA 1.2, in-toto, CycloneDX, SPDX, MCP and A2A rather than replacing them.',
  path: '/docs/standards',
});

const STANDARDS = [
  {
    name: 'W3C PROV',
    role: 'Provenance model',
    use: 'Entities, activities and agents. The lineage graph is a reading of PROV triples (wasDerivedFrom, wasGeneratedBy, used, wasAssociatedWith, wasAttributedTo), not a replacement for them.',
    adds: 'Genetic vocabulary on top of the triples. The registry never claims PROV is optional.',
  },
  {
    name: 'SLSA 1.2',
    role: 'Supply-chain levels',
    use: 'Verifiable provenance describing where, when and how an artifact was produced. Hosted-builder attestations (a workflow URL or github-artifact-attestation) are inferred up to Build L2.',
    adds: 'A semantic mutation record that can point at SLSA provenance. We never claim L3 from fixtures. Signatures are not re-checked in the browser.',
  },
  {
    name: 'in-toto',
    role: 'Signed statements',
    use: 'Binds a typed predicate to an immutable subject identified by digest. A mutation evaluation is exactly that shape.',
    adds: 'Predicate types for mutation evaluation. Statements on this site are reconstructed from stored attestations; the original signed body is not in the fixtures.',
  },
  {
    name: 'CycloneDX',
    role: 'Component pedigree',
    use: 'Already models ancestors, descendants, variants, commits and patches. Ingested, never duplicated.',
    adds: 'Capability genes and alleles above the component list. Pedigree answers “what was this built from”; a genome answers “what can it do, and who taught it”.',
  },
  {
    name: 'SPDX',
    role: 'Licensing',
    use: 'License expressions on genomes and genes. Inheritance decisions read SPDX; they never invent a second license syntax.',
    adds: 'An explicit inheritance decision next to the expression. An unknown license stays unknown.',
  },
  {
    name: 'MCP',
    role: 'Tool surface',
    use: 'Exposes the registry and the sandbox as tools an agent may call, with an explicit scope.',
    adds: 'The policy envelope. Holding a tool URI does not grant inheritance.',
  },
  {
    name: 'A2A',
    role: 'Agent messaging',
    use: 'Carries proposals between agents — compare, request-test, offer a mutation.',
    adds: 'The decision still belongs to the receiving project. A2A is transport, not consent.',
  },
];

export default function StandardsPage() {
  const mutation = getMutationExample();
  const evaluation = {
    _type: 'https://in-toto.io/Statement/v1',
    subject: [
      {
        name: mutation.id,
        digest: { sha256: mutation.change.altDigest.replace(/^sha256:/, '') },
      },
    ],
    predicateType: 'https://codeancestry.com/attestations/mutation-evaluation/v0.1',
    predicate: {
      reconstructed: true,
      sourceGenome: mutation.originGenome,
      sourceCommit: mutation.change.commit,
      gene: mutation.gene,
      fromAllele: mutation.fromAllele,
      toAllele: mutation.toAllele,
      tests: mutation.evidence
        .filter((item) => item.code === 'TST')
        .map((item) => ({ id: item.id, summary: item.summary, count: item.count })),
      fitness: mutation.fitness.deltas,
      checklist: mutation.checklist,
    },
  };

  return (
    <DocsArticle
      eyebrow="Documentation · Reference"
      title="Built on top, not instead"
      lede="The evidence layer is not a new security universe. It is existing provenance infrastructure with a semantic layer above it. The honest question is not “which standard we replace” but “what we add that those standards do not already say”."
      wide
    >
      <DocSection heading="What we interoperate with">
        <SpecTable
          caption="Standards CodeAncestry consumes, and what it adds on top of each"
          columns={[
            { key: 'name', label: 'Standard', mono: true },
            { key: 'role', label: 'Role' },
            { key: 'use', label: 'How it is used' },
            { key: 'adds', label: 'What we add' },
          ]}
          rows={STANDARDS.map((item) => ({
            name: item.name,
            role: item.role,
            use: item.use,
            adds: item.adds,
          }))}
        />
      </DocSection>

      <DocSection heading="What CodeAncestry adds">
        <p>The standards already cover pedigree, licensing, signed statements and build provenance. They do not cover:</p>
        <ul className="text-text-soft list-disc space-y-2 pl-5 leading-relaxed">
          <li>A stable semantic capability that can be recognised across languages.</li>
          <li>Alleles of that capability, with measured fitness in a stated environment.</li>
          <li>A genotype / phenotype split — what the project is composed of versus how it behaved when run.</li>
          <li>Agent identity that records deeds and forbids private reasoning.</li>
          <li>A propagation protocol that cannot install a change on a relative without that relative&apos;s decision.</li>
        </ul>
      </DocSection>

      <DocSection heading="A mutation evaluation as an in-toto statement">
        <p>
          Reconstructed from the seeded attestations on {mutation.id}. The{' '}
          <code>reconstructed: true</code> flag is required: the original signed body is not in
          the fixtures, and this page will not pretend otherwise.
        </p>
        <CodeBlock>{pretty(evaluation)}</CodeBlock>
      </DocSection>

      <DocSection heading="SLSA ceiling">
        <p>
          Hosted-builder provenance (a workflow file URL, or a GitHub artifact attestation) is
          inferred only up to <strong>Build L2</strong>. Nothing on this site claims L3. An
          attestation marked verified in the seed data means the fixture says the signature checked
          at ingest — the browser does not re-check it.
        </p>
      </DocSection>

      <DocSection heading="Verification is local">
        <p>
          An attestation is not itself a guarantee. A receiving project verifies the signature{' '}
          <em>and</em> independently decides whether the evidence satisfies its own adoption policy.
          Those are two separate steps, and the second one is never delegated upstream.
        </p>
      </DocSection>
    </DocsArticle>
  );
}
