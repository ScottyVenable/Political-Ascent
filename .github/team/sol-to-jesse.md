# Sol → Jesse: Phase-4 hand-off

**Date:** May 2026 · **Branch:** `exp--legislative-overhaul` · **From:** Sol · **For:** Jesse

## Pointers

- **New backlog (27 incremental findings):** [sol-phase4-backlog.md](sol-phase4-backlog.md)
- **Vex's 6 wiki-blocking questions answered:** [sol-answers-vex.md](sol-answers-vex.md)
- **Existing seed-issue list (do not duplicate):** [seed-issues.md](seed-issues.md)

## Recommended order to add to Project #9

Add in this sequence so the board reads left-to-right by urgency:

1. **F-01** (P0, M1) — determinism break, must land in this branch.
2. **F-06**, **F-07**, **F-27** (P1/P3, M1) — cheap, ride the same branch.
3. **F-02** (P1, M2) — save migration ladder; **must** precede every other M2 schema-bump issue.
4. **F-04, F-05, F-15, F-16** (M2 dialogue) — file as sub-issues under the existing seed entry "Build DialogueSystem renderer panel + node interpreter".
5. **F-08, F-14, F-22** (M2 effect-schema cleanup).
6. **F-03, F-09, F-10, F-11, F-12, F-13, F-21, F-23, F-25** (M4 security/determinism cluster).
7. **F-18, F-19, F-24** (M5 polish).
8. **F-20** (M6 scripts).
9. **F-17, F-26** (Unscheduled).

## Findings to **NOT** create as issues

These are wiki/doc-only and Vex (or you) can roll into the same wiki PR as Phase 3:

- **Q1 rider/amendment terminology** — copy fix on `wiki/Concept-Glossary.md` and `wiki/Authoring-Cards.md`. **No code rename.** No issue needed.
- **Q3 speech fragment path** — clarification only; the actual content work is already covered by seed-issues M3. No new issue.
- **F-14** — JSDoc + one wiki paragraph. File a `type:docs` chore if you want, but a wiki PR is enough.

## Findings that need a **design decision** before issue creation

Park these on Sol until decided; do not file yet:

- **F-05 — dialogue token syntax** (`{token}` vs `{{token}}`). Recommended: single curly braces. Decide with Bridge during Phase 5 kickoff. Once decided I will file the issue with the chosen syntax in the body.
- **F-08 — `delayDays`/`duration`** (implement scheduler vs remove from `Effect` type). M2 scope call.
- **F-17 — quest/event file split** (single file vs themed). Content-team preference. Trivial mechanically.

## Top 5 P0/P1 by short title (to grab Jesse's attention first)

1. **F-01** — Replace `Date.now()` RNG seed inside `LegislationSystem.draftBill` (P0).
2. **F-02** — Implement save-schema migration ladder (P1, M2 blocker).
3. **F-06** — Validate per-store payload shape inside `applySavePayload` (P1).
4. **F-07** — Add `@playwright/test` to `devDependencies` (P1, blocks Rook's CI work).
5. **F-13** — Add CSP meta tag to `index.html` (P1, security).

## What Bridge needs to know before Phase 5 (dialogue)

- Token syntax (F-05) is a Sol/Bridge design call. Recommendation written up in [sol-answers-vex.md](sol-answers-vex.md) Q4. Bridge picks → Sol files the issue.
- Dialogue trees do not currently load (F-04). Bridge cannot author against the renderer until F-04 + F-15 land.
- `failureHint` field, panel-vs-modal surface, and dialogue progress persistence are already in the seed list — F-14, F-15, F-16 are sub-issues that round those out.

## What Rook needs to know before Phase 6 (CI)

- **F-07** must land before any CI runner picks the repo up.
- **F-11** (Date.now determinism guard) gives the existing nightly determinism job real teeth.
- **F-13** (CSP meta) gives the security-scan job something concrete to assert.
- The IPC fuzz harness seed-issue presumes F-03 (settings allowlist) is already in place — Rook may want to schedule them adjacent.

## Operational notes

- I touched **no source code, no GDD, no roadmap, no changelog, no wiki** in this pass. Three new files only:
  - `political-ascent-project/.github/sol-answers-vex.md`
  - `political-ascent-project/.github/sol-phase4-backlog.md`
  - `political-ascent-project/.github/sol-to-jesse.md`
- All findings cite real file paths and line ranges. If anything looks invented when you read it, ping me — it's a bug in this report, not in the code.
