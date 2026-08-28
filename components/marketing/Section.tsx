import { cn } from '@/lib/cn';

/**
 * The page's structural rhythm.
 *
 * Nightglass rule: every section gets one job, one focal point, one primary
 * action. Sections are separated by a hairline and generous space, never by a
 * card boundary — the boundary is only earned when it communicates interaction,
 * selection, grouping or elevation.
 */
export function Section({
  id,
  children,
  className,
  tight = false,
  bordered = true,
}: {
  id?: string;
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
        bordered && 'border-line border-t',
        tight ? 'py-16 md:py-20' : 'py-20 md:py-24',
        className,
      )}
    >
      <div className="shell-wide">{children}</div>
    </section>
  );
}

/**
 * The section kicker: an index, a hairline, and the label. Mono and tracked,
 * so it reads as a coordinate rather than a marketing eyebrow.
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
    <p className={cn('flex items-center gap-3', className)}>
      {index && <span className="text-acid label">{index}</span>}
      <span aria-hidden="true" className="bg-line h-px w-8" />
      <span className="text-muted label">{children}</span>
    </p>
  );
}
