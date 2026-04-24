/** Generic math helpers used across all simulation systems. */

/** Clamps `n` into the inclusive range [min, max]. */
export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

/** Linear interpolation between `a` and `b`. `t` is clamped to [0, 1]. */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * clamp(t, 0, 1);
}

/** Remaps `n` from [inMin, inMax] to [outMin, outMax]. */
export function remap(n: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
  return outMin + ((n - inMin) * (outMax - outMin)) / (inMax - inMin);
}

/** Rolls a stat check: returns true if `stat/10 + luck` beats `difficulty`. */
export function statCheck(stat: number, difficulty: number, roll: number): boolean {
  return stat / 10 + roll > difficulty;
}

/** Weighted average: computes Σ(vᵢ·wᵢ) / Σ(wᵢ). Returns 0 on empty input. */
export function weightedAverage(pairs: Array<{ value: number; weight: number }>): number {
  if (pairs.length === 0) return 0;
  const totalW = pairs.reduce((s, p) => s + p.weight, 0);
  if (totalW === 0) return 0;
  const totalV = pairs.reduce((s, p) => s + p.value * p.weight, 0);
  return totalV / totalW;
}

/** Returns sign-preserving exponential decay towards 0. */
export function decayTowardZero(value: number, rate: number): number {
  return value * Math.exp(-Math.abs(rate));
}

/** Rounds to N decimal places. */
export function round(n: number, decimals = 0): number {
  const mul = 10 ** decimals;
  return Math.round(n * mul) / mul;
}
