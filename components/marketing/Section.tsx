import { cn } from '@/lib/cn';

/**
 * The folio's structural rhythm.
 *
 * Each section is a plate. On wide screens the plate number sets sideways in
 * the left margin the way a running head does in a bound volume, which buys
 * the asymmetry the old centred stack never had; below xl it folds back into
 * the Eyebrow at the top of the content.
 */
export function Section({
  id,
  plate,
  children,
  className,
  tight = false,
  bordered = true,
}: {
  id?: string;
  /** Sideways margin label, e.g. "Plate 02 — Lineage". */
  plate?: string;
  children: React.ReactNode;
  className?: string;
  tight?: boolean;
  bordered?: boolean;
}) {
  return (
    <section
      id={id}
      className={cn(
        'relative',
        bordered && 'border-ink/15 border-t',
        tight ? 'py-16 md:py-24' : 'py-24 md:py-36',
        className,
      )}
    >
      {plate && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 hidden w-[calc((100%-min(1440px,100%-48px))/2)] justify-center pt-32 2xl:flex"
        >
          <span className="text-ink-faint runhead sticky top-32 h-fit text-[9.5px] whitespace-nowrap [writing-mode:vertical-rl]">
            {plate}
          </span>
        </div>
      )}

      <div className="shell-wide">{children}</div>
    </section>
  );
}

/**
 * The ruled kicker. A folio number, a hairline, then the label — the same
 * three-part construction as a plate caption.
 */
export function Eyebrow({
  index,
  children,
  className,
}: {
  index?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={cn('flex items-center gap-4', className)}>
      {index && (
        <span className="text-press-vermilion runhead text-[10px]">{index}</span>
      )}
      <span aria-hidden="true" className="bg-ink/25 h-px w-10" />
      <span className="text-ink-muted runhead text-[10px]">{children}</span>
    </p>
  );
}
