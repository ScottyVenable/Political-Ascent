# Phase 1–4: GDD v0.4-DRAFT, roadmap, project tracking, wiki overhaul

> Draft PR — Sol's F-01 P0 determinism break (see `.github/sol-phase4-backlog.md` §F-01) is in scope to fix before this is marked ready.

## What this PR establishes

This PR lands the Phase 1–4 documentation, project-tracking, and ops work onto
the new `development` integration baseline. It is the first PR cut against the
new three-branch model (`development` / `alpha` / `stable`); see
`.github/branch-reorg-runbook.md` for the destructive operations the
maintainer still needs to run on GitHub.

## Scope

### Documentation rewrites

- **GDD v0.4-DRAFT** (`docs/GDD.md`) — Sol/Vex/Rook multi-pass rewrite: system
  inventory (§4), persistence (§5), determinism (§13.2), test pyramid
  (§13.1), promotion gates (§13.7.1), perf targets (§11), risk register
  (§14). +1678 / −612.
- **Roadmap** (`docs/ROADMAP.md`) — milestone-driven plan (M1 Cloakroom →
  M8 Quorum) derived from GDD §4 and Phase 4 backlog. Dependency graph and
  exit criteria included. +210 / −329 (rewrite, with previous structure
  archived as `ROADMAP.md.bak`).
- **Changelog** (`docs/about/CHANGELOG.md` + `docs/changelogs/`) —
  Keep-a-Changelog 1.1.0 layout. Per-stream folders carry per-tag entries;
  templates and READMEs added for each stream. Stream → branch mapping
  documented (development → `development`, experimental → `alpha`, stable →
  `stable`).

### GitHub tracking + agent model

- Issue forms: `a11y`, `bug`, `chore`, `content`, `feature`, `release`,
  `research`, `security`, `system`, `tech-debt` (legacy `bug_report.yml`,
  `feature_request.yml`, `docs_task.yml`, `ui_regression.yml` retired).
- Labels: 66-label taxonomy across `type:*`, `area:*`, `system:*`,
  `milestone:*`, `priority:*`, `status:*`, `stream:*`, meta. See
  `.github/labels.md`.
- Milestones M1–M8 specified in `.github/milestones.md`.
- Seed-issues catalogue (`.github/seed-issues.md`) covering 36 issues across
  all milestones.
- Project #9 board spec (`.github/project-board.md`).
- Five-role agent map: `Bridge`, `Sol`, `Jesse`, `Rook`, `Vex`, `Robert`.
  Replaces single `political-ascent-director.agent.md`.
- `CONTRIBUTING.md` and `CODE_OF_CONDUCT.md` added.
- Pull request template updated to cite the new branch model.

### Wiki overhaul (44 files)

- 23 new pages: `FAQ`, `Roadmap`, `Save-Format`, `Voice-and-Tone`,
  `Time-and-Pacing`, `Speech-Composer`, `Influence-and-Reputation`,
  `Factions`, `Dialogue`, `Archetypes`, `Authoring-{Cards,Dialogue,Scenarios}`,
  9 scenario pages.
- 21 revised pages including `Home`, `_Sidebar`, `_Footer`, `Cards`,
  `Character`, `Concept-Glossary`, `Congress`, `Contributing`,
  `Design-Research`, `Economy`, `Events`, `Game-Systems`, `Getting-Started`,
  `Legislation`, `Modding-Guide`, `Population`, `Quests`, `README`,
  `Release-Notes`, `Road-Ahead`, `Scenarios`, `Skills`, `Achievements`.
- Each page links to GDD section anchors.

### Ops + scripts

- `.github/wiki-push-checklist.md`, `.github/discussions-setup.md`,
  `.github/wiki-ci-spec.md`, `.github/issue-audit-checklist.md`.
- PowerShell scripts: `sync-labels.ps1`, `sync-milestones.ps1`,
  `sync-seed-issues.ps1`, `sync-discussions.ps1` — make GitHub state
  reproducible from the markdown source-of-truth files.

### Phase 4 planning

- `.github/phase4-rollup.md` — Phase 4 closeout summary.
- `.github/sol-phase4-backlog.md` — Sol's findings: F-01 P0 determinism
  break, save-schema-v2 migration, Electron CSP/sandbox hardening,
  DialogueSystem persistence, persisted quest day.
- `.github/sol-to-jesse.md` — issues to file with labels.
- `.github/sol-answers-vex.md` — open content questions resolved.
- `.github/portfolios/robert/2026-05-genre-research.md` — Robert's research
  pass.

### Branch model adoption

- `.github/branch-reorg-runbook.md` — operator runbook for the destructive
  steps remaining (default-branch swap, `experimental` deletion, branch
  protection rules).
- All in-repo references to the old `experimental` branch updated to point
  at `alpha` (the new branch hosting the experimental stream). Stream
  identifiers (`stream:*` labels, `docs/changelogs/<stream>/` folder names)
  intentionally retained — they are independent of branch names.

## Linked planning docs

- `.github/phase4-rollup.md`
- `.github/sol-phase4-backlog.md`
- `.github/sol-to-jesse.md`
- `.github/sol-answers-vex.md`
- `.github/branch-reorg-runbook.md`

## GDD section(s)

This PR is documentation/tracking only and does not introduce code under any
specific §. It establishes the GDD `v0.4-DRAFT` baseline that subsequent code
PRs cite.

## Type of change

- [x] Docs only

## Test plan

No code changes in this PR. The `pr-validate` pipeline (lint, typecheck,
build) should pass cleanly because no source files are touched.

- L1 unit: N/A
- L2 system integration: N/A
- L3 store integration: N/A
- L4 renderer / e2e: N/A

## Determinism note

- [x] No new `Date.now()` calls in engine/system code (no code changes)
- [x] No new `Math.random()` outside the seeded RNG (no code changes)
- [x] Tick logic is pure given identical input state (no code changes)

> Sol's F-01 P0 finding (a `Math.random()` in `uiStore.pushToast`) was
> introduced earlier and is **already fixed** in `f5a4e62` (polish pack 2 —
> determinism guard test). It is documented in `.github/sol-phase4-backlog.md`
> for visibility but does not require action in this PR.

## Save compatibility note

- [x] No persisted-state shape change
- [ ] Persisted-state shape changed → migration ladder entry added (§13.3.3)
- [x] Save fixture corpus updated if applicable (N/A — docs only)

## Changelog

- [ ] `[Unreleased]` updated in `docs/about/CHANGELOG.md` (will be updated
      with this PR's entry once promoted out of draft)
- [ ] Per-stream entry added under `docs/changelogs/<stream>/`
- [x] N/A — docs/tracking PR; the repository structure changes themselves
      are the deliverable

## Pre-merge checklist

- [ ] `npm run lint` clean
- [ ] `npm run typecheck` clean
- [ ] `npm test` (unit) green
- [ ] `npm run test:e2e` green (no renderer changes — should be unaffected)
- [ ] `npm run build` green
- [x] No `console.log` left in production paths (no code changes)
- [ ] Operator-side decision recorded for `branch-reorg-runbook.md`
      Path A vs Path B before merge

## Reviewer notes

This PR is intentionally large because it lands the Phase 1–4 work as a
single coherent baseline. The seven prior topic-scoped commits on
`exp--legislative-overhaul` are kept — review per-commit rather than per-file
where possible:

1. `docs(gdd): rewrite GDD to v0.4-DRAFT (Sol/Vex/Rook passes)`
2. `docs(roadmap): milestone-driven roadmap M1-M8 with stream model`
3. `docs(changelog): adopt Keep a Changelog 1.1.0; stream conventions`
4. `chore(github): issue/PR templates, label taxonomy, project board spec`
5. `docs(wiki): expand and reorganize wiki to GDD parity (44 files)`
6. `chore(github): wiki push checklist, discussions setup, sync scripts`
7. `docs(planning): Phase 4 Sol findings + answers + rollup`
8. `docs(branches): adopt development/alpha/stable model` *(this PR adds an
   eighth commit folding the Part E branch-model doc edits into the same
   feature branch.)*
