# Modding Guide

Political Ascent content is data-driven. Most modding does not require
code; it requires writing JSON that matches our schemas.

## Start here

- Developer guide: [`docs/guides/MODDING.md`](https://github.com/ScottyVenable/Political-Ascent/blob/development/docs/guides/MODDING.md)
- Save format reference: [`docs/guides/SAVE_FORMAT.md`](https://github.com/ScottyVenable/Political-Ascent/blob/development/docs/guides/SAVE_FORMAT.md)

## Mod-friendly surfaces

- [[Events]] definitions
- [[Cards]] definitions
- [[Quests]] definitions
- [[Scenarios]]
- [[Skills]]
- Character traits and backgrounds

## Rules of thumb

- Every content file declares `$schemaVersion`.
- Types are defined in `src/types/` — cross-check yours before shipping.
- No code in content files; no content in code files.

## TODO

- Publish a worked example mod.
