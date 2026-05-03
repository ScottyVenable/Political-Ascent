# Skills

> **GDD reference:** §4.7 (SkillSystem), §12.3.3 (archetype-skill affinity)
> **Implementation status:** Implemented (3 of 6 branches fully fleshed)
> **Last reviewed:** 2026-05-02 (Vex, GDD v0.4-DRAFT)

## Overview

The skill tree is how your character grows across a campaign. Each branch deepens one aspect of your political identity — and escalates the kinds of content available to you.

## Player-Facing Summary

Spend skill points earned from XP to unlock nodes across six branches. Each node either opens a new card, improves a stat ceiling, or gates advanced event and dialogue options. A character investing heavily in Strategy will find Coalition Broker-style options appearing in negotiations. A character building Integrity will see Principled Dissenter moments that others cannot access. The tree does not constrain you — it specialises you.

## How It Works (GDD §4.7)

Six branches, each tied to a character stat and an archetype family:

| Branch | Stat | Archetype voice affinity | Representative unlock |
|---|---|---|---|
| **Charisma** | Charisma | Media Operator, Crusader Freshman | Speech power upgrades; press-card tier unlocks |
| **Strategy** | Strategy | Coalition Broker, Machine Boss | Legislation complexity bonuses; coalition dialogue gates |
| **Connections** | Connections | Donor Whisperer, Old Guard Survivor | Ally network expansion; relationship-maintenance cards |
| **Integrity** | Integrity | Principled Dissenter, Reform Idealist | Scandal resistance; morality-gated dialogue options |
| **Stamina** | Stamina | Backbencher Loyalist, Reluctant Moderate | Action Point pool increases; endurance-event buffs |
| **Wealth** | Wealth | Donor Whisperer, Shadow Power | Personal finance multipliers; donor-tier card access |

**Earning XP:** XP accumulates from quest completions, bill signings, event resolutions, and achievement unlocks. Each level grants skill points to spend.

**Branch notes:** the current implementation ships 3 of 6 branches with full node graphs. The remaining branches are scaffolded and will receive their full node sets through M5.

## Key Terms

| Term | Definition |
|---|---|
| **Skill point** | Earned from XP level-ups; spent to unlock tree nodes |
| **Node** | A discrete unlock in a branch: stat bonus, card unlock, or content gate |
| **Prerequisite** | An earlier node in the same branch that must be unlocked first |
| **XP** | Experience points accumulated from play actions |

## Examples

- Unlocking three Charisma nodes makes Media-Operator archetype event options available and upgrades speech cards from tier 1 to tier 2 effectiveness.
- A high-Integrity build with the Principled Dissenter node opens a dialogue option in committee negotiations that a less-principled character literally cannot see.

## Related Systems

- [[Character]] — stats, backgrounds, and traits that the skill tree extends
- [[Cards]] — many nodes unlock new cards or upgrade existing ones
- [[Dialogue]] — skill nodes gate dialogue options (M2)
- [[Archetypes]] — each branch deepens an archetype family's toolkit

## Modding Hooks (GDD §9)

Skill node definitions will live in `src/data/skills/` (migration in progress). Each node references the `SkillNode` type with prerequisites, effects, and content gates. See [MODDING.md](https://github.com/ScottyVenable/Political-Ascent/blob/development/docs/guides/MODDING.md).

## Related

[[Character]] · [[Archetypes]] · [[Cards]] · [[Dialogue]] · [[Concept-Glossary]]
