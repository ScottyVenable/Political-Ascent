# Roadmap

> **GDD reference:** ROADMAP.md §4
> **Implementation status:** N/A (living plan)
> **Last reviewed:** 2026-05-02 (Vex, GDD v0.4-DRAFT)

Player-facing milestone overview. No fixed dates — the game ships when it is ready, not when the calendar says so.

Full technical roadmap (dependency graph, exit criteria, risk register): [`docs/ROADMAP.md`](https://github.com/ScottyVenable/Political-Ascent/blob/development/docs/ROADMAP.md).

---

## Milestone Ladder

| Milestone | Version | Code Name | Theme |
|---|---|---|---|
| **M1** *(active)* | `0.2.0-alpha.1` | **Cloakroom** | Make the bill lifecycle the most legible system in the game |
| M2 | `0.3.0-alpha.1` | **Floor Manager** | Ship Dialogue and Faction foundation |
| M3 | `0.4.0-alpha.1` | **Stump** | Speech Composer and audience segments |
| M4 | `0.5.0-alpha.1` | **Ironclad** | Accessibility, security, and test hardening |
| M5 | `0.6.0-alpha.1` | **Lectern** | Content out of source code; i18n scaffolding |
| M6 | `0.7.0-alpha.1` | **Telemetry** | Performance gates and CI maturity |
| M7 | `0.8.0-alpha.1` | **Second Front** | Cold War scenario — engine generality test |
| M8 | `1.0.0-rc.1` | **Quorum** | First stable candidate; every gate green |

---

## Active Milestone — M1: Cloakroom

**What it delivers:**
- Rider stack fully visible in the draft screen
- Day-indexed legislative clock (a bill knows what day it entered committee)
- Expedite cost surface in the Draft Legislation screen
- Voting logic extracted into its own `VotingSystem` module
- Legislative news headlines at each stage transition

**Why it matters to players:** the bill lifecycle becomes the legible heartbeat of the game. You will know exactly how long your bill has left, what it costs to rush it, and why it passed or failed.

---

## What Follows M1

**M2 (Floor Manager):** the first time you can have a real conversation with Audrey Vance. Dialogue trees are live, faction standings are tracked, and the end-of-run victory and loss text appears.

**M3 (Stump):** assemble a speech from phrase fragments, score it against your audience, and read the headline. The population finally responds to what you say, not just what you sign.

**M4 (Ironclad):** not visible to players directly — but it is what makes the game trustworthy. Accessibility audit, security hardening, save-fixture corpus. The work that earns the experimental→stable promotion.

**M5–M6 (Lectern + Telemetry):** content moves out of source code; performance becomes tracked and gated. The foundation for translation and scale.

**M7 (Second Front):** a second scenario. Cold War (1947–1991). The same engine, a very different world. If the engine is general enough, it ships. If it breaks, that is what this milestone is for.

**M8 (Quorum):** every gate green. Signed binaries. Stable tag. Version 1.0.

---

## Out of Scope for 1.0

Multiplayer, mod marketplace, character portrait generator, audio score, network telemetry, parliamentary systems. These are post-1.0 topics. See [`docs/ROADMAP.md §6`](https://github.com/ScottyVenable/Political-Ascent/blob/development/docs/ROADMAP.md) for the full deferral list and rationale.

---

## Related

[[Release-Notes]] · [[FAQ]] · [[Contributing]] · [[Scenarios]]
