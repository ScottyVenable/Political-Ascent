/**
 * EconomySystem — weeklyUpdate should be deterministic given the world seed
 * and the game week, and should keep values within documented bounds.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { EconomySystem } from './EconomySystem';
import { useWorldStore } from '@/store/worldStore';
import { useGameStore } from '@/store/gameStore';
import type { ScenarioId } from '@/types';

function setup(seed: number): void {
  useGameStore.getState().reset();
  useWorldStore.getState().reset();
  useWorldStore.getState().initializeWorld({
    scenarioId: 'test' as ScenarioId,
    seed,
    economy: {
      gdpGrowth: 2.1,
      unemployment: 4.0,
      inflation: 3.2,
      debt: 30000,
      deficit: 1500,
      gini: 0.4,
      trade: -800,
      history: [],
    },
  });
}

describe('EconomySystem.weeklyUpdate', () => {
  beforeEach(() => setup(777));

  it('produces identical economy state for identical seed + week', () => {
    useGameStore.setState((s) => ({ ...s, week: 3 }));
    EconomySystem.weeklyUpdate();
    const first = { ...useWorldStore.getState().economy };

    setup(777);
    useGameStore.setState((s) => ({ ...s, week: 3 }));
    EconomySystem.weeklyUpdate();
    const second = { ...useWorldStore.getState().economy };

    expect(first.gdpGrowth).toBeCloseTo(second.gdpGrowth, 10);
    expect(first.unemployment).toBeCloseTo(second.unemployment, 10);
    expect(first.inflation).toBeCloseTo(second.inflation, 10);
  });

  it('clamps unemployment to documented bounds', () => {
    for (let i = 0; i < 200; i++) {
      useGameStore.setState((s) => ({ ...s, week: i }));
      EconomySystem.weeklyUpdate();
      const e = useWorldStore.getState().economy;
      expect(e.unemployment).toBeGreaterThanOrEqual(2.5);
      expect(e.unemployment).toBeLessThanOrEqual(15);
      expect(e.gdpGrowth).toBeGreaterThanOrEqual(-4);
      expect(e.gdpGrowth).toBeLessThanOrEqual(6);
    }
  });
});
