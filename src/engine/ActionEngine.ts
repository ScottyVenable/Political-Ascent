import { useGameStore } from '@/store/gameStore';
import { useCharacterStore } from '@/store/characterStore';

/**
 * Validates and performs AP-costing actions.
 *
 * Every user-initiated action that costs Action Points must go through
 * `tryAct`. Returning `false` means the action was rejected (insufficient AP,
 * invalid state) and the caller must abort without mutating anything.
 */
export interface ActionEngineAPI {
  /** Attempts to spend `ap` action points. Returns true if successful. */
  tryAct(ap: number): boolean;

  /** Regenerates AP on a weekly cadence based on stamina stat. */
  weeklyRegenerate(): void;

  /** Sets the player's max AP based on stamina (GDD §5.2). */
  recalculateMaxAP(): void;
}

/** Base AP per week from stamina: linear 4→10 across stats 1→10. */
function maxAPForStamina(stamina: number): number {
  return Math.round(4 + (stamina - 1) * (6 / 9));
}

export const ActionEngine: ActionEngineAPI = {
  tryAct(ap) {
    if (ap <= 0) return true;
    const game = useGameStore.getState();
    if (game.isPaused || game.isGameOver) return false;
    return game.spendAP(ap);
  },

  weeklyRegenerate() {
    const { stats } = useCharacterStore.getState();
    const regen = Math.max(1, Math.round(stats.stamina / 2));
    useGameStore.getState().regenerateAP(regen);
  },

  recalculateMaxAP() {
    const { stats } = useCharacterStore.getState();
    useGameStore.getState().setMaxAP(maxAPForStamina(stats.stamina));
  },
};
