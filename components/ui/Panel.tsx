import { cn } from '@/lib/cn';

export function Panel({
  className,
  children,
  as: Tag = 'div',
}: {
  className?: string;
  children: React.ReactNode;
  as?: 'div' | 'section' | 'article' | 'aside';
}) {
  return (
    <Tag
      className={cn(
        'border-line bg-panel/75 rounded-xl border backdrop-blur-[2px]',
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
        'mb-9 flex flex-col items-start justify-between gap-5 md:flex-row md:items-end md:gap-10',
        className,
      )}
    >
      <div>
        <span className="text-acid font-mono text-micro uppercase">{index}</span>
        <h2 className="text-headline mt-2 text-balance">{title}</h2>
      </div>
      {lede && <p className="text-muted max-w-[420px] leading-relaxed">{lede}</p>}
    </div>
  );
}

export type Stat = {
  label: string;
  value: React.ReactNode;
  hint?: string;
};

export function StatRail({ stats, className }: { stats: readonly Stat[]; className?: string }) {
  return (
    <dl className={cn('flex flex-wrap gap-x-10 gap-y-4', className)}>
      {stats.map((stat) => (
        <div key={stat.label} className="border-line min-w-[130px] border-t pt-2.5">
          <dt className="text-muted font-mono text-nano uppercase">{stat.label}</dt>
          <dd className="mt-1 text-lg leading-tight font-semibold tracking-tight">
            {stat.value}
            {stat.hint && (
              <span className="text-faint ml-2 text-[11px] font-normal">{stat.hint}</span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** Live-status pill used on interactive panels. */
export function StatusDot({ label, tone = 'acid' }: { label: string; tone?: 'acid' | 'cyan' | 'violet' }) {
  const color =
    tone === 'acid' ? 'bg-acid' : tone === 'cyan' ? 'bg-cyan' : 'bg-violet';
  const glow =
    tone === 'acid'
      ? 'shadow-[0_0_14px_var(--color-acid)]'
      : tone === 'cyan'
        ? 'shadow-[0_0_14px_var(--color-cyan)]'
        : 'shadow-[0_0_14px_var(--color-violet)]';

  return (
    <span className="text-muted flex items-center gap-2 font-mono text-nano uppercase">
      <span aria-hidden="true" className={cn('size-[7px] rounded-full', color, glow)} />
      {label}
    </span>
  );
}
