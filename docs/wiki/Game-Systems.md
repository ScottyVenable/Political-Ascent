# Game Systems

Political Ascent is composed of a handful of systems that tick on a
deterministic clock and feed a unified UI. Each system has its own page:

- [[Character]] — the player politician, traits, background
- [[Legislation]] — drafting, committees, floor votes
- [[Congress]] — chambers, members, whip actions
- [[Population]] — cohorts, mood, radicalism
- [[Economy]] — macro indicators, sectors, shocks
- [[Events]] — narrative beats with conditions and choices
- [[Cards]] — the action card deck
- [[Quests]] — multi-stage narrative arcs
- [[Skills]] — the skill tree
- [[Achievements]] — unlockable goals

## Architectural overview

The engine runs in pure TypeScript (`src/engine/` + `src/systems/`),
state lives in Zustand stores (`src/store/`), and React renders the
UI (`src/renderer/`). For a deeper technical tour see
[`docs/ARCHITECTURE.md`](https://github.com/ScottyVenable/Political-Ascent/blob/development/docs/ARCHITECTURE.md).
