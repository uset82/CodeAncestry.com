import {
  getAgent,
  getAllele,
  getAncestors,
  getGene,
  getGenome,
  getMutation,
  listGenomes,
  resolveEvidence,
  tierFor,
} from '@/lib/registry';
import type { EvidenceChecklist, SandboxRun } from '@/lib/schema/mutation';
import { TRUST_LADDER } from '@/lib/schema/mutation';
import type { FitnessScoresValue } from '@/lib/schema/common';
import {
  MUTATION_STATE_META,
  type EvidenceCode,
  type EvidenceTier,
  type LineageState,
  type MutationState,
} from '@/lib/schema/vocabulary';

/**
 * View model for the mutation record.
 *
 * Modelled on a clinical variant interpretation report rather than on a diff
 * view. A reader of this page is not asking "what changed" — they are asking
 * "should this project adopt it, and what backs that recommendation". Every
 * section exists to answer the second question.
 *
 * The trust ladder is the spine: a mutation climbs from "a model asserted this"
 * to "a human with authority said yes", and the page states exactly which rung
 * has actually been reached rather than presenting the destination as the
 * current position.
 */

export type ChecklistItem = {
  key: keyof EvidenceChecklist;
  label: string;
  /** What passing this gate actually establishes. */
  meaning: string;
  passed: boolean;
  /** The rung of the trust ladder this gate corresponds to. */
  rung: string;
};

const CHECKLIST_ORDER: { key: keyof EvidenceChecklist; label: string; meaning: string; rung: string }[] =
  [
    {
      key: 'sourceDigestVerified',
      label: 'Source digest',
      meaning: 'The referenced commit and content digest resolve to the same bytes.',
      rung: 'Source verified',
    },
    {
      key: 'buildProvenanceVerified',
      label: 'Build provenance',
      meaning: 'An attestation shows how the artifact was produced, and by what.',
      rung: 'Build verified',
    },
    {
      key: 'testsPassed',
      label: 'Tests',
      meaning: "The adopter's own suite ran green against the change in a sandbox.",
      rung: 'Tests passed',
    },
    {
      key: 'securityPolicyPassed',
      label: 'Security policy',
      meaning: 'No new advisory was introduced and the policy gate was satisfied.',
      rung: 'Policy passed',
    },
    {
      key: 'licenseCompatible',
      label: 'Licence',
      meaning: "The change's licence is compatible with the adopting genome's.",
      rung: 'Policy passed',
    },
    {
      key: 'maintainerApproved',
      label: 'Maintainer approval',
      meaning: 'A human with authority over the adopting project said yes.',
      rung: 'Maintainer approved',
    },
  ];

export type DecisionView = {
  accession: string;
  name: string;
  generation: number;
  relation: 'origin' | 'ancestor' | 'descendant' | 'relative';
};

export type MutationRecord = {
  accession: string;
  shortId: string;
  title: string;
  summary: string;
  state: MutationState;
  stateLabel: string;
  /** The lineage state the mutation's stage maps onto, for the badge. */
  lineageState: LineageState;
  terminal: boolean;
  kind: string;
  confidence: number;
  proposedAt: string;

  gene: { accession: string; name: string; ontology: string } | null;
  from: { accession: string; version: string; number: number; label: string } | null;
  to: { accession: string; version: string; number: number; label: string } | null;

  proposer: {
    accession: string;
    displayName: string;
    provider: string;
    verification: string;
    generation: number;
  } | null;
  origin: { accession: string; name: string; generation: number } | null;
  /** Root-to-origin chain: where in the family this mutation appeared. */
  lineage: { accession: string; name: string; generation: number }[];

  change: {
    refDigest: string;
    altDigest: string;
    commit: string;
    symbolsChanged: number;
    testSuitesTouched: number;
    apiBreaks: number;
    before: string[];
    after: string[];
  };

  checklist: ChecklistItem[];
  /** The highest trust rung actually reached, and the one after it. */
  ladder: { rung: string; detail: string; trusted: boolean; reached: boolean }[];

  evidence: {
    accession: string;
    code: EvidenceCode;
    summary: string;
    count: number | null;
    observedAt: string;
    digest: string | null;
  }[];
  tier: EvidenceTier;

  attestations: {
    type: string;
    predicateType: string;
    subjectDigest: string;
    issuer: string;
    issuedAt: string;
    verified: boolean;
  }[];

  sandboxRuns: SandboxRun[];

  fitness: {
    scores: FitnessScoresValue;
    baseline: FitnessScoresValue;
    deltas: { metric: string; before: string; after: string; change: string; direction: 'better' | 'worse' | 'neutral' }[];
  };

  compatibility: {
    parentCompatibility: number;
    relativesEligible: number;
    relativesNeedingReview: number;
  };

  offered: DecisionView[];
  adopted: DecisionView[];
  rejected: DecisionView[];
  /** Relatives that carry the gene but have not been offered the mutation. */
  undecided: DecisionView[];
};

export function getMutationRecord(id: string): MutationRecord | null {
  const mutation = getMutation(id);
  if (!mutation) return null;

  const gene = getGene(mutation.gene);
  const from = getAllele(mutation.fromAllele);
  const to = getAllele(mutation.toAllele);
  const agent = getAgent(mutation.proposedBy);
  const origin = getGenome(mutation.originGenome);

  const meta = MUTATION_STATE_META[mutation.state];

  const decision = (accession: string): DecisionView | null => {
    const genome = getGenome(accession);
    if (!genome) return null;

    const ancestorsOfOrigin = origin ? getAncestors(origin.id).map((entry) => entry.id) : [];

    return {
      accession: genome.id,
      name: genome.name,
      generation: genome.generation,
      relation:
        genome.id === mutation.originGenome
          ? 'origin'
          : ancestorsOfOrigin.includes(genome.id)
            ? 'ancestor'
            : getAncestors(genome.id).some((entry) => entry.id === mutation.originGenome)
              ? 'descendant'
              : 'relative',
    };
  };

  const resolveAll = (list: readonly string[]) =>
    list.flatMap((accession) => {
      const view = decision(accession);
      return view ? [view] : [];
    });

  const adopted = resolveAll(mutation.adoptedBy);
  const rejected = resolveAll(mutation.rejectedBy);
  const offered = resolveAll(mutation.offeredTo).filter(
    (view) =>
      !adopted.some((entry) => entry.accession === view.accession) &&
      !rejected.some((entry) => entry.accession === view.accession),
  );

  /*
   * Everyone who carries the gene but is not in any of the three lists above.
   * Naming them matters: a mutation that has reached four of eight carriers is a
   * partially propagated change, and a page that only lists the four would read
   * as though the job were done.
   */
  const decided = new Set([
    ...adopted.map((entry) => entry.accession),
    ...rejected.map((entry) => entry.accession),
    ...offered.map((entry) => entry.accession),
  ]);

  const undecided = listGenomes()
    .filter(
      (genome) =>
        genome.genes.some((ref) => ref.gene === mutation.gene) && !decided.has(genome.id),
    )
    .flatMap((genome) => {
      const view = decision(genome.id);
      return view ? [view] : [];
    });

  const checklist: ChecklistItem[] = CHECKLIST_ORDER.map((entry) => ({
    ...entry,
    passed: mutation.checklist[entry.key],
  }));

  /*
   * The ladder is climbed in order and stops at the first unmet gate: a later
   * check passing while an earlier one has not does not earn the rung, because
   * trust here is cumulative by design.
   *
   * A rung is backed by the checklist gates that name it — "Policy passed" needs
   * both the security and the licence gate — and the first two rungs are always
   * reached, since asserting a change and recording the assertion are what
   * bring the record into existence.
   */
  const ladder = (() => {
    let blocked = false;

    return TRUST_LADDER.map((entry) => {
      const gates = checklist.filter((item) => item.rung === entry.rung);
      const satisfied = gates.length === 0 ? !blocked : gates.every((gate) => gate.passed);

      // The final rung is a fact about adoption, not a gate that can be checked.
      const reached =
        entry.rung === 'Adopted allele'
          ? !blocked && mutation.adoptedBy.length > 0
          : !blocked && satisfied;

      if (!reached) blocked = true;

      return { rung: entry.rung, detail: entry.detail, trusted: entry.trusted, reached };
    });
  })();

  return {
    accession: mutation.id,
    shortId: mutation.shortId,
    title: mutation.title,
    summary: mutation.summary,
    state: mutation.state,
    stateLabel: meta.label,
    lineageState: meta.lineageState,
    terminal: meta.terminal,
    kind: mutation.kind,
    confidence: mutation.confidence,
    proposedAt: mutation.proposedAt,

    gene: gene ? { accession: gene.id, name: gene.name, ontology: gene.ontology.term } : null,
    from: from
      ? {
          accession: from.allele.id,
          version: from.allele.version,
          number: from.allele.number,
          label: from.allele.label,
        }
      : null,
    to: to
      ? {
          accession: to.allele.id,
          version: to.allele.version,
          number: to.allele.number,
          label: to.allele.label,
        }
      : null,

    proposer: agent
      ? {
          accession: agent.id,
          displayName: agent.displayName,
          provider: agent.identity.provider,
          verification: agent.identity.verification,
          generation: agent.generation,
        }
      : null,
    origin: origin
      ? { accession: origin.id, name: origin.name, generation: origin.generation }
      : null,
    lineage: origin
      ? [...getAncestors(origin.id).slice().reverse(), origin].map((entry) => ({
          accession: entry.id,
          name: entry.name,
          generation: entry.generation,
        }))
      : [],

    change: {
      refDigest: mutation.change.refDigest,
      altDigest: mutation.change.altDigest,
      commit: mutation.change.commit,
      symbolsChanged: mutation.change.symbolsChanged,
      testSuitesTouched: mutation.change.testSuitesTouched,
      apiBreaks: mutation.change.apiBreaks,
      before: mutation.change.before,
      after: mutation.change.after,
    },

    checklist,
    ladder,

    evidence: resolveEvidence(mutation.evidence.map((entry) => entry.id)).map((record) => ({
      accession: record.id,
      code: record.code,
      summary: record.summary,
      count: record.count ?? null,
      observedAt: record.observedAt,
      digest: record.digest ?? null,
    })),
    tier: tierFor(mutation.evidence.map((entry) => entry.id)),

    attestations: mutation.attestations.map((attestation) => ({
      type: attestation.type,
      predicateType: attestation.predicateType,
      subjectDigest: attestation.subjectDigest,
      issuer: attestation.issuer,
      issuedAt: attestation.issuedAt,
      verified: attestation.verified,
    })),

    sandboxRuns: mutation.sandboxRuns,

    fitness: mutation.fitness,
    compatibility: mutation.compatibility,

    offered,
    adopted,
    rejected,
    undecided,
  };
}