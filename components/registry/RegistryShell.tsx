import { cn } from '@/lib/cn';

/**
 * Registry page shell.
 *
 * Previously this switched the registry onto a light ground. That was a
 * stylistic choice that has been reverted — the whole site is the original
 * dark palette again — so the shell is now purely structural: it reserves
 * full height and nothing else.
 */
export function RegistryShell({
  children,
  className,
  voice = 'reading',
}: {
  children: React.ReactNode;
  className?: string;
  /** `ui` = Instrument Sans for dense records. Docs and research stay `reading`. */
  voice?: 'reading' | 'ui';
}) {
  return (
    <div className={cn('min-h-screen', voice === 'ui' && 'font-ui', className)}>{children}</div>
  );
}

/**
 * Long-form reference surface — docs, research, policy. Same light ground,
 * constrained to a reading measure.
 */
export function ReadingShell({
  eyebrow,
  title,
  lede,
  children,
}: {
  eyebrow: string;
  title: string;
  lede?: string;
  children: React.ReactNode;
}) {
  return (
    <RegistryShell>
      <div className="shell py-16 md:py-20">
        <header className="border-line max-w-[42rem] border-b pb-10">
          <p className="text-acid label">{eyebrow}</p>
          <h1 className="text-headline mt-3">{title}</h1>
          {lede && <p className="text-muted mt-4 text-lead">{lede}</p>}
        </header>

        <div className="max-w-[42rem] pt-10">{children}</div>
      </div>
    </RegistryShell>
  );
}

/** A documentation section: hairline rule, heading, body. */
export function DocSection({
  id,
  heading,
  children,
}: {
  id?: string;
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mb-12">
      <h2 className="text-title mb-4">{heading}</h2>
      <div className="text-text-soft flex flex-col gap-4 leading-relaxed">{children}</div>
    </section>
  );
}

/** Fixed-width technical block: schemas, identifiers, file layouts. */
export function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="bg-panel-2 border-line overflow-x-auto rounded-lg border p-4 font-mono text-[12.5px] leading-relaxed">
      <code>{children}</code>
    </pre>
  );
}
