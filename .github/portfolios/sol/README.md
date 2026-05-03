# Sol Portfolio

Working portfolio for **Sol** — Co-Creative Director and Lead Programmer. Holds technical design notes, architecture sketches, refactor plans, and prototype experiments that precede production code under `src/`.

- Agent file: [../../agents/Sol.agent.md](../../agents/Sol.agent.md)
- Team map: [../../TEAM.md](../../TEAM.md)

## Structure

| Subfolder | Purpose |
|---|---|
| `architecture/` | System diagrams, module boundaries, dependency notes, ADR drafts. |
| `specs/` | Technical specs, interface contracts, data-shape proposals before code lands. |
| `prototypes/` | Throwaway exploration notes and prototype write-ups (not production code). |
| `refactors/` | Refactor plans, migration strategies, deprecation paths. |
| `images/` | Architecture diagrams, sequence diagrams, screenshots of in-progress surfaces. |

Subfolders are created on demand.

## File naming

- Architecture / ADRs: `adr-[NNNN]-[slug].md` or `arch-[topic].md`.
- Specs: `spec-[topic].md` (e.g. `spec-save-migration-v3.md`).
- Refactor plans: `refactor-[area]-[YYYY-MM].md`.

## Working rules

- Portfolio holds design-time artifacts. Production code lands in `src/`, `scripts/`, or workflow files via PR.
- Every deliverable header declares destination once final (e.g. `Promote to docs/ARCHITECTURE.md` or `Reference for PR #NNN`).
- Sign deliverables with `- Sol`.
- Inputs from Lux (visual specs) and Nova (system specs) are linked, not copied.

## Promotion targets

| Type | Destination |
|---|---|
| Architecture decision records | `docs/ARCHITECTURE.md` (sectioned) or `docs/adr/` if formalized |
| Implementation | merged PR into `development` |
| Long-form technical guides | `docs/guides/` |

_Maintained by Sol. Indexed by Jesse._
