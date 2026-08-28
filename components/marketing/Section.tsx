import { cn } from '@/lib/cn';

/**
 * The homepage's structural rhythm. One section per idea, each announced by a
 * numbered eyebrow so a reader can tell how far through the argument they are.
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
        bordered && 'border-line/60 border-t',
        tight ? 'py-16 md:py-20' : 'py-24 md:py-32',
        className,
      )}
    >
      <div className="shell-wide">{children}</div>
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
