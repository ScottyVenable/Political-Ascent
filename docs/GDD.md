# Political Ascent — Game Design Document

**Version:** 0.4-DRAFT (Rook pass — QA / testing / security / accessibility / release readiness)
**Status:** Living document. Pass 3 of 3 in a coordinated rewrite.
**Companions:** [docs/ARCHITECTURE.md](ARCHITECTURE.md), [docs/ROADMAP.md](ROADMAP.md), [docs/SCENARIO_PLAN.md](SCENARIO_PLAN.md), [docs/UI_GAME_FEEL_PROPOSAL.md](UI_GAME_FEEL_PROPOSAL.md), [docs/about/VISION.md](about/VISION.md).

> **Rewrite pass discipline.** This pass (Sol) is responsible for vision framing, core loop, system specs, data model, architecture, tech stack, UI conventions, modding, platforms, and performance. Sections 12 and 13 are placeholders left for the narrative pass (Vex) and the QA / a11y / release pass (Rook). Do not pre-empt their work; do leave them clear hooks.

---

## Table of Contents

1. [Vision & Pillars](#1-vision--pillars)
2. [Core Loop & Pacing](#2-core-loop--pacing)
3. [Player Fantasy & Goals](#3-player-fantasy--goals)
4. [Game Systems](#4-game-systems)
5. [Data Model & Persistence](#5-data-model--persistence)
6. [Architecture Overview](#6-architecture-overview)
7. [Tech Stack & Toolchain](#7-tech-stack--toolchain)
8. [UI / UX Conventions](#8-ui--ux-conventions)
9. [Modding & Extensibility](#9-modding--extensibility)
10. [Platforms & Distribution](#10-platforms--distribution)
11. [Performance Targets & Budgets](#11-performance-targets--budgets)
12. [Narrative, Story, Characters, RPG, Dialogue](#12-narrative-story-characters-rpg-dialogue)
13. [QA, Testing, Security, Accessibility, Release Readiness](#13-qa-testing-security-accessibility-release-readiness)
14. [Open Questions & Risks](#14-open-questions--risks)
15. [Glossary](#15-glossary)
16. [Change History](#16-change-history)

---

## 1. Vision & Pillars

Political Ascent puts the player inside the machinery of politics — not as a puppet of pre-authored outcomes, but as an agent inside a living, reactive simulation. Speeches actually move populations. Alliances actually determine survival. Compromises actually reshape who the player becomes.

The design target is **authenticity over editorialising**. There are no "correct" political outcomes; there are choices, consequences, and legacies.

**Tagline:** *Every vote has a cost. Every promise has a price.*

### 1.1 Pillars

| # | Pillar | What it means in implementation |
|---|---|---|
| P1 | **Political authenticity** | Bill lifecycle mirrors real legislative procedure: draft → committee → floor → vote → signed. Time is a first-class cost, not just political capital ([src/systems/LegislationSystem.ts](../src/systems/LegislationSystem.ts)). |
| P2 | **Meaningful choice** | Effects propagate through deterministic systems — population happiness, faction loyalty, economy, news. No filler dialogue with no state delta. |
| P3 | **Living world** | Time advances with or without player action. Population, economy, congress, events all tick on `TimeEngine` hooks ([src/engine/TimeEngine.ts](../src/engine/TimeEngine.ts)). |
| P4 | **Personal narrative** | Background, traits, and ideology gate content and modify outcomes. *(Detail owned by Vex, §12.)* |
| P5 | **Accessible depth** | Layered onboarding: top-bar resources → panel drilldown → glossary tooltips ([src/renderer/components/tooltip/](../src/renderer/components/tooltip/)). Reduced-motion and keyboard-first interactions are mandatory, not optional. |

### 1.2 Non-goals (MVP)

- Multiplayer of any kind.
- Full diplomacy or military model.
- Photo-real graphics, dynamic 3D maps.
- Partisan messaging or real-person likenesses.
- Mobile-first input. Capacitor Android is a *port*, not the lead platform.

---

## 2. Core Loop & Pacing

### 2.1 Loop diagram

```
WEEK START
  │
  ├─ Daily tick (TimeEngine) ───────────────────────┐
  │     EventEngine.checkDailyTriggers()            │
  │     ActionEngine.regenerateAP() (if scheduled)  │
  │     QuestSystem.dailyUpdate()                   │
  │     LegislationSystem.advanceClocks()           │  ← runs while
  │                                                 │    player acts
  ├─ Player actions (AP-gated) ─────────────────────┤
  │     • Draft / push / negotiate legislation      │
  │     • Press, speeches, rallies                  │
  │     • Cards (PC-gated)                          │
  │     • Meet legislators, build leverage          │
  │     • Skill-tree spend, character actions       │
  │                                                 │
  └─ Week boundary tick ────────────────────────────┘
        PopulationSystem.weeklyUpdate()
        EconomySystem.weeklyUpdate()
        CongressSystem.weeklyUpdate()
        InfluenceSystem.weeklyUpdate()
        AchievementEngine.check()
MONTH BOUNDARY
        EconomySystem.monthlyReport()
        FactionSystem.loyaltyCheck()  (planned)
YEAR BOUNDARY
        EconomySystem.annualReport()
        LegislationSystem.budgetReconciliation()  (planned)
```

### 2.2 Time scale

- **Base unit:** simulated day. One day at 1× ≈ 3000 ms wall-clock (`BASE_MS_PER_DAY` in [src/engine/TimeEngine.ts](../src/engine/TimeEngine.ts)).
- **Speeds:** `0` paused, `1×`, `2×`, `4×`. `Skip-to-event` planned but not shipped.
- **Auto-pause:** triggers on event modal queueing, manual save, vote roll-call, low AP threshold (planned). Configurable via `settingsStore`.

### 2.3 Pacing intent

The April 2026 pacing pass made **time the primary cost of legislation** rather than political capital. Stage durations:

| Stage | Days |
|---|---|
| Committee | 21 |
| Floor debate | 14 |
| Vote | 7 |

PC remains an *optional accelerator* via `expediteStage()`. See [docs/research/pacing-legislative-timeline-2026-04.md](research/pacing-legislative-timeline-2026-04.md) for the full rationale and tuning table.

The intent: while a bill sits in committee or on the floor, the player works on cards, quests, fundraising, and relationships. Waiting becomes productive downtime, not dead air.

---

## 3. Player Fantasy & Goals

### 3.1 Session goals

| Horizon | What the player should feel |
|---|---|
| First 10 minutes | Grounded character; the world is alive (news ticker, congress chamber visible). |
| First hour | One controversial decision made; one ripple visible (news headline + group happiness shift). |
| First session | One crisis weathered, one triumph banked, one failure absorbed. |
| Long-term | Wants to replay from a different background, ideology, or scenario era. |

### 3.2 Player roles per scenario

Defined per scenario file under [src/data/scenarios/](../src/data/scenarios/). The role is encoded in the scenario JSON (`playerPosition`) and gates which panels/actions are available.

| Scenario | Role | Ascent target |
|---|---|---|
| Modern America 2024 *(shipped MVP)* | US Senator (swing state) | Pass signature legislation; survive re-election cycle. |
| Cold War (planned) | Senator/Rep across 1947–1991 career | Committee chair or party leader. |
| Civil War & Reconstruction (planned) | House/Senate from a chosen state | Influence pre-1861; survive secession; restart in Reconstruction. |
| (others — see [SCENARIO_PLAN.md](SCENARIO_PLAN.md)) | varies | varies |

### 3.3 Win and loss states

Win and loss are scenario-defined in `scenario.json` under `victoryConditions` / `failureConditions`. The engine resolves them via the same `Requirement` evaluator used by events and achievements ([src/engine/applyEffect.ts](../src/engine/applyEffect.ts)).

Modern America 2024 (current targets):
- **Victory (any one):** signature bill passed; re-elected with +5% margin; ≥60% national approval; reach majority leader.
- **Loss:** lost re-election; resigned for scandal; party expulsion; censure with all committee seats stripped.

---

## 4. Game Systems

This section is the authoritative inventory of simulation systems. Each entry follows the same template so contributors know exactly where each system's purpose, inputs, state, outputs, cadence, dependencies, and current implementation status live.

### 4.0 System inventory (current code)

Systems present in [src/systems/](../src/systems/) and engines in [src/engine/](../src/engine/):

| Module | File | Pure? | Cadence | MVP status |
|---|---|---|---|---|
| `GameEngine` | [src/engine/GameEngine.ts](../src/engine/GameEngine.ts) | No (orchestrator) | Boot + tick fan-out | Shipped |
| `TimeEngine` | [src/engine/TimeEngine.ts](../src/engine/TimeEngine.ts) | No (owns interval) | All cadences | Shipped |
| `EventEngine` | [src/engine/EventEngine.ts](../src/engine/EventEngine.ts) | Mostly | Daily | Shipped |
| `ActionEngine` | [src/engine/ActionEngine.ts](../src/engine/ActionEngine.ts) | Yes | On-demand | Shipped |
| `AchievementEngine` | [src/engine/AchievementEngine.ts](../src/engine/AchievementEngine.ts) | Yes | Weekly + on event | Shipped |
| `applyEffect` | [src/engine/applyEffect.ts](../src/engine/applyEffect.ts) | Yes | On-demand | Shipped |
| `cardPackEngine` | [src/engine/cardPackEngine.ts](../src/engine/cardPackEngine.ts) | Yes | On-demand | Shipped |
| `dataLoader` | [src/engine/dataLoader.ts](../src/engine/dataLoader.ts) | Yes | Boot | Shipped |
| `SaveSystem` | [src/engine/SaveSystem.ts](../src/engine/SaveSystem.ts) | No (storage I/O) | On-demand | Shipped |
| `CharacterSystem` | [src/systems/CharacterSystem.ts](../src/systems/CharacterSystem.ts) | Yes | On-demand | Shipped |
| `LegislationSystem` | [src/systems/LegislationSystem.ts](../src/systems/LegislationSystem.ts) | No (mutates stores) | Daily clock | Shipped (riders shipped Apr 2026) |
| `CongressSystem` | [src/systems/CongressSystem.ts](../src/systems/CongressSystem.ts) | No | Weekly | Shipped (drift only; voting in `LegislationSystem`) |
| `PopulationSystem` | [src/systems/PopulationSystem.ts](../src/systems/PopulationSystem.ts) | No | Weekly | Shipped |
| `EconomySystem` | [src/systems/EconomySystem.ts](../src/systems/EconomySystem.ts) | No | Weekly + monthly + annual | Shipped (simple model) |
| `CardSystem` | [src/systems/CardSystem.ts](../src/systems/CardSystem.ts) | No | On-demand | Shipped |
| `QuestSystem` | [src/systems/QuestSystem.ts](../src/systems/QuestSystem.ts) | No | Daily | Shipped |
| `InfluenceSystem` | [src/systems/InfluenceSystem.ts](../src/systems/InfluenceSystem.ts) | No | Weekly | Shipped |
| `SkillSystem` | [src/systems/SkillSystem.ts](../src/systems/SkillSystem.ts) | No | On-demand | Shipped (3 branches) |
| `DialogueSystem` | [src/systems/DialogueSystem.ts](../src/systems/DialogueSystem.ts) | Yes | On-demand | Shell only (no UI surface yet) |
| **Faction loyalty** | *(none)* | — | Monthly | **Designed, not implemented** |
| **Speech / press composer** | *(none)* | — | On-demand | **Designed, not implemented** |
| **Election / campaign** | *(none)* | — | Annual | **Designed, post-MVP** |

> **Sol audit note.** `DialogueSystem` exists in code but has no UI surface — no panel renders dialogue trees. This is a backlog item, see §14. `FactionSystem` is referenced in old GDD prose and roadmap but does not exist as a module; faction effects today are bundled into `InfluenceSystem` and ad-hoc relationship math. Either build `FactionSystem.ts` or formally fold faction state into `InfluenceSystem` and update docs. Defer to phase 4.

---

### 4.1 Legislation

**Purpose.** Drive the player's primary loop: convert ambition into law. Bills move through `draft → committee → floor_debate → vote → signed | failed | vetoed`.

**Inputs.**
- Player actions: `draftBill`, `attachRider`, `removeRider`, `expediteStage`, `pushBill`, `negotiateVote` (planned panel).
- Time: stage clock advances on daily tick.
- Congress state: legislator ideology, relationship, leverage, party-line pressure.

**State (per bill).**

```ts
interface Bill {
  id: BillId;
  title: string;
  summary: string;
  policyTags: PolicyTag[];
  stage: 'draft' | 'committee' | 'floor_debate' | 'vote' | 'signed' | 'failed' | 'vetoed';
  stageStartedDay: number;          // simulated-day epoch
  stageDurationDays: number;        // copied from STAGE_DURATION_DAYS or template override
  riders: Rider[];                  // ordered; affects opposition math
  fiscalImpact: number;             // budget delta (negative = cost)
  baseOpposition: number;           // 0-100 scenario-supplied
  sponsorId: NpcId | 'player';
  expedited: boolean;
  voteResult?: VoteResult;
}
```

**Outputs.**
- Effects via `applyEffects` on signing (group happiness, economy patches, faction loyalty deltas).
- News items pushed to `worldStore.news`.
- Achievements via `AchievementEngine.check()`.

**Cadence.** Daily clock advance; vote resolves on stage-end of `vote` stage.

**Dependencies.** `CongressSystem` (legislator pool + voting), `InfluenceSystem` (PC spend), `applyEffect` (outcome dispatch), `useGameStore` (PC, AP, date), `useWorldStore` (active and historical bills).

**Current implementation.** [src/systems/LegislationSystem.ts](../src/systems/LegislationSystem.ts) ships the full pipeline including the **rider stack** (drafting modules ordered into a bill). Rider math evaluates fiscal strain, complexity, public appeal, coalition mix, off-agenda penalties, and incompatibilities. UI lives in [src/renderer/components/DraftLegislationScreen.tsx](../src/renderer/components/DraftLegislationScreen.tsx) and [src/renderer/panels/LegislationPanel.tsx](../src/renderer/panels/LegislationPanel.tsx).

**Sol implementation notes.**
- Bill clock is *day-indexed*, not tick-indexed. Don't use `useGameStore.day` arithmetic — call `toEpochDays(currentDate)` (see [src/utils/date.ts](../src/utils/date.ts)).
- `expediteStage()` returns `ExpediteResult { ok, newStage, reason? }`. Panel must consume `reason` for player feedback.
- NPC-sponsored drafts (todo#65) generate every `NPC_BILL_CHECK_INTERVAL_DAYS` (14d) up to `NPC_PENDING_BILL_CAP` (6). Tune carefully — flooding the queue makes the panel unreadable.
- The **negotiation mini-system** (per-legislator vote brokering with breaking points and red lines) is a known gap. Currently votes resolve deterministically from relationship + ideology. Backlog: see §14.

---

### 4.2 Congress

**Purpose.** Procedural NPC legislators (100 senators + 435 reps, scenario-determined) with relationships that drift weekly toward a baseline.

**Inputs.** Scenario seed (`scenario.json`) → `partySplit` → `CongressSystem.generate(seed, split)`.

**State (per legislator).**

```ts
interface Legislator {
  id: NpcId;
  name: string;
  gender: LegislatorGender;
  party: 'D' | 'R' | 'I';
  state: string;                    // 'CA', 'TX', etc.
  ideology: { x: number; y: number };  // [-1, 1] each axis
  policyPriorities: PolicyTag[];    // 1–3 entries, weighted
  personality: 'loyalist' | 'maverick' | 'opportunist' | 'ideologue' | 'pragmatist';
  relationship: number;             // -100..100
  baselineRelationship: number;     // drift target
  corruptibility: number;           // 0..100, hidden
}
```

**Outputs.** Vote roll-calls (consumed by `LegislationSystem`); relationship-driven leverage windows (consumed by `InfluenceSystem`).

**Cadence.** Weekly drift toward `baselineRelationship`.

**Dependencies.** Deterministic from `SeededRNG` ([src/utils/random.ts](../src/utils/random.ts)) — required for save/restore.

**Current implementation.** [src/systems/CongressSystem.ts](../src/systems/CongressSystem.ts) generates and drifts. Rendering: [src/renderer/components/Hemicycle.tsx](../src/renderer/components/Hemicycle.tsx), [src/renderer/components/SeatGrid.tsx](../src/renderer/components/SeatGrid.tsx), [src/renderer/panels/CongressPanel.tsx](../src/renderer/panels/CongressPanel.tsx). View modes (party / ideology / happiness / influence / vote-prediction) are partially shipped.

**Sol implementation notes.**
- Voting logic currently lives inside `LegislationSystem`. If it grows further, extract a `VotingSystem` — that's where negotiation, whip operations, and party-line pressure should land.
- Legislator `personality` gates negotiation tactics but is not yet read by any system. Wire-up needed when negotiation panel ships.

---

### 4.3 Economy

**Purpose.** Macro-economic state that pressures population groups and gates fiscal legislation viability.

**State (`EconomicState`).**

```ts
interface EconomicState {
  gdpGrowth: number;          // %
  unemployment: number;       // %
  inflation: number;          // %
  debt: number;               // $bn
  deficit: number;            // $bn annual
  gini: number;               // 0..1
  trade: number;              // $bn (negative = deficit)
  history: EconomicSnapshot[];
}
```

**Cadence.** Weekly drift, monthly summary, annual reconciliation.

**Outputs.** Pressure on `PopulationSystem.weeklyUpdate()` (`economicPressure(group, econ)` in [src/systems/PopulationSystem.ts](../src/systems/PopulationSystem.ts)); chart data for `EconomyPanel`.

**Current implementation.** [src/systems/EconomySystem.ts](../src/systems/EconomySystem.ts). Model is intentionally simple for MVP: GDP drift seeded by `SeededRNG(world.seed + week * 13)` for determinism; unemployment lags GDP; inflation drifts on deficit trajectory.

**Sol implementation notes.**
- `world.seed` is the canonical RNG source — **never** instantiate `Math.random()` in any system. Determinism is required for save-restore parity.
- `annualReport()` is partially stubbed; budget reconciliation (`LegislationSystem.budgetReconciliation`) is referenced in [docs/ARCHITECTURE.md](ARCHITECTURE.md) §4.1 but does not exist yet.
- No regional / state-level economic granularity. Required by Civil War scenario (per [SCENARIO_PLAN.md](SCENARIO_PLAN.md) §3.3) — backlog.

---

### 4.4 Population

**Purpose.** Demographic groups react to legislation, economy, events, and player rhetoric.

**State (per group).**

```ts
interface PopulationGroup {
  id: string;
  name: string;
  size: number;                 // % of population
  tags: string[];               // 'working', 'industrial', 'business', etc.
  happiness: number;            // 0..100
  radicalism: number;           // 0..100
  ideology: { x: number; y: number };
  income: number;
  loyalty: number;              // 0..100, to player
  activism: number;             // 0..100
}
```

**Cadence.** Weekly. Drift toward equilibrium happiness (50) plus `economicPressure()`.

**Outputs.** Triggers events (strikes, protests, petitions); affects PC generation in `InfluenceSystem.weeklyUpdate()`; surfaces in `PopulationPanel` and dashboard sparklines.

**Current implementation.** [src/systems/PopulationSystem.ts](../src/systems/PopulationSystem.ts). Constants `HAPPINESS_DRIFT = 0.5/wk` toward 50; `RADICALISM_DECAY = 1.0/wk`. Radicalism *increases* below happiness 40 (linear pressure).

**Sol implementation notes.**
- No explicit "speech moves population" pipeline yet. The pillar P3 promise requires a `SpeechSystem` or extension of `applyEffect` to take a per-group multiplier. Backlog: design speech composer (§14).
- Group size is static. Generational drift mentioned in old GDD is unimplemented and out of MVP scope.

---

### 4.5 Events

**Purpose.** Procedural and scheduled situations that interrupt the player with a 2–5 option modal.

**Definition shape.**

```ts
interface GameEventDefinition {
  id: string;
  type: 'crisis' | 'opportunity' | 'population' | 'political' | 'personal' | 'scheduled';
  triggerConditions: TriggerCondition[];
  title: string;
  description: string;
  options: EventOption[];
  isRepeatable: boolean;
  weight: number;
}
```

**Cadence.** `EventEngine.checkDailyTriggers()` evaluates triggers each daily tick; weighted random selection from eligible pool.

**Outputs.** Pushes `ActiveEvent` onto `worldStore.activeEvents`; resolution via `EventEngine.resolveOption()` runs effects through `applyEffects` and may chain via `WeightedOutcome.nextEvent`.

**Current implementation.** [src/engine/EventEngine.ts](../src/engine/EventEngine.ts). Idempotency guard (`resolving` Set) prevents double-clicks from re-paying costs. Definitions in [src/data/events/](../src/data/events/).

**Sol implementation notes.**
- Cooldown handling for repeatable events lives on `worldStore.eventCooldowns` (write via `stampEventCooldown(id, week)`). Don't bypass.
- Event chains (`nextEvent`) skip the trigger evaluator — they spawn directly. Modders need to know this; document in [MODDING.md](guides/MODDING.md) once sealed.

---

### 4.6 Cards

**Purpose.** Action / boost / sabotage / resource / legislation / relationship / wild cards as a parallel resource layer to AP and PC. Cards supplement core actions; they are not the primary loop.

**Definition shape.** See [docs/ARCHITECTURE.md §5.3](ARCHITECTURE.md#53-card-json).

**Card pack engine.** [src/engine/cardPackEngine.ts](../src/engine/cardPackEngine.ts) is **pure**: `(seed, packTemplate, cardPool) → CardDefinition[5]`. Rarity-weighted with guarantee slots. Determinism is non-negotiable — required for save-restore and unit tests.

**Hand / deck.** Stored on `characterStore.hand` and `characterStore.deck`. Drawing is deterministic given a seed (`CardSystem.draw(seed)`).

**Play pipeline.**
1. `CardSystem.play(instanceId)` validates PC cost.
2. Spends PC via `useGameStore.addPoliticalCapital(-cost)`.
3. Routes effects through `applyEffects()`.
4. Returns `PlayResult` — discriminated union; UI must handle both `ok: true` and `ok: false` branches.

**UI surface.** [src/renderer/components/CardFace.tsx](../src/renderer/components/CardFace.tsx), [src/renderer/components/CardPackOpening.tsx](../src/renderer/components/CardPackOpening.tsx), [src/renderer/panels/CardsPanel.tsx](../src/renderer/panels/CardsPanel.tsx), [src/renderer/panels/CollectionPanel.tsx](../src/renderer/panels/CollectionPanel.tsx).

**Sol implementation notes.**
- Card hand surface in the bottom bar (per old GDD §11.3) is **not yet shipped** — `BottomBar.tsx` does not host the hand drawer. Backlog.
- `CardSystem.clear()` exists for test isolation only. Production code must never call it.

---

### 4.7 Character

**Purpose.** Player avatar: stats, traits, ideology, XP/level, skill points, deck, hand.

**State (`CharacterState`).** See [docs/ARCHITECTURE.md §3.2](ARCHITECTURE.md#32-game-state-shape-simplified).

**Backgrounds.** `'citizen' | 'veteran' | 'executive'`. Stat bonuses applied via `CharacterSystem.applyBackgroundBonuses()`.

**Stats.** `charisma`, `strategy`, `connections`, `integrity`, `wealth`, `stamina`. Range 1..10; clamped on creation and on mutation.

**Traits.** Native (per background) + universal pool, picked at creation. Acquired traits added during play. Definitions in [src/data/traits/](../src/data/traits/) (planned migration to JSON; some are still hardcoded in `CharacterSystem.ts` — backlog).

**Ideology.** 2-axis compass `{ x: number; y: number }` in `[-1, 1]`. UI: [src/renderer/components/IdeologyCompass.tsx](../src/renderer/components/IdeologyCompass.tsx). Drives content gating in events and dialogue requirements.

**Current implementation.** [src/systems/CharacterSystem.ts](../src/systems/CharacterSystem.ts) is **pure** (no store imports). Caller dispatches store actions. Skill tree branches: `charisma`, `strategy`, `connections`, `integrity`, `stamina`, `wealth` — see [src/systems/SkillSystem.ts](../src/systems/SkillSystem.ts).

**Sol implementation notes.**
- Character creation flow lives in `screens/CharacterCreation/`. Verify trait-pool JSON migration before the trait list grows beyond ~20 entries.
- The old GDD listed 5 skill paths; current code has 6 branches. The 6-branch model wins — old doc is updated above.

---

### 4.8 Quests

**Purpose.** Multi-stage, time-boxed objectives with structured rewards.

**Definition / instance shapes.** See [src/types/quest.ts](../src/types/quest.ts).

**Cadence.** Daily evaluation in `QuestSystem.dailyUpdate()`. Each active quest evaluates each objective; on completion, rewards are funnelled through `applyEffects()`.

**Lifecycle.** `start(id)` checks prerequisites and idempotently activates; `dailyUpdate()` may complete or fail; failed quests stay on the world store with status `'failed'` for legacy display.

**UI.** [src/renderer/panels/QuestsPanel.tsx](../src/renderer/panels/QuestsPanel.tsx).

**Sol implementation notes.**
- `startedDays` map on `QuestSystemImpl` tracks deadlines. It's in-memory — quests started before save/load lose their start day on reload. **Bug-class issue. Backlog: persist via `worldStore.activeQuests[i].startedDay`.**

---

### 4.9 Achievements

**Purpose.** Cross-save and per-save unlocks, gated by `Requirement[]` arrays evaluated by the same engine that gates event options.

**Definitions.** [src/data/achievements/achievements.json](../src/data/achievements/achievements.json), registered at boot.

**Cadence.** Checked weekly and on key state-change events (bill signed, group happiness threshold crossed).

**Implementation.** [src/engine/AchievementEngine.ts](../src/engine/AchievementEngine.ts). `world.unlockedAchievements` is the per-save record; cross-save record lives on `electron-store` keyed `pa:achievements:global` (see [src/main/](../src/main/)).

---

### 4.10 Influence (PC + Leverage)

**Purpose.** PC is the primary spend currency for actions; leverage is a hidden per-NPC compromise score for coercion.

**PC generation (`InfluenceSystem.weeklyUpdate`).** `gain = clamp(charisma*0.8 + alliesCount + groupLoyaltyMean/20, 0, 60)`.

**Leverage operations.** `adjustLeverage(npcId, delta)`, `spendLeverage(npcId, amount, relationshipDelta)`. Spending leverage is the dark-path tool: shifts a legislator's relationship at the cost of integrity (handled by caller via `applyEffects`).

**Implementation.** [src/systems/InfluenceSystem.ts](../src/systems/InfluenceSystem.ts).

---

### 4.11 Reputation / Factions *(designed, partial)*

**Status.** Faction enumeration exists in design docs; no runtime module. Faction-level loyalty math is currently bundled into `InfluenceSystem` and ad-hoc legislator-level relationship aggregates.

**Backlog.** Either build a `FactionSystem.ts` with `weeklyUpdate()` and `loyaltyCheck()` hooks, or formally decompose faction logic across `CongressSystem` (member rosters) + `InfluenceSystem` (loyalty arithmetic) and remove faction language from prose docs. See §14.

---

### 4.12 Dialogue *(scaffolded, no UI)*

**Purpose.** Tree-based interactions for negotiations, hearings, press, NPC meetings.

**Implementation.** [src/systems/DialogueSystem.ts](../src/systems/DialogueSystem.ts) is **pure**: `getNode`, `visibleOptions`, `choose`. No UI consumer ships yet — design ownership of the panel is open. *(Vex will likely write trees. Sol owns the renderer component.)*

---

## 5. Data Model & Persistence

### 5.1 Stores

Four Zustand stores, each backed by Immer for safe mutation syntax:

| Store | File | Persisted? | Purpose |
|---|---|---|---|
| `useGameStore` | [src/store/gameStore.ts](../src/store/gameStore.ts) | Yes | Time, speed, AP, PC, treasury, week/month/year, game-over flags |
| `useCharacterStore` | [src/store/characterStore.ts](../src/store/characterStore.ts) | Yes | Player stats, traits, ideology, XP, skill unlocks, hand, deck |
| `useWorldStore` | [src/store/worldStore.ts](../src/store/worldStore.ts) | Yes | Scenario id, economy, population, congress, relationships, leverage, active events, quests, news, flags, achievements |
| `useUIStore` | [src/store/uiStore.ts](../src/store/uiStore.ts) | No | Active panel, modal stack, transient UI state |
| `useSettingsStore` | [src/store/settingsStore.ts](../src/store/settingsStore.ts) | Yes (separate key) | Player preferences |
| `useDevStore` | [src/store/devStore.ts](../src/store/devStore.ts) | Yes (separate key) | Dev-mode flag (gates cheats; flagged into save metadata) |

### 5.2 Save format (schema v1)

Authoritative serialiser: [src/engine/SaveSystem.ts](../src/engine/SaveSystem.ts). All call sites go through it.

```jsonc
{
  "meta": {
    "schemaVersion": 1,
    "savedAt": 1738348740000,
    "name": "Just before the vote",
    "characterName": "Jordan Reyes",
    "scenarioId": "modern-america-2024",
    "weekLabel": "2025 · W12",
    "developer": false
  },
  "stores": {
    "game":      { /* GameState snapshot, no actions */ },
    "character": { /* CharacterState snapshot, no actions */ },
    "world":     { /* WorldState snapshot, no actions */ }
  }
}
```

Slot id (`slot-<savedAt>-<hash>`) is the storage key, not part of the payload. `settingsStore` and `devStore` are persisted separately and survive across save loads. Full reference: [docs/guides/SAVE_FORMAT.md](guides/SAVE_FORMAT.md).

### 5.3 Migration policy

- Bump `SAVE_SCHEMA_VERSION` on any breaking shape change.
- Loader refuses mismatched payloads with a clear `reason` rather than silently importing.
- Migration steps are append-only; never remove a step.
- Tests in [src/engine/SaveSystem.test.ts](../src/engine/SaveSystem.test.ts) lock the round-trip contract.

### 5.4 Static game data

Lives under [src/data/](../src/data/) as JSON loaded at boot via `dataLoader`:

```
src/data/
  achievements/
  avatars/
  cards/
  changelogs/
  events/
  ideology/
  legislation/
  quests/
  scenarios/
    modern-america-2024/
      scenario.json
      legislators.json   (procedural seed, not 535 hand-authored)
      population.json
      economy.json
  traits/
```

All shapes are typed in [src/types/](../src/types/). Loader validation is per-file; on parse failure the loader logs and skips the file rather than crashing the boot.

---

## 6. Architecture Overview

### 6.1 Process model

```
┌─────────────────────────────────────────────────────────┐
│  ELECTRON MAIN  (src/main/)                             │
│  • Window management                                    │
│  • IPC: pa:save:read / pa:save:write / pa:settings:*    │
│  • electron-store backing                                │
└────────────────────────┬────────────────────────────────┘
                         │  preload bridge (src/types/bridge.d.ts)
┌────────────────────────▼────────────────────────────────┐
│  RENDERER  (src/renderer/)                              │
│  React 18 + TS + Tailwind + Zustand + Recharts          │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │  STORES (Zustand + Immer)                       │    │
│  └─────────────────────────────────────────────────┘    │
│                         ▲ ▼                             │
│  ┌─────────────────────────────────────────────────┐    │
│  │  ENGINE  (src/engine/) — pure-ish, no React     │    │
│  │  GameEngine, TimeEngine, EventEngine, ...       │    │
│  └─────────────────────────────────────────────────┘    │
│                         ▲ ▼                             │
│  ┌─────────────────────────────────────────────────┐    │
│  │  SYSTEMS (src/systems/) — pure-ish, no React    │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### 6.2 Boundaries

- **Renderer never touches `electron-store` directly.** Always via the IPC bridge.
- **Systems never import from React or hooks.** They take and read stores via `useStore.getState()` / `setState()`. This is what keeps them unit-testable and Capacitor-portable.
- **Engine modules are stateful only at module scope** (registries inside `EventEngineImpl`, etc.). Test files exercise them as singletons; production wires them once at boot in `GameEngine.registerData()`.
- **Capacitor (Android) reuses the renderer wholesale.** No Electron IPC available — `SaveSystem` falls back to `localStorage` keyed `pa:save:*`. Detection at runtime.

### 6.3 Cross-cutting helpers

- `applyEffect` ([src/engine/applyEffect.ts](../src/engine/applyEffect.ts)) — single funnel for effect application. Cards, events, quests, achievements, dialogue, and skill unlocks all dispatch through it. **Do not bypass.**
- `SeededRNG` ([src/utils/random.ts](../src/utils/random.ts)) — Mulberry32. Single source of pseudorandom in the codebase.
- `createLogger` ([src/utils/logger.ts](../src/utils/logger.ts)) — namespaced dev-only logging; stripped in production builds.
- `Tooltip` registry ([src/renderer/components/tooltip/](../src/renderer/components/tooltip/)) — engine-agnostic glossary; never reads game state.

For full architecture detail (state shapes, IPC contracts, branch strategy), see [docs/ARCHITECTURE.md](ARCHITECTURE.md).

---

## 7. Tech Stack & Toolchain

Stack truth comes from [package.json](../package.json), not prose. Keep this section in sync.

| Layer | Tool | Version | Notes |
|---|---|---|---|
| Language | TypeScript | ^5.5 | `tsconfig.web.json` for renderer, `tsconfig.electron.json` for main |
| Bundler | Vite | ^5.4 | + `vite-plugin-electron` |
| UI runtime | React + ReactDOM | ^18.3 | |
| Routing | React Router DOM | ^6.26 | |
| State | Zustand + Immer | ^4.5 / ^10 | Immer middleware on every store |
| Charts | Recharts | ^2.12 | Economy / population panels |
| Styling | Tailwind CSS + custom CSS | ^3.4 | Token map in `tailwind.config.ts` |
| Desktop shell | Electron | ^32 | + electron-builder ^25 |
| Persistence (desktop) | electron-store | ^10 | |
| Persistence (web/Android) | localStorage | — | Keys prefixed `pa:` |
| Mobile shell | Capacitor + @capacitor/android | ^6.1 | |
| Testing | Vitest + Testing Library | ^2 / ^16 | jsdom env |
| E2E | Playwright | configured | [playwright.config.ts](../playwright.config.ts) |
| Lint / format | ESLint 8 + Prettier 3 | — | |

### 7.1 Build matrix

| Target | Command | Output |
|---|---|---|
| Web (dev) | `npm run dev` | Vite dev server |
| Electron (dev) | `npm run dev:electron` | Vite + Electron live-reload |
| Web (prod) | `npm run build:web` | `dist/` |
| Electron (prod, all) | `npm run build:electron` | electron-builder artifacts |
| Electron (Windows) | `npm run build:win` | NSIS installer |
| Android (debug) | `npm run android:build` | APK in `android/app/build/outputs/` |
| Android (release) | `npm run android:release` | Signed APK (requires `keystore.properties`) |

### 7.2 Quality gates

- `npm run typecheck` — both tsconfigs must pass.
- `npm run lint` — ESLint must be clean.
- `npm run test` — Vitest must be green.
- Playwright e2e runs in CI. Local: `npx playwright test`.

---

## 8. UI / UX Conventions

The renderer follows the conventions in [docs/UI_GAME_FEEL_PROPOSAL.md](UI_GAME_FEEL_PROPOSAL.md). The short version, normative for any new component:

### 8.1 Visual language

- **Sharp corners.** No `rounded-*` utility on shipping components except where explicitly approved. Borders, not shadows.
- **Single primary accent — gold (`#948161`).** Used sparingly. A button is gold *because it matters*. If everything is gold, nothing is.
- **Serif + mono pair.** Inria Serif for meaning (titles, body); IBM Plex Mono for precision (numbers, timestamps, raw data).
- **Uppercase tracked labels.** Section headers, button labels, stat labels render uppercase with letter-spacing. Lower-case is for prose only.
- **Gold focus ring.** All focusable elements show a 2px `outline-accent-gold` on `:focus-visible`. Keyboard-first navigation is mandatory.
- **`game-scroll`.** Custom scrollbar utility class for any scrollable region. Defined in `styles.css`.
- **`no-select`.** Default for chrome and game-state elements; lift only on prose / code.

### 8.2 Motion

- CSS `transition` and `animation` only — no JS-driven animation in the render path.
- Never animate layout properties (`width`, `height`, `padding`). Use `transform` or `opacity`.
- Duration cap: 400ms.
- Every animated class has a `motion-reduce:` Tailwind variant respecting `prefers-reduced-motion`.

### 8.3 Token map (current)

From [tailwind.config.ts](../tailwind.config.ts):

| Token | Hex | Use |
|---|---|---|
| `bg-primary` | `#0B1012` | Outer shell |
| `bg-secondary` | `#131919` | Cards / panels / sidebar / topbar |
| `bg-tertiary` | `#242F35` | Elevated rows, tag chips, input bg |
| `accent-blue` | `#1B353F` | Informational, Democrat seats — **never CTA** |
| `accent-red` | `#8C2F2F` | Danger, Republican seats |
| `accent-gold` | `#948161` | **Only** primary CTA colour |
| `text-primary` | `#D8D6CC` | Body text |
| `text-secondary` | `#989A8F` | Labels |
| `text-muted` | `#5F6158` | Disabled, timestamps |
| `status-success` | `#6B8F5A` | Passed bills, positive trends |
| `status-warning` | `#C9A84C` | Stalled bills |
| `status-danger` | `#8C2F2F` | Failed bills, crisis |

### 8.4 Forbidden

- Any Unicode emoji in shipped UI. Use `<Icon />` ([src/renderer/components/Icon.tsx](../src/renderer/components/Icon.tsx)). CI fails on violation.
- Any inline `style` colour not derived from a token CSS custom property.
- Any raw hex outside the token map.
- Any `accent-blue` background on a button.

### 8.5 Component canon

Reusable building blocks live in [src/renderer/components/](../src/renderer/components/): `Button`, `Card`, `Bar`, `Meter`, `ResourcePips`, `ModalShell`, `ContextMenu`, `EntityLink`, `Icon`, `Slider`, `StatBlock`, `ToastRoot`, plus the tooltip system. New panels reuse these; do not re-roll.

---

## 9. Modding & Extensibility

The game is built mod-first. Static data (events, cards, traits, achievements, scenarios, quests, legislation templates) all live in JSON under [src/data/](../src/data/). Modders add new entries or override by id.

**Mod folder shape (planned, see [docs/guides/MODDING.md](guides/MODDING.md)):**

```
mods/
└── my-mod/
    ├── mod.json          ← manifest (name, version, author, deps)
    ├── events/
    ├── cards/
    ├── scenarios/
    └── README.md
```

**Override semantics.** Matching `id` overrides base content. Loader processes base data first, then mods in dependency order, then user-local overrides.

**Sol notes.**
- Loader does not yet enforce mod manifest validation or dependency resolution. Backlog (post-MVP).
- Effect schemas (`Effect`, `Requirement`, `TriggerCondition`) are the implicit modding API — version them carefully.

---

## 10. Platforms & Distribution

| Platform | Shell | Storage | Status |
|---|---|---|---|
| Web (browser) | Vite output | `localStorage` | Dev / preview only; not a release target |
| Windows | Electron | `electron-store` (`%APPDATA%/political-ascent/`) | Primary release target |
| macOS | Electron | `electron-store` (`~/Library/Application Support/`) | Tier-1 once tested |
| Linux | Electron | `electron-store` (`~/.config/`) | Tier-1 once tested |
| Android | Capacitor | `localStorage` (WebView) | Experimental port |

### 10.1 Update / distribution

- Electron: electron-builder. Auto-update planned via `electron-updater`; not yet wired.
- Android: signed APK from `android:release`. Play Store listing not yet established.
- No Steam integration. No Workshop. Future scope.

---

## 11. Performance Targets & Budgets

### 11.1 Frame and tick

| Metric | Target | Rationale |
|---|---|---|
| Render frame | ≤ 16ms p95 (60fps) | Standard target for Electron app on desktop |
| Idle CPU | ≤ 2% on a modern laptop | Game is paused most of the time |
| Tick cost (daily) | ≤ 4ms | Daily tick fans out to event triggers + quests + bill clocks |
| Tick cost (weekly) | ≤ 16ms | Population + economy + congress + influence + achievements all run |
| Tick cost (monthly) | ≤ 32ms | Adds econ monthly report |
| Tick cost (annual) | ≤ 64ms | Adds annual reconciliation; player will perceive a tiny pause — acceptable |
| Time to interactive (cold start) | ≤ 3s on desktop | From window paint to "New Game" actionable |

### 11.2 Save and memory

| Metric | Target |
|---|---|
| Save payload (JSON) | ≤ 256 KB typical, ≤ 1 MB max |
| Renderer heap | ≤ 256 MB typical |
| News / event history retention | Last 200 entries each (rolling) |

### 11.3 Mitigations and rules

- **No `Math.random()` in the simulation path.** Always `SeededRNG`. Required for determinism and budget predictability.
- **Population sim must remain O(groups), not O(citizens).** No per-citizen modelling.
- **`React.memo` on seat-grid rows and card faces** ([src/renderer/components/SeatGrid.tsx](../src/renderer/components/SeatGrid.tsx), [src/renderer/components/CardFace.tsx](../src/renderer/components/CardFace.tsx)).
- **Recharts surfaces** receive pre-thinned arrays — never raw daily history; downsample to weekly or monthly before passing.
- **Web Worker for population sim** is referenced in old architecture doc but **not yet implemented**. With current group counts (~10) it is not yet required. Re-evaluate if scenarios add regional cohorts.

---

## 12. Narrative, Story, Characters, RPG, Dialogue

**Narrative pass:** 0.3-DRAFT (Vex). Covers tone, voice, archetypes, quest arcs, dialogue authoring, speech composer content, per-scenario briefs, and localisation strategy. Does not design the dialogue renderer or speech system engine — those are Phase 5 (§12.9).

---

### 12.1 Tone Bible

#### 12.1.1 Core register

Political Ascent is **grounded political drama with a sardonic edge**. The register sits between Aaron Sorkin's walk-and-talk rhythm and the fatalistic realism of Crusader Kings III: characters are capable and compromised, institutions are real and imperfect, and the player's choices feel genuinely consequential — not because the game manipulates their emotions, but because the stakes are always material.

The register is **sincere, not cynical.** Cynicism says the system is irredeemably broken. Political Ascent says the system is brutally difficult and worth fighting over. Satire is earned by specificity and earned by context — it is never deployed as a default tone. A joke about committee procedure should reveal something true about committee procedure.

#### 12.1.2 In-bounds content

- Institutional friction: procedural gridlock, parliamentary manoeuvre, bureaucratic delay as genuine obstacles.
- Personal moral compromise: voting against principle for strategic gain; the cost must be visible.
- Factions with coherent internal worldviews, not just positions.
- Ambition as a legitimate and complex human drive — the player's desire to ascend is never mocked.
- Era-authentic language calibrated to each scenario (see §12.1.4).
- Scandal and embarrassment as mechanical and narrative outcomes.
- Dry wit in flavour text — a line that earns a half-smile without breaking immersion is a good line.
- Tragedy as a valid arc resolution. A quest that ends in defeat can feel earned.

#### 12.1.3 Out-of-bounds content

- **Real-person likenesses.** No NPC names that map to living or recently-deceased real political figures. Historical scenarios may reference *roles* (e.g., "the President," "the senior senator from Ohio") or historical names in lore/flavour text; historical figures are never interactive NPCs with authored dialogue.
- **Partisan messaging.** No authored text that reads as advocacy for a real-world political party or ideology. Factions exist on a 2-axis compass internal to the game universe.
- **Nihilism.** The game can be hard and unfair; it cannot imply that effort is pointless. Loss states must feel meaningful.
- **Off-colour humour.** Wit is welcome; punching down at marginalised groups is not.
- **Fourth-wall breaks** in authored in-world content (meta-commentary belongs in UI copy, if anywhere).
- **Anachronistic idiom** in scenario text: a 1777 delegate does not speak in post-television vernacular.

#### 12.1.4 Era register calibration

| Scenario era | Register cues | Avoid |
|---|---|---|
| Modern America 2024 | Compressed, media-saturated, self-aware | Purple prose, stilted formality |
| Cold War | Institutional gravity + subterranean paranoia | Slangy ironic detachment |
| Civil War & Reconstruction | Portentous, formal, weight of history on every line | Casual contractions in formal addresses |
| Gilded Age | Florid public rhetoric masking private cynicism | Post-1960s idiom |
| Great Depression / New Deal | Plain urgency, radio-broadcast cadence | Detached irony |
| World War I / II | Clipped, purposeful, duty-language | Nihilism or retroactive snark |
| 9/11 / War on Terror | Compressed urgency, security-state dread | Self-congratulatory hindsight |
| Founding Era | Elevated, classical, principled argument | Any informality; anachronism |

---

### 12.2 Voice & Style Guide

#### 12.2.1 Sentence cadence rules

- **News headlines:** subject + verb, present tense, drop article where possible. ≤ 12 words. *"Senate Panel Stalls Infrastructure Vote"*, not *"The Infrastructure Vote Has Been Stalled by the Senate Panel."*
- **Event descriptions:** 2–3 sentences. First establishes the situation. Second adds complication or stakes. Third is optional: a telling concrete detail.
- **Dialogue lines:** one idea per line. Conversational rhythm. Interruptions use em-dash (—), not ellipsis.
- **Card flavour text:** 8–16 words. One sharp image or one wry observation. Complete sentence not required.
- **Quest descriptions (player-facing):** declarative, present-tense. *"The coalition is fracturing. Find common ground before the vote."*
- **Trait descriptions:** one sentence doing double duty — explain the mechanical effect while conveying the character type. See [src/data/traits/traits.json](../src/data/traits/traits.json) for working models.

#### 12.2.2 Capitalisation conventions

| Element | Rule | Example |
|---|---|---|
| In-game currencies | Title case | Political Capital, Action Points |
| System/panel names (UI labels) | Title case | Legislation Panel, Congress View |
| Bill titles | Title case | The Infrastructure Renewal Act |
| Political office title (used as title) | Title case | Senator Reyes |
| Political office title (used generically) | Lowercase | "the senator voted" |
| Era names (scenarios) | Title case | Modern America, the Cold War Era |
| Trait names | Title case | Scandal Survivor, Veteran Orator |
| Faction names | Title case | Reform Bloc, Pragmatist Wing |
| Population cohort names | Title case | Working-Class Voters, Rural Landowners |

#### 12.2.3 Preferred terms and banned phrasing

| Prefer | Avoid | Reason |
|---|---|---|
| Political Capital (PC) | "influence points," "clout" | Canonical term; enforces glossary |
| Action Points (AP) | "energy," "moves" | Canonical term |
| Cohort | "voting bloc," "demographic" | In-world precision |
| Legislator | "politician," "member" (except procedural context) | Matches `Legislator` type |
| Bill stage | "phase," "status" | Matches `Bill.stage` enum |
| Faction | "caucus" (unless procedurally correct) | System term |
| Passed / signed / failed / vetoed | "approved," "accepted," "rejected" | Matches `Bill.stage` literals |
| Integrity | "honesty," "morality" | Matches character stat name |
| Leverage | "blackmail," "dirt" (in flavour: acceptable, sparingly) | System term |
| Era-appropriate phrasing | Generic placeholder prose | Lore fidelity |

**Banned outright in all in-world authored text:** "Based" (slang intensifier), "Literally" (as intensifier), "POV:", any social-media meta-language. These break immersion in every era including Modern America.

#### 12.2.4 Good vs. bad examples

*Event description*
> ✓ *"The energy bill clears committee on a party-line vote. The floor fight starts Monday. You have four days."*
> ✗ *"The energy bill has successfully passed through the committee phase and will now proceed to the floor debate stage."*

*Card flavour text*
> ✓ *"Smile for the cameras. Shake every hand."* (existing — canonical)
> ✓ *"The check clears. The question of why it was written never does."*
> ✗ *"Use this card to gain Political Capital from donors."*

*Trait description*
> ✓ *"You've been to the mountaintop of bad press and lived."* (existing — canonical)
> ✓ *"You find the seam in every caucus room."* (existing — canonical)
> ✗ *"This trait improves your ability to negotiate legislative outcomes."*

*News headline*
> ✓ *"Reyes Breaks with Leadership on Budget Vote"*
> ✗ *"Senator Reyes Has Announced a Decision to Vote Against Her Party's Budget Legislation"*

---

### 12.3 Character Archetypes & Cast

#### 12.3.1 Purpose of archetypes

Archetypes serve three functions:

1. **NPC voice tagging.** `CongressSystem` generates legislators with `personality` values (`loyalist | maverick | opportunist | ideologue | pragmatist`). Archetypes expand those into dialogue-voice cues for content authors.
2. **Player character framing.** Backgrounds (`citizen`, `veteran`, `executive`) are the player-facing expression of three archetypes; trait choices at creation refine the archetype further.
3. **Faction figureheads.** Each named archetype in a scenario can serve as the human face of a faction or power bloc.

The archetype model annotates, not replaces, the `Legislator.personality` enum.

#### 12.3.2 Archetype catalogue

| # | Archetype | `personality` affinity | Faction tendency | Motivation | Dialogue tic | Sample line |
|---|---|---|---|---|---|---|
| 1 | **Machine Boss** | loyalist | Establishment wing | Control; predictable outcomes | Indirect, transactional; never says "no" directly | *"I don't have a problem with your bill. I have a calendar problem."* |
| 2 | **Reform Idealist** | ideologue | Reform Bloc | Change the system from within | Earnest, specific, occasionally naive about cost | *"I know the math. I also know what the math costs us in ten years."* |
| 3 | **Donor Whisperer** | opportunist | Donor-aligned centrist | Access and capital flow | Smooth, euphemistic, fluent in abstractions | *"Our stakeholders are aligned on the principle. The details are a process question."* |
| 4 | **Backbencher Loyalist** | loyalist | Party mainstream | Survival; quiet career advancement | Deferential, brief; watches the room before speaking | *"The Whip's taken a position. I don't see a reason to complicate that."* |
| 5 | **Media Operator** | maverick | Swing; self-positioned | Narrative control; being seen as decisive | Quotable, punchy, comfortable with conflict | *"I'm not against the bill. I'm against the story the bill tells."* |
| 6 | **Coalition Broker** | pragmatist | Cross-faction | Deals that hold; hates pyrrhic victories | Probing questions, list-making, wants everyone in the room | *"Who's a no? Why? What would it take? Let's start there."* |
| 7 | **Ideological Enforcer** | ideologue | Hardline faction | Doctrinal purity; movement-building over the long run | Principled, occasionally sanctimonious; long memory for betrayal | *"You voted for the exception. The exception always becomes the rule."* |
| 8 | **Reluctant Moderate** | pragmatist | Swing; uncomfortable there | Re-election above all else | Hedging language, non-committal; visibly relieved when given cover | *"I need to go back and talk to my district. You understand."* |
| 9 | **Old Guard Survivor** | loyalist / pragmatist | Institutional establishment | Institutional memory; resisting disruption | Historical allusions, indirect reference, patronising patience | *"We tried something like this in '94. Took eight years to clean it up."* |
| 10 | **Crusader Freshman** | ideologue / maverick | Reform / populist | Mandate; zero patience for procedure | Impatient, press-ready, prone to overreach | *"I didn't come here to wait in line."* |
| 11 | **Shadow Power** | opportunist | Hidden; cross-faction | Structural influence with no personal exposure | Asks rather than tells; presents options, never directives | *"There are two versions of this conversation. You've only heard one of them."* |
| 12 | **Principled Dissenter** | maverick | Isolated; broadly respected | Conscience over coalition | Precise, measured; occasionally devastating | *"I've read the amendment. I've also read the amendment to the amendment."* |

#### 12.3.3 RPG layer hooks

**Traits → archetypes.** Trait definitions in [src/data/traits/traits.json](../src/data/traits/traits.json) provide mechanical hooks; archetypes supply the authoring voice context. A legislator whose procedural generation assigns high Strategy and `pragmatist` personality should be authored in the Coalition Broker voice.

**Player character.** The three backgrounds map loosely to archetype families:

| Background | Primary archetype family |
|---|---|
| `citizen` | Reform Idealist, Principled Dissenter |
| `veteran` | Machine Boss, Old Guard Survivor, Backbencher Loyalist |
| `executive` | Donor Whisperer, Media Operator, Shadow Power |

Trait choices at creation (and acquired traits during play) sharpen the player's archetype identity within that family.

**`SkillSystem` branch → archetype affinity** ([src/systems/SkillSystem.ts](../src/systems/SkillSystem.ts)):

| Skill branch | Archetype voice affinity |
|---|---|
| `charisma` | Media Operator, Crusader Freshman |
| `strategy` | Coalition Broker, Machine Boss |
| `connections` | Donor Whisperer, Old Guard Survivor |
| `integrity` | Principled Dissenter, Reform Idealist |
| `stamina` | Backbencher Loyalist, Reluctant Moderate |
| `wealth` | Donor Whisperer, Shadow Power |

As a player invests in a skill branch, event and dialogue content should escalate in line with the affiliated archetype's voice — more Coalition Broker-style options unlocked at high Strategy, for instance.

#### 12.3.4 Modern America 2024 — named NPC seeds

Suggested named legislators for [src/data/scenarios/modern-america-2024/legislators.json](../src/data/scenarios/modern-america-2024/legislators.json) to ensure at least one richly-voiced representative of each key archetype is present at game start. These are seeds — procedural generation provides the full chamber.

| NPC seed | Archetype | Party | State | Role hook |
|---|---|---|---|---|
| Audrey Vance | Machine Boss | D | IL | Senate Majority Whip; controls committee assignments |
| Marcus Elbe | Reform Idealist | D | WA | First-term Senator; player's most useful ally or most dangerous rival |
| Harriet Okonkwo | Old Guard Survivor | R | TX | Ranking member; institutional memory; key vote on fiscal bills |
| Dell Pryor | Donor Whisperer | D | NY | Finance Committee chair; every major bill passes through him |
| Cassandra Holt | Media Operator | R | OH | Swing-state Senator; press magnet; unpredictable |
| Ray Nguyen | Coalition Broker | I | NV | Independent caucusing situationally; often the deciding vote on bipartisan bills |
| Jonah Birch | Ideological Enforcer | R | ID | Freedom-caucus leader; filibuster-willing; red-line holder |
| Nina Farrell | Crusader Freshman | D | CO | Progressive, impatient; activates base but strains coalition |

---

### 12.4 Quest & Story Arc Design

#### 12.4.1 Arc taxonomy

| Arc type | Scope | Trigger | System ties |
|---|---|---|---|
| **Career Arc** | Full campaign | Auto-starts at game open; one per campaign | Skill tree, office progression, scenario `victoryConditions` |
| **Ideological Arc** | Full campaign | Triggered by ideology compass position at creation | Ideology drift events, `InfluenceSystem`, faction loyalty |
| **Issue Arc** | 4–16 weeks | Bill reaching committee stage, or a crisis event | `LegislationSystem`, `EventEngine`, `PopulationSystem` |
| **Scandal Arc** | 2–10 weeks | Flag `scandal-in-play` set, or random crisis event | `worldStore` flags, `applyEffect`, news queue |
| **Coalition Arc** | 8–20 weeks | Two consecutive bills failing to reach vote threshold | `CongressSystem`, `InfluenceSystem`, legislator relationships |
| **Legacy Arc** | Final act | Unlocks at scenario milestone: 75% through clock or specified achievement | Scenario `victoryConditions`, `AchievementEngine`, `applyEffect` |
| **Personal Arc** | Variable | Triggered by trait combinations or background-specific conditions | `CharacterSystem`, `DialogueSystem`, acquired traits |

#### 12.4.2 Four-beat arc scaffold

Every arc — regardless of type — follows this structure:

```
SETUP
  ├─ Inciting event (EventEngine fire or QuestSystem.start())
  ├─ Stakes established in opening quest description
  └─ At least one NPC archetype introduced with a named relationship delta

ESCALATION
  ├─ 1–3 objective stages with branching decision points
  ├─ Each stage pushes a news item (worldStore.pushNews)
  └─ Mechanical pressure tightens: PC costs rise, time windows compress, opposition increases

PIVOT
  ├─ A reversal, revelation, or forced choice that reframes the arc
  ├─ At least one option is genuinely uncomfortable, not just suboptimal
  └─ Branch states diverge here — player choice determines the resolution path

RESOLUTION
  ├─ Success path: reward effects + legacy flag + closing news headline
  ├─ Failure path: consequence effects + reputation delta + narrative acknowledgement
  └─ Partial path (available on most arcs): compromise outcome with mixed effects
```

#### 12.4.3 Narrative consequences → system writes

| Narrative beat | System write | Example |
|---|---|---|
| Arc milestone reached | `worldStore.pushNews(news)` | *"Reyes Coalition Holds as Infrastructure Vote Advances"* |
| Quest stage completed | `applyEffects([...effects])` | XP, PC gain, group happiness delta |
| Scandal arc triggered | `worldStore.setFlag('scandal-in-play', true)` | Unlocks sabotage event options against the player |
| Coalition arc resolved | `InfluenceSystem.adjustLeverage(npcId, delta)` | Leveraged allies or permanently burned bridges |
| Legacy arc completed | `AchievementEngine.unlock(achievementId)` | Permanent cross-save achievement |
| NPC relationship shift | `worldStore.setRelationship(npcId, delta)` | Feeds vote math in `LegislationSystem` |
| Ideology drift event | `applyEffect` on player `ideology.x / ideology.y` | Gates new content via ideology requirements on future events |

#### 12.4.4 Legislative clock interlocking

Arcs are not designed to resolve independently of the bill clock. Stage durations (committee 21d / floor debate 14d / vote 7d — see §2.3 and [docs/research/pacing-legislative-timeline-2026-04.md](research/pacing-legislative-timeline-2026-04.md)) are the heartbeat arcs are written against:

- **Issue arcs:** escalation stage should land during floor debate — the player manages arc obligations and vote-whipping simultaneously.
- **Scandal arcs:** trigger mid-committee or mid-floor; only the emergency escalation path should land during vote week.
- **Coalition arcs:** span multiple bill cycles — they are the metagame above any single bill.
- **Legacy arcs:** resolve during or immediately after a signature vote — the arc endpoint *is* the vote.

#### 12.4.5 Branch convergence

Arcs with two or more divergent branches after the PIVOT beat must define a convergence point at the start of RESOLUTION that functions regardless of which branch was taken. Resolution copy acknowledges the player's path via parameterised tokens (§12.5.5) rather than hardcoded branch-specific strings.

---

### 12.5 Dialogue Authoring Guide

#### 12.5.1 System context

[src/systems/DialogueSystem.ts](../src/systems/DialogueSystem.ts) is pure: `getNode(id)`, `visibleOptions(node, gameState)`, `choose(node, optionId, gameState) → DialogueResult`. It is data-driven and has no UI surface yet. Dialogue tree definitions will live in `src/data/dialogue/<npc-id>/<tree-id>.json`. *(Path is proposed — Sol must create the `dataLoader` entry in Phase 5.)*

#### 12.5.2 Node shape (authoring contract)

```jsonc
{
  "id": "node-001",
  "speaker": "audrey-vance",       // NPC id or "player"
  "voiceTag": "machine-boss",      // archetype tag from §12.3.2
  "text": "I don't have a problem with your bill. I have a calendar problem.",
  "autoAdvance": false,            // true = no player pause; use sparingly
  "options": [
    {
      "id": "opt-push",
      "label": "What would it take to move it up?",
      "requirementType": "stat",   // "stat" | "trait" | "flag" | "ideology" | "none"
      "requirement": { "stat": "connections", "min": 4 },
      "failureHint": "Requires Connections 4 or higher.",
      "hiddenIfFails": false,       // false = greyed with failureHint; true = invisible
      "costType": "pc",             // "pc" | "ap" | "none"
      "cost": 10,
      "next": "node-002"
    },
    {
      "id": "opt-retreat",
      "label": "I'll come back when the timing is better.",
      "requirementType": "none",
      "costType": "none",
      "cost": 0,
      "next": "node-exit"
    }
  ]
}
```

#### 12.5.3 Line length budgets

| Context | Target | Hard cap |
|---|---|---|
| NPC speech line | 8–20 words | 30 words |
| Player option label | 4–12 words | 18 words |
| Auto-advance line (cinematic) | 6–15 words | 20 words |
| Flavour-only line (no response required) | 8–25 words | 40 words |

Lines over budget should be split into a node chain. Text walls in dialogue modals signal writing that can be cut.

#### 12.5.4 Requirement gates as narrative beats

A gate on a dialogue option is a narrative beat as much as a stat check. The option label itself should reflect *why* the stat matters at that moment:

| ✓ Write this | ✗ Not this |
|---|---|
| *"I've built this coalition — let's talk."* (connections ≥ 5) | *"Use connections to advance the conversation."* |
| *"Let me be direct."* (integrity ≥ 6; greyed with: *"You'd need a cleaner record to say this."*) | *(no label change for gate fail)* |
| *"I know where the bodies are."* (trait: `street-smart`) | *"(Requires: Street Smart trait)"* |

`hiddenIfFails: false` is the default. Authors must supply a `failureHint` whenever a gate can be visible-but-greyed. Write failure hints from the player's perspective, not in system-speak.

#### 12.5.5 Game-state tokens in dialogue text

Dialogue node `text` fields may reference game state via parameterised tokens. Proposed syntax (to be formalised with Sol in Phase 5):

| Token | Resolves to | Example |
|---|---|---|
| `{pc.name}` | Player character name | *"Senator Reyes, a word."* |
| `{pc.background}` | Background label | *"A veteran like you knows how this works."* |
| `{pc.ideology.label}` | Ideology quadrant label | *"Your reform record is showing."* |
| `{bill.current.title}` | Active bill title | *"The Infrastructure Renewal Act has… complications."* |
| `{week.label}` | Current week label | *"It's week 12 and we're already behind."* |
| `{npc.name}` | Speaker NPC's name | Injected automatically by the renderer |
| `{faction.name}` | Contextually relevant faction name | *"The {faction.name} won't like this."* |

#### 12.5.6 Reusability patterns

- **Greeting / exit library.** Each archetype has a canonical library of 3–5 openers and 2–3 exits so individual trees don't need to author from scratch.
- **Snippet nodes.** Short informational nodes that can be *referenced* (not embedded) across trees. A node explaining a bill's current stage can appear in any negotiation tree touching that bill.
- **State-conditional text variants.** A `text` field may be an array of `{ condition, text }` objects resolved by `visibleOptions`. Use this to vary NPC acknowledgement of the player's choices without duplicating entire trees.

---

### 12.6 Speech Composer Content

#### 12.6.1 System context

The Speech / Press Composer is not yet implemented — [src/systems/](../src/systems/) has no `SpeechSystem`. This section is the content design spec for Phase 4 implementation. The gap in [src/systems/PopulationSystem.ts](../src/systems/PopulationSystem.ts) noted in §4.4 ("no explicit 'speech moves population' pipeline yet") is what the Speech Composer fills.

The composer is a three-segment build tool: **Opening → Body → Close**. The player assembles a speech from phrase-fragment cards organised by segment, topic, and rhetorical device. The assembled text renders as a speech excerpt; the outcome is scored against audience-fit metrics and resolves via `applyEffect`.

#### 12.6.2 Rhetorical devices catalogue

| Device | Description | Tone tag | Audience-fit bonus |
|---|---|---|---|
| Appeal to shared identity | "We all know what it means to…" | `unity` | Working-class, rural voters |
| Statistical gravitas | Hard numbers, sourced claims | `authority` | Professionals, technocrats |
| Historical analogy | Reference to precedent or prior crisis | `gravitas` | Older cohorts, educated voters |
| Adversarial framing | "Our opponents want you to believe…" | `confrontational` | Ideologically active base |
| Personal testimony | First-person account of constituent impact | `empathy` | Working-class, minority cohorts |
| Moral imperative | "We have a duty to…" | `principled` | Reform base, religious cohorts |
| Economic pragmatism | Cost-benefit framing, efficiency language | `pragmatic` | Business interests, moderates |
| Emergency urgency | Crisis framing, compressed time pressure | `urgent` | Swing voters during active crisis events |

#### 12.6.3 Phrase fragment data shape

```jsonc
{
  "id": "frag-001",
  "segment": "opening",              // "opening" | "body" | "close"
  "topic": "infrastructure",         // matches PolicyTag values
  "rhetoricalDevice": "statistical-gravitas",
  "toneTag": "authority",
  "text": "Forty-seven thousand bridges in this country are rated structurally deficient.",
  "audienceFit": ["professionals", "working-class"],
  "era": ["modern-america-2024"],    // empty array = all eras
  "requires": { "stat": "strategy", "min": 3 }
}
```

Fragments live in `src/data/speech/fragments.json` (proposed — flag for Sol).

#### 12.6.4 Audience-fit scoring rubric

Scored output determines `PopulationGroup` happiness deltas dispatched via `applyEffect`. Scoring inputs:

1. **Topic relevance.** Bill `policyTags` vs. group's known issue priorities.
2. **Tone alignment.** Group ideology vs. speech `toneTag` distribution.
3. **Stat modifier.** `charisma` scales base effectiveness; `strategy` scales fragment bonus stacks.
4. **Trait modifiers.** `veteran-orator` trait applies +1 charisma on speech actions (per [src/data/traits/traits.json](../src/data/traits/traits.json)).
5. **Radicalism modifier.** Groups with `radicalism > 60` respond more to `confrontational` and are immune to `pragmatic` framing (per `PopulationGroup.radicalism` in [src/systems/PopulationSystem.ts](../src/systems/PopulationSystem.ts)).

Proposed happiness delta range: `[−8, +12]` per group. Groups not addressed by any fragment receive no delta. Groups misaligned in tone (e.g., `confrontational` speech aimed at `business-interests` cohort) take a small negative.

#### 12.6.5 Gaffe modes

| Failure mode | Trigger | Effect |
|---|---|---|
| **Contradiction** | Two fragments with incompatible `toneTag` in the same speech | −6 happiness across all targeted groups; news item flagging inconsistency |
| **Empty rhetoric** | No body fragments, or all fragments misaligned | No positive effect; −3 approval with professionals |
| **Era breach** | Fragment from wrong era (authoring error) | Dev-log warning; silently skipped in production |

#### 12.6.6 News headline templates on speech resolution

| Outcome band | Headline template |
|---|---|
| High effectiveness (avg delta ≥ 8) | *"{pc.name} Speech Draws Rare Bipartisan Praise"* |
| Moderate effectiveness (avg delta 3–7) | *"{pc.name} Makes Case for {bill.topic} on Senate Floor"* |
| Low effectiveness (avg delta 0–2) | *"{pc.name} Floor Speech Falls Flat Amid Opposition"* |
| Gaffe | *"{pc.name} Speech Draws Fire After Contradictory Signals"* |

---

### 12.7 Per-Scenario Narrative Briefs

Each brief covers: Setting / Stakes / Opening situation / Key NPCs / Central tensions / Victory and loss framing / Hooked systems.

---

#### 12.7.1 Modern America 2024 *(shipped)*

| Field | Detail |
|---|---|
| **Setting** | Contemporary US Senate. Hyper-partisanship, media fragmentation, procedural gridlock. Every vote is already a news story. |
| **Stakes** | The player's first term. Leave something behind, or be consumed by the machine. |
| **Opening situation** | Newly sworn in, minority caucus, a signature bill at pre-draft. The Majority Whip wants a favour before the committee assignment is confirmed. |
| **Key NPCs** | Audrey Vance (Machine Boss), Marcus Elbe (Reform Idealist), Harriet Okonkwo (Old Guard Survivor), Dell Pryor (Donor Whisperer) |
| **Central tensions** | Principle vs. viability; constituent service vs. national ambition; short-term coalition vs. long-term credibility |
| **Victory framing** | *"History will remember this session not for what was fought over, but for what was finally, imperfectly, done."* |
| **Loss framing** | *"The Senate moves on. Your seat doesn't."* |
| **Hooked systems** | All shipped systems; full starter card pool; all quest arc types; standard `DialogueSystem` trees |

---

#### 12.7.2 Cold War (1947–1991)

| Field | Detail |
|---|---|
| **Setting** | US Congress across a decades-long career. Institutional gravity, ideological realignment, the persistent pressure of the Soviet bloc. |
| **Stakes** | Not a single bill — a career-long legacy built in the shadow of the bomb. |
| **Opening situation** | Junior member of the House Armed Services Committee, 1947. The Marshall Plan is on the table. A classified intelligence brief just landed on your desk. Your senior colleague says you can either read it or deny you received it. |
| **Key NPCs** | A State Department liaison (Shadow Power), a hawkish committee chair (Old Guard Survivor), a progressive dissenter within your own caucus (Principled Dissenter) |
| **Central tensions** | Containment vs. rollback; civil liberties vs. national security; party unity vs. personal conscience across 40+ simulated years |
| **Victory framing** | *"Forty years. The wall fell while you were still in your office."* |
| **Loss framing** | *"The committee voted you out. History, it turns out, is not interested in moderation."* |
| **Hooked systems** | Executive crisis modal (new); classified intelligence card subtype (new); career-arc spanning multiple election cycles |

---

#### 12.7.3 Civil War & Reconstruction (1850–1877)

| Field | Detail |
|---|---|
| **Setting** | Congress fracturing under the weight of a national crisis. The player's chosen state determines the entire moral algebra. |
| **Stakes** | The republic itself. The wrong vote could be the last cast in a united chamber. |
| **Opening situation** | A border-state congressman in 1850. The Compromise is on the floor. Your state's delegation is divided. The party whip is calling in debts. |
| **Key NPCs** | An abolitionist firebrand (Ideological Enforcer), a Southern Unionist in a losing position (Reluctant Moderate), a constitutional lawyer threading the needle (Principled Dissenter) |
| **Central tensions** | Union vs. states' rights; moral clarity vs. political survival; Reconstruction justice vs. sectional reconciliation |
| **Victory framing** | *"The amendment ratified. The work was brutal. The work was right."* |
| **Loss framing** | *"The chamber empties. The secession votes were not metaphorical."* |
| **Hooked systems** | Constitutional amendment bill subtype; regional cohort weights; chamber fracture state |

---

#### 12.7.4 Industrial Revolution / Gilded Age (1870–1900)

| Field | Detail |
|---|---|
| **Setting** | Congress in the age of trusts, railroad capital, and explosive inequality. Money talks in this chamber — loudly and directly. |
| **Stakes** | Whether the first generation of industrial regulation passes or is strangled in committee by the people who own the committee. |
| **Opening situation** | A freshman congressman from a state split between a railroad terminus and a farming district. Your first major vote: the tariff. Both sides are already in your anteroom. |
| **Key NPCs** | A railroad-faction fixer (Donor Whisperer), a Populist organiser from a farming district (Reform Idealist), a protectionist old-guard senator (Machine Boss) |
| **Central tensions** | Capital vs. labour; tariff vs. free trade; party machine vs. reform coalition; machine loyalty vs. constituent need |
| **Victory framing** | *"The Sherman Act passed. Imperfect. Contested. Enough."* |
| **Loss framing** | *"The trust survives. You made a very comfortable living."* |
| **Hooked systems** | Upgraded faction model (trusts, unions, party machines); monetary-policy national stat; standard legislation |

---

#### 12.7.5 Great Depression & New Deal (1929–1941)

| Field | Detail |
|---|---|
| **Setting** | A nation in free-fall. The 73rd Congress has a mandate and a terrified public. Everything moves at emergency speed. |
| **Stakes** | Whether emergency legislation becomes durable policy or authoritarian overreach; whether relief reaches people before it reaches the courts. |
| **Opening situation** | Arriving in Washington for the First Hundred Days. The president has a list. The list is yours to carry — or to complicate. |
| **Key NPCs** | A populist demagogue courting your base (Ideological Enforcer), a conservative constitutionalist warning of overreach (Principled Dissenter), an administration floor liaison (Coalition Broker) |
| **Central tensions** | Urgency vs. constitutional process; executive ambition vs. congressional independence; relief now vs. durable structure later |
| **Victory framing** | *"The programme held. A generation of workers had something to hold on to."* |
| **Loss framing** | *"The Supreme Court struck it down. The people it was meant to help didn't wait for the appeal."* |
| **Hooked systems** | Emergency powers card subtype; economic-pressure escalation tuning; standard legislation |

---

#### 12.7.6 World War I (1914–1919)

| Field | Detail |
|---|---|
| **Setting** | A Congress pulled between isolationism and intervention. The war in Europe is someone else's problem — until it costs American ships and American lives. |
| **Stakes** | Entry into the war, the scope of conscription, the suppression of dissent: each vote leaves a permanent mark. |
| **Opening situation** | A midwestern progressive re-elected on a peace platform, watching the Zimmermann telegram change the arithmetic in real time. The peace coalition is holding — barely. |
| **Key NPCs** | An interventionist committee chair (Media Operator), a pacifist labour ally (Coalition Broker), a war-finance industrialist (Donor Whisperer) |
| **Central tensions** | Isolationism vs. international obligation; civil liberties vs. wartime security; working-class sacrifice vs. capital enrichment |
| **Victory framing** | *"The armistice came. What came after it — that was your doing, too."* |
| **Loss framing** | *"The Espionage Act passed with your name on it. You'll spend thirty years explaining that vote."* |
| **Hooked systems** | War finance cards; conscription cards; propaganda-event subtypes |

---

#### 12.7.7 World War II (1939–1945)

| Field | Detail |
|---|---|
| **Setting** | A nation mobilising at industrial scale. Congress's job is to fund, authorise, and not obstruct — or to be the last check on executive power as it expands into places it may never leave. |
| **Stakes** | Winning the war without permanently deforming the constitutional order. |
| **Opening situation** | Fall 1939. The Neutrality Act is under debate. Lend-Lease is a rumour. Your constituents are not ready. The president is already beyond them. |
| **Key NPCs** | An isolationist Republican titan (Old Guard Survivor), a New Deal loyalist content to follow (Backbencher Loyalist), an Army liaison seeking broad procurement authority (Shadow Power) |
| **Central tensions** | Isolation vs. intervention; war production vs. labour rights; civil liberties vs. emergency executive power |
| **Victory framing** | *"V-J Day. You voted for the money, the men, and the peace."* |
| **Loss framing** | *"The internment order had your abstention on record. History noted it."* |
| **Hooked systems** | War production legislation subtype; executive directive card subtype; expanded mechanics from WWI |

---

#### 12.7.8 9/11 & War on Terror (2001–2010)

| Field | Detail |
|---|---|
| **Setting** | A traumatised Congress legislating in grief, fear, and urgency. The surveillance state expands with every session in ways that will outlast the crisis. |
| **Stakes** | Security vs. liberty — not as an abstract debate, but as a series of specific, permanent votes. |
| **Opening situation** | September 2001. The AUMF is on the floor. There is not time to read the full text. The Whip is calling. The gallery is watching. |
| **Key NPCs** | An intelligence community liaison (Shadow Power), a civil-liberties Democrat on the wrong side of the moment (Principled Dissenter), a hawkish Armed Services Republican (Ideological Enforcer) |
| **Central tensions** | Civil liberties vs. security; congressional oversight vs. executive deference; accountability for intelligence failure |
| **Victory framing** | *"You built in the sunset clauses. They held."* |
| **Loss framing** | *"The surveillance apparatus grew. No one ever voted to stop it."* |
| **Hooked systems** | Intelligence card subtypes (reused from Cold War); surveillance civil-liberty trade-off decisions |

---

#### 12.7.9 Founding Era (1774–1789)

| Field | Detail |
|---|---|
| **Setting** | The Continental Congress and Constitutional Convention. No formal parties. No settled precedent. Every procedure is being invented in the room. |
| **Stakes** | The shape of the republic itself — federal vs. confederal, large state vs. small, with or without a bill of rights. |
| **Opening situation** | A delegate to the Second Continental Congress, 1775. Independence is not yet a settled question. Your state's instructions are ambiguous, and the senior delegate expects deference you are not sure you owe. |
| **Key NPCs** | A federalist theorist (Reform Idealist / Ideological Enforcer hybrid), a states-rights localist (Principled Dissenter), a merchant-class pragmatist (Coalition Broker) |
| **Central tensions** | Federal power vs. state sovereignty; revolutionary idealism vs. constitutional realism; property interests vs. equal-rights principles |
| **Victory framing** | *"The Constitution ratified. The republic — imperfect, contested, begun."* |
| **Loss framing** | *"The convention collapsed. The Articles held — for thirteen more years of drift."* |
| **Hooked systems** | Continental Congress chamber shape; no formal party-line (faction logic replaces party whip); constitutional ratification bill subtype |

---

### 12.8 Localisation Strategy

#### 12.8.1 Authoritative source

All string content is authored in **en-US** as the canonical locale. All other locales are derived translations. No string is authored directly into a non-en-US locale file.

#### 12.8.2 String externalisation map

| Content type | Current status | Target location |
|---|---|---|
| UI labels (panel names, button text) | Partial (some hardcoded in JSX) | `src/i18n/en-US/ui.json` |
| Event title and description | In JSON ([src/data/events/](../src/data/events/)) | Add `i18nKey` field per entry |
| Card name, description, flavour text | In JSON ([src/data/cards/](../src/data/cards/)) | Add `i18nKey` field per entry |
| Trait name and description | JSON migration in progress ([src/data/traits/traits.json](../src/data/traits/traits.json)) | Add `i18nKey` field; complete migration first |
| News headline templates | Not yet externalised | `src/i18n/en-US/news.json` (proposed) |
| Dialogue node text | New system (§12.5) | `src/data/dialogue/` per-NPC JSON |
| Quest title and description | In `src/data/quests/*.json` | Add `i18nKey` field per entry |
| Victory / loss framing | In `scenario.json` (dry data today) | Add `victoryText` / `lossText` string fields |
| Speech fragment text | New system (§12.6) | `src/data/speech/fragments.json` |
| Achievement titles and descriptions | In [src/data/achievements/](../src/data/achievements/) | Add `i18nKey` field per entry |

#### 12.8.3 Key conventions

- **String IDs** follow the pattern `{domain}.{entity-id}.{field}`. Examples: `card.card-fundraiser.flavorText`, `event.evt-budget-crisis.description`, `quest.quest-infra-act.title`.
- **No concatenated sentences.** Pluralisation, gender, and name insertion must use template tokens (`{pc.name}`, `{count}`, etc.) — never string concatenation in JS/TS.
- **Plural forms** use ICU MessageFormat syntax: `{count, plural, one {# vote} other {# votes}}`. Implementation should use a library compatible with this standard (e.g., `@formatjs/intl`).
- **Gender neutrality in en-US:** use singular they/their as the default for player-character references. NPC gender is procedurally set; authored templates must use `{npc.pronoun}` tokens.
- **RTL future-proofing:** no string should embed directional punctuation or assume left-anchor layout. Flag strings containing directional arrows (`→`, `←`) for RTL replacement tokens.

#### 12.8.4 Glossary lock list

Terms translators must preserve using approved equivalents, not natural-language paraphrases:

| en-US term | Translator note |
|---|---|
| Political Capital | Core currency; do not translate as generic "influence" |
| Action Points | Core currency; must remain distinct from Political Capital |
| Bill | Legislative draft; not "law" or "proposal" until signed |
| Committee | Procedural stage; must be distinguishable from floor stage |
| Whip (verb/noun) | Political term of art; glossary note required |
| Rider | Bill attachment; not "amendment" (different legislative stage) |
| Leverage | Game term: hidden coercion resource, not general "influence" |
| Faction | In-game faction, not real-world party |
| Cohort | Population slice; not generic "group" or "class" |
| Scenario | Playable historical era; not "level" or "stage" |

#### 12.8.5 Translator note convention

All authored strings with non-obvious context should carry inline translator notes in the source file:

```jsonc
{
  "id": "event.evt-budget-crisis.opt-play-hardball.outcome.flavor",
  "text": "Your base cheers. The cafeteria staff wait for back pay.",
  "translatorNote": "Cafeteria staff = federal employees directly affected by a government shutdown. The contrast is intentional irony."
}
```

Notes are stripped from shipped bundles; they live only in source data files.

#### 12.8.6 Recommended file layout

```
src/
  i18n/
    en-US/
      ui.json            ← UI labels, panel names, button text
      news.json          ← News headline templates
      glossary.json      ← Extended tooltip definitions
      achievements.json  ← Achievement titles and descriptions
    [locale]/            ← Mirror structure; sourced from en-US by translators
  data/
    dialogue/            ← Per-NPC dialogue trees (§12.5); i18nKey per node
    speech/
      fragments.json     ← Speech composer fragments (§12.6); i18nKey per fragment
    events/              ← Existing; add i18nKey fields
    cards/               ← Existing; add i18nKey fields
    quests/              ← Existing; add i18nKey fields
    traits/              ← Existing; add i18nKey fields (after migration completes)
```

---

### 12.9 Dialogue System Spec → see Phase 5 collaboration with Sol

The content authoring guide in §12.5 defines the **data shape, voice conventions, and authoring rules** for dialogue trees. The **technical specification** for the dialogue renderer component, node-graph tooling, conditional-evaluation performance, save-state persistence of dialogue progress, and integration with `worldStore` is deferred to Phase 5.

**Open questions for Sol to resolve in Phase 5:**

1. Confirm `src/data/dialogue/` as the `dataLoader` target and define the loader registration entry.
2. Add `failureHint` field to `DialogueOption` type in [src/types/](../src/types/) and implement greyed-out rendering in the dialogue panel component.
3. Clarify `autoAdvance` timing contract: ms delay, or driven by a player read-speed accessibility setting in `settingsStore`?
4. Formalise parameterised token resolution (§12.5.5): which tokens are available in which contexts, and how does the renderer access game state without creating a React dependency in the pure `DialogueSystem`?
5. Dialogue progress persistence: does completed-node state live on `worldStore` or per-NPC relationship data? A save-format schema bump (§5.2) is likely required.
6. UI surface decision: dialogue trees as a modal overlay (added to the `useUIStore` modal stack) or as a dedicated panel? Affects panel routing and focus management.
7. Confirm whether speech fragment data loads through `dataLoader` or through a dedicated `SpeechSystem.loadFragments()` call at boot.

*— Vex*

---

## 13. QA, Testing, Security, Accessibility, Release Readiness

**QA pass:** 0.4-DRAFT (Rook). Owns the test strategy, determinism contract, save round-trip discipline, accessibility target, security posture, performance verification, release readiness gates, CI pipeline specifications, and crash reporting policy. This section is the **spec**; the GitHub Actions workflows that implement it are Phase 6 work and are not authored here.

The strategy is anchored to the systems in §4, the data and persistence rules in §5, the architecture in §6, the perf budgets in §11, and the narrative authoring contracts in §12. Every "should be tested" claim names a concrete layer and an example assertion.

---

### 13.1 Test Strategy & Pyramid

Four layers, each with a clear owner and clear non-goals.

| Layer | Runner | Scope | Coverage target | Example assertion |
|---|---|---|---|---|
| **Unit** | Vitest ([package.json](../package.json) `test`) | Pure functions, reducers, utils, system step functions called directly. No DOM, no React. | **80% statements / 75% branches** for `src/engine/`, `src/systems/`, `src/store/`, `src/utils/` | `LegislationSystem.advanceClock(bill, 1)` moves a committee-stage bill to floor on the 22nd day. |
| **Component** | Vitest + `@testing-library/react` (jsdom) | Single React component or panel with mocked stores. | **60% statements** for `src/renderer/components/`, **70%** for `src/renderer/panels/` | `<TopBar pc={3} ap={2} />` renders the focus ring on the PC chip when tabbed to. |
| **Integration** | Vitest (no jsdom) | Two or more systems wired to a real store snapshot, no UI. | **Critical paths** (bill lifecycle, save round-trip, event→effect propagation) fully covered; no global %. | Drafting → committee → floor → vote → signed pipeline produces the expected `worldStore` flags and news entries from a fixture seed. |
| **End-to-end** | Playwright ([playwright.config.ts](../playwright.config.ts)) | Real Vite dev build, real browser, three desktop viewports + Pixel-portrait. | **Every user-visible critical path** from §3 / §12.4 has at least one e2e. | Drafting a bill from the dashboard advances the bill clock to committee and pushes a news headline. |

**Critical e2e paths required for stable promotion** (see §13.7):

1. Boot to "New Game" actionable in ≤ 3s (perf assertion, §13.6).
2. Character creation → first daily tick → top-bar updates.
3. Draft a bill → reach floor → vote → result reflected in `worldStore`.
4. Open every primary panel (Dashboard, Congress, Quests, Timeline, Glossary, Character) without console errors.
5. Save → reload → load → identical visible state (cross-checks §13.3).
6. Mobile-portrait drawer interaction smoke ([tests/e2e/mobile-portrait.spec.ts](../tests/e2e/mobile-portrait.spec.ts)).
7. Accessibility scan on the boot screen and one mid-game screen (axe; §13.4).

#### 13.1.1 Systems → test-layer ownership

Maps the §4 inventory to the layer that owns each system's regression coverage. "Owns" means a regression there must be caught by a test in that layer before it can ship.

| System (§4) | Primary layer | Secondary layer | Notes |
|---|---|---|---|
| `LegislationSystem` (§4.1) | Unit | Integration (full lifecycle) + e2e (`draft-legislation.spec.ts`) | Clock-stage transitions are pure; UI surface tested via panel. |
| `CongressSystem` (§4.2) | Unit | Integration (vote math) | Hemicycle layout has its own component test. |
| `EconomySystem` (§4.3) | Unit | Integration (monthly + annual reconciliation) | Determinism contract applies (§13.2). |
| `PopulationSystem` (§4.4) | Unit | Integration | O(groups) invariant asserted via perf bench (§13.6). |
| `EventEngine` / Events (§4.5) | Unit | Integration (effect propagation through `applyEffect`) | Schema validation (§13.5) is its own test. |
| `CardSystem` / `cardPackEngine` (§4.6) | Unit | Integration | Determinism contract applies. |
| `CharacterSystem` (§4.7) | Unit | Component (panel) | XP/skill ladder math is pure. |
| Quests (§4.8) | Unit | e2e (`quests-detail.spec.ts`) | Arc scaffolding (§12.4.2) covered by integration fixtures. |
| `AchievementEngine` (§4.9) | Unit | Integration | Cross-save unlocks need a dedicated fixture. |
| `InfluenceSystem` (§4.10) | Unit | Integration | PC + Leverage flows asserted by fixture replays. |
| Reputation / Factions (§4.11) | Unit | — | Designed-only today; tests added as the system lands. |
| Dialogue (§4.12 / §12.5 / §12.9) | Unit (data validation) | Integration (renderer in Phase 5) | String/i18n lint at unit; renderer e2e gated on Phase 5 (§12.9). |
| `SaveSystem` (§5.2) | Unit | Integration (round-trip) + e2e (save/load smoke) | See §13.3. |
| `dataLoader` | Unit | — | Per-file schema validation; bad files must be skipped, not crash boot. |
| `applyEffect` | Unit | — | Already covered ([applyEffect.test.ts](../src/engine/applyEffect.test.ts)). |

#### 13.1.2 String and content lint (§12.8 hook)

Authored content from §12 (events, quests, cards, dialogue, news templates) is validated by **unit-layer schema tests**:

- Every authored string with an `i18nKey` must resolve in `src/i18n/en-US/`. CI fails on missing keys.
- Every dialogue node referenced by a quest stage must exist in `src/data/dialogue/` once Phase 5 lands.
- No string in en-US source files contains an emoji ([AGENTS.md](../AGENTS.md) §2.1; already enforced by `accessibility.spec.ts`).
- No string contains `{` template tokens that don't match the documented token set (§12.5.5).

#### 13.1.3 What we explicitly do not test

- Third-party library internals (React, Zustand, Recharts, Immer, Capacitor, Electron). We test our usage, not theirs.
- Cosmetic renderer-only randomness (UI jitter, particle seeds; see §13.2 allow-list).
- Pixel-perfect snapshots beyond the existing Playwright tolerance (`maxDiffPixelRatio: 0.01`). Visual regression is a signal, not a hard gate, on a single-pixel diff.

---

### 13.2 Determinism Contract

Determinism is a hard rule, not a goal. Two runs from the same seed and the same player input sequence must produce the same world state, byte-for-byte after JSON serialisation.

#### 13.2.1 Rules

1. **All simulation randomness flows through `SeededRNG`** ([src/utils/random.ts](../src/utils/random.ts)). The seed lives on `worldStore.world.seed` and is captured by `SaveSystem`.
2. **`Math.random()` is forbidden in `src/engine/`, `src/systems/`, and `src/store/`** — enforced mechanically by [src/test/determinism.test.ts](../src/test/determinism.test.ts).
3. **`Date.now()` is forbidden in the simulation path.** Game time advances via `TimeEngine` ticks; wall-clock time is for save metadata only (`SaveMeta.savedAt`).
4. **Set / Map iteration order is not assumed** beyond JS insertion-order guarantees. Anywhere ordering matters (vote tallies, news ordering, achievement evaluation), the producer sorts explicitly by a stable key.
5. **No `crypto.randomUUID()` in simulation.** IDs that must be deterministic derive from `(seed, kind, counter)`.
6. **Floating-point reduction order** must match across platforms. Sums over collections sort first; no parallel reductions.

#### 13.2.2 Allow-list

Renderer-only sparkle (particle jitter, ambient animation seeds in `src/renderer/`) is exempt because it does not feed back into world state. Allow-list is opt-in per call site with a same-line directive comment, audited by the determinism test.

#### 13.2.3 How tests assert determinism

| Layer | Mechanism |
|---|---|
| Unit | "Same seed → same output" tests for any function consuming `SeededRNG` (e.g., `cardPackEngine`, vote-uncertainty rolls in `CongressSystem`). Required for every new system that takes an RNG. |
| Integration | **Golden-state replay**: a fixture seed + a recorded input script is ticked N times; the resulting `SaveSystem.serialise()` payload is compared to a checked-in golden JSON. Drift = test failure. |
| E2E | Boot, set seed via dev hook, run a scripted sequence, dump state via dev IPC, compare. Used only for the boot→first-tick smoke; bulk determinism stays at integration. |
| CI nightly | Long-run soak: 5,000 weekly ticks from a fixed seed; assert no exceptions and a hash of the final state matches the prior nightly hash (§13.8 `nightly-soak`). |

#### 13.2.4 Forbidden patterns (CI-enforced)

- `Math.random(` outside the allow-list → fails [src/test/determinism.test.ts](../src/test/determinism.test.ts).
- `Date.now(` in `src/engine/` or `src/systems/` → new lint rule to add in Phase 6 (gap, see deliverables report).
- `Array.from(set)` followed by mutation without an explicit sort → reviewer-enforced; lint candidate.
- Direct `new Date()` for game-time computation → forbidden; use `TimeEngine`.

---

### 13.3 Save Round-Trip Discipline

Authoritative serialiser: [src/engine/SaveSystem.ts](../src/engine/SaveSystem.ts). Schema constant: `SAVE_SCHEMA_VERSION` (currently `1`, §5.2).

#### 13.3.1 Round-trip rule

Every change to the shape of `gameStore`, `characterStore`, or `worldStore` is treated as a save-format change. The PR must include:

1. Either an updated round-trip fixture in [src/engine/SaveSystem.test.ts](../src/engine/SaveSystem.test.ts) or a justification comment that the change is non-persisted (e.g., a derived selector).
2. If the change is breaking: a `SAVE_SCHEMA_VERSION` bump and a new entry in the migration ladder (§13.3.3).
3. A line in the changelog under [docs/changelogs/](changelogs/) noting the schema bump.

#### 13.3.2 "Every save can be loaded" CI gate

A fixture corpus lives at `tests/fixtures/saves/v{N}/*.json`, one or more representative payloads per past schema version. The save-compat suite:

- Loads each fixture through `SaveSystem.load()`.
- Asserts `result.ok === true`.
- Runs one full weekly tick after load and asserts no exception, no warning log, and a successful re-serialise.

A failing entry blocks merge to `experimental`. Saves from versions older than the **N-2 supported window** may be retired with a major-version bump only.

#### 13.3.3 Migration ladder

Migration steps are append-only (§5.3). Each step:

- Lives in a single file: `src/engine/migrations/v{from}-to-v{to}.ts`.
- Has a unit test that takes the prior-version fixture, applies the step, and asserts the result loads cleanly under the new version.
- Is composed by `SaveSystem` linearly: `v1 → v2 → v3 → …`. No skip-jumps.

#### 13.3.4 Corruption and truncation handling

The loader is a **parser, not a coercer** (§13.5.4):

- Missing required field → `{ ok: false, reason }` with a precise field path. Never `null`-coerce.
- Truncated JSON → `JSON.parse` throws → caught and surfaced as `reason: "save file is truncated or not valid JSON"`.
- Wrong schema version → `reason: "save was written by a newer version (v{n}); please update the game"`.
- Unknown extra fields → ignored at load, dropped on next save (forward-compatible reads, conservative writes).

Test fixtures cover each branch in `SaveSystem.test.ts`.

---

### 13.4 Accessibility (WCAG 2.2 AA target)

Target: **WCAG 2.2 Level AA** for the desktop web/Electron build. Capacitor Android adds touch-target and safe-area requirements on top.

#### 13.4.1 Required behaviours

| Area | Requirement | Layer that asserts it |
|---|---|---|
| Keyboard | Every interactive control reachable by `Tab`; logical order matches visual order; no keyboard traps. | Component (focus order) + e2e (full-flow keyboard). |
| Focus ring | Gold focus ring (token from §8.3) visible on every focusable element, never suppressed by `outline: none` without a replacement. | Component snapshot + e2e visual. |
| Screen reader | Every button has an accessible name. Every region has a landmark role. Live regions announce news/event arrivals. | E2E axe scan + structural a11y fixture ([accessibility.spec.ts](../tests/e2e/accessibility.spec.ts)). |
| Contrast | All foreground/background pairs ≥ 4.5:1 for body text, 3:1 for large text and UI graphics. Token map (§8.3) is the source of truth. | Unit token test (token-pair contrast lint) + axe at e2e. |
| Reduced motion | `prefers-reduced-motion: reduce` disables all non-essential animation; transitions become instant. | E2E with media-feature emulation. |
| Font scaling | UI must remain usable at 200% browser zoom and at OS-level large-text settings; no clipped controls. | E2E at 1280×720 zoomed. |
| Hit target (Android) | ≥ 44×44 CSS px for primary controls; safe-area honoured top and bottom. | E2E `chromium-pixel-portrait` project. |
| Emoji-in-UI ban | Zero emoji in visible UI text ([AGENTS.md](../AGENTS.md) §2.1). | Already enforced in [accessibility.spec.ts](../tests/e2e/accessibility.spec.ts). |

#### 13.4.2 Automated axe scans

Adopt `@axe-core/playwright` (gap; see deliverables). Scan invocation lives in the e2e fixture; runs on:

- Boot screen.
- Main dashboard after first daily tick.
- Each primary panel (Dashboard, Congress, Quests, Timeline, Glossary, Character) once it is the active panel.
- Character creation flow.

Severity gating: any **`critical`** or **`serious`** axe violation fails CI. **`moderate`** violations log a warning and surface in the PR comment. **`minor`** is informational only.

#### 13.4.3 Manual a11y checklist (release-gate)

Required for any promotion to `stable` (§13.7):

- Full keyboard playthrough of the boot → first-bill-vote critical path with no mouse touches.
- Screen reader pass (NVDA on Windows, VoiceOver on macOS) on the boot screen and the dashboard.
- Reduced-motion pass: enable OS preference, confirm no spinning/pulsing/translation animations.
- Zoom pass at 200%.
- Android touch pass on a Pixel-class device: every primary panel reachable, no bottom-sheet overlap.

---

### 13.5 Security Posture

Political Ascent is a single-player desktop and mobile game. The threat model is narrow but real: **untrusted content arriving via save files and (future) mods**, plus the standard Electron/Capacitor renderer-boundary discipline.

#### 13.5.1 Threat model summary

| Asset | Threat | Mitigation |
|---|---|---|
| Player machine | RCE via Electron renderer compromise | `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, `webSecurity: true` ([src/main/main.ts](../src/main/main.ts) confirmed). |
| Player save | Malicious save file injects code | Save loader is a strict parser — no `eval`, no `Function`, no dynamic `import` of save content. JSON only. |
| Mod content (future) | Mod ships executable code | Mod loader **must not execute mod-supplied code**; data-only manifests. Code-mods are out of scope for stable. |
| WebView (Android) | Mixed content / external resource injection | `allowMixedContent: false`, `webContentsDebuggingEnabled: false`, `androidScheme: 'https'` ([capacitor.config.ts](../capacitor.config.ts) confirmed). |
| Renderer | Third-party network exfiltration | CSP forbids remote origins (gap; Phase 4 backlog). All assets ship in the bundle (§7). |
| IPC | Renderer escalates via undocumented channel | Preload exposes a fixed allowlist ([src/main/preload.ts](../src/main/preload.ts) — `pa:save:*`, `pa:settings:*`, `pa:app:*`, `pa:window:*`). Adding a channel requires a security review note in the PR. |

#### 13.5.2 Electron renderer/main boundary — required and verified

- `contextIsolation: true` — verified [src/main/main.ts](../src/main/main.ts).
- `nodeIntegration: false` — verified.
- `sandbox: true` — verified.
- `webSecurity: true` — verified.
- `setWindowOpenHandler` denies new windows and forwards `http(s)` URLs to the OS shell — verified.
- IPC handlers must validate input types (`typeof slotId === 'string'`); add a unit-style integration test that calls each handler with malformed input and asserts safe rejection (gap, Phase 4 backlog).

#### 13.5.3 Content Security Policy

A strict CSP is required for both web and Capacitor builds (gap; Phase 4 backlog item):

```
default-src 'self';
script-src 'self';
style-src 'self' 'unsafe-inline';     // Tailwind runtime classnames
img-src 'self' data:;
font-src 'self';
connect-src 'self';
object-src 'none';
base-uri 'self';
frame-ancestors 'none';
```

`'unsafe-inline'` for styles is acceptable while Tailwind's class strategy demands it; **`'unsafe-eval'` is never acceptable** in any build.

#### 13.5.4 Save file as a parser

The save loader's contract: **reject invalid input; never coerce, never partially load, never call `eval` / `Function` / `new Function` / `vm.runInThisContext` / dynamic `import()` on save content**. The flow:

1. `JSON.parse` (in a `try`).
2. Shape-check `meta` (each field present, types correct, `schemaVersion` is an integer).
3. Shape-check `stores.{game,character,world}` against typed validators in [src/types/](../src/types/).
4. Run migrations to current `SAVE_SCHEMA_VERSION` (§13.3.3).
5. Hand off to store hydrators.

A unit test corpus of malformed payloads (truncated, wrong types, unknown `schemaVersion`, missing `meta`, prototype-pollution shapes like `__proto__`) must each return `{ ok: false }` without throwing.

#### 13.5.5 Mod loader sandboxing (future, gated)

Mods (§9 of the GDD) are **data-only** at stable. Manifest is JSON; assets are images/audio/fonts. There is no JavaScript surface, no script tag in mod HTML, no `<iframe>`. If code-mods are ever shipped, they live behind a separate threat-model review and are gated by an explicit player opt-in toggle.

#### 13.5.6 Telemetry

Default: **off**. No telemetry ships in 0.x. If telemetry is added:

- Opt-in only, off by default. Setting lives in `settingsStore`.
- No PII. Documented field list in this section before the feature merges.
- Endpoint and payload schema reviewed in this GDD before any network call goes out.
- Disable-able at any time without restart.

#### 13.5.7 Supply chain

- `npm audit` runs in CI on every PR; `high` and `critical` advisories block merge.
- GitHub Dependency Review action runs on PR.
- CodeQL runs on push to default branch and weekly.
- Secret scanning enabled at the repo level; commits with detected secrets fail the `pr-validate` pipeline.
- `package-lock.json` is committed and integrity-checked.

---

### 13.6 Performance Verification

Budgets are defined in §11. This subsection defines how those budgets become **enforced gates**, not aspirational numbers.

#### 13.6.1 Tooling

| Concern | Tool | Where |
|---|---|---|
| Tick cost | `performance.mark` / `performance.measure` around `TimeEngine` step calls. | Vitest bench (new `bench/` folder, gap) — Phase 6. |
| Frame time | Playwright trace + `page.evaluate(performance.timing)` sampling. | E2E perf project (gap). |
| Bundle size | Vite build report parsed in CI; per-platform budget. | `pr-validate` pipeline. |
| Heap | Playwright `page.evaluate` of `performance.memory.usedJSHeapSize` after standardised scenario. | Nightly soak. |
| Cold start | E2E timer from `goto` to "New Game" enabled. | `pr-validate`. |
| Lighthouse (web) | Lighthouse CI on the static web build. | Release pipeline only (signal, not gate at 0.x). |

#### 13.6.2 Regression gates

| Budget (§11) | Hard gate | Soft gate (warn-only) |
|---|---|---|
| Daily tick ≤ 4ms p95 | > 8ms blocks merge | > 4ms posts a PR comment |
| Weekly tick ≤ 16ms p95 | > 32ms blocks merge | > 16ms warns |
| Save payload ≤ 1 MB max | > 1 MB blocks merge | > 256 KB warns |
| Cold start ≤ 3s | > 5s blocks merge | > 3s warns |
| Bundle size (web) | > 5 MB gz blocks merge | > 3 MB gz warns |
| Renderer heap ≤ 256 MB typical | > 512 MB blocks merge | > 256 MB warns |

Hard-gate thresholds are deliberately set to 2× the §11 target so flake doesn't dominate the signal; soft gates surface drift early.

#### 13.6.3 Scenario fixtures

Performance assertions run against fixed fixtures so the numbers compare like-for-like across runs:

- `perf-modern-america-2024-week-12` — mid-game state, moderate news history.
- `perf-modern-america-2024-week-104` — late-game state, large news history, multiple active arcs.
- `perf-soak-5000-ticks` — synthetic stress fixture for nightly only.

---

### 13.7 Release Readiness Checklist

Three streams already exist under [docs/changelogs/](changelogs/): `development/`, `experimental/`, `stable/`. Promotion between them requires the gates below.

#### 13.7.1 Promotion gates

| Gate | development → experimental | experimental → stable |
|---|---|---|
| `npm run typecheck` clean | Required | Required |
| `npm run lint` clean | Required | Required |
| `npm run test` (Vitest) green | Required | Required |
| Playwright e2e green on all four projects | Required | Required |
| Coverage thresholds (§13.1) met | Required | Required |
| Determinism suite green (§13.2) | Required | Required |
| Save-compat fixtures green (§13.3.2) | Required | Required |
| Performance hard-gates green (§13.6.2) | Required | Required |
| Performance soft-gates green | — | Required |
| Axe scan: no critical/serious (§13.4.2) | Required | Required |
| Manual a11y checklist (§13.4.3) | — | Required |
| `npm audit` no high/critical | Required | Required |
| CodeQL no high alerts | — | Required |
| Smoke test on web | Required | Required |
| Smoke test on Electron Win/macOS/Linux | — | Required |
| Smoke test on Capacitor Android | — | Required |
| Changelog updated under target stream | Required | Required |
| Version bumped in [package.json](../package.json) | Required | Required |
| Schema-version audit (any persisted change since prior promotion has a migration) | Required | Required |
| Known-issues list reviewed and triaged | — | Required |
| GDD §14 risks reviewed for new entries | — | Required |
| Wiki release notes updated ([docs/wiki/Release-Notes.md](wiki/Release-Notes.md)) | — | Required |

#### 13.7.2 Smoke test minimum (per platform)

A "smoke" pass means a human (or scripted human-equivalent) has done all of:

1. Cold-launch the app.
2. Start a new game in `modern-america-2024`.
3. Tick at least one full week.
4. Open every primary panel.
5. Save and reload.
6. Quit cleanly.

No exceptions in the log; no visual regressions vs. the prior stable; reduced-motion respected if the OS pref is set.

---

### 13.8 CI Pipelines (Spec, not implementation)

Phase 6 will implement these as `.github/workflows/*.yml`. This subsection is the contract.

| Pipeline | Trigger | Jobs | Required for branch protection |
|---|---|---|---|
| `pr-validate` | `pull_request` to any branch | typecheck, lint, unit (Vitest + coverage upload), e2e (Playwright, all four projects), web build, Electron build, Android build, bundle-size budget, perf hard-gates, axe scan | Yes — required check on `experimental` and `stable`. |
| `nightly-soak` | `schedule` daily 03:00 UTC + `workflow_dispatch` | Long-run determinism (5,000 weekly ticks), perf benchmarks across all fixtures (§13.6.3), heap snapshot, golden-state hash compare | No (informational), but a red nightly auto-files an issue with the `nightly-soak` label. |
| `release` | `push` of a tag matching `v*.*.*` | Re-run `pr-validate` matrix, sign Electron binaries (Win/macOS/Linux), build signed Android bundle, attach artefacts to the GitHub Release, draft release notes from the matching `docs/changelogs/` entry | Yes — tag protection on `stable`. |
| `security-scan` | `pull_request` + `schedule` weekly Mon 06:00 UTC + `push` to default | CodeQL (JS/TS), `npm audit --omit=dev`, Dependency Review, Secret Scanning summary | Yes — `npm audit` and Dependency Review required on `experimental` and `stable`. CodeQL informational at 0.x, gating from 1.0. |
| `a11y-scan` | `pull_request` (paths-filtered to `src/renderer/**` and `tests/e2e/**`) | Playwright axe scan on the e2e fixture set (§13.4.2) | Yes on PRs that touch the filter paths. |

#### 13.8.1 Branch protection

- `experimental` and `stable`: required checks = `pr-validate`, `security-scan`, plus `a11y-scan` when its filter triggers. Linear history. No force-push. One reviewer minimum.
- `stable`: signed commits required, tag protection on `v*.*.*`.
- `development`: no required checks (intentional — the development stream is the staging buffer where things are allowed to be temporarily red).

#### 13.8.2 Cache and matrix discipline

- Node 20 LTS pinned via `.nvmrc` (gap; add in Phase 6).
- npm cache keyed on `package-lock.json`.
- Playwright browsers cached per major version.
- Build matrix for Electron: `windows-latest`, `macos-latest`, `ubuntu-latest`. Android build runs on `ubuntu-latest` only.

---

### 13.9 Crash Reporting & Observability

Crash and error reporting are **client-local only** at 0.x. No network reporting until §13.5.6 telemetry policy is met.

#### 13.9.1 ErrorBoundary policy

[src/renderer/components/ErrorBoundary.tsx](../src/renderer/components/ErrorBoundary.tsx) wraps `<App />` in [src/renderer/index.tsx](../src/renderer/index.tsx). Its contract:

- Catches any uncaught render-time exception and presents a player-facing crash surface (no white screen).
- Records `error.message`, `error.stack`, and React `componentStack` to the in-app log ring buffer.
- Surfaces three actions: **Reload**, **Return to main menu**, **Download logs**.
- Never auto-submits anywhere. The only network call is a `mailto:` / GitHub-issue link the player explicitly clicks.
- Resets cleanly after a recovery action so secondary errors are caught fresh.

A nested boundary at the panel level is permitted for risky panels (e.g., the future dialogue renderer in Phase 5) so a single panel can fail without taking down the whole shell.

#### 13.9.2 Structured client logs

[src/utils/logger.ts](../src/utils/logger.ts) is the only logger. Rules:

- All logs go through `createLogger(scope)` — no `console.log` direct calls in shipped code (lint rule, gap).
- Logs are buffered in a ring buffer (capped, default 1,000 entries) so the crash UI's "Download logs" can attach the run-up to the failure as well as the failure itself.
- `serialiseLogs()` produces a single JSON file the player can attach to a bug report.

Levels: `debug` (dev only), `info`, `warn`, `error`. Errors are mirrored to the browser console so the dev pipeline still works.

#### 13.9.3 Repro bundle

The downloaded report bundle contains:

```jsonc
{
  "kind": "political-ascent-crash-report",
  "version": "<package.json version>",
  "platform": "<electron|web|android>",
  "occurredAt": <epoch ms>,
  "error": { "message": "...", "stack": "...", "componentStack": "..." },
  "logs": [ /* serialised ring buffer */ ],
  "save": { "schemaVersion": <n>, "summary": "<meta-only, no payload>" },
  "settings": { /* settingsStore snapshot, no PII fields */ }
}
```

Explicitly **excluded** from the bundle: machine identifiers, IP, user account info, full save payload by default (player may attach manually). The bundle is shaped so a future opt-in upload (§13.5.6) can ship it as-is.

#### 13.9.4 Observability hooks

- A `pa:diagnostics` IPC channel is reserved for an in-app diagnostics panel (planned, not built). It will surface tick-cost averages, save size, and current memory — **read-only**, dev-mode only.
- E2E captures Playwright traces on first retry (already configured) so CI failures travel with their own observability artefact.

---

---

## 14. Open Questions & Risks

Sol's audit produced the following items. They are **not** yet roadmap; they will be triaged in Phase 4. Recorded here so Vex and Rook see the same picture.

### 14.1 Architectural inconsistencies

- **Faction system is half-doc, half-code.** Old prose references a `FactionSystem` and `FactionSystem.loyaltyCheck()`; no module exists. Faction effects are scattered across `InfluenceSystem` and ad-hoc relationship math. **Decision needed:** build the module or delete the language.
- **Voting logic lives inside `LegislationSystem`.** When negotiation lands it will outgrow the module. Plan to extract a `VotingSystem` with a clean `tally(bill, congress) → VoteResult` contract.
- **`QuestSystemImpl.startedDays` is in-memory only.** Quests started before save/load lose their start day. **Bug-class.** Persist on `worldStore.activeQuests[].startedDay`.
- **Budget reconciliation referenced but unimplemented.** `LegislationSystem.budgetReconciliation()` is named in [ARCHITECTURE.md §4.1](ARCHITECTURE.md) but does not exist. Either build or remove the reference.
- **Web Worker for population sim is documented but unimplemented.** With ~10 groups it is not required. Re-evaluate if scenarios add regional cohorts.
- **Trait definitions are split** between [src/systems/CharacterSystem.ts](../src/systems/CharacterSystem.ts) (hardcoded) and [src/data/traits/](../src/data/traits/) (JSON). Complete the migration.
- **Card hand drawer not in `BottomBar.tsx`.** Old GDD §11.3 promises a persistent bottom-right hand. Not shipped. Backlog.
- **`Skip-to-event` time control unimplemented.** Speed bar shows the planned slot but it's a no-op.

### 14.2 Design questions

- **Negotiation mini-system.** Old design described per-legislator negotiation with breaking points and red lines. Currently votes resolve deterministically from relationship + ideology. How rich does the negotiation surface need to be for MVP feel?
- **Speech composer.** Pillar P3 ("speeches actually move populations") needs a `SpeechSystem` or extension to `applyEffect` for per-group multipliers. Owner / scope unclear.
- **Regional / state-level granularity.** Civil War scenario needs it (per [SCENARIO_PLAN.md §3.3](SCENARIO_PLAN.md)). MVP doesn't model it. Where on the roadmap?
- **Election cycle.** Listed in v0.2 roadmap. Will require a `CampaignSystem` with funding, polling, debates. Big chunk; needs a dedicated design pass.

### 14.3 Risks

- **Save schema churn.** As systems land, the WorldState shape will change frequently. Mitigation: append-only migrations from v1 onward; lock with round-trip tests (Rook to formalise in §13).
- **Determinism leakage.** Any accidental `Math.random()` in a system breaks save-restore parity invisibly. Mitigation: lint rule + grep gate in CI (Rook).
- **UI consistency drift.** New panels added without consulting the token map / convention list become visual debt fast (history of this in the repo). Mitigation: PR template checklist; component canon enforcement.

---

## 15. Glossary

The authoritative concept glossary lives in the wiki: [docs/wiki/Concept-Glossary.md](wiki/Concept-Glossary.md). It is what the in-game tooltip system seeds from ([src/renderer/components/tooltip/glossary.ts](../src/renderer/components/tooltip/glossary.ts)).

For new readers, the minimum vocabulary:

| Term | Meaning |
|---|---|
| **AP** | Action Points. Per-week budget for player actions. Regenerated by `ActionEngine`. |
| **PC** | Political Capital. Spend currency. Generated weekly by `InfluenceSystem`. |
| **Bill clock** | The day-indexed timer attached to a bill at each clocked stage (committee / floor / vote). |
| **Rider** | A drafting module attached to a bill; affects opposition math, complexity, fiscal strain, public appeal, and coalition mix. |
| **Leverage** | Hidden 0–100 per-NPC compromise score, spendable for forced relationship shifts. |
| **Ideology** | 2-axis position `{x, y}` in `[-1, 1]`. Used by player, NPCs, and population groups. |
| **Scenario** | Self-contained American political era: starting state, issue spectrum, card pool, win/loss framing. |

---

## 16. Change History

Project changelog directories:

- [docs/changelogs/stable/](changelogs/stable/) — released versions
- [docs/changelogs/development/](changelogs/development/) — development branch
- [docs/changelogs/experimental/](changelogs/experimental/) — experimental branch (current pace of change)
- [docs/about/CHANGELOG.md](about/CHANGELOG.md) — high-level summary
- Wiki release notes: [docs/wiki/Release-Notes.md](wiki/Release-Notes.md)

GDD revision history is tracked in Git. Pass log:

| Pass | Author | Scope |
|---|---|---|
| 0.1-DRAFT | original | Initial GDD |
| 0.2-DRAFT | Sol | Technical / architecture / systems / data model rewrite; Vex and Rook placeholders left |
| 0.3-DRAFT | Vex | Narrative / RPG / story / dialogue pass: §12.1–12.9 authored in full; version bumped |
| 0.4-DRAFT (this) | Rook | QA / testing / security / accessibility / release readiness pass: §13.1–13.9 authored in full; placeholder block replaced; version bumped. Pass 3 of 3 complete. |
