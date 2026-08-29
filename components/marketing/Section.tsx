import { cn } from '@/lib/cn';

/**
 * The homepage's structural rhythm. One section per idea, each announced by a
 * numbered eyebrow so a reader can tell how far through the argument they are.
 */
const BEAT_VEIL =
  'linear-gradient(100deg, #07090d 0%, color-mix(in oklab, #07090d 82%, transparent) 38%, transparent 68%)';

export function Section({
  id,
  beat,
  children,
  className,
  tight = false,
  bordered = true,
}: {
  id?: string;
  /** Homepage helix pose. Reordering this attribute retargets the scene. */
  beat?: number;
  children: React.ReactNode;
  className?: string;
  tight?: boolean;
  bordered?: boolean;
}) {
  return (
    <section
      id={id}
      {...(beat !== undefined ? { 'data-beat': beat } : {})}
      className={cn(
        'relative',
        bordered && 'border-line/60 border-t',
        tight ? 'py-16 md:py-20' : 'py-24 md:py-32',
        className,
      )}
    >
      {beat !== undefined && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ background: BEAT_VEIL }}
        />
      )}
      <div className="shell-wide relative">{children}</div>
    </section>
  );
}

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
    <p className={cn('flex items-center gap-3 font-mono text-micro uppercase', className)}>
      {index && <span className="text-acid">{index}</span>}
      <span className="text-muted">{children}</span>
    </p>
  );
}
