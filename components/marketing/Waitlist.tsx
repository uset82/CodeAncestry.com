'use client';

import { useId, useState } from 'react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';

/**
 * Waitlist capture.
 *
 * There is no backend yet, and the copy says so rather than implying a list
 * exists. Validation is client-side and the success state is honest about what
 * did and did not happen.
 */

type Status = 'idle' | 'invalid' | 'submitting' | 'done';

const ROLES = [
  { value: 'maintainer', label: 'Open-source maintainer' },
  { value: 'platform', label: 'Platform / DevEx engineer' },
  { value: 'agent-builder', label: 'Building AI agents' },
  { value: 'security', label: 'Security / supply chain' },
  { value: 'research', label: 'Research' },
  { value: 'curious', label: 'Just curious' },
] as const;

/** Deliberately simple: enough to catch a typo, not enough to reject a valid address. */
const looksLikeEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());

export function WaitlistForm() {
  const emailId = useId();
  const roleId = useId();
  const errorId = useId();

  const [email, setEmail] = useState('');
  const [role, setRole] = useState<string>('maintainer');
  const [status, setStatus] = useState<Status>('idle');

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!looksLikeEmail(email)) {
      setStatus('invalid');
      return;
    }

    setStatus('submitting');
    // Optimistic: there is no endpoint to await. The delay only keeps the
    // transition legible instead of snapping.
    window.setTimeout(() => setStatus('done'), 420);
  };

  if (status === 'done') {
    return (
      <div
        role="status"
        className="border-acid bg-paper-2 border-t-[3px] px-6 py-7 md:px-8 md:py-8"
      >
        <p className="text-acid runhead text-[9.5px]">Noted locally</p>
        <p className="font-display mt-4 text-[26px] leading-[1.1] tracking-[-0.015em]">
          Thanks — {email} is on the list.
        </p>
        <p className="text-muted mt-3 text-[14.5px] leading-relaxed">
          Soon you will be able to join the official list. Full disclosure: this prototype has no
          server yet, so nothing was transmitted. When the alpha opens, this form will send one message and never a newsletter.
        </p>
        <button
          type="button"
          onClick={() => {
            setEmail('');
            setStatus('idle');
          }}
          className="text-muted hover:text-text mt-5 font-mono text-nano uppercase underline decoration-dotted"
        >
          Add another address
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="max-w-[520px]">
      <div className="flex flex-col gap-4">
        <div>
          <label htmlFor={emailId} className="text-ink-muted runhead block text-[9.5px]">
            Email
          </label>
          <input
            id={emailId}
            type="email"
            name="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (status === 'invalid') setStatus('idle');
            }}
            aria-invalid={status === 'invalid'}
            aria-describedby={status === 'invalid' ? errorId : undefined}
            className={cn(
              'bg-paper-2 mt-2.5 w-full border px-3.5 py-3 text-[15px] transition-colors',
              'placeholder:text-faint',
              status === 'invalid' ? 'border-rose' : 'border-ink/35 focus:border-ink',
            )}
          />
          {status === 'invalid' && (
            <p id={errorId} className="text-rose mt-2 text-[13px]">
              That does not look like an email address yet.
            </p>
          )}
        </div>

        <div>
          <label htmlFor={roleId} className="text-ink-muted runhead block text-[9.5px]">
            What brings you here
          </label>
          <select
            id={roleId}
            name="role"
            value={role}
            onChange={(event) => setRole(event.target.value)}
            className="border-ink/35 bg-paper-2 focus:border-ink mt-2.5 w-full border px-3.5 py-3 text-[15px] transition-colors"
          >
            {ROLES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <Button type="submit" size="lg" disabled={status === 'submitting'}>
            {status === 'submitting' ? 'Adding…' : 'Join the alpha list'}
          </Button>
          <p className="text-faint text-[13px]">
            Soon you will be able to join the list. No newsletter. One message when it opens.
          </p>
        </div>
      </div>
    </form>
  );
}
