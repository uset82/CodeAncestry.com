import { CLOSE_CLAIMS } from '@/data/demo/close';

/**
 * The argument as one strand. Beat 11 is zoomOut — whole network, calm.
 * The spine is solid: dash means a proposed relation, and this is settled.
 */

export function FinalSequence({ className }: { className?: string }) {
  return (
    <ol
      aria-label="The CodeAncestry argument"
      className={className ?? 'relative m-0 max-w-[640px] list-none pl-6'}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 8 280"
        preserveAspectRatio="none"
        className="absolute top-1 bottom-1 left-0 w-2"
      >
        <line
          x1="4"
          y1="0"
          x2="4"
          y2="280"
          stroke="var(--color-cyan)"
          strokeWidth="1.4"
          opacity="0.7"
        />
      </svg>
      {CLOSE_CLAIMS.map((claim) => (
        <li key={claim.id} className="mb-2 flex items-start gap-3 last:mb-0">
          <span
            aria-hidden="true"
            className="border-line text-muted mt-0.5 grid size-5 shrink-0 place-items-center rounded-xs border font-mono text-[10px]"
          >
            {claim.mark}
          </span>
          <span>
            <span className="text-muted block font-mono text-nano uppercase">{claim.object}</span>
            <span className="text-text-soft mt-0.5 block text-[15px] leading-snug">
              {claim.line}
            </span>
          </span>
        </li>
      ))}
    </ol>
  );
}
