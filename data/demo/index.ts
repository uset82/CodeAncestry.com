import { agentA184 } from './agent-a184';
import { ax2041 } from './ax2041';
import { axisFamily } from './axis-family';
import { axisRobot } from './axis-robot';
import { demoGenes } from './genes';
import { mutationM94012 } from './mutation-m94012';

export { DEMO_KIND } from './kind';
export type { DemoHonesty, DemoMeta } from './kind';
export type { DemoGene } from './genes';
export type { LineageKind } from './lineage-kinds';
export { LINEAGE_KIND_META, LINEAGE_KINDS } from './lineage-kinds';
export { AXIS_IDS, axisFamily, axisLineageKinds, getAxisNode } from './axis-family';
export { agentA184, ax2041, axisRobot, demoGenes, mutationM94012 };

export const homepageDemo = {
  project: axisRobot,
  family: axisFamily,
  genes: demoGenes,
  mutation: mutationM94012,
  agent: agentA184,
  machine: ax2041,
} as const;

export function getDemoGene(id: string) {
  return demoGenes.find((gene) => gene.id === id);
}

/** Display form: DEMO:NAV-G288 → NAV-G288. The prefix is loader hygiene. */
export function demoAccession(id: string) {
  return id.replace(/^DEMO:/, '');
}
