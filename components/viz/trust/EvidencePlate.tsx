import { EvidenceChip } from '@/components/ui/EvidenceChip';
import { cn } from '@/lib/cn';
import { demoAccession, futureCompatibility, trustEvidence } from '@/data/demo';

/**
 * Provenance readout for M-94012. Marks encode state. Colour is secondary.
 * Future integrations are listed, not claimed.
 */

const STATE_MARK = {
  met: { mark: '✓', tone: 'text-acid border-acid/40' },
  warning: { mark: '!', tone: 'text-amber border-amber/45' },
  future: { mark: '○', tone: 'text-muted border-line' },
} as const;

export function EvidencePlate({ className }: { className?: string }) {
  const warning = trustEvidence.items.find((item) => item.state === 'warning');

  return (
    <article className={cn('font-ui', className)}>
      <p className="text-muted font-mono text-nano uppercase">{trustEvidence.meta.label}</p>
      <h3 className="mt-2 text-[18px] leading-tight font-semibold tracking-tight">
        Mutation {demoAccession(trustEvidence.mutationId)}
      </h3>
      <p className="text-text-soft mt-2 text-[14px] leading-relaxed">
        An ancestry claim is a set of reasons to believe it. The helix streams at this beat are
        those reasons arriving — not decoration.
      </p>

      <ol className="relative mt-6 pl-6">
        <svg
          aria-hidden="true"
          viewBox="0 0 8 200"
          preserveAspectRatio="none"
          className="absolute top-1 bottom-1 left-0 w-2"
        >
          <line
            x1="4"
            y1="0"
            x2="4"
            y2="200"
            stroke="var(--color-acid)"
            strokeWidth="1.3"
            strokeDasharray="4 5"
            className="animate-dash"
            opacity="0.55"
          />
        </svg>
        {trustEvidence.items.map((item) => {
          const status = STATE_MARK[item.state];
          return (
            <li key={item.id} className="py-2.5 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-xs border px-2 py-0.5 font-mono text-nano uppercase',
                    status.tone,
                  )}
                >
                  <span aria-hidden="true">{status.mark}</span>
                  {item.label}
                </span>
                {'code' in item && item.code ? <EvidenceChip code={item.code} /> : null}
              </div>
              <p className="text-text-soft mt-1.5 text-[13.5px] leading-relaxed">{item.detail}</p>
            </li>
          );
        })}
      </ol>

      {warning && (
        <p className="border-amber/40 text-amber mt-6 inline-flex items-center gap-1.5 rounded-xs border px-2 py-1 font-mono text-nano uppercase">
          <span aria-hidden="true">!</span>
          Cannot propagate — {warning.label} open
        </p>
      )}

      <div className="border-line mt-8 border-t pt-5">
        <p className="text-muted font-mono text-nano uppercase">Future compatibility · not live</p>
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {futureCompatibility.map((item) => (
            <li
              key={item}
              className="border-line bg-void text-muted rounded-xs border border-dashed px-2 py-1 font-mono text-nano uppercase"
            >
              <span aria-hidden="true">○ </span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
