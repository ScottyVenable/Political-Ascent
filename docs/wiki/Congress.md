# Congress

Congress is the assembly of members whose votes decide legislation.

## What you can do

- Inspect a member: party, state/district, relationship, personality,
  ideology label, age, gender, net worth, priorities, sponsorship count,
  and recent voting history.
- Filter the active chamber by party, state, ideology bucket,
  personality, gender, age, and wealth.
- Sort members by name, state, relationship, vote count, age, wealth, or
  sponsored-bill count.
- Whip: spend Political Capital to shift a member's vote probability.
- Horse-trade: offer or accept amendments that shift probabilities in
  exchange for future support.

## Ideology labels

Each member still stores ideology as a two-axis compass point because
the simulation needs exact `x`/`y` values for voting math. The UI does
not expose those raw coordinates in the member tooltip or modal. It
converts them into the same readable labels used by the player ideology
compass:

- **Centrist** when both axes sit near the origin.
- **Left** / **Right** when only the economic axis is meaningfully away
  from centre.
- **Authoritarian** / **Libertarian** when only the social-authority
  axis is meaningfully away from centre.
- Compound labels such as **Right-Libertarian** or
  **Left-Authoritarian** when both axes matter.
- Intensity prefixes such as **Moderate** and **Strong** for low or high
  axis magnitude.

## Design notes

- Members are generated deterministically by `CongressSystem` for the
  current scenario, with JSON-backed member/NPC definitions planned.
- Voting uses a seeded RNG against a per-member probability derived
  from their ideology vector and the bill's provisions.

## TODO

- Document party-discipline modifiers.
- Replace generated members with JSON-backed NPC/member definitions once
  todo #90 lands.

See also [[Legislation]], [[Population]].
