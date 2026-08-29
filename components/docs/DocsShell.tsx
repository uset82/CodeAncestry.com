import { RegistryShell } from '@/components/registry/RegistryShell';
import { DocsNav } from '@/components/docs/DocsNav';
import { cn } from '@/lib/cn';

/**
 * Shared reading frame for /docs.
 *
 * Light ground, sticky sidebar, a measure wide enough for tables and schemas.
 * Individual pages supply the article; this shell never re-wraps them in
 * ReadingShell (that measure is too narrow for a schema viewer).
 */
export function DocsShell({ children }: { children: React.ReactNode }) {
  return (
    <RegistryShell>
      <div className="shell-wide py-12 md:py-16">
        <div className="lg:grid lg:grid-cols-[17rem_minmax(0,1fr)] lg:items-start lg:gap-16">
          <aside className="mb-10 lg:sticky lg:top-24 lg:mb-0 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto">
            <DocsNav />
          </aside>
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </RegistryShell>
  );
}

export function DocsArticle({
  eyebrow,
  title,
  lede,
  wide = false,
  children,
}: {
  eyebrow: string;
  title: string;
  lede?: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <article>
      <header className="border-line max-w-[46rem] border-b pb-10">
        <p className="text-acid label">{eyebrow}</p>
        <h1 className="text-headline mt-3">{title}</h1>
        {lede && <p className="text-muted mt-4 text-lead">{lede}</p>}
      </header>
      <div className={cn('pt-10', wide ? 'max-w-[68rem]' : 'max-w-[46rem]')}>{children}</div>
    </article>
  );
}
