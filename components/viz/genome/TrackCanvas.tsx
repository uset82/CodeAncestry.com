'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import type { CoordinateMode, Feature, Track } from '@/lib/registry/genome';
import { COORDINATE_META, placeable } from '@/lib/registry/genome';
import {
  AXIS_HEIGHT,
  COLLAPSED_HEIGHT,
  GUTTER,
  TRACK_GAP,
  TRACK_ROW_HEIGHT,
  hitTest,
  paintAxis,
  paintTracks,
  readPalette,
  stack,
  toPos,
  toX,
  type LaidOutTrack,
  type Palette,
  type Viewport,
} from './paint';

/**
 * The canvas half of the genome browser.
 *
 * It owns the viewport and the row packing, and renders the track-name gutter
 * itself, because the gutter and the canvas have to agree on every track's
 * vertical position to the pixel. Everything above it — which tracks are shown,
 * what is selected — is the orchestrator's business.
 */

/**
 * Rows a track may stack into before features start sharing a row.
 *
 * Tuned per track by how crowded it gets: fitness carries several deltas per
 * mutation and needs the most, tests are one bar per run and need none.
 */
const MAX_ROWS: Record<string, number> = {
  genes: 5,
  mutations: 3,
  fitness: 5,
  dependencies: 3,
  agents: 2,
  releases: 2,
  children: 2,
  license: 2,
  security: 2,
};

const GUTTER_WIDTH = 168;
const MIN_EXTENT = 0.02;

/** One offscreen context, reused for text measurement during layout. */
let measurer: CanvasRenderingContext2D | null = null;
function measureContext(): CanvasRenderingContext2D | null {
  if (measurer) return measurer;
  if (typeof document === 'undefined') return null;
  measurer = document.createElement('canvas').getContext('2d');
  return measurer;
}

export type TrackCanvasProps = {
  tracks: Track[];
  mode: CoordinateMode;
  ticks: { pos: number; label: string; major: boolean }[];
  collapsed: Set<string>;
  dimmed: Set<string>;
  selected: string | null;
  onSelect: (feature: Feature | null, track: Track | null) => void;
  onToggleCollapse: (kind: string) => void;
};

export function TrackCanvas({
  tracks,
  mode,
  ticks,
  collapsed,
  dimmed,
  selected,
  onSelect,
  onToggleCollapse,
}: TrackCanvasProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const trackCanvas = useRef<HTMLCanvasElement>(null);
  const axisCanvas = useRef<HTMLCanvasElement>(null);

  const [width, setWidth] = useState(0);
  const [palette, setPalette] = useState<Palette | null>(null);
  const [view, setView] = useState({ offset: 0, extent: 1 });
  const [hovered, setHovered] = useState<string | null>(null);
  const [cursor, setCursor] = useState<{ track: number; feature: number }>({ track: 0, feature: 0 });
  const [grabbing, setGrabbing] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  const drag = useRef<{ x: number; offset: number } | null>(null);

  /* ------------------------------------------------------- measure the shell */
  useEffect(() => {
    const element = wrapRef.current;
    if (!element) return;

    setPalette(readPalette(element));

    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(Math.max(240, entry.contentRect.width - GUTTER_WIDTH));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const viewport: Viewport = useMemo(
    () => ({ offset: view.offset, extent: view.extent, width }),
    [view.offset, view.extent, width],
  );

  /* --------------------------------------------------------------- the layout */
  const layout = useMemo<LaidOutTrack[]>(() => {
    const ctx = measureContext();

    /**
     * How much horizontal space a feature wants. Both label lines count: the
     * sublabel is often the longer of the two, and ignoring it was what let
     * dense tracks overprint themselves.
     *
     * Measured with the same faces the paint layer draws with, so layout and
     * rendering agree.
     */
    const measure = (feature: Feature) => {
      if (!ctx) return 90;
      ctx.font = `600 11.5px ${palette?.['font-sans'] ?? 'system-ui'}`;
      const main = ctx.measureText(feature.label).width;
      ctx.font = `500 10px ${palette?.['font-mono'] ?? 'monospace'}`;
      const sub = feature.sublabel === '' ? 0 : ctx.measureText(feature.sublabel).width;
      return Math.max(main, sub) + 26;
    };

    // Stacked vertically, so each track's top depends on every track above it.
    return tracks.reduce<LaidOutTrack[]>((placed, track) => {
      const previous = placed.at(-1);
      const y = previous ? previous.y + previous.height + TRACK_GAP : 0;

      if (collapsed.has(track.kind)) {
        return [
          ...placed,
          {
            track,
            y,
            height: COLLAPSED_HEIGHT,
            collapsed: true,
            rows: new Map(),
            room: new Map(),
            rowCount: 1,
          },
        ];
      }

      const { rows, room, rowCount } = stack(
        track.features,
        mode,
        viewport,
        measure,
        MAX_ROWS[track.kind] ?? 1,
      );

      return [
        ...placed,
        {
          track,
          y,
          height: GUTTER + rowCount * TRACK_ROW_HEIGHT,
          collapsed: false,
          rows,
          room,
          rowCount,
        },
      ];
    }, []);
  }, [tracks, collapsed, mode, viewport, palette]);

  const totalHeight = layout.reduce((sum, entry) => sum + entry.height + TRACK_GAP, 0);

  const paintState = useMemo(
    () => ({
      mode,
      view: viewport,
      layout,
      palette: palette ?? {},
      selected,
      hovered,
      dimmed,
      height: totalHeight,
    }),
    [mode, viewport, layout, palette, selected, hovered, dimmed, totalHeight],
  );

  /* ---------------------------------------------------------------- painting */
  useEffect(() => {
    const canvas = trackCanvas.current;
    if (!canvas || !palette || width === 0) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = totalHeight * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${totalHeight}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    paintTracks(ctx, paintState);
  }, [paintState, palette, width, totalHeight]);

  useEffect(() => {
    const canvas = axisCanvas.current;
    if (!canvas || !palette || width === 0) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = AXIS_HEIGHT * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${AXIS_HEIGHT}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    paintAxis(ctx, ticks, { view: viewport, palette });
  }, [ticks, viewport, palette, width]);

  /* ------------------------------------------------------------ zoom and pan */
  const clampView = useCallback((offset: number, extent: number) => {
    const next = Math.min(1, Math.max(MIN_EXTENT, extent));
    return { extent: next, offset: Math.min(1 - next, Math.max(0, offset)) };
  }, []);

  const zoomAt = useCallback(
    (factor: number, anchor = 0.5) => {
      setView((prev) => {
        const focus = prev.offset + prev.extent * anchor;
        const extent = Math.min(1, Math.max(MIN_EXTENT, prev.extent * factor));
        return clampView(focus - extent * anchor, extent);
      });
    },
    [clampView],
  );

  const pan = useCallback(
    (fraction: number) => {
      setView((prev) => clampView(prev.offset + prev.extent * fraction, prev.extent));
    },
    [clampView],
  );

  /* -------------------------------------------------------- pointer handling */
  const localPoint = (event: React.PointerEvent | React.MouseEvent) => {
    const canvas = trackCanvas.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const point = localPoint(event);
    if (!point) return;

    const hit = hitTest(point.x, point.y, paintState);
    if (hit) {
      onSelect(hit.feature, hit.track);
      return;
    }

    drag.current = { x: event.clientX, offset: view.offset };
    setGrabbing(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (drag.current) {
      const dx = event.clientX - drag.current.x;
      setView((prev) => clampView(drag.current!.offset - (dx / width) * prev.extent, prev.extent));
      return;
    }

    const point = localPoint(event);
    if (!point) return;
    const hit = hitTest(point.x, point.y, paintState);
    setHovered(hit?.feature.id ?? null);
  };

  const endDrag = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drag.current) return;
    drag.current = null;
    setGrabbing(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  /**
   * Wheel zoom is bound natively so it can be non-passive; React's onWheel is
   * passive and cannot preventDefault, which would let the page scroll away
   * under the cursor.
   */
  useEffect(() => {
    const canvas = trackCanvas.current;
    if (!canvas || width === 0) return;

    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && Math.abs(event.deltaY) < Math.abs(event.deltaX)) return;
      event.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const anchor = (event.clientX - rect.left) / rect.width;
      zoomAt(event.deltaY > 0 ? 1.16 : 0.86, anchor);
    };

    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, [zoomAt, width]);

  /* ------------------------------------------------------- keyboard parity */

  /** Features of a track that exist under the current mode, in axis order. */
  const placedFeatures = useCallback(
    (track: Track) =>
      placeable(track, mode).placed.slice().sort((a, b) => (a.pos[mode] ?? 0) - (b.pos[mode] ?? 0)),
    [mode],
  );

  const focusFeature = useCallback(
    (trackIndex: number, featureIndex: number) => {
      const entry = layout[trackIndex];
      if (!entry) return;

      const features = placedFeatures(entry.track);
      if (features.length === 0) {
        setCursor({ track: trackIndex, feature: 0 });
        setAnnouncement(
          `${entry.track.label}: nothing to place on the ${COORDINATE_META[mode].label.toLowerCase()} axis.`,
        );
        onSelect(null, null);
        return;
      }

      const index = Math.min(features.length - 1, Math.max(0, featureIndex));
      const feature = features[index]!;
      setCursor({ track: trackIndex, feature: index });
      onSelect(feature, entry.track);

      // Keep the cursor in view, panning only when it has left the window.
      const pos = feature.pos[mode] ?? 0;
      setView((prev) => {
        if (pos >= prev.offset + prev.extent * 0.06 && pos <= prev.offset + prev.extent * 0.94) {
          return prev;
        }
        return clampView(pos - prev.extent / 2, prev.extent);
      });

      setAnnouncement(
        `${entry.track.label}, ${index + 1} of ${features.length}. ${feature.detail}`,
      );
    },
    [layout, placedFeatures, mode, onSelect, clampView],
  );

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const { key, shiftKey } = event;
    const trackCount = layout.length;
    if (trackCount === 0) return;

    const step = (delta: number) => {
      event.preventDefault();
      focusFeature(cursor.track, cursor.feature + delta);
    };

    switch (key) {
      case 'ArrowRight':
        if (shiftKey) {
          event.preventDefault();
          pan(0.12);
        } else step(1);
        return;
      case 'ArrowLeft':
        if (shiftKey) {
          event.preventDefault();
          pan(-0.12);
        } else step(-1);
        return;
      case 'ArrowDown':
        event.preventDefault();
        focusFeature(Math.min(trackCount - 1, cursor.track + 1), 0);
        return;
      case 'ArrowUp':
        event.preventDefault();
        focusFeature(Math.max(0, cursor.track - 1), 0);
        return;
      case 'Home':
        event.preventDefault();
        focusFeature(cursor.track, 0);
        return;
      case 'End': {
        event.preventDefault();
        const entry = layout[cursor.track];
        if (entry) focusFeature(cursor.track, placedFeatures(entry.track).length - 1);
        return;
      }
      case '+':
      case '=':
        event.preventDefault();
        zoomAt(0.7);
        return;
      case '-':
      case '_':
        event.preventDefault();
        zoomAt(1.42);
        return;
      case '0':
        event.preventDefault();
        setView({ offset: 0, extent: 1 });
        setAnnouncement('Viewport reset to the full axis.');
        return;
      case 'Escape':
        onSelect(null, null);
        setAnnouncement('Selection cleared.');
        return;
      default:
    }
  };

  const zoomPercent = Math.round((1 / view.extent) * 100);
  const windowLabel = `${Math.round(view.offset * 100)}–${Math.round(
    (view.offset + view.extent) * 100,
  )}% of the ${COORDINATE_META[mode].axisLabel.toLowerCase()}`;

  return (
    <div className="instrument recessed border-line bg-panel border">
      {/* ------------------------------------------------------- view controls */}
      <div className="border-line/70 flex flex-wrap items-center justify-between gap-3 border-b px-3 py-2">
        <p className="text-faint font-mono text-nano">
          {windowLabel} · zoom {zoomPercent}%
        </p>

        <div className="flex items-center gap-1.5">
          <ViewButton onClick={() => pan(-0.15)} label="Pan left">
            ←
          </ViewButton>
          <ViewButton onClick={() => zoomAt(1.42)} label="Zoom out">
            −
          </ViewButton>
          <ViewButton onClick={() => zoomAt(0.7)} label="Zoom in">
            +
          </ViewButton>
          <ViewButton onClick={() => pan(0.15)} label="Pan right">
            →
          </ViewButton>
          <button
            type="button"
            onClick={() => setView({ offset: 0, extent: 1 })}
            className="border-line text-text-soft hover:border-line-strong hover:text-text ml-1 rounded border px-2 py-1 font-mono text-nano transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------ the axis */}
      <div ref={wrapRef} className="flex">
        <div
          style={{ width: GUTTER_WIDTH }}
          className="border-line/70 text-faint shrink-0 border-r px-3 font-mono text-nano"
        >
          <div style={{ height: AXIS_HEIGHT }} className="flex items-center">
            {COORDINATE_META[mode].axisLabel}
          </div>
        </div>
        <canvas ref={axisCanvas} aria-hidden="true" className="block" />
      </div>

      {/* --------------------------------------------------- gutter and tracks */}
      <div className="flex">
        <div style={{ width: GUTTER_WIDTH }} className="border-line/70 relative shrink-0 border-r">
          {layout.map((entry) => {
            const { unplaced } = placeable(entry.track, mode);
            return (
              <div
                key={entry.track.kind}
                style={{ top: entry.y, height: entry.height }}
                className="absolute inset-x-0 flex flex-col justify-center px-3"
              >
                <button
                  type="button"
                  onClick={() => onToggleCollapse(entry.track.kind)}
                  aria-expanded={!entry.collapsed}
                  className="text-text-soft hover:text-text flex items-start gap-1.5 text-left text-[12.5px] leading-tight font-medium transition-colors"
                >
                  <span aria-hidden="true" className="text-faint mt-px font-mono text-nano">
                    {entry.collapsed ? '▸' : '▾'}
                  </span>
                  <span className="min-w-0">
                    {entry.track.label}
                    {/* A collapsed row is one line tall, so its count goes inline
                        rather than disappearing along with the track's detail. */}
                    <span
                      className={
                        entry.collapsed
                          ? 'text-faint ml-1.5 font-mono text-nano'
                          : 'text-faint block font-mono text-nano'
                      }
                    >
                      {entry.track.features.length === 0
                        ? 'none recorded'
                        : unplaced === 0
                          ? `${entry.track.features.length}`
                          : `${entry.track.features.length - unplaced} of ${entry.track.features.length}`}
                    </span>
                  </span>
                </button>
              </div>
            );
          })}
          <div style={{ height: totalHeight }} aria-hidden="true" />
        </div>

        <div
          role="application"
          tabIndex={0}
          aria-label={`Genome browser tracks on the ${COORDINATE_META[
            mode
          ].label.toLowerCase()} axis. Arrow left and right move between features, arrow up and down between tracks, shift with arrows pans, plus and minus zoom, zero resets.`}
          onKeyDown={handleKeyDown}
          className="focus-visible:outline-acid min-w-0 flex-1 focus-visible:outline-2 focus-visible:-outline-offset-2"
        >
          <canvas
            ref={trackCanvas}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onPointerLeave={() => setHovered(null)}
            className={cn('block touch-pan-y', grabbing ? 'cursor-grabbing' : 'cursor-crosshair')}
          />
        </div>
      </div>

      {/* --------------------------------------------------------------- hints */}
      <div className="border-line/70 text-faint flex flex-wrap items-center gap-x-4 gap-y-1 border-t px-3 py-2 text-nano">
        <span>Drag to pan · wheel to zoom · click a feature to inspect it</span>
        <span className="font-mono">
          ← → feature · ↑ ↓ track · ⇧← ⇧→ pan · + − zoom · 0 reset · Esc clear
        </span>
      </div>

      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </div>
  );
}

function ViewButton({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="border-line text-text-soft hover:border-line-strong hover:text-text size-7 rounded border font-mono text-[13px] leading-none transition-colors"
    >
      <span aria-hidden="true">{children}</span>
    </button>
  );
}

/** Exported for the orchestrator's "centre on this feature" affordance. */
export { toPos, toX };
