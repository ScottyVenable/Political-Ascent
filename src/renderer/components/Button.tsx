import type { PropsWithChildren, ButtonHTMLAttributes } from 'react';

/**
 * Button — the single styled button component used everywhere.
 *
 * The visual language follows the Bloodborne-inspired UI direction laid
 * out in `docs/UI_GAME_FEEL_PROPOSAL.md` §6.2:
 *
 *   - Sharp corners (`rounded-sm` = 2px, not the previous 4–6px).
 *   - Uppercase headline type with wide tracking — reads as "menu item"
 *     rather than "form control", which matches the institutional feel.
 *   - Pressed affordance: on `:active`, the button nudges down 1px. This
 *     is the single cheapest way to make a click feel physical.
 *   - Gold glow on hover for the primary variant — a subtle 12px shadow
 *     tinted with the gold accent colour. Disabled for secondary/ghost
 *     so those variants stay quiet.
 *   - Transitions run at 80ms (`duration-instant`) with the `standard`
 *     easing curve; anything longer feels mushy on rapid interactions.
 *
 * Variants:
 *  - `primary` | `gold`: gold call-to-action. Dominant action colour —
 *    use sparingly, one per region.
 *  - `secondary`: muted bordered button for alternatives.
 *  - `danger`: destructive confirmations.
 *  - `ghost`: transparent chrome for close/back/dismiss affordances.
 */
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'danger' | 'ghost' | 'gold' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
}

// Every variant shares the same "press-down on active" and focus-visible
// ring. Those are declared on the base class string so they can't drift
// between variants.
const BASE =
  'inline-flex items-center justify-center gap-2 rounded-sm font-headline ' +
  'uppercase tracking-widest transition-all duration-instant ease-[cubic-bezier(0.4,0,0.2,1)] ' +
  'active:translate-y-px select-none ' +
  'disabled:opacity-40 disabled:cursor-not-allowed disabled:active:translate-y-0';

// Gold-on-near-black reads best against the dark panels; `brightness-110`
// on hover is a subtle lift. The `shadow-glow-gold` on hover is what
// actually makes the button feel like a physical, lit-from-within
// interactive element.
const GOLD_CLS =
  'bg-accent-gold text-bg-primary ' +
  'hover:brightness-110 hover:shadow-glow-gold ' +
  'disabled:bg-bg-tertiary disabled:text-text-muted disabled:shadow-none';

const VARIANT_CLS: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: GOLD_CLS,
  gold: GOLD_CLS,
  danger:
    'bg-accent-red text-text-primary hover:brightness-110 hover:shadow-glow-danger ' +
    'disabled:bg-bg-tertiary disabled:text-text-muted disabled:shadow-none',
  ghost:
    'bg-transparent text-text-secondary hover:text-text-primary hover:bg-bg-tertiary/60',
  secondary:
    'bg-transparent text-text-secondary border border-rule-strong ' +
    'hover:text-text-primary hover:border-accent-gold hover:bg-bg-tertiary/40',
};

const SIZE_CLS: Record<NonNullable<ButtonProps['size']>, string> = {
  // Sizes are tuned so the horizontal padding visually dominates the
  // vertical — wide rectangles read as "menu entries", not chunky web
  // buttons.
  sm: 'px-3 py-1 text-[0.6875rem]',
  md: 'px-5 py-2 text-xs',
  lg: 'px-7 py-2.5 text-sm',
};

export function Button(props: PropsWithChildren<ButtonProps>): JSX.Element {
  const { variant = 'primary', size = 'md', className = '', children, ...rest } = props;
  return (
    <button
      className={`${BASE} ${VARIANT_CLS[variant]} ${SIZE_CLS[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
