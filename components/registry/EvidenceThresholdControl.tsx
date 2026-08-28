'use client';

import { useId } from 'react';
import { cn } from '@/lib/cn';
import { useEvidenceThreshold } from '@/components/providers/EvidenceThresholdProvider';
import { EVIDENCE_TIER_META, EVIDENCE_TIERS, type EvidenceTier } from '@/lib/schema/vocabulary';

/** What moving the slider to each tier does. The tier's own meaning lives in the vocabulary. */
const TIER_EFFECT: Record<EvidenceTier, string> = {
  inferred: 'Everything, including what a model merely proposed.',
  reviewed: 'Drops raw AI inference. Keeps static analysis and declared metadata.',
  verified: 'Only tests, runtime measurement and human review survive.',
};

const TIER_COPY = Object.fromEntries(
  EVIDENCE_TIERS.map((tier) => [
    tier,
    { ...EVIDENCE_TIER_META[tier], effect: TIER_EFFECT[tier] },
  ]),
) as Record<EvidenceTier, { label: string; description: string; tone: string; effect: string }>;

/**
 * The registry's most opinionated control. It is a slider rather than a
 * checkbox because the tiers are ordered: each step up removes a class of
 * claim, and the reader should feel the registry get smaller and firmer.
 */
export function EvidenceThresholdControl({
  className,
  hidden,
  total,
}: {
  className?: string;
  /** How many records the current threshold is suppressing, if known. */
  hidden?: number;
  total?: number;
}) {
  const { threshold, setThreshold } = useEvidenceThreshold();
  const id = useId();
  const index = EVIDENCE_TIERS.indexOf(threshold);
  const copy = TIER_COPY[threshold];

  return (
    <div className={cn('w-full', className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <label htmlFor={id} className="text-muted font-mono text-nano uppercase">
          Evidence threshold
        </label>
        <span className={cn('font-mono text-nano uppercase', copy.tone)}>{copy.label}</span>
      </div>

      <input
        id={id}
        type="range"
        min={0}
        max={EVIDENCE_TIERS.length - 1}
        step={1}
        value={index}
        onChange={(event) => setThreshold(EVIDENCE_TIERS[Number(event.target.value)]!)}
        aria-valuetext={`${copy.label}. ${copy.effect}`}
        className={cn(
          'mt-3 h-1.5 w-full cursor-pointer appearance-none rounded-full',
          'bg-line-strong',
          '[&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none',
          '[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2',
          '[&::-webkit-slider-thumb]:border-void [&::-webkit-slider-thumb]:bg-acid',
          '[&::-webkit-slider-thumb]:shadow-[0_0_12px_var(--color-acid)]',
          '[&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:rounded-full',
          '[&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-void',
          '[&::-moz-range-thumb]:bg-acid',
        )}
        style={{
          background: `linear-gradient(to right, var(--color-acid) 0%, var(--color-acid) ${(index / (EVIDENCE_TIERS.length - 1)) * 100}%, var(--color-line-strong) ${(index / (EVIDENCE_TIERS.length - 1)) * 100}%, var(--color-line-strong) 100%)`,
        }}
      />

      <div className="mt-2 flex justify-between" aria-hidden="true">
        {EVIDENCE_TIERS.map((tier) => (
          <button
            key={tier}
            type="button"
            tabIndex={-1}
            onClick={() => setThreshold(tier)}
            className={cn(
              'font-mono text-nano uppercase transition-colors',
              tier === threshold ? TIER_COPY[tier].tone : 'text-faint hover:text-muted',
            )}
          >
            {TIER_COPY[tier].label}
          </button>
        ))}
      </div>

      <p className="text-faint mt-3 text-[12.5px] leading-relaxed">
        {copy.effect}
        {hidden !== undefined && total !== undefined && hidden > 0 && (
          <>
            {' '}
            <span className="text-amber">
              {hidden} of {total} records suppressed.
            </span>
          </>
        )}
      </p>
    </div>
  );
}
