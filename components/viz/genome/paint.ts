import type { CoordinateMode, Feature, Track, TrackKind } from '@/lib/registry/genome';

/**
 * The drawing layer for the genome browser.
 *
 * Kept separate from the React component so the canvas work is plain functions
 * over a context: easier to reason about, and the component only has to own
 * state and events.
 *
 * Two rules hold throughout. Colour never carries meaning alone — every variant
 * also differs by glyph, fill pattern or outline — and nothing is drawn outside
 * the visible window, so a track with thousands of features costs the same as
 * one with ten.
 */

export const TRACK_ROW_HEIGHT = 34;
export const TRACK_GAP = 10;
export const COLLAPSED_HEIGHT = 12;
export const AXIS_HEIGHT = 30;
export const GUTTER = 8;

/**
 * Resolved once per paint so the canvas follows the live theme instead of
 * hardcoding hex. Font families are read the same way, because `ctx.font` is
 * not CSS and will not resolve a `var()` — it silently falls back instead.
 */
export type Palette = Record<string, string>;

const TOKENS = [
  'void',
  'panel',
  'panel-2',
  'panel-3',
  'line',
  'line-soft',
  'line-strong',
  'text',
  'text-soft',
  'muted',
  'faint',
  'acid',
  'acid-dim',
  'cyan',
  'cyan-dim',
  'violet',
  'violet-dim',
  'amber',
  'amber-dim',
  'rose',
  'rose-dim',
] as const;

export function readPalette(element: HTMLElement): Palette {
  const styles = getComputedStyle(element);
  const palette: Palette = {};
  for (const token of TOKENS) {
    palette[token] = styles.getPropertyValue(`--color-${token}`).trim() || '#888';
  }

  palette['font-sans'] = styles.fontFamily || 'system-ui, sans-serif';
  palette['font-mono'] =
    styles.getPropertyValue('--font-mono').trim() || 'ui-monospace, monospace';

  return palette;
}

/** Canvas font shorthand for the theme's sans and mono faces. */
const sans = (palette: Palette, size: number, weight = 600) =>
  `${weight} ${size}px ${palette['font-sans'] ?? 'system-ui'}`;

const mono = (palette: Palette, size: number, weight = 500) =>
  `${weight} ${size}px ${palette['font-mono'] ?? 'monospace'}`;

/**
 * Colour per feature variant. Variant names are unique across tracks, so one
 * map serves all of them. Always paired with a shape or hatch below, never the
 * sole carrier of meaning.
 */
function colorFor(variant: string, palette: Palette): string {
  const map: Record<string, string> = {
    // genes — inheritance mode, matching the Code Painting strip
    native: palette.acid!,
    inherited: palette.cyan!,
    mutated: palette.violet!,
    local: palette.amber!,
    transferred: palette.rose!,
    // mutations — the decision
    adopted: palette.acid!,
    declined: palette.rose!,
    authored: palette.violet!,
    offered: palette.amber!,
    // fitness — direction
    better: palette.acid!,
    worse: palette.rose!,
    neutral: palette.muted!,
    // agent actions
    analyze: palette.cyan!,
    edit: palette.violet!,
    test: palette.acid!,
    propose: palette.amber!,
    review: palette.text!,
    // tests
    green: palette.acid!,
    amber: palette.amber!,
    // security
    resolved: palette.acid!,
    low: palette.cyan!,
    moderate: palette.amber!,
    high: palette.rose!,
    critical: palette.rose!,
    // dependencies
    none: palette.cyan!,
    open: palette.rose!,
    // license, releases, children
    project: palette.cyan!,
    dependency: palette.violet!,
    verified: palette.acid!,
    unverified: palette.faint!,
    direct: palette.cyan!,
    hybrid: palette.violet!,
  };

  return map[variant] ?? palette['text-soft']!;
}

/**
 * Glyph per marker variant. This is the non-colour channel: a reader who cannot
 * distinguish the hues still sees a different shape for adopted and declined.
 */
type Glyph = 'up' | 'down' | 'diamond' | 'square' | 'circle' | 'cross' | 'bar';

function glyphFor(kind: TrackKind, variant: string): Glyph {
  if (kind === 'mutations') {
    if (variant === 'adopted') return 'up';
    if (variant === 'declined') return 'cross';
    if (variant === 'authored') return 'diamond';
    return 'circle';
  }
  if (kind === 'fitness') {
    if (variant === 'better') return 'up';
    if (variant === 'worse') return 'down';
    return 'bar';
  }
  if (kind === 'agents') return variant === 'review' ? 'square' : 'circle';
  if (kind === 'dependencies') return variant === 'none' ? 'circle' : 'cross';
  if (kind === 'releases') return variant === 'verified' ? 'diamond' : 'circle';
  if (kind === 'children') return variant === 'hybrid' ? 'diamond' : 'up';
  return 'circle';
}

/** Hatch pattern per gene inheritance mode, echoing the Code Painting strip. */
function hatchFor(variant: string): { angle: number; gap: number } | null {
  if (variant === 'native') return { angle: 90, gap: 6 };
  if (variant === 'mutated') return { angle: 45, gap: 7 };
  if (variant === 'local') return { angle: -45, gap: 6 };
  if (variant === 'transferred') return { angle: 90, gap: 4 };
  return null;
}

/* ==========================================================================
   Geometry
   ========================================================================== */

export type Viewport = {
  /** Left edge of the visible window in axis units, 0–1. */
  offset: number;
  /** Fraction of the axis visible. 1 is fully zoomed out. */
  extent: number;
  width: number;
};

export type LaidOutTrack = {
  track: Track;
  /** Top edge in canvas pixels. */
  y: number;
  height: number;
  collapsed: boolean;
  /** Row index per feature id, for stacking overlapping features. */
  rows: Map<string, number>;
  /** Resolved label placement per feature, computed so no two labels overlap. */
  room: Map<string, LabelSlot>;
  rowCount: number;
};

export type LabelSlot = {
  /** Clear pixels to the right of the feature's anchor. */
  right: number;
  /** Which side the label is drawn on, and how much width it may use. */
  dir: 'left' | 'right';
  width: number;
};

/** Axis unit to canvas pixel. */
export const toX = (pos: number, view: Viewport) => ((pos - view.offset) / view.extent) * view.width;

/** Canvas pixel back to axis unit, for hit testing and click-to-centre. */
export const toPos = (x: number, view: Viewport) => view.offset + (x / view.width) * view.extent;

/**
 * Assign features to rows so labels do not collide, and record how much clear
 * space each one has to draw into.
 *
 * Greedy left-to-right: a feature takes the first row whose last occupied pixel
 * is clear, otherwise it starts a new row up to the track's limit. Both passes
 * run per viewport, because what overlaps depends on zoom — this is what lets a
 * dense track become readable as the reader zooms in rather than staying a smear.
 */
export function stack(
  features: Feature[],
  mode: CoordinateMode,
  view: Viewport,
  measure: (feature: Feature) => number,
  maxRows: number,
): {
  rows: Map<string, number>;
  room: Map<string, LabelSlot>;
  rowCount: number;
} {
  const rows = new Map<string, number>();
  const room = new Map<string, LabelSlot>();
  const rightEdge: number[] = [];
  /** Features already placed on each row, in axis order. */
  const occupants: Feature[][] = [];

  const ordered = features
    .filter((feature) => feature.pos[mode] !== null)
    .slice()
    .sort((a, b) => (a.pos[mode] ?? 0) - (b.pos[mode] ?? 0));

  for (const feature of ordered) {
    const x = toX(feature.pos[mode] ?? 0, view);
    const width = Math.max(
      measure(feature),
      toX((feature.pos[mode] ?? 0) + feature.span[mode], view) - x,
    );

    let row = rightEdge.findIndex((edge) => edge <= x - 6);
    if (row === -1) {
      if (rightEdge.length < maxRows) {
        row = rightEdge.length;
      } else {
        // Out of rows. Land on whichever is least crowded here, so overflow
        // spreads across the track instead of piling onto the first row.
        row = rightEdge.reduce(
          (best, edge, index) => (edge < (rightEdge[best] ?? Infinity) ? index : best),
          0,
        );
      }
    }

    rightEdge[row] = x + width;
    rows.set(feature.id, row);
    (occupants[row] ??= []).push(feature);
  }

  /*
   * Second pass: resolve where each label goes.
   *
   * Labels default to the right of their anchor. A feature whose right side is
   * too cramped to say anything tries the left instead — but only into space the
   * previous label did not already consume, which is why this has to happen here
   * rather than at paint time, where that is unknowable.
   */
  for (const row of occupants) {
    if (!row) continue;

    // How far right each feature's label actually reaches, in row order.
    const consumed: number[] = [];

    row.forEach((feature, index) => {
      const x = toX(feature.pos[mode] ?? 0, view);
      const next = row[index + 1];
      const right = Math.max(0, (next ? toX(next.pos[mode] ?? 0, view) : view.width) - x - 8);
      const wanted = measure(feature);

      if (right >= 24) {
        consumed[index] = x + Math.min(wanted, right);
        room.set(feature.id, { right, dir: 'right', width: right });
        return;
      }

      const previousEnd = index === 0 ? 0 : (consumed[index - 1] ?? 0);
      const left = Math.max(0, x - previousEnd - 10);

      consumed[index] = x;
      room.set(feature.id, {
        right,
        dir: left > right ? 'left' : 'right',
        width: Math.max(left, right),
      });
    });
  }

  return { rows, room, rowCount: Math.max(1, rightEdge.length) };
}

/* ==========================================================================
   Painting
   ========================================================================== */

function hatch(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  spec: { angle: number; gap: number },
) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.strokeStyle = 'rgba(0,0,0,0.34)';
  ctx.lineWidth = 1;

  if (spec.angle === 90) {
    for (let sx = x; sx <= x + w; sx += spec.gap) {
      ctx.beginPath();
      ctx.moveTo(sx, y);
      ctx.lineTo(sx, y + h);
      ctx.stroke();
    }
  } else {
    const dir = spec.angle > 0 ? 1 : -1;
    for (let sx = x - h; sx <= x + w + h; sx += spec.gap) {
      ctx.beginPath();
      ctx.moveTo(sx, dir > 0 ? y : y + h);
      ctx.lineTo(sx + h * dir, dir > 0 ? y + h : y);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function marker(
  ctx: CanvasRenderingContext2D,
  glyph: Glyph,
  x: number,
  y: number,
  size: number,
) {
  const h = size / 2;
  ctx.beginPath();
  switch (glyph) {
    case 'up':
      ctx.moveTo(x, y - h);
      ctx.lineTo(x + h, y + h);
      ctx.lineTo(x - h, y + h);
      ctx.closePath();
      break;
    case 'down':
      ctx.moveTo(x, y + h);
      ctx.lineTo(x + h, y - h);
      ctx.lineTo(x - h, y - h);
      ctx.closePath();
      break;
    case 'diamond':
      ctx.moveTo(x, y - h);
      ctx.lineTo(x + h, y);
      ctx.lineTo(x, y + h);
      ctx.lineTo(x - h, y);
      ctx.closePath();
      break;
    case 'square':
      ctx.rect(x - h, y - h, size, size);
      break;
    case 'bar':
      ctx.rect(x - h, y - 1.5, size, 3);
      break;
    case 'cross':
      ctx.moveTo(x - h, y - h);
      ctx.lineTo(x + h, y + h);
      ctx.moveTo(x + h, y - h);
      ctx.lineTo(x - h, y + h);
      break;
    default:
      ctx.arc(x, y, h, 0, Math.PI * 2);
  }
}

export type PaintState = {
  mode: CoordinateMode;
  view: Viewport;
  layout: LaidOutTrack[];
  palette: Palette;
  selected: string | null;
  hovered: string | null;
  /** Feature ids that fail the current evidence threshold. */
  dimmed: Set<string>;
  height: number;
};

export function paintTracks(ctx: CanvasRenderingContext2D, state: PaintState) {
  const { view, mode } = state;

  ctx.clearRect(0, 0, view.width, state.height);

  for (const entry of state.layout) {
    paintTrackBackground(ctx, entry, state);
    if (entry.collapsed) {
      paintCollapsed(ctx, entry, state);
      continue;
    }

    for (const feature of entry.track.features) {
      const pos = feature.pos[mode];
      if (pos === null) continue;

      const x = toX(pos, view);
      const w = toX(pos + feature.span[mode], view) - x;

      // Viewport culling: skip anything that cannot be seen.
      if (x + Math.max(w, 90) < -20 || x > view.width + 20) continue;

      paintFeature(ctx, feature, entry, state, x, w);
    }
  }
}

function paintTrackBackground(ctx: CanvasRenderingContext2D, entry: LaidOutTrack, state: PaintState) {
  ctx.fillStyle = state.palette.panel!;
  ctx.globalAlpha = 0.42;
  ctx.fillRect(0, entry.y, state.view.width, entry.height);
  ctx.globalAlpha = 1;

  ctx.strokeStyle = state.palette['line-soft']!;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, entry.y + entry.height + TRACK_GAP / 2);
  ctx.lineTo(state.view.width, entry.y + entry.height + TRACK_GAP / 2);
  ctx.stroke();
}

/** A collapsed track keeps its shape: a density strip, so nothing disappears. */
function paintCollapsed(ctx: CanvasRenderingContext2D, entry: LaidOutTrack, state: PaintState) {
  const { mode, view, palette } = state;

  for (const feature of entry.track.features) {
    const pos = feature.pos[mode];
    if (pos === null) continue;

    const x = toX(pos, view);
    const w = Math.max(2, toX(pos + feature.span[mode], view) - x);
    if (x + w < 0 || x > view.width) continue;

    ctx.fillStyle = colorFor(feature.variant, palette);
    ctx.globalAlpha = state.dimmed.has(feature.id) ? 0.18 : 0.7;
    ctx.fillRect(x, entry.y + 3, w, entry.height - 6);
    ctx.globalAlpha = 1;
  }
}

function paintFeature(
  ctx: CanvasRenderingContext2D,
  feature: Feature,
  entry: LaidOutTrack,
  state: PaintState,
  x: number,
  w: number,
) {
  const { palette, selected, hovered } = state;
  const kind = entry.track.kind;
  const color = colorFor(feature.variant, palette);
  const row = entry.rows.get(feature.id) ?? 0;
  const rowY = entry.y + GUTTER / 2 + row * TRACK_ROW_HEIGHT;
  const isActive = selected === feature.id || hovered === feature.id;
  const room = entry.room.get(feature.id) ?? { right: 0, dir: 'right' as const, width: 0 };

  /*
   * Two kinds of fading, deliberately different strengths. Failing the evidence
   * threshold is a judgement the reader made about the data and fades hard;
   * being merely unselected is not, and stays legible as context.
   */
  const belowThreshold = state.dimmed.has(feature.id);
  const isDim = belowThreshold || (selected !== null && !isActive);
  const dimAlpha = belowThreshold ? 0.22 : 0.5;

  ctx.globalAlpha = isDim ? dimAlpha : 1;

  if (entry.track.render === 'band' || entry.track.render === 'span') {
    const width = Math.max(3, w);
    const h = TRACK_ROW_HEIGHT - GUTTER;

    ctx.fillStyle = color;
    ctx.globalAlpha = isDim ? dimAlpha * 0.6 : 0.32;
    ctx.fillRect(x, rowY, width, h);
    ctx.globalAlpha = isDim ? dimAlpha : 1;

    ctx.strokeStyle = color;
    ctx.lineWidth = isActive ? 2 : 1;
    ctx.strokeRect(x + 0.5, rowY + 0.5, width - 1, h - 1);

    // Hatching a band narrower than its own pattern turns a row of them into a
    // barcode, so below that width the tint carries the mode on its own.
    const pattern = hatchFor(feature.variant);
    if (pattern && width >= 16) hatch(ctx, x, rowY, width, h, pattern);

    /*
     * A band's label prefers to sit inside the band, but a band narrower than
     * its own name may spill into the clear space beside it — under the semantic
     * and repository axes every slot is the same narrow width, and truncating
     * ten capabilities to "Sa…" and "Ad…" says nothing. The row's clear space is
     * still the hard limit, since bands on one row can overlap.
     */
    const inside = width - 12;
    const available = Math.min(room.right, Math.max(inside, room.right - 6));
    label(ctx, feature, state, x + 6, rowY + h / 2, available, color, isDim);
  } else if (entry.track.render === 'area') {
    const h = TRACK_ROW_HEIGHT - GUTTER;
    // A hair of headroom so the label above a full bar is not clipped.
    const barHeight = Math.max(2, (feature.value ?? 0) * (h - 12));

    ctx.fillStyle = color;
    ctx.globalAlpha = isDim ? dimAlpha * 0.7 : 0.55;
    ctx.fillRect(x - 9, rowY + h - barHeight, 18, barHeight);
    ctx.globalAlpha = isDim ? dimAlpha : 1;

    ctx.strokeStyle = color;
    ctx.lineWidth = isActive ? 2 : 1;
    ctx.strokeRect(x - 9.5, rowY + h - barHeight + 0.5, 19, barHeight - 1);

    ctx.fillStyle = isDim ? palette.faint! : palette['text-soft']!;
    ctx.font = mono(palette, 10, 600);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(feature.label, x, rowY + h - barHeight - 2);
    ctx.textAlign = 'left';
  } else {
    const size = isActive ? 13 : 10;
    const cy = rowY + (TRACK_ROW_HEIGHT - GUTTER) / 2;
    const glyph = glyphFor(kind, feature.variant);

    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = isActive ? 2.4 : 1.8;

    marker(ctx, glyph, x, cy, size);
    if (glyph === 'cross') ctx.stroke();
    else {
      ctx.globalAlpha = isDim ? dimAlpha * 0.7 : 0.85;
      ctx.fill();
      ctx.globalAlpha = isDim ? dimAlpha : 1;
      ctx.stroke();
    }

    // Direction was resolved during stacking, where neighbouring labels' claims
    // are known. Here we only honour it.
    const offset = size / 2 + 5;
    const available = room.width - offset;

    if (room.dir === 'right') {
      label(ctx, feature, state, x + offset, cy, available, color, isDim);
    } else {
      label(ctx, feature, state, x - offset, cy, available, color, isDim, 'right');
    }
  }

  ctx.globalAlpha = 1;
}

/**
 * Draws the label, and the sublabel on a second line when there is room.
 *
 * `available` is the measured clear space to the next feature, so a crowded
 * track drops its labels and keeps its glyphs rather than overprinting. Zooming
 * in earns the text back — semantic zoom, driven by real geometry.
 */
function label(
  ctx: CanvasRenderingContext2D,
  feature: Feature,
  state: PaintState,
  x: number,
  cy: number,
  available: number,
  color: string,
  isDim: boolean,
  align: 'left' | 'right' = 'left',
) {
  if (available < 24) return;

  const isActive = state.selected === feature.id || state.hovered === feature.id;
  const showSub = feature.sublabel !== '' && available >= 34;

  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = isDim ? state.palette.faint! : isActive ? state.palette.text! : color;
  ctx.font = sans(state.palette, 11.5);
  ctx.fillText(fit(ctx, feature.label, available), x, showSub ? cy - 6 : cy);

  if (showSub) {
    ctx.font = mono(state.palette, 10);
    ctx.fillStyle = isDim ? state.palette.faint! : state.palette.muted!;
    ctx.fillText(fit(ctx, feature.sublabel, available), x, cy + 7);
  }

  ctx.textAlign = 'left';
}

/** Truncate to the available width, with an ellipsis when it does not fit. */
function fit(ctx: CanvasRenderingContext2D, text: string, available: number): string {
  if (ctx.measureText(text).width <= available) return text;

  let cut = text.length;
  while (cut > 1 && ctx.measureText(`${text.slice(0, cut)}…`).width > available) cut -= 1;
  return `${text.slice(0, cut)}…`;
}

/**
 * Hit test, searching top to bottom and preferring markers, which are smaller
 * and therefore harder to hit than the bands they often sit near.
 */
export function hitTest(
  x: number,
  y: number,
  state: PaintState,
): { feature: Feature; track: Track } | null {
  const { mode, view } = state;

  for (const entry of state.layout) {
    if (y < entry.y || y > entry.y + entry.height) continue;
    if (entry.collapsed) {
      const pos = toPos(x, view);
      const hit = entry.track.features.find((feature) => {
        const at = feature.pos[mode];
        if (at === null) return false;
        return pos >= at - view.extent * 0.01 && pos <= at + feature.span[mode] + view.extent * 0.01;
      });
      return hit ? { feature: hit, track: entry.track } : null;
    }

    const row = Math.floor((y - entry.y - GUTTER / 2) / TRACK_ROW_HEIGHT);

    const candidates = entry.track.features.filter((feature) => {
      if (feature.pos[mode] === null) return false;
      if ((entry.rows.get(feature.id) ?? 0) !== row) return false;

      const fx = toX(feature.pos[mode] ?? 0, view);
      const fw = toX((feature.pos[mode] ?? 0) + feature.span[mode], view) - fx;

      return entry.track.render === 'marker' || entry.track.render === 'area'
        ? Math.abs(x - fx) <= 11
        : x >= fx - 2 && x <= fx + Math.max(3, fw) + 2;
    });

    const hit = candidates[0];
    if (hit) return { feature: hit, track: entry.track };
  }

  return null;
}

/* ==========================================================================
   Axis
   ========================================================================== */

export function paintAxis(
  ctx: CanvasRenderingContext2D,
  ticks: { pos: number; label: string; major: boolean }[],
  state: Pick<PaintState, 'view' | 'palette'>,
) {
  const { view, palette } = state;

  ctx.clearRect(0, 0, view.width, AXIS_HEIGHT);

  ctx.strokeStyle = palette.line!;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, AXIS_HEIGHT - 0.5);
  ctx.lineTo(view.width, AXIS_HEIGHT - 0.5);
  ctx.stroke();

  /*
   * Labels occupy the upper band, tick marks the lower one, so a label never
   * sits on its own rule. A label is nudged inwards when centring it on the
   * tick would push it past either edge — at the extremes of the axis the
   * alternative is a truncated word, which reads as a different path.
   */
  const LABEL_Y = 9;
  ctx.textBaseline = 'middle';
  let lastRight = -Infinity;

  for (const tick of ticks) {
    const x = toX(tick.pos, view);
    if (x < -60 || x > view.width + 60) continue;

    ctx.strokeStyle = tick.major ? palette['line-strong']! : palette.line!;
    ctx.beginPath();
    ctx.moveTo(x, tick.major ? 18 : 23);
    ctx.lineTo(x, AXIS_HEIGHT - 1);
    ctx.stroke();

    ctx.font = tick.major ? mono(palette, 10.5, 600) : mono(palette, 10);
    const width = ctx.measureText(tick.label).width;
    const half = width / 2;
    const cx = Math.min(view.width - half - 2, Math.max(half + 2, x));

    // Drop labels that would collide rather than overlapping them.
    if (cx - half < lastRight + 6) continue;

    ctx.fillStyle = tick.major ? palette['text-soft']! : palette.faint!;
    ctx.textAlign = 'center';
    ctx.fillText(tick.label, cx, LABEL_Y);
    ctx.textAlign = 'left';
    lastRight = cx + half;
  }
}
