# Time and Pacing

> **GDD reference:** §2.2, §2.3, §4.1 (Legislation clock), research/pacing-legislative-timeline-2026-04.md
> **Implementation status:** Implemented
> **Last reviewed:** 2026-05-02 (Vex, GDD v0.4-DRAFT)

## Overview

Time is a resource. Not a backdrop. Every day that passes costs something — opportunity, momentum, or the narrow window when a coalition was possible. The clock does not wait for you to feel ready.

## Player-Facing Summary

The simulated world runs on days. One day at 1× speed is roughly three real seconds. You can pause, run at 2× or 4×, or let the calendar roll while you plan. While a bill sits in committee, you are not waiting — you are whipping votes, playing cards, managing events, and building leverage. The bill clock and your action clock run simultaneously. That is the design.

## How It Works (GDD §2.2, §2.3)

### Time Units

| Unit | Wall-clock equivalent (1× speed) | Primary uses |
|---|---|---|
| Day | ~3 seconds | Bill clock, event triggers, daily quest evaluation |
| Week | ~21 seconds | Population update, economy update, congress drift, PC generation |
| Month | ~90 seconds | Economy monthly summary, faction loyalty check (M2) |
| Year | ~6 minutes | Annual economic reconciliation, budget settlement |

### Speed Controls

| Setting | Description |
|---|---|
| **Paused (0)** | Nothing ticks; player acts freely |
| **1×** | Normal speed; time flows, events queue |
| **2×** | Double speed |
| **4×** | Quadruple speed |
| **Skip-to-event** | Planned; not yet shipped |

Auto-pause triggers on: event modal queued, manual save requested, vote roll-call reached, low AP threshold (planned).

### The Legislative Clock (GDD §2.3, §4.1)

Time is the **primary cost** of legislation — not Political Capital. PC is an optional accelerator.

| Stage | Duration |
|---|---|
| Committee | 21 simulated days |
| Floor debate | 14 simulated days |
| Vote | 7 simulated days |

Total minimum: 42 days from committee entry to vote resolution. During those 42 days, the world does not pause for your bill.

**Expedite:** `expediteStage()` compresses a stage at a Political Capital cost. The result is `{ ok, newStage, reason? }`. The panel shows the reason on failure — read it before committing.

### Design Intent (pacing-legislative-timeline-2026-04.md)

The April 2026 pacing pass made time the primary cost to prevent Political Capital hoarding and to ensure the player has meaningful activity during bill progression. The 21/14/7 day split was chosen so that:

- **Committee (21d):** long enough to build and maintain a relationship that shifts vote math
- **Floor debate (14d):** enough time for one full issue-arc escalation beat
- **Vote (7d):** short enough to create urgency; long enough for last-minute leverage plays

Waiting becomes productive downtime, not dead air. Arc designs in [[Quests]] are written against this clock — issue arcs escalate during floor debate by design.

## Key Terms

| Term | Definition |
|---|---|
| **Day** | Base simulation unit; ~3 seconds at 1× speed |
| **Simulated day epoch** | An integer counter from game start; used by bill clock and quest deadlines |
| **Stage clock** | The day-indexed timer for each bill stage |
| **Expedite** | PC-spend that compresses a stage; see [[Legislation]] |
| **Auto-pause** | Engine-triggered pause on significant events |

## Related Systems

- [[Legislation]] — the primary system consuming the day-indexed clock
- [[Quests]] — arc pacing is designed against the bill clock cadences
- [[Events]] — daily trigger check fires every simulated day
- [[Population]] — weekly cadence; cohort mood updates with or without player action

## Related

[[Legislation]] · [[Quests]] · [[Events]] · [[Population]] · [[Concept-Glossary]]
