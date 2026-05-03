# Factions

> **GDD reference:** §4.11, §12.3 (archetype-faction map)
> **Implementation status:** Designed (M2 — Floor Manager)
> **Last reviewed:** 2026-05-02 (Vex, GDD v0.4-DRAFT)

## Overview

Factions are sub-party blocs within Congress that share a coherent ideology or set of interests. They are not the same as parties. A Democrat can be a member of the Reform Bloc; a Republican can be a member of the Pragmatist Wing. Faction loyalty sits above individual legislator relationships — it is the metagame above any single bill.

## Player-Facing Summary

You cannot whip a faction the way you whip a single vote. Faction loyalty is earned over time, through a pattern of legislation, relationships, and rhetorical choices that signals who you are and who you are with. Betray a faction's priorities once and the damage is slow to recover. Do it twice and some members will actively work against you. Earn genuine loyalty and they become a force multiplier — floor support, fundraising connections, and cover for the votes you cannot afford to take alone.

## How It Works (GDD §4.11)

*Note: the FactionSystem module does not yet exist as a runtime system. This page documents the design, marked Designed (M2).*

Faction loyalty is a score tracked per-faction for the player character. It derives from:

- **Legislative alignment** — bills that align with a faction's policy priorities increase loyalty; bills that directly oppose their priorities decrease it.
- **Relationship aggregate** — your average relationship score across the faction's member legislators feeds a loyalty component.
- **Archetype recognition** — some archetypes (see [[Archetypes]]) respond to specific rhetorical and negotiation choices. A Coalition Broker faction member responds to data-driven pragmatism; an Ideological Enforcer does not.
- **Speech signals (M3)** — once the [[Speech-Composer]] ships, speeches can signal alignment or distance from a faction's priorities.

**Monthly loyalty check:** faction loyalty updates monthly. At low loyalty thresholds, faction members may actively oppose your legislation or withhold floor support. At high loyalty, they contribute to your Political Capital generation and provide early warning of opposition.

## Faction Map (Modern America 2024)

The precise faction roster is scenario-specific. The Modern America 2024 scenario includes at least:

| Faction | Archetype tendency | Policy priorities |
|---|---|---|
| Reform Bloc | Reform Idealist, Crusader Freshman | Progressive legislation, anti-corruption |
| Pragmatist Wing | Coalition Broker, Reluctant Moderate | Bipartisan viability, swing-state priorities |
| Establishment (D) | Machine Boss, Backbencher Loyalist | Party discipline, institutional stability |
| Establishment (R) | Old Guard Survivor, Backbencher Loyalist | Party discipline, fiscal conservatism |
| Hardline | Ideological Enforcer | Doctrinal purity; red-line holders |
| Donor-Aligned | Donor Whisperer | Business interest alignment |

The Independent/cross-faction slot (e.g., Ray Nguyen in Modern America 2024) operates outside these blocs and caucuses situationally.

## Key Terms

| Term | Definition |
|---|---|
| **Faction loyalty** | Player's standing with a bloc; 0–100 per faction |
| **Loyalty check** | Monthly evaluation that may trigger faction responses |
| **Red line** | A faction policy position that, if violated, causes immediate loyalty loss |
| **Archetype tendency** | The NPC voice families most common within a faction; see [[Archetypes]] |

## Archetype-Faction Affinity Map (GDD §12.3.3)

| Background | Primary archetype family | Natural faction alignment |
|---|---|---|
| Citizen | Reform Idealist, Principled Dissenter | Reform Bloc |
| Veteran | Machine Boss, Old Guard Survivor, Backbencher Loyalist | Establishment |
| Executive | Donor Whisperer, Media Operator, Shadow Power | Donor-Aligned, Pragmatist Wing |

Your starting faction standing is influenced by background and ideology at creation.

## Related Systems

- [[Congress]] — individual legislator relationships are the unit below faction loyalty
- [[Influence-and-Reputation]] — Political Capital generation is partially faction-driven
- [[Legislation]] — bills are the primary driver of faction loyalty movement
- [[Archetypes]] — faction figureheads are drawn from the archetype catalogue
- [[Dialogue]] — faction-aligned NPCs have distinct dialogue voices (M2)

## Related

[[Congress]] · [[Influence-and-Reputation]] · [[Legislation]] · [[Archetypes]] · [[Dialogue]] · [[Concept-Glossary]]
