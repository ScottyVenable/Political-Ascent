/**
 * StatBlock — displays a single core stat with its level bar.
 */
import { memo } from 'react';
import { Bar } from './Bar';

export interface StatBlockProps {
  label: string;
  value: number;
  /** Inclusive upper bound for the bar. Stats default to 10. */
  max?: number;
  /** Optional small hint underneath the label. */
  hint?: string;
}

function StatBlockImpl({ label, value, max = 10, hint }: StatBlockProps): JSX.Element {
  return (
    <div className="bg-bg-tertiary rounded p-3">
      <div className="flex justify-between items-baseline mb-1">
        <span className="font-headline font-semibold text-sm text-text-primary">{label}</span>
        <span className="font-mono text-lg text-accent-gold">{value}</span>
      </div>
      <Bar value={value} max={max} tone="gold" />
      {hint && <p className="text-xs text-text-muted mt-1">{hint}</p>}
    </div>
  );
}

export const StatBlock = memo(StatBlockImpl);
