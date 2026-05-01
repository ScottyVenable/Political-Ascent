/**
 * LegislationSystem — bill lifecycle management.
 *
 * Flow: `draft` → `committee` → `floor_debate` → `vote` → `signed`/`failed`.
 *
 * The pacing pass (April 2026) introduced a **legislative clock**: each
 * stage now has a baseline duration in simulated days, and bills naturally
 * advance through their stages as the in-game calendar ticks. Players may
 * optionally spend Political Capital to **expedite** the current stage —
 * paying to skip whatever days remain before the next auto-advance.
 *
 * Design intent:
 *  - TIME is the primary cost. A player who has all the PC in the world
 *    still cannot ship a bill in a single afternoon; floor time is the gate.
 *  - PC is an optional accelerator for emergencies or closing moves.
 *  - While a bill sits in committee / on the floor, the player can work on
 *    other things (cards, quests, fundraising) — this turns "waiting" into
 *    productive downtime rather than dead air.
 *
 * See `docs/research/pacing-legislative-timeline-2026-04.md` for the full
 * design rationale, risk analysis, and tuning table.
 *
 * @module systems/LegislationSystem
 */
import type { Bill, BillTemplate, BillId, BillStage } from '@/types';
import { useGameStore } from '@/store/gameStore';
import { useCharacterStore } from '@/store/characterStore';
import { useWorldStore } from '@/store/worldStore';
import { useUIStore } from '@/store/uiStore';
import { applyEffects } from '@/engine/applyEffect';
import { SeededRNG } from '@/utils/random';
import { makeId } from '@/utils/id';
import { clamp } from '@/utils/math';
import { toEpochDays } from '@/utils/date';
import { applyBillType } from '@/utils/billType';

/**
 * Default per-stage duration, in simulated days. Exported so tests and
 * future design docs can reference the same numbers and so modders can
 * override per-bill via `BillTemplate.stageDurations`.
 *
 *   committee     — 3 weeks.  Markup, witness hearings, committee vote.
 *   floor_debate  — 2 weeks.  Floor speeches, motion management, amendments.
 *   vote          — 1 week.   Roll-call scheduling and the vote itself.
 *
 * Stages without an entry here (`draft`, `signed`, `vetoed`, etc.) are
 * instantaneous or terminal and skip the clock entirely.
 */
export const STAGE_DURATION_DAYS: Record<'committee' | 'floor_debate' | 'vote', number> = {
  committee: 21,
  floor_debate: 14,
  vote: 7,
};

/**
 * PC cost to expedite a given stage — i.e. to skip *all remaining* days in
 * the stage and move the bill straight to the next one. Prices are tuned so
 * that running the clock is the cheap path and expediting is the exception.
 */
export const EXPEDITE_PC_COST: Record<'committee' | 'floor_debate' | 'vote', number> = {
  committee: 25,
  floor_debate: 20,
  vote: 15,
};

/** Ordered stages that have a clock attached. Used for stage transitions. */
const CLOCKED_STAGES: readonly BillStage[] = ['committee', 'floor_debate', 'vote'] as const;

/** Result shape returned by `expediteStage` — keeps the panel's wiring thin. */
export interface ExpediteResult {
  ok: boolean;
  newStage: BillStage;
  reason?: string;
}

/** A single legislator's recorded vote, returned with the `VoteResult`. */
export interface LegislatorVoteRecord {
  id: string;
  name: string;
  party: 'D' | 'R' | 'I';
  state: string;
  vote: 'yea' | 'nay';
}

/** Result shape returned by `resolveVote`. */
export interface VoteResult {
  passed: boolean;
  yea: number;
  nay: number;
  /** Per-legislator breakdown, populated after #83 fix. */
  breakdown: LegislatorVoteRecord[];
}

export interface LegislationSystemAPI {
  /** Create a new bill and push it straight into `committee`. */
  draftBill(template: BillTemplate): Bill;
  /**
   * Pay PC to skip the remainder of the current stage's clock. The bill is
   * advanced to the next stage immediately (or resolved, in the case of
   * `vote`). If the current stage is not clocked, the expedite is a no-op.
   */
  expediteStage(billId: BillId): ExpediteResult;
  /**
   * Resolve a floor vote RIGHT NOW. Called both by the player (via the
   * Legislation panel when the bill is in `vote`) and by `dailyUpdate` when
   * the vote-stage clock expires with no player action.
   */
  resolveVote(billId: BillId): VoteResult;
  /**
   * Tick each pending bill forward by one day. If a bill's `stageEndsOnDay`
   * has been reached or passed, auto-advance it — free of PC cost. This
   * runs on every `TimeEngine.onDaily` tick.
   */
  dailyUpdate(): void;
  /**
   * Point-estimate of passage probability in [0, 1], computed by averaging
   * the per-legislator baseline vote probabilities (the same function used
   * by `resolveVote`) without invoking any RNG. Used by the UI forecast.
   */
  estimatePassageChance(bill: Pick<Bill, 'tags' | 'opposition'>): number;
  /**
   * Register the bill-template catalogue. Called by `GameEngine` during
   * boot; used internally by the system to resolve per-template clock
   * overrides without a circular module import.
   */
  registerTemplates(templates: readonly BillTemplate[]): void;
  /** @deprecated Kept for backwards compatibility. No longer called anywhere. */
  weeklyUpdate(): void;
}

/**
 * Looks up the duration (in days) the given bill should spend in the given
 * stage. Respects per-template overrides and falls back to the default.
 */
function durationFor(template: BillTemplate | undefined, stage: BillStage): number {
  if (!CLOCKED_STAGES.includes(stage)) return 0;
  const key = stage as keyof typeof STAGE_DURATION_DAYS;
  const override = template?.stageDurations?.[key];
  return override ?? STAGE_DURATION_DAYS[key];
}

/**
 * Returns the next clocked stage after `stage`. When called on `vote`,
 * returns `signed` as a sentinel: `dailyUpdate` interprets that as "time to
 * resolve the vote" rather than "move to a new waiting stage".
 */
function nextStageAfter(stage: BillStage): BillStage {
  switch (stage) {
    case 'committee':
      return 'floor_debate';
    case 'floor_debate':
      return 'vote';
    case 'vote':
      return 'signed'; // sentinel — caller resolves vote before applying
    default:
      return stage;
  }
}

/**
 * Averages the per-legislator baseline vote probability. This mirrors the
 * formula in `resolveVote` but without the RNG draw — it's a *point
 * estimate*, not a binary outcome. Keeping the formula in one place here
 * and in `resolveVote` means the player's forecast can never disagree with
 * the mechanic that actually resolves the vote.
 */
function perLegislatorPassChance(args: {
  alignment: boolean;
  relationship: number;
  opposition: number;
  strategy: number;
}): number {
  const alignmentBonus = args.alignment ? 0.3 : 0;
  const relationshipPush = (args.relationship / 100) * 0.2;
  const oppositionDrag = (args.opposition / 100) * 0.4;
  const strategyBoost = (args.strategy / 10) * 0.1;
  return clamp(0.5 + alignmentBonus + relationshipPush - oppositionDrag + strategyBoost, 0.05, 0.95);
}

class LegislationSystemImpl implements LegislationSystemAPI {
  /**
   * Template catalogue registered at boot by `GameEngine.registerContent`.
   * Consulted by `findTemplate` to read per-template overrides. Kept as a
   * plain private field rather than imported dynamically so we do not
   * depend on Node's `require` or a module-alias cycle.
   */
  private templates: BillTemplate[] = [];

  registerTemplates(templates: readonly BillTemplate[]): void {
    this.templates = [...templates];
  }

  // ─────────────────────────────────────────────────────────────
  // DRAFT
  // ─────────────────────────────────────────────────────────────

  draftBill(template: BillTemplate): Bill {
    const rng = new SeededRNG(useWorldStore.getState().seed + Date.now());
    const today = toEpochDays(useGameStore.getState().currentDate);

    // Apply the bill-type modifier (resolution / act / amendment /
    // appropriations) before any downstream sampling so the in-flight bill
    // carries the effective opposition and the engine reads the scaled
    // PC costs from `pcCost` going forward. Templates without `type`
    // default to `act` (no-op) — see `docs/LEGISLATION_OVERHAUL_PLAN.md`.
    const effective = applyBillType(template);

    // Bills skip the `draft` stage immediately: in this sim, "drafting" is
    // the act that *introduces* the bill into committee. A user-facing
    // draft-then-polish flow can be layered on later if desired.
    const stage: BillStage = 'committee';
    const committeeDays = durationFor(effective, stage);

    const bill: Bill = {
      id: makeId('bill', rng) as BillId,
      templateId: effective.id,
      title: effective.title,
      description: effective.description,
      tags: effective.tags,
      stage,
      sponsor: useCharacterStore.getState().id || 'player',
      cosponsors: [],
      pcInvested: 0,
      opposition: effective.opposition,
      supportVotes: 0,
      opposeVotes: 0,
      createdAt: isoDate(),
      effects: effective.effects,
      stageEnteredOnDay: today,
      stageEndsOnDay: today + committeeDays,
    };
    useWorldStore.getState().addBill(bill);
    return bill;
  }

  // ─────────────────────────────────────────────────────────────
  // EXPEDITE (player-driven stage advance, costs PC)
  // ─────────────────────────────────────────────────────────────

  expediteStage(billId: BillId): ExpediteResult {
    const world = useWorldStore.getState();
    const bill = world.pendingLegislation.find((b) => b.id === billId);
    if (!bill) return { ok: false, newStage: 'failed', reason: 'Bill not found' };

    if (!CLOCKED_STAGES.includes(bill.stage)) {
      return { ok: false, newStage: bill.stage, reason: 'Stage cannot be expedited' };
    }

    const stageKey = bill.stage as keyof typeof EXPEDITE_PC_COST;
    const pcCost = EXPEDITE_PC_COST[stageKey];
    const pc = useGameStore.getState().politicalCapital;
    if (pc < pcCost) {
      return { ok: false, newStage: bill.stage, reason: 'Insufficient political capital' };
    }
    useGameStore.getState().addPoliticalCapital(-pcCost);

    // Special case: expediting the VOTE stage means "call the roll now".
    // Resolve the vote instead of transitioning to a new waiting stage.
    if (bill.stage === 'vote') {
      const result = this.resolveVote(billId);
      // Show the styled vote-result modal so the player gets the same
      // breakdown whether the vote was expedited or auto-resolved.
      useUIStore.getState().openModal({
        id: `vote-result-${billId}`,
        type: 'vote-result',
        payload: {
          billTitle: bill.title,
          passed: result.passed,
          yea: result.yea,
          nay: result.nay,
          breakdown: result.breakdown,
        },
      });
      return {
        ok: true,
        newStage: result.passed ? 'signed' : 'failed',
      };
    }

    // Normal case: advance to the next stage and reset its clock.
    const template = this.findTemplate(bill.templateId);
    const next = nextStageAfter(bill.stage);
    const today = toEpochDays(useGameStore.getState().currentDate);
    const nextDuration = durationFor(template, next);
    world.updateBill(billId, {
      stage: next,
      pcInvested: bill.pcInvested + pcCost,
      stageEnteredOnDay: today,
      stageEndsOnDay: today + nextDuration,
    });
    return { ok: true, newStage: next };
  }

  // ─────────────────────────────────────────────────────────────
  // VOTE (resolve a floor vote deterministically against Congress)
  // ─────────────────────────────────────────────────────────────

  resolveVote(billId: BillId): VoteResult {
    const world = useWorldStore.getState();
    const bill = world.pendingLegislation.find((b) => b.id === billId);
    if (!bill) return { passed: false, yea: 0, nay: 0, breakdown: [] };

    const strategy = useCharacterStore.getState().stats.strategy;
    const rng = new SeededRNG(world.seed + Number(billId.replace(/\D/g, '') || 0));
    const senate = world.congress.senate;

    let yea = 0;
    let nay = 0;
    // Collect each senator's individual vote so we can:
    //  (a) write it back to their `votingHistory` (fixes todo#83 —
    //      the rail/modal now has real data to display), and
    //  (b) pass the full breakdown to the vote-result modal (todo#85).
    const breakdown: LegislatorVoteRecord[] = [];

    for (const legis of senate) {
      const p = perLegislatorPassChance({
        alignment: legis.priorities.some((pri) => bill.tags.includes(pri)),
        relationship: legis.relationship,
        opposition: bill.opposition,
        strategy,
      });
      const voted: 'yea' | 'nay' = rng.next() < p ? 'yea' : 'nay';
      if (voted === 'yea') yea++;
      else nay++;

      breakdown.push({
        id: legis.id as unknown as string,
        name: legis.name,
        party: legis.party,
        state: legis.state,
        vote: voted,
      });

      // Merge the new vote entry into the senator's history. We spread
      // the existing record to avoid clobbering prior votes — the store
      // action uses Object.assign which would replace the entire object
      // if we only sent the new key.
      world.updateLegislator(legis.id as unknown as string, {
        votingHistory: { ...legis.votingHistory, [billId]: voted },
      });
    }

    const passed = yea >= 51;
    world.updateBill(billId, {
      stage: passed ? 'signed' : 'failed',
      supportVotes: yea,
      opposeVotes: nay,
    });
    if (passed) {
      applyEffects(bill.effects);
      world.movePending(billId, 'passed');
    } else {
      world.movePending(billId, 'failed');
    }
    return { passed, yea, nay, breakdown };
  }

  // ─────────────────────────────────────────────────────────────
  // DAILY TICK (auto-advance stages whose clocks have expired)
  // ─────────────────────────────────────────────────────────────

  dailyUpdate(): void {
    const world = useWorldStore.getState();
    const today = toEpochDays(useGameStore.getState().currentDate);
    const pushToast = useUIStore.getState().pushToast;

    // Iterate over a snapshot so `movePending` calls inside resolveVote don't
    // interfere with the loop.
    for (const bill of [...world.pendingLegislation]) {
      if (!CLOCKED_STAGES.includes(bill.stage)) continue;

      // A legacy save may have no timer at all — seed one on first sight so
      // the bill still progresses under the new rules.
      if (bill.stageEndsOnDay === undefined) {
        const template = this.findTemplate(bill.templateId);
        const duration = durationFor(template, bill.stage);
        world.updateBill(bill.id, {
          stageEnteredOnDay: today,
          stageEndsOnDay: today + duration,
        });
        continue;
      }

      if (today < bill.stageEndsOnDay) continue; // still in progress

      // Clock expired. Transition naturally — no PC cost on a natural
      // advance; time is the toll.
      if (bill.stage === 'vote') {
        const result = this.resolveVote(bill.id);
        // Push the styled vote-result modal (todo#85). The brief toast is
        // still kept so the player sees a notification if they dismiss the
        // modal instantly or if the modal fires off-screen.
        useUIStore.getState().openModal({
          id: `vote-result-${bill.id}`,
          type: 'vote-result',
          payload: {
            billTitle: bill.title,
            passed: result.passed,
            yea: result.yea,
            nay: result.nay,
            breakdown: result.breakdown,
          },
        });
        pushToast({
          message: result.passed
            ? `${bill.title} PASSED ${result.yea}\u2013${result.nay}`
            : `${bill.title} FAILED ${result.yea}\u2013${result.nay}`,
          severity: result.passed ? 'success' : 'danger',
          ttl: 5000,
        });
        continue;
      }

      const template = this.findTemplate(bill.templateId);
      const next = nextStageAfter(bill.stage);
      const duration = durationFor(template, next);
      world.updateBill(bill.id, {
        stage: next,
        stageEnteredOnDay: today,
        stageEndsOnDay: today + duration,
      });
      pushToast({
        message: `${bill.title} → ${humanStage(next)}`,
        severity: 'info',
        ttl: 3000,
      });
    }
  }

  // ─────────────────────────────────────────────────────────────
  // FORECAST (no RNG; used by the UI)
  // ─────────────────────────────────────────────────────────────

  estimatePassageChance(bill: Pick<Bill, 'tags' | 'opposition'>): number {
    const world = useWorldStore.getState();
    const senate = world.congress.senate;
    if (senate.length === 0) return 0;
    const strategy = useCharacterStore.getState().stats.strategy;

    // Sum per-legislator probabilities; divide by chamber size. This is a
    // linear approximation of the pass rate — adequate for UI guidance,
    // cheap to compute on every render.
    let total = 0;
    for (const legis of senate) {
      total += perLegislatorPassChance({
        alignment: legis.priorities.some((pri) => bill.tags.includes(pri)),
        relationship: legis.relationship,
        opposition: bill.opposition,
        strategy,
      });
    }
    return total / senate.length;
  }

  weeklyUpdate(): void {
    // No-op. Retained for interface compatibility with GameEngine bootstrap.
  }

  // ─────────────────────────────────────────────────────────────
  // INTERNAL HELPERS
  // ─────────────────────────────────────────────────────────────

  /**
   * Resolves a bill's template by id from the in-memory catalogue that
   * `GameEngine` registered at boot.
   */
  private findTemplate(templateId: string): BillTemplate | undefined {
    return this.templates.find((t) => t.id === templateId);
  }
}

/** Human-readable stage label for toasts. */
function humanStage(stage: BillStage): string {
  switch (stage) {
    case 'committee':
      return 'Committee';
    case 'floor_debate':
      return 'Floor Debate';
    case 'vote':
      return 'Scheduled for vote';
    default:
      return stage;
  }
}

function isoDate(): string {
  const d = useGameStore.getState().currentDate;
  return `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`;
}

export const LegislationSystem: LegislationSystemAPI = new LegislationSystemImpl();
