import type { Evidence } from '@/lib/schema/common';

/**
 * The evidence pool. Every annotation, gene boundary and lineage edge in the
 * fixtures points at one of these records, so nothing in the registry is a
 * bare assertion.
 */
export const EVIDENCE: Evidence[] = [
  {
    id: 'CAEV:901',
    code: 'HVR',
    summary: 'Maintainer confirmed the MIDI scheduling boundary during genome review.',
    observedAt: '2026-08-28',
    digest: 'sha256:1a4f9c2e',
  },
  {
    id: 'CAEV:902',
    code: 'TST',
    summary: 'MIDI latency suite v3 executed against the origin genome.',
    count: 214,
    observedAt: '2026-08-28',
    digest: 'sha256:2b5e0d3f',
  },
  {
    id: 'CAEV:903',
    code: 'STA',
    summary: 'TypeScript AST walk isolated the scheduler symbols and their imports.',
    observedAt: '2026-08-28',
  },
  {
    id: 'CAEV:904',
    code: 'DEP',
    summary: 'Read from package-lock.json and the CycloneDX SBOM.',
    count: 41,
    observedAt: '2026-08-28',
  },
  {
    id: 'CAEV:905',
    code: 'AII',
    summary: 'Capability cluster proposed by the genome analyzer. Not yet reviewed.',
    observedAt: '2026-08-29',
  },
  {
    id: 'CAEV:906',
    code: 'RUN',
    summary: 'Runtime trace captured across 1,204 real lesson sessions.',
    count: 1204,
    observedAt: '2026-09-14',
    digest: 'sha256:3c6a1e4b',
  },
  {
    id: 'CAEV:907',
    code: 'UPR',
    summary: 'Upstream maintainer of smplr confirmed the sample-loading contract.',
    observedAt: '2026-09-02',
  },
  {
    id: 'CAEV:908',
    code: 'PHY',
    summary: 'Capability homology inferred from shared ancestry with the origin genome.',
    observedAt: '2026-10-01',
  },
  {
    id: 'CAEV:909',
    code: 'SEC',
    summary: 'Advisory scan of the dependency closure. One moderate finding, since resolved.',
    count: 1,
    observedAt: '2026-09-20',
  },
  {
    id: 'CAEV:991',
    code: 'TST',
    summary: 'Adaptive buffer mutation: full parent suite green in an isolated sandbox.',
    count: 214,
    observedAt: '2027-01-18',
    digest: 'sha256:8c20af41',
  },
  {
    id: 'CAEV:992',
    code: 'RUN',
    summary: 'Latency measured on Chrome, Safari and Firefox with hardware MIDI input.',
    count: 3,
    observedAt: '2027-01-18',
    digest: 'sha256:b551d07c',
  },
  {
    id: 'CAEV:993',
    code: 'HVR',
    summary: 'KEYLIT maintainer reviewed the mutation diff and the measured deltas.',
    observedAt: '2027-01-21',
  },
  {
    id: 'CAEV:994',
    code: 'SEC',
    summary: 'No new advisories introduced. Licence expression unchanged.',
    observedAt: '2027-01-18',
  },
  {
    id: 'CAEV:995',
    code: 'TST',
    summary: 'Quechua localisation suite. Two pronunciation assertions still failing.',
    count: 88,
    observedAt: '2027-02-04',
  },
  {
    id: 'CAEV:996',
    code: 'AII',
    summary: 'Model proposed collapsing the scoring and progress genes. Unverified.',
    observedAt: '2027-02-11',
  },
  {
    id: 'CAEV:997',
    code: 'RUN',
    summary: 'Fleet telemetry from 34 classroom devices over six weeks.',
    count: 34,
    observedAt: '2027-03-02',
    digest: 'sha256:d0e91a77',
  },
  {
    id: 'CAEV:998',
    code: 'TST',
    summary: 'Screen-reader regression suite for the sensory-mode allele.',
    count: 156,
    observedAt: '2027-01-09',
  },
  {
    id: 'CAEV:999',
    code: 'STA',
    summary: 'Cross-family fingerprint match on the voice-tutor capability.',
    observedAt: '2027-03-18',
  },
];

/** Keyed by plain string: lookups are fed user input and route params. */
export const EVIDENCE_BY_ID = new Map<string, Evidence>(
  EVIDENCE.map((record) => [record.id, record]),
);
