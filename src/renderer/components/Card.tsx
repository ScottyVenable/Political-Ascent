import type { PropsWithChildren, HTMLAttributes } from 'react';

/** Card — a rounded, dark panel used to group related UI. */
export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  accent?: 'blue' | 'red' | 'gold';
}

const ACCENT: Record<NonNullable<CardProps['accent']>, string> = {
  blue: 'border-accent-blue/40',
  red: 'border-accent-red/40',
  gold: 'border-accent-gold/40',
};

export function Card(props: PropsWithChildren<CardProps>): JSX.Element {
  const { title, subtitle, accent, className = '', children, ...rest } = props;
  const borderCls = accent ? ACCENT[accent] : 'border-bg-tertiary';
  return (
    <div
      className={`bg-bg-secondary rounded-lg border ${borderCls} p-4 shadow-md ${className}`}
      {...rest}
    >
      {(title || subtitle) && (
        <header className="mb-3">
          {title && <h3 className="font-headline text-lg font-bold text-text-primary">{title}</h3>}
          {subtitle && <p className="text-xs text-text-secondary">{subtitle}</p>}
        </header>
      )}
      {children}
    </div>
  );
}
