import type { PropsWithChildren, ButtonHTMLAttributes } from 'react';

/**
 * Button — the single styled button component used everywhere.
 *
 * Variants:
 *  - `primary`: gold call-to-action. The dominant action colour of the UI
 *    per the Bloodborne reference. Use sparingly — only for the most
 *    important action in a region (Draft, Play, Begin, Start quest).
 *  - `secondary`: muted bordered button for alternative/less-important
 *    actions that should not compete with `primary`.
 *  - `danger`: destructive confirmations (Delete save, Resign, etc.).
 *  - `ghost`: transparent chrome for close/back/dismiss affordances.
 *  - `gold`: retained for callers that explicitly request gold; functionally
 *    identical to `primary` since the rebrand.
 *
 * Rationale for the rebrand: the previous `primary` variant was blue
 * (`bg-accent-blue`), which fought the rest of the Bloodborne-inspired
 * palette — gold is meant to be *the* accent colour, and every screen now
 * honours that. See `docs/research/ui-audit-2026-04.md`.
 */
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'danger' | 'ghost' | 'gold' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
}

// Gold-on-near-black reads best against the dark panels; `brightness-110`
// on hover is a subtle lift that preserves the restrained aesthetic (rather
// than a jarring hue shift).
const GOLD_CLS =
  'bg-accent-gold text-bg-primary hover:brightness-110 disabled:bg-bg-tertiary disabled:text-text-muted';

const VARIANT_CLS: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: GOLD_CLS,
  gold: GOLD_CLS,
  danger: 'bg-accent-red text-white hover:brightness-110 disabled:bg-bg-tertiary disabled:text-text-muted',
  ghost: 'bg-transparent text-text-primary hover:bg-bg-tertiary',
  secondary:
    'bg-bg-tertiary text-text-primary hover:bg-bg-secondary border border-accent-gold/30',
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
