import type { BillId } from './common';
import type { Effect } from './effect';

/** Bill lifecycle stages — aligned with GDD §8.1. */
export type BillStage =
  | 'draft'
  | 'committee'
  | 'floor_debate'
  | 'vote'
  | 'signed'
  | 'vetoed'
  | 'implementing'
  | 'enacted'
  | 'failed';

export type PolicyTag =
  | 'economy'
  | 'healthcare'
  | 'education'
  | 'defense'
  | 'civil_rights'
  | 'environment'
  | 'immigration'
  | 'criminal_justice'
  | 'taxation'
  | 'trade'
  | 'infrastructure'
  | 'constitutional';

/** Template used to instantiate new bills; lives in JSON. */
export interface BillTemplate {
  id: string;
  title: string;
  description: string;
  tags: PolicyTag[];
  /** Budget impact per year (negative = cost, positive = revenue). */
  budgetImpact: number;
  /** Political-capital cost to push through each stage. */
  pcCost: { committee: number; floor: number; vote: number };
  /** Baseline opposition on a 0–100 scale. */
  opposition: number;
  /** Days until effects manifest after enactment. */
  implementationDays: number;
  /**
   * Optional per-stage duration override (in simulated days).
   *
   * When omitted, defaults defined in `LegislationSystem.STAGE_DURATION_DAYS`
   * apply. Use this field to slow down constitutional amendments or speed up
   * emergency appropriations at the template level without touching code.
   */
  stageDurations?: Partial<Record<'committee' | 'floor_debate' | 'vote', number>>;
  /** Effects applied when the bill is enacted. */
  effects: Effect[];
  /** Population groups primarily affected (for UI highlights). */
  affectedGroups: string[];
}

/** A live bill instance — drafts, in-flight, or historical. */
export interface Bill {
  id: BillId;
  templateId: string;
  title: string;
  description: string;
  tags: PolicyTag[];
  stage: BillStage;
  sponsor: string; // player id or NPC id
  cosponsors: string[];
  pcInvested: number;
  opposition: number;
  supportVotes: number;
  opposeVotes: number;
  createdAt: string;
  enactedAt?: string;
  effects: Effect[];
  /**
   * Monotonic day counter (via `toEpochDays`) on which the bill entered its
   * current stage. Used together with the per-stage duration to compute how
   * many days remain before auto-advancement on the next daily tick.
   *
   * Legacy saves that predate the pacing pass will be missing this field;
   * the system treats an undefined value as "just entered this stage on the
   * day the save was loaded".
   */
  stageEnteredOnDay?: number;
  /**
   * Monotonic day counter at which the current stage auto-advances. Bills
   * in stages that have no clock (`draft`, `signed`, `failed`, etc.) carry
   * this as 0 / undefined.
   */
  stageEndsOnDay?: number;
}
