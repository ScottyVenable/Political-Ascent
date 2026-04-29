/**
 * Unit tests for `formatTreasury` — covers the k→m boundary regression
 * Codex flagged on PR #53 (e.g. 999,950 must not render as "$1000.0k").
 *
 * @module renderer/components/TopBar.test
 */

import { describe, it, expect } from 'vitest';
import { formatTreasury } from './TopBar';

describe('formatTreasury', () => {
  it('renders raw dollars below 1,000', () => {
    expect(formatTreasury(0)).toBe('$0');
    expect(formatTreasury(850)).toBe('$850');
  });

  it('renders thousands with one decimal', () => {
    expect(formatTreasury(12_400)).toBe('$12.4k');
  });

  it('renders millions with one decimal', () => {
    expect(formatTreasury(1_300_000)).toBe('$1.3m');
  });

  it('promotes to "m" when rounding crosses the boundary', () => {
    // 999,950 / 1000 → 999.95 → toFixed(1) → "1000.0", which would
    // print as "$1000.0k" without the post-rounding promotion.
    expect(formatTreasury(999_950)).toBe('$1.0m');
  });

  it('keeps "k" when value is comfortably below the boundary', () => {
    expect(formatTreasury(999_400)).toBe('$999.4k');
  });
});
