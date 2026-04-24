# Modding

All game content lives as JSON in `src/data/` at build time, and is extensible at runtime via `mods/`.

## Mod structure

```
mods/
└── my-mod/
    ├── mod.json          Mod manifest (name, version, author, deps)
    ├── events/
    ├── cards/
    ├── scenarios/
    └── README.md
```

## Mod manifest

```json
{
  "id": "my-mod",
  "name": "My Mod",
  "version": "0.1.0",
  "author": "Your Name",
  "description": "What this mod adds.",
  "dependencies": []
}
```

## Overriding vs. adding

- **Add:** use a new unique `id`.
- **Override:** use the same `id` as the base game content; last-loaded mod wins.
- **Extend:** population groups and factions merge additively.

## Data formats

See `docs/guides/schemas/` for JSON Schema definitions (forthcoming post-MVP).
