# Concept Glossary

> **GDD reference:** §15, §12.2
> **Implementation status:** Implemented
> **Last reviewed:** 2026-05-02 (Vex, GDD v0.4-DRAFT)

Terms used in-game and across the wiki. Canonical spellings and capitalisations match GDD §12.2.2.

---

## Core Resources

- **Political Capital (PC)** — the primary spendable currency of influence. Generated weekly from character stats, allied cohort loyalty, and ally count. Spent on whip actions, cards, and negotiations. Not the same as money.
- **Action Points (AP)** — a weekly budget of discrete moves. Refills each Monday tick. Some cards spend AP in addition to PC.

## Legislation

- **Bill** — a draft law moving through the [[Legislation]] pipeline.
- **Rider** — a policy module attached to a bill. Seven role types: pay-for, benefit, coalition-builder, oversight, enforcement, carveout, or implementation.
- **Stage** — one of the six bill statuses: `draft`, `committee`, `floor_debate`, `vote`, `signed`, `failed`, `vetoed`.
- **Committee** — a subset of Congress that reviews a bill before floor debate. Committee stage lasts 21 simulated days.
- **Expedite** — spend Political Capital to compress a stage's time window.
- **Whip** — a Political Capital expenditure that shifts a specific legislator's vote probability on a specific bill.
- **Fiscal impact** — a bill's net budget effect. Negative value = cost to the treasury.

## Congress & Factions

- **Legislator** — any member of the procedurally-generated chamber. See [[Congress]].
- **Personality** — one of five NPC archetypes: `loyalist`, `maverick`, `opportunist`, `ideologue`, `pragmatist`. See [[Archetypes]].
- **Faction** — a sub-party bloc within Congress with coherent ideology or interest alignment. See [[Factions]].
- **Leverage** — a hidden per-legislator coercion resource. Spending leverage shifts a relationship at a cost to Integrity. See [[Influence-and-Reputation]].
- **Baseline relationship** — the equilibrium score each legislator drifts toward weekly.

## Population

- **Cohort** — an intersectional population slice with shared demographic and ideological characteristics.
- **Happiness** — 0–100 satisfaction score per cohort. Drifts toward 50 without intervention.
- **Radicalism** — 0–100 propensity toward extreme events. Climbs below happiness 40; decays when conditions improve.

## Cards

- **Card** — a playable action drawn from a deck. See [[Cards]].
- **Rarity** — one of six tiers: Common, Uncommon, Rare, Epic, Legendary, Prismatic.
- **Card pack** — a sealed bundle of five cards with rarity guarantees. Pack contents are deterministic per seed.

## Narrative

- **Archetype** — one of twelve NPC voice categories. See [[Archetypes]].
- **Arc** — a shaped quest narrative (Career, Ideological, Issue, Scandal, Coalition, Legacy, Personal). See [[Quests]].

## General

- **Scenario** — a playable historical era; a complete starting configuration. See [[Scenarios]].
- **Extended Tooltip** — the Paradox-style hover panel that surfaces full term definitions, cross-links, and "see also" relations. Hold `Shift` while hovering to pin.
- **Deterministic** — a simulation or randomised action that produces the same output given the same seed.
- **Seed** — the RNG initialisation value for a game session.

---

## Related

[[Game-Systems]] · [[Voice-and-Tone]] · [[Archetypes]] · [[Legislation]] · [[Congress]] · [[Cards]]
