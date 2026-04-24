# Save File Format

Political Ascent save files are JSON documents persisted via `electron-store` (desktop) or `localStorage` (Android/web fallback).

## Location

- **Windows:** `%APPDATA%/political-ascent/saves/`
- **macOS:** `~/Library/Application Support/political-ascent/saves/`
- **Linux:** `~/.config/political-ascent/saves/`
- **Android:** app-private sandbox via Capacitor Preferences.

## Top-level shape

```jsonc
{
  "saveVersion": 1,
  "metadata": {
    "slot": "slot-1",
    "characterName": "Jordan Reyes",
    "scenarioId": "modern-america-2024",
    "playtimeSeconds": 7420,
    "savedAt": "2025-01-31T18:44:00Z"
  },
  "game": { /* GameState snapshot */ },
  "character": { /* CharacterState snapshot */ },
  "world": { /* WorldState snapshot */ }
}
```

## Migration

Each save carries a `saveVersion`. Loader chain:

```
v1 → migrate() → v2 → migrate() → vN
```

Never remove a migration step. Back-compat is enforced.
