# Dialogue

> **GDD reference:** §4.12, §12.4 (quest arcs), §12.5 (dialogue authoring guide)
> **Implementation status:** Designed (M2 — Floor Manager)
> **Last reviewed:** 2026-05-02 (Vex, GDD v0.4-DRAFT)

## Overview

Dialogue is how you negotiate face-to-face. Not every conversation is a negotiation — some are revelations, some are warnings, some are opportunities. But every dialogue choice you make is a state write, and the world tracks what you said.

## Player-Facing Summary

*Note: the Dialogue system has no UI surface yet. The engine is scaffolded; the panel ships at M2.*

When it ships, dialogue works like this: an NPC has something to say to you. You see their opening line. You see two to five ways to respond. Some options are greyed — your stats or traits are not high enough, or your record makes the line impossible to deliver honestly. Choose an option and the conversation advances. The costs and effects are disclosed before you commit. There is no hidden roll; the outcome follows from your choice and your character's standing.

## How It Works (GDD §4.12, §12.5)

The dialogue engine is **pure data-driven**: `getNode(id)`, `visibleOptions(node, gameState)`, `choose(node, optionId, gameState)`. Dialogue trees live in `src/data/dialogue/<npc-id>/<tree-id>.json`.

### Node Structure

Each node contains:
- **Speaker** — the NPC id (or `"player"`)
- **Voice tag** — archetype tag (see [[Archetypes]]) that guides authored tone
- **Text** — the spoken line; may use game-state tokens like `{pc.name}`, `{bill.current.title}`
- **Options** — the player choices; each has a requirement gate, an optional cost, and a `next` node id

### Requirement Gates

Options may be gated by:
- **Stats** — e.g., "Connections ≥ 4"
- **Traits** — e.g., requires the `street-smart` trait
- **Flags** — a world state flag must be set
- **Ideology** — the player's ideology compass position

Greyed options show a failure hint explaining what you would need. Hidden options (`hiddenIfFails: true`) are invisible unless you qualify.

### Line Lengths (GDD §12.5.3)

| Context | Target | Hard cap |
|---|---|---|
| NPC speech line | 8–20 words | 30 words |
| Player option label | 4–12 words | 18 words |
| Flavour-only line | 8–25 words | 40 words |

Short lines. One idea per exchange. Interruptions use an em-dash, not ellipsis.

## Where Dialogue Appears

Dialogue fires through:
- **Quest beats** — a key stage of a quest requires a conversation
- **Legislator meetings** — negotiation trees for individual NPCs
- **Committee hearings** — formal procedural dialogue
- **Press interactions** — media-facing exchange trees

## Faction and Archetype Voices

Each NPC has a `voiceTag` drawn from the [[Archetypes]] catalogue. A Machine Boss speaks in transactional indirection. A Reform Idealist is earnest and specific. The voice tag tells content authors which register to write in, and the player can learn to recognise them.

## Key Terms

| Term | Definition |
|---|---|
| **Node** | A single dialogue step: speaker text + player option set |
| **Voice tag** | Archetype identifier guiding NPC tone |
| **Requirement gate** | A stat, trait, flag, or ideology check on a player option |
| **Failure hint** | Text shown on a greyed option explaining the requirement |
| **Token** | A `{placeholder}` in dialogue text resolved to live game state |

## Modding Hooks (GDD §9, §12.5)

Dialogue trees are data files. See [[Authoring-Dialogue]] for the full node shape, line-length conventions, voice tagging, and reusability patterns.

## Related

[[Archetypes]] · [[Character]] · [[Quests]] · [[Factions]] · [[Congress]] · [[Authoring-Dialogue]] · [[Concept-Glossary]]
