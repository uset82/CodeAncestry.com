'use client';

import Link from 'next/link';
import { useState } from 'react';
import { cn } from '@/lib/cn';
import { accessionHref, accessionKind, parseAccession } from '@/lib/schema/accession';

type Props = {
  accession: string;
  /** Link to the entity's canonical page when one exists. */
  link?: boolean;
  /** Offer a copy-to-clipboard affordance. */
  copyable?: boolean;
  /** Drop the prefix and show only the local id. */
  short?: boolean;
  size?: 'xs' | 'sm';
  className?: string;
};

/**
 * The registry's identity chrome. An accession is immutable and quotable, so it
 * is always monospaced, always copyable, and colour-coded by entity type with
 * the type name available to assistive technology.
 */
export function AccessionBadge({
  accession,
  link = true,
  copyable = true,
  short = false,
  size = 'sm',
  className,
}: Props) {
  const [copied, setCopied] = useState(false);
  const parsed = parseAccession(accession);
  const kind = accessionKind(accession);

  if (!parsed || !kind) {
    return <span className={cn('text-muted font-mono', className)}>{accession}</span>;
  }

  const href = link ? accessionHref(accession) : null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(parsed.accession);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  };

  const body = (
    <>
      {!short && (
        <span className={cn('font-bold', kind.tone)} aria-hidden="true">
          {parsed.prefix}
        </span>
      )}
      {!short && <span className="text-faint" aria-hidden="true">:</span>}
      <span className="text-text-soft">{parsed.localId}</span>
      <span className="sr-only">
        {' '}
        ({kind.label} accession {parsed.accession})
      </span>
    </>
  );

  const shell = cn(
    'inline-flex items-center gap-[2px] rounded-sm border bg-panel-2/70 font-mono tracking-tight',
    size === 'xs' ? 'px-1.5 py-[2px] text-nano' : 'px-2 py-[3px] text-[11px]',
    kind.border,
    className,
  );

  return (
    <span className="inline-flex items-center gap-1">
      {href ? (
        <Link
          href={href}
          className={cn(shell, 'transition-colors hover:border-current hover:bg-panel-3')}
        >
          {body}
        </Link>
      ) : (
        <span className={shell}>{body}</span>
      )}

      {copyable && (
        <button
          type="button"
          onClick={handleCopy}
          className="text-faint hover:text-text rounded-sm px-1 font-mono text-nano transition-colors"
          aria-label={`Copy accession ${parsed.accession}`}
        >
          {copied ? <span className="text-acid">copied</span> : <span aria-hidden="true">⧉</span>}
        </button>
      )}
    </span>
  );
}
