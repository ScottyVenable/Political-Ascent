# Save File Format

Political Ascent save files are JSON documents persisted via `electron-store` (desktop) or `localStorage` (Android/web fallback).

The authoritative serialiser is [src/engine/SaveSystem.ts](../../src/engine/SaveSystem.ts). All call sites (Main Menu "Load Game", in-game "Save"/"Load" buttons) go through that module — never write to the bridge directly.

## Location

- **Windows:** `%APPDATA%/political-ascent/saves/`
- **macOS:** `~/Library/Application Support/political-ascent/saves/`
- **Linux:** `~/.config/political-ascent/saves/`
- **Android / browser:** `localStorage` keys prefixed `pa:save:`.

## Top-level shape (schema v1)

```jsonc
{
  "meta": {
    "schemaVersion": 1,
    "savedAt": 1738348740000,        // ms since epoch
    "name": "Just before the vote",   // player-supplied, max 60 chars
    "characterName": "Jordan Reyes",
    "scenarioId": "modern-america-2024",
    "weekLabel": "2025 \u00b7 W12",
    "developer": false                // true if dev mode was enabled at save
  },
  "stores": {
    "game":      { /* GameState snapshot, no actions */ },
    "character": { /* CharacterState snapshot, no actions */ },
    "world":     { /* WorldState snapshot, no actions */ }
  }
}
```

The slot id (e.g. `slot-1738348740000-a1b2`) is the storage key, not part of the payload. The Electron bridge wraps the payload in `{ version, savedAt, payload }` for IPC; the renderer transparently unwraps it on read.

## Developer-mode tagging

Saves taken while `useDevStore.enabled === true` carry `meta.developer = true`. The Load UI surfaces a `DEV` chip on those rows so a player who experimented with cheats does not accidentally resume them in their main run.

## Migration

The current schema version is `1`. Loader contract:

- Read raw payload from storage.
- If `meta.schemaVersion !== SAVE_SCHEMA_VERSION`, refuse the load with a clear `reason` string. (No migrations exist yet — added when v2 ships.)
- Apply payload via `useGameStore.setState(..., true)`, etc., so stale keys from the previous run do not bleed through.

Never remove a migration step. Back-compat is enforced.
