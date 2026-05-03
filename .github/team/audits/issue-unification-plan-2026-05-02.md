# Issue Unification Plan — 2026-05-02

Owner: **Jesse**. Companion to
[`.github/issue-unification-plan-2026-05-02.json`](issue-unification-plan-2026-05-02.json)
(machine-readable; consumed by
[`scripts/apply-issue-unification.ps1`](../scripts/apply-issue-unification.ps1)).

> **Status: dry-run only.** This plan has been authored but not applied.
> Pre-requisites in §3 must be satisfied before live execution.

## 1. Snapshot

- Source snapshot: [`issue-audit-snapshot-2026-05-02.json`](issue-audit-snapshot-2026-05-02.json) — 39 issues fetched 2026-05-02 (`gh issue list ... --state all`).
- Project items: [`project-9-items-2026-05-02.json`](project-9-items-2026-05-02.json).
- Project fields: [`project-9-fields-2026-05-02.json`](project-9-fields-2026-05-02.json).
- Live counts: 39 open, 0 closed, 0 milestones, 0 PRs touched.

## 2. Classification matrix

| # | Class | Current title | Proposed title | Notes |
|---|---|---|---|---|
| 3 | D | `exp--0.1--project-setup` | `Bootstrap Vite + TypeScript + Playwright scaffold [area:ci]` | Phase 0 legacy. Likely already done. |
| 4 | D | `exp--0.1--core-types` | `Define core TS types and JSON schemas [area:engine]` | Phase 0 legacy. |
| 5 | D | `exp--0.1--app-shell` | `Build app shell with router and global layout [area:renderer]` | Phase 0 legacy. |
| 6 | D | `exp--0.1--character-system` | `Implement character creation, traits, and backgrounds [system:character]` | Phase 0 legacy. |
| 7 | D | `exp--0.1--scenario-system` | `Implement scenario loader and Modern America 2024 [area:engine]` | Phase 0 legacy. |
| 8 | D | `exp--0.1--time-system` | `Implement deterministic clock and tick scheduler [system:time]` | Phase 0 legacy. |
| 9 | D | `exp--0.1--action-system` | `Implement player actions and Political Capital economy [area:engine]` | Phase 0 legacy. |
| 10 | D | `exp--0.1--dashboard` | `Build primary dashboard with KPIs and headlines [area:renderer]` | Phase 0 legacy. |
| 11 | D | `exp--0.1--population-sim` | `Implement population cohorts, mood, and radicalism [system:population]` | Phase 0 legacy. |
| 12 | D | `exp--0.1--legislation-ui` | `Build bill drafting and floor vote UI [system:legislation]` | Phase 0 legacy. |
| 13 | D | `exp--0.1--congress-chamber` | `Render Congress chamber with whip actions [system:congress]` | Phase 0 legacy. |
| 14 | D | `exp--0.1--event-system` | `Implement event engine with conditions and choices [system:events]` | Phase 0 legacy. |
| 15 | D | `exp--0.1--card-system` | `Implement card deck, draw, play, discard [system:cards]` | Phase 0 legacy. |
| 16 | D | `exp--0.1--quest-system` | `Implement narrative quests with stages and rewards [system:quests]` | Phase 0 legacy. |
| 17 | D | `exp--0.1--economy-dashboard` | `Build economy indicators dashboard [system:economy]` | Phase 0 legacy. |
| 18 | D | `exp--0.1--skill-tree` | `Build skill-tree progression and unlocks [area:renderer]` | Phase 0 legacy. |
| 19 | D | `exp--0.1--save-system` | `Implement versioned save and load [system:save]` | Phase 0 legacy. |
| 20 | D | `exp--0.1--achievements` | `Implement achievement definitions and tracking [system:achievements]` | Phase 0 legacy. |
| 21 | D | `exp--0.1--polish` | `Run pre-0.1 polish pass [area:ci]` | Phase 0 legacy. |
| 22 | D | `Initialize GitHub Wiki with core pages` | `Bootstrap GitHub Wiki with core pages [area:docs]` | Jesse Phase 2. |
| 23 | D | `Playwright screenshot baseline suite` | `Establish Playwright screenshot baseline suite [area:ci]` | Jesse Phase 2. |
| 24 | D | `Docs bootstrap: AGENTS.md, ICONS_AND_ASSETS, research folder` | `Bootstrap AGENTS.md, ICONS_AND_ASSETS, and research/ [area:docs]` | Jesse Phase 2. |
| 28 | D | `Icon pass: replace ASCII glyphs with gold monochrome SVGs` | `Replace ASCII glyph icons with gold monochrome SVGs [area:ui]` | Sol UI audit §5.1. |
| 29 | D | `Dashboard: next-best-action card for empty-state agency` | `Add next-best-action card to dashboard [area:renderer]` | Sol UI audit §5.2. |
| 30 | D | `Congress: hemicycle seat layout` | `Render Congress hemicycle seat layout [system:congress]` | Sol UI audit §5.3. |
| 31 | D | `Economy: trend sparkline empty-state + longer history seed` | `Fix economy sparkline empty-state and history seed [system:economy]` | Sol UI audit §5.4. |
| 32 | D | `Cards: visual rarity foil for rare/legendary` | `Add rarity foil treatment to cards [system:cards]` | Sol UI audit §5.5. |
| 33 | D | `Character creation: ceremonial gold-thumb sliders` | `Replace native sliders with gold-thumb stat sliders [system:character]` | Sol UI audit §5.6. |
| 34 | D | `Population: loyalty scale affordance (-10 / 0 / +10)` | `Render loyalty as signed scale with midpoint [system:population]` | Sol UI audit §5.7. |
| 39 | D | `UI: Dashboard — situation-room redesign` | `Redesign dashboard as situation room [area:renderer]` | Vex §8.2. |
| 40 | D | `UI: Legislation pipeline — diamond stage-track` | `Render legislation pipeline as diamond stage-track [system:legislation]` | Vex §8.3. |
| 41 | D | `UI: Congress — control-panel grid` | `Redesign Congress as control-panel grid [system:congress]` | Vex §8.4. |
| 42 | D | `UI: Cards as physical objects — hand fan + BottomBar peek` | `Render hand as fan and add BottomBar peek [system:cards]` | Vex §8.7. |
| 43 | D | `UI: Skills — constellation tree` | `Render skill tree as constellation [area:renderer]` | Vex §8.8. |
| 44 | D | `UI: Quests — case-file presentation` | `Render quests as case-file presentation [system:quests]` | Vex §8.10. |
| 45 | D | `UI: Main-menu atmosphere — newsprint + animated title` | `Redesign main menu with newsprint atmosphere [area:renderer]` | Vex §8.1. |
| 107 | C | `Fix Playwright suite startup fixture and reporter configuration` | `Fix Playwright startup fixture and reporter clash [area:ci]` | Bug, body already mostly conformant. |
| 108 | C | `Make draft legislation E2E spec work on mobile portrait navigation` | `Fix draft-legislation E2E on mobile portrait [area:ci]` | Bug, body already mostly conformant. |
| 119 | F | `[CHORE] Make sure modding system is implemented or at least drafted.` | `Investigate modding system scope and authoring API [area:modding]` | User-filed; preserve intent verbatim in `## Original report`. Reclassified `type:chore` → `type:research`. |

### Counts by classification

| Class | Meaning | Count |
|---|---|---|
| A | Already conforms — verify only | 0 |
| B | Title fix only | 0 |
| C | Body fix only | 2 |
| D | Full rewrite (title + body) | 36 |
| E | Duplicate — close & link | 0 |
| F | Out of scope — preserve intent + needs-triage | 1 |
| G | Stale/closed — leave alone | 0 |
| **Total** | | **39** |

## 3. Pre-requisites the user must satisfy before execution

The repo's label and milestone state has drifted from the new taxonomy. The
unification script will fail mid-flight unless these are run first.

### 3a. Label sync (required)

```powershell
# From repo root:
pwsh -File scripts/sync-labels.ps1 -Repo ScottyVenable/Political-Ascent
```

This creates the missing `system:*`, `stream:*`, `priority:p*-*`,
`status:*`, `milestone:m*-*`, `milestone:unscheduled`, and the new `type:*`
values that the plan refers to.

> Until this is run, every `gh issue edit --add-label system:legislation`
> call in the apply script will fail with `could not add label: 'system:legislation' not found`.

### 3b. Milestone sync (required)

```powershell
pwsh -File scripts/sync-milestones.ps1 -Repo ScottyVenable/Political-Ascent
```

Creates GitHub milestone objects M1–M8 and an `Unscheduled` milestone (the
unification script will also self-heal and create `Unscheduled` if missing).

### 3c. Project #9 field gaps (documented click-paths in §4 below)

The board is currently missing several single-select options the style guide
requires. The unification script does **not** mutate Project #9; field
reconciliation is a separate manual pass.

## 4. Project #9 field reconciliation — click-paths

`gh project field-create` exists but cannot **edit** existing fields'
options (no GraphQL `updateProjectV2Field` for option additions in `gh` ≤
2.81). These adjustments must be done in the web UI.

Open https://github.com/users/ScottyVenable/projects/9 → ⚙ Settings →
Custom fields:

| Field | Action |
|---|---|
| **Status** | Add option `Triaged` (between `Backlog` and `Ready`). Add option `QA` (between `In review` and `Done`). |
| **Priority** | Add option `P3 Low`. Rename existing `P0` → `P0 Critical`, `P1` → `P1 High`, `P2` → `P2 Normal` for parity with `priority:p*-*` labels. |
| **Stream** *(new)* | Create single-select field with options `development`, `experimental`, `stable`. |
| **Milestone** *(new single-select; the existing built-in `Milestone` is repository-milestone-bound — leave that alone and add a parallel single-select)* | Create single-select with options `M1 Cloakroom`, `M2 Floor Manager`, `M3 Stump`, `M4 Ironclad`, `M5 Lectern`, `M6 Telemetry`, `M7 Second Front`, `M8 Quorum`, `Unscheduled`. |
| **System** | (Optional) Use `system:*` labels instead — preferred per `.github/project-board.md` §1. |
| **Area** | (Optional) Use `area:*` labels instead. |
| **Estimate / Size** | The board has `Size` (XS/S/M/L/XL); `.github/project-board.md` calls this `Estimate`. Recommend renaming `Size` → `Estimate` for consistency. |

After fields are aligned, populate values per item using:

```powershell
gh project item-edit --project-id <PROJECT_ID> --id <ITEM_ID> \
  --field-id <FIELD_ID> --single-select-option-id <OPTION_ID>
```

(IDs come from `gh project field-list 9 --owner ScottyVenable --format json`.)

## 5. Body-template kinds

The script generates bodies from these kinds (one per row in
`items[].body_kind`):

- `feature` — Summary / Context / Acceptance criteria / Technical notes / Out of scope
- `bug` — Summary / Reproduction / Expected / Actual / Context / Acceptance criteria / Technical notes / Out of scope
- `system` — Summary / Context / Acceptance criteria / Technical notes / Out of scope
- `chore` — Summary / Context / Acceptance criteria / Technical notes / Out of scope
- `research` — Summary / Question / Context / Deliverable / Acceptance criteria / Out of scope

Issues with `preserve_original: true` keep the existing body verbatim under a
`## Original report` section beneath the unified template. This is used for
#107, #108, and #119 to retain the user-authored detail.

## 6. Style-guide deviations the user has implicitly opted into

None yet. Any title or body that needs to depart from the style guide must
be documented here before the apply script is allowed to skip it.

— Jesse
