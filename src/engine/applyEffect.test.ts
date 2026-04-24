/**
 * applyEffect — every effect branch should mutate the correct store slice.
 *
 * These tests intentionally touch actual Zustand stores (not mocks) because
 * applyEffect IS the contract between the effect type system and the stores.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { applyEffect, applyEffects } from './applyEffect';
import { useGameStore } from '@/store/gameStore';
import { useCharacterStore } from '@/store/characterStore';
import { useWorldStore } from '@/store/worldStore';
import type { ScenarioId } from '@/types';

describe('applyEffect', () => {
  beforeEach(() => {
    useGameStore.getState().reset();
    useCharacterStore.getState().reset();
    useWorldStore.getState().reset();
    // Seed a minimal world with one population group for group_ tests.
    useWorldStore.getState().initializeWorld({
      scenarioId: 'test' as ScenarioId,
      population: [
        {
          id: 'g1',
          name: 'Test Group',
          size: 10,
          happiness: 50,
          radicalism: 10,
          income: 50,
          loyalty: 0,
          activism: 30,
          ideologyBias: 0,
          tags: [],
        },
      ],
      seed: 42,
    });
  });

  it('stat effect updates the named stat', () => {
    useCharacterStore.getState().setCharacter({
      ...useCharacterStore.getState(),
      stats: { charisma: 5, strategy: 5, connections: 5, integrity: 5, wealth: 5, stamina: 5 },
    });
    applyEffect({ type: 'stat', target: 'charisma', value: 2 });
    expect(useCharacterStore.getState().stats.charisma).toBe(7);
  });

  it('resource:politicalCapital adjusts PC', () => {
    const startPC = useGameStore.getState().politicalCapital;
    applyEffect({ type: 'resource', resource: 'politicalCapital', value: 25 });
    expect(useGameStore.getState().politicalCapital).toBe(startPC + 25);
  });

  it('resource:xp adds XP', () => {
    applyEffect({ type: 'resource', resource: 'xp', value: 60 });
    expect(useCharacterStore.getState().xp).toBeGreaterThanOrEqual(60);
  });

  it('group_happiness clamps to [0,100]', () => {
    applyEffect({ type: 'group_happiness', group: 'g1', value: 200 });
    expect(useWorldStore.getState().population[0].happiness).toBe(100);
    applyEffect({ type: 'group_happiness', group: 'g1', value: -500 });
    expect(useWorldStore.getState().population[0].happiness).toBe(0);
  });

  it('flag effect sets the named flag', () => {
    applyEffect({ type: 'flag', flag: 'test-flag', value: true });
    expect(useWorldStore.getState().flags['test-flag']).toBe(true);
  });

  it('economy effect adjusts the named metric', () => {
    const startGDP = useWorldStore.getState().economy.gdpGrowth;
    applyEffect({ type: 'economy', metric: 'gdpGrowth', value: 0.5 });
    expect(useWorldStore.getState().economy.gdpGrowth).toBeCloseTo(startGDP + 0.5, 4);
  });

  it('applyEffects applies all effects in order', () => {
    const startPC = useGameStore.getState().politicalCapital;
    applyEffects([
      { type: 'resource', resource: 'politicalCapital', value: 10 },
      { type: 'resource', resource: 'politicalCapital', value: 5 },
      { type: 'flag', flag: 'chained', value: true },
    ]);
    expect(useGameStore.getState().politicalCapital).toBe(startPC + 15);
    expect(useWorldStore.getState().flags['chained']).toBe(true);
  });
});
