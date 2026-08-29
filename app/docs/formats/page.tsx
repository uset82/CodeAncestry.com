import type { Metadata } from 'next';
import { DocsArticle } from '@/components/docs/DocsShell';
import { CodeBlock, DocSection } from '@/components/registry/RegistryShell';
import { getAgentExample, getGeneExample, getGenomeExample, pretty } from '@/lib/docs/examples';
import { featuresToJsonl, genomeToFeatures, mutationToCavcf } from '@/lib/docs/formats';
import { getHeroMutation, getRootGenome } from '@/lib/registry';
import { pageMeta } from '@/lib/seo/metadata';

export const metadata: Metadata = pageMeta({
  title: 'File formats',
  description:
    'genome.json, gene.json, agent-dna.json, mutation.cavcf and features.jsonl — the portable records a repository carries.',
  path: '/docs/formats',
});

export default function FormatsPage() {
  const genome = getRootGenome();
  const mutation = getHeroMutation();
  const features = genomeToFeatures(genome);
  const featurePreview = featuresToJsonl(features.slice(0, 3));

  return (
    <DocsArticle
      eyebrow="Documentation · Reference"
      title="Portable records"
      lede="Bioinformatics never forces everything into one file. FASTA carries sequence, GFF carries features, VCF carries variants. The same separation applies here. Examples below are abridged seeded records — the field names are the live schema, not an older draft."
    >
      <DocSection heading="genome.json" id="genome">
        <p>
          Lives in the repository. Describes what the project is composed of at one commit, and who
          it descends from. Identity is <code>id</code>, not <code>genome_id</code>. The source
          digest is <code>treeDigest</code>. A gene reference points at <code>gene</code> and{' '}
          <code>allele</code> accessions.
        </p>
        <CodeBlock>{pretty(getGenomeExample())}</CodeBlock>
        <p>
          A child declares what it inherited rather than silently copying it. That is the whole
          difference between a fork and a recorded descent. {genome.name} is generation{' '}
          {genome.generation} and has {genome.parents.length} parents; its children name it
          explicitly.
        </p>
      </DocSection>

      <DocSection heading="gene.json" id="gene">
        <p>
          Describes semantics separately from implementation. Ontology uses a dotted{' '}
          <code>term</code>, not a free-form <code>class</code>. Alleles carry their own digest,
          language, anchors and interfaces.
        </p>
        <CodeBlock>{pretty(getGeneExample())}</CodeBlock>
      </DocSection>

      <DocSection heading="agent-dna.json" id="agent">
        <p>
          Deliberately contains portable, consented information — never model weights, hidden
          reasoning or private memory. It records what an agent <em>did, asserted, tested and
          shared</em>, not everything it thought. Identity is <code>id</code>; the provider lives
          on <code>identity.provider</code>.
        </p>
        <CodeBlock>{pretty(getAgentExample())}</CodeBlock>
        <p>
          Telemetry defaults to metadata only. Full prompt and completion capture is technically
          possible and stays opt-in. <code>trust.privateReasoningStored</code> is typed as
          literally <code>false</code>, so the schema itself forbids storing it.
        </p>
      </DocSection>

      <DocSection heading="mutation.cavcf" id="cavcf">
        <p>
          A VCF-inspired variant call. The reference and alternate are content digests, not source
          text — the format must not become a vehicle for embedding proprietary code. Columns
          follow the VCF convention: <code>CHROM POS ID REF ALT QUAL FILTER INFO</code>.{' '}
          <code>CHROM</code> is the gene; <code>POS</code> is the reference allele.
        </p>
        <p>
          Generated from {mutation.id} ({mutation.shortId}), the mutation this site exists to
          explain.
        </p>
        <CodeBlock>{mutationToCavcf(mutation)}</CodeBlock>
      </DocSection>

      <DocSection heading="features.jsonl" id="features">
        <p>
          GFF-inspired locus records. One JSON object per line maps a source path and range onto a
          gene, an allele, an inheritance mode and the evidence that supports the annotation.
          {` `}
          {genome.name} currently yields {features.length} feature lines from its genome anchors.
          Three of them:
        </p>
        <CodeBlock>{featurePreview}</CodeBlock>
      </DocSection>

      <DocSection heading="Validation">
        <p>
          Schemas are JSON Schema Draft 2020-12, served from{' '}
          <code>/schemas/&lt;name&gt;/v0.1.json</code>. Identifiers are content-addressed where
          possible, so a lineage record survives a repository being renamed or moved. The NCBI-style
          export package on each project page bundles these files with evidence, attestations and a
          README.
        </p>
      </DocSection>
    </DocsArticle>
  );
}
