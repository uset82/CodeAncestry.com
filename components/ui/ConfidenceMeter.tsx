import { cn } from '@/lib/cn';
import { EVIDENCE_TIERS, type EvidenceTier } from '@/lib/schema/vocabulary';

function tierFor(value: number): EvidenceTier {
  if (value >= 0.9) return 'verified';
  if (value >= 0.7) return 'reviewed';
  return 'inferred';
}

const TIER_TONE: Record<EvidenceTier, { bar: string; text: string }> = {
  verified: { bar: 'bg-acid', text: 'text-acid' },
  reviewed: { bar: 'bg-cyan', text: 'text-cyan' },
  inferred: { bar: 'bg-muted', text: 'text-muted' },
};

type Props = {
  /** 0–1 confidence. */
  value: number;
  label?: string;
  /** Show the tier word next to the number. */
  showTier?: boolean;
  className?: string;
};

/**
 * Confidence is a first-class value in this system, never buried in metadata.
 * The numeric readout is always present so the bar is decoration, not the data.
 */
export function ConfidenceMeter({
  value,
  label = 'Confidence',
  showTier = true,
  className,
}: Props) {
  const clamped = Math.min(1, Math.max(0, value));
  const tier = tierFor(clamped);
  const tone = TIER_TONE[tier];

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-muted font-mono text-nano uppercase">{label}</span>
        <span className="flex items-baseline gap-2 font-mono text-[11px]">
          <span className={cn('tabular-nums', tone.text)}>{clamped.toFixed(2)}</span>
          {showTier && <span className="text-faint uppercase">{tier}</span>}
        </span>
      </div>

      <div
        className="bg-panel-3 relative h-1 overflow-hidden rounded-full"
        role="meter"
        aria-valuenow={Number(clamped.toFixed(2))}
        aria-valuemin={0}
        aria-valuemax={1}
        aria-label={`${label}: ${clamped.toFixed(2)}, ${tier}`}
      >
        <div
          className={cn('h-full rounded-full transition-[width] duration-500', tone.bar)}
          style={{ width: `${clamped * 100}%` }}
        />
        {/* tier gridlines give a non-colour read of where the value sits */}
        {EVIDENCE_TIERS.slice(1).map((t, i) => (
          <span
            key={t}
            aria-hidden="true"
            className="bg-void absolute top-0 h-full w-px opacity-70"
            style={{ left: `${i === 0 ? 70 : 90}%` }}
          />
        ))}
      </div>
    </div>
  );
}
