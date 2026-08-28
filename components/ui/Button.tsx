import Link from 'next/link';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-acid text-void border-transparent font-extrabold hover:shadow-[0_0_34px_rgb(183_255_57/0.22)]',
  secondary: 'bg-transparent border-line text-text hover:border-line-strong hover:bg-panel-2',
  ghost: 'bg-transparent border-transparent text-muted hover:text-text hover:bg-panel-2',
  danger: 'bg-transparent border-rose/40 text-rose hover:bg-rose/10',
};

const SIZES: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-6 py-3.5 text-[15px]',
};

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-full border font-bold transition-[color,background-color,border-color,box-shadow] duration-200 disabled:pointer-events-none disabled:opacity-45';

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
