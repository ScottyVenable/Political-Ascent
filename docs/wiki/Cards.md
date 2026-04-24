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

## TODO

- Document deck composition rules per scenario.
- List card categories once stabilized.

See also [[Events]], [[Legislation]].
