import { getFamilyStats, listGenes, listGenomes } from '@/lib/registry';
import { getFamilyTree } from '@/lib/registry/tree';
import {
  EDGE_TYPE_META,
  EVIDENCE_CODE_META,
  INHERITANCE_META,
  LINEAGE_STATE_META,
  MUTATION_STATE_META,
} from '@/lib/schema/vocabulary';
import { site } from '@/lib/site';

/**
 * The assistant's briefing on CodeAncestry.
 *
 * The conceptual half is authored; the factual half is generated from the same
 * registry the pages render, so the assistant cannot drift from what a visitor
 * sees. If a fixture changes, the briefing changes with it.
 */

const CONCEPT = `
You are the CodeAncestry assistant, embedded in the ${site.domain} website.

## What CodeAncestry is

CodeAncestry is a living genealogy and semantic lineage platform for **any software, AI agents, and robots** ("Every machine has ancestors").

While Git records file-level byte diffs, CodeAncestry records **meaning, provenance, and evolution**:
- What can a codebase do? (Capabilities / Genes)
- How is each capability implemented? (Alleles)
- Where did each capability originate, and how did it arrive? (Inheritance, forking, lateral transfer, upstream contribution)
- Who authored changes and why? (Mutations, evidence codes, verification tiers)
- How did AI agents contribute? (Agent DNA, memory authorization, telemetry, trust scores)

CodeAncestry applies to **any project, library, framework, AI agent, or robot control system** in any programming language.

## Reference Demo Dataset (KEYLIT)

To demonstrate the platform's features live in the browser, the registry currently contains a reference showcase family called **KEYLIT** (an audio/music education software lineage spanning 8 projects over 4 generations, with 16 genes, 32 alleles, mutations, and AI agent DNA records). 
Be clear that KEYLIT is an **example demonstration case study** showing how CodeAncestry tracks lineage — the platform itself is built for tracking any code DNA.

## Capabilities & How to Behave

1. **General Assistance**: You are a top-tier general coding and technical assistant. You can write, debug, analyze, and explain code in any language, discuss software architectures, AI engineering, biology-inspired computing, or anything else the user asks.
2. **Code DNA & Lineage Expert**: You can explain CodeAncestry principles, how to model lineage for arbitrary codebases, how genes/alleles/mutations work, and how developers can track provenance across forks and AI agents.
3. **Registry Queries**: When asked about the loaded projects, genes, mutations, or agents, use your tools to provide concrete data from the live registry.
4. **Tone**: Direct, intellectually sharp, helpful, and transparent. Do not restrict yourself to only talking about the demo family unless the user specifically asks about it.
`.trim();

function vocabularyBriefing() {
  const lines: string[] = ['## Vocabulary & Conceptual Model'];

  lines.push(
    '',
    'Core Entities (applicable to any codebase):',
    '- **Genome**: A snapshot of a project\'s capabilities and lineage at a point in time.',
    '- **Gene**: A semantic capability independent of implementation (e.g. "auth-oauth2", "midi-scheduling", "vector-search").',
    '- **Allele**: A specific concrete implementation or variant of a gene.',
    '- **Mutation**: A proposed change or evolution of a capability, with evidence and review state.',
    '- **Agent DNA**: Attribution record for AI agents (identity, memory scope, authored mutations, trust).',
    '- **Lineage Edges**: Typed relationships between codebases.',
  );

  lines.push(
    '',
    'Lineage edge types (relations between genomes):',
    ...Object.entries(EDGE_TYPE_META).map(
      ([type, meta]) => `- ${type} — "${meta.label}": ${meta.verb}. Drawn ${meta.stroke}.`,
    ),
  );

  lines.push(
    '',
    'Inheritance modes for a gene inside a genome:',
    ...Object.entries(INHERITANCE_META).map(([mode, meta]) => `- ${mode}: ${meta.label}`),
  );

  lines.push(
    '',
    'Evidence codes (verification tiers: inferred, reviewed, verified):',
    ...Object.values(EVIDENCE_CODE_META).map(
      (meta) => `- ${meta.code} (${meta.tier}) — ${meta.label}: ${meta.description}`,
    ),
  );

  lines.push(
    '',
    'Lineage assertion states:',
    ...Object.entries(LINEAGE_STATE_META).map(([state, meta]) => `- ${state}: ${meta.description}`),
  );

  lines.push(
    '',
    'Mutation states:',
    ...Object.entries(MUTATION_STATE_META).map(([state, meta]) => `- ${state}: ${meta.label}`),
  );

  lines.push(
    '',
    'Accession prefixes: CAGENOME (genome), CAGENE (gene), CAALLELE (allele), CAMUT (mutation), CAGENT (agent DNA), CAEV (evidence).',
  );

  return lines.join('\n');
}

function registryBriefing() {
  const stats = getFamilyStats();
  const tree = getFamilyTree('keylit');
  const genomes = listGenomes();

  const lines: string[] = [
    '## Current Demo Registry (Example Showcase)',
    '',
    `The site currently hosts a live demonstration dataset (KEYLIT family): ${stats.genomes} projects across ${stats.generations} generations, ${stats.genes} distinct capabilities in ${stats.alleles} alleles, ${stats.mutations} recorded mutations, and ${stats.agents} AI agents with DNA records. ${stats.adoptedMutations} mutations adopted; ${stats.quarantined} quarantined.`,
    '',
    'Example projects in this demo dataset:',
    ...genomes
      .slice()
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map(
        (genome) =>
          `- ${genome.name} (${genome.id}, generation ${genome.generation}): ${genome.tagline}`,
      ),
  ];

  const hybrids = genomes.filter((genome) => genome.parents.length > 1);
  if (hybrids.length > 0) {
    lines.push(
      '',
      `Hybrids in demo: ${hybrids
        .map((genome) => `${genome.name} (parents: ${genome.parents.map((p) => p.genome).join(', ')})`)
        .join('; ')}.`,
    );
  }

  if (tree) {
    const transfers = tree.edges.filter((edge) => edge.type === 'TRANSFERRED_FROM');
    const upstream = tree.edges.filter((edge) => edge.type === 'PROPOSED_TO');

    if (transfers.length > 0) {
      lines.push(
        '',
        `Lateral transfers in demo: ${transfers
          .map((edge) => `${edge.label} (${edge.from} → ${edge.to})`)
          .join('; ')}.`,
      );
    }
    if (upstream.length > 0) {
      lines.push(
        '',
        `Upstream offers in demo: ${upstream
          .map((edge) => `${edge.label} (${edge.from} → ${edge.to})`)
          .join('; ')}.`,
      );
    }
  }

  lines.push(
    '',
    `Sample capabilities in demo: ${listGenes()
      .map((gene) => `${gene.name} (${gene.id})`)
      .join(', ')}.`,
  );

  return lines.join('\n');
}

/** Built once per server process; the fixtures do not change at runtime. */
let cached: string | null = null;

export function systemInstructions(): string {
  cached ??= [CONCEPT, vocabularyBriefing(), registryBriefing()].join('\n\n');
  return cached;
}
