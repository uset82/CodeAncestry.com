/**
 * SVG pattern definitions that give every lineage state a non-colour encoding.
 * Mounted once per page; referenced by `url(#ca-pattern-<name>)` from graph
 * fills and by the CSS-mask variants in StateBadge.
 */
export function StatePatterns() {
  return (
    <svg aria-hidden="true" className="pointer-events-none absolute h-0 w-0" focusable="false">
      <defs>
        <pattern id="ca-pattern-grid" width="6" height="6" patternUnits="userSpaceOnUse">
          <path d="M6 0H0v6" fill="none" stroke="currentColor" strokeWidth="0.6" opacity="0.55" />
        </pattern>

        <pattern id="ca-pattern-dots" width="5" height="5" patternUnits="userSpaceOnUse">
          <circle cx="1.5" cy="1.5" r="0.9" fill="currentColor" opacity="0.5" />
        </pattern>

        <pattern
          id="ca-pattern-diagonal"
          width="7"
          height="7"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <line y2="7" stroke="currentColor" strokeWidth="1.4" opacity="0.5" />
        </pattern>

        <pattern id="ca-pattern-frozen" width="8" height="8" patternUnits="userSpaceOnUse">
          <path
            d="M4 0v8M0 4h8"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.8"
            opacity="0.45"
          />
        </pattern>

        <pattern id="ca-pattern-cross" width="6" height="6" patternUnits="userSpaceOnUse">
          <path
            d="M0 0l6 6M6 0L0 6"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.7"
            opacity="0.5"
          />
        </pattern>

        {/* Arrowheads for typed lineage edges */}
        <marker
          id="ca-arrow"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M0 0 10 5 0 10z" fill="currentColor" />
        </marker>

        <marker
          id="ca-arrow-open"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M0 1 9 5 0 9" fill="none" stroke="currentColor" strokeWidth="1.4" />
        </marker>
      </defs>
    </svg>
  );
}

/** CSS background-image equivalents, for HTML elements that cannot reference
 *  an SVG pattern. Keeps the pattern encoding available on chips and bars. */
export const PATTERN_CSS: Record<string, string> = {
  solid: 'none',
  grid: 'repeating-linear-gradient(0deg,currentColor 0 1px,transparent 1px 6px),repeating-linear-gradient(90deg,currentColor 0 1px,transparent 1px 6px)',
  dots: 'radial-gradient(currentColor 0.9px, transparent 1px)',
  diagonal: 'repeating-linear-gradient(45deg,currentColor 0 1.4px,transparent 1.4px 7px)',
  frozen:
    'repeating-linear-gradient(0deg,currentColor 0 0.8px,transparent 0.8px 8px),repeating-linear-gradient(90deg,currentColor 0 0.8px,transparent 0.8px 8px)',
  cross:
    'repeating-linear-gradient(45deg,currentColor 0 0.7px,transparent 0.7px 6px),repeating-linear-gradient(-45deg,currentColor 0 0.7px,transparent 0.7px 6px)',
};
