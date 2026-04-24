import { SeededRNG } from './random';

/**
 * Generates a short ID string. Deterministic when a SeededRNG is supplied,
 * otherwise falls back to Math.random (callers in simulation code must pass
 * an RNG to preserve save/replay determinism).
 */
export function makeId(prefix: string, rng?: SeededRNG): string {
  const roll = rng ? rng.next() : Math.random();
  const suffix = Math.floor(roll * 36 ** 6).toString(36).padStart(6, '0');
  return `${prefix}-${suffix}`;
}
