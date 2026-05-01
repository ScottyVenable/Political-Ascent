/**
 * EffectScheduler — defers Effect application via Effect.delayDays and drains
 * due entries on demand. See GDD §25 and applyEffect.ts.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { applyEffect, applyEffects, resetScheduleCounterForTests } from './applyEffect';
import { EffectScheduler } from './EffectScheduler';
import { useGameStore } from '@/store/gameStore';
import { useCharacterStore } from '@/store/characterStore';
import { useWorldStore } from '@/store/worldStore';
import type { ScenarioId } from '@/types';

describe('EffectScheduler', () => {
  beforeEach(() => {
    useGameStore.getState().reset();
    useCharacterStore.getState().reset();
    useWorldStore.getState().reset();
    resetScheduleCounterForTests();
    useWorldStore.getState().initializeWorld({
      scenarioId: 'test' as ScenarioId,
      population: [],
      seed: 1,
    });
  });

  it('immediate effects (no delayDays) skip the queue', () => {
    const startPC = useGameStore.getState().politicalCapital;
    applyEffect({ type: 'resource', resource: 'politicalCapital', value: 10 });
    expect(useGameStore.getState().politicalCapital).toBe(startPC + 10);
    expect(useWorldStore.getState().scheduledEffects).toHaveLength(0);
  });

  it('delayDays=0 is treated as immediate (queue is not used)', () => {
    const startPC = useGameStore.getState().politicalCapital;
    applyEffect({
      type: 'resource',
      resource: 'politicalCapital',
      value: 5,
      delayDays: 0,
    });
    expect(useGameStore.getState().politicalCapital).toBe(startPC + 5);
    expect(useWorldStore.getState().scheduledEffects).toHaveLength(0);
  });

  it('delayDays>0 enqueues the effect and does NOT mutate state immediately', () => {
    const startPC = useGameStore.getState().politicalCapital;
    applyEffect({
      type: 'resource',
      resource: 'politicalCapital',
      value: 25,
      delayDays: 7,
    });
    expect(useGameStore.getState().politicalCapital).toBe(startPC);
    const queue = useWorldStore.getState().scheduledEffects;
    expect(queue).toHaveLength(1);
    // Stored effect must not retain delayDays (otherwise re-applying would re-enqueue forever).
    expect((queue[0].effect as { delayDays?: number }).delayDays).toBeUndefined();
  });

  it('processDue applies effects whose due date has arrived', () => {
    const startPC = useGameStore.getState().politicalCapital;
    applyEffect(
      { type: 'resource', resource: 'politicalCapital', value: 25, delayDays: 3 },
      { kind: 'bill', id: 'HR-1' },
    );
    // Day 0: not yet due.
    expect(EffectScheduler.processDue()).toBe(0);
    expect(useGameStore.getState().politicalCapital).toBe(startPC);

    // Advance 3 game-days.
    useGameStore.getState().advanceDay();
    useGameStore.getState().advanceDay();
    useGameStore.getState().advanceDay();

    expect(EffectScheduler.processDue()).toBe(1);
    expect(useGameStore.getState().politicalCapital).toBe(startPC + 25);
    expect(useWorldStore.getState().scheduledEffects).toHaveLength(0);
  });

  it('processDue leaves not-yet-due effects in the queue', () => {
    applyEffect({ type: 'resource', resource: 'politicalCapital', value: 1, delayDays: 1 });
    applyEffect({ type: 'resource', resource: 'politicalCapital', value: 99, delayDays: 30 });

    useGameStore.getState().advanceDay(); // day 1 — first one due
    expect(EffectScheduler.processDue()).toBe(1);

    const remaining = useWorldStore.getState().scheduledEffects;
    expect(remaining).toHaveLength(1);
    expect((remaining[0].effect as { value: number }).value).toBe(99);
  });

  it('preserves source metadata for traceability', () => {
    applyEffect(
      { type: 'flag', flag: 'tariffs-active', value: true, delayDays: 14 },
      { kind: 'bill', id: 'S-42' },
    );
    const queue = useWorldStore.getState().scheduledEffects;
    expect(queue[0].source).toEqual({ kind: 'bill', id: 'S-42' });
  });

  it('applyEffects honors delayDays per entry', () => {
    const startPC = useGameStore.getState().politicalCapital;
    applyEffects([
      { type: 'resource', resource: 'politicalCapital', value: 10 },
      { type: 'resource', resource: 'politicalCapital', value: 20, delayDays: 2 },
    ]);
    expect(useGameStore.getState().politicalCapital).toBe(startPC + 10);
    expect(useWorldStore.getState().scheduledEffects).toHaveLength(1);
  });

  it('processDue is a no-op on an empty queue', () => {
    expect(EffectScheduler.processDue()).toBe(0);
  });
});
