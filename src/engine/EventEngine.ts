import type {
  ActiveEvent,
  GameEventDefinition,
  EventOption,
  TriggerCondition,
  WeightedOutcome,
} from '@/types';
import { useGameStore } from '@/store/gameStore';
import { useWorldStore } from '@/store/worldStore';
import { SeededRNG, weightedRandom } from '@/utils/random';
import { applyEffects } from './applyEffect';
import { makeId } from '@/utils/id';
import { createLogger } from '@/utils/logger';

const log = createLogger('EventEngine');

/**
 * The event engine evaluates declarative trigger conditions, selects outcomes,
 * and applies their effects. Event definitions come from JSON — this engine
 * never hardcodes event logic.
 */
export interface EventEngineAPI {
  registerEvents(defs: readonly GameEventDefinition[]): void;
  checkDailyTriggers(): void;
  resolveOption(eventInstanceId: string, optionId: string): void;
}

class EventEngineImpl implements EventEngineAPI {
  private registry = new Map<string, GameEventDefinition>();
  private firedOnce = new Set<string>();

  registerEvents(defs: readonly GameEventDefinition[]): void {
    for (const d of defs) this.registry.set(d.id, d);
    log.info('registered', { count: defs.length });
  }

  checkDailyTriggers(): void {
    const world = useWorldStore.getState();
    const rng = new SeededRNG(world.seed + useGameStore.getState().week);

    for (const def of this.registry.values()) {
      if (!def.isRepeatable && this.firedOnce.has(def.id)) continue;
      if (world.activeEvents.some((e) => e.eventId === def.id)) continue;
      if (!this.evaluateConditions(def.triggerConditions, rng)) continue;

      const instance: ActiveEvent = {
        instanceId: makeId('evt', rng),
        eventId: def.id,
        queuedAt: `${useGameStore.getState().currentDate.year}-${useGameStore
          .getState()
          .currentDate.month}-${useGameStore.getState().currentDate.day}`,
      };
      world.queueEvent(instance);
      if (!def.isRepeatable) this.firedOnce.add(def.id);
      log.debug('event queued', def.id);
    }
  }

  resolveOption(eventInstanceId: string, optionId: string): void {
    const world = useWorldStore.getState();
    const active = world.activeEvents.find((e) => e.instanceId === eventInstanceId);
    if (!active) return;
    const def = this.registry.get(active.eventId);
    if (!def) return;
    const option = def.options.find((o: EventOption) => o.id === optionId);
    if (!option) return;

    // Pay costs.
    if (option.costs.pc) useGameStore.getState().addPoliticalCapital(-option.costs.pc);
    if (option.costs.ap) useGameStore.getState().spendAP(option.costs.ap);

    // Select weighted outcome.
    const rng = new SeededRNG(world.seed + Date.now());
    const outcome: WeightedOutcome = weightedRandom(option.outcomes, rng);
    applyEffects(outcome.effects);

    world.pushNews({
      id: makeId('news', rng),
      date: useGameStore.getState().currentDate,
      headline: def.title,
      body: outcome.flavor,
      severity: def.type === 'crisis' ? 'warning' : 'info',
    });

    world.dismissEvent(eventInstanceId);
  }

  private evaluateConditions(conditions: readonly TriggerCondition[], rng: SeededRNG): boolean {
    return conditions.every((c) => this.evaluate(c, rng));
  }

  private evaluate(c: TriggerCondition, rng: SeededRNG): boolean {
    const game = useGameStore.getState();
    const world = useWorldStore.getState();
    switch (c.type) {
      case 'date':
        return (
          (c.year === undefined || c.year === game.currentDate.year) &&
          (c.month === undefined || c.month === game.currentDate.month) &&
          (c.day === undefined || c.day === game.currentDate.day)
        );
      case 'flag':
        return (world.flags[c.flag] ?? false) === c.value;
      case 'random':
        return rng.chance(c.chancePerDay);
      case 'week':
        return game.week % c.mod === 0;
      case 'economy':
        return compare(world.economy[c.metric as keyof typeof world.economy] as number, c.operator, c.value);
      case 'group_happiness': {
        const g = world.population.find((p) => p.id === c.group);
        return g ? compare(g.happiness, c.operator, c.value) : false;
      }
      case 'stat':
        // Stat conditions on player character could be added here; MVP skips.
        return true;
    }
  }
}

function compare(left: number, op: 'gt' | 'lt' | 'eq', right: number): boolean {
  if (op === 'gt') return left > right;
  if (op === 'lt') return left < right;
  return left === right;
}

export const EventEngine: EventEngineAPI = new EventEngineImpl();
