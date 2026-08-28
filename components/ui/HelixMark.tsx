import { cn } from '@/lib/cn';

/**
 * The wordmark glyph: two backbones crossing through four loci. Reads as a
 * helix at 16px and as a lineage fork at 96px, which is exactly the ambiguity
 * the brand wants.
 */
export function HelixMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn('size-6', className)}
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M8 2c0 4 8 6 8 10s-8 6-8 10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M16 2c0 4-8 6-8 10s8 6 8 10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.45"
      />
      <circle cx="12" cy="6.4" r="1.5" fill="currentColor" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      <circle cx="12" cy="17.6" r="1.5" fill="currentColor" opacity="0.55" />
    </svg>
  );
}
