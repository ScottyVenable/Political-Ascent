/**
 * Stat tier helpers for the Build Your Candidate UX.
 *
 * Where this fits in the architecture:
 *   - Used by the character creation screen to render a tier chip
 *     (Weak / Average / Strong / Exceptional) next to each stat
 *     readout, so a player can interpret a numeric score without
 *     opening the glossary tooltip.
 *   - Also exposes a one-line, gameplay-impact blurb per stat at a
 *     given tier so the Stats step can show *why* a given allocation
 *     matters rather than relying on the player remembering what
 *     "Charisma 7" buys.
 *
 * Why the tier breakpoints look the way they do:
 *   - Stats are clamped to 1..10. The four tiers (≤3, 4–5, 6–7, 8+)
 *     mirror the typical D&D-style spread and align with how the
 *     glossary tooltip text describes the stat: "low" / "moderate" /
 *     "high" / "exceptional". Putting the breakpoints in one place
 *     means tweaks to the curve only need a single edit.
 *
 * @module utils/statTier
 */

/** The four discrete tiers a stat can fall into. */
export type StatTier = 'weak' | 'average' | 'strong' | 'exceptional';

/**
 * Map a 1..10 stat value to a tier. Inputs outside the range are
 * clamped first; a non-finite input returns `'average'` so a buggy
 * caller does not crash the UI.
 */
export function statTier(value: number): StatTier {
  if (!Number.isFinite(value)) return 'average';
  const v = Math.max(1, Math.min(10, value));
  if (v <= 3) return 'weak';
  if (v <= 5) return 'average';
  if (v <= 7) return 'strong';
  return 'exceptional';
}

/** Display label for a tier, suitable for a chip. */
export function statTierLabel(tier: StatTier): string {
  switch (tier) {
    case 'weak':
      return 'Weak';
    case 'average':
      return 'Average';
    case 'strong':
      return 'Strong';
    case 'exceptional':
      return 'Exceptional';
  }
}

/**
 * Tailwind classes for a tier chip. Kept as a pure mapping so the
 * tests (and any future automated screenshot diff) can assert a
 * specific class set per tier.
 */
export function statTierChipClass(tier: StatTier): string {
  switch (tier) {
    case 'weak':
      return 'bg-status-danger/20 text-status-danger border-status-danger/40';
    case 'average':
      return 'bg-bg-tertiary text-text-secondary border-rule';
    case 'strong':
      return 'bg-accent-gold/20 text-accent-gold border-accent-gold/40';
    case 'exceptional':
      return 'bg-accent-blue/20 text-accent-blue border-accent-blue/40';
  }
}
