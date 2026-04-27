/**
 * Card system types — the data spine of the deckbuilder layer.
 *
 * Where this fits in the architecture:
 *   - JSON in `src/data/cards/` declares static {@link CardDefinition} entries.
 *   - `engine/dataLoader.ts` validates those entries at boot.
 *   - `systems/CardSystem.ts` registers definitions and manages a player's
 *     `deck` / `hand` of {@link CardInstance}s.
 *   - `engine/cardPackEngine.ts` opens packs deterministically using the
 *     {@link CardRarity} weighting tables defined here.
 *   - `renderer/panels/CardsPanel.tsx` and `renderer/screens/Collection.tsx`
 *     render cards using {@link CardRarity} for visual treatment (border,
 *     glow, label).
 *
 * This module owns ONLY the data shapes — no behaviour. Every consumer
 * imports from here through the `@/types` barrel.
 *
 * @module types/card
 */
import type { CardId } from './common';
import type { Effect } from './effect';

/**
 * What kind of political maneuver the card represents. Drives icon /
 * accent / categorisation in the Collection screen filters.
 */
export type CardType =
  | 'action'
  | 'boost'
  | 'sabotage'
  | 'resource'
  | 'legislation'
  | 'relationship'
  | 'wild';

/**
 * Rarity tier. Ordered from most common to most rare; the order is
 * meaningful — `RARITY_ORDER` uses it for sorting and `cardPackEngine`
 * uses it as a fallback ladder when a desired rarity is not available.
 *
 * Tiers are visually distinct (border color + glow + label) and have
 * direct gameplay weight: rarer cards are harder to pull from packs and
 * tend to carry stronger or more focused effects.
 */
export type CardRarity =
  | 'common'
  | 'uncommon'
  | 'rare'
  | 'epic'
  | 'legendary'
  | 'prismatic';

/**
 * Canonical sort order for rarities. Index = rank.
 *
 * Stored as a tuple so consumers can do `RARITY_ORDER.indexOf(r)` to get
 * a numeric rank, useful for sorting collections and weighting drops.
 */
export const RARITY_ORDER: readonly CardRarity[] = [
  'common',
  'uncommon',
  'rare',
  'epic',
  'legendary',
  'prismatic',
] as const;

/**
 * Faction affinity tags. A card with `factionAffinity: 'progressive'`
 * grants a small bonus when the player is aligned with that faction.
 *
 * Kept loose (string union, not a registry) so scenarios can introduce
 * their own factions without editing this file.
 */
export type FactionAffinity =
  | 'progressive'
  | 'moderate'
  | 'establishment'
  | 'freedom-caucus'
  | 'problem-solvers'
  | 'business-roundtable'
  | 'reform-coalition'
  | 'none';

/**
 * Optional ideology gate — the card cannot be played if the character
 * sits outside the declared range on the 2-axis compass. Both axes are
 * normalised to [-100, 100]. Omit to leave the card unrestricted.
 */
export interface IdeologyRequirement {
  /** Left-Right axis. Negative = left, positive = right. */
  economicMin?: number;
  economicMax?: number;
  /** Authoritarian-Libertarian axis. Negative = libertarian, positive = authoritarian. */
  socialMin?: number;
  socialMax?: number;
}

/**
 * Numeric stat block shown on the card face. Every field is optional;
 * only declare what's meaningful for the card. This is the deckbuilder
 * surface — same idea as Hearthstone mana / attack / health, but
 * tuned for legislative simulation.
 */
export interface CardStats {
  /** Power level — opaque "how strong is this" rating, 1–10. */
  power?: number;
  /** Cooldown in weeks before this card may be drawn again after play. */
  cooldownWeeks?: number;
  /** Hard cap on plays per playthrough. Omit for unlimited. */
  usesPerGame?: number;
  /**
   * Upgrade tier 1–3. Higher tiers have stronger effects and a visual
   * "foil" treatment in the renderer. Defaults to 1.
   */
  level?: 1 | 2 | 3;
  /**
   * If the card matches the player's active faction, multiply its
   * effects' magnitude by this factor. 1.0 = no bonus.
   */
  factionBonusMultiplier?: number;
}

/**
 * Static definition loaded from JSON (`src/data/cards/*.json`).
 *
 * Backward-compatibility note: the original schema (v1) required only
 * `id, name, type, rarity, description, cost, effects, tags`. All new
 * fields below are OPTIONAL so existing decks keep loading. The
 * `$schemaVersion` field is reserved for future migrations; absent =
 * treat as v1.
 */
export interface CardDefinition {
  id: CardId;
  name: string;
  type: CardType;
  rarity: CardRarity;
  description: string;
  flavorText?: string;
  /** Political-capital cost to play. 0 = free. */
  cost: number;
  /** Action-point cost on top of PC. Defaults to 0. */
  apCost?: number;
  effects: Effect[];
  tags: string[];

  // ── Deckbuilder additions (v2) ───────────────────────────────
  /** Schema version of this entry. Loader migrates v1 → v2 on read. */
  $schemaVersion?: 1 | 2;
  /** Numeric stats block (see {@link CardStats}). */
  stats?: CardStats;
  /** Faction affinity for bonus calculations. */
  factionAffinity?: FactionAffinity;
  /** Optional ideology gate. */
  ideology?: IdeologyRequirement;
  /**
   * Icon id (from `src/renderer/components/Icon.tsx`) shown on the card.
   * If absent, the renderer picks a default icon based on `type`.
   */
  icon?: string;
  /**
   * Optional terms referenced in the description that should render as
   * extended-tooltip links. The renderer cross-references this list
   * with the tooltip registry to add hover targets.
   */
  glossaryTerms?: string[];
}

/** An in-game instance of a card. Stable across serialization. */
export interface CardInstance {
  instanceId: string;
  cardId: CardId;
  /** Acquired-on game date (ISO year-month-day). */
  acquiredAt?: string;
  /** Last-played week index — used for cooldown bookkeeping. */
  lastPlayedWeek?: number;
  /** How many times this instance has been played (for usesPerGame). */
  timesPlayed?: number;
}

// ────────────────────────────────────────────────────────────────
// Pack opening — see `engine/cardPackEngine.ts`
// ────────────────────────────────────────────────────────────────

/**
 * Identifier for a pack archetype. New packs are declared in
 * `engine/cardPackEngine.ts` (`PACK_DEFINITIONS`) — keep this union in
 * sync.
 */
export type CardPackId =
  | 'starter'
  | 'standard'
  | 'premium'
  | 'legendary';

/**
 * Per-rarity pull weights for a single pack. The renderer also reads
 * this to display "what's in this pack" odds on the pack-open screen,
 * Hearthstone-style.
 */
export type RarityWeights = Record<CardRarity, number>;

/** Static definition of a pack archetype. */
export interface CardPackDefinition {
  id: CardPackId;
  /** Display name shown on the pack art. */
  name: string;
  /** One-line flavour shown on the back of the pack. */
  description: string;
  /** Number of cards yielded per open. */
  cardCount: number;
  /** Per-rarity weights. Higher = more likely. */
  weights: RarityWeights;
  /**
   * Guarantees: e.g. `{ minRarity: 'rare', count: 1 }` ensures at least
   * one card of `rare` or better in the pack. Omit for no guarantee.
   */
  guarantee?: {
    minRarity: CardRarity;
    count: number;
  };
  /** PC cost to open this pack at the Party Store. */
  cost: number;
}

/**
 * Result of opening a pack — a deterministic list of card definitions,
 * plus the seed used so replays/saves can reproduce the open.
 */
export interface CardPackResult {
  packId: CardPackId;
  /** Cards revealed, in reveal order (lowest rarity first by convention). */
  cards: CardDefinition[];
  /** Seed that produced this open. */
  seed: number;
}
