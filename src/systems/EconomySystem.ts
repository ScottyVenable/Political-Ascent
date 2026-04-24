import type { EconomicState } from '@/types';
import { useGameStore } from '@/store/gameStore';
import { useWorldStore } from '@/store/worldStore';

/**
 * EconomySystem — advances macro-economic metrics weekly/monthly.
 *
 * The model is intentionally simple for MVP:
 *  - GDP growth has a small weekly noise.
 *  - Unemployment tracks inverse of GDP with lag.
 *  - Inflation drifts based on debt/deficit trajectory.
 *  - Debt compounds with deficit annually.
 */
export interface EconomySystemAPI {
  weeklyUpdate(): void;
  monthlyReport(): void;
  annualReport(): void;
}

export const EconomySystem: EconomySystemAPI = {
  weeklyUpdate() {
    const world = useWorldStore.getState();
    const e = world.economy;
    // Small stochastic drift. Weekly delta is small — roughly ±0.02% on GDP.
    const drift = (Math.sin(useGameStore.getState().week) + Math.cos(useGameStore.getState().week * 2)) * 0.02;

    const next: Partial<EconomicState> = {
      gdpGrowth: clamp(e.gdpGrowth + drift, -4, 6),
      unemployment: clamp(e.unemployment + (3.0 - e.gdpGrowth) * 0.02, 2.5, 15),
      inflation: clamp(e.inflation + (e.deficit / 5000) * 0.05, 0, 12),
    };
    world.updateEconomy(next);
  },

  monthlyReport() {
    const world = useWorldStore.getState();
    // `metrics` is `Omit<EconomicState, 'history'>` — strip history explicitly
    // rather than nesting snapshots of snapshots.
    const { history: _history, ...metrics } = world.economy;
    void _history;
    world.appendEconomySnapshot({
      date: useGameStore.getState().currentDate,
      metrics,
    });
  },

  annualReport() {
    const world = useWorldStore.getState();
    const e = world.economy;
    world.updateEconomy({ debt: e.debt + e.deficit });
  },
};

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}
