# Rook Portfolio

Working portfolio for **Rook** — QA & Release Engineer. Holds QA reports, repro notes, CI diagnostics, release-gate checklists, and screenshot evidence before they land on issues, PRs, or release notes.

- Agent file: [../../agents/Rook.agent.md](../../agents/Rook.agent.md)
- Team map: [../../TEAM.md](../../TEAM.md)

## Structure

| Subfolder | Purpose |
|---|---|
| `qa-reports/` | Verification reports, balance-test outcomes, a11y / perf audits. |
| `repros/` | Minimal deterministic repros for filed bugs. |
| `ci-diagnostics/` | CI failure analyses, root-cause notes, flaky-test investigations. |
| `release-checks/` | Release-gate checklists, packaging verification, RC sign-offs. |
| `images/` | Screenshot evidence, regression captures, annotated bug shots. |

Subfolders are created on demand.

## File naming

- QA reports: `qa-[topic]-[YYYY-MM-DD].md`.
- Repros: `repro-[issue-NNNN].md`.
- CI diagnostics: `ci-[workflow]-[YYYY-MM-DD].md`.
- Release checks: `release-[milestone]-[version].md`.

## Working rules

- Reports must include exact commands, file paths, line numbers, and pass/fail evidence.
- Every deliverable header declares destination (linked issue / PR / release note).
- Sign all reports with `- Rook`.
- No source-code authoring; defects flag back to Sol.

## Promotion targets

| Type | Destination |
|---|---|
| Bug repros | linked to issue body |
| Release-gate sign-offs | release notes + milestone close-out |
| Visual-regression evidence | PR comments |

_Maintained by Rook. Indexed by Jesse._
