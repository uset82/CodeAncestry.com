import type { Metadata } from 'next';
import { CodeBlock, DocSection, ReadingShell } from '@/components/registry/RegistryShell';

export const metadata: Metadata = {
  title: 'Standards interop',
  description:
    'How CodeAncestry sits on top of W3C PROV, SLSA, in-toto, CycloneDX and SPDX rather than replacing them.',
};

const STANDARDS = [
  {
    name: 'W3C PROV',
    role: 'Provenance model',
    use: 'Entities, activities and agents — the shape of the lineage graph underneath the genetic vocabulary.',
  },
  {
    name: 'SLSA',
    role: 'Supply-chain levels',
    use: 'Verifiable provenance describing where, when and how an artifact was produced.',
  },
  {
    name: 'in-toto',
    role: 'Signed statements',
    use: 'Binds a typed predicate to an immutable subject identified by digest. A mutation evaluation is exactly that shape.',
  },
  {
    name: 'CycloneDX',
    role: 'Component pedigree',
    use: 'Already models ancestors, descendants, variants, commits and patches. Ingested, never duplicated.',
  },
  {
    name: 'SPDX',
    role: 'Licensing',
    use: 'License and provenance metadata. Inheritance decisions read it; they never invent a second license syntax.',
  },
  {
    name: 'MCP / A2A',
    role: 'Agent interop',
    use: 'MCP exposes registry and sandbox as tools; A2A carries proposals between agents. Neither grants inheritance — that policy layer is ours.',
  },
];

export default function StandardsPage() {
  return (
    <ReadingShell
      eyebrow="Documentation · Standards"
      title="Built on top, not instead"
      lede="The evidence layer is not a new security universe. It is existing provenance infrastructure with a semantic layer above it."
    >
      <DocSection heading="What we interoperate with">
        <div className="border-line overflow-x-auto rounded-lg border">
          <table className="w-full text-left text-[14px]">
            <thead className="bg-panel-2 border-line border-b">
              <tr>
                <th scope="col" className="label text-muted px-4 py-3">
                  Standard
                </th>
                <th scope="col" className="label text-muted px-4 py-3">
                  Role
                </th>
                <th scope="col" className="label text-muted px-4 py-3">
                  How it is used
                </th>
              </tr>
            </thead>
            <tbody>
              {STANDARDS.map((s) => (
                <tr key={s.name} className="border-line border-b last:border-0">
                  <th scope="row" className="px-4 py-3 align-top font-mono text-[13px] font-medium">
                    {s.name}
                  </th>
                  <td className="text-muted px-4 py-3 align-top whitespace-nowrap">{s.role}</td>
                  <td className="text-text-soft px-4 py-3 align-top leading-relaxed">{s.use}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DocSection>

      <DocSection heading="A mutation evaluation as an in-toto statement">
        <p>
          The evidence attached to a mutation is not a proprietary blob. It fits the existing
          subject-plus-predicate model.
        </p>
        <CodeBlock>{`{
  "_type": "https://in-toto.io/Statement/v1",

  "subject": [
    { "name": "CAMUT:882", "digest": { "sha256": "…" } }
  ],

  "predicateType":
    "https://codeancestry.com/attestations/mutation-evaluation/v0.1",

  "predicate": {
    "sourceProject": "CAPROJ:01JKIDSES000",
    "sourceCommit": "82c134…",
    "sandbox": "CASBX:91d…",
    "tests": { "passed": 214, "failed": 0 },
    "fitness": { "latencyDeltaMs": -22, "cpuDeltaPercent": -6 }
  }
}`}</CodeBlock>
      </DocSection>

      <DocSection heading="Verification is local">
        <p>
          An attestation is not itself a guarantee. A receiving project verifies the signature{' '}
          <em>and</em> independently decides whether the evidence satisfies its own adoption policy.
          Those are two separate steps, and the second one is never delegated upstream.
        </p>
      </DocSection>
    </ReadingShell>
  );
}
