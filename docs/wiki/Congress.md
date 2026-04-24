# Congress

Congress is the assembly of members whose votes decide legislation.

## What you can do

- Inspect a member: party, faction, state/district, issue positions, mood.
- Whip: spend Political Capital to shift a member's vote probability.
- Horse-trade: offer or accept amendments that shift probabilities in
  exchange for future support.

## Design notes

- Members are data-driven (`src/data/members/*.json`).
- Voting uses a seeded RNG against a per-member probability derived
  from their ideology vector and the bill's provisions.

## TODO

- Visualize the chamber layout in the UI.
- Document party-discipline modifiers.

See also [[Legislation]], [[Population]].
