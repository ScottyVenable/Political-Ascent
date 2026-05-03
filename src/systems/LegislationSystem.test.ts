/**
 * Tests for the April 2026 legislative-pacing pass.
 *
 * Covers:
 *  - `draftBill` places a bill in `committee` with a correctly seeded clock.
 *  - `dailyUpdate` auto-advances stages when the clock expires, free of PC.
 *  - `expediteStage` pays PC and jumps forward immediately.
 *  - `estimatePassageChance` is deterministic and in [0, 1].
 *
 * These tests drive the stores directly rather than going through the full
 * GameEngine bootstrap so they stay fast and focused.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LegislationSystem, STAGE_DURATION_DAYS, EXPEDITE_PC_COST } from './LegislationSystem';
import { CongressSystem } from './CongressSystem';
import { useGameStore } from '@/store/gameStore';
import { useWorldStore } from '@/store/worldStore';
import { useCharacterStore } from '@/store/characterStore';
import { useUIStore } from '@/store/uiStore';
import { toEpochDays, addDays } from '@/utils/date';
import type { BillTemplate } from '@/types';

/**
 * Minimal bill template for tests. Uses the default stage durations so we
 * can reason about the clock via the shared `STAGE_DURATION_DAYS` constant.
 */
const TEMPLATE: BillTemplate = {
  id: 'test-bill',
  title: 'Test Bill',
  description: 'A bill used only for testing.',
  tags: ['economy'],
  budgetImpact: 0,
  pcCost: { committee: 10, floor: 15, vote: 10 },
  opposition: 30,
  implementationDays: 30,
  effects: [],
  affectedGroups: [],
};

/**
 * Resets every store between tests so that a lingering bill from one test
 * can't pollute another. We also seed Congress so `resolveVote` and
 * `estimatePassageChance` have a chamber to iterate over.
 */
function resetStoresAndSeedCongress(): void {
  useGameStore.getState().reset();
  useWorldStore.getState().reset();
  useCharacterStore.setState((s) => {
    s.id = 'player';
    s.stats.strategy = 5;
  });
  // Need enough PC for expedite tests.
  useGameStore.setState((s) => {
    s.politicalCapital = 100;
  });
  // Seat a modest senate so the forecast / vote systems have something to
  // chew on. 100 senators ≈ realistic count.
  const { senate, house } = CongressSystem.generate(42, { D: 50, R: 50 });
  useWorldStore.setState((s) => {
    s.seed = 42;
    s.congress.senate = senate;
    s.congress.house = house;
  });
  // Silence toasts during tests.
  vi.spyOn(useUIStore.getState(), 'pushToast').mockImplementation(() => {});
  // Register our one test template so the system can look it up for
  // per-template stage-duration overrides (none used here, but the lookup
  // itself is exercised on every auto-advance).
  LegislationSystem.registerTemplates([TEMPLATE]);
}

describe('LegislationSystem — pacing', () => {
  beforeEach(() => {
    resetStoresAndSeedCongress();
  });

  it('draftBill places the bill in committee with a populated clock', () => {
    const startDay = toEpochDays(useGameStore.getState().currentDate);

    const bill = LegislationSystem.draftBill(TEMPLATE);

    expect(bill.stage).toBe('committee');
    expect(bill.stageEnteredOnDay).toBe(startDay);
    expect(bill.stageEndsOnDay).toBe(startDay + STAGE_DURATION_DAYS.committee);
  });

  it('dailyUpdate does nothing while the clock has not expired', () => {
    const bill = LegislationSystem.draftBill(TEMPLATE);

    // Advance 5 days (less than the 21-day committee clock).
    for (let i = 0; i < 5; i++) useGameStore.getState().advanceDay();
    LegislationSystem.dailyUpdate();

    const updated = useWorldStore.getState().pendingLegislation.find((b) => b.id === bill.id);
    expect(updated?.stage).toBe('committee');
  });

  it('dailyUpdate auto-advances a bill when its stage clock expires — no PC spent', () => {
    const pcBefore = useGameStore.getState().politicalCapital;
    const bill = LegislationSystem.draftBill(TEMPLATE);

    // Advance exactly the full committee duration.
    for (let i = 0; i < STAGE_DURATION_DAYS.committee; i++) {
      useGameStore.getState().advanceDay();
    }
    LegislationSystem.dailyUpdate();

    const updated = useWorldStore.getState().pendingLegislation.find((b) => b.id === bill.id);
    expect(updated?.stage).toBe('floor_debate');
    // Free advance — no PC paid.
    expect(useGameStore.getState().politicalCapital).toBe(pcBefore);
    // New clock seeded for the next stage.
    const today = toEpochDays(useGameStore.getState().currentDate);
    expect(updated?.stageEnteredOnDay).toBe(today);
    expect(updated?.stageEndsOnDay).toBe(today + STAGE_DURATION_DAYS.floor_debate);
  });

  it('dailyUpdate auto-advances floor debate after the 14-day floor clock expires', () => {
    const bill = LegislationSystem.draftBill(TEMPLATE);
    LegislationSystem.expediteStage(bill.id); // committee → floor_debate

    const pcBefore = useGameStore.getState().politicalCapital;
    for (let i = 0; i < STAGE_DURATION_DAYS.floor_debate; i++) {
      useGameStore.getState().advanceDay();
    }
    LegislationSystem.dailyUpdate();

    const updated = useWorldStore
      .getState()
      .pendingLegislation.find((b) => b.id === bill.id);
    const today = toEpochDays(useGameStore.getState().currentDate);
    expect(updated?.stage).toBe('vote');
    expect(updated?.stageEnteredOnDay).toBe(today);
    expect(updated?.stageEndsOnDay).toBe(today + STAGE_DURATION_DAYS.vote);
    expect(useGameStore.getState().politicalCapital).toBe(pcBefore);
  });

  it('dailyUpdate resets an overdue stage from today instead of leaving impossible day counts', () => {
    const bill = LegislationSystem.draftBill(TEMPLATE);

    // Simulate a stale save or backgrounded tab where the calendar is later
    // than the committee deadline. One dailyUpdate call should advance out of
    // committee and give the new floor stage a fresh readable timer from today.
    const elapsedDays = STAGE_DURATION_DAYS.committee + STAGE_DURATION_DAYS.floor_debate;
    for (let i = 0; i < elapsedDays; i++) {
      useGameStore.getState().advanceDay();
    }
    LegislationSystem.dailyUpdate();

    const updated = useWorldStore
      .getState()
      .pendingLegislation.find((b) => b.id === bill.id);
    const today = toEpochDays(useGameStore.getState().currentDate);
    expect(updated?.stage).toBe('floor_debate');
    expect(updated?.stageEnteredOnDay).toBe(today);
    expect(updated?.stageEndsOnDay).toBe(today + STAGE_DURATION_DAYS.floor_debate);
  });

  it('expediteStage charges PC and jumps immediately to the next stage', () => {
    const bill = LegislationSystem.draftBill(TEMPLATE);
    const pcBefore = useGameStore.getState().politicalCapital;

    const result = LegislationSystem.expediteStage(bill.id);

    expect(result.ok).toBe(true);
    expect(result.newStage).toBe('floor_debate');
    expect(useGameStore.getState().politicalCapital).toBe(pcBefore - EXPEDITE_PC_COST.committee);
  });

  it('expediteStage refuses when the player cannot afford the cost', () => {
    const bill = LegislationSystem.draftBill(TEMPLATE);
    useGameStore.setState((s) => {
      s.politicalCapital = 0;
    });

    const result = LegislationSystem.expediteStage(bill.id);

    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/insufficient/i);
    // Bill stayed put.
    const updated = useWorldStore.getState().pendingLegislation.find((b) => b.id === bill.id);
    expect(updated?.stage).toBe('committee');
  });

  it('estimatePassageChance returns a deterministic probability in [0, 1]', () => {
    const a = LegislationSystem.estimatePassageChance({
      tags: ['economy'],
      opposition: 30,
    });
    const b = LegislationSystem.estimatePassageChance({
      tags: ['economy'],
      opposition: 30,
    });
    expect(a).toBe(b);
    expect(a).toBeGreaterThanOrEqual(0);
    expect(a).toBeLessThanOrEqual(1);
  });

  it('estimatePassageChance penalises opposition', () => {
    const low = LegislationSystem.estimatePassageChance({ tags: ['economy'], opposition: 10 });
    const high = LegislationSystem.estimatePassageChance({ tags: ['economy'], opposition: 90 });
    expect(low).toBeGreaterThan(high);
  });

  it('dailyUpdate resolves a vote when the vote-stage clock expires', () => {
    const bill = LegislationSystem.draftBill(TEMPLATE);
    // Fast-forward through committee and floor_debate via expedite so we
    // land directly in `vote` without needing 35 sequential daily ticks.
    LegislationSystem.expediteStage(bill.id); // committee → floor_debate
    LegislationSystem.expediteStage(bill.id); // floor_debate → vote

    const voteStageBill = useWorldStore.getState().pendingLegislation.find((b) => b.id === bill.id);
    expect(voteStageBill?.stage).toBe('vote');

    // Let the 7-day vote clock expire.
    for (let i = 0; i < STAGE_DURATION_DAYS.vote; i++) {
      useGameStore.getState().advanceDay();
    }
    LegislationSystem.dailyUpdate();

    const finalBill =
      useWorldStore.getState().passedLegislation.find((b) => b.id === bill.id) ??
      useWorldStore.getState().failedLegislation.find((b) => b.id === bill.id);
    expect(finalBill).toBeDefined();
    expect(['signed', 'failed']).toContain(finalBill!.stage);
  });

  it('dailyUpdate can introduce deterministic NPC-sponsored bills on cadence', () => {
    expect(useWorldStore.getState().pendingLegislation.length).toBe(0);

    useGameStore.setState((s) => {
      s.currentDate.day = 14;
    });
    LegislationSystem.dailyUpdate();

    const pending = useWorldStore.getState().pendingLegislation;
    expect(pending.length).toBeGreaterThan(0);
    expect(pending[0].sponsor).not.toBe('player');
    expect(pending[0].description).toContain('Introduced by');
    expect(pending[0].stage).toBe('committee');
  });
});

// Silences unused-import warning when addDays isn't reached. Retained in
// case a future test needs the helper.
void addDays;
