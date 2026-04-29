/**
 * cardPackEngine — deterministic card-pack opening.
 *
 * Where this fits in the architecture:
 *   - Reads card definitions from {@link CardSystem} (already registered
 *     by `dataLoader.ts` at boot).
 *   - Owns the static {@link PACK_DEFINITIONS} table — the rarity weights
 *     and guarantees per pack archetype.
 *   - `openPack()` produces a {@link CardPackResult} from a seed; the
 *     renderer (`CardPackOpening` component) drives the reveal animation
 *     from that result.
 *
 * Determinism: the engine NEVER calls `Math.random()`. All randomness
 * flows through {@link SeededRNG} so replays, saves, and tests reproduce
 * the same packs.
 *
 * @module engine/cardPackEngine
 */
import type {
  CardDefinition,
  CardPackDefinition,
  CardPackId,
  CardPackResult,
  CardRarity,
  RarityWeights,
} from '@/types';
import { RARITY_ORDER } from '@/types';
import { SeededRNG, weightedRandom } from '@/utils/random';
import { CardSystem } from '@/systems/CardSystem';
import { createLogger } from '@/utils/logger';

const log = createLogger('cardPackEngine');

/**
 * Pack archetypes. Tuned so a Starter pack feels generous-but-mostly-common
 * and a Legendary pack genuinely lights up the room.
 *
 * Weights are *relative* — only their ratios matter. They are written to
 * read like "common is 60% of a starter pack" without forcing the reader
 * to do arithmetic.
 */
export const PACK_DEFINITIONS: Readonly<Record<CardPackId, CardPackDefinition>> = {
  starter: {
    id: 'starter',
    name: 'Starter Pack',
    description: 'A first-term senator\u2019s welcome briefing. Mostly common cards.',
    cardCount: 5,
    cost: 0,
    weights: {
      common: 60,
      uncommon: 30,
      rare: 8,
      epic: 2,
      legendary: 0,
      prismatic: 0,
    },
  },
  standard: {
    id: 'standard',
    name: 'Standard Pack',
    description: 'Everyday political tools. Reliable, occasional surprises.',
    cardCount: 5,
    cost: 25,
    weights: {
      common: 45,
      uncommon: 35,
      rare: 15,
      epic: 4,
      legendary: 1,
      prismatic: 0,
    },
    guarantee: { minRarity: 'uncommon', count: 1 },
  },
  premium: {
    id: 'premium',
    name: 'Premium Pack',
    description: 'Donor-class procurement. Guarantees a rare card.',
    cardCount: 5,
    cost: 75,
    weights: {
      common: 20,
      uncommon: 35,
      rare: 30,
      epic: 12,
      legendary: 3,
      prismatic: 0,
    },
    guarantee: { minRarity: 'rare', count: 1 },
  },
  legendary: {
    id: 'legendary',
    name: 'Legendary Pack',
    description: 'A defining acquisition. Guarantees an epic and chances at prismatic.',
    cardCount: 5,
    cost: 200,
    weights: {
      common: 5,
      uncommon: 20,
      rare: 35,
      epic: 28,
      legendary: 10,
      prismatic: 2,
    },
    guarantee: { minRarity: 'epic', count: 1 },
  },
};

// ────────────────────────────────────────────────────────────────
// PUBLIC API
// ────────────────────────────────────────────────────────────────

export interface CardPackEngineAPI {
  /** Look up a static pack archetype. */
  getPackDefinition(packId: CardPackId): CardPackDefinition | undefined;
  /** All pack archetypes, in canonical display order. */
  allPackDefinitions(): CardPackDefinition[];
  /**
   * Open a pack deterministically. Same `seed` → same `cards`.
   *
   * Pulls the candidate pool from `CardSystem.allDefinitions()`. If a
   * given rarity has no candidates, the engine *upgrades* upward along
   * `RARITY_ORDER` (so a roll for `epic` in a deck with no epics ends up
   * pulling a `legendary` rather than failing).
   */
  openPack(packId: CardPackId, seed: number): CardPackResult;
}

class CardPackEngineImpl implements CardPackEngineAPI {
  getPackDefinition(packId: CardPackId): CardPackDefinition | undefined {
    return PACK_DEFINITIONS[packId];
  }

  allPackDefinitions(): CardPackDefinition[] {
    // RARITY_ORDER-style fixed display order — the user always sees the
    // packs in the same sequence regardless of map iteration order.
    return [
      PACK_DEFINITIONS.starter,
      PACK_DEFINITIONS.standard,
      PACK_DEFINITIONS.premium,
      PACK_DEFINITIONS.legendary,
    ];
  }

  openPack(packId: CardPackId, seed: number): CardPackResult {
    const def = PACK_DEFINITIONS[packId];
    if (!def) {
      throw new Error(`cardPackEngine.openPack: unknown pack id "${packId}"`);
    }
    const rng = new SeededRNG(seed);
    const pool = CardSystem.allDefinitions();
    if (pool.length === 0) {
      log.warn('openPack called with empty card registry', { packId });
      return { packId, cards: [], seed };
    }

    const cards: CardDefinition[] = [];

    // Step 1 — fulfil any guarantee BEFORE rolling weighted slots so the
    // guarantee card doesn't accidentally crowd out a normal slot's roll.
    if (def.guarantee) {
      for (let i = 0; i < def.guarantee.count; i++) {
        const guaranteed = pickAtLeastRarity(pool, def.guarantee.minRarity, rng);
        if (guaranteed) cards.push(guaranteed);
      }
    }

    // Step 2 — fill the rest of the pack with weighted rolls.
    while (cards.length < def.cardCount) {
      const rarity = rollRarity(def.weights, rng);
      const card = pickByRarity(pool, rarity, rng);
      if (card) cards.push(card);
    }

    // Step 3 — sort lowest rarity → highest. The renderer reveals in this
    // order so the rarest card lands last for dramatic effect.
    cards.sort(
      (a, b) =>
        RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity),
    );

    log.info('opened pack', { packId, seed, count: cards.length });
    return { packId, cards, seed };
  }
}

export const cardPackEngine: CardPackEngineAPI = new CardPackEngineImpl();

// ────────────────────────────────────────────────────────────────
// Internal helpers (exported for unit testing only).
// ────────────────────────────────────────────────────────────────

/**
 * Convert a `RarityWeights` map to a flat list of weighted entries.
 * Zero-weight rarities are skipped — passing them to `weightedRandom`
 * would still work but the noise is unnecessary.
 */
export function weightsToEntries(
  weights: RarityWeights,
): Array<{ rarity: CardRarity; weight: number }> {
  return RARITY_ORDER
    .map((rarity) => ({ rarity, weight: weights[rarity] }))
    .filter((e) => e.weight > 0);
}

/** Roll a rarity using the weights table. */
export function rollRarity(weights: RarityWeights, rng: SeededRNG): CardRarity {
  const entries = weightsToEntries(weights);
  if (entries.length === 0) {
    // Sentinel: an all-zero weights table — fall back to common so we
    // never throw on a malformed config.
    return 'common';
  }
  return weightedRandom(entries, rng).rarity;
}

/**
 * Pick a card from the pool that matches `rarity`. If no card of that
 * rarity exists, walk *up* the rarity ladder to fill the slot — the
 * player would rather get something better than an error.
 */
export function pickByRarity(
  pool: readonly CardDefinition[],
  rarity: CardRarity,
  rng: SeededRNG,
): CardDefinition | undefined {
  const startIdx = RARITY_ORDER.indexOf(rarity);
  for (let i = startIdx; i < RARITY_ORDER.length; i++) {
    const candidates = pool.filter((c) => c.rarity === RARITY_ORDER[i]);
    if (candidates.length > 0) return rng.pick(candidates);
  }
  // Fall back downward as a last resort.
  for (let i = startIdx - 1; i >= 0; i--) {
    const candidates = pool.filter((c) => c.rarity === RARITY_ORDER[i]);
    if (candidates.length > 0) return rng.pick(candidates);
  }
  return undefined;
}

/**
 * Pick a card whose rarity is at least `minRarity` (further up the
 * ladder). Used to fulfil pack guarantees.
 */
export function pickAtLeastRarity(
  pool: readonly CardDefinition[],
  minRarity: CardRarity,
  rng: SeededRNG,
): CardDefinition | undefined {
  const minIdx = RARITY_ORDER.indexOf(minRarity);
  const candidates = pool.filter(
    (c) => RARITY_ORDER.indexOf(c.rarity) >= minIdx,
  );
  if (candidates.length === 0) {
    // Nothing meets the floor — fall back to the highest available.
    return pickByRarity(pool, minRarity, rng);
  }
  return rng.pick(candidates);
}
