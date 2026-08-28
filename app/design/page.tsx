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

const SURFACES = [
  ['void', '#07090d'],
  ['panel', '#0d1118'],
  ['panel-2', '#111722'],
  ['panel-3', '#161d29'],
  ['line', '#202937'],
  ['line-strong', '#303b4c'],
] as const;

const ACCENTS = [
  ['acid', '#b7ff39', 'verified · primary action'],
  ['cyan', '#63e7ff', 'inherited · data'],
  ['violet', '#a985ff', 'agent · mutation'],
  ['amber', '#ffb340', 'quarantined'],
  ['rose', '#ff5c7a', 'rejected · security'],
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
            <p className="text-display leading-[0.83]">Ancestors</p>
            <p className="text-headline">Follow the bloodline</p>
            <p className="text-title">Code becomes traits</p>
            <p className="text-lead text-text-soft">
              Git stores lines. CodeAncestry stores meaning.
            </p>
            <p className="text-[15px]">Body copy at fifteen pixels, the registry default.</p>
            <p className="text-acid font-mono text-micro uppercase">01 / Micro label</p>
            <p className="text-muted font-mono text-nano uppercase">Nano label</p>
            <p className="font-mono text-[11px]">CAGENE:MIDI-SCHEDULING · sha256:8c20…</p>
          </div>
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
