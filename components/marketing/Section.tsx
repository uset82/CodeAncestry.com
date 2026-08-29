import { cn } from '@/lib/cn';
import type { BeatSide } from '@/components/viz/helix/beats';

export function Section({
  id,
  beat,
  beatSide,
  children,
  className,
  tight = false,
  bordered = true,
}: {
  id?: string;
  /** Homepage helix pose. Reordering this attribute retargets the scene. */
  beat?: number;
  /**
   * Where body copy sits. Required with `beat`. No default — a missing side
   * is a bug, not a guess. The specimen takes the opposite side.
   */
  beatSide?: BeatSide;
  children: React.ReactNode;
  className?: string;
  tight?: boolean;
  bordered?: boolean;
}) {
  if (beat !== undefined && beatSide === undefined) {
    throw new Error(
      `Section${id ? `#${id}` : ''} beat=${beat} has body copy on a 3D beat and must declare beatSide`,
    );
  }

  return (
    <section
      id={id}
      {...(beat !== undefined ? { 'data-beat': beat, 'data-beat-side': beatSide } : {})}
      className={cn(
        'relative',
        bordered && 'border-line/60 border-t',
        tight ? 'py-16 md:py-20' : 'py-24 md:py-32',
        className,
      )}
    >
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
