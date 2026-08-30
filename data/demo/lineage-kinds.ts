/**
 * Homepage lineage types. Shape + connection + symbol, never colour alone.
 * These are demo vocabulary, not KEYLIT registry states.
 */

export const LINEAGE_KINDS = [
  'ORIGINAL',
  'CHILD',
  'FORK',
  'REMIX',
  'COVER',
  'HYBRID',
  'MUTATION',
  'AGENT-CREATED',
  'VERIFIED',
] as const;

export type LineageKind = (typeof LINEAGE_KINDS)[number];

export type LineageKindMeta = {
  kind: LineageKind;
  glyph: string;
  shape: 'circle' | 'square' | 'diamond' | 'triangle' | 'rect';
  /** How the edge into this node is drawn, independent of hue. */
  connection: 'solid' | 'dashed' | 'dotted' | 'double';
  tone: string;
};

export const LINEAGE_KIND_META: Record<LineageKind, LineageKindMeta> = {
  ORIGINAL: {
    kind: 'ORIGINAL',
    glyph: '●',
    shape: 'circle',
    connection: 'solid',
    tone: 'text-acid',
  },
  CHILD: {
    kind: 'CHILD',
    glyph: '○',
    shape: 'circle',
    connection: 'solid',
    tone: 'text-cyan',
  },
  FORK: {
    kind: 'FORK',
    glyph: '⊣',
    shape: 'square',
    connection: 'solid',
    tone: 'text-cyan',
  },
  REMIX: {
    kind: 'REMIX',
    glyph: '◈',
    shape: 'diamond',
    connection: 'double',
    tone: 'text-violet',
  },
  COVER: {
    kind: 'COVER',
    glyph: '▭',
    shape: 'rect',
    connection: 'dashed',
    tone: 'text-muted',
  },
  HYBRID: {
    kind: 'HYBRID',
    glyph: '⊕',
    shape: 'diamond',
    connection: 'double',
    tone: 'text-violet',
  },
  MUTATION: {
    kind: 'MUTATION',
    glyph: '△',
    shape: 'triangle',
    connection: 'solid',
    tone: 'text-amber',
  },
  'AGENT-CREATED': {
    kind: 'AGENT-CREATED',
    glyph: '◆',
    shape: 'diamond',
    connection: 'dashed',
    tone: 'text-violet',
  },
  VERIFIED: {
    kind: 'VERIFIED',
    glyph: '✓',
    shape: 'circle',
    connection: 'solid',
    tone: 'text-acid',
  },
};
