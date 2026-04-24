import type { PropsWithChildren, ButtonHTMLAttributes } from 'react';

/**
 * Button — the single styled button component used everywhere.
 *
 * Variants: primary (blue), danger (red), ghost (transparent), gold.
 */
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'danger' | 'ghost' | 'gold' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
}

const VARIANT_CLS: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-accent-blue text-white hover:bg-blue-500 disabled:bg-bg-tertiary disabled:text-text-muted',
  danger: 'bg-accent-red text-white hover:bg-red-500 disabled:bg-bg-tertiary disabled:text-text-muted',
  ghost: 'bg-transparent text-text-primary hover:bg-bg-tertiary',
  gold: 'bg-accent-gold text-bg-primary hover:brightness-110 disabled:bg-bg-tertiary disabled:text-text-muted',
  secondary: 'bg-bg-tertiary text-text-primary hover:bg-bg-secondary border border-bg-tertiary',
};

const SIZE_CLS: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'px-2.5 py-1 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export function Button(props: PropsWithChildren<ButtonProps>): JSX.Element {
  const { variant = 'primary', size = 'md', className = '', children, ...rest } = props;
  return (
    <button
      className={`rounded font-headline font-medium transition-colors ${VARIANT_CLS[variant]} ${SIZE_CLS[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
