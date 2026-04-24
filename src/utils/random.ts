/**
 * Seeded RNG — the ONLY entry point for randomness in the codebase.
 *
 * Determinism matters: replays, save-file reproduction, automated tests, and
 * debugging all depend on the same seed producing the same numbers. Using
 * `Math.random()` anywhere will desync the simulation from a save.
 *
 * We use Mulberry32 — a 32-bit PRNG with very good statistical properties for
 * its size. It's not cryptographic. Don't use it for secrets.
 *
 * @see https://en.wikipedia.org/wiki/Mulberry32
 */

/** A stateful, seeded RNG. Each call to `next()` advances the state. */
export class SeededRNG {
  private state: number;

  constructor(seed: number) {
    // Guarantee a non-zero seed; zero state causes Mulberry32 to output 0.
    this.state = seed >>> 0 || 1;
  }

  /** Returns a float in [0, 1). Advances internal state. */
  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Returns an integer in [min, max] inclusive on both ends. */
  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /** Returns true with probability `p` (0–1). */
  chance(p: number): boolean {
    return this.next() < p;
  }

  /** Picks a random element from an array. Throws on empty array. */
  pick<T>(arr: readonly T[]): T {
    if (arr.length === 0) throw new Error('SeededRNG.pick: empty array');
    return arr[Math.floor(this.next() * arr.length)];
  }

  /** Returns a fresh SeededRNG derived deterministically from this one. */
  fork(): SeededRNG {
    return new SeededRNG(this.int(1, 0x7fffffff));
  }

  /** Expose the current internal state for save-file persistence. */
  getState(): number {
    return this.state;
  }
}

/**
 * Picks one entry from a weighted list. Weights must be positive.
 * Uses the provided RNG to preserve determinism.
 */
export function weightedRandom<T extends { weight: number }>(
  entries: readonly T[],
  rng: SeededRNG,
): T {
  if (entries.length === 0) throw new Error('weightedRandom: empty entries');
  const total = entries.reduce((s, e) => s + e.weight, 0);
  let roll = rng.next() * total;
  for (const entry of entries) {
    roll -= entry.weight;
    if (roll <= 0) return entry;
  }
  return entries[entries.length - 1];
}

/** Deterministic hash → 32-bit integer. Useful for seeding from strings. */
export function hashString(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
