import { hierarchy, tree as d3tree, type HierarchyPointNode } from 'd3-hierarchy';
import type { FamilyTree, TreeEdge, TreeNode } from '@/lib/registry/tree';

/**
 * Geometry for the CodeTree.
 *
 * Every layout resolves to the same shape — a map of accession to point, plus a
 * path string per edge — so the SVG renderer, the inspector and the keyboard
 * navigation all read one coordinate system.
 */

export type Placed = {
  node: TreeNode;
  x: number;
  y: number;
  /** Radial layouts also expose the polar pair the label rotation needs. */
  angle?: number;
  radius?: number;
};

export type PlacedEdge = {
  edge: TreeEdge;
  path: string;
  /** Midpoint, for labels and pulse anchoring. */
  mid: { x: number; y: number };
};

/**
 * A generation guide in the radial view. Drawn as an arc spanning only the
 * angles its projects occupy — a full circle would be mostly empty, because a
 * project that never had children stays on its own generation's ring.
 */
export type Ring = {
  generation: number;
  radius: number;
  from: number;
  to: number;
  path: string;
  /** Where the "GEN n" caption sits, just outside the arc's first end. */
  label: { x: number; y: number };
};

export type Geometry = {
  placed: Map<string, Placed>;
  edges: PlacedEdge[];
  rings: Ring[];
  /** Bounding box in layout units, before any zoom transform. */
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
};

export const NODE_WIDTH = 188;
export const NODE_HEIGHT = 74;

/**
 * The radial view uses a narrower chip. A ring only has so much circumference,
 * and a full card at generation one lands on top of the root.
 */
export const RADIAL_NODE_WIDTH = 148;
export const RADIAL_NODE_HEIGHT = 44;

type Branch = { id: string; children: Branch[] };

function buildHierarchy(family: FamilyTree) {
  const byId = new Map(family.nodes.map((node) => [node.accession, node]));
  const spine = new Map(family.spine.map((entry) => [entry.id, entry]));

  const build = (id: string): Branch => {
    const node = byId.get(id);
    if (!node) return { id, children: [] };

    // Only follow the edge a child considers primary, so a hybrid appears once.
    const children = node.children.filter((childId) => spine.get(childId)?.parent === id);
    return { id, children: children.map(build) };
  };

  return hierarchy<Branch>(build(family.root));
}

/* ==========================================================================
   Tidy tree — generations as rows
   ========================================================================== */

export function tidyLayout(family: FamilyTree): Geometry {
  const byId = new Map(family.nodes.map((node) => [node.accession, node]));
  const root = buildHierarchy(family);

  d3tree<Branch>()
    .nodeSize([NODE_WIDTH + 44, NODE_HEIGHT + 92])
    .separation((a, b) => (a.parent === b.parent ? 1 : 1.25))(root);

  const placed = new Map<string, Placed>();
  root.each((point) => {
    const typed = point as HierarchyPointNode<Branch>;
    const node = byId.get(typed.data.id);
    if (!node) return;
    placed.set(node.accession, { node, x: typed.x, y: typed.y });
  });

  return {
    placed,
    edges: family.edges.flatMap((edge) => routeEdge(edge, placed, 'tidy')),
    rings: [],
    bounds: boundsOf(placed, NODE_WIDTH, NODE_HEIGHT),
  };
}

/* ==========================================================================
   Radial tree — generations as rings
   ========================================================================== */

export function radialLayout(family: FamilyTree, radius = 330): Geometry {
  const byId = new Map(family.nodes.map((node) => [node.accession, node]));
  const root = buildHierarchy(family);

  d3tree<Branch>()
    .size([2 * Math.PI, radius])
    .separation((a, b) => (a.parent === b.parent ? 1 : 1.9) / a.depth)(root);

  const placed = new Map<string, Placed>();
  root.each((point) => {
    const typed = point as HierarchyPointNode<Branch>;
    const node = byId.get(typed.data.id);
    if (!node) return;

    // Rotate a quarter turn so generation zero reads at the top of the ring.
    const angle = typed.x - Math.PI / 2;
    placed.set(node.accession, {
      node,
      x: Math.cos(angle) * typed.y,
      y: Math.sin(angle) * typed.y,
      angle,
      radius: typed.y,
    });
  });

  const rings = buildRings(placed);
  const bounds = boundsOf(placed, RADIAL_NODE_WIDTH, RADIAL_NODE_HEIGHT);

  // Ring arcs can bow past the chips they sit behind, so fold their extents in
  // rather than letting the view clip them.
  for (const ring of rings) {
    for (const point of sampleArc(ring)) {
      bounds.minX = Math.min(bounds.minX, point.x - 30);
      bounds.minY = Math.min(bounds.minY, point.y - 18);
      bounds.maxX = Math.max(bounds.maxX, point.x + 30);
      bounds.maxY = Math.max(bounds.maxY, point.y + 18);
    }
  }

  return {
    placed,
    edges: family.edges.flatMap((edge) => routeEdge(edge, placed, 'radial')),
    rings,
    bounds,
  };
}

/** One arc per generation, spanning the angles that generation actually uses. */
function buildRings(placed: Map<string, Placed>): Ring[] {
  const byRadius = new Map<number, { angles: number[]; generation: number }>();

  for (const point of placed.values()) {
    const radius = Math.round(point.radius ?? 0);
    if (radius === 0) continue;
    const entry = byRadius.get(radius) ?? { angles: [], generation: point.node.generation };
    entry.angles.push(point.angle ?? 0);
    byRadius.set(radius, entry);
  }

  return [...byRadius.entries()]
    .sort(([a], [b]) => a - b)
    .map(([radius, entry]) => {
      // A quarter turn of padding on a lone node still reads as a ring segment.
      const pad = entry.angles.length > 1 ? 0.34 : 0.5;
      const from = Math.min(...entry.angles) - pad;
      const to = Math.max(...entry.angles) + pad;
      const start = polar(from, radius);
      const end = polar(to, radius);
      const large = to - from > Math.PI ? 1 : 0;

      return {
        generation: entry.generation,
        radius,
        from,
        to,
        path: `M${start.x},${start.y} A${radius},${radius} 0 ${large} 1 ${end.x},${end.y}`,
        label: polar(from - 0.09, radius),
      };
    });
}

function sampleArc(ring: Ring) {
  const steps = Math.max(4, Math.ceil(((ring.to - ring.from) / Math.PI) * 24));
  return Array.from({ length: steps + 1 }, (_, i) =>
    polar(ring.from + ((ring.to - ring.from) * i) / steps, ring.radius),
  );
}

/* ==========================================================================
   Edge routing
   ========================================================================== */

/**
 * Descent edges are drawn as vertical Béziers; anything that runs against
 * descent (an upstream proposal, a lateral transfer) is drawn as an arc that
 * bulges clear of the tree, because those relations are the whole point and must
 * not be mistaken for parentage.
 */
function routeEdge(
  edge: TreeEdge,
  placed: Map<string, Placed>,
  mode: 'tidy' | 'radial',
): PlacedEdge[] {
  // Edges point from descendant to ancestor; draw ancestor -> descendant.
  const child = placed.get(edge.from);
  const parent = placed.get(edge.to);
  if (!child || !parent) return [];

  const from = edge.upstream || edge.type === 'TRANSFERRED_FROM' ? child : parent;
  const to = edge.upstream || edge.type === 'TRANSFERRED_FROM' ? parent : child;

  if (edge.upstream || edge.type === 'TRANSFERRED_FROM') {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const distance = Math.hypot(dx, dy) || 1;
    // Perpendicular offset scaled to the span keeps long arcs readable.
    const bulge = Math.min(190, 60 + distance * 0.32);
    const nx = -dy / distance;
    const ny = dx / distance;
    const cx = (from.x + to.x) / 2 + nx * bulge;
    const cy = (from.y + to.y) / 2 + ny * bulge;

    return [
      {
        edge,
        path: `M${from.x},${from.y} Q${cx},${cy} ${to.x},${to.y}`,
        mid: {
          x: 0.25 * from.x + 0.5 * cx + 0.25 * to.x,
          y: 0.25 * from.y + 0.5 * cy + 0.25 * to.y,
        },
      },
    ];
  }

  if (mode === 'radial') {
    // Interpolate in polar space so the curve leaves its parent along the radius
    // and arrives on its child's ring, instead of cutting across the diagram.
    const midRadius = ((from.radius ?? 0) + (to.radius ?? 0)) / 2;
    const c1 = polar(from.angle ?? 0, midRadius);
    const c2 = polar(to.angle ?? 0, midRadius);

    return [
      {
        edge,
        path: `M${from.x},${from.y} C${c1.x},${c1.y} ${c2.x},${c2.y} ${to.x},${to.y}`,
        mid: {
          x: 0.125 * from.x + 0.375 * (c1.x + c2.x) + 0.125 * to.x,
          y: 0.125 * from.y + 0.375 * (c1.y + c2.y) + 0.125 * to.y,
        },
      },
    ];
  }

  const midY = (from.y + to.y) / 2;
  return [
    {
      edge,
      path: `M${from.x},${from.y} C${from.x},${midY} ${to.x},${midY} ${to.x},${to.y}`,
      mid: { x: (from.x + to.x) / 2, y: midY },
    },
  ];
}

function polar(angle: number, radius: number) {
  return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
}

/** Content bounds, padded by a node's own footprint plus breathing room. */
function boundsOf(placed: Map<string, Placed>, nodeWidth: number, nodeHeight: number) {
  const points = [...placed.values()];
  if (points.length === 0) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };

  const padX = nodeWidth / 2 + 26;
  const padY = nodeHeight / 2 + 26;

  return {
    minX: Math.min(...points.map((p) => p.x)) - padX,
    minY: Math.min(...points.map((p) => p.y)) - padY,
    maxX: Math.max(...points.map((p) => p.x)) + padX,
    maxY: Math.max(...points.map((p) => p.y)) + padY,
  };
}
