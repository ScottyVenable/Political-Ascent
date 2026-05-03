# Modding Guide

> **GDD reference:** §9 (Modding & Extensibility)
> **Implementation status:** Partial (mod loader sandboxing post-1.0)
> **Last reviewed:** 2026-05-02 (Vex, GDD v0.4-DRAFT)

## Overview

Political Ascent is designed to be modded. Most modding does not require writing code — it requires writing JSON that matches the game's schemas. Events, cards, scenarios, quests, traits, legislation templates: all are data files you can add to or override.

## Player-Facing Summary

If you can write JSON, you can mod this game. Add a new event that fires during budget debates. Create a card that reflects your favourite historical figure's rhetorical style. Author an entirely new scenario set in a different era. The engine loads your data alongside the base game; matching IDs override, new IDs extend.

## What You Can Mod Today

| Content type | Data location | Wiki reference |
|---|---|---|
| Events | `src/data/events/` | [[Events]], [[Authoring-Scenarios]] |
| Cards | `src/data/cards/` | [[Cards]], [[Authoring-Cards]] |
| Quests | `src/data/quests/` | [[Quests]] |
| Scenarios | `src/data/scenarios/` | [[Scenarios]], [[Authoring-Scenarios]] |
| Legislation templates | `src/data/legislation/` | [[Legislation]] |
| Traits | `src/data/traits/traits.json` | [[Character]] |
| Achievements | `src/data/achievements/` | [[Achievements]] |
| Dialogue trees | `src/data/dialogue/` (planned M2) | [[Authoring-Dialogue]] |
| Speech fragments | `src/data/speech/` (planned M3) | [[Speech-Composer]] |

## Mod Folder Shape (Planned)

```
mods/
└── my-mod/
    ├── mod.json          ← manifest: name, version, author, deps
    ├── events/
    ├── cards/
    ├── scenarios/
    └── README.md
```

Override semantics: matching `id` overrides base content. Loader processes base data first, then mods in dependency order, then user-local overrides.

> **Note:** Mod manifest validation and dependency resolution are post-1.0 features (GDD §9). Until then, mods are loaded as raw data files.

## Rules of Thumb

- Every content file declares `$schemaVersion`.
- Types are defined in `src/types/` — check yours before shipping.
- No code in content files; no content in code files.
- The same `applyEffect` dispatcher handles card, event, quest, and achievement effects — the schema is consistent across all of them.

## Full Authoring References

- [[Authoring-Cards]] — card JSON shape, rarity tiers, effect schema
- [[Authoring-Dialogue]] — dialogue node shape, requirement gates, voice conventions (M2)
- [[Authoring-Scenarios]] — full scenario data bundle, NPC seeds, population and economy starting values

Developer reference: [`docs/guides/MODDING.md`](https://github.com/ScottyVenable/Political-Ascent/blob/development/docs/guides/MODDING.md)

Save format reference: [[Save-Format]] (wiki) · [`docs/guides/SAVE_FORMAT.md`](https://github.com/ScottyVenable/Political-Ascent/blob/development/docs/guides/SAVE_FORMAT.md) (full technical spec)

## Related

[[Authoring-Cards]] · [[Authoring-Dialogue]] · [[Authoring-Scenarios]] · [[Save-Format]] · [[Contributing]] · [[Voice-and-Tone]]
