import type { PopulationGroup, EconomicState } from '@/types';
import { useWorldStore } from '@/store/worldStore';
import { clamp } from '@/utils/math';

/**
 * PopulationSystem — weekly update logic for demographic groups.
 *
 * Happiness / radicalism drift is a function of:
 *  - Baseline drift toward a scenario-defined equilibrium.
 *  - Economic effects (unemployment hits workers, inflation hits all).
 *  - Recent policy effects (applied via `applyEffect` already — not re-applied here).
 */
export interface PopulationSystemAPI {
  weeklyUpdate(): void;
  getGroup(id: string): PopulationGroup | undefined;
}

const HAPPINESS_DRIFT = 0.5; // per week, toward 50
const RADICALISM_DECAY = 1.0; // per week, toward baseline activism

/** Maps economic metrics to happiness pressure on a group. */
function economicPressure(group: PopulationGroup, econ: EconomicState): number {
  let delta = 0;

  // Unemployment mostly hits working-class and industrial workers.
  if (group.tags.includes('working') || group.tags.includes('industrial')) {
    delta -= (econ.unemployment - 4.0) * 0.8;
  } else {
    delta -= (econ.unemployment - 4.0) * 0.2;
  }

  // Inflation hits everyone; retirees and underclass hardest.
  const inflationHit = Math.max(0, econ.inflation - 2.5);
  const inflWeight = group.tags.includes('retired') || group.tags.includes('underclass') ? 1.2 : 0.6;
  delta -= inflationHit * inflWeight;

  // GDP growth lifts business / professional groups.
  if (group.tags.includes('business') || group.tags.includes('professional')) {
    delta += (econ.gdpGrowth - 2.0) * 0.8;
  } else {
    delta += (econ.gdpGrowth - 2.0) * 0.3;
  }

  return delta;
}

export const PopulationSystem: PopulationSystemAPI = {
  weeklyUpdate() {
    const world = useWorldStore.getState();
    const { economy, population } = world;

    for (const group of population) {
      const econ = economicPressure(group, economy);

      const happinessDrift = (50 - group.happiness) * (HAPPINESS_DRIFT / 50);
      const newHappiness = clamp(group.happiness + happinessDrift + econ, 0, 100);

      const radicalismPressure = newHappiness < 40 ? (40 - newHappiness) * 0.1 : -RADICALISM_DECAY;
      const newRadicalism = clamp(group.radicalism + radicalismPressure, 0, 100);

      world.updateGroup(group.id, {
        happiness: newHappiness,
        radicalism: newRadicalism,
      });
    }
  },

  getGroup(id) {
    return useWorldStore.getState().population.find((p) => p.id === id);
  },
};
