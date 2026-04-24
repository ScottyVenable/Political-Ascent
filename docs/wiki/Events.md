# Events

Events are narrative beats that the engine surfaces based on conditions.

## Anatomy

- **Trigger** — a predicate over game state.
- **Cooldown / uniqueness** — prevents spam.
- **Options** — player choices, each with effects and requirements.
- **Follow-ups** — optional chained events.

## Design notes

- Definitions live in `src/data/events/*.json` with a matching
  TypeScript interface under `src/types/`.
- Events may draw from decks ([[Cards]]) or push to [[Quests]].

## TODO

- Document predicate DSL.
- Catalogue current event families.

See also [[Cards]], [[Quests]].
