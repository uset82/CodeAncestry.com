'use client';

import { useMemo, useState } from 'react';
import { cn } from '@/lib/cn';
import { axisRobot, demoAccession, getDemoGene } from '@/data/demo';
import { useRadioGroup } from '@/lib/hooks/useRadioGroup';
import { DemoGeneInspector } from './DemoGeneInspector';

/**
 * Homepage-scoped genome. Eight capability tracks from AXIS ROBOT CORE.
 * Reuses the registry browser's language (tracks, selection, keyboard) without
 * loading KEYLIT. Selecting a track opens its demo gene.
 */

const DEFAULT_TRACK = 'navigation';

export function AxisGenomeBrowser({ defaultTrack = DEFAULT_TRACK }: { defaultTrack?: string }) {
  const tracks = axisRobot.tracks;
  const initial = Math.max(
    0,
    tracks.findIndex((track) => track.id === defaultTrack),
  );
  const [selected, setSelected] = useState(initial);
  const handleSelect = (index: number) => {
    setSelected(index);
  };
  const radio = useRadioGroup({
    count: tracks.length,
    index: selected,
    onSelect: handleSelect,
    orientation: 'both',
  });

  const track = tracks[selected] ?? tracks[0];
  const gene = useMemo(() => (track ? getDemoGene(track.geneId) : undefined), [track]);

  return (
    <div className="border-line bg-panel rounded-sm border">
      <div className="border-line flex flex-wrap items-baseline justify-between gap-3 border-b px-4 py-3">
        <div>
          <p className="text-muted font-mono text-nano uppercase">{axisRobot.meta.label}</p>
          <p className="mt-1 text-[15px] font-semibold tracking-tight">{axisRobot.name}</p>
        </div>
        <p className="text-muted font-mono text-nano uppercase">
          {tracks.length} tracks · capability weight
        </p>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_240px]">
        <div
          {...radio.groupProps}
          aria-label={`${axisRobot.name} capability tracks`}
          className="min-w-0 px-3 py-3"
        >
          {tracks.map((item, index) => {
            const record = getDemoGene(item.geneId);
            const active = index === selected;
            const investigate = record?.status === 'Investigate';

            return (
              <button
                key={item.id}
                {...radio.radioProps(index)}
                aria-label={`${item.capability} track, ${record ? demoAccession(record.id) : 'no gene'}${investigate ? ', Investigate' : ''}`}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xs px-2 py-2 text-left transition-colors',
                  active ? 'bg-void' : 'hover:bg-hover',
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'grid size-3.5 shrink-0 place-items-center font-mono text-[10px]',
                    active ? 'text-acid' : 'text-muted',
                  )}
                >
                  {active ? '◆' : '○'}
                </span>
                <span className="w-[7.5rem] shrink-0 font-mono text-nano uppercase">
                  {item.capability}
                </span>
                <span className="bg-line relative h-1.5 min-w-0 flex-1 overflow-hidden rounded-full">
                  <span
                    className={cn(
                      'absolute inset-y-0 left-0 rounded-full',
                      investigate ? 'bg-amber' : 'bg-cyan',
                      active && !investigate && 'bg-acid',
                    )}
                    style={{ width: `${Math.round(item.weight * 100)}%` }}
                  />
                </span>
                <span className="text-muted w-10 shrink-0 text-right font-mono text-nano tabular-nums">
                  {item.weight.toFixed(2)}
                </span>
                {investigate && (
                  <span className="text-amber font-mono text-nano" title="Status: Investigate">
                    !
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <aside className="border-line bg-void/40 min-w-0 border-t p-4 lg:border-t-0 lg:border-l">
          {gene ? (
            <DemoGeneInspector gene={gene} />
          ) : (
            <p className="text-muted text-[14px]">No gene record for this track.</p>
          )}
          {track && (
            <p className="text-muted mt-4 font-mono text-nano uppercase">
              Selected {demoAccession(track.geneId)}
            </p>
          )}
        </aside>
      </div>

      <p className="border-line text-muted border-t px-4 py-2 font-mono text-nano">
        Arrows move between tracks · click or focus to inspect
      </p>
    </div>
  );
}
