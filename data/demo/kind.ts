/** Homepage demo pack. Never resolve these through the KEYLIT registry loader. */
export const DEMO_KIND = 'demo-lineage' as const;

export type DemoHonesty = 'DEMO LINEAGE' | 'SIMULATION' | 'PROTOTYPE' | 'CONCEPT';

export type DemoMeta = {
  kind: typeof DEMO_KIND;
  label: DemoHonesty;
};
