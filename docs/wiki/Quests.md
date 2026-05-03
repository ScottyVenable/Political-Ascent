# Quests

> **GDD reference:** §4.8, §12.4
> **Implementation status:** Implemented (quest start-day persistence bug known; fix in M1)
> **Last reviewed:** 2026-05-02 (Vex, GDD v0.4-DRAFT)

## Overview

Quests are multi-stage narrative arcs with explicit objectives and structured rewards. They are the connective tissue between the simulation's moment-to-moment decisions and a campaign-length story. A quest does not replace legislation — it frames it.

## Player-Facing Summary

A quest arrives as an objective set. Complete its stages in order and collect the rewards. Fail to complete it before the deadline and absorb the consequences. Simple in structure; rarely simple in practice. The stages interlock with the bill clock — issue-arc quests are designed to escalate during floor debate, not after. The timing is not accidental.

## How It Works (GDD §4.8, §12.4)

Quests follow a four-beat arc (Setup → Escalation → Pivot → Resolution). Each arc type has a defined scope and trigger:

| Arc type | Scope | Common trigger |
|---|---|---|
| **Career Arc** | Full campaign | Auto-starts at game open |
| **Ideological Arc** | Full campaign | Ideology compass position at creation |
| **Issue Arc** | 4–16 weeks | Bill reaching committee, or a crisis event |
| **Scandal Arc** | 2–10 weeks | `scandal-in-play` flag set |
| **Coalition Arc** | 8–20 weeks | Two consecutive bills failing to reach vote threshold |
| **Legacy Arc** | Final act | 75% through the scenario clock or a specific achievement |
| **Personal Arc** | Variable | Trait combinations or background-specific conditions |

**Daily evaluation:** `QuestSystem.dailyUpdate()` evaluates each active quest's objectives. On completion, rewards dispatch through `applyEffect`. Failed quests stay on record with status `failed`.

**Quest stages:** each stage has one or more objectives (game-state predicates). Stages are ordered; you cannot skip. Branching paths diverge at the Pivot beat.

**Rewards:** XP, Political Capital, relationship deltas, trait acquisitions, or flag sets — anything `applyEffect` can dispatch.

## Key Terms

| Term | Definition |
|---|---|
| **Stage** | An ordered phase of a quest with its own objectives |
| **Objective** | A game-state predicate that must become true to advance the stage |
| **Arc** | The narrative shape of a quest (see arc types above) |
| **Deadline** | Some quests have time-boxed windows; missing the window triggers the failure path |

Full glossary: [[Concept-Glossary]]

## Examples

- An Issue Arc quest, "The Infrastructure Vote," starts when your infrastructure bill enters committee. Stage 1: reach floor debate before week 8. Stage 2: secure three swing-legislator commitments. Pivot: a scandal event fires and one of those legislators withdraws. Resolution branch A: pass the bill anyway. Resolution branch B: accept a scaled-back version with a coalition rider.
- A Scandal Arc quest starts when a `scandal-in-play` flag is set. Each stage tightens the pressure: media coverage, party meeting, committee hearing. The resolution path depends on whether you chose transparency or damage control at the Pivot.

## Related Systems

- [[Events]] — events trigger quests; quests schedule events
- [[Legislation]] — issue arcs are designed against the bill clock
- [[Character]] — traits and background determine which personal and ideological arcs are available
- [[Achievements]] — completing legacy arcs unlocks achievements

## Modding Hooks (GDD §9)

Quest definitions live in `src/data/quests/`. Each file references the `QuestDefinition` type with stages, objectives, rewards, and optional branch definitions. See [MODDING.md](https://github.com/ScottyVenable/Political-Ascent/blob/development/docs/guides/MODDING.md).

## Related

[[Events]] · [[Legislation]] · [[Character]] · [[Achievements]] · [[Scenarios]] · [[Concept-Glossary]]
