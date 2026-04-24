import type { AchievementId } from './common';
import type { Requirement } from './effect';

export type AchievementCategory =
  | 'legislative'
  | 'political'
  | 'population'
  | 'press'
  | 'dark'
  | 'scenario'
  | 'hidden';

export interface AchievementDefinition {
  id: AchievementId;
  category: AchievementCategory;
  name: string;
  description: string;
  /** Hidden from the achievements screen until unlocked. */
  isSecret: boolean;
  /** Conditions ALL of which must hold to unlock. */
  conditions: Requirement[];
  /** Scenario this achievement is locked to, if any. */
  scenarioId?: string;
}
