'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useId, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react';
import { cn } from '@/lib/cn';
import { connectCta, nav, site, type NavItem } from '@/lib/site';
import { HelixMark } from '@/components/ui/HelixMark';
import { ButtonLink } from '@/components/ui/Button';

const isActive = (pathname: string, href: string) =>
  pathname === href || (href !== '/' && !href.includes('#') && pathname.startsWith(`${href}/`));

const handleHashNav = (event: ReactMouseEvent<HTMLAnchorElement>, href: string) => {
  if (!href.startsWith('/#')) return;
  const node = document.getElementById(href.slice(2));
  if (!node) return;
  event.preventDefault();
  const top = window.scrollY + node.getBoundingClientRect().top - 80;
  window.scrollTo({ top, behavior: 'instant' });
  window.history.pushState(null, '', href);
};

export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 24);
    const raf = requestAnimationFrame(handleScroll);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleToggleMenu = () => setOpen((value) => !value);

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
          {nav.map((item) =>
            item.menu ? (
              <NavDisclosure key={item.label} item={item} pathname={pathname} />
            ) : (
              <Link
                key={item.label}
                href={item.href}
                onClick={(event) => handleHashNav(event, item.href)}
                aria-current={isActive(pathname, item.href) ? 'page' : undefined}
                className={cn(
                  'text-[13px] transition-colors',
                  isActive(pathname, item.href) ? 'text-text' : 'text-muted hover:text-text',
                )}
              >
                {item.label}
              </Link>
            ),
          )}
        </nav>

        <div className="flex items-center gap-2">
          <ButtonLink
            href={connectCta.href}
            variant="secondary"
            size="sm"
            className="hidden sm:inline-flex"
          >
            {connectCta.label}
            <span className="text-faint ml-1.5 font-mono text-nano uppercase">{connectCta.hint}</span>
          </ButtonLink>

          <button
            type="button"
            onClick={handleToggleMenu}
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
              <li key={item.label}>
                <Link
                  href={item.href}
                  onClick={(event) => {
                    handleHashNav(event, item.href);
                    setOpen(false);
                  }}
                  className="text-text-soft hover:text-text block py-2.5 text-sm"
                >
                  {item.label}
                </Link>
                {item.menu && (
                  <ul className="border-line/70 mb-2 ml-3 border-l pl-3">
                    {item.menu.map((entry) => (
                      <li key={`${item.label}-${entry.label}`}>
                        <Link
                          href={entry.href}
                          onClick={() => setOpen(false)}
                          className="text-muted hover:text-text block py-1.5 text-[13px]"
                        >
                          {entry.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
            <li className="pt-2">
              <ButtonLink
                href={connectCta.href}
                variant="primary"
                size="sm"
                onClick={() => setOpen(false)}
              >
                {connectCta.label}
                <span className="text-on-acid/70 ml-1.5 font-mono text-nano uppercase">
                  {connectCta.hint}
                </span>
              </ButtonLink>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}

const NavDisclosure = ({ item, pathname }: { item: NavItem; pathname: string }) => {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    const handlePointer = (event: MouseEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, []);

  const handleToggle = () => setOpen((value) => !value);

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        aria-haspopup="true"
        onClick={handleToggle}
        className={cn(
          'text-[13px] transition-colors',
          isActive(pathname, item.href) || open ? 'text-text' : 'text-muted hover:text-text',
        )}
      >
        {item.label}
      </button>
      {open && item.menu && (
        <ul
          id={menuId}
          className="border-line bg-panel/95 absolute top-[calc(100%+12px)] left-0 min-w-[11rem] border p-2 shadow-lg backdrop-blur-xl"
        >
          {item.menu.map((entry) => (
            <li key={entry.label}>
              <Link
                href={entry.href}
                onClick={() => setOpen(false)}
                className="text-text-soft hover:bg-hover hover:text-text block px-3 py-2 text-[13px]"
              >
                {entry.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
