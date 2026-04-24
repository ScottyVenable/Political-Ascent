# Research: Victoria 3

**Reference:** Victoria 3 — Paradox Development Studio, 2022
**Focus for us:** Population simulation, interest groups, law-passing lifecycle, political movements, long-horizon "curves" of national trajectory.

---

## 1. Summary

Victoria 3 models a nation as a dense network of **Population Groups (POPs)** with a profession (pop type), a culture, a religion, a wealth bracket, and political leanings. Those POPs organise into **Interest Groups** (Landowners, Industrialists, Intelligentsia, Rural Folk, Armed Forces, Trade Unions, Devout, Petite Bourgeoisie). Interest Groups gain or lose **Clout** from POPs that support them. Clout determines which IGs are in government and which laws are realistically passable.

Laws are proposed, **debated over time** against a rolling success chance that is influenced by IG support vs. opposition. Passing a law nudges society, which reshapes POPs, which shifts IG Clout, which opens or closes new laws. Everything is a long feedback loop — the game is a 100-year curve, not a series of turns.

---

## 2. Relevant mechanics

### 2.1 Pops and stratification
- Each POP has: profession, culture, religion, wealth, political strength, loyalty/radicalism.
- Wealth drives **Standard of Living (SoL)**; SoL decay triggers radicalism; radicalism feeds revolutions and movements.
- POPs move between professions as the economy changes (e.g., peasants become labourers when factories open).

### 2.2 Interest groups
- Finite set of IGs, each with an agenda and a leader (a character with traits/ideology).
- Each IG holds **Clout** (0–100% of national political strength).
- IGs can be *In Government*, *In Opposition*, or *Marginalized*.
- IG leaders can be **Agitators** who oppose the current regime even while their IG is in government.

### 2.3 Laws and enactment
- Laws are grouped into categories: governance, economy, rights, military, etc.
- Enacting a law isn't instantaneous; it has a **weekly progress roll** modified by IG approval/disapproval.
- Setbacks can reset progress. Repeated setbacks fail the law and cost political capital.
- Some laws unlock only if certain IGs are in government or a technology has been researched.

### 2.4 Political movements
- When enough POPs back a cause (e.g., *Universal Suffrage*), a **Political Movement** forms.
- Movements can be *Peaceful* or escalate to *Revolutionary* based on radicalism.
- Governments can attempt to enact the movement's law, suppress it, or ignore it.

### 2.5 Journal entries & events
- Journal entries are **long-running objectives** (multi-year arcs) tied to national situations.
- Events are smaller, triggered by state conditions; they offer 2–4 choices each.

---

## 3. What translates to Political Ascent

| Vic3 concept | Our equivalent | Notes |
|---|---|---|
| POPs | `PopulationGroup` | We use 6–10 aggregated groups for v0.1, not full stratification. Good enough for MVP. |
| Interest Groups | Parties + Factions + Lobbies (future) | For v0.1 we model parties; factions and lobbies are v0.2+ items per ROADMAP. |
| Clout | Party power balance + caucus strength | We already have per-legislator weight; rolling up to faction clout is a natural extension. |
| Law enactment over time | `LegislationSystem` bill lifecycle (draft → committee → floor → vote) | We have this; Vic3 validates the "multi-week progress with modifiers" pacing. |
| Political movements | Radicalism events from `PopulationSystem` | We already drive events from radicalism; treat sustained radicalism as a proto-movement. |
| Journal entries | Quest system (multi-month arcs) | Our quests can host long arcs; add a *National Arc* quest type later. |
| Events with 2–4 choices | `EventEngine` event modals | Direct parallel. Our schema already supports weighted outcomes. |

---

## 4. What does not translate

- **Global trade network.** Vic3's market simulation is the core economic engine. We model a single-nation macro economy and will not simulate cross-border goods flows.
- **Construction queue / infrastructure.** Our scope is legislative/political, not industrial build-out.
- **Warfare fronts.** Military is out-of-scope for v0.1; basic abstraction arrives in v0.3.

---

## 5. Suggested hooks in our systems

- **PopulationSystem:** Add a `supportFor: Record<PartyId, number>` per group, normalised to 100. Feed party "clout" from group support weighted by group size. This plugs straight into existing `world.congress` by biasing vote chance on ideology alignment.
- **EventEngine:** Add a `progressMeter` concept — an event that persists across several weeks with a visible progress bar and accumulating modifiers. Reuse for long bills, movements, investigations.
- **LegislationSystem:** Surface the per-IG / per-caucus approval in the Bill detail modal (tooltip: "Business caucus: +8, Labor caucus: -12"). This is the single most-requested Vic3 UI pattern.
- **Dashboard:** Add a **National Trajectory** strip that plots 4–6 key metrics over the play session as a rolling sparkline. Vic3's "where is my country going?" readability is a big part of its pull.

---

## 6. Open questions

- Do we want *visible* POP stratification (wealth brackets) in v0.1, or keep groups coarse? Recommendation: coarse for v0.1, add a wealth distribution histogram per group in v0.2.
- Should movements be first-class entities (with IDs, stages, leaders) or derived from group state each tick? Recommendation: derived for v0.1; promote to first-class when we add faction leadership in v0.3.

---

## 7. References

- Paradox Wiki — Victoria 3: https://vic3.paradoxwikis.com/
- Paradox Dev Diaries (publicly available on the official forum).
- Rock Paper Shotgun & PC Gamer post-launch analyses (for UX critique, not mechanics).
