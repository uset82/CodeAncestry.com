'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';
import { handleHashNav, isHomeHash } from '@/lib/hash-nav';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-acid text-on-acid border-transparent hover:bg-acid-dim',
  secondary: 'bg-transparent border-line text-text hover:border-line-strong hover:bg-panel-2',
  ghost: 'bg-transparent border-transparent text-muted hover:text-text hover:bg-panel-2',
  danger: 'bg-transparent border-rose/40 text-rose hover:bg-rose/10',
};

const SIZES: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-6 py-3.5 text-[15px]',
};

/* Not a pill. The design contract reserves the full radius for binary filters,
   compact status and tags — an ordinary action reads as a control, and a glow
   shadow behind it is decoration standing in for hierarchy. */
const BASE =
  'inline-flex items-center justify-center gap-2 rounded-xs border font-medium tracking-tight transition-[color,background-color,border-color] duration-200 disabled:pointer-events-none disabled:opacity-45';

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

  const pathname = usePathname();

  const handleClick: React.MouseEventHandler<HTMLAnchorElement> = (event) => {
    handleHashNav(event, href);
    onClick?.(event);
  };

  if (external) {
    return (
      <a
        className={classes}
        href={href}
        onClick={handleClick}
        target="_blank"
        rel="noreferrer noopener"
      >
        {children}
      </a>
    );
  }

  /* Same-page hashes stay on `<a>` so Next cannot drop `?helix=`.
     Cross-page `/#join` stays on Link so the router can leave /explore. */
  if (isHomeHash(href, pathname)) {
    return (
      <a className={classes} href={href} onClick={handleClick}>
        {children}
      </a>
    );
  }

  return (
    <Link className={classes} href={href} onClick={handleClick}>
      {children}
    </Link>
  );
}
