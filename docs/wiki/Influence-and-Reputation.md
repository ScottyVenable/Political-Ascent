# Influence and Reputation

> **GDD reference:** §4.10, §4.11
> **Implementation status:** Implemented (Faction module designed M2)
> **Last reviewed:** 2026-05-02 (Vex, GDD v0.4-DRAFT)

## Overview

Political Capital is the currency of persuasion. Leverage is the currency of coercion. Reputation is what happens to both of them over time.

## Player-Facing Summary

Political Capital arrives weekly and disappears quickly. Spend it on whip actions, card plays, and expedited stages. It measures how much goodwill you have built and how much room you have to call in favours. Leverage is different. Leverage is quiet, hidden, and dangerous to use — spending it shifts a vote, but it costs your Integrity, and the person you leveraged remembers.

## How It Works (GDD §4.10)

### Political Capital (PC)

**Weekly generation formula:**

```
gain = clamp(charisma × 0.8 + alliesCount + groupLoyaltyMean / 20, 0, 60)
```

- **Charisma stat** — the direct multiplier on base PC generation
- **Allies count** — legislators with relationship > 50 contribute to the ally count
- **Group loyalty mean** — the average loyalty score across all population cohorts with loyalty > 50

PC caps at the formula ceiling each week; unused PC does not roll over beyond the cap.

**Spending PC:**
- Whip actions on individual legislators (see [[Congress]])
- Card plays (see [[Cards]])
- Expediting a bill stage (see [[Legislation]])

### Leverage

Leverage is a hidden per-legislator resource representing information or obligation the player holds over a specific NPC.

- **Acquiring leverage:** through specific events, quest rewards, or certain card plays that set a leverage value on a legislator.
- **Spending leverage:** `spendLeverage(npcId, amount, relationshipDelta)` shifts the legislator's relationship score at the cost of your Integrity stat. The shift is larger than a whip action; the cost to Integrity is real.
- **Limit:** leverage is not infinite — once spent on a legislator, it must be re-earned.

Leverage is the dark-path tool. Use it when you need a vote you cannot earn honestly. Know that the Integrity cost accumulates.

### Faction Loyalty (Designed, M2)

Faction-level loyalty sits above individual legislator relationships. See [[Factions]] for the full design. Once the FactionSystem module ships (M2), faction loyalty will become a direct input to weekly PC generation alongside individual relationships.

## Key Terms

| Term | Definition |
|---|---|
| **Political Capital (PC)** | Primary spend currency for actions; generated weekly |
| **Action Points (AP)** | Weekly discrete-move budget; see [[Concept-Glossary]] |
| **Leverage** | Hidden per-NPC coercion resource; spending costs Integrity |
| **Allies count** | Legislators with relationship > 50; input to PC generation |
| **Integrity** | Character stat; reduced by leverage spending; see [[Character]] |

## Related Systems

- [[Congress]] — legislator relationships feed PC generation
- [[Population]] — cohort loyalty feeds PC generation
- [[Character]] — Charisma and Integrity stats are the primary inputs
- [[Factions]] — faction loyalty will join PC generation at M2
- [[Legislation]] — PC is spent on whip actions and expedited stages

## Related

[[Congress]] · [[Population]] · [[Character]] · [[Factions]] · [[Legislation]] · [[Concept-Glossary]]
