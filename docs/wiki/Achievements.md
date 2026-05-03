# Achievements

> **GDD reference:** §4.9
> **Implementation status:** Implemented
> **Last reviewed:** 2026-05-02 (Vex, GDD v0.4-DRAFT)

## Overview

Achievements are long-horizon goals evaluated by the same engine that gates event options and quest objectives. They do not feed back into the simulation — a locked achievement does not close a door. They are a record of what you have done and a prompt to try something harder.

## Player-Facing Summary

Some achievements unlock within a single campaign: sign a bill with bipartisan support, survive a full scandal arc, reach 60% national approval. Others require you to play differently across multiple runs. All of them tell you something about the game's design — the routes that exist, the combinations worth trying.

## How It Works (GDD §4.9)

**Evaluation cadence:** achievements are checked weekly and on key state-change events (bill signed, cohort happiness threshold crossed, quest completed). This is a performance choice — constant evaluation would be expensive and unnecessary.

**Two unlock records:**
- **Per-save record:** `world.unlockedAchievements` — what this campaign has earned.
- **Cross-save record:** stored separately in `electron-store` (desktop) or `localStorage` (Android) under `pa:achievements:global`. Persists across new games.

**Requirement evaluation:** achievement gates use the same `Requirement[]` evaluator as event options. Stats, traits, flags, bill history, cohort thresholds — any game-state predicate is expressible.

## Key Terms

| Term | Definition |
|---|---|
| **Per-save unlock** | An achievement earned in the current campaign; resets with a new game |
| **Cross-save unlock** | An achievement stored globally; survives across all games |
| **Requirement** | A game-state predicate; same format as event option gates |

## Examples

- *"First Reading"* — sign any bill. Per-save. Unlocks in the first campaign.
- *"Against the Grain"* — pass a bill opposed by your own party's majority. Cross-save.
- *"Quorum Call"* — reach 60% national approval in a Modern America 2024 campaign. Per-save.

## Related Systems

- [[Quests]] — legacy arc completions trigger achievements
- [[Events]] — key events check achievement conditions on resolution
- [[Legislation]] — bill-signing is one of the most common achievement triggers

## Modding Hooks (GDD §9)

Achievement definitions live in `src/data/achievements/achievements.json`. Each entry uses the standard `Requirement[]` predicate shape. Custom scenarios can ship their own achievement definitions. See [MODDING.md](https://github.com/ScottyVenable/Political-Ascent/blob/development/docs/guides/MODDING.md).

## Related

[[Quests]] · [[Events]] · [[Legislation]] · [[Character]] · [[Concept-Glossary]]
