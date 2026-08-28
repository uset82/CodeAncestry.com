import { cn } from '@/lib/cn';
import { LINEAGE_STATE_META, type LineageState } from '@/lib/schema/vocabulary';
import { PATTERN_CSS } from './StatePatterns';

type Props = {
  state: LineageState;
  /** Hide the word and show only glyph + pattern. The accessible name is kept. */
  compact?: boolean;
  className?: string;
};

/**
 * Renders a lineage state with four redundant encodings — colour, glyph,
 * pattern and text — so the state survives colour blindness, greyscale
 * printing and low-contrast displays.
 */
export function StateBadge({ state, compact = false, className }: Props) {
  const meta = LINEAGE_STATE_META[state];
  const pattern = PATTERN_CSS[meta.pattern] ?? 'none';

  return (
    <span
      className={cn(
        'relative inline-flex items-center gap-1.5 overflow-hidden rounded-full border px-2 py-[3px] font-mono text-nano uppercase',
        meta.tone,
        meta.border,
        meta.bg,
        className,
      )}
      title={meta.description}
    >
      {meta.pattern !== 'solid' && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{ backgroundImage: pattern, backgroundSize: '6px 6px' }}
        />
      )}
      <span aria-hidden="true" className="relative not-italic">
        {meta.glyph}
      </span>
      <span className={cn('relative', compact && 'sr-only')}>{meta.label}</span>
    </span>
  );
}
