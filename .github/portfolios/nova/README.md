# Nova Portfolio

Working portfolio for **Nova** — Gameplay Systems & Balancing Lead. Holds in-progress system specifications, balancing models, and tuning data before promotion to `docs/design/systems/` or handoff to Sol for implementation.

- Agent file: [../../agents/Nova.agent.md](../../agents/Nova.agent.md)
- Team map: [../../TEAM.md](../../TEAM.md)
- Reference inputs (from Robert): [../robert/](../robert/)

## Structure

| Subfolder | Purpose |
|---|---|
| `systems/` | Core gameplay system specs (state machines, feedback loops, cross-system interactions). |
| `mechanics/` | Individual mechanic specs (combat moves, abilities, action verbs). |
| `progression/` | Progression trees, skill systems, meta-progression, retention curves. |
| `combat/` | Combat loop specs, damage models, encounter pacing. |
| `economy/` | Economy models, resource sinks/sources, reward schedules. |
| `balance/` | Balancing passes, tuning notes, sensitivity analyses, change logs. |
| `difficulty/` | Difficulty curves, onboarding flows, pacing models. |
| `data/` | Supporting tables, formulas, simulation outputs (CSV / JSON / MD tables). |
| `images/` | Diagrams, charts, state machines, curve plots. |

Subfolders are created on demand. Empty placeholders use `.gitkeep`.

## File naming

- System specs: `[system]-[descriptor].md` (e.g. `combat-core-loop.md`, `progression-tree-v1.md`).
- Balancing docs: `balance-[topic]-[YYYY-MM].md` (e.g. `balance-economy-2026-05.md`).
- Data tables: `data-[topic].md` or `[topic].json`.
- Images: `[topic]-[descriptor].[ext]`.

## Working rules

- Pull research from `../robert/` before drafting a spec — link, don't duplicate.
- Every deliverable header must declare destination once final (e.g. `Handoff to Sol for implementation` or `Promote to docs/design/systems/`).
- Include **Design Intent**, **Mathematical Model**, **Edge Cases**, **Implementation Notes**, **Verification Checklist**, **Balance Targets** in every major spec.
- Sign all deliverables, comments, and handoffs with `- Nova`.
- Do not commit code — specs only. Implementation handoff goes to Sol.

## Promotion targets

| Type | Destination |
|---|---|
| Master systems overview | `docs/design/systems/overview.md` |
| Promoted system specs | `docs/design/systems/` |
| Balancing reports for release | tracked via issue + changelog |
| Specs handed to Sol | tracked via issue, no separate doc destination |
| Specs handed to Rook (balance tests) | tracked via issue |

_Maintained by Nova. Indexed by Jesse._
