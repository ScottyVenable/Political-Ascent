/**
 * cardPackEngine — pack opening must be deterministic, must respect
 * weights, and must fulfil declared guarantees.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  cardPackEngine,
  PACK_DEFINITIONS,
  rollRarity,
  pickByRarity,
  pickAtLeastRarity,
  weightsToEntries,
} from './cardPackEngine';
import { CardSystem } from '@/systems/CardSystem';
import type { CardDefinition, CardId, CardRarity } from '@/types';
import { RARITY_ORDER } from '@/types';
import { SeededRNG } from '@/utils/random';

/** Build a synthetic registry: 4 cards per rarity, named by rarity+index. */
function buildRegistry(): CardDefinition[] {
  const out: CardDefinition[] = [];
  for (const rarity of RARITY_ORDER) {
    for (let i = 0; i < 4; i++) {
      out.push({
        id: `card-${rarity}-${i}` as CardId,
        name: `${rarity} ${i}`,
        type: 'action',
        rarity,
        description: 'synthetic test card',
        cost: 0,
        effects: [],
        tags: [],
      });
    }
  }
  return out;
}

describe('cardPackEngine — determinism and shape', () => {
  beforeEach(() => {
    CardSystem.clear();
    CardSystem.register(buildRegistry());
  });

  it('produces the configured cardCount per pack', () => {
    for (const def of cardPackEngine.allPackDefinitions()) {
      const result = cardPackEngine.openPack(def.id, 12345);
      expect(result.cards.length).toBe(def.cardCount);
    }
  });

  it('is deterministic — same seed yields same cards', () => {
    const a = cardPackEngine.openPack('standard', 99);
    const b = cardPackEngine.openPack('standard', 99);
    expect(a.cards.map((c) => c.id)).toEqual(b.cards.map((c) => c.id));
  });

  it('different seeds yield different packs (high probability)', () => {
    // We sample ~20 seeds and require at least one differs. With the
    // synthetic 24-card pool, the chance of full identity twice in a row
    // is astronomically small — but use a window to keep the test robust.
    const reference = cardPackEngine
      .openPack('premium', 1)
      .cards.map((c) => c.id)
      .join('|');
    let differs = false;
    for (let seed = 2; seed < 22; seed++) {
      const next = cardPackEngine.openPack('premium', seed).cards.map((c) => c.id).join('|');
      if (next !== reference) {
        differs = true;
        break;
      }
    }
    expect(differs).toBe(true);
  });

  it('sorts cards lowest→highest rarity', () => {
    const result = cardPackEngine.openPack('legendary', 7);
    const ranks = result.cards.map((c) => RARITY_ORDER.indexOf(c.rarity));
    for (let i = 1; i < ranks.length; i++) {
      expect(ranks[i]).toBeGreaterThanOrEqual(ranks[i - 1]);
    }
  });

  it('fulfils the declared guarantee', () => {
    // Premium pack guarantees ≥ 1 rare. Sample many seeds.
    const minIdx = RARITY_ORDER.indexOf(PACK_DEFINITIONS.premium.guarantee!.minRarity);
    for (let seed = 0; seed < 25; seed++) {
      const result = cardPackEngine.openPack('premium', seed);
      const meets = result.cards.some(
        (c) => RARITY_ORDER.indexOf(c.rarity) >= minIdx,
      );
      expect(meets).toBe(true);
    }
  });
});

describe('cardPackEngine — internals', () => {
  it('weightsToEntries skips zero-weight rarities', () => {
    const entries = weightsToEntries({
      common: 10,
      uncommon: 0,
      rare: 5,
      epic: 0,
      legendary: 0,
      prismatic: 0,
    });
    expect(entries.map((e) => e.rarity)).toEqual(['common', 'rare']);
  });

  it('rollRarity falls back to common on an all-zero table', () => {
    const rng = new SeededRNG(1);
    const r = rollRarity(
      {
        common: 0,
        uncommon: 0,
        rare: 0,
        epic: 0,
        legendary: 0,
        prismatic: 0,
      },
      rng,
    );
    expect(r).toBe('common');
  });

  it('pickByRarity walks UP when no card of that rarity exists', () => {
    const pool: CardDefinition[] = [
      {
        id: 'only-legendary' as CardId,
        name: 'L',
        type: 'wild',
        rarity: 'legendary',
        description: '',
        cost: 0,
        effects: [],
        tags: [],
      },
    ];
    const rng = new SeededRNG(42);
    const picked = pickByRarity(pool, 'common', rng);
    expect(picked?.rarity).toBe('legendary');
  });

  it('pickAtLeastRarity respects the floor', () => {
    const pool = buildRegistry();
    const rng = new SeededRNG(5);
    const minRarity: CardRarity = 'epic';
    const minIdx = RARITY_ORDER.indexOf(minRarity);
    for (let i = 0; i < 10; i++) {
      const card = pickAtLeastRarity(pool, minRarity, rng);
      expect(card).toBeDefined();
      expect(RARITY_ORDER.indexOf(card!.rarity)).toBeGreaterThanOrEqual(minIdx);
    }
  });
});

describe('cardPackEngine — distribution sanity', () => {
  beforeEach(() => {
    CardSystem.clear();
    CardSystem.register(buildRegistry());
  });

  it('starter pack pulls common most often', () => {
    const counts: Record<CardRarity, number> = {
      common: 0,
      uncommon: 0,
      rare: 0,
      epic: 0,
      legendary: 0,
      prismatic: 0,
    };
    for (let seed = 1; seed <= 50; seed++) {
      for (const c of cardPackEngine.openPack('starter', seed).cards) {
        counts[c.rarity]++;
      }
    }
    // Common should dominate by a wide margin in starter packs.
    expect(counts.common).toBeGreaterThan(counts.uncommon);
    expect(counts.common).toBeGreaterThan(counts.rare);
    // Legendary has weight 0 — must be exactly zero pulls.
    expect(counts.legendary).toBe(0);
    expect(counts.prismatic).toBe(0);
  });
});
