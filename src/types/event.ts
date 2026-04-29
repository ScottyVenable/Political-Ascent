import type { EventId } from './common';
import type { Effect, Requirement } from './effect';

export type EventType =
  | 'crisis'
  | 'opportunity'
  | 'population'
  | 'political'
  | 'personal'
  | 'scheduled';

/** Declarative trigger condition — evaluated by EventEngine. */
export type TriggerCondition =
  | { type: 'date'; year?: number; month?: number; day?: number }
  | { type: 'stat'; stat: string; operator: 'gt' | 'lt' | 'eq'; value: number }
  | { type: 'flag'; flag: string; value: boolean }
  | { type: 'economy'; metric: string; operator: 'gt' | 'lt' | 'eq'; value: number }
  | { type: 'group_happiness'; group: string; operator: 'gt' | 'lt'; value: number }
  | { type: 'week'; mod: number }
  | { type: 'random'; chancePerDay: number };

export interface WeightedOutcome {
  weight: number;
  effects: Effect[];
  /** ID of a follow-up event to queue, creating event chains. */
  nextEvent?: string;
  flavor: string;
}

export interface EventOption {
  id: string;
  label: string;
  description?: string;
  costs: { ap?: number; pc?: number; cards?: string[] };
  requirements: Requirement[];
  outcomes: WeightedOutcome[];
}

/** Static event definition loaded from JSON. */
export interface GameEventDefinition {
  id: EventId;
  type: EventType;
  title: string;
  description: string;
  triggerConditions: TriggerCondition[];
  /** Probability weight used by the random trigger resolver. */
  weight: number;
  isRepeatable: boolean;
  /**
   * Minimum number of in-game weeks that must elapse after a fire before this
   * event may fire again. Only meaningful for `isRepeatable: true` events;
   * non-repeatable events are gated by `firedEventIds`. Defaults to 4 weeks
   * when omitted.
   */
  cooldownWeeks?: number;
  options: EventOption[];
}

/** Active event instance queued for player resolution. */
export interface ActiveEvent {
  instanceId: string;
  eventId: EventId;
  queuedAt: string;
}
