/**
 * CongressSystem.generate — the seat distribution should be deterministic
 * from the seed and produce exactly 100 senators and 435 reps.
 */
import { describe, it, expect } from 'vitest';
import { CongressSystem } from './CongressSystem';

describe('CongressSystem', () => {
  it('generates 100 senators (50 states × 2) and 435 house seats', () => {
    const { senate, house } = CongressSystem.generate(12345, { D: 50, R: 50 });
    expect(senate).toHaveLength(100);
    expect(house).toHaveLength(435);
  });

  it('is deterministic given the same seed', () => {
    const a = CongressSystem.generate(98765, { D: 47, R: 48, I: 5 });
    const b = CongressSystem.generate(98765, { D: 47, R: 48, I: 5 });
    expect(a.senate.map((l) => l.name)).toEqual(b.senate.map((l) => l.name));
    expect(a.house.map((l) => l.name)).toEqual(b.house.map((l) => l.name));
  });

  it('respects party-split bias (with tolerance for randomness)', () => {
    const { senate, house } = CongressSystem.generate(42, { D: 100, R: 0, I: 0 });
    const allD = [...senate, ...house].every((l) => l.party === 'D');
    expect(allD).toBe(true);
  });

  // todo#55 — every legislator carries demographic fields the panel filters on.
  it('seeds age, gender, and wealth on every legislator', () => {
    const { senate, house } = CongressSystem.generate(2026, { D: 50, R: 50 });
    for (const l of [...senate, ...house]) {
      expect(typeof l.age).toBe('number');
      expect(l.age).toBeGreaterThanOrEqual(40);
      expect(l.age).toBeLessThanOrEqual(85);
      expect(['F', 'M']).toContain(l.gender);
      expect(typeof l.wealth).toBe('number');
      expect(l.wealth).toBeGreaterThan(0);
    }
  });

  // Senators skew older than House members on aggregate.
  it('senators have a higher mean age than house members', () => {
    const { senate, house } = CongressSystem.generate(7, { D: 50, R: 50 });
    const mean = (xs: number[]): number => xs.reduce((a, b) => a + b, 0) / xs.length;
    const senateMean = mean(senate.map((l) => l.age));
    const houseMean = mean(house.map((l) => l.age));
    expect(senateMean).toBeGreaterThan(houseMean);
  });
});
