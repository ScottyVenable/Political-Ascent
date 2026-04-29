/**
 * gameStore — treasury and capital action coverage.
 *
 * Targets the simple resource-mutation actions that other systems rely
 * on. Both PC and treasury share the same "floor at zero, never go
 * negative" invariant; the tests pin that behaviour so a future change
 * cannot silently introduce debt without updating the contract.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { useGameStore } from './gameStore';
import type { ScenarioId } from '@/types';

describe('gameStore — treasury', () => {
  beforeEach(() => {
    useGameStore.getState().reset();
  });

  it('starts at zero by default', () => {
    expect(useGameStore.getState().treasury).toBe(0);
  });

  it('addTreasury increases the balance', () => {
    useGameStore.getState().addTreasury(500);
    expect(useGameStore.getState().treasury).toBe(500);
    useGameStore.getState().addTreasury(250);
    expect(useGameStore.getState().treasury).toBe(750);
  });

  it('addTreasury floors at zero — no debt', () => {
    useGameStore.getState().addTreasury(100);
    useGameStore.getState().addTreasury(-500); // would go negative
    expect(useGameStore.getState().treasury).toBe(0);
  });

  it('initializeFromScenario resets treasury to zero', () => {
    useGameStore.getState().addTreasury(10_000);
    useGameStore.getState().initializeFromScenario('modern-america-2024' as ScenarioId, 50, 6);
    expect(useGameStore.getState().treasury).toBe(0);
  });
});

describe('gameStore — addPoliticalCapital', () => {
  beforeEach(() => {
    useGameStore.getState().reset();
  });

  it('floors at zero', () => {
    useGameStore.getState().addPoliticalCapital(-1_000);
    expect(useGameStore.getState().politicalCapital).toBe(0);
  });

  it('adds normally', () => {
    const before = useGameStore.getState().politicalCapital;
    useGameStore.getState().addPoliticalCapital(25);
    expect(useGameStore.getState().politicalCapital).toBe(before + 25);
  });
});
