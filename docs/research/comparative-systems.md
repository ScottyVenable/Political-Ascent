# Research: Comparative Systems

**References:** Tropico 6, Democracy 4, Suzerain, Frostpunk, Stellaris.
**Focus for us:** Cross-cutting patterns that recur across political / management / grand strategy titles.

---

## 1. Pattern: Decision-cadence

| Title | Primary decision cadence |
|---|---|
| Democracy 4 | Quarterly turn; policies edited, effects ripple over years |
| Suzerain | Per-scene choice; narrative-paced |
| Tropico 6 | Real-time with pause; edicts and elections punctuate |
| Frostpunk | Real-time with pause; law book is turn-structured |
| Stellaris | Real-time with pause; edicts run in parallel with everything else |

**Lesson for us:** Mix cadences. The **weekly tick** is our ambient rhythm (Tropico/Stellaris-style). **Bills** progress on a per-stage cadence over multiple weeks (Democracy 4-style). **Key scenes** (televised debates, first-100-days speeches) are pause-blocking narrative beats (Suzerain-style). Do not collapse everything to one cadence.

---

## 2. Pattern: Faction tension is the engine

Every title in this set derives drama from **incompatible factions with veto power**. Democracy 4 lets factions flip into *terror cells*; Tropico factions will coup; Frostpunk's Order vs. Faith split ends the game. The common rule:

> Factions must be **impossible to simultaneously satisfy**. The player's job is not to please everyone; it is to choose who loses.

**Lesson for us:** In the GDD we already say "no correct outcome". Enforce it mechanically:
- No bill should have *only* positive modifiers across all groups. Every passage must cost somebody something.
- Content review checklist for every bill template: does at least one major group dislike it?

---

## 3. Pattern: Crisis cadence (Frostpunk)

Frostpunk ships a **planned storm** — a climate event players know is coming and can see the countdown for. It reframes all early-game decisions: "Am I ready for the storm?"

**Lesson for us:** Every scenario should have a **visible milestone clock** (election day, supreme court ruling, recession, midterms). Players plan *toward* it. Dashboard should display the next major milestone at all times.

---

## 4. Pattern: Branching narrative embedded in simulation (Suzerain)

Suzerain uses a **constitutional crisis** as a slow arc: small decisions early (sign this law? sack this general?) feed into one big catastrophe or one big triumph near the end. The player cannot see the branching, but the game is tracking dozens of flags.

**Lesson for us:** Our **flag system** in `world.flags` is exactly this primitive. Under-use it at your peril. Every major decision should set 1–3 flags that later events read. This is cheaper than a full branching quest graph and produces comparable narrative payoff.

---

## 5. Pattern: Approval rating as lifeline (Tropico, Democracy 4)

- Approval is the **primary resource you cannot deficit-spend**. Low approval = revolution / electoral defeat.
- Approval is broken down into **faction approvals**, each tracked independently. National approval is a weighted sum.
- Public policies are *always* visible on the "Why do they like me?" tooltip. Transparency is the point.

**Lesson for us:** Our approval must:
- Be **per-group** under the hood, aggregated visually.
- Show a **"why" tooltip** listing the top 5 modifiers with weight and direction (e.g., "+4.2 from Middle Class Tax Cut", "−6.1 from Healthcare Reform").
- Never be a black box.

---

## 6. Pattern: Tooltips are the documentation (Stellaris)

Stellaris ships a dense web of nested tooltips. Hover a stat, get a breakdown; hover a modifier in that breakdown, get *its* sources. This replaces a manual.

**Lesson for us:** All numeric values in the UI must be **hoverable** with a breakdown. Non-negotiable. Component rule: `<StatValue>` always accepts an optional `breakdown: Modifier[]` prop and renders a tooltip.

---

## 7. Pattern: Edicts / quick-buttons (Tropico, Stellaris)

Both games give the player a small set of **always-available toggle actions** that cost a resource and temporarily shift modifiers (martial law, double shifts, propaganda campaign). They give the player things to *do* between major decisions.

**Lesson for us:** Our **Card system** is the edict surface. Starter decks should include 2–3 always-useful edict-style cards (Press Conference, Rally Base, Quiet Week) so a player is never out of meaningful actions even when no event is firing.

---

## 8. Pattern: End-of-session legacy screen (Tropico, CK3, Democracy 4)

Every title closes a playthrough with a **legacy screen** summarising choices, milestones, and a flavor verdict ("Beloved Reformer", "Iron Fist", "Forgotten Compromiser"). It is the single biggest driver of "one more run".

**Lesson for us:** Ship a legacy screen in v0.1 even if it is minimal: name, term(s) served, bills passed/failed, scandals survived, final approval rating, final ideology position, and a one-line epitaph drawn from a small JSON pool keyed to flags.

---

## 9. Suggested next steps

- Convert sections 2, 5, and 6 into **acceptance criteria** added to the GDD and ROADMAP Milestone 18 (Polish).
- Add a **"Why?" tooltip component** to the component roadmap (Milestone 2 or 7).
- Reserve a `starter-deck.json` slot for 3 edict-style always-useful cards (Milestone 12).
- Add **"Legacy Screen"** as a new milestone item for v0.1 or v0.2.

---

## 10. References

- Positech Games blog (Democracy 4 design notes).
- 11 bit studios GDC talks on Frostpunk.
- Paradox forum dev diaries (Stellaris).
- Torpor Games Suzerain dev blog.
