# Character

> **GDD reference:** §4.7, §12.3 (archetypes)
> **Implementation status:** Implemented (trait JSON migration partial; full migration M5)
> **Last reviewed:** 2026-05-02 (Vex, GDD v0.4-DRAFT)

## Overview

You play one person. Everything else in the simulation reacts to who that person is and what they choose to do with the tools available to them.

## Player-Facing Summary

Your character is a senator: a background, six stats, a handful of traits, an ideology, and a home state. None of these are cosmetic. A high Connections score changes which cards you draw. A low Integrity score changes which events you trigger. Your ideology compass position gates dialogue options and determines which factions start warm to you. Your background gave you a family of archetypes to grow into — your choices in play determine whether you grow into them or away from them.

## How It Works (GDD §4.7)

### Backgrounds

| Background | Starting archetype family | Stat bonuses |
|---|---|---|
| Citizen | Reform Idealist, Principled Dissenter | +Charisma, +Integrity |
| Veteran | Machine Boss, Old Guard Survivor, Backbencher Loyalist | +Strategy, +Stamina |
| Executive | Donor Whisperer, Media Operator, Shadow Power | +Connections, +Wealth |

See [[Archetypes]] for the full archetype catalogue.

### Stats

Six attributes, each ranging 1–10:

| Stat | What it affects |
|---|---|
| **Charisma** | Speech effectiveness; PC generation modifier; media-card power |
| **Strategy** | Legislation planning bonuses; coalition-building dialogue gates |
| **Connections** | PC generation via ally networks; dialogue gates; card draw quality |
| **Integrity** | Scandal resistance; gates morality-gated dialogue options; visible to factions |
| **Wealth** | Personal finance actions; some donor and fundraiser cards |
| **Stamina** | Action Point pool; some endurance-related events |

### Traits

Traits are acquired at character creation and during play. They add mechanical effects (stat bonuses, card unlocks, dialogue gates) and characterise the player's archetype identity.

- **Native traits:** assigned by background; always present
- **Creation picks:** chosen from the universal pool at game start
- **Acquired traits:** added during play through events, quests, and achievements

Trait definitions are data-driven (`src/data/traits/traits.json`). Migration from inline TypeScript to full JSON is in progress and will complete at M5.

### Ideology

A two-axis compass in `[−1, 1]` on each axis (economic left-right, social authoritarian-libertarian). Your ideology position gates some event options and dialogue options, and influences which factions start with positive standings toward you. It drifts based on your choices if certain events or dialogue paths are taken.

### Skill Tree

Six branches: Charisma, Strategy, Connections, Integrity, Stamina, Wealth. Spend skill points (earned from XP) to unlock nodes in each branch. Nodes open new cards, improve stat ceilings, or gate advanced content. See [[Skills]].

### Personal Finances

Personal funds are the character's private money — distinct from Political Capital and campaign Treasury.

| Finance action | Source |
|---|---|
| Salary + reimbursements | Reliable weekly income; scaled by Wealth and background |
| Paid speaking circuit | Income from Charisma and Connections |
| Liquidate assets | Larger Wealth-heavy injection |
| Self-fund campaign | Moves personal funds into campaign Treasury |

## Key Terms

| Term | Definition |
|---|---|
| **Background** | Starting archetype template; sets initial stat bonuses and native traits |
| **Trait** | A named modifier with mechanical effects; see [[Concept-Glossary]] |
| **Ideology** | Two-axis compass; gates content and faction standing |
| **Political Capital (PC)** | Spend currency; generated partly from character stats |
| **Action Points (AP)** | Weekly action budget; size influenced by Stamina |
| **Skill tree** | Six branches of unlockable node upgrades; see [[Skills]] |

## Related Systems

- [[Skills]] — the skill tree branches and node effects
- [[Influence-and-Reputation]] — how character stats feed Political Capital generation
- [[Factions]] — ideology and traits affect faction starting standings
- [[Dialogue]] — stat and trait gates on dialogue options (M2)
- [[Cards]] — character level and traits gate certain cards

## Modding Hooks (GDD §9)

Background definitions are in `src/data/` (migration in progress). Trait definitions are in `src/data/traits/traits.json`. Custom scenarios can reference custom trait IDs. See [MODDING.md](https://github.com/ScottyVenable/Political-Ascent/blob/development/docs/guides/MODDING.md).

## Related

[[Skills]] · [[Archetypes]] · [[Influence-and-Reputation]] · [[Dialogue]] · [[Cards]] · [[Concept-Glossary]]
