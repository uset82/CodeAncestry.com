import type { Metadata } from 'next';
import { CodeBlock, DocSection, ReadingShell } from '@/components/registry/RegistryShell';

export const metadata: Metadata = {
  title: 'File formats',
  description:
    'genome.json, gene.json and agent-dna.json — the portable records a repository carries.',
};

export default function FormatsPage() {
  return (
    <ReadingShell
      eyebrow="Documentation · Formats"
      title="Portable records"
      lede="Bioinformatics never forces everything into one file. FASTA carries sequence, GFF carries features, VCF carries variants. The same separation applies here."
    >
      <DocSection heading="genome.json" id="genome">
        <p>
          Lives in the repository. Describes what the project is composed of at one commit, and who
          it descends from.
        </p>
        <CodeBlock>{`{
  "$schema": "https://codeancestry.com/schemas/genome/v0.1.json",
  "genome_id": "CAGENOME:01JKEYLIT7H2",
  "project_id": "CAPROJ:01JKEYLIT000",
  "name": "KEYLIT",
  "generation": 0,

  "source": {
    "provider": "github",
    "repository": "uset82/keylit",
    "commit": "82c134bd1f…",
    "digest": "sha256:…"
  },

  "parents": [],

  "genes": [
    {
      "id": "CAGENE:MIDI-SCHEDULING",
      "allele": "CAALLELE:MIDI-SCHEDULING:3",
      "expression": "active",
      "inheritance": "native",
      "confidence": 0.98,
      "anchors": [
        { "path": "src/midi/input.ts", "symbol": "MidiInputManager" }
      ]
    }
  ],

  "attestations": [
    { "type": "slsa-provenance", "digest": "sha256:…" }
  ]
}`}</CodeBlock>
        <p>
          A child declares what it inherited rather than silently copying it, which is the whole
          difference between a fork and a recorded descent.
        </p>
        <CodeBlock>{`"parents": [
  {
    "project": "CAPROJ:01JKEYLIT000",
    "relationship": "child",
    "bornFromCommit": "82c134bd1f…"
  }
],
"genes": [
  { "id": "CAGENE:MIDI-SCHEDULING", "inheritance": "inherited",
    "origin": "CAPROJ:01JKEYLIT000" },
  { "id": "CAGENE:GAMIFICATION",    "inheritance": "local",
    "origin": "CAPROJ:01JKIDS00000" }
]`}</CodeBlock>
      </DocSection>

      <DocSection heading="gene.json" id="gene">
        <p>
          Describes semantics separately from implementation, so the same capability can be
          recognised across languages and package boundaries.
        </p>
        <CodeBlock>{`{
  "id": "CAGENE:MIDI-SCHEDULING",
  "name": "Adaptive MIDI Buffer",
  "ontology": { "class": "input.midi.latency-management" },

  "alleles": [
    {
      "id": "CAALLELE:MIDI-SCHEDULING:3",
      "digest": "sha256:…",
      "parents": ["CAALLELE:MIDI-SCHEDULING:2"],
      "implementation": { "language": "typescript" },
      "interfaces": {
        "inputs":  ["midi-event"],
        "outputs": ["scheduled-note-event"]
      }
    }
  ],

  "origin": {
    "project": "CAPROJ:01JKEYLIT000",
    "firstObservedCommit": "27ad90…"
  },

  "license": { "spdx": "MIT" },
  "confidence": { "semanticBoundary": 0.94, "origin": 1.0 }
}`}</CodeBlock>
      </DocSection>

      <DocSection heading="agent-dna.json" id="agent">
        <p>
          Deliberately contains portable, consented information — never model weights, hidden
          reasoning or private memory. It records what an agent <em>did, asserted, tested and
          shared</em>, not everything it thought.
        </p>
        <CodeBlock>{`{
  "agent_id": "CAAGENT:KEYLIT:7",
  "genome_id": "CAGENOME:01JKEYLIT7H2",

  "runtime": { "provider": "external",
               "model_identity_policy": "record-when-disclosed" },

  "skills": ["analyze_genome", "propose_mutation", "compare_relative"],
  "tools":  ["mcp://codeancestry/registry", "mcp://codeancestry/sandbox"],

  "inheritance_policy": {
    "accept_direct_code": false,
    "accept_proposals": true,
    "trusted_relations": ["PARENT", "CHILD", "SIBLING"],
    "require_attestation": true
  },

  "memory": {
    "store_chain_of_thought": false,
    "public_decision_records": ["CAMEM:191", "CAMEM:207"]
  },

  "telemetry": { "capturePrompts": false, "captureToolMetadata": true }
}`}</CodeBlock>
        <p>
          Telemetry defaults to metadata only. Full prompt and completion capture is technically
          possible and stays opt-in.
        </p>
      </DocSection>

      <DocSection heading="Validation">
        <p>
          Schemas are JSON Schema 2020-12. Identifiers are content-addressed where possible, so a
          lineage record survives a repository being renamed or moved.
        </p>
      </DocSection>
    </ReadingShell>
  );
}
