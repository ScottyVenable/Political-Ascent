import type { PropsWithChildren, HTMLAttributes, ReactNode } from 'react';

/**
 * Card — a ruled panel used to group related UI.
 *
 * Visual language (UI_GAME_FEEL_PROPOSAL §6.1):
 *   - Sharp corners (`rounded-sm`) instead of the previous 8px radius;
 *     reads as an institutional document rather than a web widget.
 *   - Accent colour is expressed as a *left bar* (3px border-left), not
 *     a full outline. The bar is what catches the eye; the rest of the
 *     card stays quiet.
 *   - Header is separated from the body by a hairline rule
 *     (`border-b border-rule`) rather than whitespace alone — reads as
 *     "title bar of a dossier".
 *   - No drop-shadow. Elevation in this UI comes from colour contrast
 *     (bg-secondary on bg-primary), not soft shadows.
 */
export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /**
   * Card heading. String for the common case; ReactNode so callers can
   * pass a `<Term>` (glossary-link header) or any composed element.
   */
  title?: ReactNode;
  subtitle?: ReactNode;
  accent?: 'blue' | 'red' | 'gold';
}

// Per-accent styles for the left bar + the header-rule tint. Keeping
// these as full class strings (rather than interpolating colour names)
// ensures Tailwind's JIT scanner picks them up at build time.
const ACCENT_BAR: Record<NonNullable<CardProps['accent']>, string> = {
  gold: 'border-l-[3px] border-l-accent-gold',
  blue: 'border-l-[3px] border-l-accent-blue',
  red: 'border-l-[3px] border-l-accent-red',
};

export function Card(props: PropsWithChildren<CardProps>): JSX.Element {
  const { title, subtitle, accent, className = '', children, ...rest } = props;
  const accentCls = accent ? ACCENT_BAR[accent] : '';
  return (
    <div
      className={`bg-bg-secondary rounded-sm border border-rule ${accentCls} p-4 ${className}`}
      {...rest}
    >
      {(title || subtitle) && (
        <header className="mb-3 pb-2 border-b border-rule">
          {title && (
            <h3 className="font-headline text-card-title text-text-primary">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="font-mono text-[0.6875rem] uppercase tracking-wider text-text-muted mt-0.5">
              {subtitle}
            </p>
          )}
        </header>
      )}
      {children}
    </div>
  );
}
