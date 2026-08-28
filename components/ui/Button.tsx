import Link from 'next/link';
import { cn } from '@/lib/cn';

/**
 * Letterpress controls.
 *
 * Square, ruled, set in tracked mono — a key struck into stock rather than a
 * glowing pill. The offset shadow is the emboss; pressing the control moves it
 * onto its own shadow, so the click has a physical read instead of a fade.
 *
 * Every variant is ground-agnostic: `bg-acid text-void` is a green block with
 * bone type on paper, and a phosphor block with dark type inside .instrument.
 */

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-acid text-void border-acid shadow-[3px_3px_0_0_var(--color-line-strong)] hover:shadow-[1px_1px_0_0_var(--color-line-strong)] hover:translate-x-[2px] hover:translate-y-[2px]',
  secondary:
    'bg-transparent border-line-strong text-text hover:bg-panel-2 hover:border-text shadow-[3px_3px_0_0_transparent] hover:shadow-[1px_1px_0_0_var(--color-line)] hover:translate-x-[2px] hover:translate-y-[2px]',
  ghost: 'bg-transparent border-transparent text-muted hover:text-text hover:border-line',
  danger: 'bg-transparent border-rose/50 text-rose hover:bg-rose hover:text-void hover:border-rose',
};

const SIZES: Record<Size, string> = {
  sm: 'px-3 py-[7px] text-[10px] tracking-[0.16em]',
  md: 'px-5 py-2.5 text-[11px] tracking-[0.18em]',
  lg: 'px-7 py-3.5 text-[12px] tracking-[0.2em]',
};

const BASE =
  'inline-flex items-center justify-center gap-2.5 rounded-none border font-mono font-semibold uppercase transition-all duration-150 ease-out active:translate-x-[3px] active:translate-y-[3px] active:shadow-none disabled:pointer-events-none disabled:opacity-40';

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
