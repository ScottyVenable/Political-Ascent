# Legislation Overhaul Plan

**Status:** Draft 1 — 2026-05-01
**Owner:** Lead Director (vision) + active agent (delivery)
**Tracking issue:** PR comment thread on `copilot/create-game-roadmap-and-test-tasks`
**Companion doc:** [`docs/DEVELOPMENT_ROADMAP.md`](./DEVELOPMENT_ROADMAP.md)

---

## 1. Why

Drafting a bill today is a single screen with module toggles and a forecast.
That's a fine MVP, but it doesn't capture the *experience* of what writing
legislation should feel like in a political career sim:

- **It should feel like writing a document, not toggling checkboxes.** The
  player arranges riders in an order that matters, names the bill, picks its
  legal vehicle, and sees prose that reads like a one-pager.
- **It should feel social.** Real bills get drafted with aides whispering and
  potential co-sponsors negotiating their price. The player should hear those
  voices in the UX before they ever push "Introduce".
- **The mechanical consequences should be explicit before commit.** Right now
  a player toggles a module and gets a delta chip; they should be able to see
  a full **if-passes / if-fails** outcome breakdown on a confirmation step
  before they spend the political capital.
- **The legislature is bicameral.** A bill the player introduces in one
  chamber should travel to the other (sometimes successfully, sometimes
  amended, sometimes dead) — and the chamber leadership in *each* chamber
  should be a force the player has to read and respond to.

This document is the design brief. It is **not** a commitment to deliver every
phase in one PR; the phasing section sequences the work into landable slices.

---

## 2. Player-facing flow (target end state)

The drafting flow becomes a **four-step wizard**, each step a panel with its
own state, all sharing the synthesised bill object the player is building.

### Step 1 — Identity (the legal vehicle)

| Field | UX | Mechanical effect |
|---|---|---|
| **Title** | Free-text input. Defaults to the template's name. | Surface only; persisted on the bill. |
| **Type** | Segmented control: *Resolution* / *Act* / *Constitutional Amendment* / *Appropriations*. | Modifier on opposition + per-stage PC cost (see §3.1). |
| **Stated purpose** | One-line free-text summary the player can edit. | Renders into the bill text preview and into the breakdown step. |
| **Sponsor** | Implicit — the player. Future: select a co-sponsor as primary if the player is in the minority and needs to launder the bill. | None for now. |

### Step 2 — Drafting (the modules)

The current module panel, plus three upgrades:

1. **Drag-to-reorder** active modules. The order is real — the bill text
   preview honours it ("The Act establishes X. Further, the Act raises Y.
   Further still, the Act sunsets Z.").
2. **Aide Advisory card** at the top of the right rail. Reads the current
   synthesised state and produces one contextual nudge — e.g.:
     - "Opposition above 70 — a Sunset Clause buys you Senate moderates."
     - "Budget impact below −$30B — you'll lose your fiscal-conservative caucus members. Consider a revenue offset."
     - "No constituency-aligned modules attached. The bill reads as
       generic; cohorts may not see themselves in it."
3. **Module categories** filter row above the module grid: Fiscal / Climate /
   Labor / Procedural / Regional / Regulatory. Same filter chip style as the
   Congress panel.

### Step 3 — Coalition (talk to co-sponsors and aides)

A new screen built on top of `worldStore.congress`:

- Ranks Senate (or House, when bicameral routing exists) members by predicted
  alignment with the synthesised bill.
- Each member card shows: party, ideology label, baseline alignment %, and a
  one-line **price** ("Wants the Sunset Clause stripped" / "Wants their
  state's farmers exempted" / "Will sign on free — they ran on this").
- Click-to-pitch: spends 1 AP + a small PC fee, returns a probability-of-yes
  outcome. On success the member becomes a `cosponsor` on the synthesised
  bill, raises the floor vote estimate by their relationship-weighted
  contribution, and may *demand* a module change (visualised as a yellow
  ribbon on the affected module saying *Senator X wants this stripped*).
- Below the member list, an **Aide Advisory** rail lists the chief-of-staff's
  read on the coalition: who else to call, who is bluffing, who'll defect on
  the floor.

### Step 4 — Mechanical Breakdown (the commit step)

A read-only summary screen the player must explicitly accept. Two columns:

- **If passed**, list every effect the bill applies on enactment:
  *"−$30B/yr deficit"*, *"+8 Working-class happiness"*, *"flag `mediaProtections=true` set"*, etc., translated into plain English by `describeEffect()`.
- **If failed**, list the consequences of a defeat: PC sunk, opposition gained
  on related cohorts, precedent set ("hard to retry this bill within 12
  weeks"), reputation impact (if applicable).

Plus a final summary tile: bill type, total modules, opposition score,
estimated passage chance, sponsor + co-sponsors. A single primary button
**Introduce Bill** + a secondary **Back to Drafting**.

### Out-of-wizard: bicameral routing & chamber-leader nudges

Once a bill enters the legislative pipeline:

1. The chamber the player **does not** sit in receives the bill once it
   passes the player's chamber. That chamber runs its own `committee →
   floor_debate → vote` clock against its own median ideology and may amend
   (subset of modules removed/added based on its dominant cohort).
2. **Chamber leadership** (Senate Majority/Minority Leader, Speaker, Whip)
   surface as recurring NPC voices. Each week a bill is in their chamber
   they may push a **Whip Nudge** modal: *"The Speaker is calling. He wants
   you to vote yes on HR-218 — your party needs the unity. Decline at
   −relationship; accept at +PC and a small base-cohort hit if your base
   hates the bill."* This is a Card-system extension, not a new system.

---

## 3. Mechanics

### 3.1 Bill Type modifiers

| Type | Opposition adj. | PC cost adj. (per stage) | Stage durations | Notes |
|---|---|---|---|---|
| **Resolution** | −15 | ×0.5 | Halved | Non-binding; cheap statement bills. Limited effect set (cannot apply economy/world effects, only rhetoric/cohort sentiment). |
| **Act** | 0 | ×1.0 | Standard | Default. The current behaviour. |
| **Constitutional Amendment** | +30 | ×3.0 | ×2 | Requires 2/3 in both chambers in the engine; opposition floor of 50. |
| **Appropriations** | +5 | ×1.0 | Standard | Must include at least one fiscal module or it is rejected at draft validation. |

These modifiers stack on top of the base template numbers. Implementation
note: store `type` on the synthesised `BillTemplate` (new optional field) so
existing templates default to *Act* without a save-format break.

### 3.2 Module ordering

Order is presentation-only for the bill text, but the engine *also* reads
the order: when two modules touch the same effect target, the **later**
module wins. This gives the player a meaningful authoring choice — "I want
the sunset clause to apply to the tax raise" is expressed by putting the
sunset module *after* the tax module.

Implementation: replace the current `Set<string>` of active module ids with
an ordered `string[]`.

### 3.3 Aide Advisory rules

A small pure function `selectAideAdvisory(synthesised)` returns the highest-
priority advisory string from a static rules table:

```ts
type AideRule = { test: (b: SynthesisedBill) => boolean; priority: number; advice: string };
```

Top-priority rules cover: opposition >70, budget impact <−30, missing
constituency-aligned module, type=Amendment without 2/3 coalition, etc. The
first rule whose `test` returns true is shown. Returns `null` when nothing
needs saying — and the panel hides instead of showing a fake "you're doing
great".

Pure function ⇒ unit-testable.

---

## 4. Phasing

The full plan above is multiple PRs. This document marks each phase with a
**P1 / P2 / P3** label so the team can ship a slice that's complete on its
own terms.

### P1 (this PR) — Identity, Aide, Reordering, Breakdown

- Add `type` field to `BillTemplate` (optional, defaults to `act`).
- Bill Type segmented control on the existing draft screen.
- Aide Advisory card with a small rules table.
- Drag-to-reorder active modules (HTML5 DnD on the active-rider list in the
  right rail; the toggleable grid on the left stays as is).
- New **Mechanical Breakdown** confirmation panel rendered before the bill
  is actually drafted (it replaces the direct "Introduce" submit). Two-column
  if-passes / if-fails layout. Player must click *Confirm & Introduce* to
  call `LegislationSystem.draftBill`.
- Unit tests: aide rules, type modifiers, reorder behaviour.
- Playwright: capture Identity controls + Breakdown panel.

### P2 — Coalition step

- Pull `congress.senate` (and later `.house`) into a sortable list scored
  against the current synthesised bill.
- Co-sponsor pitch interaction (cost + outcome).
- Chief-of-staff coalition-read panel.
- Bill model: persistent `cosponsors[]`, `cosponsorPrices[]`.

### P3 — Bicameral routing + chamber leadership

- Engine: a bill that passes one chamber moves into the other chamber's
  pipeline with its own clock and median ideology.
- New world state: `world.congress.house` populated to parity with `senate`
  (the seed already runs through `CongressSystem` — extend it).
- Chamber leadership data model (Speaker, Majority Leader, Minority Leader,
  Whip) per chamber, stored in the scenario JSON.
- Whip Nudge modal as a one-off card-system event.

### P4 — Polish

- Module categories filter row.
- Drag-and-drop modules from the catalogue grid into a draft "tray" rather
  than toggle-and-reorder.
- Voice-of-the-Speaker NPC dialogue lines surfaced in the bill detail panel
  while the bill is in their chamber.

---

## 5. What this affects

| File | P1 | P2 | P3 | P4 |
|---|---|---|---|---|
| `src/types/legislation.ts` | + `BillType`, optional `type` on `BillTemplate` | + `cosponsorPrices` | + `originatingChamber`, `currentChamber` | — |
| `src/systems/LegislationSystem.ts` | type modifiers in `draftBill`, `estimatePassageChance` | cosponsor scoring | bicameral pipeline | — |
| `src/renderer/components/DraftLegislationScreen.tsx` | type selector + aide card + DnD reorder + breakdown step | coalition step | — | — |
| `src/renderer/panels/LegislationPanel.tsx` | (none — drafting changes are inside the modal) | (passive) | bill cards show "in House" / "in Senate" | — |
| `src/data/legislation/bill-templates.json` | optional `type` field | — | originating chamber | — |
| `src/data/scenarios/<scenario>/congress.json` | — | — | + chamber leaders | — |

---

## 6. Risk register

- **Save format.** Every additive change here uses optional fields with
  sensible defaults. The save migration cost is zero through P3.
- **Difficulty creep.** Coalition + whip nudges add player decisions per
  bill. Tune the AP cost so an active session still ships a couple bills
  per simulated month.
- **UI regression.** The current draft screen is well-tested. The wizard
  step pattern lets us land each phase without rewriting the steps already
  shipped.
- **Bicameral simulation cost.** Two pipelines is roughly 2× the per-tick
  legislative work. Profile in P3 before merging.

---

*Owned by the Lead Director. Edited by the active agent at the end of each
material PR. When the doc and the code disagree, the code is wrong; reopen
this doc, tighten the spec, and re-implement.*
