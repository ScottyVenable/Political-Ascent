# Branch Reorganisation Runbook

Owner: **Sol** (authored 2026-05-02). Executor: **the user** (Scotty).

This runbook covers the destructive operations that move the repository from
the legacy default branch (`experimental`) to the new three-branch model
(`development` / `alpha` / `stable`). Sol intentionally did **not** execute
these — they rewrite or delete shared refs and need an informed human at the
controls.

## Status snapshot at runbook authoring

- Default branch on GitHub: `experimental` (will move to `development`).
- New long-lived branches created (additive, safe):
  - `origin/development` — already existed prior to reorg; left untouched at
    `2caf1d2` (the consolidated 57-commit merge).
  - `origin/alpha` — **new** in this reorg, created at
    `9a51ec3` (current `exp--legislative-overhaul` HEAD).
  - `origin/stable` — **new** in this reorg, created at the same `9a51ec3`.
- Active feature branch: `exp--legislative-overhaul` at `9a51ec3`, ahead of
  `origin/experimental` (5e40801) by all Phase 1–4 docs/tracking commits but
  **behind** `origin/experimental` by four code commits: `#106` (Legislation
  Phase 1), `#109` (bottom-bar bill progress), `#110` (CI workflows + APK
  pre-release), `#111` (save/load hardening).
- PR open: Phase 1–4 docs PR `exp--legislative-overhaul → development` (draft).

---

## Decision required from the user (do this first)

The Phase 1–4 task assumed `development` did not yet exist. It already did,
pointing at `2caf1d2`. There are now two viable shapes for the reorg:

**Path A — keep current `development`, fold experimental code into it next.**

1. Merge the open PR `exp--legislative-overhaul → development`. This brings
   Phase 1–4 docs/tracking onto `development`.
2. Open a follow-up PR `experimental → development` to fold in the four
   missing code commits (`#106`, `#109`, `#110`, `#111`).
3. After both merges, retip `alpha` and `stable` to the new `development`
   tip with a force-with-lease push (see §6 rollback section below for the
   exact command form).

**Path B — retip `development` to `experimental`, then PR Phase 1–4 docs.**

1. Force-update `development` to `origin/experimental` so it includes the
   four extra code commits before the docs land.
2. Re-target the Phase 1–4 PR's base or rebase `exp--legislative-overhaul`
   on top of the new `development`.
3. Then merge.

Sol recommends **Path A**. It is the lower-risk option: each step is a normal
PR with diff review, no force pushes on shared refs, and the merge order
(docs first, then experimental code) lets you read each diff cleanly.

If you pick Path B, Sol will need a follow-up task to handle the rebase.

---

## 1. Change default branch on GitHub

Required before deleting `experimental`. Branches with open PRs cannot be
deleted; this step also moves any open PRs targeting `experimental` to the
new default (you'll be prompted to retarget them).

1. Open `https://github.com/ScottyVenable/Political-Ascent/settings/branches`.
2. Under **Default branch**, click the swap icon (↔).
3. Pick `development` from the dropdown.
4. Click **Update**, confirm the warning.
5. GitHub will offer to **retarget open PRs** from `experimental` to
   `development`. Accept.

After this, `git remote set-head origin -a` on local clones will pick up the
new default.

## 2. Delete `experimental`

**Only after step 1 and after every open PR targeting `experimental` has been
retargeted or closed.**

```powershell
# Verify no open PRs target experimental:
gh pr list --base experimental --state open

# If the list is empty:
git push origin :experimental
```

The branch ref will also vanish from the GitHub UI (Settings → Branches list).
Local clones will keep a stale `origin/experimental` ref until they
`git fetch --prune`.

## 3. Delete other legacy branches

These are remote branches Sol found during pre-flight that look like merged
or abandoned feature work. Verify each is merged before deleting; if you
want to keep any as historical refs, skip it.

| Branch | Notes |
|---|---|
| `origin/release` | Old "stable" lane prior to reorg. Last commit `c4f7dc5`, tagged `v0.1.1-alpha.3`. **Sol recommends keeping** until `stable` accumulates real release history; rename to `legacy/release` if you want to declutter the branch list. |
| `origin/exp--byc-stats-detail` | Merged via PR. |
| `origin/exp--character-personal-funds` | Merged. |
| `origin/exp--congress-bio-filters` | Merged. |
| `origin/exp--congress-fit-and-budget` | Merged. |
| `origin/exp--congress-ideology-labels` | Merged. |
| `origin/exp--graph-renderer-polish` | Merged. |
| `origin/exp--humanize-data-tags` | Merged. |
| `origin/exp--main-menu-version-link` | Merged. |
| `origin/exp--mobile-polish-and-apk` | Merged. |
| `origin/exp--npc-json-foundation` | Merged. |
| `origin/exp--polish-pack-2` | Merged. |
| `origin/exp--scenario-plan-and-archive-3` | Merged. |
| `origin/exp--todo-archive-sweep-2` | Merged. |
| `origin/exp--tooltip-polish-3` | Merged. |
| `origin/exp--ux-polish-pack-1` | Merged. |
| `origin/copilot/*` | Old Copilot autogen branches. Many predate the project structure; safe to delete. |
| `origin/claude/game-project-android-apk-3BnW2` | Old auto-PR branch. |

> **Do NOT include `exp--legislative-overhaul` in this list.** That branch is
> the source of the Phase 1–4 PR and should be deleted automatically by the
> "Delete branch" button on the PR page after merge.

Per-branch deletion command:

```powershell
git push origin :<branch-name>
```

Bulk template (review the list before running):

```powershell
$legacy = @(
  'exp--byc-stats-detail',
  'exp--character-personal-funds',
  'exp--congress-bio-filters',
  'exp--congress-fit-and-budget',
  'exp--congress-ideology-labels',
  'exp--graph-renderer-polish',
  'exp--humanize-data-tags',
  'exp--main-menu-version-link',
  'exp--mobile-polish-and-apk',
  'exp--npc-json-foundation',
  'exp--polish-pack-2',
  'exp--scenario-plan-and-archive-3',
  'exp--todo-archive-sweep-2',
  'exp--tooltip-polish-3',
  'exp--ux-polish-pack-1'
)
foreach ($b in $legacy) { git push origin ":$b" }
```

## 4. Branch protection rules

Per Rook's spec (GDD §13.8). Configure at
`https://github.com/ScottyVenable/Political-Ascent/settings/branches` →
**Add branch protection rule** for each pattern.

### `development`

- Require a PR before merging.
- Require status check: `pr-validate`.
- Require linear history: optional (squash-merge enforces this implicitly).
- Allow force pushes: **No**.
- Allow deletions: **No**.

### `alpha`

All of `development`'s rules plus:

- Require status checks: `pr-validate`, `a11y-scan`, `security-scan`.
- Restrict who can push: maintainers only.
- Require signed commits: optional (recommended once available).

### `stable`

All of `alpha`'s rules plus:

- Require the full release checklist (issue from `release.yml` template,
  linked from the promotion PR).
- Restrict who can push: maintainers only.
- Require deployments to succeed (when CI workflows that produce binaries
  exist).

> Rook will finalise the exact set of required checks in Phase 6 (M6
> Telemetry milestone) once the CI pipelines are real, not aspirational.
> Until then, `pr-validate` is the only required check that exists.

## 5. Update local clones (other contributors)

After step 1 + step 2 have landed:

```powershell
# Inside any local clone:
git fetch --prune
git remote set-head origin -a    # picks up the new default
git switch development
```

Stale `origin/experimental` refs on contributor machines clear automatically
after `--prune`. Anyone with a working tree on `experimental` should branch
off it first or rebase onto `development`.

## 6. Rollback plan

If the reorg goes wrong and `experimental` needs to come back:

```powershell
# 1. Restore experimental from development:
git push origin development:experimental --force-with-lease

# 2. Web UI: Settings → Branches → swap default back to experimental.

# 3. Optionally delete the new branches if you want to fully unwind:
git push origin :alpha
git push origin :stable
```

`--force-with-lease` is preferred over `--force` because it refuses to
overwrite if the remote ref has moved since your last fetch — it protects
you from racing another contributor's push.

If you only need to re-tip `alpha` or `stable` (e.g. you want them to start
at the older `development` tip rather than at the current Phase 1–4 commit):

```powershell
git fetch origin
git switch alpha
git reset --hard origin/development     # or any commit you want as the new tip
git push origin alpha --force-with-lease
```

Same pattern for `stable`. Any contributor with a local `alpha` will need to
`git fetch --prune && git reset --hard origin/alpha` to pick up the retip.

---

## Appendix — what Sol already executed

For audit, the safe operations Sol ran were:

1. Seven topic-scoped commits on `exp--legislative-overhaul` covering the
   Phase 1–4 work (GDD, roadmap, changelog, GitHub tracking, wiki, ops
   scripts, Phase 4 planning).
2. `git push origin exp--legislative-overhaul` (already had a remote ref,
   fast-forward update).
3. `git push -u origin alpha` — created `origin/alpha` at `9a51ec3`.
4. `git push -u origin stable` — created `origin/stable` at `9a51ec3`.
5. One follow-up commit `docs(branches): adopt development/alpha/stable
   model` updating `docs/ROADMAP.md`, `docs/about/CHANGELOG.md`,
   `docs/wiki/Release-Notes.md`, `docs/wiki/Roadmap.md`,
   `.github/PULL_REQUEST_TEMPLATE.md`, `.github/project-board.md`,
   `.github/labels.md`, `.github/milestones.md`, `scripts/sync-labels.ps1`,
   `scripts/sync-milestones.ps1`.
6. The PR `exp--legislative-overhaul → development` was opened as **draft**
   (or, if `gh` was unavailable, the PR body was written to
   `.github/PR-phase1-4.md` for you to paste into the web UI).

Sol did **not** execute:

- Default-branch change.
- Deletion of `experimental`, `release`, or any legacy `exp--*`.
- Force pushes on any shared ref.
- Branch protection rules.
- Re-tipping of `alpha` / `stable`.
