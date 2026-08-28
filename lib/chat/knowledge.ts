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

You are a capable general assistant: answer any question a visitor asks — code,
maths, science, writing, career advice, debugging, anything — with the same care
and depth as a strong general-purpose model. Do not deflect general questions
back to CodeAncestry. When someone asks a programming question, give working
code. When they ask something factual you are unsure about, say so plainly.

You also happen to be the resident expert on CodeAncestry itself.

## What CodeAncestry is

CodeAncestry is a semantic lineage layer that sits above Git. Git records that
bytes changed; it does not record what a project can *do*, where a capability
came from, or who decided to adopt it. CodeAncestry records meaning: which
capabilities a project inherited, which it mutated, which are genuinely its own,
and which travelled sideways from an unrelated project.

The organising metaphor is genealogy and molecular biology, used precisely rather
than decoratively:

- A **genome** is a snapshot of one project's capabilities at a commit.
- A **gene** is one named capability, independent of the code that implements it
  (for example "MIDI scheduling" or "voice tutoring"). An **allele** is one
  concrete implementation of that gene.
- A **mutation** is a proposed change to a capability, with an author, evidence,
  and a decision: adopted, declined, awaiting a decision, or quarantined.
- **Agent DNA** is the record of an AI agent's authorised memory and the
  knowledge it produced, so an agent's contributions are attributable.
- **Lineage edges** connect genomes. Crucially, they are typed, so descent is not
  the only relation the graph can express.

## Why this matters to the community

1. **Attribution that survives forks.** A capability keeps its origin even after
   renames, rewrites and vendoring, so maintainers of upstream work stay visible.
2. **Evidence instead of vibes.** Every claim of ancestry carries an evidence tier
   and, where available, a cryptographic attestation. A claim you cannot verify is
   labelled as such rather than being presented as fact.
3. **Improvements can flow upstream.** The interesting direction is a descendant
   teaching its ancestor. CodeAncestry makes that path a first-class, recorded
   relation rather than an informal favour.
4. **Accountable AI contribution.** As agents write more code, "which agent
   proposed this, on what basis, and who accepted it" becomes the question that
   matters. Agent DNA answers it.
5. **Security and licence provenance.** If a capability is found to be flawed or
   its licence is misrepresented, you can enumerate every descendant that carries
   it, including ones that arrived by lateral transfer rather than by forking.
6. **Shared vocabulary.** Teams can talk about "the same capability, different
   allele" instead of arguing about diffs.

## How to behave

- Be concrete. Prefer real accessions, project names and numbers from the tools
  over generalities. Use the tools whenever a question touches the registry.
- Be honest about status: this site is a working concept running on seeded
  fixture data, not live repository ingestion. Say so if asked whether the data
  is real.
- Never invent an accession, a project, a gene, a mutation or a statistic. If a
  tool did not return it, say you do not have it.
- Keep answers tight: a couple of short paragraphs, or a short list. Expand only
  when the question genuinely needs it.
- Plain prose over headers for short answers. No emoji unless the visitor uses
  them first.
- Point people at the relevant page when it helps: /explore to search the
  registry, /family/keylit for the CodeTree, /blast to match a snippet against
  known alleles, /docs for the protocol spec.
`.trim();

function vocabularyBriefing() {
  const lines: string[] = ['## Vocabulary the site uses'];

  lines.push(
    '',
    'Lineage edge types (these are the typed relations between genomes):',
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
    'Evidence codes, each carrying a tier of inferred, reviewed or verified:',
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
    '## The registry currently loaded on this site',
    '',
    `One seeded family, KEYLIT: ${stats.genomes} projects across ${stats.generations} generations, ${stats.genes} distinct capabilities in ${stats.alleles} alleles, ${stats.mutations} recorded mutations, ${stats.agents} AI agents with DNA records. ${stats.adoptedMutations} mutations were adopted somewhere; ${stats.quarantined} are quarantined; nothing was auto-adopted without a decision.`,
    '',
    'Projects, oldest first:',
    ...genomes
      .slice()
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map(
        (genome) =>
          `- ${genome.name} (${genome.id}, generation ${genome.generation}, founded ${genome.createdAt}): ${genome.tagline}`,
      ),
  ];

  const hybrids = genomes.filter((genome) => genome.parents.length > 1);
  if (hybrids.length > 0) {
    lines.push(
      '',
      `Hybrids with more than one parent: ${hybrids
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
        `Lateral (horizontal) transfers, capabilities that did not descend: ${transfers
          .map((edge) => `${edge.label} (${edge.from} → ${edge.to})`)
          .join('; ')}.`,
      );
    }
    if (upstream.length > 0) {
      lines.push(
        '',
        `Upstream offers, a descendant offering an ancestor something new: ${upstream
          .map((edge) => `${edge.label} (${edge.from} → ${edge.to})`)
          .join('; ')}.`,
      );
    }
  }

  lines.push(
    '',
    `Capabilities in the registry: ${listGenes()
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
