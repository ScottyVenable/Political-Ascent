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

/**
 * Compact USD formatting for values already expressed in billions of dollars
 * (how the economy system stores GDP, deficit, debt, trade balance).
 *
 * Examples:
 *   formatBillionsUSD(1700)    → "$1.7T"   (deficit)
 *   formatBillionsUSD(34000)   → "$34.0T"  (debt)
 *   formatBillionsUSD(-900)    → "-$900B"  (trade)
 *   formatBillionsUSD(42)      → "$42B"
 *   formatBillionsUSD(0.4)     → "$400M"
 *
 * Previously the dashboard rendered raw `$34000B` which is technically
 * correct but reads as noise; compacting to `$34.0T` restores scannability.
 *
 * @param n - Value in billions of dollars.
 * @param decimals - Optional override for fractional precision in the
 *   compact form. When omitted, picks a sensible default per magnitude
 *   (1 fractional digit at T-scale, none at B-scale, none at M-scale).
 *   Honours the user's `display.numberPrecision` setting via
 *   {@link formatBillionsUSDForDisplay} — call that wherever the user
 *   setting should drive precision (todo#58).
 */
export function formatBillionsUSD(n: number, decimals?: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1000) {
    // Trillions track. Default to 1 decimal so $1.7T reads cleanly; allow
    // 0 (`$2T`) or 2 (`$1.73T`) when the caller asks for more precision.
    const d = decimals ?? 1;
    return `${sign}$${(abs / 1000).toFixed(d)}T`;
  }
  if (abs >= 1) {
    // Billions track. Default integer; respect override if provided.
    const d = decimals ?? 0;
    return `${sign}$${(abs).toFixed(d)}B`;
  }
  if (abs > 0) {
    // Sub-billion → render as millions.
    const d = decimals ?? 0;
    return `${sign}$${(abs * 1000).toFixed(d)}M`;
  }
  return '$0';
}

/**
 * Render a billions-of-dollars value as a fully-expanded number with
 * thousands separators and a `$` prefix. Used inside hover tooltips so
 * the player can see the exact figure when the compact form is ambiguous.
 *
 * @example
 * formatBillionsUSDFull(1734)    // "$1,734,000,000,000"
 * formatBillionsUSDFull(-900)    // "-$900,000,000,000"
 * formatBillionsUSDFull(0.42)    // "$420,000,000"
 */
export function formatBillionsUSDFull(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  // Convert from "billions" to raw dollars, round to whole dollars, then
  // group with the locale's thousands separator. We use 'en-US' explicitly
  // because comma-grouping is part of the desired display and locale
  // negotiation could otherwise return e.g. spaces or apostrophes.
  const dollars = Math.round(abs * 1_000_000_000);
  return `${sign}$${dollars.toLocaleString('en-US')}`;
}

/**
 * Settings-driven wrapper around {@link formatBillionsUSD}.
 *
 * The user can pin a specific decimal precision in Settings → Display
 * (todo#58). When `precision` is `'auto'` (the default), we delegate to
 * the magnitude-aware formatter. Otherwise we force the requested digits.
 *
 * Renderers that want to honour the setting should read it from
 * `useSettingsStore` and pass it here. Tooltips (`formatBillionsUSDFull`)
 * always show the un-truncated value regardless of the setting.
 *
 * @param n - Value in billions of dollars.
 * @param precision - 'auto' or 0..3 fractional digits.
 */
export function formatBillionsUSDForDisplay(
  n: number,
  precision: 'auto' | 0 | 1 | 2 | 3 = 'auto',
): string {
  if (precision === 'auto') return formatBillionsUSD(n);
  return formatBillionsUSD(n, precision);
}

/**
 * Humanize a political-compass coordinate pair into a short, readable label.
 *
 * The compass is a (x, y) pair in [-1, 1]:
 *   - x: economic axis (−1 = left, +1 = right)
 *   - y: social axis (−1 = libertarian, +1 = authoritarian)
 *
 * Values within `centerThreshold` of the origin on BOTH axes return
 * "Centrist"; otherwise we pick a quadrant label. This is purely for UI
 * display — the engine always uses the raw coordinates.
 */
export function describeIdeology(
  x: number,
  y: number,
  centerThreshold = 0.15,
): string {
  if (Math.abs(x) <= centerThreshold && Math.abs(y) <= centerThreshold) {
    return 'Centrist';
  }
  const economic = x < 0 ? 'Left' : 'Right';
  const social = y < 0 ? 'Libertarian' : 'Authoritarian';
  // Two-word quadrant labels: "Libertarian Left", "Authoritarian Right", etc.
  return `${social} ${economic}`;
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

/**
 * Convert a raw tag identifier (snake_case or camelCase) to a human-readable
 * title-case label suitable for display in card tags, bill tags, cohort badges,
 * and tooltip tag-rows.
 *
 * Strategy:
 *   1. Check a known-overrides table for tags that need a specific label
 *      beyond mechanical title-casing (e.g. "pork" → "Pork Barrel").
 *   2. For all other tags, split on underscores, title-case each word, and
 *      rejoin with spaces. Example: `civil_rights` → "Civil Rights".
 *
 * @example
 * formatTag('civil_rights')   // "Civil Rights"
 * formatTag('economy')        // "Economy"
 * formatTag('fundraising')    // "Fundraising"
 * formatTag('pork')           // "Pork Barrel"
 */
const TAG_OVERRIDES: Record<string, string> = {
  pork: 'Pork Barrel',
  dark: 'Dark Money',
};

export function formatTag(tag: string): string {
  if (Object.prototype.hasOwnProperty.call(TAG_OVERRIDES, tag)) {
    return TAG_OVERRIDES[tag];
  }
  // Split on underscores, title-case each word, rejoin with spaces.
  return tag
    .split('_')
    .map((word) => (word.length > 0 ? word[0].toUpperCase() + word.slice(1) : word))
    .join(' ');
}
