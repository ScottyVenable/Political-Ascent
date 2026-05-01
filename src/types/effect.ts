import type { StatName } from './character';

/**
 * Universal effect schema. Every game effect (from events, cards, legislation,
 * skill unlocks) is represented as one of these variants and applied via
 * `applyEffect()` — never by mutating state directly.
 */
export type Effect =
  | StatEffect
  | ResourceEffect
  | GroupHappinessEffect
  | GroupLoyaltyEffect
  | RelationshipEffect
  | EconomyEffect
  | FlagEffect
  | CardGrantEffect
  | QuestTriggerEffect;

export interface EffectBase {
  /** Optional delay in game-days before the effect is applied. */
  delayDays?: number;
  /** Optional duration in game-days. `undefined` = permanent. */
  duration?: number;
}

export interface StatEffect extends EffectBase {
  type: 'stat';
  target: StatName;
  value: number;
}

export interface ResourceEffect extends EffectBase {
  type: 'resource';
  resource: 'politicalCapital' | 'actionPoints' | 'xp';
  value: number;
}

export interface GroupHappinessEffect extends EffectBase {
  type: 'group_happiness';
  group: string;
  value: number;
}

export interface GroupLoyaltyEffect extends EffectBase {
  type: 'group_loyalty';
  group: string;
  value: number;
}

export interface RelationshipEffect extends EffectBase {
  type: 'relationship';
  npcId: string;
  value: number;
}

export interface EconomyEffect extends EffectBase {
  type: 'economy';
  metric: 'gdpGrowth' | 'unemployment' | 'inflation' | 'debt' | 'deficit' | 'gini' | 'trade';
  value: number;
}

export interface FlagEffect extends EffectBase {
  type: 'flag';
  flag: string;
  value: boolean;
}

export interface CardGrantEffect extends EffectBase {
  type: 'grant_card';
  cardId: string;
}

export interface QuestTriggerEffect extends EffectBase {
  type: 'trigger_quest';
  questId: string;
}

/** Requirement / gate used by options and dialogue nodes. */
export type Requirement =
  | { type: 'stat'; stat: StatName; operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte'; value: number }
  | { type: 'trait'; traitId: string }
  | { type: 'relationship'; npcId: string; operator: 'gt' | 'lt'; value: number }
  | { type: 'flag'; flag: string; value: boolean };

/**
 * A single Effect deferred until a future game-day.
 *
 * Created by `applyEffect()` whenever an Effect carries `delayDays > 0`.
 * Drained by `EffectScheduler.processDue()` which runs from the daily
 * TimeEngine hook. See GDD §25 for the full lifecycle.
 */
export interface ScheduledEffect {
  /** Stable id for save migration and cancellation. */
  id: string;
  /** The effect to apply when due. `delayDays` is cleared on the stored copy. */
  effect: Effect;
  /** Game-day epoch (toEpochDays) at which to apply. */
  applyOnEpochDay: number;
  /** Optional traceability — what scheduled this effect. */
  source?: { kind: 'bill' | 'event' | 'card' | 'speech' | 'system'; id: string };
}
