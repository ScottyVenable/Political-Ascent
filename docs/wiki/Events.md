# Events

> **GDD reference:** §4.5
> **Implementation status:** Implemented
> **Last reviewed:** 2026-05-02 (Vex, GDD v0.4-DRAFT)

## Overview

Events are the world talking back. They interrupt the week with a modal — a crisis, an opportunity, a knock at the door — and ask you to choose. Your choice dispatches effects through the same pipeline that processes legislation, cards, and quests. Nothing is cosmetic.

## Player-Facing Summary

You will not see every event in a single playthrough. The engine evaluates trigger conditions daily and pulls from the eligible pool based on weight. Some events are one-time. Some repeat. Some chain into each other. The first time a union threatens a strike, it is a warning. The second time, it is the floor debate that defines your legacy.

## How It Works (GDD §4.5)

Each event definition specifies:

| Field | Purpose |
|---|---|
| **Type** | `crisis`, `opportunity`, `population`, `political`, `personal`, or `scheduled` |
| **Trigger conditions** | Predicates over game state (week, cohort happiness, bill stage, flags) |
| **Options** | 2–5 player choices, each with requirement gates and effect sets |
| **Cooldown** | Minimum weeks between repeats (for repeatable events) |
| **Weight** | Relative likelihood when multiple events are eligible on the same day |
| **Follow-ups** | Optional chained events that bypass trigger evaluation — they spawn directly |

**Daily trigger check:** the engine evaluates all non-cooling-down events each day and queues eligible ones. Events that require acknowledgment pause the time-speed controls until resolved.

**Options and requirements:** each option may be gated by stats, traits, flags, or ideology. Greyed options show a failure hint explaining why they are unavailable. Choosing an option dispatches its effects through `applyEffect`.

## Key Terms

| Term | Definition |
|---|---|
| **Trigger condition** | A predicate over game state that must be true for an event to become eligible |
| **Option** | One of the 2–5 choices presented to the player; each has effects and optional requirements |
| **Cooldown** | Minimum weeks before a repeatable event can fire again |
| **Weight** | Relative selection probability when multiple events are eligible |
| **Chain** | A follow-up event spawned directly from an option's outcome, bypassing trigger evaluation |

Full glossary: [[Concept-Glossary]]

## Examples

- A budget-crisis event fires when `economy.deficit > −$1tn` AND `economy.unemployment > 8%`. Options include "Pass emergency spending" (costs PC, raises debt, increases working-class happiness) and "Hold the line" (no cost, radicalism continues rising, triggers a follow-up protest event).
- A personal event fires when `character.integrity < 30` and a scandal flag is set. Some options require the `Scandal Survivor` trait; the rest involve increasingly costly damage control.

## Related Systems

- [[Legislation]] — bill stage changes can be event triggers; events can affect bills in progress
- [[Population]] — cohort state (happiness, radicalism) is the most common trigger condition family
- [[Economy]] — economic indicators feed trigger conditions
- [[Quests]] — events can start quests; quests can schedule events

## Modding Hooks (GDD §9)

Event definitions live in `src/data/events/`. Each file contains an array of `GameEventDefinition` objects. Effects use the same `Effect` schema as cards, quests, and achievements. Chained events reference other event IDs. See [[Authoring-Scenarios]] and [MODDING.md](https://github.com/ScottyVenable/Political-Ascent/blob/development/docs/guides/MODDING.md).

## Related

[[Legislation]] · [[Population]] · [[Economy]] · [[Quests]] · [[Cards]] · [[Concept-Glossary]]
