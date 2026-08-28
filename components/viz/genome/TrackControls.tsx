'use client';

import { cn } from '@/lib/cn';
import type { CoordinateMode, Track } from '@/lib/registry/genome';
import { placeable } from '@/lib/registry/genome';

/**
 * Track controls, in the spirit of a UCSC track configuration panel: the reader
 * decides which evidence is on screen and in what order.
 *
 * Reordering is exposed as up/down buttons rather than drag handles. Dragging is
 * the nicer gesture but it is unreachable by keyboard, and this control has to
 * work for everyone.
 */

export function TrackControls({
  tracks,
  order,
  hidden,
  collapsed,
  mode,
  onToggleHidden,
  onToggleCollapsed,
  onMove,
  onReset,
}: {
  tracks: Track[];
  order: string[];
  hidden: Set<string>;
  collapsed: Set<string>;
  mode: CoordinateMode;
  onToggleHidden: (kind: string) => void;
  onToggleCollapsed: (kind: string) => void;
  onMove: (kind: string, direction: -1 | 1) => void;
  onReset: () => void;
}) {
  const byKind = new Map(tracks.map((track) => [track.kind as string, track]));
  const rows = order.flatMap((kind) => {
    const track = byKind.get(kind);
    return track ? [track] : [];
  });

  const visibleCount = rows.length - hidden.size;

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <p className="text-faint font-mono text-nano">
          {visibleCount} of {rows.length} tracks shown
        </p>
        <button
          type="button"
          onClick={onReset}
          className="text-faint hover:text-text-soft font-mono text-nano underline decoration-dotted underline-offset-2 transition-colors"
        >
          Reset
        </button>
      </div>

      <ul className="space-y-1">
        {rows.map((track, index) => {
          const isHidden = hidden.has(track.kind);
          const { placed, unplaced } = placeable(track, mode);

          return (
            <li
              key={track.kind}
              className={cn(
                'border-line/70 bg-panel-2/40 rounded border px-2 py-1.5',
                isHidden && 'opacity-55',
              )}
            >
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`track-${track.kind}`}
                  checked={!isHidden}
                  onChange={() => onToggleHidden(track.kind)}
                  className="accent-acid size-3.5 shrink-0"
                />
                <label
                  htmlFor={`track-${track.kind}`}
                  className="text-text-soft min-w-0 flex-1 cursor-pointer truncate text-[13px]"
                >
                  {track.label}
                </label>

                <span className="text-faint shrink-0 font-mono text-nano tabular-nums">
                  {track.features.length === 0
                    ? '—'
                    : unplaced === 0
                      ? placed.length
                      : `${placed.length}/${track.features.length}`}
                </span>

                <div className="flex shrink-0 items-center gap-0.5">
                  <IconButton
                    onClick={() => onToggleCollapsed(track.kind)}
                    disabled={isHidden}
                    label={
                      collapsed.has(track.kind)
                        ? `Expand the ${track.label} track`
                        : `Collapse the ${track.label} track to a density strip`
                    }
                  >
                    {collapsed.has(track.kind) ? '▸' : '▾'}
                  </IconButton>
                  <IconButton
                    onClick={() => onMove(track.kind, -1)}
                    disabled={index === 0}
                    label={`Move the ${track.label} track up`}
                  >
                    ↑
                  </IconButton>
                  <IconButton
                    onClick={() => onMove(track.kind, 1)}
                    disabled={index === rows.length - 1}
                    label={`Move the ${track.label} track down`}
                  >
                    ↓
                  </IconButton>
                </div>
              </div>

              {unplaced > 0 && !isHidden && (
                <p className="text-faint mt-1 pl-[22px] text-nano leading-snug">
                  {unplaced} {unplaced === 1 ? 'feature has' : 'features have'} no position on this
                  axis.
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function IconButton({
  onClick,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="border-line/0 text-faint hover:border-line hover:text-text disabled:hover:border-line/0 size-5 rounded border font-mono text-[11px] leading-none transition-colors disabled:opacity-30 disabled:hover:text-faint"
    >
      <span aria-hidden="true">{children}</span>
    </button>
  );
}
