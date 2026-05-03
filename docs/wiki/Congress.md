# Congress

> **GDD reference:** §4.2
> **Implementation status:** Implemented (voting logic extraction planned in M1)
> **Last reviewed:** 2026-05-02 (Vex, GDD v0.4-DRAFT)

## Overview

Congress is the 535-member chamber that votes your legislation into law — or buries it in committee. You cannot control it directly. You can influence it: one relationship at a time, one leverage point at a time.

## Player-Facing Summary

The chamber is procedurally generated for each scenario from a seeded random number generator — the same seed, the same chamber, every time you load. Every legislator has a party, a state, an ideology, a personality type, and a relationship score with you. That relationship score is the number you are always trying to move.

## How It Works (GDD §4.2)

Each legislator is described by:

| Attribute | What it means in play |
|---|---|
| **Party** | Democrat, Republican, or Independent; determines default vote-line pressure |
| **State** | Where they represent; affects which bills they prioritise |
| **Ideology** | Two-axis compass (`economic × social`); drives vote math against bill provisions |
| **Policy priorities** | 1–3 tags (e.g. `infrastructure`, `healthcare`); legislators vote with more flexibility on their priorities |
| **Personality** | `loyalist`, `maverick`, `opportunist`, `ideologue`, or `pragmatist` — gates negotiation tactics |
| **Relationship** | –100 to 100 with the player; drifts weekly toward a `baselineRelationship` |
| **Corruptibility** | Hidden 0–100 score; gates leverage operations (see [[Influence-and-Reputation]]) |

**Vote resolution:** each legislator's vote probability is computed from ideology alignment with the bill + relationship + party-line pressure + any leverage you have spent. The result is a roll-call, not a deterministic count.

**Drift:** relationships drift weekly toward their baseline. An ally drifts away from you if you ignore them. An opponent can be moved — slowly — by passing legislation they care about.

## Key Terms

| Term | Definition |
|---|---|
| **Whip action** | Spend Political Capital to shift a specific legislator's vote probability on a specific bill |
| **Leverage** | A hidden per-legislator coercion resource (see [[Influence-and-Reputation]]) |
| **Personality** | One of five archetypes governing how a legislator responds to negotiation |
| **Ideology** | Two-axis compass; see [[Concept-Glossary]] |
| **Baseline relationship** | The equilibrium each legislator drifts toward weekly |

## Ideology Labels (UI)

The raw two-axis compass is converted into readable labels for the chamber view:

- **Centrist** — both axes near origin
- **Left / Right** — economic axis only
- **Authoritarian / Libertarian** — social-authority axis only
- **Compound labels** (e.g. Right-Libertarian) — both axes significant
- **Intensity prefix** — Moderate or Strong

## Examples

- A pragmatist legislator with a relationship score of 45 and your bill touching their top policy priority has a high probability of voting yes — but spending PC on a whip action before the vote removes the uncertainty.
- An ideologue with relationship –30 will vote against you even if the bill aligns with their stated priorities. Their red line is their principle. Find a deal or find the votes elsewhere.

## Related Systems

- [[Legislation]] — the bills your legislators vote on
- [[Influence-and-Reputation]] — Political Capital and leverage tools
- [[Factions]] — bloc-level loyalty that sits above individual relationships
- [[Events]] — political events can shift relationships outside your control

## Modding Hooks (GDD §9)

Legislator seed data for a scenario lives in `src/data/scenarios/<id>/legislators.json`. You can override default personality distributions, party splits, and named NPC seeds. See [[Authoring-Scenarios]] and [MODDING.md](https://github.com/ScottyVenable/Political-Ascent/blob/development/docs/guides/MODDING.md).

## Related

[[Legislation]] · [[Influence-and-Reputation]] · [[Factions]] · [[Events]] · [[Archetypes]] · [[Concept-Glossary]]
