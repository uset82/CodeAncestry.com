'use client';

import { useState, type MouseEvent } from 'react';
import { cn } from '@/lib/cn';
import { ax2041, demoAccession, getDemoGene } from '@/data/demo';
import { useRadioGroup } from '@/lib/hooks/useRadioGroup';

/**
 * 2D readout of the helix converge pose. Same idea: stacked horizontal
 * tracks, locus along the run, no robot. Track length encodes generation.
 * Colour is never the only status — marks change shape (✓ / ! / ? / ◆).
 */

const STATUS = {
  VERIFIED: { mark: '✓', tone: 'text-acid border-acid/40', stroke: 'var(--color-cyan)' },
  WARNING: { mark: '!', tone: 'text-amber border-amber/45', stroke: 'var(--color-amber)' },
  INVESTIGATE: { mark: '?', tone: 'text-rose border-rose/45', stroke: 'var(--color-rose)' },
} as const;

const DEFAULT = ax2041.capabilities.findIndex((item) => item.status === 'WARNING');
const MAX_GENERATION = Math.max(...ax2041.capabilities.map((item) => item.generation));
const MIN_GENERATION = Math.min(...ax2041.capabilities.map((item) => item.generation));
const TRACK_SPAN = 200;

const formatCount = (value: number) => value.toLocaleString('en-GB');

const trackLength = (generation: number) => {
  const t = MAX_GENERATION <= 0 ? 0 : generation / MAX_GENERATION;
  return 28 + t * (TRACK_SPAN - 40);
};

export function MachineGenome({ className }: { className?: string }) {
  const initial = DEFAULT >= 0 ? DEFAULT : 0;
  const [selected, setSelected] = useState(initial);
  const handleSelect = (index: number) => {
    setSelected(index);
  };
  const radio = useRadioGroup({
    count: ax2041.capabilities.length,
    index: selected,
    onSelect: handleSelect,
    orientation: 'vertical',
  });

  const locus = ax2041.capabilities[selected] ?? ax2041.capabilities[0];
  const gene = locus ? getDemoGene(locus.geneId) : undefined;

  const handleOpenAncestor = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!locus?.href.startsWith('#')) return;
    const node = document.getElementById(locus.href.slice(1));
    if (!node) return;
    event.preventDefault();
    const top = window.scrollY + node.getBoundingClientRect().top - 80;
    window.scrollTo({ top, behavior: 'instant' });
    window.history.pushState(null, '', locus.href);
  };

  return (
    <article className={cn('font-ui', className)}>
      <p className="text-muted font-mono text-nano uppercase">
        {ax2041.meta.label} · {gene?.meta.label ?? 'DEMO LINEAGE'}
      </p>
      <h3 className="mt-2 text-[18px] leading-tight font-semibold tracking-tight">{ax2041.name}</h3>
      <p className="text-text-soft mt-2 text-[14px] leading-relaxed">
        Born {ax2041.born} · generation {ax2041.generation}. The specimen is not a robot — it is the
        AXIS family re-posed into stacked tracks. This plate is that column in type.
      </p>

      <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3">
        <Datum label="Software ancestors" value={formatCount(ax2041.softwareAncestors)} />
        <Datum label="Capability genes" value={formatCount(ax2041.capabilityGenes)} />
        <Datum label="Verified lineage" value={`${(ax2041.verifiedLineage * 100).toFixed(2)}%`} />
        <Datum label="Active mutations" value={formatCount(ax2041.activeMutations)} />
        <Datum
          label="Inherited vulnerabilities"
          value={String(ax2041.inheritedVulnerabilities)}
          warn={ax2041.inheritedVulnerabilities > 0}
        />
      </dl>

      <p className="text-muted mt-8 font-mono text-nano uppercase">Capability column</p>
      <p className="text-muted mt-1 font-mono text-nano">
        Track length ∝ generation · gen {MIN_GENERATION} → {MAX_GENERATION}
      </p>
      <div {...radio.groupProps} aria-label={`${ax2041.name} capability loci`} className="mt-3">
        {ax2041.capabilities.map((item, index) => {
          const status = STATUS[item.status];
          const active = index === selected;
          const length = trackLength(item.generation);
          return (
            <button
              key={item.capability}
              {...radio.radioProps(index)}
              aria-label={`${item.capability}, origin ${item.origin}, generation ${item.generation}, ${item.status}${'note' in item && item.note ? `, ${item.note}` : ''}`}
              className={cn(
                'mb-1 grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xs px-2 py-2 text-left last:mb-0',
                active ? 'bg-void' : 'hover:bg-hover',
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  'grid size-5 shrink-0 place-items-center rounded-xs border font-mono text-[10px]',
                  active ? status.tone : 'border-line text-muted',
                )}
              >
                {active ? '◆' : status.mark}
              </span>
              <span className="min-w-0">
                <span className="text-text block font-mono text-nano uppercase">{item.capability}</span>
                <span className="text-muted block text-[12.5px]">
                  {item.origin} · gen {item.generation}
                </span>
                <svg
                  aria-hidden="true"
                  viewBox={`0 0 ${TRACK_SPAN} 10`}
                  className="mt-1.5 h-2.5 w-full"
                  preserveAspectRatio="none"
                >
                  <line
                    x1="0"
                    y1="5"
                    x2={TRACK_SPAN}
                    y2="5"
                    stroke="var(--color-line)"
                    strokeWidth="1"
                    opacity="0.45"
                  />
                  <line
                    x1="0"
                    y1="5"
                    x2={length}
                    y2="5"
                    stroke={active ? status.stroke : 'var(--color-cyan)'}
                    strokeWidth={active ? 1.8 : 1.2}
                    strokeDasharray="4 5"
                    className={active ? 'animate-dash' : undefined}
                    opacity={active ? 0.95 : 0.45}
                  />
                  <circle
                    cx={length}
                    cy="5"
                    r={active ? 3.2 : 2.2}
                    fill={active ? status.stroke : 'var(--color-cyan)'}
                    opacity={active ? 1 : 0.55}
                  />
                </svg>
              </span>
              <span
                className={cn(
                  'shrink-0 rounded-xs border px-1.5 py-0.5 font-mono text-nano uppercase',
                  status.tone,
                )}
              >
                {item.status}
              </span>
            </button>
          );
        })}
      </div>

      {locus && (
        <div aria-live="polite" className="border-line mt-5 border-t pt-4">
          <p className={cn('font-mono text-micro uppercase', STATUS[locus.status].tone.split(' ')[0])}>
            <span aria-hidden="true">{STATUS[locus.status].mark} </span>
            {locus.capability}
          </p>
          <p className="text-text mt-2 text-[15px] leading-snug tracking-tight">
            {locus.origin}
            {gene ? ` · ${demoAccession(gene.id)}` : ''}
          </p>
          <p className="text-text-soft mt-2 text-[13.5px] leading-relaxed">
            {'note' in locus && locus.note
              ? locus.note
              : gene
                ? gene.purpose
                : 'Inherited capability. The column is the ancestry.'}
            {locus.status === 'WARNING'
              ? ' Warning is a mark, not a colour. Follow NAV-G288 on the genome.'
              : null}
          </p>
          {locus.href && (
            <a
              href={locus.href}
              className="text-text-soft hover:text-text mt-2 inline-block text-[13.5px] underline decoration-dotted"
              onClick={handleOpenAncestor}
            >
              Open the ancestor record
            </a>
          )}
        </div>
      )}
    </article>
  );
}

const Datum = ({
  label,
  value,
  warn = false,
}: {
  label: string;
  value: string;
  warn?: boolean;
}) => (
  <div>
    <dt className="text-muted font-mono text-nano uppercase">{label}</dt>
    <dd className={cn('mt-0.5 text-[13.5px] tracking-tight', warn ? 'text-amber' : 'text-text')}>
      {warn ? <span aria-hidden="true">! </span> : null}
      {value}
    </dd>
  </div>
);
