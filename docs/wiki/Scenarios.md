# Scenarios

> **GDD reference:** §3.2, §12.7
> **Implementation status:** Partial (Modern America 2024 shipped; 8 scenarios designed for M7+)
> **Last reviewed:** 2026-05-02 (Vex, GDD v0.4-DRAFT)

## Overview

A scenario is a complete starting configuration: a historical era, a starting role, an initial economy, a congress shape, a population map, and a narrative brief. Different scenarios are not just reskins — they exercise different engine capabilities and pose different political questions.

## Player-Facing Summary

Each scenario puts you in a specific seat at a specific moment in American history. The rules of the chamber are the same; the stakes are not. A vote in 1775 does not look the same as a vote in 2001. Choose the scenario that matches the kind of question you want to wrestle with.

## Shipping Scenarios

| Scenario | Era | Role | Target milestone |
|---|---|---|---|
| [[Scenario-Modern-America-2024]] | 2024 US Senate | Senator (swing state) | Shipped |

## Planned Scenarios (designed, not yet shipped)

| Scenario | Era | Milestone |
|---|---|---|
| [[Scenario-Cold-War]] | 1947–1991 | M7 (recommended first expansion) |
| [[Scenario-Civil-War-Reconstruction]] | 1850–1877 | Post-M7 |
| [[Scenario-Gilded-Age]] | 1870–1900 | Post-M7 |
| [[Scenario-Great-Depression]] | 1929–1941 | Post-M7 |
| [[Scenario-World-War-I]] | 1914–1919 | Post-M7 |
| [[Scenario-World-War-II]] | 1939–1945 | Post-M7 |
| [[Scenario-War-on-Terror]] | 2001–2010 | Post-M7 |
| [[Scenario-Founding-Era]] | 1774–1789 | Post-M7 |

Each planned scenario page contains the narrative brief from GDD §12.7 as a designed placeholder. Content is subject to change as the engine matures.

## What a Scenario Contains

Each scenario ships a data bundle:

- `scenario.json` — role, victory conditions, failure conditions, party split
- `legislators.json` — procedural seed for the chamber (not 535 hand-authored entries)
- `population.json` — starting cohort values
- `economy.json` — starting macro indicators
- Scenario-specific events and quest arcs
- Victory and loss text (added at M2)

## Related Systems

- [[Legislation]] — bill lifecycle; some subtypes are scenario-specific
- [[Congress]] — chamber shape varies by era
- [[Character]] — background, ideology, and starting role are scenario-gated
- [[Factions]] — faction maps differ across eras

## Modding Hooks (GDD §9)

Custom scenarios are a first-class mod type. See [[Authoring-Scenarios]] for the full data bundle specification, and [MODDING.md](https://github.com/ScottyVenable/Political-Ascent/blob/development/docs/guides/MODDING.md) for the mod folder shape.

## Related

[[Scenario-Modern-America-2024]] · [[Getting-Started]] · [[Modding-Guide]] · [[Authoring-Scenarios]] · [[Concept-Glossary]]
