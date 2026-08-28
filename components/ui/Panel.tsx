import { cn } from '@/lib/cn';

/**
 * A print mounted on card. Hard rule, one crisp offset, no blur and no glass —
 * frosted panels belong to a different century than the rest of this site.
 */
export function Panel({
  className,
  children,
  as: Tag = 'div',
}: {
  className?: string;
  children: React.ReactNode;
  as?: 'div' | 'section' | 'article' | 'aside';
}) {
  return <Tag className={cn('plate', className)}>{children}</Tag>;
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
        'border-line bg-panel-2/60 flex min-h-14 flex-wrap items-center justify-between gap-3 border-b px-4 py-2.5',
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * The plate heading: a numbered rule across the page, the index hanging in the
 * margin the way a folio number does.
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
    <div className={cn('mb-9', className)}>
      <div className="border-ink/25 mb-5 flex items-baseline gap-4 border-b pb-2.5">
        <span className="text-press-vermilion runhead">{index}</span>
        <span className="bg-ink/15 h-px flex-1" />
        <span className="text-ink-faint runhead hidden sm:block">CodeAncestry</span>
      </div>

      <div className="flex flex-col items-start justify-between gap-5 md:flex-row md:items-end md:gap-12">
        <h2 className="text-headline max-w-[16ch] text-balance">{title}</h2>
        {lede && (
          <p className="text-ink-soft max-w-[42ch] text-[15.5px] leading-[1.65]">{lede}</p>
        )}
      </div>
    </div>
  );
}

export type Stat = {
  label: string;
  value: React.ReactNode;
  hint?: string;
};

/** A measurements table, set the way a specimen record sets them. */
export function StatRail({ stats, className }: { stats: readonly Stat[]; className?: string }) {
  return (
    <dl className={cn('flex flex-wrap gap-x-12 gap-y-5', className)}>
      {stats.map((stat) => (
        <div key={stat.label} className="border-ink/30 min-w-[130px] border-t pt-2.5">
          <dt className="text-muted runhead text-[10px]">{stat.label}</dt>
          <dd className="mt-1.5 font-mono text-lg leading-tight font-medium">
            {stat.value}
            {stat.hint && <span className="text-faint ml-2 text-[11px]">{stat.hint}</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * Status marker. Was a glowing dot; now an inked square with a hairline ring,
 * which survives being printed and does not pretend the page is a server rack.
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
    <span className="text-muted runhead flex items-center gap-2 text-[10px]">
      <span
        aria-hidden="true"
        className="border-line-strong relative grid size-[11px] place-items-center border"
      >
        <span className={cn('size-[5px] animate-[breathe_5s_ease-in-out_infinite]', color)} />
      </span>
      {label}
    </span>
  );
}
