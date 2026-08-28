'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';
import { nav, site } from '@/lib/site';
import { HelixMark } from '@/components/ui/HelixMark';
import { ButtonLink } from '@/components/ui/Button';

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
    <header
      className={cn(
        'sticky top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-300',
        scrolled || open
          ? 'border-line bg-void/85 border-b backdrop-blur-xl'
          : 'border-b border-transparent',
      )}
    >
      <div className="shell-wide flex h-[74px] items-center justify-between gap-6">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5 font-bold tracking-[-0.03em]"
          aria-label={`${site.name} home`}
        >
          <HelixMark className="text-acid size-6" />
          <span className="text-[17px]">{site.name}</span>
          <span className="text-acid border-acid/30 hidden rounded-full border px-[6px] py-[3px] font-mono text-nano uppercase sm:inline">
            concept
          </span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-7 lg:flex">
          {nav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'text-[13px] transition-colors',
                  active ? 'text-text' : 'text-muted hover:text-text',
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
            className="border-line text-muted hover:text-text grid size-9 place-items-center rounded-sm border lg:hidden"
          >
            <span aria-hidden="true" className="font-mono text-sm">
              {open ? '✕' : '≡'}
            </span>
          </button>
        </div>
      </div>

      {open && (
        <nav
          id="mobile-nav"
          aria-label="Primary mobile"
          className="border-line bg-void/95 border-t backdrop-blur-xl lg:hidden"
        >
          <ul className="shell-wide flex flex-col py-3">
            {nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="text-text-soft hover:text-text block py-2.5 text-sm"
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li className="pt-2">
              <ButtonLink
                href="/#join"
                variant="primary"
                size="sm"
                onClick={() => setOpen(false)}
              >
                Join alpha
              </ButtonLink>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
