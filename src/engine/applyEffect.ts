import type { Effect } from '@/types';
import { useGameStore } from '@/store/gameStore';
import { useCharacterStore } from '@/store/characterStore';
import { useWorldStore } from '@/store/worldStore';
import { clamp } from '@/utils/math';

/**
 * The one and only entry point for applying game effects.
 *
 * Every card play, event resolution, and legislation outcome funnels through
 * here. This is the choke point where we keep simulation consistency — if an
 * effect doesn't go through `applyEffect`, it is almost certainly a bug.
 *
 * Delayed/durational effects are NOT implemented here yet — MVP applies all
 * effects immediately. `delayDays` and `duration` metadata is preserved on the
 * Effect shape so a post-MVP scheduler can honor them.
 */
export function applyEffect(effect: Effect): void {
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
export function applyEffects(effects: readonly Effect[]): void {
  for (const e of effects) applyEffect(e);
}
