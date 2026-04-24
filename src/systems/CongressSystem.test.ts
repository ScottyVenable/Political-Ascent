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
});
