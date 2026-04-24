import { describe, it, expect } from 'vitest';
import { SeededRNG, weightedRandom, hashString } from './random';

describe('SeededRNG', () => {
  it('is deterministic for the same seed', () => {
    const a = new SeededRNG(42);
    const b = new SeededRNG(42);
    const seqA = Array.from({ length: 20 }, () => a.next());
    const seqB = Array.from({ length: 20 }, () => b.next());
    expect(seqA).toEqual(seqB);
  });

  it('produces different sequences for different seeds', () => {
    const a = new SeededRNG(1);
    const b = new SeededRNG(2);
    const seqA = Array.from({ length: 10 }, () => a.next());
    const seqB = Array.from({ length: 10 }, () => b.next());
    expect(seqA).not.toEqual(seqB);
  });

  it('yields values in [0, 1)', () => {
    const rng = new SeededRNG(123);
    for (let i = 0; i < 1000; i++) {
      const v = rng.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('treats a zero seed as non-zero', () => {
    // Mulberry32 with state 0 produces all zeros; SeededRNG must normalize.
    const rng = new SeededRNG(0);
    const values = Array.from({ length: 5 }, () => rng.next());
    expect(values.some((v) => v !== 0)).toBe(true);
  });

  it('int() yields integers within inclusive bounds', () => {
    const rng = new SeededRNG(7);
    for (let i = 0; i < 500; i++) {
      const n = rng.int(3, 8);
      expect(Number.isInteger(n)).toBe(true);
      expect(n).toBeGreaterThanOrEqual(3);
      expect(n).toBeLessThanOrEqual(8);
    }
  });

  it('chance(0) never fires and chance(1) always fires', () => {
    const rng = new SeededRNG(9);
    for (let i = 0; i < 100; i++) {
      expect(rng.chance(0)).toBe(false);
      expect(rng.chance(1)).toBe(true);
    }
  });

  it('pick() returns an element from the array', () => {
    const rng = new SeededRNG(13);
    const arr = ['a', 'b', 'c', 'd'] as const;
    for (let i = 0; i < 50; i++) {
      expect(arr).toContain(rng.pick(arr));
    }
  });

  it('pick() throws on empty array', () => {
    const rng = new SeededRNG(1);
    expect(() => rng.pick([])).toThrow();
  });

  it('fork() produces an independent deterministic child', () => {
    const parentA = new SeededRNG(42);
    const parentB = new SeededRNG(42);
    const childA = parentA.fork();
    const childB = parentB.fork();
    const seqA = Array.from({ length: 10 }, () => childA.next());
    const seqB = Array.from({ length: 10 }, () => childB.next());
    expect(seqA).toEqual(seqB);
  });

  it('getState() reflects internal advancement', () => {
    const rng = new SeededRNG(42);
    const s0 = rng.getState();
    rng.next();
    const s1 = rng.getState();
    expect(s1).not.toBe(s0);
  });
});

describe('weightedRandom', () => {
  it('throws on empty input', () => {
    const rng = new SeededRNG(1);
    expect(() => weightedRandom([], rng)).toThrow();
  });

  it('honors weights in aggregate distribution', () => {
    const rng = new SeededRNG(12345);
    const entries = [
      { key: 'rare', weight: 1 },
      { key: 'common', weight: 9 },
    ];
    const counts: Record<string, number> = { rare: 0, common: 0 };
    const trials = 10_000;
    for (let i = 0; i < trials; i++) {
      counts[weightedRandom(entries, rng).key]++;
    }
    // Expect ~10% rare, ~90% common; allow generous ±3% tolerance.
    expect(counts.rare / trials).toBeGreaterThan(0.07);
    expect(counts.rare / trials).toBeLessThan(0.13);
    expect(counts.common / trials).toBeGreaterThan(0.87);
  });

  it('is deterministic for a given seed', () => {
    const entries = [
      { key: 'a', weight: 1 },
      { key: 'b', weight: 2 },
      { key: 'c', weight: 3 },
    ];
    const r1 = new SeededRNG(99);
    const r2 = new SeededRNG(99);
    const s1 = Array.from({ length: 30 }, () => weightedRandom(entries, r1).key);
    const s2 = Array.from({ length: 30 }, () => weightedRandom(entries, r2).key);
    expect(s1).toEqual(s2);
  });
});

describe('hashString', () => {
  it('is deterministic', () => {
    expect(hashString('hello')).toBe(hashString('hello'));
    expect(hashString('political-ascent')).toBe(hashString('political-ascent'));
  });

  it('returns a 32-bit unsigned integer', () => {
    const h = hashString('some input');
    expect(Number.isInteger(h)).toBe(true);
    expect(h).toBeGreaterThanOrEqual(0);
    expect(h).toBeLessThanOrEqual(0xffffffff);
  });

  it('produces different hashes for different strings', () => {
    expect(hashString('abc')).not.toBe(hashString('abd'));
    expect(hashString('')).not.toBe(hashString('a'));
  });
});
