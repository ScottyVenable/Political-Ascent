# Save Format

> **GDD reference:** §5.2, §5.3
> **Implementation status:** Implemented (schema v1; v2 planned M2)
> **Last reviewed:** 2026-05-02 (Vex, GDD v0.4-DRAFT)

This is the player- and modder-facing summary of the save format. For the full technical specification, see [`docs/guides/SAVE_FORMAT.md`](https://github.com/ScottyVenable/Political-Ascent/blob/development/docs/guides/SAVE_FORMAT.md).

---

## Overview

Save files are JSON. They capture a complete snapshot of the game state — your character, the world, all active bills, all NPC relationships, all flags — at a moment in time. Loading a save restores the simulation to that exact state, including all deterministic randomness.

## What a Save Contains

A Political Ascent save file (`schema v1`) contains:

```json
{
  "meta": {
    "schemaVersion": 1,
    "savedAt": 1738348740000,
    "name": "Just before the vote",
    "characterName": "Jordan Reyes",
    "scenarioId": "modern-america-2024",
    "weekLabel": "2025 · W12",
    "developer": false
  },
  "stores": {
    "game":      "...",
    "character": "...",
    "world":     "..."
  }
}
```

- **meta** — the slot display info: name, character, scenario, when it was saved
- **game** — the time state: current date, AP, PC, treasury, game-over flags
- **character** — your stats, traits, ideology, XP, skill unlocks, card hand and deck
- **world** — the scenario, economy, population groups, congress members, relationships, leverage, active events, quests, news history, world flags, achievements

Settings and developer-mode state are saved separately and survive across games.

## Where Saves Live

| Platform | Location |
|---|---|
| Windows | `%APPDATA%\political-ascent\saves\` |
| macOS | `~/Library/Application Support/political-ascent/saves/` |
| Linux | `~/.config/political-ascent/saves/` |
| Android | `localStorage` (WebView), keys prefixed `pa:save:*` |

## Save Slots

Each save is identified by a slot id (`slot-<savedAt>-<hash>`). The game supports multiple save slots per campaign. Overwriting a save does not delete the previous slot — it creates a new one. You manage slots from the Save/Load screen.

## Schema Versions and Migrations

When the save format changes — new systems, new state fields — the `schemaVersion` number increments. The game will detect an older save and apply migration steps automatically. It will not silently corrupt old saves: if a migration is not available, you will be told clearly.

**Current version:** 1  
**Next planned bump:** v2 at M2 (adds Faction standings and Dialogue progress)

If you are a modder adding new persistent state, coordinate schema version bumps with the development team before shipping. See [MODDING.md](https://github.com/ScottyVenable/Political-Ascent/blob/development/docs/guides/MODDING.md).

## For Modders

Mods that add new persistent state should:

1. Use a unique key prefix to avoid collisions with base game state
2. Document the schema version their state requires
3. Include a migration function for any breaking shape changes

The save fixture corpus (shipping at M4) will include test saves at each schema version to catch regression.

---

## Related

[[Modding-Guide]] · [[Getting-Started]] · [[Concept-Glossary]]
