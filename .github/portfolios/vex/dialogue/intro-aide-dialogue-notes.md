# Authoring Notes — `intro-aide-dialogue.json`

**File:** `.github/portfolios/vex/dialogue/intro-aide-dialogue.json`
**Author:** Vex
**Date:** 2026-05-03
**Arc:** Career Arc / `quest-first-bill` (tutorial-adjacent Setup beat)
**NPC:** Petra Solis (`petra-solis`) — aide to Majority Whip Audrey Vance

---

## Premise

The player's first week in Washington. Petra Solis, a senior aide to Majority Whip Audrey Vance, approaches under the guise of "orienting" new arrivals. The real purpose: the Whip is sizing up the new senator before deciding how much calendar and political resource to extend.

This beat is the tutorial surface for the faction mechanic. It introduces the Reform Bloc / Establishment Wing tension in a low-stakes social moment — before the player has a bill on the floor, before they've burned any bridges. The lesson: every corridor conversation in Washington is a transaction, and the aide is the transaction's first chapter.

---

## Narrative Structure

Diamond structure (branch wide at the opener, converge at `faction-reveal`, branch again at `faction-choice`, resolve at `exit`).

```
open → open-b [CHOICE POINT 1]
           ├─ opt-direct        → read-room           → faction-reveal
           ├─ opt-push          → read-room-guarded   → faction-reveal
           ├─ opt-defer         → read-room-soft      → faction-reveal
           └─ opt-savvy (locked)→ read-room-impressed → faction-reveal

faction-reveal → faction-choice [CHOICE POINT 2]
                     ├─ opt-reform          → petra-align-reform    → exit
                     ├─ opt-neutral         → petra-neutral → exit-cold → exit
                     └─ opt-established (locked) → petra-align-bloc-warned → exit-cold → exit
```

Total nodes: 13 (within the 8–15 target).
Choice points: 2 (within the 2–4 range).

---

## Voice Notes — Petra Solis

**Archetype:** Shadow Power (`shadow-power`). She presents options, never directives. She reads people as a professional discipline. Her sentences are short and declarative — she controls the rhythm of the conversation. She doesn't ask questions she doesn't already know the answer to.

**Not:** warm, breezy, intimidating, or overtly political. She's opaque by habit, not by effort.

**Sample tonal reference from GDD §12.3.2:**
> *"There are two versions of this conversation. You've only heard one of them."*

The line "We'll be in touch, Senator. Everyone is." is intentionally unsettling in its banality — it's the Shadow Power closing note: you are being watched, but so is everyone, which somehow makes it worse.

---

## Choice Point 1 — Tone Read (`open-b`)

Tests what kind of player this is before the world has started to shape them.

| Option | Tone | What it signals to Petra |
|---|---|---|
| `opt-direct` | Diplomatic — curious without committing | Measured; worth watching |
| `opt-push` | Aggressive — cuts the pretext immediately | Useful, possibly abrasive |
| `opt-defer` | Naive / cautious — takes the courtesy at face value | Inexperienced; low-risk |
| `opt-savvy` *(Connections ≥ 3)* | Shows knowledge of her actual role | She's been researched; recalibrates upward |

All four paths converge at `faction-reveal` with no mechanical delta at this stage. The tone of the `read-room-*` response lines varies (see node notes below) but produces equal narrative outcomes. This is deliberate: **the first choice is characterization, not optimization**. Players who re-read the exchange after the playthrough should feel it was true to their character, not gameable.

**`opt-savvy` (locked):** Requires Connections 3. This is a low gate — early, achievable, but not the default. The label content ("You're her field reader, not her scheduler") references a real thing only a connected senator would know. The failure hint is written from the player's perspective: "You haven't mapped the Capitol yet." Not system-speak.

---

## Choice Point 2 — Faction Signal (`faction-choice`)

This is the first faction-affecting decision in the game. The mechanic is introduced here without explanation — the game trusts the player to read the stakes from Petra's framing.

| Option | Tone | Faction Delta | Relationship Delta | Flag |
|---|---|---|---|---|
| `opt-reform` | Diplomatic / idealist | Reform Bloc +8 | — | — |
| `opt-neutral` | Pragmatic / cautious | — | — | — |
| `opt-established` *(Reform Bloc ≥ 20, locked)* | Bold / overreaching | Reform Bloc +12 | Petra −3 | `aide-intro-flagged-reform: true` |

**`opt-established` design intent:** Only available if the player has already built some Reform Bloc standing (20+) before this quest triggers — possible if they acted early in the game through other events. Invoking Elbe's name to the Whip's aide is a bold play that signals strong Reform Bloc alignment and slightly damages the relationship with Petra (she doesn't like surprises). The `aide-intro-flagged-reform` flag is available for future events — the Whip has been told this senator is in Elbe's orbit before making the introductory handshake.

**`opt-neutral` design intent:** This is the "I'm being careful" play. It produces no faction delta but no negative consequence either. Petra's response ("The undecided don't stay valuable for long") is a gentle warning, not a punishment. The game acknowledges the choice is valid without endorsing it as optimal.

---

## Faction Standing Effects — Intended

These are *authoring intent*, not finalized numbers. Numbers should be tuned against the faction-standing range Nova/Sol define when FactionSystem ships.

| Trigger | Faction | Delta intent |
|---|---|---|
| `opt-reform` → `petra-align-reform` | Reform Bloc | +8 — moderate positive signal |
| `opt-established` → `petra-align-bloc-warned` | Reform Bloc | +12 — strong positive; player is paying a relationship cost |

**No Establishment Wing effect is authored in this tree.** The Establishment Wing is the *un-named* faction at this moment — it watches but does not yet react. A follow-up tree with Whip Vance directly should be the moment Establishment standing is established. This tree leaves that space open.

---

## New NPC: Petra Solis

**Status:** New character — not in GDD §12.3.4 named seed list.

**Proposed character entry:**

| Field | Value |
|---|---|
| NPC ID | `petra-solis` |
| Full name | Petra Solis |
| Archetype | Shadow Power |
| Role | Senior aide, Office of the Majority Whip |
| State | IL (Vance's delegation) |
| Personality | Opportunist with pragmatist tendencies |
| Motivation | Institutional continuity; the Whip's visibility |
| Narrative function | Recurring information relay; faction conduit; will appear in Vance-adjacent beats |

**TODO(vex): Jesse to create a wiki entry for Petra Solis in `docs/wiki/`. She should appear in future Vance negotiation trees as a recurring gatekeeper.**

---

## Schema Questions for Sol (OQ-A through OQ-D)

### OQ-A — `faction-standing` effect kind (BLOCKS shipping)

The `DialogueEffect` union in `src/types/dialogue.ts` §3.4 does not include a `faction-standing` write effect. This tree uses:

```json
{ "kind": "faction-standing", "factionId": "reform-bloc", "delta": 8 }
```

This is a proposed new kind. **Options:**

1. Add `{ kind: 'faction-standing'; factionId: string; delta: number }` to `DialogueEffect` — clean and self-documenting.
2. Route through the legacy `group_loyalty` effect (`{ type: "group_loyalty", groupId: "reform-bloc", value: 8 }`) — but faction ≠ group, and `group_loyalty` affects population group loyalty, not faction standing. Semantically incorrect.
3. Use `set-flag` as a proxy and have FactionSystem read the flag on its next tick — loses the delta granularity.

**Recommendation:** Option 1. This is a fundamental content authoring need for all M2 faction-dialogue trees.

**Blocks shipping this tree:** Yes.

---

### OQ-B — Faction ID namespace (coordination with Nova)

Faction IDs `reform-bloc` and `establishment-wing` are authoring placeholders. Nova's FactionSystem spec defines the canonical faction ID namespace. All authored content should align once that spec ships.

**TODO(vex): When Nova's faction IDs are finalized, search `.github/portfolios/vex/` for `reform-bloc` and `establishment-wing` and update before content is pulled into `src/data/`.**

---

### OQ-C — `push-news` template registry (coordination with Sol — from Vex review OQ-6/C7)

Two `push-news` effects use the convention `dialogue.<tree-id>.<outcome>`:
- `dialogue.intro-aide-greeting.reform-lean`
- `dialogue.intro-aide-greeting.elbe-named`

These template IDs need entries in the news template registry. **Sol: please confirm the registry file path and whether the proposed id convention is adopted.** Until confirmed, these `push-news` effects will fail silently at runtime.

**Proposed template text (for Sol to wire):**

| Template ID | Suggested text |
|---|---|
| `dialogue.intro-aide-greeting.reform-lean` | `"{pc.name} Signals Reform Bloc Interest in Early Capitol Conversations"` |
| `dialogue.intro-aide-greeting.elbe-named` | `"{pc.name} Seen in Early Contact with Elbe — Reform Bloc Watches"` |

---

### OQ-D — `quest-first-bill` stage compatibility

This tree advances `quest-first-bill` to stages `"setup"` and `"faction-signal"`. These stage identifiers do not exist in the current `starter-quests.json` quest definition for `quest-first-bill`. The tree's `advance-quest` effects will fail gracefully if the stage is undefined, but they are non-functional until the quest schema is updated.

**Options:**
1. Update `quest-first-bill` in `starter-quests.json` to include these stages (Sol/Nova to decide structure).
2. Create a new quest `quest-find-your-footing` as the dedicated arc for the aide intro beat, with these stages defined explicitly.

**Recommendation:** Option 2. `quest-first-bill` is an objective-only quest ("Pass any bill") — it doesn't have narrative stages. A dedicated intro arc quest is cleaner. **TODO(vex): Author `quest-find-your-footing` quest definition once Sol confirms the stage-based quest schema.**

---

## Line Length Audit

| Node | Text word count | Budget |
|---|---|---|
| `open` | 12 (with `{pc.name}` resolved as `Reyes`) | ≤ 30 ✓ |
| `open-b` | 14 | ≤ 30 ✓ |
| `read-room` | 17 | ≤ 30 ✓ |
| `read-room-guarded` | 13 | ≤ 30 ✓ |
| `read-room-soft` | 17 | ≤ 30 ✓ |
| `read-room-impressed` | 19 | ≤ 30 ✓ |
| `faction-reveal` | 15 | ≤ 30 ✓ |
| `faction-choice` | 18 | ≤ 30 ✓ |
| `petra-align-reform` | 19 | ≤ 30 ✓ |
| `petra-neutral` | 12 | ≤ 30 ✓ |
| `petra-align-bloc-warned` | 14 | ≤ 30 ✓ |
| `exit-cold` | 7 | ≤ 30 ✓ |
| `exit` (narrator) | 8 | ≤ 40 ✓ |

All option labels 6–13 words (target 4–12, hard cap 18) — all within cap. ✓

---

---

## Content Wave 2 — 2026-05-03

### What was authored

**`campaign-manager-intro.json`** — Marcus Webb, campaign manager. 12 nodes, 2 choice points.

| Node range | Description |
|---|---|
| `open` → `open-b` | Cold introduction; Webb recites the player's polling baseline without ceremony |
| Choice Point 1 (`open-b`) | Player reacts to being assessed as a polling variable: play the numbers (`response-numbers`), push back on vision (`response-vision`), or show they read the room (`response-test`, Strategy ≥ 3 gate) |
| `faction-warning` → `warning-detail` | Marcus pivots to Corporate Lobby warning — chosen because a cynical campaign manager would prioritise the predictable, transactional threat over ideological or grassroots factions |
| Choice Point 2 (`warning-detail`) | Player signals Corporate Lobby stance: closed door / defer / leverage — each sets `webb-lobby-stance` flag for future events to observe |
| `briefing` → `exit` | Marcus hands over the briefing document; `marcus_intro_complete` flag set on `briefing` node `onEnter` |

**Structural decisions:**
- No ideology-drift effects. Flag effects only (OQ-2 unresolved).
- `webb-lobby-stance` is a new flag with three values (`closed`, `deferred`, `leverage`) — authoring intent is that Corporate Lobby events in M2+ branch on this flag. Sol to confirm whether string-valued flags are supported or whether three boolean flags are preferred.
- voiceTag `machine-boss` used as closest fit. New open question raised (OQ-E, below).
- Choice Point 1 produces no mechanical delta (characterization only, same rationale as `opt-savvy` in the Petra tree).
- Choice Point 2 produces flag deltas only — no faction standing because `corporate-lobby` faction ID is unconfirmed and OQ-2 is unresolved.

---

**`first-bill-dialogue.json`** — Floor aide, procedural. 7 nodes, 1 choice point.

| Node | Description |
|---|---|
| `open` | Aide catches the player; slightly apologetic tone |
| `committee-intro` | Concise committee process explanation (one step per sentence) |
| `time-pressure` + choice | Presents the calendar crunch; branches to fast-track or patient route |
| `fast-track-path` | Aide complies uneasily; signals political cost was noted |
| `patient-path` | Aide approves bureaucratically; rewards clean paperwork |
| `exit` | Sets `first_bill_introduced` flag; narrator close |

**Structural decisions:**
- PC cost on fast-track option (`costs: { pc: 20 }`) is an authoring placeholder. New open question raised (OQ-G, below).
- `first_bill_fast_tracked` flag set alongside `first_bill_introduced` on the fast-track path — allows downstream events to differentiate players who burned resources versus those who were patient.
- `end-dialogue` and `first_bill_introduced` flag both placed on `exit` node `onEnter`. Sol to confirm whether multiple effects on a single `onEnter` array are evaluated in order or in parallel (OQ-H, below).

---

### New open questions (Wave 2)

#### OQ-E — `campaign-fixer` voiceTag (coordination with Sol)

Marcus Webb uses `voiceTag: "machine-boss"` as the closest available archetype. He is not a power broker — he's a campaign operative. The Machine Boss archetype reads as institutional (Whip, party establishment), while Marcus is an outside contractor hired for this campaign.

**Question:** Is a `"campaign-fixer"` voiceTag warranted, or is `"machine-boss"` the intended general-purpose transactional archetype? If a new voiceTag is needed, what are the voice/cadence specs?

**Blocks shipping:** No — voiceTag is advisory for audio, no-op for text. Tree is readable without it.

---

#### OQ-F — voiceTag optional for non-seed NPCs (coordination with Sol)

`first-bill-dialogue.json` omits `voiceTag` entirely. The dialogue-system.md §2.1 lists voiceTag as optional at the tree level. Confirming: is a tree without voiceTag valid, or does it default to a fallback archetype?

**Blocks shipping:** No — can author a placeholder string if required.

---

#### OQ-G — PC cost calibration for fast-track option (coordination with Sol / balance)

`first-bill-dialogue.json` fast-track option uses `costs: { pc: 20 }`. This is an authoring estimate. The PC economy range for M2 is not yet documented.

**Question:** What is the intended PC budget range for a fresh senator at first-bill? Is 20 PC the right order of magnitude for "accelerating a committee schedule"?

**Blocks shipping:** No — placeholder is non-functional until costs are evaluated; tree degrades gracefully.

---

#### OQ-H — Multiple effects in `onEnter` evaluation order (coordination with Sol)

`first-bill-dialogue.json` exit node uses:

```json
"onEnter": [
  { "kind": "set-flag", "flag": "first_bill_introduced", "value": true },
  { "kind": "end-dialogue" }
]
```

**Question:** Are `onEnter` effects evaluated in array order? Specifically: does `end-dialogue` fire after `set-flag` completes, or can they race? If `end-dialogue` tears down state before `set-flag` commits, the flag will be lost on save.

**Blocks shipping:** Potentially yes — if effects are unordered, `first_bill_introduced` may not persist. If ordered, no issue.

---

- Vex

---

## Content Wave 3 — 2026-05-03

### What was authored

**`committee-chair-pressure.json`** — Helen Donovan (Committee Chair). 10 nodes, 2 choice points.

| Node range | Description |
|---|---|
| `open` → `background` | Chair sets the tempo; player's bill has been in committee eleven days |
| Choice Point 1 (`background`) | How the player reads the subtext: diplomatic acknowledgment (`read-diplomatic`), direct demand for problems (`read-direct`), or subtext-naming (`read-challenge`, Integrity ≥ 4 gate) |
| `read-*` → `leverage` | Chair converges all three reads to the same proposition: a floor-favour exchange |
| Choice Point 2 (`leverage`) | Player strategic stance: accept the deal (`path-accept`), refuse it (`path-resist`, Connections ≥ 5 gate), or defer for forty-eight hours (`path-defer`) |
| `path-*` → `exit` | Chair closes; narrator exit; `committee-chair-meeting-complete` flag set |

**Structural decisions:**
- No faction effects. Branch-specific flags only (`committee-chair-debt`, `committee-chair-refused`, `committee-chair-pending`).
- `opt-challenge` gate (Integrity ≥ 4): characterization option — naming the subtext of the meeting. Convergence to `leverage` is identical regardless; this is a tone beat, not an outcome gate.
- `opt-resist` gate (Connections ≥ 5): strategic option — walking away from the Chair's ask. Higher bar than `opt-challenge` because walking away is a consequential choice, not just a read.
- `senator-harlow` referenced in `path-accept` as the name the Chair needs on the floor. Placeholder NPC name — open question raised (OQ-W3-C).

---

**`media-scrum-reaction.json`** — Jordan Cross (TV correspondent). 12 nodes, 2 choice points.

| Node range | Description |
|---|---|
| `open` | Narrator establishes the scrum; Jordan Cross at the front |
| `first-question` + Choice Point 1 | Cross asks the post-vote coalition question; player chooses: direct answer, pivot, no comment, or prepared deflection (flag-gated: `media_training_complete`, hidden if fails) |
| `response-*` → `gotcha-setup` | Cross fires back on all four paths (each tailored to the choice); `gotcha-setup` adds a beat before the sourced accusation |
| `gotcha` + Choice Point 2 | Cross produces a two-source count figure; player chooses: deny, partial acknowledgment, or own the count with a correction (Integrity ≥ 5 gate) |
| `exit-hostile` / `exit-mixed` / `exit-clean` → `exit` | Cross closes with three distinct registers; narrator exit; `media-scrum-complete` flag set |

**Structural decisions:**
- No faction effects. Branch-specific flags (`media-count-denied`, `media-count-partial`, `media-count-confirmed`) plus universal `media-scrum-complete`.
- `opt-prepared` is `isHidden: true` — not visible-greyed; disappears entirely if the flag is unset. Rationale: "no comment" is already the safe player-facing choice; a visible locked fourth option creates noise in a fast-moving scrum context.
- `opt-own-it` is `isHidden: false` — visible-greyed if Integrity < 5. Rationale: the player should know this option exists and understand why they can't deliver it cleanly.
- Count figure in `gotcha` ("down by six") is generic enough to fire across bill types. Not ideology-specific.

---

### Unresolved assumptions (Wave 3)

#### OQ-W3-A — `press-interactions` arcId (coordination with Sol)

`media-scrum-reaction.json` uses `arcId: "press-interactions"` as a placeholder. There is no confirmed press arc in the current quest schema. This tree may fire as a standalone trigger (post-vote event) rather than a named arc beat.

**Question:** Is there a press arc planned for M2, or should press interaction trees carry no arcId and be triggered by the event system directly?

**Blocks shipping:** No — arcId is advisory for quest tracking; tree fires via event trigger regardless.

---

#### OQ-W3-B — Integrity ≥ 5 threshold on `opt-own-it` (balance)

The "own the count" option in `media-scrum-reaction.json` is gated at Integrity ≥ 5. This is an authoring estimate. The stat range for senators at the point this event fires (post-first-vote) is not documented.

**Question:** Is 5 the right Integrity threshold for "correcting the record on camera"? If the Integrity range at mid-game is 1–8 rather than 1–10, a gate of 5 may be too restrictive.

**Blocks shipping:** No — gate degrades gracefully to greyed option.

---

#### OQ-W3-C — `senator-harlow` placeholder NPC (coordination with Jesse)

`committee-chair-pressure.json` path-accept references "Senator Harlow" as the name the Chair needs on the floor. This is a placeholder name.

**Question:** Should Harlow become a named NPC entry (recurring), or is a generic placeholder ("a colleague in the Agriculture caucus") more appropriate for a first-pass authoring beat?

**Blocks shipping:** No — the name-drop is non-functional at runtime; it's a text placeholder.

---

#### OQ-W3-D — `media_training_complete` flag source (coordination with Vex / authoring)

`media-scrum-reaction.json` gates `opt-prepared` on `media_training_complete`. This flag implies an off-screen media training event. No such event is authored yet.

**Question:** Should a `media-training` dialogue beat be authored as a prerequisite event? Or should this flag be set by a background mechanic (e.g., spending AP in the player's schedule)?

**Blocks shipping:** No — hidden option simply never appears until the flag is set; graceful degradation.

---

- Vex

---

## Content Wave 4 — 2026-05-03

### What was authored

**`whip-count-warning.json`** — Petra Solis (aide to Majority Whip Audrey Vance). 10 nodes, 2 choice points.

| Node range | Description |
|---|---|
| `open` | Narrator establishes the scene: ambush corridor meeting, no appointment |
| `opening-line` | Petra delivers the intelligence cold: the player's count is wrong |
| `count-detail` + Choice Point 1 | Petra breaks down the soft count (4 votes, 3 firm flips); player reacts: absorb the intelligence (`plan-ask`), challenge the count (`petra-stands-firm` → `plan-ask`), or probe for the specific defector (`petra-partial` → `plan-ask`, Connections ≥ 3 gate) |
| `petra-stands-firm` | Petra does not move: her count is current, theirs isn't |
| `petra-partial` | Petra names one senator (Lim) as proof of the Whip's intelligence quality |
| `plan-ask` + Choice Point 2 | Petra relays the Whip's question: what is the player doing about the four before Thursday? Player declares: work the room themselves (`exit-working`), ask the Whip to apply direct pressure (`exit-escalated`), or dismiss it as fluctuation (`exit-cold`) |
| `exit-working` / `exit-escalated` / `exit-cold` | Petra's three-register close (cooperative / conditional / neutral) |
| `exit` | Narrator close; `whip-count-warning-complete` flag set; `end-dialogue` |

**Structural decisions:**
- No faction effects. Branch-specific flags only: `whip-warned-working`, `whip-warned-escalated`, `whip-warned-dismissed`. Universal completion flag: `whip-count-warning-complete`.
- All three branch flags are set via `effects` on the option, not on the destination node `onEnter` — consistent with the flag placement pattern in `committee-chair-pressure.json`.
- `opt-source` (Connections ≥ 3) is `isHidden: false` — visible-greyed, consistent with all stat-gated options in the authored tree set. Only flag-gated options use `isHidden: true`.
- Choice Point 1 is a characterization beat (all three paths converge at `plan-ask` with no mechanical delta). Choice Point 2 is the consequential decision (flags are observable by downstream floor-vote event).
- Petra's voice is held consistent with `intro-aide-dialogue.json`: short declarative sentences, professional opacity, controls the rhythm of the meeting.
- `senator-lim` in `petra-partial` is a new placeholder NPC, same class as `senator-harlow` in OQ-W3-C. Raises OQ-W4-A (below).
- `"thursday"` in `plan-ask` text is a procedural time placeholder. Raises OQ-W4-B (below).
- `arcId: "quest-first-bill"` carried forward from `committee-chair-pressure.json`. Same unresolved arc-staging assumption applies (see OQ-D in Wave 1 section).

---

### Unresolved assumptions (Wave 4)

#### OQ-W4-A — `senator-lim` placeholder NPC (coordination with Jesse)

`whip-count-warning.json` `petra-partial` node names "Senator Lim" as the identified defector. This is a display-text placeholder, same class as `senator-harlow` in OQ-W3-C.

**Question:** Should Lim become a full named NPC entry (recurring), a one-line character stub, or a swappable generic resolved at runtime from a "wavering senator" pool?

**Blocks shipping:** No — name-drop is non-functional at runtime. A runtime pool would improve replayability.

---

#### OQ-W4-B — Relative time references in dialogue text (coordination with Sol)

`plan-ask` text reads: "The Whip wants to know what you're doing about the four **before Thursday**." This hardcodes a day-of-week reference that may be wrong depending on where in the session calendar this beat fires.

**Options:**
1. Replace with a game-calendar token (e.g., `{session.next_vote_day}`) if the engine supports dialogue string interpolation beyond `{pc.name}`.
2. Replace with a session-relative phrase ("before the floor schedule locks") that is always accurate — this phrase already appears in `opening-line` and is tonally consistent with Petra's voice.
3. Keep "Thursday" as a flavour placeholder and accept the occasional inaccuracy.

**Recommendation:** Option 2. Consistent with Petra's voice; correct on all trigger conditions.

**Blocks shipping:** No — "Thursday" degrades to a slightly wrong day-reference at worst.

---

#### OQ-W4-C — `whip-warned-*` flags consumer (coordination with Sol / Nova)

The three branch flags (`whip-warned-working`, `whip-warned-escalated`, `whip-warned-dismissed`) are authored with the intent that a floor-vote outcome event reads them to shade the result (e.g., `whip-warned-dismissed` may carry a negative modifier). If no such event exists yet, the flags are inert.

**Question:** Is a floor-vote outcome event or whip-count resolution beat planned for M2? Which stance should produce a mechanical delta, and should `whip-warned-dismissed` carry a negative outcome modifier?

**Blocks shipping:** No — flags set silently; no runtime error if no consumer exists yet.

---

- Vex
