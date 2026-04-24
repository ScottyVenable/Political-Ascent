import { useGameStore } from '@/store/gameStore';
import { useWorldStore } from '@/store/worldStore';
import { useCharacterStore } from '@/store/characterStore';
import { clamp } from '@/utils/math';

/**
 * InfluenceSystem — generates political capital and tracks leverage.
 *
 * Weekly PC generation is driven by character charisma, legislator
 * relationships, and population loyalty. Leverage is an per-NPC hidden score
 * the player can spend to coerce legislators.
 */
export interface InfluenceSystemAPI {
  weeklyUpdate(): void;
  /** Apply a leverage delta against a specific NPC. */
  adjustLeverage(npcId: string, delta: number): void;
  /** Consume leverage to force a relationship shift; returns whether it succeeded. */
  spendLeverage(npcId: string, amount: number, relationshipDelta: number): boolean;
}

export const InfluenceSystem: InfluenceSystemAPI = {
  weeklyUpdate() {
    const char = useCharacterStore.getState();
    const world = useWorldStore.getState();

    // Base: charisma contributes PC, ally loyalty contributes a small amount.
    const base = Math.round(char.stats.charisma * 0.8);
    const allyBoost = world.congress.senate.filter((l) => l.relationship > 40).length;
    const groupLoyaltyMean =
      world.population.length > 0
        ? world.population.reduce((s, g) => s + g.loyalty, 0) / world.population.length
        : 0;
    const groupBoost = Math.round(groupLoyaltyMean / 20);

    const gain = clamp(base + allyBoost + groupBoost, 0, 60);
    if (gain > 0) useGameStore.getState().addPoliticalCapital(gain);
  },

  adjustLeverage(npcId, delta) {
    const world = useWorldStore.getState();
    const current = world.leverage[npcId] ?? 0;
    useWorldStore.setState((s) => ({
      ...s,
      leverage: { ...s.leverage, [npcId]: clamp(current + delta, 0, 100) },
    }));
  },

  spendLeverage(npcId, amount, relationshipDelta) {
    const world = useWorldStore.getState();
    const have = world.leverage[npcId] ?? 0;
    if (have < amount) return false;

    useWorldStore.setState((s) => {
      const newLeverage = clamp(have - amount, 0, 100);
      const nextLeverage = { ...s.leverage, [npcId]: newLeverage };
      return { ...s, leverage: nextLeverage };
    });

    // Apply relationship shift to matching legislator, if any.
    const all = [...world.congress.senate, ...world.congress.house];
    const target = all.find((l) => (l.id as unknown as string) === npcId);
    if (target) {
      world.updateLegislator(target.id, {
        relationship: clamp(target.relationship + relationshipDelta, -100, 100),
      });
    }
    return true;
  },
};
