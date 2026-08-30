import type { MouseEvent } from 'react';

/** Sticky header height. Instant scroll, not smooth — Next intercepts `#`. */
const HEADER_OFFSET = 80;

/**
 * Scroll to an in-page hash. Returns true if the node existed.
 * `behavior: instant` — Next.js otherwise eats `<a href="#…">`.
 */
export function scrollToHashId(id: string): boolean {
  if (typeof document === 'undefined') return false;
  const node = document.getElementById(id);
  if (!node) return false;
  const top = window.scrollY + node.getBoundingClientRect().top - HEADER_OFFSET;
  window.scrollTo({ top, behavior: 'instant' });
  return true;
}

/** True when this hash already lives on the homepage we are reading. */
export function isHomeHash(href: string, pathname: string): boolean {
  return pathname === '/' && (href.startsWith('/#') || href.startsWith('#'));
}

/** Handle `/#join` and `#waitlist`. No-op for ordinary routes. */
export function handleHashNav(event: MouseEvent<HTMLAnchorElement>, href: string) {
  const id = href.startsWith('/#') ? href.slice(2) : href.startsWith('#') ? href.slice(1) : null;
  if (!id) return;
  if (!scrollToHashId(id)) return;
  event.preventDefault();
  const next = `${window.location.pathname}${window.location.search}#${id}`;
  window.history.pushState(null, '', next);
}
