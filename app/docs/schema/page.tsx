import type { Metadata } from 'next';
import { DocsArticle } from '@/components/docs/DocsShell';
import { SchemaViewer, type SchemaViewerEntry } from '@/components/docs/SchemaViewer';
import { SpecTable } from '@/components/docs/SpecTable';
import { DocSection } from '@/components/registry/RegistryShell';
import {
  getAgentExample,
  getEdgeExample,
  getGeneExample,
  getGenomeExample,
  getMutationExample,
  pretty,
} from '@/lib/docs/examples';
import { genomeToFeatures } from '@/lib/docs/formats';
import { JSON_SCHEMA_DRAFT, listJsonSchemas } from '@/lib/docs/json-schema';
import { getRootGenome } from '@/lib/registry';
import { pageMeta } from '@/lib/seo/metadata';

export const metadata: Metadata = pageMeta({
  title: 'Live schemas',
  description:
    'JSON Schema Draft 2020-12 documents compiled from the Zod modules that validate every fixture.',
  path: '/docs/schema',
});

export default function SchemaPage() {
  const documents = listJsonSchemas();
  const genome = getRootGenome();
  const gene = getGeneExample();
  const firstAllele = gene.alleles[0];
  if (!firstAllele) throw new Error('Seed gene has no alleles');
  const mutation = getMutationExample();
  const features = genomeToFeatures(genome);

  const examples: Record<string, unknown> = {
    genome: getGenomeExample(),
    gene,
    allele: firstAllele,
    mutation,
    'agent-dna': getAgentExample(),
    'lineage-edge': getEdgeExample(),
    evidence: mutation.evidence[0],
    feature: features[0],
  };

  const entries: SchemaViewerEntry[] = documents.map((document) => ({
    id: document.id,
    title: document.title,
    description: document.description,
    href: document.href,
    schema: pretty(document.schema),
    example: document.id in examples ? pretty(examples[document.id]) : null,
  }));

  return (
    <DocsArticle
      eyebrow="Documentation · Reference"
      title="Live schemas"
      lede="JSON Schema Draft 2020-12, compiled at request time from the Zod modules in lib/schema. The examples are abridged seeded records — field names match the schema, values match the fixtures."
      wide
    >
      <DocSection heading="Draft and origin">
        <p>
          Dialect: <code>{JSON_SCHEMA_DRAFT}</code>. Generator: <code>z.toJSONSchema</code> from
          Zod 4. Fixture <code>$schema</code> URLs resolve to the same documents served at{' '}
          <code>/schemas/&lt;name&gt;/v0.1.json</code>.
        </p>
        <p>
          Phenotype has a schema and no seeded <code>CAPHENO</code> records. Export reconstructs
          phenotype lines from sandbox runs; this viewer therefore has no phenotype example.
        </p>
        <SpecTable
          caption="Published JSON Schema documents"
          columns={[
            { key: 'title', label: 'Record' },
            { key: 'href', label: 'URL', mono: true },
            { key: 'description', label: 'What it validates' },
          ]}
          rows={documents.map((document) => ({
            title: document.title,
            href: document.href,
            description: document.description,
          }))}
        />
      </DocSection>

      <DocSection heading="Viewer">
        <SchemaViewer entries={entries} />
      </DocSection>
    </DocsArticle>
  );
}
