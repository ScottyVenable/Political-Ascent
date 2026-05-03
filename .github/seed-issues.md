# Seed Issue List

Owner: **Jesse**. Source for [`scripts/sync-seed-issues.ps1`](../scripts/sync-seed-issues.ps1).

> Every entry below corresponds to one issue that should exist on
> [Project #9](https://github.com/users/ScottyVenable/projects/9). Sources are
> dedup'd from Sol §14.1, Vex §12 backlog, Rook §13 backlog, and the
> ROADMAP.md milestone deliverables. Entries marked **[Jesse-proposed]** are
> small infra additions Jesse considers necessary for Phase 6 to proceed.

Format per entry:
- **Title** (imperative)
- Template / Labels / Milestone
- Body (paste-ready)
- Sub-issues (nested) / Dependencies (issue titles)

---

## M1 — Cloakroom (`milestone:m1-cloakroom`)

### Extract VotingSystem from LegislationSystem
- **Template:** `system.yml`
- **Labels:** `type:system`, `area:engine`, `system:legislation`, `system:congress`, `milestone:m1-cloakroom`, `stream:experimental`, `priority:p1-high`
- **Body:**
  > Voting logic currently lives inside `LegislationSystem` (per GDD §14.1).
  > Extract a `VotingSystem` module with a clean `tally(bill, congress) → VoteResult`
  > contract. Add `src/systems/VotingSystem.ts` and `VotingSystem.test.ts`
  > (≥80% line coverage, L1 unit per §13.1.1). No `Math.random` outside the
  > seeded RNG (§13.2). Update ARCHITECTURE.md.
- **Sol-F-27 merge:** During the extraction, add one unit test in `LegislationSystem.test.ts` (or the new `VotingSystem.test.ts`) that drafts a bill from a template carrying `stageDurations: { committee: 1 }` and asserts `stageEndsOnDay = day + 1`. Locks the only mod-author-facing override path on `BillTemplate`. Evidence: [`src/systems/LegislationSystem.ts` lines 145-150](../src/systems/LegislationSystem.ts#L145).

### Persist `quest.startedDay` on save
- **Template:** `bug.yml`
- **Labels:** `type:bug`, `area:save`, `system:quests`, `milestone:m1-cloakroom`, `stream:experimental`, `priority:p1-high`, `breaking-change`
- **Body:**
  > `QuestSystemImpl.startedDays` is in-memory only (GDD §14.1 + §4.8).
  > Quests started before save/load lose their start day. Persist on
  > `worldStore.activeQuests[].startedDay`. Adds a save-schema field →
  > migration ladder entry per §13.3.3.
- **Dependencies:** none

### Implement or remove `LegislationSystem.budgetReconciliation()`
- **Template:** `tech-debt.yml`
- **Labels:** `type:tech-debt`, `area:engine`, `system:legislation`, `system:economy`, `milestone:m1-cloakroom`, `stream:experimental`, `priority:p2-normal`
- **Body:**
  > ARCHITECTURE.md §4.1 names a `budgetReconciliation()` hook that doesn't
  > exist. Either build it (writing economy effects on bill sign) or remove
  > the reference. Decide as part of M1 scope. Cite GDD §14.1.

### Wire `Skip-to-event` time control to a real handler
- **Template:** `bug.yml`
- **Labels:** `type:bug`, `area:renderer`, `system:time`, `milestone:m1-cloakroom`, `stream:experimental`, `priority:p2-normal`
- **Body:**
  > Speed bar exposes a "Skip to next event" slot but it is currently a
  > no-op (GDD §14.1). Wire it to advance the engine clock until the next
  > queued event from `EventEngine` and surface the result in the news rail.

### M1 release tracking — Cloakroom
- **Template:** `release.yml`
- **Labels:** `type:release`, `milestone:m1-cloakroom`, `stream:experimental`, `priority:p1-high`
- **Body:**
  > Track readiness for `0.2.0-alpha.1`. Scope and exit criteria per
  > [ROADMAP.md §4 M1](../docs/ROADMAP.md). Use the `release.yml` checklist
  > to gate promotion to the experimental stream.

---

## M2 — Floor Manager (`milestone:m2-floor-manager`)

### Decide and implement FactionSystem (or formally fold into InfluenceSystem)
- **Template:** `system.yml` (parent)
- **Labels:** `type:system`, `area:engine`, `system:faction`, `system:influence`, `milestone:m2-floor-manager`, `stream:experimental`, `priority:p1-high`, `status:needs-design`
- **Body:**
  > `FactionSystem` is referenced in old prose and the roadmap but does not
  > exist as a module (GDD §14.1, §4.11; Vex §12 backlog). Decide: build the
  > module **or** delete the language and fold faction state into
  > `InfluenceSystem` + `CongressSystem`. Default plan per ROADMAP.md M2 is
  > to build it. Save schema bump → migration ladder entry per §13.3.3.
- **Sub-issues:**
  - **Design FactionSystem data shape and tick contract**
    - Template: `research.yml` · Labels: `type:research`, `system:faction`, `milestone:m2-floor-manager`, `priority:p1-high`
    - Body: Produce `docs/research/faction-system-design.md` defining `Faction` type, persisted standings shape, `weeklyUpdate()` and `loyaltyCheck()` contracts, and integration with `CongressSystem` member rosters.
  - **Implement FactionSystem.ts module + tests**
    - Template: `system.yml` · Labels: `type:system`, `area:engine`, `system:faction`, `milestone:m2-floor-manager`, `priority:p1-high`
    - Body: Build module per the design report above. L1 unit tests ≥80% line coverage.
  - **Persist faction standings on worldStore**
    - Template: `feature.yml` · Labels: `type:feature`, `area:store`, `area:save`, `system:faction`, `milestone:m2-floor-manager`, `priority:p1-high`, `breaking-change`
    - Body: Add `worldStore.factions[]`. Save schema v1→v2 migration test required (§13.3.3).
  - **Update GDD/ARCHITECTURE prose to match decision**
    - Template: `chore.yml` · Labels: `type:docs`, `system:faction`, `milestone:m2-floor-manager`, `priority:p2-normal`
- **Dependencies:** Persist quest.startedDay (avoid colliding save bumps)

### Build DialogueSystem renderer panel + node interpreter
- **Template:** `feature.yml` (parent)
- **Labels:** `type:feature`, `area:renderer`, `system:dialogue`, `milestone:m2-floor-manager`, `stream:experimental`, `priority:p1-high`
- **Body:**
  > `DialogueSystem` is scaffolded (GDD §4.0) but has no UI surface (§4.12,
  > §14.1, Vex §12 backlog). Ship a renderer panel that loads a tree from
  > `src/data/dialogue/`, evaluates conditions, runs effects, and progresses
  > nodes. Cite §12.5 (authoring guide) and §12.9 (open questions for Sol).
- **Sol-F-04 merge:** The renderer parent assumes data is loaded, but `dataLoader` does not currently glob `src/data/dialogue/`. Add `import.meta.glob('/src/data/dialogue/*.json', { eager: true, import: 'default' })` and a `dialogueTrees: DialogueTree[]` field on `DataBundle`; register via a small dialogue registry in `GameEngine.registerData`. Evidence: [`src/engine/dataLoader.ts` lines 35-66](../src/engine/dataLoader.ts#L35), [`src/engine/GameEngine.ts` lines 37-48](../src/engine/GameEngine.ts#L37). See [`sol-answers-vex.md`](sol-answers-vex.md) Q2. File as a sub-issue.
- **Sub-issues:**
  - **Add `failureHint` field to `DialogueOption` + greyed-out rendering** (Vex §12.9 q2)
  - **Decide modal vs. dedicated panel surface for dialogue** (Vex §12.9 q6, `research.yml`)
  - **Persist dialogue progress on worldStore (schema bump)** — ties into the M2 v2 schema bump
    - **Sol-F-16 merge:** Concretely, add `dialogueProgress: Record<string, string>` (treeId → currentNodeId) to `WorldState` and zero-init in `EMPTY`. Captured in v2 of the save schema (depends on F-02). Evidence: [`src/store/worldStore.ts` lines 45-69](../src/store/worldStore.ts#L45).
  - **Wire first authored dialogue sequence to a quest beat** (Template: `content.yml`)
    - **Sol-F-15 merge:** Scaffold `src/data/dialogue/` with one example `DialogueTree` (e.g. chief-of-staff intro). File payload === `DialogueTree`. Embed `failureHint` once and `isHidden` once so the renderer panel exercises both code paths. Schema header `$schemaVersion: 1`. Required by F-04 loader.
  - **[Sol-F-04] Wire dialogue trees into `dataLoader`** — sub-issue per merge note above.
- **Dependencies:** Decide and implement FactionSystem (shares schema bump)

### Add `scenario.victoryText` / `scenario.lossText` to scenario schema
- **Template:** `feature.yml`
- **Labels:** `type:feature`, `area:data`, `area:renderer`, `milestone:m2-floor-manager`, `stream:experimental`, `priority:p2-normal`
- **Body:**
  > GDD §3.3 promises end-of-run framing text per scenario; current scenario
  > schema lacks `victoryText`/`lossText` fields (Vex §12 backlog). Add the
  > fields, populate the existing scenario, and render at end-of-run.

### M2 release tracking — Floor Manager
- **Template:** `release.yml`
- **Labels:** `type:release`, `milestone:m2-floor-manager`, `stream:experimental`, `priority:p1-high`
- **Body:** Track `0.3.0-alpha.1`. Per ROADMAP.md §4 M2.

---

## M3 — Stump (`milestone:m3-stump`)

### Implement SpeechSystem module
- **Template:** `system.yml`
- **Labels:** `type:system`, `area:engine`, `system:speech`, `system:population`, `milestone:m3-stump`, `stream:experimental`, `priority:p1-high`, `status:needs-design`
- **Body:**
  > Pillar P3 ("speeches actually move populations") needs a `SpeechSystem`
  > (GDD §4.4, §12.6, §14.2; Vex §12 backlog). Add `src/systems/SpeechSystem.ts`
  > consuming rhetorical devices + phrase fragments + audience-fit scoring
  > (§12.6.4). L1/L2 tests required.

### Author rhetorical-device data file
- **Template:** `content.yml`
- **Labels:** `type:content`, `area:data`, `system:speech`, `milestone:m3-stump`, `priority:p2-normal`
- **Body:** Per GDD §12.6.2. Schema target: `src/data/speech/devices.json`.

### Author phrase-fragment data file
- **Template:** `content.yml`
- **Labels:** `type:content`, `area:data`, `system:speech`, `milestone:m3-stump`, `priority:p2-normal`
- **Body:** Per GDD §12.6.3. Schema target: `src/data/speech/fragments.json`. Each fragment carries an `i18nKey`.

### Add audience-segment priority data to PopulationGroup
- **Template:** `feature.yml`
- **Labels:** `type:feature`, `area:data`, `system:population`, `milestone:m3-stump`, `priority:p2-normal`, `breaking-change`
- **Body:** Per GDD §4.4 and §12.6.4. Each `PopulationGroup` gains an audience-priority vector consumed by SpeechSystem fit-scoring. Save migration entry required.

### Author news headline templates JSON
- **Template:** `content.yml`
- **Labels:** `type:content`, `area:data`, `system:speech`, `system:events`, `milestone:m3-stump`, `priority:p2-normal`
- **Body:** Per GDD §12.6.6. Consumed by SpeechSystem and EventEngine. Hook into string-content lint (§13.1.2).

### Build Speech Composer UI screen
- **Template:** `feature.yml`
- **Labels:** `type:feature`, `area:renderer`, `system:speech`, `milestone:m3-stump`, `priority:p1-high`
- **Body:** Renderer surface that lets the player compose a speech, see audience-fit score, deliver, and read the resulting headline. Match in-game styling tokens (sharp corners, serif+mono, gold focus ring, no-select on chrome).

### M3 release tracking — Stump
- **Template:** `release.yml`
- **Labels:** `type:release`, `milestone:m3-stump`, `stream:experimental`, `priority:p1-high`
- **Body:** Track `0.4.0-alpha.1`. Per ROADMAP.md §4 M3.

---

## M4 — Ironclad (`milestone:m4-ironclad`)

### Wire axe-core into Playwright a11y-scan pipeline
- **Template:** `feature.yml`
- **Labels:** `type:a11y`, `area:ci`, `area:renderer`, `milestone:m4-ironclad`, `stream:experimental`, `priority:p1-high`
- **Body:** Per GDD §13.4 and §13.8. Axe scan must return no critical/serious for the development→experimental column.

### Add CSP meta tag + electron `session.webRequest` headers
- **Template:** `feature.yml`
- **Labels:** `type:security`, `area:electron`, `area:renderer`, `area:capacitor`, `milestone:m4-ironclad`, `stream:experimental`, `priority:p1-high`
- **Body:** Per GDD §13.5. Strict CSP for web + Capacitor + Electron. No remote origins (assets ship in bundle, §7).
- **Sol-F-13 merge:** Renderer-side meta tag can land first as a sub-issue; `index.html` ships without any CSP today. Evidence: [`index.html` lines 1-32](../index.html#L1). Recommended directive: `default-src 'self'; img-src 'self' data:; font-src 'self' https://fonts.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; script-src 'self'`. Parent retains the Electron `session.webRequest` headers and Capacitor allowlist work.
- **Sol-F-23 merge:** Capacitor side: add `server.allowNavigation: []` (empty) so any in-app navigation to a non-bundle URL is denied. `allowMixedContent: false` already correct. Evidence: [`capacitor.config.ts` lines 1-17](../capacitor.config.ts#L1). File as a sub-issue.
- **Sub-issues (from Sol findings):**
  - **[Sol-F-13] Add `Content-Security-Policy` meta tag to `index.html`** (renderer-side)
  - **[Sol-F-23] Add `server.allowNavigation: []` to Capacitor config**

### Build save-fixture corpus under `src/test/fixtures/saves/`
- **Template:** `feature.yml`
- **Labels:** `type:feature`, `area:save`, `system:save`, `milestone:m4-ironclad`, `stream:experimental`, `priority:p1-high`
- **Body:** Per GDD §13.3. ≥5 fixtures spanning v0→v1 (and any v2 from M2). "Every save can be loaded" test gate becomes real CI.
- **Sol-F-25 merge:** After F-06 lands, add a save round-trip test that fires every `worldStore` action, saves, loads, and asserts state equality. Folds into this corpus as the action round-trip variant. Evidence: [`src/store/worldStore.ts` lines 109-180](../src/store/worldStore.ts#L109).
- **Sub-issues (from Sol findings):**
  - **[Sol-F-25] worldStore action round-trip save fixture**

### IPC fuzz harness for `pa:save:*` and `pa:settings:*`
- **Template:** `feature.yml`
- **Labels:** `type:security`, `area:electron`, `area:ci`, `milestone:m4-ironclad`, `stream:experimental`, `priority:p1-high`
- **Body:** Per GDD §13.5 + Rook §13 backlog. Property-based / malformed-input fuzz; assert safe rejection.

### IPC handler input validation tests
- **Template:** `feature.yml`
- **Labels:** `type:security`, `area:electron`, `milestone:m4-ironclad`, `priority:p1-high`
- **Body:** Per GDD §13.5 (line ~1619 "IPC handlers must validate input types"). Unit-style integration test per handler that asserts type rejection.
- **Sol-F-03 merge:** This entry is test-only. The actual handler hardening for `pa:settings:set` (key allowlist + per-key type validation) is filed separately as F-03 (see Phase 4 additions below). Evidence: [`src/main/main.ts` lines 159-166](../src/main/main.ts#L159) — current handler accepts arbitrary `Record<string, unknown>` and persists verbatim.

### ESLint rule: forbid `Date.now()` outside test/dev
- **Template:** `chore.yml`
- **Labels:** `type:chore`, `area:engine`, `area:ci`, `milestone:m4-ironclad`, `priority:p2-normal`
- **Body:** Per GDD §13.2. Ban `Date.now()` in engine/system code; enforce in `pr-validate`.
- **Sol-F-11 merge:** Add a test-shaped twin so the guard runs on every PR before lint lands: extend `src/test/determinism.test.ts` to scan for `Date.now(` with the same allow-list comment (`// eslint-disable-line determinism/seeded-rng`). The current guard scans `Math.random(` only and let F-01 slip through. Evidence: [`src/test/determinism.test.ts` lines 138-152](../src/test/determinism.test.ts#L138). File as a sub-issue.
- **Sub-issues (from Sol findings):**
  - **[Sol-F-11] Extend determinism test guard to forbid `Date.now()`**

### ESLint rule: forbid `console.log` in production paths
- **Template:** `chore.yml`
- **Labels:** `type:chore`, `area:ci`, `milestone:m4-ironclad`, `priority:p2-normal`
- **Body:** Per GDD §13.1.2 / §13.9. Allow in `*.test.ts` and dev-only files; forbid elsewhere.

### Add `.nvmrc` pinning Node 20 LTS
- **Template:** `chore.yml`
- **Labels:** `type:chore`, `area:ci`, `milestone:m4-ironclad`, `priority:p2-normal`
- **Body:** Per Rook §13 backlog. Pin to 20 LTS at the repo root.

### Nested ErrorBoundary at panel boundary
- **Template:** `feature.yml`
- **Labels:** `type:feature`, `area:renderer`, `milestone:m4-ironclad`, `priority:p2-normal`
- **Body:** Per GDD §13.9.1. Per-panel boundary so a single panel can fail without taking the whole renderer down.

### M4 release tracking — Ironclad
- **Template:** `release.yml`
- **Labels:** `type:release`, `milestone:m4-ironclad`, `stream:experimental`, `priority:p1-high`
- **Body:** Track `0.5.0-alpha.1`. Per ROADMAP.md §4 M4.

---

## M5 — Lectern (`milestone:m5-lectern`)

### Migrate hardcoded traits from `CharacterSystem.ts` to `src/data/traits/*.json`
- **Template:** `tech-debt.yml`
- **Labels:** `type:tech-debt`, `area:data`, `system:character`, `milestone:m5-lectern`, `priority:p2-normal`
- **Body:** Per GDD §14.1, §4.7, Vex §12 backlog. Trait definitions are split between TS source and JSON. Complete the migration; extend string-content lint (§13.1.2).

### Card flavour pass for every shipped card
- **Template:** `content.yml`
- **Labels:** `type:content`, `area:data`, `system:cards`, `milestone:m5-lectern`, `priority:p2-normal`
- **Body:** Per GDD §4.6, Vex §12 backlog. Voice-bible-compliant flavour text on every card.

### Implement card hand drawer in `BottomBar.tsx`
- **Template:** `feature.yml`
- **Labels:** `type:feature`, `area:renderer`, `system:cards`, `milestone:m5-lectern`, `priority:p2-normal`
- **Body:** Per GDD §14.1 and old §11.3. Persistent bottom-right hand drawer. Match in-game styling conventions.

### i18n scaffolding: string-bundle module + locale-aware formatter
- **Template:** `feature.yml`
- **Labels:** `type:feature`, `area:i18n`, `area:renderer`, `milestone:m5-lectern`, `priority:p2-normal`, `breaking-change`
- **Body:** Per GDD §12.8 + ROADMAP.md M5. `en-US` populated; runtime locale switch plumbed even if no second locale ships.

### Move humanise dictionary into the locale bundle
- **Template:** `tech-debt.yml`
- **Labels:** `type:tech-debt`, `area:i18n`, `milestone:m5-lectern`, `priority:p3-low`
- **Body:** Per ROADMAP.md M5 deliverables. Currently inline; should live in the locale bundle.
- **Sol-F-18 merge:** Add an override hook so scenario-specific cohorts (e.g. Cold War "war hawks") can extend the dictionary without editing `humanize.ts`. Evidence: [`src/utils/humanize.ts`](../src/utils/humanize.ts) — dictionary hardcoded. File as a sub-issue alongside the locale bundle move.
- **Sub-issues (from Sol findings):**
  - **[Sol-F-18] Allow data-driven overrides for `humaniseId` dictionary**

### M5 release tracking — Lectern
- **Template:** `release.yml`
- **Labels:** `type:release`, `milestone:m5-lectern`, `stream:experimental`, `priority:p1-high`
- **Body:** Track `0.6.0-alpha.1`. Per ROADMAP.md §4 M5.

---

## M6 — Telemetry (`milestone:m6-telemetry`)

### Create `bench/` with §13.6.3 fixtures (1w / 13w / 52w / 5y)
- **Template:** `feature.yml`
- **Labels:** `type:feature`, `area:ci`, `milestone:m6-telemetry`, `priority:p1-high`
- **Body:** Per GDD §13.6.3.
- **Sol-F-20 merge:** Add three `package.json` scripts so the M6 perf hard-gate and ergonomic dev work are one command: `"bench": "vitest run bench/"`, `"lint:fix": "eslint --fix \"src/**/*.{ts,tsx}\""`, `"e2e:headed": "playwright test --headed"`. Depends on F-07 (Playwright dep). Evidence: [`package.json` lines 11-26](../package.json#L11). File as a sub-issue.
- **Sub-issues (from Sol findings):**
  - **[Sol-F-20] Add `bench`, `lint:fix`, `e2e:headed` scripts to `package.json`**

### Wire perf hard-gate into `pr-validate`
- **Template:** `feature.yml`
- **Labels:** `type:feature`, `area:ci`, `milestone:m6-telemetry`, `priority:p1-high`
- **Body:** Per GDD §13.6 + §13.8. Block PRs that regress hard-gate metrics.

### Wire perf soft-gate into `nightly-soak`
- **Template:** `feature.yml`
- **Labels:** `type:feature`, `area:ci`, `milestone:m6-telemetry`, `priority:p2-normal`
- **Body:** 03:00 UTC schedule; posts green/red status.

### Bundle-size budget enforcement
- **Template:** `feature.yml`
- **Labels:** `type:feature`, `area:ci`, `milestone:m6-telemetry`, `priority:p2-normal`
- **Body:** Per GDD §11. Numeric budget; fail PR if exceeded.

### Enable branch protection on `experimental` and `release`
- **Template:** `chore.yml`
- **Labels:** `type:chore`, `area:ci`, `milestone:m6-telemetry`, `priority:p1-high`
- **Body:** Per GDD §13.8.1. Required checks: pr-validate, a11y-scan, security-scan. No force-push, no deletion.

### M6 release tracking — Telemetry
- **Template:** `release.yml`
- **Labels:** `type:release`, `milestone:m6-telemetry`, `stream:experimental`, `priority:p1-high`
- **Body:** Track `0.7.0-alpha.1`. Per ROADMAP.md §4 M6.

---

## M7 — Second Front (`milestone:m7-second-front`)

### Cold War scenario data bundle
- **Template:** `content.yml` (parent)
- **Labels:** `type:content`, `area:data`, `milestone:m7-second-front`, `priority:p1-high`
- **Body:** Per ROADMAP.md M7 + GDD §12.7. Recommended pick: Cold War (1947–1991). Reuses modern Congress shape with new factions; exercises FactionSystem (M2) and SpeechSystem (M3) under different audience priors.
- **Sub-issues:**
  - **Author `scenario.json` for Cold War**
  - **Author `legislators.json` for Cold War**
  - **Author `population.json` for Cold War**
  - **Author `economy.json` for Cold War**
  - **Author Cold War scenario events**
  - **Author Cold War narrative brief assets** (per §12.7.2)
  - **Add Cold War scenario to fixture corpus** (template: `feature.yml`, labels include `area:save`)
- **Dependencies:** FactionSystem (M2), SpeechSystem (M3), i18n scaffolding (M5)

### M7 release tracking — Second Front
- **Template:** `release.yml`
- **Labels:** `type:release`, `milestone:m7-second-front`, `stream:experimental`, `priority:p1-high`
- **Body:** Track `0.8.0-alpha.1`. Per ROADMAP.md §4 M7.

---

## M8 — Quorum (`milestone:m8-quorum`)

### Manual a11y checklist sign-off
- **Template:** `a11y.yml`
- **Labels:** `type:a11y`, `milestone:m8-quorum`, `stream:stable`, `priority:p1-high`
- **Body:** Per GDD §13.4.3.

### Electron Win/macOS/Linux smoke
- **Template:** `feature.yml`
- **Labels:** `type:chore`, `area:electron`, `area:ci`, `milestone:m8-quorum`, `priority:p1-high`
- **Body:** Per GDD §13.7.1 stable column.

### Capacitor Android smoke
- **Template:** `feature.yml`
- **Labels:** `type:chore`, `area:capacitor`, `area:ci`, `milestone:m8-quorum`, `priority:p1-high`

### CodeQL clean pass
- **Template:** `chore.yml`
- **Labels:** `type:security`, `area:ci`, `milestone:m8-quorum`, `priority:p1-high`

### Signed binaries pipeline
- **Template:** `chore.yml`
- **Labels:** `type:chore`, `area:ci`, `area:electron`, `milestone:m8-quorum`, `priority:p1-high`

### Stable changelog `<date>-1.0.0.md` + wiki Release-Notes update
- **Template:** `chore.yml`
- **Labels:** `type:docs`, `milestone:m8-quorum`, `stream:stable`, `priority:p1-high`

### GDD §14 risk review for 1.0
- **Template:** `chore.yml`
- **Labels:** `type:docs`, `milestone:m8-quorum`, `priority:p2-normal`

### M8 release tracking — Quorum
- **Template:** `release.yml`
- **Labels:** `type:release`, `milestone:m8-quorum`, `stream:stable`, `priority:p0-critical`
- **Body:** Track `1.0.0-rc.1`. Both columns of GDD §13.7.1 must be green.

---

## Unscheduled / deferred

### Re-evaluate Web Worker for population sim
- **Template:** `research.yml`
- **Labels:** `type:research`, `system:population`, `priority:p3-low`
- **Body:** Per GDD §14.1 and ROADMAP.md §6. With ~10 groups, not required. Re-evaluate when scenarios add regional cohorts.

### **[Jesse-proposed]** Add `CODEOWNERS`
- **Template:** `chore.yml`
- **Labels:** `type:chore`, `area:ci`, `priority:p2-normal`
- **Body:** Establish review ownership before branch protection lands in M6. Map `src/engine/`, `src/systems/`, `src/renderer/`, `src/data/`, `docs/`, and `.github/` to maintainers.

### **[Jesse-proposed]** Run `scripts/sync-labels.ps1` on Project #9 repo
- This is a **manual action**, not a tracked issue. See §"Next manual actions" in the final report.

---

## Audit-required entries (existing Project #9 issues)

> Jesse cannot read the live state of Project #9 from this environment. The
> entries below are placeholders the user must reconcile manually following
> the procedure in [`issue-audit-checklist.md`](issue-audit-checklist.md).

- **`audit-required:` All open issues created before this seed list landed.**
  Recipe: export, classify under one of the templates above, apply the
  taxonomy in `labels.md`, set milestone + priority + estimate, and either
  fold into a seed entry above or keep as standalone with full metadata.
- **`audit-required:` Any issues already auto-added to Project #9 by the legacy `scripts/new-issue.ps1` (which targets project #6).** That script's project number is stale; flag any issues misrouted to project #6 vs #9 and reconcile.
- **`audit-required:` Closed issues referenced by the wiki or roadmap that may need re-opening under the new template set.**

---

## Phase 4 additions (Sol findings)

> Source: [`sol-phase4-backlog.md`](sol-phase4-backlog.md). 27 findings total. 11 are filed as sub-issues under existing seed entries above (see "Sol-F-XX merge" notes). The remaining 16 stand-alone entries are listed here by milestone, paste-ready for `gh issue create`. Severity prefixes (P0/P1/P2/P3) match Sol's table.
>
> Cross-cutting: F-05 (dialogue token syntax) is **design-blocked** pending user/Bridge confirmation of `{token}` vs `{{token}}`. Sol recommends `{token}` (ICU-compatible). Do not file F-05 until that decision lands.

### M1 Cloakroom

#### [Sol-F-01] [P0] Replace `Date.now()` RNG seed inside `LegislationSystem.draftBill`
- **Template:** `bug.yml`
- **Labels:** `type:bug`, `area:engine`, `system:legislation`, `milestone:m1-cloakroom`, `priority:p0-critical`, `stream:experimental`
- **Body:**
  > `LegislationSystem.draftBill` seeds its RNG with `Date.now()`, which makes the resulting bill id non-deterministic across two replays of the same save. Per GDD §13.2 ("strict determinism in engine/systems/store") this is a hard violation. Replace with `world.seed + toEpochDays(currentDate) + world.pendingLegislation.length` (the same idiom used by `maybeSpawnNpcBill` at line 254). Add a regression test under `src/systems/LegislationSystem.test.ts` that drafts twice from the same fixture seed and asserts identical bill ids. Evidence: [`src/systems/LegislationSystem.ts` line 206](../src/systems/LegislationSystem.ts#L206).
- **Dependencies:** none (lands in `exp--legislative-overhaul`).

#### [Sol-F-06] [P1] Validate per-store payload shape inside `applySavePayload`
- **Template:** `bug.yml`
- **Labels:** `type:bug`, `area:save`, `system:save`, `milestone:m1-cloakroom`, `priority:p1-high`, `stream:experimental`
- **Body:**
  > `applySavePayload` writes whatever `payload.stores.world` contains into the world store. A corrupted v1 save with a valid `meta` but a malformed `world` (e.g. `population` not an array) will load and then crash the renderer at the first read. Add lightweight per-store guards (top-level shape only — same depth as the existing `isValid` in `dataLoader`). Reject with the existing `LoadResult` discriminated union. GDD §13.3. Evidence: [`src/engine/SaveSystem.ts` lines 264-279](../src/engine/SaveSystem.ts#L264), [`src/engine/SaveSystem.ts` lines 165-176](../src/engine/SaveSystem.ts#L165).
- **Dependencies:** none. Unblocks F-02.

#### [Sol-F-07] [P1] Add `@playwright/test` to `devDependencies`
- **Template:** `chore.yml`
- **Labels:** `type:chore`, `area:ci`, `milestone:m1-cloakroom`, `priority:p1-high`
- **Body:**
  > Playwright is invoked by `tests/e2e/*.spec.ts` and `playwright.config.ts` but is not declared in `package.json`. Fresh clones rely on a global install or implicit hoisting. Add `@playwright/test` to `devDependencies` and add `"e2e": "playwright test"` to `scripts`. Required before any CI runner picks the repo up (Phase 6). Evidence: [`package.json` lines 28-58](../package.json#L28).
- **Dependencies:** none. Blocks F-20 and Rook's Phase 6 CI work.

### M2 Floor Manager

#### [Sol-F-02] [P1] Implement save-schema migration ladder (v1→v2 scaffolding)
- **Template:** `system.yml`
- **Labels:** `type:feature`, `area:save`, `system:save`, `milestone:m2-floor-manager`, `priority:p1-high`, `stream:experimental`, `breaking-change`
- **Body:**
  > `SaveSystem.readSave` currently rejects any save not at the current schema version (§13.3.3). M2 introduces v2 (factions, dialogueProgress, quest.startedDay — see [`sol-answers-vex.md`](sol-answers-vex.md) Q6). Add a `migrate(payload, fromVersion): SavePayload` function chain so a v1 save loads cleanly into v2. Land the v1→v2 migrator alongside the first v2 field bump, with a fixture in `src/test/fixtures/saves/v1/` to lock the upgrade. Without this, the M2 release breaks every existing playtester save. Evidence: [`src/engine/SaveSystem.ts` lines 165-176, 218-228](../src/engine/SaveSystem.ts#L165).
- **Dependencies:** F-06 (per-store validation lands first); blocks every M2 schema-bump issue.

#### [Sol-F-05] [P1] Implement dialogue token resolver (`{playerName}` etc.) — **DESIGN-BLOCKED**
- **Template:** `feature.yml`
- **Labels:** `type:feature`, `system:dialogue`, `area:engine`, `milestone:m2-floor-manager`, `priority:p1-high`, `status:needs-design`
- **Body:**
  > Dialogue authoring needs runtime substitution. Recommended syntax (per [`sol-answers-vex.md`](sol-answers-vex.md) Q4): single curly braces, ICU-compatible. Initial token set: `{playerName}`, `{characterName}`, `{npcName}`, `{partyShort}`, `{week}`, `{year}`, `{pc}`, `{ap}`. Unknown tokens render as literal and emit `log.warn`. Implement inside `DialogueSystem` as `resolveTokens(text, ctx) → string`. Add unit tests for each token + the unknown-token fallback. Evidence: [`src/types/dialogue.ts` lines 14-19](../src/types/dialogue.ts#L14).
- **Status:** **Awaiting user/Bridge confirmation of `{token}` vs `{{token}}`.** Do not file until decided.

#### [Sol-F-08] [P2] Honour `Effect.delayDays` and `Effect.duration`, or remove them from the type
- **Template:** `tech-debt.yml`
- **Labels:** `type:tech-debt`, `area:engine`, `system:effects`, `milestone:m2-floor-manager`, `priority:p2-normal`
- **Body:**
  > `Effect.delayDays` and `Effect.duration` are declared but the runtime applies all effects immediately. Authors who set these expect them to mean something. Either implement a scheduled-effects queue on `worldStore` (deterministic, ticked by `TimeEngine.onDaily`) or drop the fields from the type. Decide as part of M2. Evidence: [`src/engine/applyEffect.ts` lines 13-16](../src/engine/applyEffect.ts#L13), [`src/types/effect.ts` lines 21-23](../src/types/effect.ts#L21).
- **Status:** Sol flags as design-blocked (scheduler vs remove). Pair the decision with F-22 (exhaustiveness arm).

#### [Sol-F-14] [P3] Document `DialogueOption.isHidden` vs. `requirements` semantics
- **Template:** `chore.yml`
- **Labels:** `type:docs`, `system:dialogue`, `milestone:m2-floor-manager`, `priority:p3-low`
- **Body:**
  > `visibleOptions` filters by `isHidden` and `requirements` separately: `isHidden=true` always hides; `requirements` failure also hides. Authors will conflate the two. Add a JSDoc note on the type and one short paragraph in the wiki Authoring-Dialogue page distinguishing "permanently hidden" from "gated by requirements (with optional `failureHint`)". Evidence: [`src/systems/DialogueSystem.ts` lines 53-57](../src/systems/DialogueSystem.ts#L53), [`src/types/dialogue.ts` line 11](../src/types/dialogue.ts#L11).

#### [Sol-F-22] [P3] `applyEffect` lacks an exhaustiveness `default` arm
- **Template:** `tech-debt.yml`
- **Labels:** `type:tech-debt`, `area:engine`, `milestone:m2-floor-manager`, `priority:p3-low`
- **Body:**
  > Add `default: { const _exhaustive: never = effect; log.warn('unknown effect', _exhaustive); }` so a new variant added to the discriminated union surfaces a TypeScript error at the call site. Evidence: [`src/engine/applyEffect.ts` lines 19-98](../src/engine/applyEffect.ts#L19). Folds with F-08.

### M3 Stump

#### [Sol-F-17] [P3] `src/data/quests/` and `src/data/events/` content sparseness — flag, don't fix
- **Template:** `content.yml`
- **Labels:** `type:content`, `area:data`, `system:quests`, `system:events`, `milestone:m5-lectern`, `priority:p3-low`
- **Body:**
  > Both folders contain a single file. Modders cannot drop a new file in without colliding with the existing one. Split each into thematic subfiles (`quests/onboarding.json`, `quests/personal-life.json`, `events/political-cycle.json`, etc.). No new content needed in this issue — purely a structural split.
- **Status:** Sol flags as design-blocked (content-team preference); milestone listed as M5 per Sol's table though the Phase 4 summary lists it under M3 — **using M5 from Sol's individual finding entry (authoritative).**

### M4 Ironclad

#### [Sol-F-03] [P1] IPC `pa:settings:set` accepts unrestricted record; add allowlist + type guard
- **Template:** `feature.yml`
- **Labels:** `type:security`, `area:electron`, `milestone:m4-ironclad`, `priority:p1-high`, `stream:experimental`
- **Body:**
  > The settings IPC handler accepts any object and writes it to `electron-store` verbatim. A compromised renderer could write keys the main process later trusts (e.g. spoofed paths). Add a key allowlist (`fullscreen`, `numberPrecision`, `tooltipDelay`, …) and per-key type validation. Reject otherwise. Add to the IPC fuzz harness already tracked in seed-issues. Evidence: [`src/main/main.ts` lines 159-166](../src/main/main.ts#L159).
- **Related:** Distinct from "IPC handler input validation tests" — that entry is test-only; this is the handler hardening.

#### [Sol-F-09] [P2] Replace `applyEffect` `grant_card` and `trigger_quest` stubs with real handlers
- **Template:** `tech-debt.yml`
- **Labels:** `type:tech-debt`, `area:engine`, `system:cards`, `system:quests`, `milestone:m4-ironclad`, `priority:p2-normal`
- **Body:**
  > `grant_card` only pushes a news headline; `trigger_quest` only sets a flag. Both are documented stubs. Replace with calls into `CardSystem.grant(cardId)` and `QuestSystem.start(questId)` so the effect type matches its name. Keep the news/flag side effects as diagnostics. Add unit tests covering both paths. Evidence: [`src/engine/applyEffect.ts` lines 81-95](../src/engine/applyEffect.ts#L81-L95).

#### [Sol-F-10] [P2] `src/utils/id.ts` falls back to `Math.random()` — make `rng` required for engine callers
- **Template:** `tech-debt.yml`
- **Labels:** `type:tech-debt`, `area:engine`, `area:ci`, `milestone:m4-ironclad`, `priority:p2-normal`
- **Body:**
  > `makeId(prefix, rng?)` falls back to `Math.random()` when no rng is passed. Engine code that omits `rng` silently desyncs from a save replay. Either split into `makeId(prefix, rng)` (engine, required) and `makeUiId(prefix)` (renderer, allowed) or wrap with an ESLint rule that forbids the optional form inside `src/engine/` and `src/systems/`. Evidence: [`src/utils/id.ts` lines 5-9](../src/utils/id.ts#L5).

#### [Sol-F-12] [P1] Replace `(children as any)` casts inside `ExtendedTooltip`
- **Template:** `tech-debt.yml`
- **Labels:** `type:tech-debt`, `area:renderer`, `milestone:m4-ironclad`, `priority:p1-high`
- **Body:**
  > `ExtendedTooltip` forwards mouse/focus handlers to a child by escaping the type system. Six `as any` casts in 50 lines. Replace with a `cloneElement` pattern that types `children` as `ReactElement<TooltipChildProps>`. Removes the only large `as any` cluster in the renderer. Evidence: [`src/renderer/components/tooltip/ExtendedTooltip.tsx` lines 428-473](../src/renderer/components/tooltip/ExtendedTooltip.tsx#L428).

#### [Sol-F-21] [P2] `electron-store` schema declared but not enforced — add JSON schema
- **Template:** `feature.yml`
- **Labels:** `type:security`, `area:electron`, `milestone:m4-ironclad`, `priority:p2-normal`
- **Body:**
  > Pass a real JSON schema to `new Store({ schema: … })` so a corrupted store on disk (or a malicious renderer that bypasses the IPC layer) is rejected at the persistence boundary. GDD §13.5 IPC defence-in-depth. Evidence: [`src/main/main.ts` lines 27-37](../src/main/main.ts#L27).

### M5 Lectern

#### [Sol-F-19] [P3] Add `tsconfig.web.json` strictness flags `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`
- **Template:** `chore.yml`
- **Labels:** `type:chore`, `area:ci`, `milestone:m5-lectern`, `priority:p3-low`
- **Body:**
  > Enable `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes` in both `tsconfig.web.json` and `tsconfig.electron.json`. Expect a one-time burst of failures around `worldStore.relationships[id]`, `bills.find(…)?.x`, and option-bag callers. Land in M5 once the content surface stabilises. Evidence: [`tsconfig.web.json` lines 7-15](../tsconfig.web.json#L7).

#### [Sol-F-24] [P2] `dataLoader` validation only checks required fields are present, not their type
- **Template:** `tech-debt.yml`
- **Labels:** `type:tech-debt`, `area:engine`, `area:data`, `milestone:m5-lectern`, `priority:p2-normal`
- **Body:**
  > A scenario with `id: 42` (number, not branded string) passes today. Tighten the validator to accept a per-field type predicate, not just a presence check. Run as part of the i18n/schema pass since both touch the same loader. Evidence: [`src/engine/dataLoader.ts` lines 165-172](../src/engine/dataLoader.ts#L165).

### Unscheduled

#### [Sol-F-26] [P3] Audit `(window as any)` in tests vs production
- **Template:** `tech-debt.yml`
- **Labels:** `type:tech-debt`, `area:test`, `priority:p3-low`
- **Body:**
  > Test-only casts; safe but worth replacing with a typed `declare global` augmentation so the bridge surface is enforced everywhere it is referenced. Evidence: [`src/test/setup.ts` lines 32, 53](../src/test/setup.ts#L32), [`src/engine/SaveSystem.test.ts` line 32](../src/engine/SaveSystem.test.ts#L32).

---

## Counts by milestone

> Updated after Phase 4. New stand-alone Sol findings are folded into per-milestone counts; merged sub-issues add to sub-issue totals. **F-05 is design-blocked and not counted until the `{token}` syntax decision lands** (will add +1 to M2 top-level when filed).

| Milestone | Top-level issues | Sub-issues | Total | Phase 4 added |
|---|---|---|---|---|
| M1 Cloakroom | 8 (5 + F-01, F-06, F-07) | 0 | 8 | +3 top |
| M2 Floor Manager | 8 (4 + F-02, F-08, F-14, F-22) | 11 (8 + F-04, F-15, F-16) | 19 | +4 top, +3 sub |
| M3 Stump | 7 | 0 | 7 | — |
| M4 Ironclad | 15 (10 + F-03, F-09, F-10, F-12, F-21) | 4 (F-11, F-13, F-23, F-25) | 19 | +5 top, +4 sub |
| M5 Lectern | 9 (6 + F-17, F-19, F-24) | 1 (F-18) | 10 | +3 top, +1 sub |
| M6 Telemetry | 6 | 1 (F-20) | 7 | +1 sub |
| M7 Second Front | 2 | 7 | 9 | — |
| M8 Quorum | 8 | 0 | 8 | — |
| Unscheduled | 3 (2 + F-26) | 0 | 3 | +1 top |
| **Total** | **66** | **25** | **91** | **+16 top, +10 sub** |

Phase 2 baseline was 50 top + 15 sub = 65. Phase 4 adds 16 standalone + 10 sub-issues = 26 net; +1 more (F-05) when the design decision lands → projected 92.
