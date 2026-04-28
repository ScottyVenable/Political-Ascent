/**
 * Unit tests for the TimelinePanel groupByMonth helper.
 *
 * The grouping logic is the contract that drives the panel's section
 * ordering — a regression here would mean the player's Timeline
 * scrolls in the wrong direction or silently merges months from
 * different years. Worth testing in isolation, no React rendering.
 */
import { describe, it, expect } from 'vitest';
import { groupByMonth } from './TimelinePanel';
import type { NewsItem } from '@/types';

function news(year: number, month: number, day: number, headline: string): NewsItem {
  return {
    id: `n-${year}-${month}-${day}-${headline}`,
    date: { year, month, day },
    headline,
    severity: 'info',
  };
}

describe('TimelinePanel.groupByMonth', () => {
  it('returns an empty array for empty input', () => {
    expect(groupByMonth([])).toEqual([]);
  });

  it('emits months in newest-first order', () => {
    const items = [news(2024, 1, 5, 'A'), news(2024, 3, 2, 'B'), news(2024, 2, 9, 'C')];
    const groups = groupByMonth(items);
    expect(groups.map((g) => g.label)).toEqual(['March 2024', 'February 2024', 'January 2024']);
  });

  it('keeps separate years separate even when months collide', () => {
    const items = [news(2023, 6, 1, 'old'), news(2024, 6, 1, 'new')];
    const groups = groupByMonth(items);
    expect(groups).toHaveLength(2);
    expect(groups[0].label).toBe('June 2024');
    expect(groups[1].label).toBe('June 2023');
  });

  it('preserves original order within a month (newest-first as worldStore stores it)', () => {
    const items = [news(2024, 1, 12, 'second'), news(2024, 1, 3, 'first')];
    const groups = groupByMonth(items);
    expect(groups[0].items.map((i) => i.headline)).toEqual(['second', 'first']);
  });
});
