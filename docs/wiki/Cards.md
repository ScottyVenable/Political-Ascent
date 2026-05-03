# Cards

> **GDD reference:** §4.6
> **Implementation status:** Implemented (card hand drawer not yet shipped)
> **Last reviewed:** 2026-05-02 (Vex, GDD v0.4-DRAFT)

## Overview

Cards are the action layer between formal legislative moves. A press event. A donor meeting. A favour called in. A sabotage. They supplement the core loop — they do not replace it. Cards are what you do while a bill sits in committee.

## Player-Facing Summary

You hold a hand drawn from your deck. Each card costs Political Capital to play. Some cost Action Points too. The effects are immediate and tracked — a fundraiser card increases treasury, a whip card shifts a vote probability, a scandal card sets a flag the engine will remember. The deck is deterministic: given the same seed, you draw the same cards. But the right card at the right moment is still a decision.

## How It Works (GDD §4.6)

**Play pipeline:**
1. Select the card from your hand
2. The system validates your Political Capital (and Action Point) cost
3. Costs are spent
4. Effects route through `applyEffect` — the same dispatcher used by legislation, events, and quests
5. The card moves to discard; the hand refills from the deck

**Deck mechanics:** drawing is deterministic given a seed. The card pack engine is pure — the same seed always produces the same five cards from a pack. This is a requirement for save-restore parity.

**Card hand drawer:** the persistent hand surface in the bottom bar is on the backlog. Until it ships, the hand is accessible via the Cards Panel.

## Rarity Tiers

| Rarity | Frame | Drop weight | Notes |
|---|---|---|---|
| Common | Slate grey | High | Day-to-day actions; no per-game limit |
| Uncommon | Teal | Medium | Stronger effects; modest cooldown |
| Rare | Steel blue | Low | Faction-defining moves |
| Epic | Royal purple | Very low | Multi-step plays (coalitions, sabotage, floor takeovers) |
| Legendary | Gold | Rare | Once-per-campaign moments |
| Prismatic | Animated conic-gradient | Very rare | Wild cards; typically 1 use per game |

## Card Stats

A card's `stats` block (optional) carries:

| Stat | Meaning |
|---|---|
| `power` | Abstract effect magnitude (used in tooltips and tuning) |
| `cooldownWeeks` | Minimum gap between plays |
| `usesPerGame` | Hard cap on plays in a single campaign |
| `level` | Required character level |
| `factionAffinity` | Faction bonus context |

## Card Packs

| Pack | Slots | Guarantee |
|---|---|---|
| Starter | 5 | 1× uncommon-or-better |
| Precinct | 5 | 2× uncommon-or-better |
| Press Cycle | 5 | 1× rare-or-better |
| Legislative | 5 | 1× epic-or-better |

Packs are deterministic per seed: the same seed always opens the same five cards. Reduced-motion users see cards arrive without the animation sequence.

## Examples

> *"Smile for the cameras. Shake every hand."* — a common Press Event card that costs 5 PC and increases approval with all cohorts by +2.

> *"The check clears. The question of why it was written never does."* — a rare Donor Card that raises treasury by $50k and sets the `donor-obligation` flag.

## Related Systems

- [[Influence-and-Reputation]] — Political Capital is the primary card cost
- [[Character]] — character level and traits gate certain cards
- [[Events]] — events can grant cards; cards can trigger events
- [[Quests]] — quest rewards may include card draws or card upgrades

## Modding Hooks (GDD §9)

Card definitions live in `src/data/cards/`. Each card references the `CardDefinition` type shape with `effects`, `cost`, `rarity`, `cooldownWeeks`, and optional `requires`. See [[Authoring-Cards]] and [MODDING.md](https://github.com/ScottyVenable/Political-Ascent/blob/development/docs/guides/MODDING.md).

## Related

[[Influence-and-Reputation]] · [[Character]] · [[Events]] · [[Quests]] · [[Authoring-Cards]] · [[Concept-Glossary]]
