'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';
import { nav, site } from '@/lib/site';
import { HelixMark } from '@/components/ui/HelixMark';
import { ButtonLink } from '@/components/ui/Button';

/**
 * Persistent navigation.
 *
 * Nightglass: keep persistent headers quiet and let the page identity remain
 * dominant. Typography, spacing and one active indicator before any container.
 * Height is the 4rem header budget, so the hero can subtract it cleanly.
 */
export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-40 transition-[background-color,border-color] duration-[220ms]',
        scrolled || open
          ? 'border-line bg-void/90 border-b backdrop-blur-md'
          : 'border-b border-transparent',
      )}
    >
      <div className="shell-wide flex h-16 items-center justify-between gap-6">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5"
          aria-label={`${site.name} home`}
        >
          <HelixMark className="text-acid size-5" />
          <span className="text-[15px] font-medium tracking-[-0.02em]">{site.name}</span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
          {nav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'rounded-md px-3 py-2 text-[13.5px] transition-colors duration-[160ms]',
                  active ? 'text-acid' : 'text-muted hover:text-text hover:bg-hover',
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <ButtonLink href="/#join" variant="secondary" size="sm" className="hidden sm:inline-flex">
            Join alpha
          </ButtonLink>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? 'Close menu' : 'Open menu'}
            className="border-line text-muted hover:text-text hover:bg-hover grid size-11 place-items-center rounded-md border lg:hidden"
          >
            <span aria-hidden="true" className="text-base">
              {open ? '×' : '≡'}
            </span>
          </button>
        </div>
      </div>

      {open && (
        <nav
          id="mobile-nav"
          aria-label="Primary mobile"
          className="border-line bg-void border-t lg:hidden"
        >
          <ul className="shell-wide flex flex-col py-2">
            {nav.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    /* Closed on navigation here rather than in an effect keyed
                       on pathname, which would set state during render. */
                    onClick={() => setOpen(false)}
                    className={cn(
                      'flex h-12 items-center text-[15px]',
                      active ? 'text-acid' : 'text-text-soft',
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
            <li className="py-3">
              <ButtonLink href="/#join" variant="primary" size="md" onClick={() => setOpen(false)}>
                Join alpha
              </ButtonLink>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
