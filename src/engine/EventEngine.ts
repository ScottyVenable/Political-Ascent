import type {
  ActiveEvent,
  GameEventDefinition,
  EventOption,
  TriggerCondition,
  WeightedOutcome,
} from '@/types';
import { useGameStore } from '@/store/gameStore';
import { useWorldStore } from '@/store/worldStore';
import { useCharacterStore } from '@/store/characterStore';
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
  findDefinition(eventId: string): GameEventDefinition | undefined;
}

class EventEngineImpl implements EventEngineAPI {
  private registry = new Map<string, GameEventDefinition>();
  /**
   * Instance ids that are currently being resolved. Provides idempotency
   * against rapid double-clicks on an option button: the second invocation
   * sees the id in this set and bails before paying costs or applying effects
   * a second time. Cleared after the resolution completes.
   */
  private resolving = new Set<string>();
  private resolveCounter = 0;
  /**
   * Default cooldown (in weeks) for repeatable events that omit `cooldownWeeks`.
   * Four weeks (~one month) prevents the same crisis from firing day after day
   * while its trigger conditions remain true; it gives the player time to feel
   * the consequences before the next instance.
   */
  private static readonly DEFAULT_COOLDOWN_WEEKS = 4;

  registerEvents(defs: readonly GameEventDefinition[]): void {
    for (const d of defs) this.registry.set(d.id, d);
    log.info('registered', { count: defs.length });
  }

  findDefinition(eventId: string): GameEventDefinition | undefined {
    return this.registry.get(eventId);
  }

  checkDailyTriggers(): void {
    const world = useWorldStore.getState();
    const game = useGameStore.getState();
    const rng = new SeededRNG(world.seed + game.week);

    for (const def of this.registry.values()) {
      // Non-repeatable: skip if already fired (persistent set in worldStore so
      // save/load round-trips do not re-trigger one-shot events).
      if (!def.isRepeatable && world.firedEventIds.includes(def.id)) continue;
      // Avoid double-queuing while an instance of this event is on screen.
      if (world.activeEvents.some((e) => e.eventId === def.id)) continue;
      // Per-event cooldown: only relevant for repeatable events. Compares the
      // current week to the week stamped at last fire.
      if (def.isRepeatable) {
        const lastFired = world.eventCooldowns[def.id];
        const cooldown = def.cooldownWeeks ?? EventEngineImpl.DEFAULT_COOLDOWN_WEEKS;
        if (lastFired !== undefined && game.week - lastFired < cooldown) continue;
      }
      if (!this.evaluateConditions(def.triggerConditions, rng)) continue;

      const instance: ActiveEvent = {
        instanceId: makeId('evt', rng),
        eventId: def.id,
        queuedAt: `${game.currentDate.year}-${game.currentDate.month}-${game.currentDate.day}`,
      };
      world.queueEvent(instance);
      // Stamp cooldown the moment the event queues. This way a flapping
      // condition (e.g. unemployment briefly crossing a threshold during a
      // tick) cannot enqueue the same event twice in the same week.
      world.stampEventCooldown(def.id, game.week);
      if (!def.isRepeatable) world.markEventFired(def.id);
      log.debug('event queued', def.id);
    }
  }

  resolveOption(eventInstanceId: string, optionId: string): void {
    // Idempotency guard: if a resolution for this instance is already in
    // flight (e.g. the player double-clicked the option button before the
    // dismissEvent state update propagated), bail. Without this guard the
    // costs would be paid twice and effects applied twice.
    if (this.resolving.has(eventInstanceId)) return;

    const world = useWorldStore.getState();
    const active = world.activeEvents.find((e) => e.instanceId === eventInstanceId);
    if (!active) return;
    const def = this.registry.get(active.eventId);
    if (!def) return;
    const option = def.options.find((o: EventOption) => o.id === optionId);
    if (!option) return;

    this.resolving.add(eventInstanceId);
    try {
      // Pay costs.
      if (option.costs.pc) useGameStore.getState().addPoliticalCapital(-option.costs.pc);
      if (option.costs.ap) useGameStore.getState().spendAP(option.costs.ap);

      // Select weighted outcome deterministically from world seed + event chain counter.
      this.resolveCounter += 1;
      const rng = new SeededRNG(world.seed + this.resolveCounter * 97);
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
    } finally {
      this.resolving.delete(eventInstanceId);
    }
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
      case 'stat': {
        const stats = useCharacterStore.getState().stats as unknown as Record<string, number>;
        const val = stats[c.stat];
        if (typeof val !== 'number') return false;
        return compare(val, c.operator, c.value);
      }
    }
  }
}

function compare(left: number, op: 'gt' | 'lt' | 'eq', right: number): boolean {
  if (op === 'gt') return left > right;
  if (op === 'lt') return left < right;
  return left === right;
}

export const EventEngine: EventEngineAPI = new EventEngineImpl();
