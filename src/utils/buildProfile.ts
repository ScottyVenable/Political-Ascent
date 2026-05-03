/**
 * Build-profile derivation for the Build Your Candidate Stats step.
 *
 * Where this fits in the architecture:
 *   - Pure utility called from `CharacterCreation.tsx` (renderer) to
 *     surface a small "Build Profile" card under the six raw stat
 *     sliders. It distills the six 1..10 stats into three named
 *     archetypes (Persuasion / Operations / Resources) so a new
 *     player can see what their distribution actually shapes the
 *     character into without reading every slider individually.
 *   - The archetype groupings are intentionally diagonal to common
 *     party/background presets: each archetype draws from one
 *     "social" stat and one "structural" stat so a high score in
 *     one archetype always reflects a deliberate pair, never a
 *     single dump-stat.
 *
 * Why these specific pairings (todo#27):
 *   - **Persuasion** = charisma + connections. Charisma carries the
 *     speech, connections gets it heard. Together they shape how the
 *     world responds to your political voice.
 *   - **Operations** = strategy + integrity. Strategy plans the
 *     manoeuvre, integrity makes it stick (and survive press
 *     scrutiny). Together they shape how reliably your plans land.
 *   - **Resources** = wealth + stamina. Money you can spend, time
 *     and energy you can spend. Together they shape your sustained
 *     throughput across long campaigns.
 *
 * The archetype score is the *average* of the two paired stats so
 * the result lives on the same 1..10 scale as the sliders, which
 * means we can reuse `statTier` and the player's intuition is not
 * forced to recalibrate to a 2..20 range.
 *
 * @module utils/buildProfile
 */
import type { CoreStats } from '../types/character';
import { statTier, type StatTier } from './statTier';

/** The three derived archetypes a stat distribution rolls up into. */
export type BuildArchetype = 'persuasion' | 'operations' | 'resources';

/**
 * One archetype reading: average score (1..10), the tier that score
 * maps to, the two contributing stats, and a one-line blurb about
 * what that tier of the archetype means in play.
 */
export interface BuildProfileEntry {
  archetype: BuildArchetype;
  /** Display label, e.g. "Persuasion". */
  label: string;
  /** Average of the two contributing stats, 1..10, rounded to one dp. */
  score: number;
  tier: StatTier;
  /** The two contributing CoreStats keys. */
  contributors: [keyof CoreStats, keyof CoreStats];
  /** One-line gameplay blurb for the current tier. */
  blurb: string;
}

const PAIRS: Record<BuildArchetype, [keyof CoreStats, keyof CoreStats]> = {
  persuasion: ['charisma', 'connections'],
  operations: ['strategy', 'integrity'],
  resources: ['wealth', 'stamina'],
};

const LABELS: Record<BuildArchetype, string> = {
  persuasion: 'Persuasion',
  operations: 'Operations',
  resources: 'Resources',
};

/**
 * Tier blurbs per archetype. Wording is deliberately consequence-led
 * ("you can…", "you struggle to…") rather than mechanically precise
 * because the underlying multipliers will rebalance during early
 * access. The aim is to tell the player which loops their build
 * unlocks or closes off.
 */
const ARCHETYPE_BLURB: Record<BuildArchetype, Record<StatTier, string>> = {
  persuasion: {
    weak: 'Your voice does not carry. Endorsements come grudgingly if at all.',
    average: 'You can hold a room and reach the people who already lean your way.',
    strong: 'You move undecideds and your network amplifies every line you land.',
    exceptional: 'You set the narrative. Coalitions form around your speeches.',
  },
  operations: {
    weak: 'Plans fall apart. The press spots every angle before you do.',
    average: 'Your bills survive committee and your record holds up under questioning.',
    strong: 'You out-manoeuvre opponents in the calendar and on the ethics page.',
    exceptional: 'You shape the legislative agenda; scandal-driven attacks slide off.',
  },
  resources: {
    weak: 'You run on empty. A bad week ends your cycle.',
    average: 'You can fund and finish a median campaign without folding.',
    strong: 'You absorb shocks and out-spend rivals when it matters.',
    exceptional: 'Access-level money plus iron health — you set the pace.',
  },
};

/**
 * Compute the three-archetype build profile for a character's
 * effective stat block.
 *
 * The input is the *final* stats (after background bonuses), not the
 * raw allocation, because the player wants to see the character they
 * will actually play — not the hypothetical pre-bonus version.
 *
 * @param stats Effective stats after background bonuses, 1..10 each.
 * @returns Three entries in the order Persuasion / Operations /
 *          Resources, each with its score, tier, contributing stats,
 *          and gameplay-impact blurb.
 *
 * @example
 *   buildProfile({ charisma: 8, connections: 6, strategy: 5,
 *                  integrity: 5, wealth: 3, stamina: 3 });
 *   // → [
 *   //   { archetype: 'persuasion', score: 7, tier: 'strong', ... },
 *   //   { archetype: 'operations', score: 5, tier: 'average', ... },
 *   //   { archetype: 'resources',  score: 3, tier: 'weak',    ... },
 *   // ]
 */
export function buildProfile(stats: CoreStats): BuildProfileEntry[] {
  const archetypes: BuildArchetype[] = ['persuasion', 'operations', 'resources'];
  return archetypes.map((archetype) => {
    const [a, b] = PAIRS[archetype];
    const avg = (stats[a] + stats[b]) / 2;
    // Round to one decimal place for display; tier uses the raw avg
    // so 5.5 lands in 'strong' not 'average' (matching the slider's
    // 6-and-up = strong breakpoint when the player nudges either
    // contributor up by one).
    const score = Math.round(avg * 10) / 10;
    const tier = statTier(avg);
    return {
      archetype,
      label: LABELS[archetype],
      score,
      tier,
      contributors: [a, b],
      blurb: ARCHETYPE_BLURB[archetype][tier],
    };
  });
}
