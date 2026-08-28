'use client';

import Link from 'next/link';
import { cn } from '@/lib/cn';
import type { Feature, Track } from '@/lib/registry/genome';
import { EVIDENCE_CODE_META, EVIDENCE_TIER_META } from '@/lib/schema/vocabulary';

/**
 * The selected-locus panel.
 *
 * A genome browser is only useful if clicking a feature answers the next
 * question, so this is deliberately dense: what the locus is, how it got here
 * generation by generation, what the claim rests on, and where the code lives.
 */

export function LocusPanel({
  feature,
  track,
  genomeName,
  className,
}: {
  feature: Feature | null;
  track: Track | null;
  genomeName: string;
  className?: string;
}) {
  if (!feature || !track) {
    return (
      <div className={cn('text-muted text-[14px] leading-relaxed', className)}>
        <p>No locus selected.</p>
        <p className="text-faint mt-2 text-[13px]">
          Click a feature on any track, or focus the browser and use the arrow keys, to see its
          origin, its evidence and a link to the code it lives in.
        </p>
      </div>
    );
  }

  const tier = EVIDENCE_TIER_META[feature.tier];

  return (
    <div className={cn('text-[14px]', className)}>
      {/* ------------------------------------------------------------ identity */}
      <p className="text-faint font-mono text-nano">{track.label}</p>
      <h3 className="mt-1 text-[19px] leading-tight font-semibold tracking-tight">
        {feature.label}
      </h3>
      <p className="text-muted mt-2 leading-relaxed">{feature.detail}</p>

      {feature.href && (
        <Link
          href={feature.href}
          className="text-cyan hover:text-acid mt-3 inline-flex items-center gap-1.5 font-mono text-nano transition-colors"
        >
          Open the full record
          <span aria-hidden="true">→</span>
        </Link>
      )}

      {/* -------------------------------------------------------- origin chain */}
      {feature.chain && feature.chain.length > 0 && (
        <section className="border-line/60 mt-5 border-t pt-4">
          <h4 className="text-text-soft text-[13px] font-semibold">Origin</h4>
          <ol className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1">
            {feature.chain.map((step, index) => (
              <li key={step.accession} className="flex items-center gap-1.5">
                {index > 0 && (
                  <span aria-hidden="true" className="text-faint font-mono text-nano">
                    →
                  </span>
                )}
                <Link
                  href={`/project/${step.accession}`}
                  className={cn(
                    'border-line bg-panel-2 hover:border-line-strong rounded-sm border px-2 py-[3px] font-mono text-nano transition-colors',
                    index === feature.chain!.length - 1
                      ? 'text-acid border-acid/40'
                      : 'text-text-soft',
                  )}
                >
                  {step.name} <span className="text-faint">Gen {step.generation}</span>
                </Link>
              </li>
            ))}
          </ol>
          <p className="text-faint mt-2 text-[12.5px] leading-snug">
            {feature.chain.length === 1
              ? `First appears in ${genomeName}. Nothing upstream carries it.`
              : `Present in ${feature.chain.length} generations, ${feature.chain[0]!.name} onward.`}
          </p>
        </section>
      )}

      {/* ------------------------------------------------------------ evidence */}
      <section className="border-line/60 mt-5 border-t pt-4">
        <h4 className="text-text-soft text-[13px] font-semibold">Evidence</h4>

        <p className="mt-2 flex flex-wrap items-baseline gap-x-2">
          <span className={cn('font-mono text-nano font-semibold uppercase', tier.tone)}>
            {feature.tier}
          </span>
          {feature.confidence !== null && (
            <span className="text-muted font-mono text-nano tabular-nums">
              confidence {feature.confidence.toFixed(2)}
            </span>
          )}
        </p>
        <p className="text-faint mt-1 text-[12.5px] leading-snug">{tier.description}</p>

        {feature.evidence.length > 0 ? (
          <ul className="mt-3 space-y-1.5">
            {feature.evidence.map((code) => {
              const meta = EVIDENCE_CODE_META[code];
              return (
                <li key={code} className="flex gap-2">
                  <span className="border-line bg-panel-2 text-text-soft shrink-0 rounded-sm border px-1.5 py-px font-mono text-nano">
                    {code}
                  </span>
                  <span className="text-muted text-[12.5px] leading-snug">{meta.label}</span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-faint mt-3 text-[12.5px] leading-snug">
            No evidence record is attached to this feature. It is shown because the surrounding
            genome asserts it, which is the weakest kind of claim the registry makes.
          </p>
        )}
      </section>

      {/* -------------------------------------------------------- jump to code */}
      {feature.anchor && (
        <section className="border-line/60 mt-5 border-t pt-4">
          <h4 className="text-text-soft text-[13px] font-semibold">Where the code lives</h4>

          <dl className="mt-2 space-y-1.5">
            <Row label="Path" value={feature.anchor.path} />
            <Row label="Commit" value={feature.anchor.commit.slice(0, 10)} />
            {feature.anchor.symbols.length > 0 && (
              <Row label="Symbols" value={feature.anchor.symbols.join(', ')} />
            )}
          </dl>

          {feature.anchor.url ? (
            <a
              href={feature.anchor.url}
              target="_blank"
              rel="noreferrer noopener"
              className="text-cyan hover:text-acid mt-3 inline-flex items-center gap-1.5 font-mono text-nano transition-colors"
            >
              Jump to code
              <span aria-hidden="true">↗</span>
              <span className="sr-only">(opens on {feature.anchor.repository})</span>
            </a>
          ) : (
            <p className="text-faint mt-3 text-[12.5px] leading-snug">
              This repository has no public web view, so there is nowhere to link. The path and
              commit above locate the code in a clone.
            </p>
          )}
        </section>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="text-faint w-16 shrink-0 font-mono text-nano">{label}</dt>
      <dd className="text-text-soft min-w-0 font-mono text-nano break-all">{value}</dd>
    </div>
  );
}
