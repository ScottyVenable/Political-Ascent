# Game Systems

> **GDD reference:** §4.0 (system inventory), §2 (core loop)
> **Implementation status:** Partial (see status column below)
> **Last reviewed:** 2026-05-02 (Vex, GDD v0.4-DRAFT)

Political Ascent is built from interlocking simulation systems that tick on a deterministic clock. Each system has its own wiki page. This page is the index.

---

## System Inventory

| System | Status | Cadence | Wiki page |
|---|---|---|---|
| Legislation | Implemented | Daily clock | [[Legislation]] |
| Congress | Implemented | Weekly | [[Congress]] |
| Economy | Implemented | Weekly / monthly / annual | [[Economy]] |
| Population | Implemented | Weekly | [[Population]] |
| Events | Implemented | Daily trigger check | [[Events]] |
| Cards | Implemented | On-demand | [[Cards]] |
| Character | Implemented | On-demand | [[Character]] |
| Skills | Implemented (3 of 6 branches) | On-demand | [[Skills]] |
| Quests | Implemented | Daily | [[Quests]] |
| Achievements | Implemented | Weekly + key events | [[Achievements]] |
| Influence & Political Capital | Implemented | Weekly | [[Influence-and-Reputation]] |
| Dialogue | Designed (M2) | On-demand | [[Dialogue]] |
| Factions | Designed (M2) | Monthly | [[Factions]] |
| Speech Composer | Designed (M3) | On-demand | [[Speech-Composer]] |
| Time & Pacing | Implemented | Continuous | [[Time-and-Pacing]] |

---

## How Systems Interconnect

The engine runs in pure TypeScript (`src/engine/` + `src/systems/`). All state lives in Zustand stores (`src/store/`). React renders the UI (`src/renderer/`).

Every effect — from a card play to a quest completion to a bill signing — flows through a single `applyEffect` dispatcher. This keeps consequences consistent and auditable.

The [[Time-and-Pacing]] page explains how the simulated clock drives all cadences above.

For architecture detail, see the [developer docs](https://github.com/ScottyVenable/Political-Ascent/blob/development/docs/ARCHITECTURE.md).

---

## Related

[[Time-and-Pacing]] · [[Character]] · [[Legislation]] · [[Events]] · [[Concept-Glossary]]
