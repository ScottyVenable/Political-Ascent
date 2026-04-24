import type { GameDate } from '@/types';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** Returns `January 6, 2025`. */
export function formatDateLong(d: GameDate): string {
  return `${MONTH_NAMES[d.month - 1]} ${d.day}, ${d.year}`;
}

/** Returns `Jan 6 2025`. */
export function formatDateShort(d: GameDate): string {
  return `${MONTH_NAMES[d.month - 1].slice(0, 3)} ${d.day} ${d.year}`;
}

/** Returns `2025-01-06`. */
export function formatDateISO(d: GameDate): string {
  return `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`;
}

/** Returns `+12` / `−4` / `0` with a signed prefix. */
export function formatSigned(n: number, decimals = 0): string {
  const rounded = n.toFixed(decimals);
  if (n > 0) return `+${rounded}`;
  if (n < 0) return `−${Math.abs(Number(rounded)).toFixed(decimals)}`;
  return rounded;
}

/** Currency formatting in compact USD. 1500000 → `$1.5M`. */
export function formatCurrency(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1e12) return `$${(n / 1e12).toFixed(1)}T`;
  if (abs >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

/** `67` → `67%`. */
export function formatPercent(n: number, decimals = 0): string {
  return `${n.toFixed(decimals)}%`;
}

/** `0–100` → `Low` / `Moderate` / `High` / `Critical`. */
export function thresholdLabel(n: number): string {
  if (n < 25) return 'Low';
  if (n < 50) return 'Moderate';
  if (n < 75) return 'High';
  return 'Critical';
}
