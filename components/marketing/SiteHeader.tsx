'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';
import { nav, site } from '@/lib/site';
import { HelixMark } from '@/components/ui/HelixMark';
import { ButtonLink } from '@/components/ui/Button';

/**
 * The masthead.
 *
 * A bound folio's running head, not a floating glass bar: an edition line that
 * scrolls away, then a ruled masthead that stays. Opaque stock throughout —
 * paper does not blur what is behind it.
 */
export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    const raf = requestAnimationFrame(onScroll);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50">
      {/* Edition line — the folio slug, present on the first screen only. */}
      <div className="border-ink/12 bg-ink text-paper/70 border-b">
        <div className="shell-wide runhead flex h-7 items-center justify-between text-[9.5px] tracking-[0.24em]">
          <span>Vol. I · A field guide to machine descent</span>
          <span className="hidden sm:block">Concept edition · seeded fixtures · no live repositories</span>
          <span className="sm:hidden">Concept edition</span>
        </div>
      </div>

      <div
        className={cn(
          'bg-paper transition-shadow duration-300',
          scrolled || open
            ? 'border-ink/25 border-b shadow-[0_10px_24px_-22px_rgb(23_24_15/0.7)]'
            : 'border-ink/12 border-b',
        )}
      >
        <div className="shell-wide flex h-[66px] items-center justify-between gap-6">
          <Link href="/" className="flex shrink-0 items-baseline gap-3" aria-label={`${site.name} home`}>
            <HelixMark className="text-press-vermilion size-6 self-center" />
            <span className="font-display text-[25px] leading-none font-medium tracking-[-0.02em]">
              {site.name}
            </span>
            <span className="text-ink-faint runhead hidden text-[9px] sm:inline">Est. 2026</span>
          </Link>

          <nav aria-label="Primary" className="hidden items-center gap-8 lg:flex">
            {nav.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'runhead relative py-1.5 text-[10px] transition-colors',
                    active ? 'text-ink' : 'text-ink-muted hover:text-ink',
                  )}
                >
                  {item.label}
                  {/* the struck rule, not a colour swap */}
                  <span
                    aria-hidden="true"
                    className={cn(
                      'bg-press-vermilion absolute -bottom-px left-0 h-[2px] transition-all duration-200',
                      active ? 'w-full' : 'w-0',
                    )}
                  />
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <ButtonLink href="/#join" variant="secondary" size="sm" className="hidden sm:inline-flex">
              Join alpha
            </ButtonLink>

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? 'Close menu' : 'Open menu'}
              className="border-ink/40 text-ink-muted hover:text-ink hover:border-ink grid size-9 place-items-center border lg:hidden"
            >
              <span aria-hidden="true" className="font-mono text-sm">
                {open ? '×' : '≡'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {open && (
        <nav
          id="mobile-nav"
          aria-label="Primary mobile"
          className="border-ink/25 bg-paper-2 border-b lg:hidden"
        >
          <ul className="shell-wide flex flex-col py-2">
            {nav.map((item) => (
              <li key={item.href} className="border-ink/10 border-b last:border-0">
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="text-ink-soft hover:text-ink runhead block py-3.5 text-[11px]"
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li className="pt-4 pb-2">
              <ButtonLink href="/#join" variant="primary" size="sm" onClick={() => setOpen(false)}>
                Join alpha
              </ButtonLink>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
