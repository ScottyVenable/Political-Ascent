# Issue Unification Report — 2026-05-02

Owner: **Jesse**. Final report for the issue-unification pass on
[Project #9](https://github.com/users/ScottyVenable/projects/9).

> **Status: dry-run only.** No live mutations were applied. The user must
> run the prerequisite syncs (§3 below) and then execute the apply script
> in batches per §4.

## 1. Files created or modified

| Path | Lines | Purpose |
|---|---|---|
| [`.github/issue-style-guide.md`](issue-style-guide.md) | 142 | Canonical title/body/label conventions. |
| [`.github/issue-unification-plan-2026-05-02.json`](issue-unification-plan-2026-05-02.json) | 471 | Machine-readable plan; consumed by the apply script. |
| [`.github/issue-unification-plan-2026-05-02.md`](issue-unification-plan-2026-05-02.md) | 130 | Human-readable matrix and pre-requisites. |
| [`.github/issue-audit-snapshot-2026-05-02.json`](issue-audit-snapshot-2026-05-02.json) | 1 | Live snapshot of all 39 open issues at audit time. |
| [`.github/project-9-items-2026-05-02.json`](project-9-items-2026-05-02.json) | 1 | Live snapshot of Project #9 items. |
| [`.github/project-9-fields-2026-05-02.json`](project-9-fields-2026-05-02.json) | 1 | Project #9 field schema. |
| [`.github/issue-unification-dryrun-2026-05-02.txt`](issue-unification-dryrun-2026-05-02.txt) | 158 | Captured `-WhatIf` run of the apply script over all 39 issues. |
| [`scripts/apply-issue-unification.ps1`](../scripts/apply-issue-unification.ps1) | 282 | The unification script. Idempotent; supports `-WhatIf`, `-Only`, `-Skip`. |
| `.github/issue-unification-logs/` | — | Per-run log directory created by the apply script. |

## 2. Live issue inventory

- **39** open issues, **0** closed (Project #9 is currently open-only).
- **0** GitHub milestone objects exist on the repo. The Phase 2 sync scripts have not been run.
- **39** issues classified into the matrix; classification counts:

| Class | Meaning | Count |
|---|---|---|
| A | Already conforms — verify only | 0 |
| B | Title fix only | 0 |
| C | Body fix only | 2 (#107, #108) |
| D | Full rewrite (title + body) | 36 |
| E | Duplicate — close & link | 0 |
| F | Out of scope — preserve intent + needs-triage | 1 (#119) |
| G | Stale/closed — leave alone | 0 |

## 3. Mutations executed

**None.** The pass stopped at Step 5 (dry-run capture) because the live
label and milestone state has drifted from the new taxonomy:

- **Missing labels.** The plan calls out `system:*` (15 labels), `stream:*` (3),
  `priority:p0-critical` / `priority:p2-normal` / `priority:p3-low` (3),
  `status:needs-triage` / `status:review` / `status:done` (in part),
  `milestone:m1-cloakroom` … `milestone:m8-quorum` + `milestone:unscheduled`
  (9), and four `type:*` values not currently on the repo (`type:system`,
  `type:content`, `type:tech-debt`, `type:a11y`, `type:security`,
  `type:release`). Of the new taxonomy, only `priority:p1-high` exists today.
- **Missing milestones.** Zero milestone objects exist. Every plan entry
  targets `Unscheduled`, which the apply script can self-create on first
  run, but the M1–M8 milestones expected by the style guide must come from
  `scripts/sync-milestones.ps1`.

Running `gh issue edit --add-label system:legislation` against the live repo
right now would fail with `could not add label` for ~70% of the planned
edits. The dry-run was the appropriate stopping point.

### 3a. Pre-requisites the user must run before live execution

```powershell
# 1) Bring labels into line with .github/labels.md
pwsh -File scripts/sync-labels.ps1 -Repo ScottyVenable/Political-Ascent

# 2) Create milestone objects M1-M8 (and Unscheduled as a side-effect)
pwsh -File scripts/sync-milestones.ps1 -Repo ScottyVenable/Political-Ascent

# 3) Re-run the unification dry-run to confirm a clean diff
pwsh -File scripts/apply-issue-unification.ps1 `
    -PlanPath .github/issue-unification-plan-2026-05-02.json -WhatIf

# 4) Apply in batches of ~10
pwsh -File scripts/apply-issue-unification.ps1 `
    -PlanPath .github/issue-unification-plan-2026-05-02.json -Only 3,4,5,6,7,8,9,10,11,12

pwsh -File scripts/apply-issue-unification.ps1 `
    -PlanPath .github/issue-unification-plan-2026-05-02.json -Only 13,14,15,16,17,18,19,20,21,22

pwsh -File scripts/apply-issue-unification.ps1 `
    -PlanPath .github/issue-unification-plan-2026-05-02.json -Only 23,24,28,29,30,31,32,33,34,39

pwsh -File scripts/apply-issue-unification.ps1 `
    -PlanPath .github/issue-unification-plan-2026-05-02.json -Only 40,41,42,43,44,45,107,108,119
```

The apply script is idempotent — re-running over already-unified issues is a
no-op (the `Test-AlreadyConforms` check skips them).

## 4. Project #9 field updates

### Applied

None — the unification script does not mutate Project #9 fields.

### Documented click-paths (for the user)

GitHub does not expose `gh project field-edit` for option additions. These
must be done in the web UI at
https://github.com/users/ScottyVenable/projects/9 → ⚙ Settings → Custom fields:

| Field | Action |
|---|---|
| **Status** | Add `Triaged` between `Backlog` and `Ready`. Add `QA` between `In review` and `Done`. |
| **Priority** | Add `P3 Low`. Optionally rename existing `P0`/`P1`/`P2` → `P0 Critical`/`P1 High`/`P2 Normal`. |
| **Stream** *(new)* | Create single-select with options `development`, `experimental`, `stable`. |
| **Milestone** *(new single-select; leave the built-in repository-milestone field alone)* | Options `M1 Cloakroom` … `M8 Quorum`, `Unscheduled`. |
| **Estimate** | Rename existing `Size` → `Estimate` for parity with [`.github/project-board.md`](project-board.md) §1. |

After fields are aligned, populate values per item with:

```powershell
gh project item-edit --project-id <PID> --id <ITEM_ID> `
  --field-id <FIELD_ID> --single-select-option-id <OPTION_ID>
```

(IDs come from `gh project field-list 9 --owner ScottyVenable --format json`.)

## 5. Top label deltas (planned)

### Adds (top 10 by frequency across the 39-item plan)

| Label | Count |
|---|---|
| `stream:development` | 39 |
| `milestone:unscheduled` | 31 |
| `area:renderer` | 18 |
| `area:ui` | 14 |
| `priority:p1-high` | 16 |
| `priority:p2-normal` | 14 |
| `status:done` | 18 |
| `status:needs-triage` | 13 |
| `milestone:m4-ironclad` | 14 |
| `area:engine` | 7 |

### Removes (top 5)

| Label | Count |
|---|---|
| `priority:P2` | 30 |
| `status:triage` | 22 |
| `area:ui` (legacy where it crowds out `area:renderer`) | 11 |
| `type:feature` (where reclassified to `type:system`/`type:chore`/`type:research`) | 13 |
| `area:legislation`/`area:congress`/`area:cards`/`area:quests`/`area:economy`/`area:character`/`area:population` (legacy area→system migration) | 14 |

## 6. Milestone assignments changed

| # | Old | New (label / GitHub) |
|---|---|---|
| 3–24 | none | `milestone:unscheduled` / `Unscheduled` (Phase 0 closeout — flag for triage to confirm `status:done` and close) |
| 28–34, 39–45 | none | `milestone:m4-ironclad` / `M4 Ironclad` (UI/game-feel work targets the M4 hardening milestone) |
| 107, 108 | none | `milestone:m4-ironclad` / `M4 Ironclad` (CI hardening for stream gate) |
| 119 | none | `milestone:unscheduled` / `Unscheduled` (modding research; outside M1–M8) |

## 7. Style-guide deviations the user opted into

None recorded. All 39 issues are mapped to fully-conformant titles and
bodies. If the user wants to keep any legacy title (e.g., the `exp--0.1--*`
series for historical traceability), edit the corresponding entry in
[`.github/issue-unification-plan-2026-05-02.json`](issue-unification-plan-2026-05-02.json)
to change classification to `A` and remove the `new_title` override.

## 8. Issues that need user attention

- **#3–#21 (Phase 0 series).** Mostly already done in the codebase. Plan
  marks them `status:done` so the user can sweep-close them after the
  apply pass. Spot-check needed for any item that did **not** ship in 0.1
  (e.g., #20 achievement persistence may be partial).
- **#119 (modding).** User-filed, intentionally left at `status:needs-triage`
  with `type:research`. Needs scoping into a `docs/research/modding-system-scope.md`
  report and split into sub-issues before any implementation work.
- **Project #9 field gaps** documented in §4. Cannot be fully automated.

## 9. Anything blocking full completion

| Blocker | Owner | Resolution |
|---|---|---|
| Label taxonomy out of sync | user (one-shot) | run `scripts/sync-labels.ps1` |
| GitHub milestone objects missing | user (one-shot) | run `scripts/sync-milestones.ps1` |
| Project #9 field options missing | user (web UI) | follow §4 click-paths |
| `gh project item-edit` requires the project ID, not the project number; field/option IDs need to be looked up from the field-list dump | user or a follow-up automation pass | document in a future Phase 7 ticket |

## 10. Lessons learned (candidate user-memory entries)

1. **Audit before mutate.** The label/milestone drift discovered here would
   have caused 50%+ of `gh issue edit` calls to fail mid-batch. Always
   run `gh label list` and `gh api .../milestones` *before* writing the
   apply script, and gate the apply step on the prerequisites.
2. **`New-TemporaryFile` honours `-WhatIf`** in PowerShell 7. Use
   `[System.IO.Path]::GetTempFileName()` instead, or pass
   `-WhatIf:$false` to bypass propagation, when the temp file is
   implementation detail, not user intent.
3. **PowerShell `${n}` in interpolated strings.** `$n:` is a parser error
   because PowerShell treats `:` as a scope operator. Use `${n}:` or
   pre-extract to a variable.
4. **Idempotency check needs to inspect both title AND body shape AND
   labels.** Title-only checks will re-edit issues whose body has been
   manually polished but whose title is already canonical.
5. **Preserve user-authored content via a `## Original report` quote
   block.** This makes the unification reversible-by-eye — the original
   text is one paste away.

— Jesse
