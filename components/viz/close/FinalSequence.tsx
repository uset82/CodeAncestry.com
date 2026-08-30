import { CLOSE_CLAIMS } from '@/data/demo/close';

/**
 * The argument as one strand. Beat 11 is zoomOut — whole network, calm.
 * This plate scores that pose. It does not add a second kinetic event.
 * Progressive means order: seven claims, then the thesis in JoinSection.
 */

export function FinalSequence({ className }: { className?: string }) {
  return (
    <ol className={className ?? 'relative m-0 max-w-[640px] list-none pl-6'}>
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
          strokeWidth="1.3"
          strokeDasharray="4 5"
          className="animate-dash"
          opacity="0.55"
        />
      </svg>
      {CLOSE_CLAIMS.map((claim) => (
        <li key={claim.id} className="mb-3 flex items-start gap-3 last:mb-0">
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
