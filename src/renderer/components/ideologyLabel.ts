/**
 * ideologyLabel — derive a human-readable orientation phrase from an
 * IdeologyPoint on the 2-axis political compass.
 *
 * The compass axes follow the in-game convention:
 *   x ∈ [-1, +1]  (-1 = economic left, +1 = economic right)
 *   y ∈ [-1, +1]  (-1 = libertarian / personal-freedom, +1 = authoritarian)
 *
 * The output is intentionally short and shippable in UI strings — it
 * gates on (a) which quadrant the point sits in and (b) the magnitude
 * along each axis. A "Centrist" pole exists so a player parked at the
 * origin doesn't get a noisy compound label.
 *
 * @module renderer/components/ideologyLabel
 */

import type { IdeologyPoint } from '@/types';

// ─────────────────────────────────────────────────────────────
// Thresholds
// Tuned so the central deadzone is small enough that even modest
// movement produces a label change (good for real-time feedback)
// while preventing flicker between "Centrist" and a quadrant name
// when the user is just resting at the origin.
// ─────────────────────────────────────────────────────────────
const AXIS_DEADZONE = 0.15;
const MODERATE_MAX = 0.4;
const STRONG_MIN = 0.75;

/**
 * Map an IdeologyPoint to a short orientation label.
 *
 * @param p - point on the political compass
 * @returns label such as "Centrist", "Moderate Left-Libertarian",
 *          "Strong Right-Authoritarian", "Authoritarian", etc.
 *
 * @example
 * ideologyLabel({ x: 0, y: 0 });           // "Centrist"
 * ideologyLabel({ x: -0.8, y: -0.6 });     // "Strong Left-Libertarian"
 * ideologyLabel({ x: 0.05, y: 0.5 });      // "Authoritarian"
 */
export function ideologyLabel(p: IdeologyPoint): string {
  const ax = Math.abs(p.x);
  const ay = Math.abs(p.y);

  // Pure centre — both axes inside the deadzone.
  if (ax < AXIS_DEADZONE && ay < AXIS_DEADZONE) {
    return 'Centrist';
  }

  // Single-axis labels when the other axis is in the deadzone — avoids
  // saying "Left-Authoritarian" when the auth/lib reading is basically
  // zero. Reads more naturally in UI.
  const xName = p.x < 0 ? 'Left' : 'Right';
  const yName = p.y < 0 ? 'Libertarian' : 'Authoritarian';

  let core: string;
  if (ay < AXIS_DEADZONE) {
    core = xName;
  } else if (ax < AXIS_DEADZONE) {
    core = yName;
  } else {
    core = `${xName}-${yName}`;
  }

  // Intensity is the larger of the two axis magnitudes — using the max
  // (not the L2 norm) means a single-axis extremist still reads as
  // "Strong …" even if the perpendicular axis is moderate.
  const intensity = Math.max(ax, ay);
  if (intensity >= STRONG_MIN) return `Strong ${core}`;
  if (intensity <= MODERATE_MAX) return `Moderate ${core}`;
  return core;
}
