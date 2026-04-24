/**
 * Bar — a horizontal value bar (0..max) with label + value text.
 *
 * Deliberately tiny and memoizable: the hot path (populations panel) renders
 * many bars on every weekly update.
 */
import { memo } from 'react';

export interface BarProps {
  value: number;
  max?: number;
  label?: string;
  valueLabel?: string;
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'gold';
  className?: string;
}

const TONE: Record<NonNullable<BarProps['tone']>, string> = {
  // `neutral` is the default tone used by population stats, approval bars,
  // and anywhere the bar is not carrying tonal meaning. The previous blue
  // fought the rest of the gold-accented UI; gold is now the neutral tone
  // and the other semantic tones (success/warning/danger) take over when
  // the bar's *meaning* is tonal.
  neutral: 'bg-accent-gold',
  success: 'bg-status-success',
  warning: 'bg-status-warning',
  danger: 'bg-status-danger',
  gold: 'bg-accent-gold',
};

function BarImpl({
  value,
  max = 100,
  label,
  valueLabel,
  tone = 'neutral',
  className = '',
}: BarProps): JSX.Element {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className={className}>
      {(label || valueLabel) && (
        <div className="flex justify-between items-baseline mb-1 text-xs">
          {label && <span className="text-text-secondary">{label}</span>}
          {valueLabel && <span className="font-mono text-text-primary">{valueLabel}</span>}
        </div>
      )}
      <div className="w-full h-2 rounded-full bg-bg-tertiary overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${TONE[tone]}`}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={max}
          aria-valuenow={value}
        />
      </div>
    </div>
  );
}

export const Bar = memo(BarImpl);
