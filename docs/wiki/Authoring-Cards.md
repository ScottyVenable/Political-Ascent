# Authoring Cards

> **GDD reference:** §4.6, §9 (Modding & Extensibility), §12.2 (Voice & Style)
> **Implementation status:** Implemented (card data JSON; hand drawer backlog)
> **Last reviewed:** 2026-05-02 (Vex, GDD v0.4-DRAFT)

This page is for modders and contributors authoring card content. For the player-facing overview, see [[Cards]].

---

## Data Location

Card definitions live in `src/data/cards/`. Each file contains an array of `CardDefinition` objects.

---

## Card Definition Shape

```jsonc
{
  "id": "card-fundraiser",
  "name": "Fundraiser Dinner",
  "description": "A quiet evening with very loud money.",
  "flavorText": "Smile for the cameras. Shake every hand.",
  "rarity": "common",
  "cost": { "pc": 5, "ap": 0 },
  "cooldownWeeks": 2,
  "usesPerGame": null,
  "level": 1,
  "policyTags": ["fundraising"],
  "factionAffinity": null,
  "effects": [
    { "type": "addResource", "resource": "treasury", "amount": 50000 },
    { "type": "addResource", "resource": "pc", "amount": 3 }
  ],
  "requires": null
}
```

---

## Field Reference

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string | Yes | Unique; kebab-case. Collisions override base content. |
| `name` | string | Yes | Title case; 1–5 words |
| `description` | string | Yes | One sentence; player-facing mechanical summary |
| `flavorText` | string | Yes | 8–16 words; a sharp image or wry observation (see [[Voice-and-Tone]]) |
| `rarity` | string | Yes | `common`, `uncommon`, `rare`, `epic`, `legendary`, `prismatic` |
| `cost.pc` | number | Yes | Political Capital cost to play |
| `cost.ap` | number | Yes | Action Points cost to play (0 if free) |
| `cooldownWeeks` | number | Yes | Minimum weeks between plays; 0 = no cooldown |
| `usesPerGame` | number or null | No | Hard cap; null = unlimited |
| `level` | number | Yes | Minimum character level required |
| `policyTags` | string[] | No | Links the card to population and legislation contexts |
| `factionAffinity` | string or null | No | Faction id for bonus multiplier |
| `effects` | Effect[] | Yes | See Effects section below |
| `requires` | Requirement or null | No | Gate on stat, trait, flag, or ideology |

---

## Effects Schema

All effects route through `applyEffect`. Supported types:

| Effect type | Fields | Result |
|---|---|---|
| `addResource` | `resource`, `amount` | Adds amount to `pc`, `ap`, `treasury`, or `personalFunds` |
| `modifyStat` | `stat`, `delta` | Adjusts a character stat by delta |
| `modifyRelationship` | `npcId`, `delta` | Adjusts relationship with a named NPC |
| `modifyGroupHappiness` | `groupId`, `delta` | Adjusts population cohort happiness |
| `setFlag` | `flag`, `value` | Sets a world state flag |
| `startQuest` | `questId` | Activates a quest |
| `unlockCard` | `cardId` | Adds a card to the player's deck |
| `modifyIntegrity` | `delta` | Adjusts the player's Integrity stat |

---

## Flavour Text Rules (GDD §12.2)

Flavour text is the hardest field to get right and the easiest to get wrong. Rules:

- **8–16 words.** One sharp image or one wry observation. Complete sentence not required.
- **No mechanical description.** Flavour text is not a second description line.
- **Era-appropriate.** A card for the Gilded Age scenario should not read like it was written in 2024.
- **No emoji, no social-media meta-language.**

Good:
> *"The check clears. The question of why it was written never does."*

Good:
> *"Forty-seven thousand bridges. You learned to count them."*

Bad:
> *"Use this card to gain Political Capital and improve your fundraising."*

---

## Rarity Guidelines

| Rarity | Appropriate for |
|---|---|
| Common | Everyday actions: press appearances, routine meetings, minor favours |
| Uncommon | Meaningful plays with a real cost and a real effect |
| Rare | Faction-defining moments; moves that reshape a relationship |
| Epic | Multi-stage political operations; coalition coups; sabotage arcs |
| Legendary | Once-per-campaign moments; the vote you will remember |
| Prismatic | Wild; narrative cards; effects that break the normal pattern |

Do not inflate rarity. A rare card that does what a common card does with a bigger number is bad design and will not be merged.

---

## Checklist Before Submitting a Card

- [ ] `id` is unique and kebab-case
- [ ] `name` is Title Case, 1–5 words
- [ ] `description` is one mechanical sentence
- [ ] `flavorText` is 8–16 words, in-world, era-appropriate
- [ ] `rarity` matches the actual power level
- [ ] All effects use the `applyEffect` schema
- [ ] No `console.log` or `Date.now()` calls in any accompanying code

---

## Related

[[Cards]] · [[Voice-and-Tone]] · [[Modding-Guide]] · [[Authoring-Scenarios]] · [[Concept-Glossary]]
