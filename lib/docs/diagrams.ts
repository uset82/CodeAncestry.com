/**
 * Mermaid sources for the protocol spec.
 *
 * Kept as TypeScript so the diagrams stay next to the vocabularies they
 * describe. The renderer is a client component; the strings are the
 * accessible equivalent as well as the drawing.
 */

export const ARCHITECTURE_DIAGRAM = `flowchart LR
  Fixtures["KEYLIT fixtures"]
  Zod["Zod schemas"]
  Query["Query layer"]
  Fixtures --> Zod --> Query
  Query --> Hero["Helix hero"]
  Query --> Tree["Family CodeTree"]
  Query --> Browser["Genome browser"]
  Query --> Records["Accession records"]
  Query -.->|"same signature, later"| API["api.codeancestry.com"]
`;

export const PROPAGATION_DIAGRAM = `flowchart LR
  Discover --> Describe --> Attest --> Sandbox --> Test --> Evaluate --> Decide
  Decide --> Adopt
  Decide --> Reject
  Decide --> Quarantine
`;

export const MUTATION_STATE_DIAGRAM = `stateDiagram-v2
  [*] --> observed
  observed --> proposed
  proposed --> sandboxing
  sandboxing --> evaluated
  evaluated --> accepted
  evaluated --> rejected
  evaluated --> quarantined
  accepted --> eligible_for_propagation: eligible-for-propagation
  eligible_for_propagation --> offered_to_relatives: offered-to-relatives
  offered_to_relatives --> adopted
  rejected --> [*]
  quarantined --> [*]
  adopted --> [*]
`;

export const LINEAGE_STACK_DIAGRAM = `flowchart TB
  Layer["CodeAncestry layer"]
  Knowledge["Knowledge · fitness · phenotypes"]
  Evidence["Evidence · attestations · policy"]
  Git["Git · commits, trees, blobs"]
  Layer --> Knowledge --> Evidence --> Git
`;

export const LINEAGE_GRAPH_DIAGRAM = `flowchart TB
  K["KEYLIT"]
  Kids["KEYLIT Kids"]
  Studio["KEYLIT Studio"]
  KidsES["KEYLIT Kids ES"]
  Tutor["Junior Music Tutor"]
  K -->|DERIVED_FROM| Kids
  K -->|DERIVED_FROM| Studio
  Kids -->|DERIVED_FROM| KidsES
  KidsES -->|RECOMBINED_FROM| Tutor
  Studio -->|RECOMBINED_FROM| Tutor
  KidsES -->|PROPOSED_TO| K
`;
