import {
  getChildren,
  getGene,
  getGenome,
  getMutationsForGenome,
  resolveEvidence,
} from '@/lib/registry';
import { getProvenanceForGenome } from '@/lib/registry/provenance';
import type { ZipEntry } from '@/lib/export/zip';
import type { Evidence } from '@/lib/schema/common';
import type { Gene } from '@/lib/schema/gene';
import type { Genome } from '@/lib/schema/genome';
import type { Mutation, Phenotype } from '@/lib/schema/mutation';

/**
 * NCBI-style data package for a genome.
 *
 * NCBI ships an assembly as a folder of named files plus a README that says
 * what each file is and what it is not. The same shape here: the genome, the
 * genes it carries, the mutations that touched it, the evidence those records
 * cite, the attestations bound to them, and a reconstructed phenotype file
 * from the sandbox runs — because the fixtures do not store CAPHENO records
 * separately.
 */

export type PackageFile = ZipEntry & {
  /** One-line description used in the README and the export panel. */
  description: string;
};

export type DataPackage = {
  accession: string;
  name: string;
  slug: string;
  filename: string;
  files: PackageFile[];
};

function safeName(accession: string): string {
  return accession.replaceAll(':', '-');
}

function json(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function phenotypesFrom(mutations: Mutation[], genomeId: string): Phenotype[] {
  return mutations.flatMap((mutation) =>
    mutation.sandboxRuns.map((run, index) => ({
      id: `CAPHENO:${mutation.id.replace('CAMUT:', '')}-${index + 1}` as Phenotype['id'],
      genome: (mutation.originGenome === genomeId
        ? genomeId
        : mutation.originGenome) as Phenotype['genome'],
      environment: {
        browser: run.environment.browser ?? 'unspecified',
        os: run.environment.os,
        deviceProfile: run.environment.deviceProfile ?? 'unspecified',
      },
      metrics: {
        testsPassed: run.testsPassed,
        testsTotal: run.testsTotal,
        durationSeconds: run.durationSeconds,
        ...Object.fromEntries(
          mutation.fitness.deltas.map((delta, deltaIndex) => [
            `${delta.metric.replaceAll(/\s+/g, '_')}_${deltaIndex}`,
            Number.parseFloat(delta.after) || 0,
          ]),
        ),
      },
      evidence: run.id,
      runDigest: run.runDigest,
    })),
  );
}

function readme(genome: Genome, files: PackageFile[], genes: Gene[], mutations: Mutation[]): string {
  const children = getChildren(genome.id);
  const lines = [
    `${genome.name} — CodeAncestry data package`,
    '='.repeat(Math.min(72, genome.name.length + 28)),
    '',
    `Accession:     ${genome.id}`,
    `Project:       ${genome.project}`,
    `Generation:    ${genome.generation}`,
    `Created:       ${genome.createdAt}`,
    `Repository:    ${genome.source.repository}`,
    `Commit:        ${genome.source.commit}`,
    `Tree digest:   ${genome.source.treeDigest}`,
    `License:       ${genome.licenses.spdxExpression}`,
    `Lineage:       ${genome.lineageAssurance}`,
    '',
    genome.description,
    '',
    'This package is the NCBI-style dump of one genome record: the manifest, the',
    'capability genes it carries, the mutations that originated in or were offered',
    'to it, the evidence those records cite, the attestations bound to them, and a',
    'phenotype file reconstructed from sandbox runs.',
    '',
    'It is not a source checkout. Git remains the source of truth for the code.',
    'The genome is a versioned statement about what the project is composed of.',
    '',
    'Contents',
    '--------',
    ...files.map((file) => `  ${file.path.padEnd(36)} ${file.description}`),
    '',
    `Capabilities carried: ${genes.length}`,
    ...genes.map((gene) => {
      const ref = genome.genes.find((entry) => entry.gene === gene.id);
      return `  - ${gene.name} (${gene.id}) allele ${ref?.version ?? '—'} · ${ref?.inheritance ?? '—'}`;
    }),
    '',
    `Mutations in this package: ${mutations.length}`,
    ...mutations.map((mutation) => `  - ${mutation.shortId} ${mutation.title} (${mutation.id})`),
    '',
    'Parents',
    '-------',
    ...(genome.parents.length === 0
      ? ['  None. This is the generation-zero genome.']
      : genome.parents.map((parent) => {
          const name = getGenome(parent.genome)?.name ?? parent.genome;
          return `  - ${name} (${parent.genome}) ${parent.relationship} ${Math.round(parent.contribution * 100)}%`;
        })),
    '',
    'Direct descendants',
    '------------------',
    ...(children.length === 0
      ? ['  None recorded.']
      : children.map((child) => `  - ${child.name} (${child.id}) generation ${child.generation}`)),
    '',
    'Honesty',
    '-------',
    'Every file is assembled from the seeded KEYLIT fixtures, not from a live',
    'scan of the repository. Attestation `verified` flags are the ingest-time',
    'result stored in the seed; this package does not re-check signatures.',
    'Phenotypes are reconstructed from sandbox runs because CAPHENO records are',
    'not stored as a separate fixture.',
    '',
    `Generated by CodeAncestry registry 0.1 for ${genome.id}.`,
    '',
  ];

  return lines.join('\n');
}

export function getDataPackage(id: string): DataPackage | null {
  const genome = getGenome(id);
  if (!genome) return null;

  const genes = genome.genes
    .map((ref) => getGene(ref.gene))
    .filter((gene): gene is Gene => gene !== null);

  const mutations = getMutationsForGenome(genome.id);
  const evidenceIds = [
    ...genome.genes.flatMap((ref) => ref.evidence),
    ...mutations.flatMap((mutation) => [
      ...mutation.evidence.map((entry) => entry.id),
      ...mutation.sandboxRuns.map((run) => run.id),
    ]),
  ];
  const evidence: Evidence[] = resolveEvidence([...new Set(evidenceIds)]);
  const attestations = [
    ...genome.attestations,
    ...mutations.flatMap((mutation) => mutation.attestations),
  ];
  const phenotypes = phenotypesFrom(mutations, genome.id);
  const provenance = getProvenanceForGenome(genome.id);

  const files: PackageFile[] = [
    {
      path: 'genome.json',
      body: json(genome),
      description: 'The genome manifest: capabilities, parents, releases, privacy.',
    },
    ...genes.map((gene) => ({
      path: `genes/${safeName(gene.id)}.json`,
      body: json(gene),
      description: `${gene.name} — capability gene and its alleles.`,
    })),
    ...mutations.map((mutation) => ({
      path: `mutations/${safeName(mutation.id)}.json`,
      body: json(mutation),
      description: `${mutation.shortId} ${mutation.title}.`,
    })),
    {
      path: 'phenotypes.jsonl',
      body:
        phenotypes.length === 0
          ? ''
          : `${phenotypes.map((entry) => JSON.stringify(entry)).join('\n')}\n`,
      description: 'Sandbox-run phenotypes, one JSON object per line.',
    },
    {
      path: 'evidence.json',
      body: json(evidence),
      description: 'Evidence records cited by the genome and its mutations.',
    },
    {
      path: 'attestations.json',
      body: json(attestations),
      description: 'SLSA, in-toto, CycloneDX and SPDX attestations on record.',
    },
    {
      path: 'prov.json',
      body: json(
        provenance
          ? {
              subject: provenance.subject,
              slsa: provenance.slsa,
              triples: provenance.triples,
              nodes: provenance.nodes,
              pedigree: provenance.pedigree,
              statements: provenance.statements.map((entry) => entry.statement),
            }
          : null,
      ),
      description: 'W3C PROV triples reconstructed from the same records.',
    },
  ];

  const readmeFile: PackageFile = {
    path: 'README.txt',
    body: readme(genome, files, genes, mutations),
    description: 'What this package contains, and what it does not.',
  };

  return {
    accession: genome.id,
    name: genome.name,
    slug: genome.slug,
    filename: `${genome.slug}-${safeName(genome.id)}.zip`,
    files: [readmeFile, ...files],
  };
}
