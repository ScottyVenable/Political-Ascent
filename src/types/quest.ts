import type { QuestId } from './common';
import type { Effect, Requirement } from './effect';

export type QuestType = 'issue' | 'political' | 'legacy' | 'hidden';

export type QuestStatus = 'active' | 'completed' | 'failed' | 'locked';

export interface QuestObjective {
  id: string;
  description: string;
  /** Declarative completion check; implementation-defined in QuestSystem. */
  check: Requirement | { type: 'pass_bill'; tags: string[] } | { type: 'week_elapsed'; weeks: number };
  completed: boolean;
}

export interface QuestDefinition {
  id: QuestId;
  type: QuestType;
  title: string;
  description: string;
  objectives: QuestObjective[];
  rewardEffects: Effect[];
  /** Time in in-game days before the quest auto-fails. `undefined` = untimed. */
  timeLimitDays?: number;
  /** IDs of prerequisite quests. */
  prerequisites: QuestId[];
}

export interface QuestInstance {
  instanceId: string;
  questId: QuestId;
  status: QuestStatus;
  startedAt: string;
  progress: Record<string, boolean>;
}
