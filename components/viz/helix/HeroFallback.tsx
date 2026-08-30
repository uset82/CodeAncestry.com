import { STRANDS, UPSTREAM_PATH } from './strands';

/**
 * The no-WebGL and reduced-motion hero.
 *
 * Not a placeholder: it carries the same five facts as the animation — one
 * origin, three children, three grandchildren, a hybrid, and one mutation
 * travelling back up — as a still lineage diagram.
 */

const VIEW = { w: 520, h: 620 };

/** Project the 3D strand layout into the SVG viewBox. */
function project(x: number, y: number) {
  return {
    x: VIEW.w / 2 + x * 52,
    y: 70 + (3.6 - y) * 42,
  };
}

export function HeroFallback() {
  const upstream = UPSTREAM_PATH.flatMap((id) => {
    const spec = STRANDS.find((s) => s.id === id);
    return spec ? [spec] : [];
  });

  const upstreamPath = upstream
    .map((spec, i) => {
      const from = project(spec.end.x, spec.end.y);
      const to = project(spec.start.x, spec.start.y);
      return `${i === 0 ? 'M' : 'L'}${from.x} ${from.y} L${to.x} ${to.y}`;
    })
    .join(' ');

  return (
    <figure className="m-0 flex justify-center">
      <svg
        viewBox={`0 0 ${VIEW.w} ${VIEW.h}`}
        className="h-auto w-full max-w-[520px]"
        role="img"
        aria-labelledby="hero-fallback-title hero-fallback-desc"
      >
        <title id="hero-fallback-title">
          A software lineage: one origin project and seven descendants across four generations
        </title>
        <desc id="hero-fallback-desc">
          Generation zero sits at the top. Three children descend from it. Two of those have children
          of their own. One later project is a hybrid of two grandparents. A mutation discovered in
          a descendant travels back up to the origin, shown as an upward arrow.
        </desc>

        <defs>
          <marker
            id="hero-up-arrow"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M0 0 10 5 0 10z" fill="var(--color-violet)" />
          </marker>
        </defs>

        {/* descent edges */}
        {STRANDS.filter((spec) => spec.parent).map((spec) => {
          const parent = STRANDS.find((s) => s.id === spec.parent);
          if (!parent) return null;
          const from = project(parent.end.x, parent.end.y);
          const to = project(spec.end.x, spec.end.y);
          return (
            <line
              key={`d-${spec.id}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke="var(--color-cyan)"
              strokeWidth="1.4"
              opacity="0.5"
            />
          );
        })}

        {/* the hybrid's second parent, drawn as a recombination edge */}
        {STRANDS.filter((spec) => spec.parentB).map((spec) => {
          const parent = STRANDS.find((s) => s.id === spec.parentB);
          if (!parent) return null;
          const from = project(parent.end.x, parent.end.y);
          const to = project(spec.end.x, spec.end.y);
          return (
            <line
              key={`r-${spec.id}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke="var(--color-violet)"
              strokeWidth="1.4"
              strokeDasharray="5 4"
              opacity="0.62"
            />
          );
        })}

        {/* the upstream mutation */}
        <path
          d={upstreamPath}
          fill="none"
          stroke="var(--color-violet)"
          strokeWidth="2"
          strokeLinecap="round"
          markerEnd="url(#hero-up-arrow)"
          opacity="0.9"
        />

        {/* nodes */}
        {STRANDS.map((spec) => {
          const at = project(spec.end.x, spec.end.y);
          const isRoot = spec.generation === 0;
          const isOrigin = spec.origin ?? false;
          const fill = isRoot
            ? 'var(--color-acid)'
            : isOrigin
              ? 'var(--color-violet)'
              : 'var(--color-cyan)';

          return (
            <g key={spec.id}>
              {/* gene loci along the strand */}
              {Array.from({ length: spec.loci }, (_, i) => {
                const t = (i + 0.5) / spec.loci;
                const p = project(
                  spec.start.x + (spec.end.x - spec.start.x) * t,
                  spec.start.y + (spec.end.y - spec.start.y) * t,
                );
                return (
                  <circle
                    key={i}
                    cx={p.x}
                    cy={p.y}
                    r="2.1"
                    fill={fill}
                    opacity={isRoot ? 0.6 : 0.4}
                  />
                );
              })}

              <circle cx={at.x} cy={at.y} r={isRoot ? 8 : 6} fill="var(--color-void)" />
              <circle
                cx={at.x}
                cy={at.y}
                r={isRoot ? 8 : 6}
                fill="none"
                stroke={fill}
                strokeWidth="1.8"
              />
              <text
                x={at.x + (spec.end.x < -0.5 ? -13 : 13)}
                y={at.y + 4}
                textAnchor={spec.end.x < -0.5 ? 'end' : 'start'}
                className="fill-muted font-mono"
                fontSize="10"
              >
                {spec.generation === 0
                  ? 'Origin'
                  : spec.parentB
                    ? 'Hybrid'
                    : spec.origin
                      ? 'Mutation'
                      : `Gen ${spec.generation}`}
              </text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
