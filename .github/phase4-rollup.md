# Phase 4 Rollup — Sol findings integrated

**Owner:** Jesse · **Source:** Sol Phase 4 backlog · **Date:** May 2026 · **Branch:** `exp--legislative-overhaul`

One-page summary of Sol's Phase 4 codebase audit and how it folded into Project #9 tracking artefacts.

---

## Phase 4 result (Sol's totals)

| Metric | Count |
|---|---|
| New findings (F-01..F-27) | **27** |
| MERGE-INTO notes (against existing seed entries) | **11** |
| Design-blocked (need a Sol/Bridge decision before filing) | **3** (F-05 token syntax, F-08 effect scheduler, F-17 quest-file split) |
| Severity P0 / P1 / P2 / P3 | 1 / 8 / 14 / 4 |
| Future-pass appendix items (not filed this round) | 10 |

---

## What changed in tracking docs

| File | Change |
|---|---|
| [`.github/seed-issues.md`](seed-issues.md) | Appended `**Sol-F-XX merge:**` annotations to 8 existing entries (F-03/04/11/13/15/16/18/20/23/25/27 → 11 merge notes total spanning 8 parents). Added new `## Phase 4 additions (Sol findings)` section with 16 paste-ready standalones (F-05 deferred). Rewrote the count table: **66 top-level + 25 sub-issues = 91**, up from 50/15/65. |
| [`scripts/sync-seed-issues.ps1`](../scripts/sync-seed-issues.ps1) | Appended `New-PaIssue` blocks for the 16 new standalones, an inline `gh issue create` for milestone-less F-26, and 10 TODO sub-issue blocks (each notes the parent and the REST sub-issue API recipe). F-05 left as a comment block awaiting decision. |
| [`.github/wiki-push-checklist.md`](wiki-push-checklist.md) | Pre-push gate §1 rewritten as 6 explicit checkboxes citing `sol-answers-vex.md` Q-1..Q-6. Q4 flagged with `Sol recommends `{token}`. Awaiting user/Bridge confirmation`. Total gates still 7. |
| `.github/phase4-rollup.md` (this file) | Created. |

No other files touched. Per constraints: no source code, no GDD, no roadmap, no changelog, no `docs/wiki/**`, no `.github/ISSUE_TEMPLATE/**`, no `gh` commands run.

---

## Top 5 P0/P1 (from Sol's hand-off)

1. **F-01 (P0, M1)** — Replace `Date.now()` RNG seed inside `LegislationSystem.draftBill`. Determinism break, GDD §13.2.
2. **F-02 (P1, M2)** — Implement save-schema migration ladder. Blocks every M2 schema-bump.
3. **F-06 (P1, M1)** — Validate per-store payload shape inside `applySavePayload`. Cheap; unblocks F-02 confidently.
4. **F-07 (P1, M1)** — Add `@playwright/test` to `devDependencies`. Phase 6 CI cannot bootstrap without it.
5. **F-13 (P1, M4)** — Add CSP meta tag to `index.html`. Security, GDD §13.5. Filed as sub-issue under existing M4 CSP parent.

---

## Manual user actions (ordered)

1. **Review Sol's answers** in [`sol-answers-vex.md`](sol-answers-vex.md) — confirm the 5 conclusive ones still match your design intent.
2. **Confirm Q4 token syntax** with Bridge: pick `{token}` (Sol's recommendation, ICU-compatible) or `{{token}}` (Mustache-style). Once decided, Sol files F-05 with the chosen syntax baked into the body. Until then, Vex must not author tokenised dialogue copy on the wiki.
3. **Decide F-08** (effect scheduler vs remove `delayDays`/`duration` from the type) and **F-17** (quest/event file split) when you next plan M2 / M5 scope. Both are mechanically trivial; the issues currently carry `status:needs-design`.
4. **Run `scripts/sync-labels.ps1`** then **`scripts/sync-milestones.ps1`** on the Project #9 repo if not already done — the new issue-create blocks reference labels and milestones that must exist first.
5. **Run the updated `scripts/sync-seed-issues.ps1`** to create the 16 new standalones + F-26.
6. **Create the 10 sub-issues** by uncommenting each TODO block, filling in the parent issue number, and running the documented `gh api /repos/.../issues/<parent>/sub_issues` recipe.
7. **Link new issues to Project #9**. `gh issue create --project "Political Ascent"` already does this for `New-PaIssue` calls; verify via `gh project item-list 9 --owner ScottyVenable`.
8. **Tick the 6 boxes in `wiki-push-checklist.md` §(a) gate 1** — leave Q4 unchecked until the design decision lands.

---

## Phase 5 / 6 unblockers (from Sol's hand-off)

### Bridge needs before Phase 5 (dialogue) can start
- **F-05** — token syntax decision. Bridge picks `{token}` vs `{{token}}`; Sol files the issue with chosen syntax.
- **F-04** — dialogue trees do not currently load. Bridge cannot author against the renderer until F-04 + F-15 land.
- **F-14, F-15, F-16** — `failureHint` semantics, example tree scaffold, and `dialogueProgress` persistence — already filed as sub-issues under the M2 dialogue parent.

### Rook needs before Phase 6 (CI) can start
- **F-07** — `@playwright/test` must land before any CI runner picks the repo up.
- **F-11** — `Date.now()` determinism guard gives the existing nightly determinism job real teeth.
- **F-13** — CSP meta gives the security-scan job something concrete to assert.
- **F-03** — IPC fuzz harness seed-issue presumes the settings allowlist is in place; schedule adjacent.

---

## Collisions resolved (Part E audit)

Audited all 16 new Phase 4 standalone titles against the 50 Phase 2 top-level entries and the 11 MERGE-INTO entries. **Zero hard collisions.** Three near-collisions reviewed and resolved:

| New title | Existing seed entry | Resolution |
|---|---|---|
| `[Sol-F-03] IPC pa:settings:set accepts unrestricted record; add allowlist + type guard` | "IPC handler input validation tests" (M4) | **Distinct scope.** Existing entry is test-only; F-03 is the handler hardening. Sol explicitly called this out in the de-dup audit. Added a merge note on the existing entry pointing forward to F-03; kept F-03 as a separate standalone with an `[Sol-F-03]` title prefix. |
| `[Sol-F-13] Add Content-Security-Policy meta tag to index.html` (sub) | "Add CSP meta tag + electron `session.webRequest` headers" (M4) | **Sub-issue, not a duplicate.** Existing entry covers all three transports; F-13 narrows to the renderer meta tag so it can land first. Filed as a sub-issue with the `[Sol-F-13]` prefix to keep it visually distinct from the parent. |
| `[Sol-F-23] Add server.allowNavigation: [] to Capacitor config` (sub) | "Add CSP meta tag + electron `session.webRequest` headers" (M4) | **Sub-issue under the same parent as F-13.** Same parent, different transport (Capacitor). Prefix `[Sol-F-23]` keeps it distinct. |

All remaining 14 standalone titles (F-01, F-02, F-05, F-06, F-07, F-08, F-09, F-10, F-12, F-14, F-17, F-19, F-21, F-22, F-24, F-26) are uniquely named and carry the `[Sol-F-NN]` prefix as a belt-and-suspenders guard against future collisions.

— Jesse
