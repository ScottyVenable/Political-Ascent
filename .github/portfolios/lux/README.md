# Lux Portfolio

Working portfolio for **Lux** — Visuals & Art Direction Lead.

- Agent file: [../../agents/Lux.agent.md](../../agents/Lux.agent.md)
- Team map: [../../TEAM.md](../../TEAM.md)
- Reference inputs (from Robert): [../robert/images/](../robert/images/)

## Structure

| Subfolder | Purpose |
|---|---|
| `style-guides/` | Master visual style guide, color palettes, typography, motif rules, do's/don'ts. |
| `ui/` | UI/UX briefs, wireframe descriptions, panel specs, interaction grammar, state matrices. |
| `characters/` | Character visual briefs (silhouette, color, costume, expression range). |
| `environments/` | Environment / setting visual briefs and mood notes. |
| `vfx/` | VFX briefs and visual feedback rules. |
| `images/` | Mood boards, palette swatches, exports, annotated references. |

Subfolders are created on demand. An empty subfolder is fine; commit a `.gitkeep` if needed.

## File naming

- Style guides / specs: `[topic]-[descriptor].md` (e.g. `style-guide-main.md`, `ui-hud-main-flow.md`).
- Color: `palette-[name].hex` or embedded in the style guide.
- Asset briefs: `[domain]-[name]-brief.md` (e.g. `character-hero-brief.md`).
- Images: `[topic]-[descriptor].[ext]`.

## Working rules

- Pull references from `../robert/images/` before starting a brief — do not duplicate; link instead.
- Every deliverable header must declare destination once final (e.g. `Handoff to Sol for implementation` or `Promote to docs/design/`).
- Sign all deliverables, comments, and handoffs with `- Lux`.
- Do not commit final art assets here — this portfolio holds direction and specifications. Final assets land in their downstream destination after Sol implementation.

## Promotion targets

| Type | Destination |
|---|---|
| Master style guide | `docs/design/visual-style-guide.md` |
| UI/UX specs | `docs/design/ui/` |
| Reference images for general use | `docs/reference images/UI-UX/` |
| Asset briefs handed to Sol | tracked via issue, no separate doc destination |

_Maintained by Lux. Indexed by Jesse._
