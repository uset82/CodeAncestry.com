'use client';

import { ButtonLink } from '@/components/ui/Button';
import { connectCta } from '@/lib/site';

const handleFocusWaitlist = () => {
  const email = document.querySelector<HTMLInputElement>('#waitlist input[type="email"]');
  email?.focus();
};

/**
 * Close actions. One verb with the header: Connect Repository is the alpha
 * invite, not a fake OAuth. Hash scroll lives on ButtonLink.
 */
export function CloseCtas({ className }: { className?: string }) {
  return (
    <div className={className}>
      <ButtonLink href={connectCta.href} size="lg" onClick={handleFocusWaitlist}>
        {connectCta.label}
      </ButtonLink>
      <ButtonLink href="/explore" variant="secondary" size="lg">
        Explore CodeAncestry
      </ButtonLink>
    </div>
  );
}
