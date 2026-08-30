'use client';

import type { MouseEvent } from 'react';
import { ButtonLink } from '@/components/ui/Button';

const scrollToWaitlist = (event: MouseEvent<HTMLAnchorElement>) => {
  const node = document.getElementById('waitlist');
  if (!node) return;
  event.preventDefault();
  const top = window.scrollY + node.getBoundingClientRect().top - 80;
  window.scrollTo({ top, behavior: 'instant' });
  window.history.pushState(null, '', '/#waitlist');
  const email = node.querySelector<HTMLInputElement>('input[type="email"]');
  email?.focus();
};

/**
 * Specified close buttons. Connect is the alpha waitlist — not a fake OAuth.
 */
export function CloseCtas({ className }: { className?: string }) {
  return (
    <div className={className}>
      <ButtonLink href="/#waitlist" size="lg" onClick={scrollToWaitlist}>
        Connect a Repository
      </ButtonLink>
      <ButtonLink href="/explore" variant="secondary" size="lg">
        Explore CodeAncestry
      </ButtonLink>
    </div>
  );
}
