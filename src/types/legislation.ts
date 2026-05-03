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
  /**
   * Legal vehicle for the bill. Affects baseline opposition, per-stage PC
   * cost, and stage durations; see {@link BILL_TYPE_MODIFIERS} in
   * `src/utils/billType.ts`. Optional for backwards compatibility with the
   * original 10 templates which all default to `act`.
   */
  type?: BillType;
  /**
   * One-line stated purpose. Optional for static templates (they derive
   * purpose from `description`); the drafting wizard always sets it.
   */
  purpose?: string;
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

/**
 * Legal vehicle for a bill — affects opposition, PC cost, and stage durations.
 * Documented in `docs/LEGISLATION_OVERHAUL_PLAN.md` §3.1.
 */
export type BillType =
  /** Non-binding statement; cheap, low-opposition, limited effect set. */
  | 'resolution'
  /** Default. The behaviour the original 10 templates were tuned for. */
  | 'act'
  /** Constitutional amendment — high opposition, expensive, slow. */
  | 'amendment'
  /** Spending bill — must include at least one fiscal module. */
  | 'appropriations';

/** A live bill instance — drafts, in-flight, or historical. */
export interface Bill {
  id: BillId;
  templateId: string;
  title: string;
  description: string;
  /**
   * Legal vehicle. Mirrors the `type` field on `BillTemplate`. Optional so
   * legacy save files (drafted before the overhaul) load without error; the
   * UI falls back to `'act'` when this is undefined.
   */
  type?: BillType;
  /**
   * One-line stated purpose written by the player in the drafting wizard.
   * Surfaces in the bill text preview and may be used in future NPC
   * dialogue and press-conference copy.
   */
  purpose?: string;
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

/**
 * Policy module — a reusable rider that the player can attach to a bill
 * during deep-draft. Modules contribute additive deltas to opposition
 * and budget impact, and append their own effects to the bill's effect
 * list. Designed so a designer can introduce a new module by editing
 * JSON only — no code change required.
 */
export interface PolicyModule {
  id: string;
  name: string;
  category: 'fiscal' | 'climate' | 'labor' | 'procedural' | 'regional' | 'regulatory';
  /** Coarse design role used by drafting UI to explain what the rider is for. */
  strategicRole?:
    | 'pay_for'
    | 'benefit_expansion'
    | 'coalition_builder'
    | 'oversight'
    | 'implementation'
    | 'enforcement'
    | 'carveout';
  /** Short rationale shown to the player above the toggle. */
  summary: string;
  /**
   * Human-readable phrase inserted into the synthesized bill text
   * preview. Sentence-cased so multiple modules concatenate nicely.
   */
  previewText: string;
  /** Adds to the base opposition score. May be negative. */
  oppositionDelta: number;
  /** Adds to the per-year budget impact in $B. */
  budgetImpactDelta: number;
  /** Legislative drafting complexity added by this rider, usually 1-20. */
  complexity?: number;
  /** Public-facing popularity added by this rider. Positive appeal lowers opposition. */
  publicAppeal?: number;
  /** Tags where this rider naturally fits; off-agenda riders raise warning text. */
  recommendedTags?: PolicyTag[];
  /** Other module ids that cannot be active at the same time. */
  incompatibleWith?: string[];
  /** Effects appended to the bill on enactment. */
  effects: Effect[];
}
