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
  {
    meta: { kind: DEMO_KIND, label: 'DEMO LINEAGE' },
    id: 'DEMO:G-MEMORY-041',
    name: 'WORKING MEMORY',
    capability: 'MEMORY',
    purpose: 'Short-horizon state the other genes can query',
    origin: 'TraceStore',
    bornGeneration: 8,
    currentGeneration: 61,
    mutations: 94,
    dependencies: 6,
    descendants: 4102,
    health: 0.988,
    status: 'VERIFIED',
  },
  {
    meta: { kind: DEMO_KIND, label: 'DEMO LINEAGE' },
    id: 'DEMO:G-LANGUAGE-089',
    name: 'LANGUAGE',
    capability: 'LANGUAGE',
    purpose: 'Instruction following and spoken report',
    origin: 'AgentCore',
    bornGeneration: 19,
    currentGeneration: 89,
    mutations: 156,
    dependencies: 11,
    descendants: 6204,
    health: 0.993,
    status: 'VERIFIED',
  },
  {
    meta: { kind: DEMO_KIND, label: 'DEMO LINEAGE' },
    id: 'DEMO:G-REASON-112',
    name: 'REASONING',
    capability: 'REASONING',
    purpose: 'Plan selection under incomplete sensor input',
    origin: 'AgentCore',
    bornGeneration: 22,
    currentGeneration: 77,
    mutations: 188,
    dependencies: 9,
    descendants: 5310,
    health: 0.964,
    status: 'Investigate',
  },
  {
    meta: { kind: DEMO_KIND, label: 'DEMO LINEAGE' },
    id: 'DEMO:G-SAFETY-012',
    name: 'SAFETY CONSTRAINTS',
    capability: 'SAFETY',
    purpose: 'Hard stops the motor and navigation genes cannot override',
    origin: 'SafeMotion',
    bornGeneration: 4,
    currentGeneration: 12,
    mutations: 41,
    dependencies: 2,
    descendants: 19044,
    health: 0.999,
    status: 'VERIFIED',
  },
  {
    meta: { kind: DEMO_KIND, label: 'DEMO LINEAGE' },
    id: 'DEMO:G-MOTOR-033',
    name: 'MOTOR CONTROL',
    capability: 'MOTOR',
    purpose: 'Actuator timing and gait',
    origin: 'ServoKit',
    bornGeneration: 6,
    currentGeneration: 48,
    mutations: 73,
    dependencies: 7,
    descendants: 2881,
    health: 0.981,
    status: 'VERIFIED',
  },
  {
    meta: { kind: DEMO_KIND, label: 'DEMO LINEAGE' },
    id: 'DEMO:G-INTERFACE-008',
    name: 'INTERFACE',
    capability: 'INTERFACE',
    purpose: 'Human and agent command surface',
    origin: 'FaceLayer',
    bornGeneration: 14,
    currentGeneration: 40,
    mutations: 29,
    dependencies: 4,
    descendants: 912,
    health: 0.976,
    status: 'VERIFIED',
  },
];
