import { DEMO_KIND, type DemoMeta } from './kind';

export type DemoGene = {
  meta: DemoMeta;
  id: string;
  name: string;
  capability: string;
  purpose: string;
  origin: string;
  bornGeneration: number;
  currentGeneration: number;
  mutations: number;
  dependencies: number;
  descendants: number;
  health: number;
  status: 'VERIFIED' | 'Investigate';
};

export const demoGenes: DemoGene[] = [
  {
    meta: { kind: DEMO_KIND, label: 'DEMO LINEAGE' },
    id: 'DEMO:NAV-G288',
    name: 'NAVIGATION GENE',
    capability: 'NAVIGATION',
    purpose: 'Adaptive navigation buffering',
    origin: 'RoverNav',
    bornGeneration: 34,
    currentGeneration: 34,
    mutations: 427,
    dependencies: 18,
    descendants: 82914,
    health: 0.971,
    status: 'Investigate',
  },
  {
    meta: { kind: DEMO_KIND, label: 'DEMO LINEAGE' },
    id: 'DEMO:G-VISION-204',
    name: 'COMPUTER VISION',
    capability: 'VISION',
    purpose: 'Real-time object recognition',
    origin: 'OpenVision',
    bornGeneration: 12,
    currentGeneration: 84,
    mutations: 217,
    dependencies: 3,
    descendants: 14821,
    health: 1,
    status: 'VERIFIED',
  },
];
