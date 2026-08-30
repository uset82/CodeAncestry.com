'use client';

import { useId, useState } from 'react';
import { cn } from '@/lib/cn';
import { connectCta } from '@/lib/site';
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
        className="border-acid/30 bg-acid/[0.05] rounded-xl border p-6 md:p-8"
      >
        <p className="text-acid font-mono text-micro uppercase">Noted locally</p>
        <p className="mt-3 text-[19px] leading-snug font-semibold tracking-[-0.02em]">
          Thanks — {email} is on the list.
        </p>
        <p className="text-muted mt-3 text-[14.5px] leading-relaxed">
          Full disclosure: this prototype has no server, so nothing was transmitted anywhere. When
          the alpha is real, this form will send one message and never a newsletter.
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
          <label htmlFor={emailId} className="text-muted block font-mono text-nano uppercase">
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
              'bg-panel-2 mt-2 w-full rounded-md border px-3.5 py-3 text-[15px] transition-colors',
              'placeholder:text-faint',
              status === 'invalid' ? 'border-rose/60' : 'border-line focus:border-line-strong',
            )}
          />
          {status === 'invalid' && (
            <p id={errorId} className="text-rose mt-2 text-[13px]">
              That does not look like an email address yet.
            </p>
          )}
        </div>

        <div>
          <label htmlFor={roleId} className="text-muted block font-mono text-nano uppercase">
            What brings you here
          </label>
          <select
            id={roleId}
            name="role"
            value={role}
            onChange={(event) => setRole(event.target.value)}
            className="border-line bg-panel-2 focus:border-line-strong mt-2 w-full rounded-md border px-3.5 py-3 text-[15px] transition-colors"
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
            {status === 'submitting' ? 'Adding…' : connectCta.label}
          </Button>
          <p className="text-muted text-[13px]">
            Alpha waitlist — you will be invited to connect a repository. No newsletter.
          </p>
        </div>
      </div>
    </form>
  );
}
