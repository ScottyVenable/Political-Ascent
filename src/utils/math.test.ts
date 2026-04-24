import { describe, it, expect } from 'vitest';
import {
  clamp,
  lerp,
  remap,
  statCheck,
  weightedAverage,
  decayTowardZero,
  round,
} from './math';

describe('clamp', () => {
  it('returns the value when in range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });
  it('clamps to min', () => {
    expect(clamp(-3, 0, 10)).toBe(0);
  });
  it('clamps to max', () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });
});

describe('lerp', () => {
  it('returns a at t=0', () => {
    expect(lerp(10, 20, 0)).toBe(10);
  });
  it('returns b at t=1', () => {
    expect(lerp(10, 20, 1)).toBe(20);
  });
  it('interpolates at t=0.5', () => {
    expect(lerp(10, 20, 0.5)).toBe(15);
  });
  it('clamps t outside [0,1]', () => {
    expect(lerp(10, 20, -1)).toBe(10);
    expect(lerp(10, 20, 2)).toBe(20);
  });
});

describe('remap', () => {
  it('remaps to a new range linearly', () => {
    expect(remap(5, 0, 10, 0, 100)).toBe(50);
    expect(remap(0, 0, 10, 50, 150)).toBe(50);
    expect(remap(10, 0, 10, 50, 150)).toBe(150);
  });
});

describe('statCheck', () => {
  it('passes when stat/10 + roll exceeds difficulty', () => {
    expect(statCheck(8, 1.0, 0.5)).toBe(true); // 0.8 + 0.5 = 1.3 > 1.0
  });
  it('fails when stat/10 + roll does not exceed difficulty', () => {
    expect(statCheck(2, 1.0, 0.5)).toBe(false); // 0.2 + 0.5 = 0.7 < 1.0
  });
});

describe('weightedAverage', () => {
  it('returns 0 on empty input', () => {
    expect(weightedAverage([])).toBe(0);
  });
  it('returns 0 when total weight is 0', () => {
    expect(weightedAverage([{ value: 5, weight: 0 }])).toBe(0);
  });
  it('computes weighted average correctly', () => {
    const avg = weightedAverage([
      { value: 10, weight: 1 },
      { value: 20, weight: 3 },
    ]);
    expect(avg).toBe(17.5); // (10*1 + 20*3) / 4
  });
});

describe('decayTowardZero', () => {
  it('returns 0 when input is 0', () => {
    expect(decayTowardZero(0, 1)).toBe(0);
  });
  it('reduces magnitude of positive values', () => {
    const out = decayTowardZero(100, 1);
    expect(out).toBeGreaterThan(0);
    expect(out).toBeLessThan(100);
  });
  it('reduces magnitude of negative values (preserving sign)', () => {
    const out = decayTowardZero(-100, 1);
    expect(out).toBeLessThan(0);
    expect(out).toBeGreaterThan(-100);
  });
});

describe('round', () => {
  it('rounds to integer by default', () => {
    expect(round(3.6)).toBe(4);
    expect(round(3.4)).toBe(3);
  });
  it('rounds to N decimals', () => {
    expect(round(3.14159, 2)).toBe(3.14);
    expect(round(3.14559, 3)).toBe(3.146);
  });
});
