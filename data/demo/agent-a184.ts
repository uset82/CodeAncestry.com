import { DEMO_KIND, type DemoMeta } from './kind';

export const agentA184 = {
  meta: { kind: DEMO_KIND, label: 'DEMO LINEAGE' } satisfies DemoMeta,
  id: 'DEMO:A-184',
  provider: 'OpenAI',
  role: 'Software Engineering',
  projects: 142,
  genesCreated: 37,
  mutations: 881,
  verified: 742,
  rejected: 91,
  quarantined: 48,
  knowledgeInherited: 238,
  knowledgeContributed: 1442,
  ancestry: ['MODEL FAMILY', 'AGENT RUNTIME', 'AGENT A-184', 'PROJECTS', 'GENES', 'MUTATIONS'] as const,
} as const;
