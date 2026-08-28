'use client';

import Link from 'next/link';
import { cn } from '@/lib/cn';
import type { CoordinateMode, Feature, Track } from '@/lib/registry/genome';
import { COORDINATE_META } from '@/lib/registry/genome';

/**
 * The accessible equivalent of the canvas.
 *
 * Not a downgrade and not a fallback that loses information: every feature the
 * canvas can draw appears here as a table row, in axis order, with its evidence
 * tier and its position stated in words. Selecting a row selects the same locus
 * the canvas would, so the two views stay in step.
 */

export function TrackTables({
  tracks,
  mode,
  selected,
  dimmed,
  onSelect,
}: {
  tracks: Track[];
  mode: CoordinateMode;
  selected: string | null;
  dimmed: Set<string>;
  onSelect: (feature: Feature, track: Track) => void;
}) {
  return (
    <div className="space-y-8">
      <p className="text-muted text-[14px] leading-relaxed">
        Every track as a table, ordered along the{' '}
        <strong className="text-text-soft font-semibold">
          {COORDINATE_META[mode].label.toLowerCase()}
        </strong>{' '}
        axis. Features with no position on this axis are listed last and marked as unplaced.
      </p>

      {tracks.map((track) => (
        <TrackTable
          key={track.kind}
          track={track}
          mode={mode}
          selected={selected}
          dimmed={dimmed}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

function TrackTable({
  track,
  mode,
  selected,
  dimmed,
  onSelect,
}: {
  track: Track;
  mode: CoordinateMode;
  selected: string | null;
  dimmed: Set<string>;
  onSelect: (feature: Feature, track: Track) => void;
}) {
  // Placed features in axis order, then the unplaced ones, so the table reads the
  // same left-to-right as the canvas does.
  const rows = track.features
    .slice()
    .sort((a, b) => {
      const left = a.pos[mode];
      const right = b.pos[mode];
      if (left === null && right === null) return a.label.localeCompare(b.label);
      if (left === null) return 1;
      if (right === null) return -1;
      return left - right;
    });

  return (
    <section>
      <h3 className="text-[15px] font-semibold tracking-tight">{track.label}</h3>
      <p className="text-muted mt-1 text-[13px] leading-relaxed">{track.description}</p>

      {rows.length === 0 ? (
        <p className="border-line text-faint mt-3 rounded border border-dashed px-3 py-4 text-[13px]">
          Nothing recorded on this track for this genome.
        </p>
      ) : (
        <div className="border-line mt-3 overflow-x-auto rounded-lg border">
          <table className="w-full border-collapse text-left">
            <caption className="sr-only">
              {track.label} for this genome, {rows.length}{' '}
              {rows.length === 1 ? 'feature' : 'features'}, ordered along the{' '}
              {COORDINATE_META[mode].label.toLowerCase()} axis.
            </caption>
            <thead>
              <tr className="border-line bg-panel-2 border-b">
                <th scope="col" className="text-faint px-3 py-2 font-mono text-nano font-medium">
                  Feature
                </th>
                <th scope="col" className="text-faint px-3 py-2 font-mono text-nano font-medium">
                  Detail
                </th>
                <th scope="col" className="text-faint px-3 py-2 font-mono text-nano font-medium">
                  Position
                </th>
                <th scope="col" className="text-faint px-3 py-2 font-mono text-nano font-medium">
                  Evidence
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((feature) => {
                const pos = feature.pos[mode];
                const isSelected = selected === feature.id;

                return (
                  <tr
                    key={feature.id}
                    aria-selected={isSelected}
                    className={cn(
                      'border-line-soft border-b last:border-b-0',
                      isSelected && 'bg-panel-3',
                      dimmed.has(feature.id) && 'opacity-45',
                    )}
                  >
                    <th scope="row" className="px-3 py-2 align-top font-normal">
                      <button
                        type="button"
                        onClick={() => onSelect(feature, track)}
                        // Several tracks repeat terse labels — four "A1" rows, a
                        // column of bare deltas — so the name has to carry the
                        // qualifier rather than leaving it to an adjacent span.
                        aria-label={
                          feature.sublabel
                            ? `${feature.label}, ${feature.sublabel}. Select this locus.`
                            : `${feature.label}. Select this locus.`
                        }
                        className="hover:text-acid text-left text-[13px] font-semibold transition-colors"
                      >
                        {feature.label}
                      </button>
                      {feature.sublabel && (
                        <span className="text-faint block font-mono text-nano">
                          {feature.sublabel}
                        </span>
                      )}
                    </th>
                    <td className="text-muted max-w-[46ch] px-3 py-2 align-top text-[13px] leading-snug">
                      {feature.detail}
                      {feature.href && (
                        <Link
                          href={feature.href}
                          className="text-cyan hover:text-acid ml-1 font-mono text-nano whitespace-nowrap transition-colors"
                        >
                          record →
                        </Link>
                      )}
                    </td>
                    <td className="text-text-soft px-3 py-2 align-top font-mono text-nano tabular-nums">
                      {pos === null ? (
                        <span className="text-faint">unplaced</span>
                      ) : (
                        `${Math.round(pos * 100)}%`
                      )}
                    </td>
                    <td className="px-3 py-2 align-top font-mono text-nano">
                      <span className="text-text-soft">{feature.tier}</span>
                      {feature.evidence.length > 0 && (
                        <span className="text-faint block">{feature.evidence.join(' ')}</span>
                      )}
                      {feature.confidence !== null && (
                        <span className="text-faint block tabular-nums">
                          {feature.confidence.toFixed(2)}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
