# Economy

> **GDD reference:** §4.3
> **Implementation status:** Implemented (simple model; budget reconciliation planned M1)
> **Last reviewed:** 2026-05-02 (Vex, GDD v0.4-DRAFT)

## Overview

The economy is a macro-level feedback system. It is not a full simulator — it is a pressure source. When the economy sours, populations get angry. When the deficit swells, fiscal legislation faces harder opposition. You do not manage the economy directly; you manage the legislation that shapes it.

## Player-Facing Summary

Watch the dashboard indicators. GDP growth, unemployment, inflation, the national debt, the Gini coefficient, the trade balance — each one is a sentence about the country's mood. Pass the right bill at the wrong time and you own the numbers that follow. Pass nothing and the drift finds you anyway.

## How It Works (GDD §4.3)

The economy tracks six macro indicators:

| Indicator | What it affects |
|---|---|
| **GDP growth** | General population happiness; opposition to fiscal legislation |
| **Unemployment** | Working-class and rural cohort pressure; radicalism trigger threshold |
| **Inflation** | Income cohorts; erodes the middle and working class faster |
| **Debt** | Gates fiscal legislation viability; opposition math on spending bills |
| **Deficit** | Annual drift pressure on debt |
| **Gini coefficient** | Inequality; drives progressive coalition pressure |
| **Trade balance** | Sector-level cohort effects |

**Cadence:** the economy updates weekly, produces a monthly summary, and runs an annual reconciliation. GDP drifts on a seeded random basis; unemployment lags GDP; inflation drifts on deficit trajectory.

**Legislation effects:** signing a bill applies its `fiscalImpact` to the deficit and triggers per-cohort happiness deltas via `applyEffect`. The economy does not update instantly — the delta enters the weekly drift.

## Key Terms

| Term | Definition |
|---|---|
| **Fiscal impact** | A bill's net budget effect (negative = cost to the treasury) |
| **Deficit** | Annual gap between revenue and spending |
| **Gini coefficient** | 0–1 inequality measure; 0 = perfect equality, 1 = maximum inequality |
| **Economic pressure** | A derived signal fed to `PopulationSystem` to adjust cohort happiness weekly |

Full glossary: [[Concept-Glossary]]

## Examples

- An infrastructure bill with a –$40bn fiscal impact signed during a deficit of –$800bn will raise opposition to any subsequent spending bill in the same term.
- Unemployment crossing 10% triggers a radicalism increase in working-class cohorts, which unlocks protest events and reduces those cohorts' baseline approval ceiling.

## Related Systems

- [[Population]] — the economy's primary downstream target
- [[Legislation]] — the primary lever for changing economic trajectory
- [[Events]] — external shocks (recessions, trade crises) inject directly into indicators

## Modding Hooks (GDD §9)

Economy starting state lives in `src/data/scenarios/<id>/economy.json`. You can set starting values for all six indicators and their drift seeds. Economic event definitions live in `src/data/events/`. See [MODDING.md](https://github.com/ScottyVenable/Political-Ascent/blob/development/docs/guides/MODDING.md).

## Related

[[Population]] · [[Legislation]] · [[Events]] · [[Concept-Glossary]]
