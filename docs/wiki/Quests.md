# Quests

Quests are multi-stage narrative arcs with explicit objectives and
rewards. They sit above [[Events]] and below the scenario.

## Structure

- **Stages** — ordered; each has objectives.
- **Objectives** — game-state predicates.
- **Rewards** — effects applied on stage or quest completion.
- **Branches** — optional alternate paths.

## Design notes

- Quest definitions live in `src/data/quests/*.json`.
- Quests can be started by events, by player action, or by scenario.

## TODO

- Document the branching DSL.
- Enumerate quest families.

See also [[Events]], [[Scenarios]].
