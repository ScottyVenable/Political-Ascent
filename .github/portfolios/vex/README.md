# Vex Portfolio

Working portfolio for **Vex** — Content & Lore Architect. Holds narrative drafts, dialogue work, lore bibles, and content-table proposals before promotion to `src/data/`, `docs/wiki/`, or `docs/about/`.

- Agent file: [../../agents/Vex.agent.md](../../agents/Vex.agent.md)
- Team map: [../../TEAM.md](../../TEAM.md)

## Structure

| Subfolder | Purpose |
|---|---|
| `narrative/` | Story arcs, scenario beats, campaign frames, faction narratives. |
| `dialogue/` | Dialogue trees, NPC voice studies, branch drafts. |
| `lore/` | Worldbuilding, factions, history, ideology, tone bibles. |
| `content-tables/` | Card/event/news draft tables before they land in `src/data/`. |
| `images/` | Tone references, character sketches (when sourced from Robert), annotated boards. |

Subfolders are created on demand.

## File naming

- Narrative pieces: `[arc]-[descriptor].md`.
- Dialogue: `dialogue-[scenario].md`.
- Lore: `lore-[topic].md`.
- Content tables: `content-[domain]-[YYYY-MM].md`.

## Working rules

- Pull tone/setting references from `../robert/` — link, don't duplicate.
- Every deliverable header declares destination once final (e.g. `Promote to src/data/cards/` or `Promote to docs/wiki/Lore.md`).
- Schema changes flag back to Sol; do not edit schema directly.
- Sign all deliverables with `- Vex`.

## Promotion targets

| Type | Destination |
|---|---|
| Lore / setting docs | `docs/wiki/`, `docs/about/` |
| Content tables (when schema is stable) | `src/data/` (via PR) |
| Promoted narrative reference | `docs/design/` |

_Maintained by Vex. Indexed by Jesse._
