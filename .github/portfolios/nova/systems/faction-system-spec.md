# FactionSystem — Implementation-Ready Specification

**Milestone:** M2 — Floor Manager (`0.3.0-alpha.1`)  
**Status:** DRAFT — ready for Sol implementation review  
**Portfolio:** `.github/portfolios/nova/`  
**Handoff target:** Sol (implementation), Vex (dialogue/event text authoring), Lux (visual signal design)  
**Date:** 2026-05-03  
**Version:** 1.0.0

---

## Change Log

| Version | Date | Author | Notes |
|---|---|---|---|
| 1.0.0 | 2026-05-03 | Nova | Initial spec — M2 scope |

---

## Design Intent

The FactionSystem converts diffuse political alignment into a concrete social graph the player must actively manage. Factions are the _why_ behind every vote surprise, every closed door, and every unexpected ally. Standing is the record of every compromise the player has made (and not made).

The system must be:

- **Legible** — the player always knows approximately where they stand with each faction and why.
- **Consequential** — standing gates real content (dialogue, co-sponsors, events) at M2 launch, not in a future patch.
- **Non-trivially satisfiable** — the six starter factions have structurally incompatible preferences; the player _must_ choose who to disappoint.
- **Mechanically cheap** — M2 is a scaffolding milestone; simulation cost must be low (monthly tick only).

---

## 1. System Overview

### 1.1 Purpose

Track the player's relationship with each named political faction across the legislature and broader public sphere. Standing scores drive dialogue gating, co-sponsor recruitment, card bonuses, event triggers, and end-game victory condition modifiers.

### 1.2 Player-facing narrative hook

> "You are not just a party member — you are someone who has shown up, voted, dealt, and promised. Every faction has been watching."

### 1.3 One-sentence description

**FactionSystem** maintains a per-faction standing score (−100 to +100) for the player, adjusts it in response to votes, speeches, quests, and dialogue, decays it slowly toward a faction-specific neutral baseline, and exposes thresholds that gate downstream content.

### 1.4 When does faction standing matter most?

The **co-sponsor recruitment moment** — when the player needs four or five co-sponsors to move a bill out of committee, faction standing is the difference between a fast coalition and a two-week scramble. This is the primary loop moment where the player _feels_ the standing number. Secondary moments: closed dialogue branches, faction-exclusive events, and the end-of-run legacy verdict.

---

## 2. Data Model

### 2.1 `Faction` entity (static, loaded at boot from `src/data/factions/`)

```ts
interface Faction {
  /** Stable key used in save schema and code references. */
  id: FactionId;                        // e.g. "progressive-caucus"

  /** Display name shown in UI. */
  name: string;                         // e.g. "Progressive Caucus"

  /** Short description shown in tooltip. */
  description: string;

  /**
   * Ideology tag used for card affinity bonus lookup.
   * Must match a value in FactionAffinity (src/types/card.ts) or be 'none'.
   */
  ideologyTag: FactionAffinity;

  /**
   * The standing value this faction drifts toward each month if undisturbed.
   * Range: −100 to +100. Typically 0 (neutral) for most factions.
   * Some factions may start the player in mild hostility (-10) or mild
   * goodwill (+5) depending on scenario configuration.
   */
  neutralBaseline: number;              // −100..+100

  /** Standing thresholds that change the faction tier label. */
  thresholds: {
    allied: number;                     // standing ≥ this → Allied
    friendly: number;                   // standing ≥ this → Friendly
    hostile: number;                    // standing ≤ this → Hostile
  };

  /**
   * Policy areas this faction cares about. Used to weight bill-vote
   * standing deltas: bills with matching policyTags produce larger swings.
   */
  priorityPolicyTags: PolicyTag[];      // 2–4 entries

  /**
   * Scenario-specific starting standing override.
   * If absent, worldStore initialises to neutralBaseline.
   * Defined per-scenario in scenario.json → factionStandings[].
   */
  scenarioStartStanding?: number;
}
```

### 2.2 `FactionId` type

```ts
type FactionId =
  | 'progressive-caucus'
  | 'moderate-alliance'
  | 'business-coalition'
  | 'military-industrial'
  | 'grassroots-populist'
  | 'reform-coalition';
// Scenarios may add custom ids via JSON extension.
```

### 2.3 `FactionStanding` per-player record (persisted)

```ts
interface FactionStanding {
  /** References Faction.id. */
  factionId: FactionId;

  /**
   * Current standing. Range: −100 to +100 (inclusive).
   * Neutral point is 0. Clamped on every write.
   */
  standing: number;           // −100..+100

  /**
   * The epoch-week of the last action that produced a standing delta.
   * Used by the monthly decay pass to calculate weeks since last contact.
   */
  lastActionWeek: number;

  /**
   * Running history of the 10 most recent standing deltas, for the
   * "Why?" tooltip. Each entry is a short human-readable reason + delta.
   * Capped at 10; oldest entry evicted on overflow.
   */
  recentDeltas: Array<{
    reason: string;           // e.g. "Voted yes on HR-47 (Healthcare Reform)"
    delta: number;            // e.g. +8 or -12
    week: number;             // game week of the event
  }>;
}
```

### 2.4 Tier derivation (computed, not stored)

```ts
type FactionTier = 'allied' | 'friendly' | 'neutral' | 'cool' | 'hostile';

function deriveTier(standing: number, thresholds: Faction['thresholds']): FactionTier {
  if (standing >= thresholds.allied)   return 'allied';
  if (standing >= thresholds.friendly) return 'friendly';
  if (standing > thresholds.hostile)   return 'neutral';   // includes 'cool' band
  return 'hostile';
}
```

> **Note to Sol:** Do not persist the tier — derive it at call time. This keeps the save schema clean and avoids stale-tier bugs.

### 2.5 Persistence — Save Schema v2

Add to `WorldState` in `src/types/world.ts`:

```ts
// In WorldState:
factionStandings: FactionStanding[];
```

Exact field names and types for the save payload (`stores.world`):

```jsonc
"factionStandings": [
  {
    "factionId": "progressive-caucus",   // string
    "standing": 12,                       // number, −100..+100
    "lastActionWeek": 14,                // number, game-week index
    "recentDeltas": [                    // array, max 10 items
      {
        "reason": "Voted yes on HR-47",  // string
        "delta": 8,                      // number
        "week": 14                       // number
      }
    ]
  }
  // ... one entry per faction
]
```

**Schema migration v1 → v2:** Loader detects `schemaVersion === 1` and injects `factionStandings` as all factions initialised to `neutralBaseline` with empty `recentDeltas`. This is safe because v1 saves have no faction state at all.

**EMPTY world initialiser** (for `worldStore.ts`):

```ts
factionStandings: [] // populated by FactionSystem.initialize() on new-game
```

---

## 3. Faction Roster — Starter Set for M2

Six factions for the Modern America 2024 scenario. Each is structurally at odds with at least one other; simultaneous maxing of all six is mechanically impossible.

### 3.1 Faction definitions

| ID | Name | Ideology Tag | Default Start Standing | Description |
|---|---|---|---|---|
| `progressive-caucus` | Progressive Caucus | `progressive` | 0 | Left-flank legislators and activist groups prioritising social programs, wealth redistribution, and climate legislation. |
| `moderate-alliance` | Moderate Alliance | `moderate` | +5 | Cross-party centrists who value bipartisan dealmaking and incremental reform over ideological purity. |
| `business-coalition` | Business Coalition | `business-roundtable` | −5 | Corporate and donor networks demanding fiscal restraint, deregulation, and trade-friendly policy. |
| `military-industrial` | Military-Industrial Bloc | `establishment` | 0 | Defence contractors, veterans' groups, and national-security hawks aligned on defence spending and foreign-policy hawkishness. |
| `grassroots-populist` | Grassroots Populist Front | `reform-coalition` | −10 | Anti-establishment voters and organisers from both left and right who distrust party machinery and incumbent compromise. |
| `reform-coalition` | Reform Coalition | `problem-solvers` | 0 | Good-government moderates focused on electoral reform, ethics rules, and anti-corruption legislation. |

> **Note to Vex:** Each faction needs 2–3 event texts for "faction sends message of support" (standing ≥ friendly) and "faction publicly criticises player" (standing ≤ hostile). Flag these as backlog authoring tasks before M2 exit.

### 3.2 Standing thresholds per faction

| Faction ID | Hostile (≤) | Cool | Neutral | Friendly (≥) | Allied (≥) |
|---|---|---|---|---|---|
| `progressive-caucus` | −30 | −29..−1 | 0..19 | 20 | 60 |
| `moderate-alliance` | −25 | −24..−1 | 0..14 | 15 | 50 |
| `business-coalition` | −35 | −34..−1 | 0..24 | 25 | 65 |
| `military-industrial` | −30 | −29..−1 | 0..19 | 20 | 55 |
| `grassroots-populist` | −20 | −19..−1 | 0..14 | 15 | 45 |
| `reform-coalition` | −25 | −24..−1 | 0..19 | 20 | 50 |

> **Tuning rationale:** `grassroots-populist` has a low allied threshold (45) because it represents volatile grassroots energy — easy to win, easy to lose. `business-coalition` has the highest allied threshold (65) to model the difficulty of genuine corporate loyalty; they're transactional, not sentimental.

### 3.3 Priority policy tags per faction

| Faction ID | Priority Tags |
|---|---|
| `progressive-caucus` | `healthcare`, `climate`, `labor`, `social-programs` |
| `moderate-alliance` | `bipartisan`, `fiscal`, `education`, `infrastructure` |
| `business-coalition` | `taxation`, `trade`, `deregulation`, `fiscal` |
| `military-industrial` | `defense`, `foreign-policy`, `veterans`, `security` |
| `grassroots-populist` | `labor`, `healthcare`, `immigration`, `anti-corruption` |
| `reform-coalition` | `anti-corruption`, `electoral-reform`, `ethics`, `transparency` |

### 3.4 Incompatibility map (design guide, not code)

These pairs are structurally opposed — gaining with one costs the other:

| Pair | Why they conflict |
|---|---|
| `progressive-caucus` ↔ `business-coalition` | Taxation and labour regulation |
| `grassroots-populist` ↔ `moderate-alliance` | Anti-establishment vs. dealmaking |
| `progressive-caucus` ↔ `military-industrial` | Defence spending vs. social spending |
| `reform-coalition` ↔ `business-coalition` | Anti-corruption vs. donor networks |

> **Content note (per `political-simulation-fidelity.md` §4):** Every bill that gains standing with one faction must visibly cost standing with an opposing faction. Content review checklist must verify this for each new bill template.

---

## 4. Standing Change Mechanics

### 4.1 Action types that produce standing deltas

| Action | System hook | Affected factions |
|---|---|---|
| Vote yes on a bill | `LegislationSystem` bill signed | Factions whose `priorityPolicyTags` overlap bill's `policyTags` |
| Vote no on a bill (or bill fails after player opposition) | `LegislationSystem` bill failed/vetoed | Inverse of above |
| Complete a quest with a faction-aligned outcome | `QuestSystem.dailyUpdate()` → `applyEffect` | Quest definition specifies faction deltas |
| Dialogue choice (supporting/opposing a faction position) | `DialogueSystem.choose()` → `applyEffect` | Dialogue node definition specifies faction deltas |
| Play a card with `factionAffinity` matching a faction | `CardSystem.play()` → `applyEffect` | Matched faction gains; no loss to others (cards are neutral net-positives) |
| Monthly loyalty check (no-contact decay) | `FactionSystem.monthlyLoyaltyCheck()` | All factions drift toward `neutralBaseline` |

### 4.2 Bill-vote standing formula

When a bill is **signed into law** (or passed) the following runs for each faction:

$$\Delta_{faction} = \text{BILL\_BASE\_DELTA} \times w_{tag} \times s_{align}$$

Where:

| Variable | Value | Meaning |
|---|---|---|
| $\text{BILL\_BASE\_DELTA}$ | Tunable constant (default: **8**) | Maximum swing a single bill can produce |
| $w_{tag}$ | 0.0 – 1.0 | Tag-overlap weight (see §4.3) |
| $s_{align}$ | +1 or −1 | Alignment sign (see §4.4) |

If a bill **fails** and the player opposed it (i.e. player voted no or withheld co-sponsorship after `stage = 'failed'`), the delta is calculated identically but applied as if the player's _opposition_ was the action — so factions that dislike the bill gain standing with the player.

If a bill fails _without_ player involvement, no standing change applies.

### 4.3 Tag-overlap weight $w_{tag}$

```
matchingTags = bill.policyTags ∩ faction.priorityPolicyTags
w_tag = clamp(matchingTags.length / 2, 0, 1)
```

| Overlapping tags | $w_{tag}$ |
|---|---|
| 0 | 0.0 — bill is irrelevant to this faction; no standing change |
| 1 | 0.5 |
| 2 | 1.0 (cap) |
| 3+ | 1.0 (capped) |

### 4.4 Alignment sign $s_{align}$

Each faction has a stance toward each policy tag — either **pro** or **anti**. This is encoded in the faction definition as:

```ts
// In Faction entity (extend §2.1 with this field):
policyStances: Record<PolicyTag, 'pro' | 'anti'>;
```

If a bill passes and the faction is **pro** the matching tags: $s_{align} = +1$.  
If a bill passes and the faction is **anti** the matching tags: $s_{align} = -1$.

> **Shortcut for M2:** At M2 launch, Sol can derive stance from faction ideology tag. Full `policyStances` JSON authoring is a backlog item (M3). For M2 use the following lookup table:

| Faction | Tags where $s_{align} = +1$ (pro) | Tags where $s_{align} = −1$ (anti) |
|---|---|---|
| `progressive-caucus` | `healthcare`, `climate`, `labor`, `social-programs` | `defense`, `deregulation`, `taxation` (tax-cut direction) |
| `moderate-alliance` | `bipartisan`, `education`, `infrastructure` | `partisan`, `extreme` (any high-rider-opposition bill) |
| `business-coalition` | `deregulation`, `trade`, `fiscal` (spending cuts) | `labor`, `climate`, `social-programs`, `taxation` (rate-increase direction) |
| `military-industrial` | `defense`, `security`, `veterans` | `climate` (budget trade-off), `social-programs` |
| `grassroots-populist` | `labor`, `healthcare`, `anti-corruption` | `deregulation`, `defense`, `trade` |
| `reform-coalition` | `anti-corruption`, `ethics`, `transparency` | `partisan`, `defense` (opaque spending) |

### 4.5 Dialogue and quest deltas

These are **direct deltas** specified by authors in JSON, not calculated. They bypass the formula above.

```jsonc
// In event/quest/dialogue option effects array:
{ "type": "faction_standing", "factionId": "progressive-caucus", "delta": 12 }
```

`applyEffect` must handle this new effect type. Author-specified deltas are **clamped** to `[DELTA_MIN, DELTA_MAX]` (default: −25 to +25) to prevent content authors from accidentally creating one-shot max-standing events.

### 4.6 Standing clamp on every write

```
newStanding = clamp(currentStanding + delta, −100, +100)
```

Never allow values outside −100..+100. This is enforced in `FactionSystem.applyDelta()`, not in callers.

### 4.7 Monthly decay

Runs in `FactionSystem.monthlyLoyaltyCheck()` (already referenced in GDD §2.1 loop diagram).

$$\text{standing}_{t+1} = \text{standing}_{t} + \left(\text{neutralBaseline} - \text{standing}_{t}\right) \times \text{DECAY\_RATE}$$

| Constant | Default value | Meaning |
|---|---|---|
| `DECAY_RATE` | **0.05** | 5% of the gap between current standing and neutral closes each month |

**Example:** Standing = 60, neutralBaseline = 0.  
After one month: $60 + (0 - 60) \times 0.05 = 57$. After 12 months with no action: ~35.

This is a **first-order lag** (exponential decay toward the baseline). It prevents unlimited compounding from early play while keeping standing meaningful across a full campaign.

**Decay is skipped if:**
- `|standing - neutralBaseline| < 2` (avoids infinite oscillation near neutral).
- The player took a standing-altering action with this faction in the same month (the `lastActionWeek` field determines this).

---

## 5. Downstream Effects

### 5.1 M2 scope (Sol implements now)

| Effect | Condition | System |
|---|---|---|
| Unlock dialogue node | Standing ≥ faction's `friendly` threshold | `DialogueSystem` — checked via `FactionSystem.getTier(factionId)` |
| Block dialogue node | Standing ≤ faction's `hostile` threshold | Same |
| Co-sponsor recruitment unlocked | Standing ≥ `friendly` | `LegislationSystem` or `CongressSystem` — legislators tagged to a faction become recruitable for co-sponsoring if faction tier ≥ friendly |
| Card affinity bonus active | Standing ≥ `friendly` | `CardSystem.play()` — already has `factionBonusMultiplier` field; wire to standing check |
| News headline: faction endorses player | Standing crosses `allied` threshold (rising) | `EventEngine` / news push |
| News headline: faction withdraws support | Standing crosses `hostile` threshold (falling) | Same |

### 5.2 Future-phase effects (do not implement in M2, note for planning)

| Effect | Phase | Note |
|---|---|---|
| Faction-exclusive event pool | M3 | Events with `factionRequirement: { factionId, minTier: 'friendly' }` |
| Victory condition modifier | M4 | Reaching `allied` with ≥3 factions counts toward coalition-builder victory |
| End-game legacy verdict modifier | M5 | Standing snapshot at run end feeds into the legacy screen epitaph |
| SpeechSystem audience bonus | M3 | Speech delivered to aligned faction's audience segment gives standing bonus |
| Faction counter-legislation | M4 | Hostile faction sponsors opposing bills more aggressively |

---

## 6. Balance Parameters

All constants are tunable via `src/data/factions/faction-config.json` (new file Sol creates). Hard-coding in source is forbidden.

### 6.1 Global tuning table

| Constant | Default | Min | Max | Notes |
|---|---|---|---|---|
| `BILL_BASE_DELTA` | 8 | 2 | 20 | Max standing swing per bill passage |
| `DECAY_RATE` | 0.05 | 0.01 | 0.20 | Monthly pull toward neutralBaseline |
| `DELTA_MIN` (author-authored actions) | −25 | −50 | −5 | Floor on any single authored delta |
| `DELTA_MAX` (author-authored actions) | +25 | +5 | +50 | Ceiling on any single authored delta |
| `STANDING_MIN` | −100 | — | — | Global clamp floor |
| `STANDING_MAX` | +100 | — | — | Global clamp ceiling |
| `RECENT_DELTA_HISTORY_CAP` | 10 | 5 | 20 | Max entries in `recentDeltas` tooltip history |

### 6.2 Per-faction starting standings (scenario-level JSON)

Defined in `src/data/scenarios/modern-america-2024/scenario.json` under a new `factionStandings` key:

```jsonc
"factionStandings": [
  { "factionId": "progressive-caucus",  "startStanding": 0  },
  { "factionId": "moderate-alliance",   "startStanding": 5  },
  { "factionId": "business-coalition",  "startStanding": -5 },
  { "factionId": "military-industrial", "startStanding": 0  },
  { "factionId": "grassroots-populist", "startStanding": -10 },
  { "factionId": "reform-coalition",    "startStanding": 0  }
]
```

### 6.3 Threshold tuning table (faction-config.json)

```jsonc
"factionThresholds": {
  "progressive-caucus":  { "hostile": -30, "friendly": 20, "allied": 60 },
  "moderate-alliance":   { "hostile": -25, "friendly": 15, "allied": 50 },
  "business-coalition":  { "hostile": -35, "friendly": 25, "allied": 65 },
  "military-industrial": { "hostile": -30, "friendly": 20, "allied": 55 },
  "grassroots-populist": { "hostile": -20, "friendly": 15, "allied": 45 },
  "reform-coalition":    { "hostile": -25, "friendly": 20, "allied": 50 }
}
```

### 6.4 Balance targets for M2 playtesting (Rook verification criteria)

| Target | Metric | Pass condition |
|---|---|---|
| No faction should reach Allied in a single session without sustained effort | Max standing at week 12 | ≤ 40 under neutral play |
| At least two factions should be at Hostile after the player passes a controversial bill | Hostile count at week 8 | ≥ 1 hostile after any major bill |
| Decay should be perceptible but not punishing | Standing loss per month at +60 | ~3 points/month (confirms `DECAY_RATE = 0.05`) |
| Starting standings must not block any M2 content | Min starting standing | ≥ −10 across all factions |

---

## 7. Integration Points

### 7.1 `FactionSystem` public API (handoff to Sol)

Sol creates `src/systems/FactionSystem.ts`. This is the complete required interface:

```ts
interface FactionSystemImpl {
  /**
   * Initialise faction standings for a new game.
   * Called by GameEngine on new-game after scenario data is loaded.
   */
  initialize(scenarioId: ScenarioId): void;

  /**
   * Apply a standing delta to one faction.
   * Clamps result to [−100, +100].
   * Appends to recentDeltas (capped at RECENT_DELTA_HISTORY_CAP).
   * Updates lastActionWeek.
   */
  applyDelta(factionId: FactionId, delta: number, reason: string): void;

  /**
   * Returns the current standing for a faction. −100..+100.
   */
  getStanding(factionId: FactionId): number;

  /**
   * Returns the current tier for a faction.
   */
  getTier(factionId: FactionId): FactionTier;

  /**
   * Run monthly decay pass for all factions.
   * Called by TimeEngine (or GameEngine) on MONTH boundary.
   * Reads world.week from gameStore to determine lastActionWeek.
   */
  monthlyLoyaltyCheck(): void;

  /**
   * Returns all faction standings (for save serialisation and UI panels).
   */
  getAllStandings(): FactionStanding[];
}
```

> **Sol note:** `FactionSystem` must follow the same pattern as `InfluenceSystem` — no React imports; reads/writes via `useWorldStore.getState()` / `setState()`. Keep it pure-ish and unit-testable.

### 7.2 `DialogueSystem` integration

`DialogueSystem.visibleOptions()` currently evaluates `Requirement[]` per node option. Add a new requirement type:

```ts
// Extend the Requirement discriminated union:
interface FactionStandingRequirement {
  type: 'faction_standing';
  factionId: FactionId;
  /** Option visible only if standing ≥ this value. */
  minStanding?: number;
  /** Option visible only if standing ≤ this value. */
  maxStanding?: number;
}
```

Usage in a dialogue node JSON:

```jsonc
{
  "id": "option-appeal-to-progressives",
  "text": "Reference your healthcare record to the delegation.",
  "requirements": [
    { "type": "faction_standing", "factionId": "progressive-caucus", "minStanding": 20 }
  ],
  "effects": []
}
```

`DialogueSystem.visibleOptions()` calls `FactionSystem.getStanding(factionId)` to evaluate this requirement.

### 7.3 `LegislationSystem` integration

When a bill transitions to `signed` or `failed`, `LegislationSystem` calls:

```ts
FactionSystem.applyBillVoteDeltas(bill: Bill, outcome: 'passed' | 'failed', playerVote: 'yes' | 'no' | 'abstain')
```

This is a helper method on `FactionSystemImpl` (not in the public interface above — add it):

```ts
applyBillVoteDeltas(
  bill: Bill,
  outcome: 'passed' | 'failed',
  playerVote: 'yes' | 'no' | 'abstain'
): void;
```

Internal logic follows §4.2–§4.4 formulas.

> **Abstain rule:** Abstaining produces no delta (the player made no visible statement). Record the abstain in `recentDeltas` with `delta: 0` for transparency.

### 7.4 `applyEffect` new effect type

Add to the `Effect` discriminated union:

```ts
interface FactionStandingEffect {
  type: 'faction_standing';
  factionId: FactionId;
  delta: number;                // clamped to [DELTA_MIN, DELTA_MAX] at author-time
  reason?: string;              // if absent, auto-generated from context
}
```

`applyEffect` routes this type to `FactionSystem.applyDelta()`.

### 7.5 `EventEngine` trigger condition

Add a new `TriggerCondition` type for event gating:

```ts
interface FactionStandingTrigger {
  type: 'faction_standing';
  factionId: FactionId;
  operator: 'gte' | 'lte' | 'eq';
  value: number;
}
```

Example use: An event fires when `grassroots-populist` standing drops to −20 (hostile threshold):

```jsonc
{
  "triggerConditions": [
    { "type": "faction_standing", "factionId": "grassroots-populist", "operator": "lte", "value": -20 }
  ]
}
```

### 7.6 `SpeechSystem` — M3 placeholder

`SpeechSystem` does not exist yet (M3). When implemented, it should call:

```ts
FactionSystem.applyDelta(factionId, speechDelta, `Speech to ${audienceSegment}`)
```

The faction targeted is derived from the speech's `audienceSegment` → faction mapping (to be defined in M3 spec). **No implementation action required for M2.**

### 7.7 `CardSystem` affinity bonus wire-up

`CardSystem.play()` already has `factionBonusMultiplier?: number` on `CardDefinition`. For M2, add:

```ts
// Inside CardSystem.play(), after resolving card definition:
const activeFactionId = deriveFactionFromAffinity(card.factionAffinity);
if (activeFactionId && FactionSystem.getTier(activeFactionId) === 'friendly' || getTier === 'allied') {
  effectValue *= card.factionBonusMultiplier ?? 1.0;
}
```

`deriveFactionFromAffinity` maps `FactionAffinity` string → `FactionId`. Sol should put this mapping in `faction-config.json`.

---

## 8. Anti-Patterns to Avoid

These are patterns identified from Victoria 3, Democracy 4, and CK3 research that this spec deliberately avoids.

| Anti-pattern | Why dangerous | How this spec avoids it |
|---|---|---|
| **Single global approval number** (Democracy 4 early versions) | One number can be gamed; player finds the dominant strategy and repeats it | Six independent standings; each faction has different policy weights; no single action swings all of them |
| **Unbounded positive feedback** (approval → legislation → more approval → ...) | Runaway snowball; early lead becomes insurmountable | `DECAY_RATE` monthly pull toward neutral; `STANDING_MAX = +100` clamp; no multiplicative compounding |
| **Invisible standing changes** | Player cannot learn; arbitrary-feeling | `recentDeltas` history array exposes last 10 changes; "Why?" tooltip required per research packet §4 |
| **All-or-nothing tier jumps** (binary friend/enemy like early CK2) | Feels punishing, encourages save-scumming | Granular −100..+100 score; `FactionTier` is a view over the score, not a separate state; partial credit for partial standing |
| **Symmetric faction incompatibility** (equal-and-opposite cancellation) | Every bill is a wash; standings never diverge | Incompatible factions have different `priorityPolicyTags` sets; a bill strong on `climate` is relevant to 2 factions, not all 6 |
| **Standing as a pure money substitute** (Tropico factions) | Degenerates into optimisation not politics | Standing gates _access_ (dialogue, co-sponsors), not raw resources; player cannot simply buy standing |
| **Faction leaders as deterministic veto points** (Vic3 IG leaders) | Opaque; one NPC blocks everything | M2 has no faction leaders; faction is an aggregate; individual NPC relationships stay in `CongressSystem` |

---

## 9. Open Questions for Bridge

These are decisions outside Nova's authority that require user/director input before Sol implements:

| # | Question | Why it matters | Nova's default assumption |
|---|---|---|---|
| OQ-1 | **Are faction names and ideological labels approved for the Modern America 2024 scenario?** Names like "Progressive Caucus" and "Business Coalition" are plausible but not confirmed as ship-worthy. | Vex may want narrative voice over the faction names; names will appear in news headlines and dialogue. | Using the names in §3.1 as working labels; final approval needed before first authored dialogue. |
| OQ-2 | **Should faction standing be visible to the player as a numeric score, or abstracted to tier labels only?** | Numeric score is more legible for tuning but may break narrative immersion ("my standing is 47"). | Expose tier label in UI; numeric score in dev mode only; show `recentDeltas` as the "why" explanation. |
| OQ-3 | **Does the Grassroots Populist Front start at −10 toward all players, or is this scenario-specific?** A universally sceptical faction is a strong design choice but may feel unfair in playtesting. | Affects new-player experience; may need tutorial text explaining why this faction starts cool. | −10 as a scenario-default per §3.1; open to 0 if playtesting shows confusion. |
| OQ-4 | **Should cards produce permanent standing deltas (current spec), or temporary boosts that decay faster?** | Cards as permanent faction currency may trivialise standings via deck grinding. | Permanent delta per §4.1 for M2 simplicity; convert to temporary boost in M3 if playtesting shows abuse. |
| OQ-5 | **Are there any factions the player should never be able to reach Allied with in the Modern America 2024 scenario?** E.g. should `military-industrial` be hard-capped at Friendly as a narrative/tone choice? | Storyline and lore decision; affects what dialogue trees and events Vex needs to author. | No hard caps at M2; all tiers reachable; Vex to advise if any faction's allied state is narratively untenable. |

---

## Appendix A — Verification Checklist for Rook

- [ ] New game initialises all six `factionStandings` entries with correct starting values from `scenario.json`.
- [ ] Passing a healthcare bill increases `progressive-caucus` standing and decreases `business-coalition` standing.
- [ ] Standing is clamped: cannot exceed +100 or go below −100 regardless of stacked deltas.
- [ ] Monthly decay applied after MONTH boundary tick; decay moves standing toward `neutralBaseline`.
- [ ] Decay is skipped when standing within 2 points of `neutralBaseline`.
- [ ] `recentDeltas` never exceeds 10 entries; oldest entry evicted on overflow.
- [ ] Dialogue option gated by `faction_standing` requirement is hidden when standing is below threshold.
- [ ] Save/load round-trip preserves all six standings and `recentDeltas` accurately.
- [ ] v1 → v2 migration produces a valid `factionStandings` array with all six factions at `neutralBaseline`.
- [ ] Abstaining on a bill produces a delta of 0 (recorded but no standing change).
- [ ] Card affinity bonus only applies when faction tier is Friendly or Allied.

---

## Appendix B — File and Data Locations

| Artefact | Location |
|---|---|
| Faction static data | `src/data/factions/factions.json` (new) |
| Faction config / constants | `src/data/factions/faction-config.json` (new) |
| Scenario starting standings | `src/data/scenarios/modern-america-2024/scenario.json` → `factionStandings[]` |
| `FactionSystem` module | `src/systems/FactionSystem.ts` (new) |
| Type definitions | `src/types/faction.ts` (new) |
| `WorldState` patch | `src/types/world.ts` → add `factionStandings: FactionStanding[]` |
| `applyEffect` patch | `src/engine/applyEffect.ts` → add `faction_standing` case |
| `Requirement` patch | `src/types/` (wherever Requirement is defined) → add `faction_standing` variant |
| `TriggerCondition` patch | Same |

---

*Handoff to Sol for implementation. Flag OQ-1 through OQ-5 to Bridge before first authored dialogue is committed.*

*- Nova*
