import type { Metadata } from 'next';
import { AccessionBadge } from '@/components/ui/AccessionBadge';
import { Button } from '@/components/ui/Button';
import { ConfidenceMeter } from '@/components/ui/ConfidenceMeter';
import { EvidenceChip } from '@/components/ui/EvidenceChip';
import { FitnessVector } from '@/components/ui/FitnessVector';
import { Panel, SectionHead, StatRail, StatusDot } from '@/components/ui/Panel';
import { StateBadge } from '@/components/ui/StateBadge';
import { StatePatterns } from '@/components/ui/StatePatterns';
import {
  EDGE_TYPES,
  EDGE_TYPE_META,
  EVIDENCE_CODES,
  EVIDENCE_CODE_META,
  INHERITANCE_META,
  INHERITANCE_MODES,
  LINEAGE_STATES,
  MUTATION_HAPPY_PATH,
  MUTATION_STATE_META,
} from '@/lib/schema/vocabulary';

export const metadata: Metadata = {
  title: 'Design tokens',
  description: 'Internal reference for the CodeAncestry design system.',
  robots: { index: false, follow: false },
};

/* Paper ground. The same six slots render as the dark elevated inside
   . — see the  row in globals.css. */
const SURFACES = [
  ['void', '#e7e2d5'],
  ['panel', '#efeae0'],
  ['panel-2', '#dcd5c3'],
  ['panel-3', '#d3ccb6'],
  ['line', '#c7c0aa'],
  ['line-strong', '#a39a80'],
] as const;

/* Five printing inks. Names are historical; the values are what ships. */
const ACCENTS = [
  ['acid', '#2c5a3b', 'verified · primary action'],
  ['cyan', '#1c4a86', 'inherited · data'],
  ['violet', '#58347f', 'agent · mutation'],
  ['amber', '#96620d', 'quarantined'],
  ['rose', '#ad2f19', 'rejected · security'],
] as const;

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Panel className="p-6">
      <h3 className="text-muted mb-5 font-mono text-micro uppercase">{title}</h3>
      {children}
    </Panel>
  );
}

export default function DesignPage() {
  return (
    <div className="shell-wide py-16">
      <StatePatterns />

      <SectionHead
        index="INTERNAL / DESIGN"
        title="Design tokens"
        lede="Every primitive on one page. Colour is never the only encoding for a state — each one also carries a glyph, a pattern and a text label."
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <Block title="Surfaces">
          <div className="grid grid-cols-3 gap-3">
            {SURFACES.map(([name, hex]) => (
              <div key={name}>
                <div
                  className="border-line h-16 rounded-md border"
                  style={{ background: hex }}
                />
                <p className="text-text-soft mt-2 font-mono text-nano">{name}</p>
                <p className="text-faint font-mono text-nano">{hex}</p>
              </div>
            ))}
          </div>
        </Block>

        <Block title="Semantic accents">
          <div className="flex flex-col gap-3">
            {ACCENTS.map(([name, hex, role]) => (
              <div key={name} className="flex items-center gap-3">
                <span
                  className="border-line size-9 shrink-0 rounded-md border"
                  style={{ background: hex }}
                />
                <div className="min-w-0">
                  <p className="font-mono text-[11px]">
                    {name} <span className="text-faint">{hex}</span>
                  </p>
                  <p className="text-muted text-[11px]">{role}</p>
                </div>
              </div>
            ))}
          </div>
        </Block>

        <Block title="Type scale">
          <div className="flex flex-col gap-5">
            <p className="font-sans text-display">Ancestors</p>
            <p className="font-sans text-headline">Follow the bloodline</p>
            <p className="font-sans text-title">Code becomes traits</p>
            <p className="text-acid text-title">Plate-caption emphasis</p>
            <p className="text-lead text-text-soft">
              Git stores lines. CodeAncestry stores meaning.
            </p>
            <p className="text-[15px]">Body copy in Newsreader, the registry default.</p>
            <p className="text-acid label text-[10px]">01 / Micro label</p>
            <p className="text-muted label text-[9px]">Nano label</p>
            <p className="font-mono text-[11px]">CAGENE:MIDI-SCHEDULING · sha256:8c20…</p>
          </div>

          <dl className="border-line mt-6 grid gap-2 border-t pt-4 text-[12.5px]">
            <div className="flex gap-3">
              <dt className="text-faint label w-16 shrink-0 text-[9px]">Display</dt>
              <dd className="font-sans">Bodoni Moda — headings only</dd>
            </div>
            <div className="flex gap-3">
              <dt className="text-faint label w-16 shrink-0 text-[9px]">Prose</dt>
              <dd>Newsreader — body copy</dd>
            </div>
            <div className="flex gap-3">
              <dt className="text-faint label w-16 shrink-0 text-[9px]">Data</dt>
              <dd className="font-mono">IBM Plex Mono — labels, accessions, controls</dd>
            </div>
          </dl>
        </Block>

        <Block title="Buttons">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="primary">Generate genome</Button>
              <Button variant="secondary">Explore CodeTree</Button>
              <Button variant="ghost">Dismiss</Button>
              <Button variant="danger">Quarantine</Button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
              <Button disabled>Disabled</Button>
            </div>
          </div>
        </Block>

        <Block title="Accessions">
          <div className="flex flex-col items-start gap-2.5">
            <AccessionBadge accession="CAPROJ:01JKEYLIT000" />
            <AccessionBadge accession="CAGENOME:01JKEYLIT7H2" />
            <AccessionBadge accession="CAGENE:MIDI-SCHEDULING" />
            <AccessionBadge accession="CAALLELE:MIDI-SCHEDULING:3" />
            <AccessionBadge accession="CAMUT:882" />
            <AccessionBadge accession="CAAGENT:KEYLIT:7" />
            <AccessionBadge accession="CAEV:991" copyable={false} />
            <AccessionBadge accession="CAPHENO:882" copyable={false} />
          </div>
        </Block>

        <Block title="Lineage states">
          <div className="flex flex-col gap-3">
            {LINEAGE_STATES.map((state) => (
              <div key={state} className="flex items-center gap-3">
                <StateBadge state={state} />
              </div>
            ))}
          </div>
        </Block>

        <Block title="Evidence codes">
          <div className="grid gap-2 sm:grid-cols-2">
            {EVIDENCE_CODES.map((code) => (
              <div key={code} className="flex items-center gap-2.5">
                <EvidenceChip code={code} />
                <span className="text-muted text-[11px]">
                  {EVIDENCE_CODE_META[code].label}
                  <span className="text-faint"> · {EVIDENCE_CODE_META[code].tier}</span>
                </span>
              </div>
            ))}
          </div>
        </Block>

        <Block title="Inheritance modes">
          <div className="flex flex-col gap-2.5">
            {INHERITANCE_MODES.map((mode) => {
              const meta = INHERITANCE_META[mode];
              return (
                <div key={mode} className="flex items-start gap-3">
                  <span className={`mt-1 h-3 w-6 shrink-0 rounded-sm ${meta.swatch}`} />
                  <div>
                    <p className={`text-[12px] font-semibold ${meta.tone}`}>{meta.label}</p>
                    <p className="text-muted text-[11px]">{meta.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Block>

        <Block title="Confidence">
          <div className="flex flex-col gap-5">
            <ConfidenceMeter value={0.97} label="Semantic boundary" />
            <ConfidenceMeter value={0.78} label="Origin" />
            <ConfidenceMeter value={0.41} label="Inferred parent" />
          </div>
        </Block>

        <Block title="Edge types">
          <dl className="flex flex-col gap-2">
            {EDGE_TYPES.map((type) => {
              const meta = EDGE_TYPE_META[type];
              return (
                <div key={type} className="border-line-soft flex justify-between gap-4 border-b pb-1.5">
                  <dt className={`font-mono text-[11px] ${meta.tone}`}>{type}</dt>
                  <dd className="text-muted text-[11px]">
                    {meta.verb} <span className="text-faint">· {meta.stroke}</span>
                  </dd>
                </div>
              );
            })}
          </dl>
        </Block>

        <Block title="Mutation lifecycle">
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-2">
            {MUTATION_HAPPY_PATH.map((state, i) => (
              <li key={state} className="flex items-center gap-2">
                <StateBadge state={MUTATION_STATE_META[state].lineageState} compact />
                <span className="text-text-soft text-[11px]">
                  {MUTATION_STATE_META[state].label}
                </span>
                {i < MUTATION_HAPPY_PATH.length - 1 && (
                  <span aria-hidden="true" className="text-faint">
                    →
                  </span>
                )}
              </li>
            ))}
          </ol>
        </Block>

        <Block title="Status and stats">
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap gap-5">
              <StatusDot label="Live family" tone="acid" />
              <StatusDot label="Ingesting" tone="cyan" />
              <StatusDot label="Agent active" tone="violet" />
            </div>
            <StatRail
              stats={[
                { label: 'Generation', value: '0' },
                { label: 'Genes', value: '12' },
                { label: 'Known parents', value: '0' },
                { label: 'Verified releases', value: '3' },
              ]}
            />
          </div>
        </Block>

        <Panel className="p-6 lg:col-span-2">
          <h3 className="text-muted mb-5 font-mono text-micro uppercase">Fitness vector</h3>
          <FitnessVector
            scores={{
              correctness: 1,
              security: 0.94,
              performance: 0.88,
              compatibility: 0.98,
              maintainability: 0.72,
              userOutcome: 0.81,
            }}
            baseline={{
              correctness: 1,
              security: 0.94,
              performance: 0.62,
              compatibility: 1,
              maintainability: 0.78,
              userOutcome: 0.74,
            }}
            deltas={[
              {
                metric: 'MIDI latency p50',
                before: '41 ms',
                after: '19 ms',
                change: '−22 ms',
                direction: 'better',
              },
              {
                metric: 'CPU under load',
                before: '18%',
                after: '12%',
                change: '−6 pts',
                direction: 'better',
              },
              {
                metric: 'Cyclomatic complexity',
                before: '14',
                after: '19',
                change: '+5',
                direction: 'worse',
              },
              {
                metric: 'Public API surface',
                before: '9',
                after: '9',
                change: 'unchanged',
                direction: 'neutral',
              },
            ]}
          />
        </Panel>
      </div>
    </div>
  );
}
