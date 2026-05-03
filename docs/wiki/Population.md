# Population

> **GDD reference:** §4.4
> **Implementation status:** Implemented (speech-moves-population pipeline designed M3)
> **Last reviewed:** 2026-05-02 (Vex, GDD v0.4-DRAFT)

## Overview

The population is not a single number — it is a set of distinct cohorts, each with its own mood, priorities, and breaking point. Pass the right bill and the right people notice. Ignore the wrong cohort long enough and they stop voting — or stop being quiet about it.

## Player-Facing Summary

Every cohort has a happiness score and a radicalism score. Happiness reflects how the world is going for them right now. Radicalism reflects how angry they are about it. A working-class cohort at 40% happiness and rising radicalism is heading somewhere you cannot ignore. A well-funded business cohort at 75% happiness does not need your attention this week. Read the charts. Prioritise accordingly.

## How It Works (GDD §4.4)

Each cohort tracks:

| Attribute | Range | What it means |
|---|---|---|
| **Happiness** | 0–100 | Current satisfaction; drifts toward 50 without intervention |
| **Radicalism** | 0–100 | Propensity toward extreme events; increases below happiness 40 |
| **Loyalty** | 0–100 | Loyalty to the player specifically; affects Political Capital generation |
| **Activism** | 0–100 | How likely the cohort is to act on its mood (protests, turnout) |
| **Ideology** | Two-axis | Determines which bills and speeches move them |
| **Income** | Numeric | Shapes economic pressure sensitivity |

**Cadence:** population updates weekly. Happiness drifts 0.5 points per week toward 50. Radicalism decays 1.0 point per week when above equilibrium — but climbs under economic pressure or after unpopular legislation.

**Downstream effects:** cohort happiness feeds Political Capital generation in [[Influence-and-Reputation]]. Radicalism crossing thresholds triggers protest events via [[Events]]. Loyalty affects your approval floor.

**Speech effects (M3):** the [[Speech-Composer]] will add a direct pipeline from speeches to per-cohort happiness deltas. Until M3 ships, legislation and events are the primary levers.

## Key Terms

| Term | Definition |
|---|---|
| **Cohort** | An intersectional population slice with shared demographic and ideological characteristics |
| **Radicalism** | Propensity to exit normal political behaviour; triggers protest and crisis events |
| **Happiness drift** | Weekly passive movement toward 50 equilibrium |
| **Economic pressure** | A signal from `EconomySystem` that modifies weekly happiness drift per cohort |

Full glossary: [[Concept-Glossary]]

## Examples

- Rural landowners with 35% happiness and rising radicalism will trigger a farm-crisis event within the next few weeks if nothing changes. Pass agricultural aid legislation or it escalates.
- Business interests at 80% happiness contribute more to your weekly Political Capital generation. Signing a bill they oppose will drop that contribution noticeably.

## Related Systems

- [[Economy]] — provides the `economicPressure` signal driving weekly drift
- [[Events]] — cohort state triggers and is affected by events
- [[Legislation]] — the primary tool for moving cohort happiness
- [[Speech-Composer]] — will add speech-driven happiness deltas (M3)
- [[Influence-and-Reputation]] — cohort loyalty feeds PC generation

## Modding Hooks (GDD §9)

Population cohort starting state lives in `src/data/scenarios/<id>/population.json`. Custom scenarios can define new cohorts, adjust starting values, and tune drift constants. Cohort `tags` are the primary link to bill and event effects. See [MODDING.md](https://github.com/ScottyVenable/Political-Ascent/blob/development/docs/guides/MODDING.md).

## Related

[[Economy]] · [[Events]] · [[Legislation]] · [[Speech-Composer]] · [[Influence-and-Reputation]] · [[Concept-Glossary]]
