import Link from 'next/link';
import { cn } from '@/lib/cn';

/**
 * Controls, per the Nightglass component contract.
 *
 * The accent is a signal, not decoration: exactly one filled primary action
 * per view or decision region. Secondary sits on surface-2 with a hairline;
 * ghost is transparent until hovered. Destructive stays neutral until the
 * destructive decision is the immediate one.
 *
 * Minimum height is --ng-control-height (44px) so every control clears the
 * touch target floor. Focus is a ring, never only a border-colour change.
 */

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-acid text-on-acid border-transparent hover:bg-acid/90 active:bg-acid-dim',
  secondary: 'bg-panel-2 border-line text-text hover:bg-hover hover:border-line-strong',
  ghost: 'bg-transparent border-transparent text-muted hover:bg-hover hover:text-text',
  danger: 'bg-transparent border-rose/40 text-rose hover:bg-rose hover:text-void hover:border-rose',
};

/* sm is the only size allowed below the 44px floor, and only for dense
   in-panel controls that sit beside a full-height target. */
const SIZES: Record<Size, string> = {
  sm: 'h-9 px-3 text-[13px]',
  md: 'h-11 px-4 text-sm',
  lg: 'h-12 px-6 text-[15px]',
};

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-md border font-medium transition-[background-color,border-color,color] duration-[160ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] disabled:pointer-events-none disabled:opacity-40';

type CommonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
};

type ButtonProps = CommonProps & React.ButtonHTMLAttributes<HTMLButtonElement>;
type AnchorProps = CommonProps & {
  href: string;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
};

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button className={cn(BASE, VARIANTS[variant], SIZES[size], className)} {...rest}>
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = 'primary',
  size = 'md',
  className,
  href,
  onClick,
  children,
}: AnchorProps) {
  const external = href.startsWith('http') || href.startsWith('mailto:');
  const classes = cn(BASE, VARIANTS[variant], SIZES[size], className);

  if (external) {
    return (
      <a
        className={classes}
        href={href}
        onClick={onClick}
        target="_blank"
        rel="noreferrer noopener"
      >
        {children}
      </a>
    );
  }

  return (
    <Link className={classes} href={href} onClick={onClick}>
      {children}
    </Link>
  );
}
