# Jesse Portfolio

Working portfolio for **Jesse** — Repository Manager and Community Coordinator. Holds backlog audits, board snapshots, taxonomy plans, and release-note drafts before they land on canonical files under `.github/`, in issues, or in release notes.

- Agent file: [../../agents/Jesse.agent.md](../../agents/Jesse.agent.md)
- Team map: [../../TEAM.md](../../TEAM.md)

## Structure

| Subfolder | Purpose |
|---|---|
| `audits/` | Backlog hygiene audits, field-gap reports, label drift analyses. |
| `board-snapshots/` | Project-board snapshots, milestone burn-down notes, status reports. |
| `release-notes/` | Release-note drafts before promotion to `docs/changelogs/`. |
| `taxonomies/` | Label / milestone / discussion-category proposals and migration plans. |
| `images/` | Board screenshots, chart exports (rare). |

Subfolders are created on demand.

## File naming

- Audits: `audit-[topic]-[YYYY-MM-DD].md`.
- Snapshots: `snapshot-[scope]-[YYYY-MM-DD].md` or `.json`.
- Release notes: `release-[version].md`.
- Taxonomies: `taxonomy-[domain]-[YYYY-MM].md`.

## Working rules

- Canonical taxonomy lives in `.github/labels.md`, `.github/milestones.md`, etc. Portfolio holds drafts and audits.
- Apply scripts (under `scripts/`) consume plans from this portfolio when run live.
- Every deliverable header declares destination (canonical file, issue, release note).
- Sign all deliverables with `- Jesse`.
- No source-code edits.

## Promotion targets

| Type | Destination |
|---|---|
| Label / milestone changes | `.github/labels.md`, `.github/milestones.md` (via PR + sync script) |
| Release notes | `docs/changelogs/<stream>/` |
| Issue-body unification | applied via `scripts/apply-issue-unification.ps1` |

_Maintained by Jesse._
