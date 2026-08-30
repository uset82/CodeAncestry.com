import { DEMO_KIND, type DemoMeta } from './kind';

export const ax2041 = {
  meta: { kind: DEMO_KIND, label: 'SIMULATION' } satisfies DemoMeta,
  id: 'DEMO:AX-2041',
  name: 'UNIT AX-2041',
  born: 2047,
  generation: 143,
  softwareAncestors: 18493,
  capabilityGenes: 2841,
  verifiedLineage: 0.9994,
  activeMutations: 412,
  inheritedVulnerabilities: 1,
  capabilities: [
    {
      capability: 'VISION',
      origin: 'OpenVision-32',
      generation: 71,
      status: 'VERIFIED',
      geneId: 'DEMO:G-VISION-204',
      href: '#genes',
    },
    {
      capability: 'NAVIGATION',
      origin: 'RoverNav',
      generation: 34,
      status: 'WARNING',
      geneId: 'DEMO:NAV-G288',
      href: '#genome',
    },
    {
      capability: 'LANGUAGE',
      origin: 'AgentCore',
      generation: 89,
      status: 'VERIFIED',
      geneId: 'DEMO:G-LANGUAGE-089',
      href: '#genes',
    },
    {
      capability: 'SAFETY',
      origin: 'SafeMotion',
      generation: 12,
      status: 'INVESTIGATE',
      note: 'Mutation #74 under investigation',
      geneId: 'DEMO:G-SAFETY-012',
      href: '#genes',
    },
  ],
} as const;
