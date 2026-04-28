/**
 * EventEngine — unit tests for trigger gating, cooldowns, idempotency.
 *
 * Covers the bug fix in PR `exp--events-bugfix` (docs/todo.md item 7):
 *   "Events fire multiple times even after they've been resolved."
 *
 * The fix relies on three guards. Each test below targets one:
 *   1. Non-repeatable events are gated by the persisted `firedEventIds` set so
 *      a save/load round-trip cannot re-trigger them.
 *   2. Repeatable events respect a per-event cooldown (default 4 weeks).
 *   3. `resolveOption` is idempotent: a second call with the same instance id
 *      while the first is still in flight is a no-op.
 *
 * @module engine/EventEngine.test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { EventEngine } from './EventEngine';
import type { GameEventDefinition } from '@/types';
import { useGameStore } from '@/store/gameStore';
import { useWorldStore } from '@/store/worldStore';

// ──────────────────────────────────────────────────────────────
// Test helpers
// ──────────────────────────────────────────────────────────────

/**
 * Build a minimal but valid event definition for the engine. Trigger uses a
 * `flag` condition so we can deterministically toggle whether the event
 * should fire on any given tick.
 */
function makeEvent(overrides: Partial<GameEventDefinition> = {}): GameEventDefinition {
  return {
    id: ('evt-test-' + Math.random().toString(36).slice(2)) as GameEventDefinition['id'],
    type: 'opportunity',
    title: 'Test event',
    description: 'A trigger for unit tests.',
    triggerConditions: [{ type: 'flag', flag: 'test_fire', value: true }],
    weight: 1,
    isRepeatable: false,
    options: [
      {
        id: 'opt-noop',
        label: 'Do nothing',
        costs: {},
        requirements: [],
        outcomes: [{ weight: 1, effects: [], flavor: 'Nothing happened.' }],
      },
    ],
    ...overrides,
  };
}

/** Reset both stores to a known baseline before each test. */
beforeEach(() => {
  useWorldStore.getState().reset();
  useWorldStore.setState({ seed: 42 });
  useWorldStore.getState().setFlag('test_fire', true);
  useGameStore.setState({
    week: 1,
    currentDate: { year: 2024, month: 1, day: 1 },
  });
  // Wipe the engine registry indirectly by re-registering an empty list is
  // not supported; instead we rely on unique event ids per test (see makeEvent).
});

// ──────────────────────────────────────────────────────────────
// Specs
// ──────────────────────────────────────────────────────────────

describe('EventEngine — non-repeatable gating', () => {
  it('queues a non-repeatable event exactly once even across many daily ticks', () => {
    const def = makeEvent({ isRepeatable: false });
    EventEngine.registerEvents([def]);

    EventEngine.checkDailyTriggers();
    EventEngine.checkDailyTriggers();
    EventEngine.checkDailyTriggers();

    const matches = useWorldStore.getState().activeEvents.filter((e) => e.eventId === def.id);
    expect(matches).toHaveLength(1);
    expect(useWorldStore.getState().firedEventIds).toContain(def.id);
  });

  it('does not re-queue a non-repeatable event after it is resolved (the bug)', () => {
    const def = makeEvent({ isRepeatable: false });
    EventEngine.registerEvents([def]);

    EventEngine.checkDailyTriggers();
    const instance = useWorldStore.getState().activeEvents.find((e) => e.eventId === def.id);
    expect(instance).toBeDefined();
    EventEngine.resolveOption(instance!.instanceId, 'opt-noop');
    expect(useWorldStore.getState().activeEvents.filter((e) => e.eventId === def.id)).toHaveLength(0);

    // Advance a few weeks; the trigger flag is still true.
    useGameStore.setState({ week: 5 });
    EventEngine.checkDailyTriggers();
    EventEngine.checkDailyTriggers();

    const reFired = useWorldStore.getState().activeEvents.filter((e) => e.eventId === def.id);
    expect(reFired).toHaveLength(0);
  });
});

describe('EventEngine — repeatable cooldowns', () => {
  it('blocks a repeatable event from re-firing inside its cooldown window', () => {
    const def = makeEvent({ isRepeatable: true, cooldownWeeks: 4 });
    EventEngine.registerEvents([def]);

    EventEngine.checkDailyTriggers();
    expect(useWorldStore.getState().activeEvents.filter((e) => e.eventId === def.id)).toHaveLength(1);

    // Resolve the active instance.
    const instance = useWorldStore.getState().activeEvents.find((e) => e.eventId === def.id)!;
    EventEngine.resolveOption(instance.instanceId, 'opt-noop');
    expect(useWorldStore.getState().activeEvents.filter((e) => e.eventId === def.id)).toHaveLength(0);

    // 2 weeks later — still inside the 4-week cooldown.
    useGameStore.setState({ week: 3 });
    EventEngine.checkDailyTriggers();
    expect(useWorldStore.getState().activeEvents.filter((e) => e.eventId === def.id)).toHaveLength(0);

    // 5 weeks later — cooldown expired, event may fire again.
    useGameStore.setState({ week: 6 });
    EventEngine.checkDailyTriggers();
    expect(useWorldStore.getState().activeEvents.filter((e) => e.eventId === def.id)).toHaveLength(1);
  });
});

describe('EventEngine — resolveOption idempotency', () => {
  it('only applies costs once when called twice on the same instance', () => {
    const def = makeEvent({
      isRepeatable: false,
      options: [
        {
          id: 'opt-pay',
          label: 'Pay 5 PC',
          costs: { pc: 5 },
          requirements: [],
          outcomes: [{ weight: 1, effects: [], flavor: 'Done.' }],
        },
      ],
    });
    EventEngine.registerEvents([def]);
    useGameStore.setState({ politicalCapital: 100 });

    EventEngine.checkDailyTriggers();
    const instance = useWorldStore.getState().activeEvents.find((e) => e.eventId === def.id)!;

    // First call resolves and dismisses; second call (e.g. duplicate click)
    // must not match an active instance and therefore must not pay again.
    EventEngine.resolveOption(instance.instanceId, 'opt-pay');
    EventEngine.resolveOption(instance.instanceId, 'opt-pay');

    expect(useGameStore.getState().politicalCapital).toBe(95);
  });
});
