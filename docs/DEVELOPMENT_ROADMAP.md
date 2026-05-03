# Political Ascent — Development Roadmap (Detailed)

**Status snapshot:** 2026-05-01
**Engine version:** 0.1.0-alpha.1-exp.20260429
**Source of truth for high-level vision:** [`docs/ROADMAP.md`](./ROADMAP.md) (milestone schedule)
**Source of truth for active todos:** [`docs/todo.md`](./todo.md) (90+ items, mixed open/shipped)
**Source of truth for design intent:** [`docs/GDD.md`](./GDD.md)
**Source of truth for technical patterns:** [`docs/ARCHITECTURE.md`](./ARCHITECTURE.md)

This document is the *operational* roadmap. Where `ROADMAP.md` describes the
versioned milestones and `todo.md` lists every open thought the Lead Director
has had, this file maps the current state of the codebase to a sequenced,
test-anchored plan toward the next concrete deliverables. It is updated by the
agent at the end of each material work session.

---

## 1. Where we are right now

### Engineering health

| Surface | State | Notes |
|---|---|---|
| TypeScript typecheck | **green** | Cleared 5 errors this session (`NewsPanel`, `Game.tsx`, `CardSystem.test.ts`). |
| ESLint | **green** | Cleared 15 `react/no-unescaped-entities` errors in `GlossaryPanel.tsx`. |
| Vitest (unit) | **green** — 41 files / 293 tests passing | Coverage strongest in `utils/`, `engine/`, partial in `systems/`. |
| Vite production build (`build:web`) | **green** | 474 kB / 143 kB gzipped — within budget. |
| Playwright e2e | **75 pass / 10 fail / 1 flaky** at 1280×720 baseline | Failures are (a) baseline-screenshot first-run writes, (b) stale selector for the renamed *Knowledge Base* tab, (c) mobile spec running on desktop projects. All addressed this session. |
| Game launches via `npm run dev` | **yes** | Mounts root, MainMenu visible, all four buttons interactive. |
| Capacitor Android | scaffolded, **not built in this env** | Build in environment with Android SDK + Java 17. |

### Feature breadth (vs `ROADMAP.md` v0.1 milestones)

| Milestone | Coverage | Evidence |
|---|---|---|
| 0. Project setup | ✅ | `package.json`, `tsconfig.*`, `tailwind.config.ts`, `vite.config.ts`, `playwright.config.ts` all present. |
| 1. Core types & architecture | ✅ | `src/types/*.ts`, all stores, all engines exist. `dataLoader.ts` with schema validation. |
| 2. Main menu & app shell | ✅ | `MainMenu`, `Settings`, `Achievements` screens; `TopBar`, `Sidebar`, `BottomBar`, `ContextPanel`, modal/toast systems present. |
| 3. Character creation | ✅ | Multi-step `CharacterCreation.tsx` with backgrounds, ideology compass, point-buy stats, traits, build-profile (todo#27). |
| 4. Modern America scenario | ✅ | `src/data/scenarios/modern-america-2024/` ships scenario, legislators, population, economy. |
| 5. Time engine + speed | ✅ | `TimeEngine.ts` with daily/weekly/monthly/annual hooks. |
| 6. Population system | ✅ | `PopulationSystem.weeklyUpdate` operational, focus tab UI shipped. |
| 7. Economy system | ✅ | `EconomySystem` with weekly drift, monthly snapshot, annual report. |
| 8. Legislation | ✅ | Draft → committee → floor → vote pipeline; `DraftLegislationScreen` + `LegislationPanel` + vote-result modal (todo#85). |
| 9. Congress chamber | ✅ | `CongressPanel` with hemicycle, member modal, Dim/Hide filter, ideology labels (todo#91). |
| 10. Card system | ✅ | `CardSystem` with cost gating, cooldowns, uses-per-game; `CollectionPanel`, pack-opening carousel (todo#53). |
| 11. Quest system | ✅ | `QuestSystem` + two-pane `QuestsPanel` (todo#13). |
| 12. Skill tree | ✅ | `SkillSystem` + `SkillsPanel`. |
| 13. Save/Load | ✅ | `SaveSystem.ts` + `SaveLoadModal`, dev-mode tagging. |
| 14. Settings | ✅ | Audio / gameplay / display / accessibility tabs in `Settings.tsx`. |
| 15. Events / news | ✅ | `EventEngine` + `NewsPanel` + `TimelinePanel`. |
| 16. Achievements | ✅ | `AchievementEngine` + `Achievements.tsx`. |
| 17. Tutorials / glossary | ✅ | Knowledge Base panel (todo#16, todo#45). |
| 18. Polish & balance | partial | Polish-pack, tooltips-everywhere, dashboard-interactivity, right-click menus all shipped. |

**Read:** the v0.1 MVP scope is functionally complete. The game is in the
*"mature alpha that needs play-testing and balance"* phase, not the
*"finish features"* phase.

---

## 2. Definition of Play-Test Ready (the play-test-ready bar)

A build is **play-test ready** when **all** of the following hold on
`development`:

1. `npm install && npm run lint && npm run typecheck && npm test && npm run build:web` is clean from a fresh clone.
2. `npm run dev` boots, `npm run test:e2e -- --project=chromium-1280x720` passes (smoke + at least one full new-game-to-dashboard flow).
3. A human can complete the full happy path: **MainMenu → New Game → Build Your Candidate → Scenario Select → Dashboard → draft and pass one bill → see the vote-result modal → save → reload → see persisted state.**
4. No emoji in shipped UI (`grep -RE "[😀-🿿]" src/renderer/**/*.{ts,tsx}` empty).
5. No `Math.random()` reach into `src/engine/**` or `src/systems/**` outside of permitted fall-throughs.
6. The achievements engine fires at least one achievement during a 30-week play session.
7. Save files written by the current build can be re-loaded by the same build (round-trip integrity).
8. CHANGELOG and Wiki home page reflect the version under test.

**This session reached items 1, 2, 4, 5 cleanly; items 3, 6, 7 are tracked
below.**

---

## 3. Next milestone — `v0.1.0-beta.1` (play-test build)

Goal: produce a build a friendly play-tester can run end-to-end for a 60-minute
session and submit feedback through the in-game patch-notes/feedback flow.

### 3.1 Engineering hygiene (this PR)

- [x] Fix all `tsc` errors blocking `typecheck`.
- [x] Fix all `eslint` errors blocking `lint`.
- [x] Restore Playwright invocability (`@playwright/test` was missing from `package.json`; `test:e2e*` scripts were missing).
- [x] Repair pre-existing test bugs surfaced by the run:
  - `glossary-panel.spec.ts` searched for "Glossary" after sidebar was renamed "Knowledge Base".
  - `accessibility.spec.ts` imported `../fixtures/...` but fixtures live at `tests/e2e/fixtures/`.
  - `mobile-portrait.spec.ts` ran on desktop viewport projects where its selectors are intentionally hidden.

### 3.2 Play-test happy-path verification

- [ ] **Add a `play-test.spec.ts`** that walks MainMenu → CharacterCreation → ScenarioSelect → Dashboard → Draft Bill → Advance through committee → Floor vote → Save → Reload → State preserved. One spec, one viewport, fail-loud.
- [ ] Capture the screenshot suite at 1280×720 / 1440×900 / 1920×1080 for the Dashboard, Legislation, Congress, Population, Economy, Cards, Skills, Knowledge Base panels.
- [ ] Wire those screenshots into `tests/e2e/__screenshots__/` for diffability and surface them in the next PR description.

### 3.3 Bug-fix sweep (top 5 by play-test impact)

Drawn from `docs/todo.md` and visual inspection of the current build:

- [ ] **Vote-result modal does not auto-resume game time after dismiss** — confirm via play-test spec and either pause-on-show / resume-on-close or add a "Resume" button.
- [ ] **Achievements engine is registered but never ticked** — wire `AchievementEngine.check` into `TimeEngine.onWeekly`.
- [ ] **`EventEngine.resolveOption`** seeds RNG with `Date.now()` (per `HANDOFF.md` known-issue #3). Replace with `world.seed + counter`.
- [ ] **`gameStore.advanceDay`** stub double-advances when both it and `TimeEngine.step` run. Either delete or delegate to `addDays`.
- [ ] **Population radicalism never decays back below 30** in a 200-week run — verify in `PopulationSystem` and add a regression test.

### 3.4 Documentation & Wiki

- [ ] Update `docs/about/CHANGELOG.md` and `docs/changelogs/experimental/` with a new dated entry describing the play-test-ready hardening pass.
- [ ] Update Wiki *Getting Started* and *Game Systems → Legislation* to reflect the current draft → committee → floor flow with screenshots.
- [ ] Mark milestones 0–17 of `ROADMAP.md` as ✅ where the code already proves them out.

---

## 4. Milestone after that — `v0.1.0-beta.2` (balance + feedback loop)

Triggered by the first round of play-tester feedback. Pre-allocated buckets:

| Bucket | Probable work |
|---|---|
| **Balance** | PC regen curve, AP costs on advance-stage actions, opposition voting strategy, radicalism feedback gain. |
| **UX clarity** | Onboarding overlay on the first New Game (pointer to TopBar, Sidebar, BottomBar). Dashboard KPI tooltips already exist (todo#1, #11) — verify all six tiles. |
| **Content depth** | Bill templates 11–25 (`src/data/legislation/bill-templates.json` currently ships 10), event pack 6–15, quest pack 5–8. |
| **Modding hooks** | Document the `$schemaVersion` field for every JSON loader. Ship one "hello-world" mod fixture under `mods/example/` with a README. |
| **Save format** | Lock save file shape and document migrations in `docs/guides/SAVE_FORMAT.md`. |

---

## 5. Open todos sequenced into upcoming work

This is a *grouping* of `docs/todo.md` open items into shippable PR clusters.
Numbers refer to the todo IDs.

### Cluster A — Communications & Dialogue (next major UX surface)

- **#48** Communications tab on Dashboard (press conferences, social media, dialogue trees with members).
- **#70** Track player↔Congress interactions (meetings/conversations/votes log).

Builds on existing `DialogueSystem.ts` shell; needs a `CommsPanel.tsx` and persisted interaction history in `worldStore`.

### Cluster B — Committee & Vote experience polish

- **#63** Watch a bill in committee — dedicated UI with members, progress bar, opinion meter; player can intervene if seated on the committee.
- **#64** Vote roll-call hero modal — chamber map populating green/red/grey as votes are tallied; time pauses; skip/rush controls.
- **#65** NPC-driven bills (random member-introduced bills based on ideology + sentiment).

Builds on `LegislationSystem` + `CongressSystem`. Vote roll-call is a polish on the existing `VoteResultModal` — turn it into a live counter rather than a static breakdown.

### Cluster C — Map & state-level cohorts

- **#43** Interactive US state map (TopoJSON, click-through to state demographic detail).
- **#68** Cohort filter by national / state / local with character-creation step picking state + district.

Largest single feature on the deck. Probably its own milestone (`v0.2.0-alpha.1`).

### Cluster D — Tooling & meta

- **#39** Cross-tooltip linking across nested terms (auto-tag on UI element creation).
- **#33** Card UX polish: tighter drag-and-drop, fully styled "card-like" rendering.
- **#19** (foundation already shipped) — extend the in-game patch-notes renderer to support buttons / popups / interactive markdown blocks per the JSON spec sketch.

### Cluster E — Data & content

- **#90** NPC JSON registry per scenario (members, president, story characters; link to dialogues/quests/events).
- **#89, #88** placeholder open items — capture intent on next pass.

### Cluster F — Strategic ideas backlog (Lead Director feedback, 2026-05-01)

Captured from PR comment thread on `copilot/create-game-roadmap-and-test-tasks`. These are *strategic* (multi-PR) directions, not single-card todos. Each gets its own dedicated plan doc when work begins.

- **Legislation overhaul** → see [`docs/LEGISLATION_OVERHAUL_PLAN.md`](./LEGISLATION_OVERHAUL_PLAN.md). Four-phase plan covering Identity / Drafting / Coalition / Breakdown wizard, bill types, aide advisories, drag-to-reorder modules, talk-to-cosponsor pitch UX, bicameral other-chamber routing, chamber leadership Whip Nudges. **P1 lands in this PR.**
- **Bicameral routing.** When the player sits in one chamber, bills they pass should travel into the other chamber's pipeline (own clock, own median, own amendments). Engine work: `world.congress.house` populated to parity with `senate`, second `committee → floor → vote` instance per bill, `originatingChamber` and `currentChamber` fields on `Bill`. Tracked in §P3 of the legislation plan.
- **Chamber-leader / Whip nudges.** Speaker / Majority Leader / Minority Leader / Whip per chamber, surfaced as a recurring card-system event ("The Speaker is calling — vote yes on HR-218 for unity"). Decline costs relationship; accept costs base-cohort sentiment if they hate the bill. Tracked in §P3.
- **Turn-based vs. real-time reassessment.** Current model is pause/play/speed. With 2/4/6-year terms, full turn-based makes a session prohibitively long. **Decision recorded:** keep the pause/play/speed model as the primary interface; offer an opt-in *"Deliberate"* mode in Settings that auto-pauses on every event/vote/quest-trigger and ramps speed back to play after dismissal — i.e. turn-feeling without literal turns. Implementation cost: a settings flag + a single hook in `EventEngine`/`LegislationSystem` that calls `gameStore.pause()`. Add to `v0.1.0-beta.2` UX-clarity bucket.
- **Player role selection + "Run for President" path.** At character creation pick: House Member (2-year term), Senate Member (6-year term), or President (4-year term, only if a follow-up "second career" run unlocks it). Mid-career, Senate/House players can launch a presidential run with bonuses/penalties scaled by performance, public sentiment of the current administration, and party alignment with the incumbent. **Engine prerequisites:** election system (already on `docs/ROADMAP.md` v0.2), per-role ruleset (cards/events filtered by role), president-only panels (Cabinet, Veto Pen, State of the Union). Owns a future `docs/ROLES_AND_ELECTIONS_PLAN.md`. Slot: `v0.2-alpha`.
- **National + world map with role-scoped diplomacy.** US TopoJSON map for everyone (todo#43); world map only when the player is President or Cabinet-level — diplomacy with foreign leaders, treaties, sanctions, summits. House members get the national map only; Senate members optionally see the world map for ratification/foreign-relations committee work. Owns a future `docs/MAPS_AND_DIPLOMACY_PLAN.md`. Slot: `v0.3-alpha` for national, `v0.4-beta` for world map.
- **Expanded character creation.** Add: portrait upload (image cropper, stored as base64 in save), age (default 35 with min/max per role), narrative *Backstory* free-text field surfaced in opponent attack ads and press conferences, expanded trait + skill pickers (todo#26 already has Personal History; this extends it). Also: a final **Game Settings** step *after* character creation, Stellaris-style — choose scenario length, opposition AI strength, RNG seed, mod selection, optional "deliberate mode" flag. Owns a future `docs/CHARACTER_CREATION_V2_PLAN.md`. Slot: `v0.1.0-beta.2`.

---

## 6. Beyond v0.1 — alignment with `docs/ROADMAP.md`

| Version | Theme | Headlines |
|---|---|---|
| **v0.2-alpha** | Elections | Campaign loop, debates, polling, election night. Approval breakdown by cohort. Judicial / SCOTUS basics. Constitutional amendment mechanic. Creator Mode v1. |
| **v0.3-alpha** | Historical scenarios | Civil War + Civil Rights scenarios, regional cohorts, faction leadership, basic military, US map view, party leadership path. |
| **v0.4-beta** | Statecraft | Diplomacy v1, basic military, creator-mode polish. |
| **v0.5-beta** | Polish | Audio, full achievement set, modding toolkit, Steam Workshop integration design. |
| **v1.0** | Launch | Steam build, full marketing build, character portrait generator, multi-system (parliamentary/authoritarian) groundwork. |

Stretch ideas (multiplayer, mobile companion, accuracy-overlay research mode) live in `docs/ROADMAP.md` §"Long-term vision" and are explicitly out of scope until v1.0+.

---

## 7. Process & cadence

- **Branching:** every PR off `experimental` from a fresh `exp--<feature>`. Delete branches after merge. Forward-merge `experimental → development → release` per `.github/COPILOT_INSTRUCTIONS.md`.
- **Commit cadence:** one logical change per commit; `<type>(<scope>): ...` format.
- **Test gates:** lint, typecheck, vitest, Playwright at 1280×720 must be green before requesting review. Other viewports may be deferred to nightly until v0.2.
- **Screenshot review:** every UI-affecting PR includes the three-viewport set committed under `tests/e2e/__screenshots__/`. The agent reads them and reports anything off in the PR description.
- **Project board:** every open item lives on the GitHub Project; cards move with status changes per `AGENTS.md` §10.
- **Wiki sync:** ship the Wiki edits in the same calendar day as the merge, not the same PR (Wiki is a separate repo).

---

## 8. What this session delivered

- Restored a clean lint + typecheck + unit-test + production-build floor.
- Restored Playwright invocability (script + dependency) and fixed three pre-existing flaky/broken specs unrelated to this PR's intent but blocking play-test signal.
- Authored this document — the operational roadmap a future agent can read in under five minutes and pick up from.

What it deliberately did **not** do, so the change set stays reviewable:

- No new gameplay features.
- No engine refactor.
- No save-format change.

The next session should pick up at §3.2 (play-test happy-path spec) and §3.3 (top-five bug-fix sweep).

---

*Maintained by the active agent. When this file is older than two weeks of merged commits, it is stale and the next agent should refresh it.*
