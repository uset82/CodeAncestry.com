import { DEMO_KIND, type DemoMeta } from './kind';

export type DemoTrack = {
  id: string;
  capability: string;
  weight: number;
  geneId: string;
};

export const axisRobot = {
  meta: { kind: DEMO_KIND, label: 'DEMO LINEAGE' } satisfies DemoMeta,
  id: 'DEMO:AXIS-ROBOT-CORE',
  name: 'AXIS ROBOT CORE',
  tracks: [
    { id: 'vision', capability: 'VISION', weight: 0.88, geneId: 'DEMO:G-VISION-204' },
    { id: 'memory', capability: 'MEMORY', weight: 0.55, geneId: 'DEMO:G-MEMORY-041' },
    { id: 'language', capability: 'LANGUAGE', weight: 0.78, geneId: 'DEMO:G-LANGUAGE-089' },
    { id: 'navigation', capability: 'NAVIGATION', weight: 0.84, geneId: 'DEMO:NAV-G288' },
    { id: 'reasoning', capability: 'REASONING', weight: 0.72, geneId: 'DEMO:G-REASON-112' },
    { id: 'safety', capability: 'SAFETY', weight: 0.94, geneId: 'DEMO:G-SAFETY-012' },
    { id: 'motor', capability: 'MOTOR', weight: 0.62, geneId: 'DEMO:G-MOTOR-033' },
    { id: 'interface', capability: 'INTERFACE', weight: 0.42, geneId: 'DEMO:G-INTERFACE-008' },
  ] satisfies DemoTrack[],
} as const;
