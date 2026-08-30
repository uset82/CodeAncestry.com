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
  /**
   * Homepage three-lineage rails. A-184 did not author M-94012 (that is A-918).
   * The gene/mutation rail shows where this agent’s knowledge sits in the AXIS family.
   */
  lineages: {
    agent: [
      { id: 'model', mark: '●', label: 'Model family', detail: 'OpenAI' },
      { id: 'runtime', mark: '●', label: 'Agent runtime', detail: 'Software engineering' },
      { id: 'self', mark: '◆', label: 'Agent A-184', detail: 'This record', current: true },
    ],
    project: [
      { id: 'rover', mark: '■', label: 'RoverNav', href: '#codetree' },
      { id: 'nav', mark: '■', label: 'AXIS Navigator', href: '#codetree' },
      { id: 'core', mark: '■', label: 'AXIS Robot Core', href: '#genome' },
      { id: 'build', mark: '◆', label: 'AXIS Agent Build', href: '#codetree', current: true },
    ],
    gene: [
      { id: 'navg', mark: '△', label: 'NAV-G288', href: '#genome', detail: 'Navigation gene' },
      { id: 'iface', mark: '△', label: 'G-INTERFACE-008', href: '#genes', detail: 'Authored surface' },
      {
        id: 'mut',
        mark: '◆',
        label: 'M-94012',
        href: '#mutation',
        detail: 'Knowledge contributed — authored by A-918',
        current: true,
      },
    ],
  },
} as const;
