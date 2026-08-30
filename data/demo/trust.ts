import { DEMO_KIND, type DemoMeta } from './kind';
import type { EvidenceCode } from '@/lib/schema/vocabulary';
import { mutationM94012 } from './mutation-m94012';

export type EvidenceState = 'met' | 'warning' | 'future';

export const trustEvidence = {
  meta: { kind: DEMO_KIND, label: 'DEMO LINEAGE' } satisfies DemoMeta,
  mutationId: mutationM94012.id,
  items: [
    {
      id: 'source',
      label: 'Source',
      detail: 'Git commit verified. Content digest matches what was reviewed.',
      state: 'met' as const,
      code: 'STA' as EvidenceCode,
    },
    {
      id: 'build',
      label: 'Build',
      detail: 'Provenance available. Artifact is tied to the commit in this demo record.',
      state: 'met' as const,
      code: 'DEP' as EvidenceCode,
    },
    {
      id: 'creator',
      label: 'Creator',
      detail: `Agent identity recorded — ${mutationM94012.createdBy.replace(/^DEMO:/, '')}.`,
      state: 'met' as const,
    },
    {
      id: 'review',
      label: 'Review',
      detail: `Review attestation — ${mutationM94012.reviewedBy.replace(/^DEMO:/, '')}.`,
      state: 'met' as const,
      code: 'HVR' as EvidenceCode,
    },
    {
      id: 'test',
      label: 'Test',
      detail: `Test evidence — ${mutationM94012.testsPassed} / ${mutationM94012.testsTotal}.`,
      state: 'met' as const,
      code: 'TST' as EvidenceCode,
    },
    {
      id: 'security',
      label: 'Security',
      detail: 'Scan recorded — WARNING. This rung does not clear a write.',
      state: 'warning' as const,
      code: 'SEC' as EvidenceCode,
    },
    {
      id: 'lineage',
      label: 'Lineage',
      detail: `Parent ${mutationM94012.parentGene} verified. ${mutationM94012.inheritedBy.toLocaleString('en-GB')} descendants recorded.`,
      state: 'met' as const,
      code: 'PHY' as EvidenceCode,
    },
  ],
} as const;

export const futureCompatibility = [
  'Git commit identity',
  'Signed commits',
  'SLSA provenance',
  'in-toto attestations',
  'SBOM data',
  'Dependency identity',
  'Test evidence',
  'Agent identity',
  'Build identity',
] as const;
