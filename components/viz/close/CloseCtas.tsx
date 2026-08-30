'use client';

import { ButtonLink } from '@/components/ui/Button';

const handleFocusWaitlist = () => {
  const email = document.querySelector<HTMLInputElement>('#waitlist input[type="email"]');
  email?.focus();
};

/**
 * Specified close buttons. Connect is the alpha waitlist — not a fake OAuth.
 * Hash scroll lives on ButtonLink — Next intercepts `#` otherwise.
 */
export function CloseCtas({ className }: { className?: string }) {
  return (
    <div className={className}>
      <ButtonLink href="/#waitlist" size="lg" onClick={handleFocusWaitlist}>
        Connect a Repository
      </ButtonLink>
      <ButtonLink href="/explore" variant="secondary" size="lg">
        Explore CodeAncestry
      </ButtonLink>
    </div>
  );
}
