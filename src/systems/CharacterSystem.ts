import type { Background, CoreStats, TraitId } from '@/types';

/**
 * CharacterSystem — stat derivation, background bonuses, presets.
 *
 * This is a pure module. It never imports from stores or the engine directly —
 * consumers (CharacterCreation, skill unlock handlers) call these helpers and
 * then dispatch store actions themselves.
 */
export interface CharacterSystemAPI {
  applyBackgroundBonuses(base: CoreStats, background: Background): CoreStats;
  validateStatDistribution(stats: CoreStats): { valid: boolean; reason?: string };
  availableTraitsFor(background: Background): TraitId[];
  getBackgroundStartingPC(background: Background): number;
}

const BG_BONUSES: Record<Background, Partial<CoreStats>> = {
  citizen:   { charisma: 2, integrity: 2, connections: -1, wealth: -2 },
  veteran:   { connections: 3, strategy: 2, integrity: -1 },
  executive: { wealth: 4, connections: 2, charisma: 1, integrity: -2 },
};

/**
 * Traits available for selection at character creation, split by background.
 * "Universal" traits can be picked by anyone.
 */
const NATIVE_TRAITS: Record<Background, TraitId[]> = {
  citizen: ['grassroots-organizer', 'scandal-survivor', 'ideological-purist'] as unknown as TraitId[],
  veteran: ['veteran-orator', 'dealmaker', 'iron-will'] as unknown as TraitId[],
  executive: ['old-money', 'media-darling', 'pragmatist'] as unknown as TraitId[],
};

const UNIVERSAL_TRAITS: TraitId[] = ['street-smart', 'dealmaker'] as unknown as TraitId[];

const BG_STARTING_PC: Record<Background, number> = {
  citizen: 40,
  veteran: 60,
  executive: 55,
};

function clampStats(stats: CoreStats): CoreStats {
  const clamp = (n: number): number => Math.max(1, Math.min(10, n));
  return {
    charisma: clamp(stats.charisma),
    strategy: clamp(stats.strategy),
    connections: clamp(stats.connections),
    integrity: clamp(stats.integrity),
    wealth: clamp(stats.wealth),
    stamina: clamp(stats.stamina),
  };
}

export const CharacterSystem: CharacterSystemAPI = {
  applyBackgroundBonuses(base, background) {
    const bonus = BG_BONUSES[background];
    return clampStats({
      charisma: base.charisma + (bonus.charisma ?? 0),
      strategy: base.strategy + (bonus.strategy ?? 0),
      connections: base.connections + (bonus.connections ?? 0),
      integrity: base.integrity + (bonus.integrity ?? 0),
      wealth: base.wealth + (bonus.wealth ?? 0),
      stamina: base.stamina + (bonus.stamina ?? 0),
    });
  },

  validateStatDistribution(stats) {
    const total = stats.charisma + stats.strategy + stats.connections +
                  stats.integrity + stats.wealth + stats.stamina;
    // MVP: 30-point budget, each stat 1–10.
    if (total > 36) return { valid: false, reason: 'Stat total exceeds budget (max 36)' };
    if (total < 24) return { valid: false, reason: 'Stat total below minimum (24)' };
    for (const [k, v] of Object.entries(stats)) {
      if (v < 1 || v > 10) return { valid: false, reason: `${k} out of range (1–10)` };
    }
    return { valid: true };
  },

  availableTraitsFor(background) {
    return [...NATIVE_TRAITS[background], ...UNIVERSAL_TRAITS];
  },

  getBackgroundStartingPC(background) {
    return BG_STARTING_PC[background];
  },
};
