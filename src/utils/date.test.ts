import { describe, it, expect } from 'vitest';
import { addDays, dayOfWeek, isMonthStart, isYearStart, toEpochDays, compareDates } from './date';

describe('addDays', () => {
  it('adds days within the same month', () => {
    expect(addDays({ year: 2025, month: 3, day: 10 }, 5)).toEqual({
      year: 2025,
      month: 3,
      day: 15,
    });
  });

  it('rolls over month boundaries (31-day month)', () => {
    expect(addDays({ year: 2025, month: 1, day: 30 }, 5)).toEqual({
      year: 2025,
      month: 2,
      day: 4,
    });
  });

  it('rolls over february (non-leap)', () => {
    // Module ignores leap years; Feb is always 28.
    expect(addDays({ year: 2024, month: 2, day: 27 }, 3)).toEqual({
      year: 2024,
      month: 3,
      day: 2,
    });
  });

  it('rolls over year boundary', () => {
    expect(addDays({ year: 2025, month: 12, day: 30 }, 5)).toEqual({
      year: 2026,
      month: 1,
      day: 4,
    });
  });

  it('handles multi-month jumps', () => {
    expect(addDays({ year: 2025, month: 1, day: 1 }, 90)).toEqual({
      year: 2025,
      month: 4,
      day: 1,
    });
  });

  it('handles negative delta within month', () => {
    expect(addDays({ year: 2025, month: 3, day: 10 }, -3)).toEqual({
      year: 2025,
      month: 3,
      day: 7,
    });
  });

  it('handles negative delta rolling back a month', () => {
    expect(addDays({ year: 2025, month: 3, day: 2 }, -5)).toEqual({
      year: 2025,
      month: 2,
      day: 25,
    });
  });

  it('handles negative delta rolling back a year', () => {
    expect(addDays({ year: 2026, month: 1, day: 3 }, -5)).toEqual({
      year: 2025,
      month: 12,
      day: 29,
    });
  });

  it('returns the same date when adding zero', () => {
    expect(addDays({ year: 2025, month: 6, day: 15 }, 0)).toEqual({
      year: 2025,
      month: 6,
      day: 15,
    });
  });
});

describe('isMonthStart / isYearStart', () => {
  it('isMonthStart is true only on the 1st', () => {
    expect(isMonthStart({ year: 2025, month: 5, day: 1 })).toBe(true);
    expect(isMonthStart({ year: 2025, month: 5, day: 2 })).toBe(false);
  });

  it('isYearStart is true only on Jan 1', () => {
    expect(isYearStart({ year: 2025, month: 1, day: 1 })).toBe(true);
    expect(isYearStart({ year: 2025, month: 1, day: 2 })).toBe(false);
    expect(isYearStart({ year: 2025, month: 2, day: 1 })).toBe(false);
  });
});

describe('dayOfWeek', () => {
  it('returns a value in [0, 6]', () => {
    for (let d = 1; d <= 28; d++) {
      const dow = dayOfWeek({ year: 2025, month: 2, day: d });
      expect(dow).toBeGreaterThanOrEqual(0);
      expect(dow).toBeLessThanOrEqual(6);
    }
  });

  it('advances by exactly 1 between consecutive days (mod 7)', () => {
    const a = dayOfWeek({ year: 2025, month: 6, day: 10 });
    const b = dayOfWeek({ year: 2025, month: 6, day: 11 });
    expect((a + 1) % 7).toBe(b);
  });
});

describe('toEpochDays / compareDates', () => {
  it('is monotonically increasing as days advance', () => {
    const a = toEpochDays({ year: 2025, month: 1, day: 1 });
    const b = toEpochDays({ year: 2025, month: 1, day: 2 });
    const c = toEpochDays({ year: 2025, month: 2, day: 1 });
    expect(b).toBeGreaterThan(a);
    expect(c).toBeGreaterThan(b);
  });

  it('compareDates returns 0 for equal dates', () => {
    expect(compareDates({ year: 2025, month: 5, day: 5 }, { year: 2025, month: 5, day: 5 })).toBe(0);
  });

  it('compareDates returns negative when first is earlier', () => {
    const cmp = compareDates(
      { year: 2025, month: 3, day: 1 },
      { year: 2025, month: 3, day: 2 },
    );
    expect(cmp).toBeLessThan(0);
  });

  it('compareDates returns positive when first is later', () => {
    const cmp = compareDates(
      { year: 2026, month: 1, day: 1 },
      { year: 2025, month: 12, day: 31 },
    );
    expect(cmp).toBeGreaterThan(0);
  });
});
