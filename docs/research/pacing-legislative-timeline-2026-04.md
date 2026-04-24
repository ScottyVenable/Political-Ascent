# Pacing Pass — Legislative Timeline (April 2026)

**Branch:** `exp--pacing-legislative-timeline`
**Issue:** Legislative pacing — bills pass in seconds, no sense of time or political process.

---

## 1. Problem

In the alpha build, a player can take a bill from `draft` → `committee` → `floor_debate` → `vote` → `signed` in four consecutive button clicks. The only cost is Political Capital. No in-game days elapse. There is:

- **No sense that legislation is a *process*** — it's a button-mashing ritual.
- **No opportunity cost** — if you have PC, you advance. Waiting offers nothing, so players never wait.
- **No pressure on the clock** — bills don't compete with each other for floor time, and they don't decay if ignored.
- **No forecast** — the player sees a raw "Opposition 55" number but cannot estimate passage chance before committing.

This is the core pacing defect the player feels first, because the Legislation panel is the main loop.

## 2. Design principles

1. **Time is the primary cost.** Stages take in-game days to resolve. A player cannot simply pay to skip process entirely — the legislative calendar is the gate.
2. **PC is an optional accelerator.** Players who *must* rush a bill can spend PC to skip remaining days in a stage. The price of acceleration is deliberately steep so the default play is to wait.
3. **Waiting is not dead time.** While a bill sits in committee or on the floor, small things can happen (amendments offered, coalitions shift, opposition hardens). This turns the calendar into a drama generator.
4. **The player can plan.** A forecasted passage chance and a days-remaining readout make waiting *productive* thought, not idle waiting.

## 3. Numbers (v1)

| Stage | Default days | PC to expedite (skip full remainder) |
|---|---|---|
| `draft` | 0 (instantaneous — bill is written) | — |
| `committee` | 21 days | 25 PC |
| `floor_debate` | 14 days | 20 PC |
| `vote` | 7 days (scheduling) | 15 PC |

**Total baseline timeline:** `draft` click → `signed/failed` in roughly 42 in-game days (6 weeks). At speed 1× (1 day / real second default), that's about 42 seconds of real wait with the clock running — enough to feel like a process, short enough to stay engaging.

Tunable per bill via an optional `stageDurations` field on `BillTemplate`; constitutional amendments, emergency appropriations, and omnibus bills can override.

## 4. Implementation surface

### 4.1 Types (`src/types/legislation.ts`)

```ts
export interface Bill {
  // ... existing fields ...
  /** Simulated day index on which the bill entered its current stage. */
  stageEnteredOnDay: number;
  /** Target day on which the current stage auto-advances. */
  stageEndsOnDay: number;
}

export interface BillTemplate {
  // ... existing fields ...
  /** Optional per-stage duration override (in days). Defaults in `LegislationSystem`. */
  stageDurations?: Partial<Record<'committee' | 'floor_debate' | 'vote', number>>;
}
```

Add a `simDay` helper — an absolute day counter kept on `gameStore` so bills can be compared against a monotonic number rather than wrestling with `GameDate` arithmetic. Initialized to 0 on scenario start; incremented by `TimeEngine` on every daily tick.

### 4.2 System (`src/systems/LegislationSystem.ts`)

- `draftBill()` now pushes the bill to `committee` immediately with `stageEndsOnDay = simDay + 21` (default).
- `advanceStage()` becomes `expediteStage()` — pays PC to jump to the end of the current stage's clock. Same cost schedule as today but expressed as "skip N days early" fees.
- `dailyUpdate()` (new) walks pending bills; if `simDay >= stageEndsOnDay`, advance to the next stage (free) and reset the timer. Vote stage auto-resolves via `resolveVote` on clock expiry.
- `estimatePassageChance(billId)` returns a deterministic probability (mean of the per-legislator vote-probabilities without RNG). Used by the UI forecast.

### 4.3 Engine wiring (`src/engine/GameEngine.ts`)

- `TimeEngine.onDaily` now also calls `LegislationSystem.dailyUpdate()`.
- Add `simDay` increment to the daily hook.

### 4.4 UI (`src/renderer/panels/LegislationPanel.tsx`)

Pending-bill card:
- Shows current stage with a progress bar: `Committee · day 5 / 21`.
- When stage ends naturally, no click needed — card transitions on the next daily tick.
- Primary button: `Expedite (25 PC)` — visible only when the stage has PC cost and bill is not already at vote stage expiring this tick.
- Secondary button: `Withdraw` (existing affordance) — unchanged.

Draft-New card:
- Adds a `Forecast: 62% pass` badge derived from `estimatePassageChance()` applied to the *template* (i.e. pretends the bill were introduced today).
- Sorts by forecast descending by default; user can toggle to alphabetical.

### 4.5 Data

Existing `bill-templates.json` entries are untouched; the defaults apply. The `Constitutional Moment` card and `Immigration & Border Reform` bill can later receive `stageDurations` overrides.

### 4.6 Tests

- Vitest — `LegislationSystem.dailyUpdate` auto-advances at the correct day boundary; PC not deducted; vote resolves on vote-stage expiry.
- Vitest — `estimatePassageChance` is deterministic for a given `(bill, Congress, character)` triple.
- Vitest — `expediteStage` fails gracefully on insufficient PC.
- Playwright — smoke: draft a bill, run 22 days at 4× speed, confirm bill has advanced to `floor_debate`.

### 4.7 Out of scope for this PR

- Amendment system (would require event hooks into bills in flight — planned, separate).
- Floor-time competition (only one bill can hold the floor — planned, separate).
- Bill decay / shelf time (bills that sit in committee forever should eventually die — planned, separate).
- Any changes to AP, card draw, or skill pacing — explicitly out.

Follow-up issues to file once this merges:
1. "Legislation: amendment events during committee wait"
2. "Legislation: one bill on the floor at a time"
3. "Legislation: committee death after N days of neglect"

## 5. Risks

- **Players who had muscle memory of 'click advance 3 times'** will notice the change. The expedite button preserves that playstyle with a cost.
- **Clock-dependent behaviour is harder to unit-test** — mitigated by the deterministic `simDay` counter and by tests that advance `simDay` explicitly rather than waiting for real time.
- **Save/load format** grows by two integers per pending bill. Additive change, no migration needed because these fields can be derived from `stage` + current date for legacy saves (treat `stageEnteredOnDay` as `simDay` on load and give the bill a fresh clock).
