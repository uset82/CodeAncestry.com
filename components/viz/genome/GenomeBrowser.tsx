'use client';

import { useCallback, useMemo, useState } from 'react';
import { useEvidenceThreshold } from '@/components/providers/EvidenceThresholdProvider';
import { EvidenceThresholdControl } from '@/components/registry/EvidenceThresholdControl';
import { cn } from '@/lib/cn';
import {
  COORDINATE_META,
  COORDINATE_MODES,
  type CoordinateMode,
  type Feature,
  type GenomeBrowserModel,
  type Track,
} from '@/lib/registry/genome';
import { LocusPanel } from './LocusPanel';
import { TrackCanvas } from './TrackCanvas';
import { TrackControls } from './TrackControls';
import { TrackTables } from './TrackTables';

/**
 * The Project Genome Browser.
 *
 * Owns everything except geometry: the coordinate mode, which tracks are shown
 * and in what order, the evidence threshold, the selection, and whether the
 * reader is looking at the canvas or the tables.
 *
 * The evidence threshold dims rather than deletes. A feature that fails the
 * current threshold stays on the axis at reduced contrast, because a reader
 * raising the bar should be able to see what they are choosing to discount.
 */

export function GenomeBrowser({ model }: { model: GenomeBrowserModel }) {
  const { passes } = useEvidenceThreshold();

  const [mode, setMode] = useState<CoordinateMode>('temporal');
  const [order, setOrder] = useState<string[]>(() => model.tracks.map((track) => track.kind));
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [view, setView] = useState<'canvas' | 'table'>('canvas');
  const [selection, setSelection] = useState<{ feature: Feature; track: Track } | null>(null);

  /* ---------------------------------------------------- ordered, visible tracks */
  const tracks = useMemo(() => {
    const byKind = new Map<string, Track>(model.tracks.map((track) => [track.kind, track]));
    return order.flatMap((kind) => {
      const track = byKind.get(kind);
      return track && !hidden.has(kind) ? [track] : [];
    });
  }, [model.tracks, order, hidden]);

  /* ------------------------------------------------- evidence threshold effect */
  const dimmed = useMemo(() => {
    const out = new Set<string>();
    for (const track of model.tracks) {
      for (const feature of track.features) {
        if (!passes(feature.tier)) out.add(feature.id);
      }
    }
    return out;
  }, [model.tracks, passes]);

  const total = model.tracks.reduce((sum, track) => sum + track.features.length, 0);

  /* ------------------------------------------------------------------ handlers */
  const handleSelect = useCallback((feature: Feature | null, track: Track | null) => {
    setSelection(feature && track ? { feature, track } : null);
  }, []);

  const toggle = (set: Set<string>, kind: string) => {
    const next = new Set(set);
    if (next.has(kind)) next.delete(kind);
    else next.add(kind);
    return next;
  };

  const handleMove = (kind: string, direction: -1 | 1) => {
    setOrder((prev) => {
      const index = prev.indexOf(kind);
      const target = index + direction;
      if (index === -1 || target < 0 || target >= prev.length) return prev;

      const next = [...prev];
      const [moved] = next.splice(index, 1);
      if (moved !== undefined) next.splice(target, 0, moved);
      return next;
    });
  };

  const handleReset = () => {
    setOrder(model.tracks.map((track) => track.kind));
    setHidden(new Set());
    setCollapsed(new Set());
  };

  return (
    <div>
      {/* ------------------------------------------------ coordinate mode switch */}
      <div className="border-line bg-panel flex flex-wrap items-end justify-between gap-4 rounded-lg border p-4">
        <fieldset className="min-w-0">
          <legend className="text-faint mb-2 font-mono text-nano">Coordinate system</legend>
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Coordinate system">
            {COORDINATE_MODES.map((candidate) => {
              const isActive = candidate === mode;
              return (
                <button
                  key={candidate}
                  type="button"
                  role="radio"
                  aria-checked={isActive}
                  onClick={() => setMode(candidate)}
                  className={cn(
                    'rounded border px-3 py-1.5 text-[13px] font-medium transition-colors',
                    isActive
                      ? 'border-acid/50 bg-acid/10 text-acid'
                      : 'border-line text-text-soft hover:border-line-strong hover:text-text',
                  )}
                >
                  {COORDINATE_META[candidate].label}
                </button>
              );
            })}
          </div>
          <p className="text-muted mt-2 max-w-prose text-[13px] leading-snug">
            {COORDINATE_META[mode].description}
          </p>
        </fieldset>

        <fieldset>
          <legend className="text-faint mb-2 font-mono text-nano">Presentation</legend>
          <div className="flex gap-1.5" role="radiogroup" aria-label="Presentation">
            {(['canvas', 'table'] as const).map((candidate) => (
              <button
                key={candidate}
                type="button"
                role="radio"
                aria-checked={view === candidate}
                onClick={() => setView(candidate)}
                className={cn(
                  'rounded border px-3 py-1.5 text-[13px] font-medium capitalize transition-colors',
                  view === candidate
                    ? 'border-cyan/50 bg-cyan/10 text-cyan'
                    : 'border-line text-text-soft hover:border-line-strong hover:text-text',
                )}
              >
                {candidate === 'canvas' ? 'Tracks' : 'Tables'}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      {/* --------------------------------------------------------- the two panes */}
      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_312px]">
        <div className="min-w-0">
          {view === 'canvas' ? (
            <TrackCanvas
              // A new coordinate system is a new geometry: remount so the
              // viewport and the feature cursor start from a clean state.
              key={mode}
              tracks={tracks}
              mode={mode}
              ticks={model.axis[mode]}
              collapsed={collapsed}
              dimmed={dimmed}
              selected={selection?.feature.id ?? null}
              onSelect={handleSelect}
              onToggleCollapse={(kind) => setCollapsed((prev) => toggle(prev, kind))}
            />
          ) : (
            <div className="border-line bg-panel rounded-lg border p-4 sm:p-6">
              <TrackTables
                tracks={tracks}
                mode={mode}
                selected={selection?.feature.id ?? null}
                dimmed={dimmed}
                onSelect={(feature, track) => handleSelect(feature, track)}
              />
            </div>
          )}

          {/* -------------------------------------------------------- the legend */}
          <Legend />
        </div>

        {/* ------------------------------------------------------------ sidebar */}
        <aside className="min-w-0 space-y-4">
          <section className="border-line bg-panel rounded-lg border p-4">
            <h2 className="mb-3 text-[15px] font-semibold tracking-tight">Selected locus</h2>
            <LocusPanel
              feature={selection?.feature ?? null}
              track={selection?.track ?? null}
              genomeName={model.genome.name}
            />
          </section>

          <section className="border-line bg-panel rounded-lg border p-4">
            <EvidenceThresholdControl hidden={dimmed.size} total={total} />
            <p className="text-faint mt-2 text-[12.5px] leading-snug">
              Features below the threshold are dimmed rather than removed, so you can see what you
              are choosing to discount.
            </p>
          </section>

          <section className="border-line bg-panel rounded-lg border p-4">
            <h2 className="mb-3 text-[15px] font-semibold tracking-tight">Tracks</h2>
            <TrackControls
              tracks={model.tracks}
              order={order}
              hidden={hidden}
              collapsed={collapsed}
              mode={mode}
              onToggleHidden={(kind) => setHidden((prev) => toggle(prev, kind))}
              onToggleCollapsed={(kind) => setCollapsed((prev) => toggle(prev, kind))}
              onMove={handleMove}
              onReset={handleReset}
            />
          </section>
        </aside>
      </div>
    </div>
  );
}

/**
 * The glyph key. Shape carries the same meaning as colour throughout the canvas,
 * so this legend names both channels rather than only the palette.
 */
function Legend() {
  const entries: { glyph: string; label: string; tone: string }[] = [
    { glyph: '▲', label: 'Adopted mutation, or a metric that improved', tone: 'text-acid' },
    { glyph: '▼', label: 'A metric that regressed', tone: 'text-rose' },
    { glyph: '✕', label: 'Declined mutation, or an open advisory', tone: 'text-rose' },
    { glyph: '◆', label: 'Authored here, or a verified release', tone: 'text-violet' },
    { glyph: '■', label: 'Human review', tone: 'text-text' },
    { glyph: '●', label: 'Still open, or an agent action', tone: 'text-amber' },
  ];

  return (
    <div className="border-line bg-panel mt-3 rounded-lg border px-4 py-3">
      <h3 className="text-faint mb-2 font-mono text-nano">Glyph key</h3>
      <ul className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
        {entries.map((entry) => (
          <li key={entry.glyph} className="flex items-baseline gap-2">
            <span aria-hidden="true" className={cn('w-3 shrink-0 text-center', entry.tone)}>
              {entry.glyph}
            </span>
            <span className="text-muted text-[12.5px] leading-snug">{entry.label}</span>
          </li>
        ))}
      </ul>
      <p className="text-faint mt-2.5 text-[12.5px] leading-snug">
        Capability bands are also hatched by inheritance mode, matching the Code Painting strip, so
        the tracks survive greyscale.
      </p>
    </div>
  );
}
