# .github/ — Repository Configuration Index

This folder holds all GitHub-specific configuration for **Political Ascent**.

## What lives where

| Location | Contents |
|---|---|
| `.github/` (root) | GitHub-required files: `CODEOWNERS`, `PULL_REQUEST_TEMPLATE.md`, `CODE_OF_CONDUCT.md`, `CONTRIBUTING.md`, `copilot-instructions.md`, `labels.md`, `milestones.md` |
| `.github/workflows/` | GitHub Actions CI/CD pipelines |
| `.github/ISSUE_TEMPLATE/` | Issue form templates |
| `.github/agents/` | Agent definition files (`.agent.md`) for Copilot/AI specialist agents |
| `.github/portfolios/` | Per-agent working portfolios — one subfolder per specialist |
| `.github/team/` | Agent correspondence, handoffs, and working notes |
| `.github/team/audits/` | Issue audit artefacts: snapshots, unification plans, dryrun logs, project-board exports |
| `.github/team/research/` | Research packets distributed to each specialist |
| `.github/specs/` | Planning and design specs: CI specs, runbooks, board setup guides, style guides, seed-issue definitions |

## Key files at root

- **`labels.md`** — canonical label taxonomy; consumed by `scripts/sync-labels.ps1`
- **`milestones.md`** — milestone definitions; consumed by `scripts/sync-milestones.ps1`
- **`copilot-instructions.md`** — global Copilot agent instructions
- **`PULL_REQUEST_TEMPLATE.md`** — default PR description template

## Cross-reference notes

- `scripts/apply-issue-unification.ps1` writes logs to `.github/team/audits/issue-unification-logs/`
- `wiki-ci.yml` watches `.github/specs/wiki-ci-spec.md` and `.github/specs/wiki-push-checklist.md`
- `branch-reorg-runbook.md` is in `.github/specs/` (previously at root; referenced in repo memory)
