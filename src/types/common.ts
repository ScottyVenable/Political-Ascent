/** Common primitive types shared across all systems. */

/** An in-game calendar date. The simulation advances one day per tick at 1x speed. */
export interface GameDate {
  year: number;
  month: number; // 1-12
  day: number;   // 1-31
}

/** A pairing of current and maximum for bounded resources (AP, HP-like). */
export interface Bounded {
  current: number;
  max: number;
}

/** Speed multipliers allowed by the time engine. 0 = paused. */
export type GameSpeed = 0 | 1 | 2 | 4;

/** 2-axis political compass point. Each axis is normalized to [-1, 1]. */
export interface IdeologyPoint {
  /** -1 = economic left, +1 = economic right */
  x: number;
  /** -1 = libertarian, +1 = authoritarian */
  y: number;
}

/** Generic severity ladder used across events and crises. */
export type Severity = 'minor' | 'moderate' | 'major' | 'catastrophic';

/** Generic classification for press reactions. */
export type PressReaction = 'favorable' | 'neutral' | 'critical';

/** Branded string ID types — cheap runtime strings, extra compile-time safety. */
export type CardId = string & { readonly __brand: 'CardId' };
export type BillId = string & { readonly __brand: 'BillId' };
export type EventId = string & { readonly __brand: 'EventId' };
export type QuestId = string & { readonly __brand: 'QuestId' };
export type NpcId = string & { readonly __brand: 'NpcId' };
export type TraitId = string & { readonly __brand: 'TraitId' };
export type AchievementId = string & { readonly __brand: 'AchievementId' };
export type ScenarioId = string & { readonly __brand: 'ScenarioId' };
