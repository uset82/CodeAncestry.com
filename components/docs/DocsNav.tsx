'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';
import { DOCS_NAV } from '@/lib/docs/nav';

export function DocsNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Documentation">
      <details className="lg:hidden">
        <summary className="border-line text-muted hover:text-text cursor-pointer list-none rounded-md border px-3 py-2 font-mono text-[12px] uppercase tracking-[0.08em]">
          Protocol pages
        </summary>
        <div className="mt-4">
          <NavGroups pathname={pathname} />
        </div>
      </details>
      <div className="hidden lg:block">
        <NavGroups pathname={pathname} />
      </div>
    </nav>
  );
}

const NavGroups = ({ pathname }: { pathname: string }) => (
  <div className="flex flex-col gap-8">
    {DOCS_NAV.map((group) => (
      <div key={group.heading}>
        <p className="text-faint label mb-3">{group.heading}</p>
        <ul className="flex flex-col gap-px">
          {group.items.map((item) => {
            const active = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'block rounded-md px-2.5 py-2 transition-colors',
                    active
                      ? 'bg-panel-2 text-text'
                      : 'text-muted hover:bg-hover hover:text-text',
                  )}
                >
                  <span className="block text-[14px] font-medium">{item.label}</span>
                  <span className="text-faint mt-0.5 block text-[12px] leading-snug">
                    {item.detail}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    ))}
  </div>
);
