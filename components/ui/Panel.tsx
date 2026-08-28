import { cn } from '@/lib/cn';

/**
 * A grouped surface.
 *
 * Nightglass is cardless by default: hairline structure and surface steps come
 * before shadows, and a boundary is only justified when it communicates
 * interaction, selection, grouping or elevation. Panel is that justified case —
 * it groups. It does not float unless asked to.
 */
export function Panel({
  className,
  children,
  as: Tag = 'div',
  floating = false,
}: {
  className?: string;
  children: React.ReactNode;
  as?: 'div' | 'section' | 'article' | 'aside';
  floating?: boolean;
}) {
  return (
    <Tag
      className={cn(
        'bg-panel border-line rounded-lg border',
        floating && 'shadow-[0_24px_64px_rgb(0_0_0/0.42)]',
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export function PanelHeader({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'border-line flex min-h-14 flex-wrap items-center justify-between gap-3 border-b px-4 py-2.5',
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * Section heading for registry surfaces. Utility copy: the heading names the
 * area, the lede explains scope or decision value. No marketing metaphors
 * inside operational screens.
 */
export function SectionHead({
  index,
  title,
  lede,
  className,
}: {
  index: string;
  title: React.ReactNode;
  lede?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end md:gap-12',
        className,
      )}
    >
      <div>
        <span className="text-acid label">{index}</span>
        <h2 className="text-headline mt-2">{title}</h2>
      </div>
      {lede && <p className="text-muted max-w-[42ch] text-[15px] leading-relaxed">{lede}</p>}
    </div>
  );
}

export type Stat = {
  label: string;
  value: React.ReactNode;
  hint?: string;
};

/** Measurements. Tabular figures so the column reads as a column. */
export function StatRail({ stats, className }: { stats: readonly Stat[]; className?: string }) {
  return (
    <dl className={cn('flex flex-wrap gap-x-10 gap-y-5', className)}>
      {stats.map((stat) => (
        <div key={stat.label} className="border-line min-w-[130px] border-t pt-2.5">
          <dt className="text-muted label">{stat.label}</dt>
          <dd
            data-numeric
            className="mt-1.5 font-mono text-lg leading-tight font-medium tracking-tight"
          >
            {stat.value}
            {stat.hint && <span className="text-faint ml-2 text-[11px]">{stat.hint}</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * Live-status marker. The dot carries colour; the label carries the meaning,
 * so colour is never the only channel.
 */
export function StatusDot({
  label,
  tone = 'acid',
}: {
  label: string;
  tone?: 'acid' | 'cyan' | 'violet';
}) {
  const color = tone === 'acid' ? 'bg-acid' : tone === 'cyan' ? 'bg-cyan' : 'bg-violet';

  return (
    <span className="text-muted label flex items-center gap-2">
      <span
        aria-hidden="true"
        className={cn('size-1.5 rounded-full animate-[breathe_4s_ease-in-out_infinite]', color)}
      />
      {label}
    </span>
  );
}
