# Cards

Cards are the action surface for the player between formal legislative
moves: press events, fundraisers, favours, scandals, donor meetings.

## Lifecycle

- Draw: drawn from a deck weighted by context.
- Play: costs Political Capital and/or other resources.
- Resolve: effects apply, the card goes to discard.
- Reshuffle: on deck exhaustion.

## Design notes

- Card definitions are data (`src/data/cards/*.json`).
- The deck engine is deterministic using the seeded RNG.

## Rarity tiers

Every card has a `rarity` field. Rarity drives drop weights inside packs,
visual frame treatment, and (where applicable) per-game limits.

| Rarity | Frame colour | Notes |
|---|---|---|
| Common | Slate grey | Day-to-day actions; unlimited reuse subject to cooldown. |
| Uncommon | Teal | Stronger effects; modest cooldown. |
| Rare | Steel blue | Faction-defining moves. |
| Epic | Royal purple | Multi-step plays — coalitions, sabotage, floor takeovers. |
| Legendary | Gold (animated shimmer) | Once-per-campaign-defining moments. |
| Prismatic | Animated conic-gradient | Wild cards. Typically 1 use per game. |

## Card stats

Cards may carry an optional `stats` block:

- `power` — abstract effect magnitude (used by tooltips and tuning).
- `cooldownWeeks` — minimum gap between plays.
- `usesPerGame` — hard cap on plays in a single campaign.
- `level` — required character level.
- `factionAffinity` / `factionBonusMultiplier` — bonus when played by an aligned faction member.

## Card packs

The Collection screen exposes a pack store. Packs are deterministic per
seed: the same seed always opens the same five cards.

| Pack | Slots | Guarantees |
|---|---|---|
| Starter | 5 | 1× uncommon-or-better |
| Precinct | 5 | 2× uncommon-or-better |
| Press Cycle | 5 | 1× rare-or-better |
| Legislative | 5 | 1× epic-or-better |

The pack opens with a shake → burst → reveal animation. Reduced-motion
users see the cards arrive without the motion sequence.

See also [[Events]], [[Legislation]].
