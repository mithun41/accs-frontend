'use client';

import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const variants = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
  'danger-outline': 'btn-danger-outline',
  dark: 'btn-dark',
};

const sizes = { sm: 'btn-sm', md: '', lg: 'btn-lg', icon: 'btn-icon' };

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  href,
  className,
  children,
  icon: Icon,
  disabled,
  type = 'button',
  ...props
}) {
  const classes = cn('btn', variants[variant], sizes[size], className);
  const content = (
    <>
      {loading ? <Loader2 className="size-4 animate-spin" /> : Icon ? <Icon className="size-4" /> : null}
      {children}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={classes} {...props}>
        {content}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} disabled={disabled || loading} {...props}>
      {content}
    </button>
  );
}
