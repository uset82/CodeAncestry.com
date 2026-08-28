'use client';

import { useState } from 'react';
import { cn } from '@/lib/cn';
import type { CodePaintingView } from '@/lib/registry';
import { INHERITANCE_META, type InheritanceMode } from '@/lib/schema/vocabulary';

/**
 * Code Painting — the chromosome-painting analogue from consumer genomics.
 *
 * One horizontal bar showing what share of a project came from where. Segments
 * are keyed by inheritance mode, which is also the only thing colour encodes;
 * the label, the percentage and the gene list are all present as text.
 */

const pct = (value: number) => `${Math.round(value * 100)}%`;

/** Non-colour texture per mode, so the bar survives greyscale and colour blindness. */
const TEXTURE: Record<InheritanceMode, string> = {
  native: 'repeating-linear-gradient(90deg, transparent 0 5px, rgb(0 0 0 / 0.28) 5px 6px)',
  inherited: 'none',
  mutated: 'repeating-linear-gradient(45deg, transparent 0 4px, rgb(0 0 0 / 0.3) 4px 7px)',
  local: 'repeating-linear-gradient(-45deg, transparent 0 3px, rgb(0 0 0 / 0.3) 3px 6px)',
  transferred: 'repeating-linear-gradient(90deg, transparent 0 2px, rgb(0 0 0 / 0.36) 2px 5px)',
};

export function CodePaintingStrip({
  painting,
  className,
  height = 'md',
}: {
  painting: CodePaintingView;
  className?: string;
  height?: 'sm' | 'md';
}) {
  const [active, setActive] = useState<InheritanceMode | null>(null);
  const focused = painting.segments.find((s) => s.mode === active) ?? null;

  return (
    <div className={cn('w-full', className)}>
      {/* ------------------------------------------------------------- the bar */}
      <div
        className={cn(
          'border-line bg-panel-2 flex w-full overflow-hidden rounded-md border',
          height === 'sm' ? 'h-9' : 'h-14',
        )}
      >
        {painting.segments.map((segment) => {
          const meta = INHERITANCE_META[segment.mode];
          const isActive = active === segment.mode;

          return (
            <button
              key={segment.mode}
              type="button"
              style={{ flexBasis: `${segment.share * 100}%` }}
              onMouseEnter={() => setActive(segment.mode)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(segment.mode)}
              onBlur={() => setActive(null)}
              onClick={() => setActive((prev) => (prev === segment.mode ? null : segment.mode))}
              aria-pressed={isActive}
              className={cn(
                'relative min-w-0 shrink grow-0 transition-opacity',
                meta.swatch,
                active && !isActive ? 'opacity-35' : 'opacity-100',
              )}
            >
              <span
                aria-hidden="true"
                className="absolute inset-0"
                style={{ backgroundImage: TEXTURE[segment.mode] }}
              />
              <span className="sr-only">
                {meta.label}: {pct(segment.share)} of {painting.genome.name}.{' '}
                {segment.genes.length} genes. {meta.description}
              </span>
            </button>
          );
        })}
      </div>

      {/* ------------------------------------------------------------- legend */}
      <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2.5">
        {painting.segments.map((segment) => {
          const meta = INHERITANCE_META[segment.mode];
          return (
            <li key={segment.mode} className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className={cn('relative size-2.5 shrink-0 rounded-[2px]', meta.swatch)}
              >
                <span
                  className="absolute inset-0 rounded-[2px]"
                  style={{ backgroundImage: TEXTURE[segment.mode] }}
                />
              </span>
              <span className="text-text-soft text-[13px]">{meta.label}</span>
              <span className="text-muted font-mono text-[13px] tabular-nums">
                {pct(segment.share)}
              </span>
            </li>
          );
        })}
      </ul>

      {/* ------------------------------------------------- hover / focus detail */}
      <div className="border-line/60 mt-5 min-h-[104px] border-t pt-4">
        {focused ? (
          <div>
            <p className="text-[15px]">
              <span className={cn('font-semibold', INHERITANCE_META[focused.mode].tone)}>
                {INHERITANCE_META[focused.mode].label} · {pct(focused.share)}
              </span>{' '}
              <span className="text-muted">{INHERITANCE_META[focused.mode].description}</span>
            </p>

            <ul className="mt-3 flex flex-wrap gap-1.5">
              {focused.genes.map((gene) => (
                <li
                  key={gene.accession}
                  className="border-line bg-panel-2 text-text-soft rounded-sm border px-2 py-[3px] font-mono text-nano"
                >
                  {gene.name}
                  {gene.origin && <span className="text-faint"> ← {gene.origin}</span>}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-muted text-[15px] leading-relaxed">
            {painting.segments
              .map((s) => `${pct(s.share)} ${INHERITANCE_META[s.mode].label.toLowerCase()}`)
              .join(' · ')}
            <span className="text-faint">
              {' '}
              · composition confidence {painting.confidence.toFixed(2)}
            </span>
            <br />
            <span className="text-faint text-[13px]">
              Hover or focus a segment to see which capabilities it covers.
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
