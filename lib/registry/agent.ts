import { getAgent, getGene, getGenome, getMutation, listAgents } from '@/lib/registry';
import type { AgentDna, LearningArtifact } from '@/lib/schema/agentDna';
import {
  ARTIFACT_KIND_META,
  CAPABILITY_META,
  MEMORY_MODE_META,
  PROVIDER_META,
  TELEMETRY_LEVELS,
  TOOL_SCOPE_META,
  VERIFICATION_META,
  type AgentCapability,
  type TelemetryMode,
} from '@/lib/schema/agentDna';
import { MUTATION_STATE_META } from '@/lib/schema/vocabulary';

/**
 * The Agent DNA view model.
 *
 * The organising idea is a boundary, not a dossier. An agent profile answers
 * three questions in order: what does the provider claim, what did this agent
 * actually do that we can point at, and what is deliberately not here. The
 * third question is the one that makes the first two safe to publish, so the
 * model carries it explicitly rather than leaving it to page copy.
 */

export type CapabilityView = {
  value: AgentCapability;
  label: string;
  detail: string;
  writes: boolean;
};

export type ToolView = {
  name: string;
  uri: string;
  scope: string;
  scopeLabel: string;
  writes: boolean;
};

/** One line of the safety envelope: a claim, and whether it is permissive. */
export type PolicyView = {
  label: string;
  value: boolean;
  /** True when the value as set widens what the agent may do unsupervised. */
  permissive: boolean;
  detail: string;
  /**
   * The permissive state in words. Needed because two of the four policies are
   * permissive when false, so the label alone inverts the meaning: "requires
   * attestation" set to no is the risk, not the safeguard.
   */
  permissivePhrase: string;
};

export type ArtifactView = {
  accession: string;
  kind: LearningArtifact['kind'];
  kindLabel: string;
  kindAbbr: string;
  summary: string;
  producedAt: string;
  signed: boolean;
  offeredTo: { accession: string; name: string }[];
};

export type AuthoredMutationView = {
  accession: string;
  shortId: string;
  title: string;
  state: string;
  stateLabel: string;
  /** Where the proposal ended up, in plain words. */
  outcome: 'adopted' | 'rejected' | 'open' | 'quarantined';
  adoptedBy: number;
  rejectedBy: number;
  geneName: string;
  proposedAt: string;
};

export type TelemetryLevelView = {
  value: TelemetryMode;
  label: string;
  detail: string;
  /** The level the agent's owner actually chose. */
  active: boolean;
  /** True for levels beyond the active one, i.e. not currently collected. */
  beyondActive: boolean;
};

export type AgentRecord = {
  accession: string;
  displayName: string;
  generation: number;

  identity: {
    provider: string;
    providerLabel: string;
    providerAgentId: string | null;
    verification: string;
    verificationLabel: string;
    verificationDetail: string;
    verificationTone: 'weak' | 'medium' | 'strong';
    signingKey: string | null;
  };

  genome: { accession: string; name: string; generation: number } | null;
  project: string;
  parent: { accession: string; displayName: string; generation: number } | null;
  children: { accession: string; displayName: string; generation: number }[];

  capabilities: CapabilityView[];
  /** Capabilities in the vocabulary this agent has NOT been granted. */
  withheld: CapabilityView[];
  interfaces: { mcp: boolean; a2a: boolean };
  tools: ToolView[];

  policies: PolicyView[];
  trustedRelations: string[];
  untrustedRelations: string[];

  memory: {
    mode: string;
    modeLabel: string;
    modeDetail: string;
    lineageSummaries: number;
    acceptedMutations: number;
    rejectedMutations: number;
    artifacts: ArtifactView[];
    /** Artifacts offered to at least one relative, i.e. shared knowledge. */
    shared: number;
  };

  authored: AuthoredMutationView[];

  telemetry: {
    mode: TelemetryMode;
    levels: TelemetryLevelView[];
    capturePrompts: boolean;
    captureCompletions: boolean;
    captureToolMetadata: boolean;
    captureTokenMetrics: boolean;
  };

  trust: {
    identityVerified: boolean;
    outputsSigned: boolean;
    privateReasoningStored: false;
    reliability: number;
  };
};

function relative(id: string) {
  const genome = getGenome(id);
  return { accession: id, name: genome?.name ?? id };
}

function capabilityView(value: AgentCapability): CapabilityView {
  const meta = CAPABILITY_META[value];
  return { value, label: meta.label, detail: meta.detail, writes: meta.writes };
}

/**
 * The policy block, flattened into rows that can be scanned for risk. Note that
 * two of the four are inverted: `requiresHumanApproval: false` is the permissive
 * setting, while `canAutoMerge: true` is. Rendering them without that flag would
 * make a locked-down agent look identical to an unsupervised one.
 */
function policyViews(policies: AgentDna['policies']): PolicyView[] {
  return [
    {
      label: 'Can merge without review',
      value: policies.canAutoMerge,
      permissive: policies.canAutoMerge,
      detail: 'Whether an accepted proposal can land with no human in the loop.',
      permissivePhrase: 'it can merge unreviewed',
    },
    {
      label: 'Can propagate mutations',
      value: policies.canPropagateMutations,
      permissive: policies.canPropagateMutations,
      detail: 'Whether it may offer a change onward to relatives by itself.',
      permissivePhrase: 'it can propagate changes by itself',
    },
    {
      label: 'Requires human approval',
      value: policies.requiresHumanApproval,
      permissive: !policies.requiresHumanApproval,
      detail: 'Whether a person must sign off before anything is recorded.',
      permissivePhrase: 'no human sign-off is required',
    },
    {
      label: 'Requires attestation',
      value: policies.requiresAttestation,
      permissive: !policies.requiresAttestation,
      detail: 'Whether outputs must carry verifiable provenance.',
      permissivePhrase: 'its outputs need not carry provenance',
    },
  ];
}

const ALL_RELATIONS = ['parent', 'sibling', 'child', 'unrelated'] as const;

function authoredView(id: string): AuthoredMutationView | null {
  const mutation = getMutation(id);
  if (!mutation) return null;

  const meta = MUTATION_STATE_META[mutation.state];
  const adoptedBy = mutation.adoptedBy.length;
  const rejectedBy = mutation.rejectedBy.length;

  const outcome: AuthoredMutationView['outcome'] =
    mutation.state === 'quarantined'
      ? 'quarantined'
      : adoptedBy > 0
        ? 'adopted'
        : rejectedBy > 0 && mutation.state === 'rejected'
          ? 'rejected'
          : 'open';

  return {
    accession: mutation.id,
    shortId: mutation.shortId,
    title: mutation.title,
    state: mutation.state,
    stateLabel: meta.label,
    outcome,
    adoptedBy,
    rejectedBy,
    geneName: getGene(mutation.gene)?.name ?? mutation.gene,
    proposedAt: mutation.proposedAt,
  };
}

export function getAgentRecord(id: string): AgentRecord | null {
  const agent = getAgent(id);
  if (!agent) return null;

  const genome = getGenome(agent.genome);
  const parentAgent = agent.parentAgent ? getAgent(agent.parentAgent) : null;
  const children = listAgents().filter((candidate) => candidate.parentAgent === agent.id);

  const granted = new Set(agent.capabilities);
  const capabilityKeys = Object.keys(CAPABILITY_META) as AgentCapability[];

  const verification = VERIFICATION_META[agent.identity.verification];
  const memoryMode = MEMORY_MODE_META[agent.authorizedMemory.mode];

  const activeIndex = TELEMETRY_LEVELS.findIndex((level) => level.value === agent.telemetry.mode);

  const artifacts: ArtifactView[] = agent.authorizedMemory.artifacts.map((artifact) => ({
    accession: artifact.id,
    kind: artifact.kind,
    kindLabel: ARTIFACT_KIND_META[artifact.kind].label,
    kindAbbr: ARTIFACT_KIND_META[artifact.kind].abbr,
    summary: artifact.summary,
    producedAt: artifact.producedAt,
    signed: artifact.signed,
    offeredTo: artifact.offeredTo.map(relative),
  }));

  const trustedRelations = agent.policies.trustedRelations;

  return {
    accession: agent.id,
    displayName: agent.displayName,
    generation: agent.generation,

    identity: {
      provider: agent.identity.provider,
      providerLabel: PROVIDER_META[agent.identity.provider].label,
      providerAgentId: agent.identity.providerAgentId ?? null,
      verification: agent.identity.verification,
      verificationLabel: verification.label,
      verificationDetail: verification.detail,
      verificationTone: verification.tone,
      signingKey: agent.identity.signingKey ?? null,
    },

    genome: genome
      ? { accession: genome.id, name: genome.name, generation: genome.generation }
      : null,
    project: agent.project,
    parent: parentAgent
      ? {
          accession: parentAgent.id,
          displayName: parentAgent.displayName,
          generation: parentAgent.generation,
        }
      : null,
    children: children.map((child) => ({
      accession: child.id,
      displayName: child.displayName,
      generation: child.generation,
    })),

    capabilities: agent.capabilities.map(capabilityView),
    withheld: capabilityKeys.filter((key) => !granted.has(key)).map(capabilityView),
    interfaces: agent.interfaces,
    tools: agent.tools.map((tool) => ({
      name: tool.name,
      uri: tool.uri,
      scope: tool.scope,
      scopeLabel: TOOL_SCOPE_META[tool.scope].label,
      writes: TOOL_SCOPE_META[tool.scope].writes,
    })),

    policies: policyViews(agent.policies),
    trustedRelations: [...trustedRelations],
    untrustedRelations: ALL_RELATIONS.filter(
      (relation) => !trustedRelations.includes(relation),
    ),

    memory: {
      mode: agent.authorizedMemory.mode,
      modeLabel: memoryMode.label,
      modeDetail: memoryMode.detail,
      lineageSummaries: agent.authorizedMemory.lineageSummaries,
      acceptedMutations: agent.authorizedMemory.acceptedMutations,
      rejectedMutations: agent.authorizedMemory.rejectedMutations,
      artifacts,
      shared: artifacts.filter((artifact) => artifact.offeredTo.length > 0).length,
    },

    authored: agent.knowledgeProduced
      .map(authoredView)
      .filter((entry): entry is AuthoredMutationView => entry !== null),

    telemetry: {
      mode: agent.telemetry.mode,
      levels: TELEMETRY_LEVELS.map((level, index) => ({
        value: level.value,
        label: level.label,
        detail: level.detail,
        active: index === activeIndex,
        beyondActive: index > activeIndex,
      })),
      capturePrompts: agent.telemetry.capturePrompts,
      captureCompletions: agent.telemetry.captureCompletions,
      captureToolMetadata: agent.telemetry.captureToolMetadata,
      captureTokenMetrics: agent.telemetry.captureTokenMetrics,
    },

    trust: agent.trust,
  };
}
