'use client';

import { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/cn';
import { PROTOCOL_LOCI, protocolIndex, type ProtocolStatus } from '@/data/demo/protocol';
import { useRadioGroup } from '@/lib/hooks/useRadioGroup';

/**
 * 2D readout of the zoomed-out helix. Two strands — protocol and research —
 * like the specimen's backbones. Track length encodes how specified each
 * object is. OPEN is muted, not rose: rose is reserved for harm.
 */

const STATUS: Record<
  ProtocolStatus,
  { mark: string; tone: string; stroke: string }
> = {
  LIVE: { mark: '✓', tone: 'text-acid border-acid/40', stroke: 'var(--color-cyan)' },
  WORKING: { mark: '△', tone: 'text-amber border-amber/45', stroke: 'var(--color-amber)' },
  OPEN: { mark: '?', tone: 'text-muted border-line', stroke: 'var(--color-muted)' },
};

const TRACK_SPAN = 200;

const trackLength = (specified: number) => 36 + specified * (TRACK_SPAN - 48);

const GROUPS = [
  { id: 'protocol' as const, label: 'CodeAncestry protocol' },
  { id: 'research' as const, label: 'Research' },
];

export function ProtocolIndex({ className }: { className?: string }) {
  const [selected, setSelected] = useState(0);
  const handleSelect = (index: number) => {
    setSelected(index);
  };
  const radio = useRadioGroup({
    count: PROTOCOL_LOCI.length,
    index: selected,
    onSelect: handleSelect,
    orientation: 'vertical',
  });

  const locus = PROTOCOL_LOCI[selected] ?? PROTOCOL_LOCI[0];
  const status = locus ? STATUS[locus.status] : STATUS.WORKING;

  return (
    <article className={cn('font-ui', className)}>
      <p className="text-muted font-mono text-nano uppercase">
        {protocolIndex.meta.label} · track length ∝ specified
      </p>
      <h3 className="mt-2 text-[18px] leading-tight font-semibold tracking-tight">
        The naming system
      </h3>
      <p className="text-text-soft mt-2 text-[14px] leading-relaxed">
        The specimen on the right is already the whole family. These loci are how that network
        gets names that survive a rewrite. Colour is secondary. Marks change shape.
      </p>

      <div
        {...radio.groupProps}
        aria-label="Protocol and research loci"
        className="mt-8 md:grid md:grid-cols-2 md:items-start md:gap-8"
      >
        {GROUPS.map((group) => {
          const rows = PROTOCOL_LOCI.map((item, index) => ({ item, index })).filter(
            ({ item }) => item.group === group.id,
          );
          return (
            <div key={group.id} className={group.id === 'research' ? 'mt-7 md:mt-0' : undefined}>
              <p className="text-muted font-mono text-nano uppercase">{group.label}</p>
              <div className="mt-2">
                {rows.map(({ item, index }) => {
                  const active = index === selected;
                  const length = trackLength(item.specified);
                  const tone = STATUS[item.status];
                  return (
                    <button
                      key={item.id}
                      {...radio.radioProps(index)}
                      aria-label={`${item.name}, ${item.status}, ${item.kind}, specified ${item.specified.toFixed(2)}`}
                      className={cn(
                        'mb-0.5 grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xs px-2 py-1.5 text-left last:mb-0',
                        active ? 'bg-void' : 'hover:bg-hover',
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={cn(
                          'grid size-5 shrink-0 place-items-center rounded-xs border font-mono text-[10px]',
                          active ? tone.tone : 'border-line text-muted',
                        )}
                      >
                        {active ? '◆' : item.mark}
                      </span>
                      <span className="min-w-0">
                        <span className="text-text block font-mono text-nano uppercase">
                          {item.name}
                        </span>
                        <span className="text-muted block text-[12.5px]">
                          {item.kind}
                          <span className="md:hidden"> · spec {item.specified.toFixed(2)}</span>
                        </span>
                        <svg
                          aria-hidden="true"
                          viewBox={`0 0 ${TRACK_SPAN} 10`}
                          className="mt-1.5 hidden h-2.5 w-full md:block"
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
                            stroke={active ? tone.stroke : 'var(--color-cyan)'}
                            strokeWidth={active ? 1.8 : 1.2}
                            strokeDasharray="4 5"
                            className={active ? 'animate-dash' : undefined}
                            opacity={active ? 0.95 : 0.45}
                          />
                          <circle
                            cx={length}
                            cy="5"
                            r={active ? 3.2 : 2.2}
                            fill={active ? tone.stroke : 'var(--color-cyan)'}
                            opacity={active ? 1 : 0.55}
                          />
                        </svg>
                      </span>
                      <span
                        className={cn(
                          'shrink-0 rounded-xs border px-1.5 py-0.5 font-mono text-nano uppercase',
                          tone.tone,
                        )}
                      >
                        {item.status}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {locus && (
        <div aria-live="polite" className="border-line mt-5 border-t pt-4">
          <p className={cn('font-mono text-micro uppercase', status.tone.split(' ')[0])}>
            <span aria-hidden="true">{status.mark} </span>
            {locus.name}
            <span className="text-muted"> · {locus.status}</span>
          </p>
          <p className="text-text-soft mt-2 text-[13.5px] leading-relaxed">{locus.meaning}</p>
          <Link
            href={locus.href}
            className="text-text-soft hover:text-text mt-2 inline-block text-[13.5px] underline decoration-dotted"
          >
            Open {locus.name.toLowerCase()}
          </Link>
        </div>
      )}
    </article>
  );
}
