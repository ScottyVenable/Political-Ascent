# POLITICAL ASCENT — Development Roadmap
**Lead Director:** Scotty Venable | **Engine Version:** 0.1 | **Last refreshed:** 2026-05-01

> This roadmap is the single source of truth for *what we are building next*.
> It is grounded in the **current state** of the codebase — see
> `docs/about/CHANGELOG.md` for what is shipped, and `HANDOFF.md` for the
> low-level "what was I doing" snapshot.

---

## 0. STATE OF PLAY (as of 2026-05-01)

The MVP scaffold (`v0.1.0-alpha.1`) is **substantially built**. The whole
loop — `MainMenu → CharacterCreation → ScenarioSelect → Game` — runs in the
browser, Electron and a Capacitor Android wrapper, on top of a typed core
engine and a deterministic seeded RNG.

| Layer | Status | Notes |
|---|---|---|
| Build & tooling (Vite, Electron, Capacitor, electron-builder, ESLint, Vitest) | ✅ | `npm run dev / typecheck / test / build:web / build:win / android:build` |
| TypeScript types & branded IDs | ✅ | All cross-boundary types in `src/types/`, no `any` |
| Stores (game / character / world / ui / settings) — Zustand + immer | ✅ | |
| Utilities (RNG, math, date, format, logger, id) | ✅ | 51 unit tests |
| Engine — `TimeEngine`, `EventEngine`, `ActionEngine`, `AchievementEngine`, `applyEffect`, `dataLoader`, `GameEngine` orchestrator | ✅ | 65 tests passing |
| Systems — Character / Population / Economy / Legislation / Congress / Card / Quest / Influence / Skill / Dialogue | ✅ | All wired through `GameEngine` to TimeEngine hooks |
| MVP content (Modern America 2024 scenario, 12 cards, 10 traits, 5 events, 4 quests, 10 bill templates, 10 achievements, 6 population groups) | ✅ | `src/data/**` JSON, validated by loader |
| UI — router, screens, panels (Dashboard / Legislation / Congress / Population / Economy / Quests / Cards / Skills / Character), shared components | ✅ | Tailwind + Recharts |
| Save/load (electron-store + IPC) | ✅ | One autosave + 5 manual slots |
| Android scaffold (Capacitor + Gradle) | ✅ | Debug & release flow documented |
| PowerShell launcher | ✅ | `launcher.ps1` |

**Known MVP limitations / paper-cuts** *(addressed in v0.1.1 below)*:

1. ~~`applyEffect` does not honor `Effect.delayDays` / `Effect.duration` — every effect lands immediately.~~ **`delayDays` shipped 2026-05-01;** `duration` still pending.
2. `gameStore.advanceDay` is a stub; the real advancement lives in `TimeEngine.step`.
3. `EventEngine` `stat` requirement check has been wired but `relationship` requirement compare is still narrow (`gt|lt` only).
4. No **Press Room** panel yet (speech segments + briefings — GDD §15).
5. No **negotiation panel** UX during a Senate vote — `LegislationSystem.resolveVote` is purely mechanical.
6. No **morning briefing** modal at week start — Dashboard surfaces a static panel instead.
7. No keyboard shortcut help overlay.
8. No onboarding tooltips for first-time players.
9. No `cap-resources` or app icons committed for Android — uses Capacitor defaults.

---

## ROADMAP OVERVIEW

```
v0.1.0-alpha.1  ✅ SHIPPED (2026-04-24)  Scaffold, engine, MVP content, UI
v0.1.1-alpha    ◀ ACTIVE                Polish, gap-fill, paper-cuts, UX
v0.2-alpha                              Elections & campaigns
v0.3-alpha                              Historical scenarios + Map view
v0.4-beta                               Diplomacy + Military + Creator Mode v1
v0.5-beta                               Audio, full achievements, modding toolkit
v1.0                                    Launch candidate
```

---

## v0.1.1 — POLISH & GAP-FILL  *(active)*

Goal: take the MVP from "running" to "first-player-friendly". No new pillar
systems — only finish what we have, fix the known issues above, and tighten
the loop so a new player can play their first 30 minutes without confusion.

### M0 — MVP gap-fix
**Branch:** `exp--0.1.1--mvp-gaps`

- [x] **Deferred / scheduled effects.** Honor `Effect.delayDays` in `applyEffect`. Persist a `scheduledEffects` queue in `worldStore`. Drain on the daily TimeEngine hook. *(shipped in this PR)*
- [ ] Bill **Implementation phase** — once a bill passes, schedule its effects with the bill's `implementationDays` so legislation feels like it actually takes time.
- [ ] Honour `Effect.duration` (revert effects after N days). Lower priority than `delayDays`.
- [ ] Remove or correct `gameStore.advanceDay` stub.
- [ ] Generalize `AchievementEngine` `relationship` operator handling (support `gte` / `lte` / `eq` too).

### M1 — UX polish
**Branch:** `exp--0.1.1--ux-polish`

- [ ] **Morning Briefing modal** on week roll-over: prior-week summary, top 3 news, AP regen, queued events.
- [ ] **Keyboard shortcut help** (`?` key) overlay; complete sidebar shortcut list.
- [ ] Consistent **tooltips** on every stat, resource, and policy tag (auto-glossary).
- [ ] **Onboarding tooltips** triggered on first-encounter of: AP, PC, Ideology, Cards, Bills, Congress.
- [ ] **Toast variants** wired (`success / info / warning / danger`) and an audio hook stub.
- [ ] App icon set committed for Electron (icns/ico/png) and Android (`mipmap-*`).
- [ ] Loading skeletons on the Dashboard, Legislation, and Economy panels.

### M2 — Negotiation Panel (vertical slice of GDD §8.4)
**Branch:** `exp--0.1.1--negotiation-panel`

- [ ] When a Senate vote is called, open a Negotiation Panel before the tally if PC ≥ threshold.
- [ ] Show top 5 swing legislators (closest-to-flipping by `LegislationSystem.predictVote`).
- [ ] Offer **policy concessions** (PC cost), **favor calls** (relationship cost), **leverage** (Integrity cost).
- [ ] Tie outcomes through `applyEffect` so they're saved correctly.
- [ ] Skip / proceed buttons keep the existing instant-resolve flow available.

### M3 — Press Room v1 (vertical slice of GDD §15)
**Branch:** `exp--0.1.1--press-room`

- [ ] New `PressRoomPanel` accessible from sidebar.
- [ ] **Speech composer**: opening + 2–4 body points + close, all from JSON segments.
- [ ] `SpeechSystem.compose()` returns: poll shift per group, press reaction, PC delta, headline.
- [ ] `src/data/speeches/segments.json` — 25+ segments.
- [ ] `PressSystem.publish()` pushes a NewsItem with the headline; ties into the news ticker.
- [ ] Charisma + Oratory skill apply multipliers.

### M4 — Save format v2
**Branch:** `exp--0.1.1--save-format-v2`

- [ ] Bump `SAVE_VERSION` and add a migration step from v1.
- [ ] Persist the new `scheduledEffects` queue.
- [ ] Persist news ticker, achievements unlocked, and quest history.
- [ ] Save thumbnail (a small in-game screenshot dataURL).

### M5 — QA + tag `v0.1.1-alpha.4`
- [ ] Manual play-through of Modern America for 26 simulated weeks without crash.
- [ ] All Vitest suites green; new tests for scheduler + speech composer.
- [ ] Update CHANGELOG; tag.

**Done When:** A first-time player can launch from cold start, complete character creation, run a session for ~30 minutes, pass at least one bill (with delayed implementation effects firing), give a speech, and save/load — without referring to docs.

---

## v0.2 — ELECTIONS & CAMPAIGNS

The first real *political loop*. Today the Senator is appointed forever; v0.2
gives the world an electoral clock.

### Pillars
1. **Election cycle** drives long-term play.
2. **Campaigns** are a sub-mode with their own pacing.
3. **Polling** is a permanent, live signal — not just an event.

### Milestones

- **M0 — Election system core.** `ElectionSystem.ts`. Calendar of upcoming races (House biennial, Senate by class, Presidential 4-yr). Pre-computed for the scenario.
- **M1 — Polling & approval.** `PollingSystem.ts` running weekly: head-to-head and approval rating per demographic. Sparkline on Dashboard.
- **M2 — Campaign mode.** Pause main loop, open campaign sub-loop: ground game, ads, debates, fundraising. AP becomes campaign hours.
- **M3 — Debates.** Dialogue-tree with stat checks; opponent has a personality profile. Outcome ⇒ poll shift.
- **M4 — Election night.** Animated state-by-state call, dramatic holds for close calls, post-mortem screen.
- **M5 — Approval breakdown.** New panel: approval by demographic, region, faction, with policy-impact markers.
- **M6 — Judicial system v1.** Supreme Court roster. Rulings can strike down passed bills (the bill dies + flag set). No nomination flow yet.
- **M7 — Constitutional amendment** mechanic — multi-stage, multi-year arc.
- **M8 — Press v2** — individual journalists with personalities & beats; favorability shifts per-journalist.
- **M9 — 5 additional starter scenarios (framework only)** — empty templates so modders can fork them.
- **M10 — Creator Mode v1 (read-only).** A debug panel that shows the data graph — no editing yet.
- **M11 — Polish + tag `v0.2.0-alpha`.**

**Done When:** Player can run for re-election, win or lose, and the world keeps simulating. A bill they pass can be struck down. Polling shows up everywhere a number is rendered.

---

## v0.3 — HISTORICAL SCENARIOS + MAP

The first content-heavy release. All systems exist; this is mostly **content,
authoring tools, and a map**.

### Pillars
1. Two **fully authored** historical scenarios.
2. A **map view** the player consults regularly.
3. **Faction leadership** (player can be a caucus chair / whip / leader).

### Milestones

- **M0 — Map view.** US regional map (states + territories). Population overlay, election overlay, economy overlay.
- **M1 — Civil War Era (USA, 1860–1865).** Full scenario — events, NPCs, bill templates, factions, victory conditions.
- **M2 — Civil Rights Movement (USA, 1960–1968).** Full scenario.
- **M3 — Faction leadership path.** Whip → Minority Leader → Majority Leader. Mechanically: extra AP, vote-prediction, relationship discount.
- **M4 — Military system v1.** Budget line, readiness stat, deployment count. No tactical layer; events draw on these stats.
- **M5 — Advanced dialogue** — branching press conferences with multi-turn memory.
- **M6 — Sandbox tightening.** "What-if" mode that lets you fork a save and run alternate timelines.
- **M7 — Tag `v0.3.0-alpha`.**

---

## v0.4 — DIPLOMACY + CREATOR MODE

### Pillars
1. **Foreign relations** as a recurring strategic concern.
2. **Creator Mode v1** — first-class authoring tools.
3. The game stops being just-domestic.

### Milestones

- **M0 — Foreign leader contacts.** Roster of NPCs per country. Treaties, summits, sanctions as effects.
- **M1 — Diplomacy panel** with relationship + treaty list per country.
- **M2 — Crisis response** — hostage / war scare events that test foreign-policy stat lines.
- **M3 — Creator Mode v1.**
  - In-game scenario start-state configurator
  - Politician (NPC) builder
  - Event chain designer (graph editor)
  - Card builder
  - Local mod loader (`Game/mods/<name>/`)
- **M4 — Modding API docs** in `docs/guides/MODDING.md`.
- **M5 — Tag `v0.4.0-beta`.**

---

## v0.5 — POLISH, AUDIO, FULL ACHIEVEMENTS

### Pillars
1. The game **sounds and feels** like a finished product.
2. Achievement coverage matches the GDD's full list.
3. The modding toolkit is documented and stable.

### Milestones

- **M0 — Audio implementation.** Music layers (calm / tense / triumphant), full SFX bank, settings sliders wired.
- **M1 — Full achievement set.** ~50 achievements across all categories from GDD §19.
- **M2 — Card art pass.** Replace placeholder icons with illustrated art (commissioned or generated to a defined style).
- **M3 — Character portrait generator.** Layered SVG portraits driven by character traits.
- **M4 — Mod marketplace v0** (local catalogue, no remote hosting yet).
- **M5 — Localization pass** — string extraction + en-US baseline + 1 community language as a proof of concept.
- **M6 — Telemetry & playtest reports** — opt-in only, anonymous.
- **M7 — Tag `v0.5.0-beta`.**

---

## v1.0 — LAUNCH CANDIDATE

### Release criteria

- All v0.5 milestones complete and stable
- Zero P0 / P1 bugs open
- Full QA matrix (Win10/11, macOS 13+, Ubuntu 22.04, Android 10+) green
- All scenarios complete a minimum 50-week play-through without crash
- Save/load reliable across version migrations
- Localization keys 100% covered
- Marketing site + trailer
- Privacy policy + telemetry docs published
- Steam / itch.io listing pages up

### Tag and release `v1.0.0`.

---

## LONG-TERM VISION (post-v1.0)

- **Multiplayer** — co-op (cabinet members) and competitive (rival senators, parallel timelines).
- **Steam Workshop** integration for mods.
- **Mobile companion app** for stat dashboards + decision approvals while AFK.
- **Historical accuracy research mode** — optional academic-grade overlays with citations.
- **Community scenario library** with ratings, comments, version pinning.
- **Multiple political systems** — parliamentary, authoritarian transitions, federal/unitary toggles.
- **Procedural country generator** for sandbox / what-if play.

---

## RELEASE CADENCE & BRANCH POLICY

- **`main`** — last released tag. Tagged `vX.Y.Z`.
- **`development`** — what becomes the next minor release. PRs target this.
- **`exp--<version>--<feature>`** — short-lived feature branches; squash-merge into `development`.
- **`copilot/<topic>`** — agent-driven branches; merge into `development`.

Release cadence target: **every 4–6 weeks**, alpha during 0.x, beta from 0.4
onwards.

---

## HOW TO USE THIS DOCUMENT

- ✅ checked = **done & on disk** (verifiable by `git log` or by running the relevant npm script).
- ◀ active = the working set this sprint.
- A milestone is "done" when (a) its checkboxes are all ticked, (b) tests are green, and (c) the CHANGELOG entry is written.

*Roadmap owned by Lead Director. Update with every merged PR that ships a milestone item.*
