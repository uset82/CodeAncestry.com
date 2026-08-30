'use client';

import { useState, type MouseEvent } from 'react';
import { cn } from '@/lib/cn';
import {
  HEALTH_VIEWS,
  LINEAGE_KIND_META,
  demoAccession,
  lineageHealth,
  type HealthViewId,
} from '@/data/demo';
import { useRadioGroup } from '@/lib/hooks/useRadioGroup';

/**
 * 2D readout of the helix recovery pose. `upstream` is a pulse from the last
 * safe ancestor; this plate is that pulse as a fan-out. Descendants are
 * genomes. No robot mesh. Colour is never the only warning.
 */

const IMPACT = {
  WARNING: { mark: '!', tone: 'text-amber border-amber/45', stroke: 'var(--color-amber)' },
  QUARANTINE: { mark: '▣', tone: 'text-rose border-rose/45', stroke: 'var(--color-rose)' },
  AGGREGATE: { mark: '▣', tone: 'text-muted border-line', stroke: 'var(--color-cyan)' },
} as const;

const REPAIR = { mark: '✓', tone: 'text-acid border-acid/40', stroke: 'var(--color-acid)' } as const;

const formatCount = (value: number) => value.toLocaleString('en-GB');

const scrollToHash = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
  if (!href.startsWith('#')) return;
  const node = document.getElementById(href.slice(1));
  if (!node) return;
  event.preventDefault();
  const top = window.scrollY + node.getBoundingClientRect().top - 80;
  window.scrollTo({ top, behavior: 'instant' });
  window.history.pushState(null, '', href);
};

const kindGlyph = (kind: (typeof lineageHealth.sample)[number]['kind']) =>
  kind === 'AGGREGATE' ? '▣' : LINEAGE_KIND_META[kind].glyph;

export function LineageHealth({ className }: { className?: string }) {
  const [view, setView] = useState<HealthViewId>('impact');
  const [selected, setSelected] = useState(0);
  const handleSelect = (index: number) => {
    setSelected(index);
  };
  const handleView = (next: HealthViewId) => {
    setView(next);
  };
  const radio = useRadioGroup({
    count: lineageHealth.sample.length,
    index: selected,
    onSelect: handleSelect,
    orientation: 'vertical',
  });

  const inheritor = lineageHealth.sample[selected] ?? lineageHealth.sample[0];
  const repair = view === 'repair';

  return (
    <article className={cn('font-ui', className)}>
      <p className="text-muted font-mono text-nano uppercase">{lineageHealth.meta.label}</p>
      <p
        className={cn(
          'mt-3 inline-flex items-center gap-2 font-mono text-micro uppercase',
          repair ? 'text-acid' : 'text-amber',
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            'grid size-5 place-items-center rounded-xs border text-[11px]',
            repair ? 'border-acid/45' : 'border-amber/45',
          )}
        >
          {repair ? '✓' : '!'}
        </span>
        {repair ? 'Verified replacement' : 'Inherited mutation alert'}
      </p>
      <h3 className="mt-3 text-[18px] leading-tight font-semibold tracking-tight">
        {demoAccession(lineageHealth.mutationId)}
        <span className="text-muted font-normal"> · {formatCount(lineageHealth.descendants)} descendants</span>
      </h3>
      <p className="text-text-soft mt-2 text-[14px] leading-relaxed">
        Last safe ancestor is generation {lineageHealth.lastSafeAncestor}. The specimen on the right
        lights a verified mark and an upstream pulse. This plate is that fan-out in type.
      </p>

      <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3">
        <Datum label="Descendants affected" value={formatCount(lineageHealth.descendants)} warn={!repair} />
        <Datum label="Last safe ancestor" value={`generation ${lineageHealth.lastSafeAncestor}`} safe />
        <Datum label="Verified replacement" value={demoAccession(lineageHealth.replacementId)} safe={repair} />
        <Datum label="Named in this sample" value="4 + remainder" />
      </dl>

      <div className="mt-6 flex flex-wrap gap-1.5" role="group" aria-label="Lineage Health view">
        {HEALTH_VIEWS.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={view === item.id}
            onClick={() => handleView(item.id)}
            className={cn(
              'rounded-xs border px-2 py-1 font-mono text-nano uppercase',
              view === item.id
                ? item.id === 'repair'
                  ? 'border-acid/50 bg-acid/10 text-acid'
                  : 'border-amber/50 bg-amber/10 text-amber'
                : 'border-line text-muted hover:text-text',
            )}
          >
            <span aria-hidden="true">{item.mark} </span>
            {item.label}
          </button>
        ))}
      </div>

      <p className="text-muted mt-8 font-mono text-nano uppercase">Descendant fan-out</p>
      <p className="text-muted mt-1 font-mono text-nano">
        {repair
          ? `✓ from generation ${lineageHealth.lastSafeAncestor} · ${demoAccession(lineageHealth.replacementId)}`
          : `${demoAccession(lineageHealth.mutationId)} → inheritors`}
      </p>

      <div className="relative mt-3 pl-6">
        <svg
          aria-hidden="true"
          viewBox="0 0 8 200"
          preserveAspectRatio="none"
          className="absolute top-1 bottom-1 left-0 w-2"
        >
          <line
            x1="4"
            y1="0"
            x2="4"
            y2="200"
            stroke={repair ? 'var(--color-acid)' : 'var(--color-amber)'}
            strokeWidth="1.3"
            strokeDasharray="4 5"
            className="animate-dash"
            opacity="0.7"
          />
        </svg>
        <div {...radio.groupProps} aria-label="Sample inheritors of M-94012">
          {lineageHealth.sample.map((item, index) => {
            const status = repair ? REPAIR : IMPACT[item.status];
            const active = index === selected;
            return (
              <button
                key={item.id}
                {...radio.radioProps(index)}
                aria-label={`${item.name}, ${item.kind}, ${repair ? 'would receive replacement' : item.status}`}
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
                  <span className="text-text block font-mono text-nano uppercase">{item.name}</span>
                  <span className="text-muted block text-[12.5px]">
                    <span aria-hidden="true">{kindGlyph(item.kind)} </span>
                    {item.kind}
                    {item.generation > 0 ? ` · gen ${item.generation}` : ''}
                  </span>
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 200 10"
                    className="mt-1.5 h-2.5 w-full"
                    preserveAspectRatio="none"
                  >
                    <line
                      x1="0"
                      y1="5"
                      x2="200"
                      y2="5"
                      stroke="var(--color-line)"
                      strokeWidth="1"
                      opacity="0.45"
                    />
                    <line
                      x1="0"
                      y1="5"
                      x2={item.status === 'AGGREGATE' ? 200 : 72 + item.generation * 28}
                      y2="5"
                      stroke={active ? status.stroke : 'var(--color-cyan)'}
                      strokeWidth={active ? 1.8 : 1.2}
                      strokeDasharray={item.kind === 'AGGREGATE' ? '2 4' : '4 5'}
                      className={active ? 'animate-dash' : undefined}
                      opacity={active ? 0.95 : 0.45}
                    />
                    <circle
                      cx={item.status === 'AGGREGATE' ? 200 : 72 + item.generation * 28}
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
                  {repair ? 'REPAIR' : item.status}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {inheritor && (
        <div aria-live="polite" className="border-line mt-5 border-t pt-4">
          <p className={cn('font-mono text-micro uppercase', (repair ? REPAIR : IMPACT[inheritor.status]).tone.split(' ')[0])}>
            <span aria-hidden="true">{(repair ? REPAIR : IMPACT[inheritor.status]).mark} </span>
            {inheritor.name}
          </p>
          <p className="text-text mt-2 text-[15px] leading-snug tracking-tight">
            {repair
              ? `Would receive ${demoAccession(lineageHealth.replacementId)} from generation ${lineageHealth.lastSafeAncestor}.`
              : inheritor.role}
          </p>
          <p className="text-text-soft mt-2 text-[13.5px] leading-relaxed">
            {repair
              ? 'Demo only — the replacement is labelled, not written. The helix shows the pulse. This row is one destination.'
              : inheritor.status === 'AGGREGATE'
                ? 'Four AXIS genomes stand in for the count. The rest are not a robot army.'
                : 'Warning is a mark. Follow the row into the instrument that holds the record.'}
          </p>
          {inheritor.href && (
            <a
              href={inheritor.href}
              onClick={(event) => scrollToHash(event, inheritor.href!)}
              className="text-text-soft hover:text-text mt-2 mr-4 inline-block text-[13.5px] underline decoration-dotted"
            >
              Open the ancestor record
            </a>
          )}
          <a
            href="#trace"
            onClick={(event) => scrollToHash(event, '#trace')}
            className="text-text-soft hover:text-text mt-2 inline-block text-[13.5px] underline decoration-dotted"
          >
            Open the trace
          </a>
        </div>
      )}
    </article>
  );
}

const Datum = ({
  label,
  value,
  warn = false,
  safe = false,
}: {
  label: string;
  value: string;
  warn?: boolean;
  safe?: boolean;
}) => (
  <div>
    <dt className="text-muted font-mono text-nano uppercase">{label}</dt>
    <dd
      className={cn(
        'mt-0.5 text-[13.5px] tracking-tight',
        warn ? 'text-amber' : safe ? 'text-acid' : 'text-text',
      )}
    >
      {warn ? <span aria-hidden="true">! </span> : null}
      {safe ? <span aria-hidden="true">✓ </span> : null}
      {value}
    </dd>
  </div>
);
