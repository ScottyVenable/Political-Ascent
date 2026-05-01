import type { Effect, ScheduledEffect } from '@/types';
import { useGameStore } from '@/store/gameStore';
import { useCharacterStore } from '@/store/characterStore';
import { useWorldStore } from '@/store/worldStore';
import { clamp } from '@/utils/math';
import { toEpochDays } from '@/utils/date';

/** Monotonic counter for deterministic-looking scheduled-effect ids. */
let _scheduleCounter = 0;

/** Reset the schedule-id counter — used by tests for deterministic ids. */
export function resetScheduleCounterForTests(): void {
  _scheduleCounter = 0;
}

/**
 * The one and only entry point for applying game effects.
 *
 * Every card play, event resolution, and legislation outcome funnels through
 * here. This is the choke point where we keep simulation consistency — if an
 * effect doesn't go through `applyEffect`, it is almost certainly a bug.
 *
 * If `effect.delayDays > 0`, the effect is enqueued on
 * `worldStore.scheduledEffects` and applied later by `EffectScheduler.processDue`
 * from the daily TimeEngine hook. See GDD §25.
 *
 * Note: `effect.duration` is preserved on the Effect shape but not yet honored.
 * A reverting-effect implementation is planned for a follow-up.
 */
export function applyEffect(
  effect: Effect,
  source?: ScheduledEffect['source'],
): void {
  if (effect.delayDays && effect.delayDays > 0) {
    const currentDate = useGameStore.getState().currentDate;
    const applyOnEpochDay = toEpochDays(currentDate) + effect.delayDays;
    // Strip delayDays so the eventual immediate-apply doesn't re-enqueue.
    const { delayDays: _drop, ...rest } = effect;
    void _drop;
    const stored = rest as Effect;
    const id = `sch-${applyOnEpochDay}-${++_scheduleCounter}`;
    useWorldStore.getState().enqueueScheduledEffect({
      id,
      effect: stored,
      applyOnEpochDay,
      source,
    });
    return;
  }
  applyEffectImmediate(effect);
}

/**
 * Apply an effect immediately, bypassing the deferred-effect queue. Used by
 * `EffectScheduler.processDue()` to drain due effects without recursion.
 *
 * Callers in simulation code should generally prefer `applyEffect` so that
 * `delayDays` is honored.
 */
export function applyEffectImmediate(effect: Effect): void {
  switch (effect.type) {
    case 'stat': {
      useCharacterStore.getState().updateStat(effect.target, effect.value);
      break;
    }

    case 'resource': {
      if (effect.resource === 'politicalCapital') {
        useGameStore.getState().addPoliticalCapital(effect.value);
      } else if (effect.resource === 'actionPoints') {
        useGameStore.getState().regenerateAP(effect.value);
      } else if (effect.resource === 'xp') {
        useCharacterStore.getState().addXP(effect.value);
      }
      break;
    }

    case 'group_happiness': {
      const world = useWorldStore.getState();
      const group = world.population.find((g) => g.id === effect.group);
      if (group) {
        world.updateGroup(effect.group, {
          happiness: clamp(group.happiness + effect.value, 0, 100),
        });
      }
      break;
    }

    case 'group_loyalty': {
      const world = useWorldStore.getState();
      const group = world.population.find((g) => g.id === effect.group);
      if (group) {
        world.updateGroup(effect.group, {
          loyalty: clamp(group.loyalty + effect.value, -100, 100),
        });
      }
      break;
    }

    case 'relationship': {
      const world = useWorldStore.getState();
      const current = world.relationships[effect.npcId] ?? 0;
      useWorldStore.setState((s) => ({
        relationships: {
          ...s.relationships,
          [effect.npcId]: clamp(current + effect.value, -100, 100),
        },
      }));
      break;
    }

    case 'economy': {
      const world = useWorldStore.getState();
      const current = world.economy[effect.metric];
      world.updateEconomy({ [effect.metric]: current + effect.value });
      break;
    }

    case 'flag': {
      useWorldStore.getState().setFlag(effect.flag, effect.value);
      break;
    }

    case 'grant_card': {
      // MVP: logged only. Full implementation pending card definitions registry.
      useWorldStore.getState().pushNews({
        id: `card-grant-${Date.now()}`,
        date: useGameStore.getState().currentDate,
        headline: `New card acquired: ${effect.cardId}`,
        severity: 'info',
      });
      break;
    }

    case 'trigger_quest': {
      // QuestSystem owns quest instantiation; here we just set a flag so the
      // system picks it up on its next tick.
      useWorldStore.getState().setFlag(`quest-requested:${effect.questId}`, true);
      break;
    }
  }
}

/** Batch helper for lists of effects. */
export function applyEffects(
  effects: readonly Effect[],
  source?: ScheduledEffect['source'],
): void {
  for (const e of effects) applyEffect(e, source);
}
