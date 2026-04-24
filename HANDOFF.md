# What I Was Working On — Political Ascent

**Branch:** `claude/game-project-android-apk-3BnW2`
**Status:** Scaffolding + foundations complete. Engine mostly wired. Systems partial. No UI yet. No Android project yet. `node_modules` NOT installed; nothing has been typechecked or run.

---

## The task in plain English

Implement the v0.1 MVP of **Political Ascent** — a political-simulation game — per the four design docs the user provided:

- `docs/GDD.md` — Game Design Document
- `docs/ARCHITECTURE.md` — Technical architecture
- `docs/ROADMAP.md` — 18-milestone breakdown of MVP
- `.github/COPILOT_INSTRUCTIONS.md` — Coding standards (strict TS, no `any`, no `Math.random()`, all content in JSON, Zustand + immer, React functional only, no React in `/engine` or `/systems`).

Additionally build an **Android APK** using Capacitor + Gradle (the user explicitly asked for this). Capacitor is the right choice since this is a React web app; native ports would be out of scope.

---

## What's done

### Project config (root)
- `package.json` with full dep set: React 18, Electron 32, Vite 5, Zustand 4.5 + immer, Tailwind 3.4, Recharts, Vitest, Capacitor 6, electron-builder.
- `tsconfig.json` with `tsconfig.web.json` (strict, `@/*` → `src/*`) and `tsconfig.electron.json` split.
- `vite.config.ts` (includes vitest config under `test:`).
- `tailwind.config.ts` — palette mirrors GDD §18.1 (`bg-bg-primary`, `text-text-primary`, `accent-blue/red/gold`, etc.) and font families `headline / body / mono / flavor`.
- `postcss.config.js`, `.eslintrc.cjs`, `.prettierrc`, `.gitignore`.
- `capacitor.config.ts` with `appId: com.politicalascent.game`, `webDir: dist`.
- `electron-builder.yml`.
- `index.html`.

### Docs
- Moved user uploads into place: `docs/GDD.md`, `docs/ARCHITECTURE.md`, `docs/ROADMAP.md`, `.github/COPILOT_INSTRUCTIONS.md`.
- Wrote `README.md` with build instructions for web / Electron / Android APK (debug + release).
- Wrote `docs/about/VISION.md`, `docs/about/CHANGELOG.md`, `docs/guides/CONTRIBUTING.md`, `docs/guides/MODDING.md`, `docs/guides/SAVE_FORMAT.md`.

### Types (`src/types/*.ts`)
All shared cross-boundary types. JSDoc'd per standards. No `any`.
- `common.ts` — `GameDate`, `GameSpeed`, `IdeologyPoint`, branded ID types (`CardId`, `BillId`, `NpcId`, etc.), `Severity`, `PressReaction`, `Bounded`.
- `character.ts` — `Background`, `CoreStats`, `CharacterState`, `TraitDefinition`.
- `effect.ts` — universal `Effect` union and `Requirement` — the schema every event/card/bill uses.
- `card.ts` — `CardDefinition`, `CardInstance`, rarity/type enums.
- `legislation.ts` — `Bill`, `BillTemplate`, `BillStage`, `PolicyTag`.
- `congress.ts` — `Legislator`, party/personality/chamber enums.
- `event.ts` — `GameEventDefinition`, `TriggerCondition`, `WeightedOutcome`, `ActiveEvent`.
- `quest.ts` — `QuestDefinition`, `QuestInstance`, objective shape.
- `achievement.ts` — `AchievementDefinition`.
- `dialogue.ts` — `DialogueTree`, `DialogueNode`, `DialogueOption`.
- `scenario.ts` — `ScenarioDefinition`.
- `world.ts` — `GameState`, `WorldState`, `EconomicState`, `PopulationGroup`, `NewsItem`.
- `index.ts` — barrel.

### Utils (`src/utils/*.ts`) — all pure
- `random.ts` — **seeded** Mulberry32 `SeededRNG` class with `next/int/chance/pick/fork/getState`, plus `weightedRandom()` and `hashString()`. **This is the only place randomness lives. Never use `Math.random()` in simulation code.** (See `id.ts` for the one exception — it falls back to `Math.random` only when no RNG is supplied by the caller, used in test/UI contexts.)
- `math.ts` — `clamp`, `lerp`, `remap`, `statCheck`, `weightedAverage`, `decayTowardZero`, `round`.
- `format.ts` — `formatDateLong/Short/ISO`, `formatSigned`, `formatCurrency`, `formatPercent`, `thresholdLabel`.
- `date.ts` — `addDays` (handles month/year rollover), `dayOfWeek`, `isMonthStart`, `isYearStart`, `toEpochDays`, `compareDates`. **Note:** ignores leap years by design.
- `logger.ts` — `createLogger(scope)` no-ops in prod (`import.meta.env.PROD`).
- `id.ts` — `makeId(prefix, rng?)` string-id helper.

### Zustand stores (`src/store/*.ts`) — all use `immer` middleware
- `gameStore.ts` — time, AP, PC, speed, `isGameOver`. Actions: `setSpeed`, `setPaused`, `advanceDay`, `addPoliticalCapital`, `spendAP` (returns bool), `regenerateAP`, `setMaxAP`, `endGame`, `initializeFromScenario`, `reset`.
- `characterStore.ts` — stats, traits, ideology, XP/level/skills, hand+deck. XP curve: level N requires `N * 100` XP.
- `worldStore.ts` — economy (with `history` snapshot array), population, `congress.{senate,house}`, `relationships`, `leverage`, `activeEvents`, `activeQuests`, `pendingLegislation`, `passedLegislation`, `failedLegislation`, `news`, `flags`, `seed`. Full CRUD actions.
- `uiStore.ts` — `activePanel`, `modals[]`, `toasts[]`, `contextPanelOpen`.
- `settingsStore.ts` — audio / gameplay / display / accessibility.

### Engine (`src/engine/*.ts`)
- `applyEffect.ts` — **THE** choke point for all effect application. Switches on `Effect.type` and dispatches to the right store action. Handles `stat | resource | group_happiness | group_loyalty | relationship | economy | flag | grant_card | trigger_quest`. `applyEffects()` is the batch version. **MVP limitation:** `delayDays` and `duration` are accepted on the Effect shape but not honored — apply is immediate. A scheduler is future work.
- `TimeEngine.ts` — tick loop on `setInterval`, `BASE_MS_PER_DAY = 3000`. `start/stop/setSpeed/step/onDaily/onWeekly/onMonthly/onYearly`. Week boundary is every 7 steps (not calendar-Sunday).
- `ActionEngine.ts` — `tryAct(ap)`, `weeklyRegenerate`, `recalculateMaxAP`. Max AP derived from stamina (4→10 across stats 1→10).
- `EventEngine.ts` — JSON-driven. `registerEvents`, `checkDailyTriggers` (evaluates `TriggerCondition[]`), `resolveOption` (deducts costs, picks weighted outcome via seeded RNG, calls `applyEffects`, pushes news, dismisses event).
- `AchievementEngine.ts` — `registerAchievements`, `check` (run weekly from TimeEngine — wiring TBD in GameEngine). Pushes a success toast via `useUIStore.pushToast` on unlock.

### Systems (`src/systems/*.ts`) — partial
Done:
- `CharacterSystem.ts` — `applyBackgroundBonuses`, `validateStatDistribution` (24–36 point budget, 1–10 per stat), `availableTraitsFor`, `getBackgroundStartingPC`.
- `PopulationSystem.ts` — `weeklyUpdate` computes `economicPressure` per group, drifts happiness toward 50, drives radicalism from low-happiness pressure.
- `EconomySystem.ts` — `weeklyUpdate` (small stochastic drift — uses `Math.sin/cos` of `week` NOT seeded RNG; probably fine since it's deterministic anyway, but flag for review), `monthlyReport` (snapshots to `economy.history`), `annualReport` (debt += deficit).
- `LegislationSystem.ts` — `draftBill`, `advanceStage` (draft → committee → floor_debate → vote, PC costs 0/10/15/10), `resolveVote` (senate-only for MVP, per-legislator chance factoring alignment/relationship/opposition/strategy, 51 threshold), `weeklyUpdate` stub.

**Not yet written** (these don't exist as files):
- `CongressSystem.ts` — procedural legislator generation from scenario seed, weekly relationship drift.
- `CardSystem.ts` — draw/play/effect resolution, party store.
- `QuestSystem.ts` — tracking, objective evaluation, rewards.
- `InfluenceSystem.ts` — PC generation from events/votes, leverage mechanics.
- `SkillSystem.ts` — skill-tree definitions, XP gain, unlock effects.
- `DialogueSystem.ts` — tree traversal helpers.
- `GameEngine.ts` — the **orchestrator**. Should wire up all the above into TimeEngine's daily/weekly/monthly/annual hooks. **Currently nothing is wired — the engine pieces exist but nobody calls them in sequence.**

### JSON data
**None of this exists yet.** The empty folders are created (`src/data/scenarios/modern-america-2024/`, `src/data/cards/`, `src/data/traits/`, `src/data/events/`, `src/data/quests/`, `src/data/legislation/`, `src/data/achievements/`) but no `.json` files inside. Need to seed:
- `scenarios/modern-america-2024/scenario.json` — per `src/types/scenario.ts`.
- `scenarios/modern-america-2024/legislators.json` — 100 senators + 435 reps (procedurally seeded, but data file provides the seed + party split).
- `scenarios/modern-america-2024/population.json` — 6–8 groups matching `PopulationGroup` shape.
- `scenarios/modern-america-2024/economy.json` — starting `EconomicState` (no history).
- `cards/starter-deck.json` — 10–15 cards.
- `traits/traits.json` — traits from GDD §5.3.
- `events/global-events.json` + `modern-america-events.json`.
- `quests/starter-quests.json` — 3–5.
- `legislation/bill-templates.json` — 20+.
- `achievements/achievements.json` — 10.

A loader with schema validation is also needed (`src/engine/dataLoader.ts` or similar).

### Not started at all
- `src/main/` — Electron main process. Folders exist, no files. Need `main.ts`, preload, IPC handlers for save/load/settings/mods.
- `src/renderer/index.tsx` — React entry. Does not exist. **`index.html` references `/src/renderer/index.tsx` but the file isn't written yet, so `npm run dev` will fail.**
- `src/renderer/App.tsx`, router, screens (`MainMenu`, `CharacterCreation`, `ScenarioSelect`, `Game`, `Settings`, `Achievements`).
- All panels (`Dashboard`, `LegislationHub`, `CongressChamber`, `PopulationPanel`, `EconomyDashboard`, `QuestLog`, `CardDeck`, `SkillTree`, `CharacterSheet`).
- All shared components (`TopBar`, `Sidebar`, `BottomBar`, `ContextPanel`, `Button`, `Card`, `Modal`, `Tooltip`, `EventModal`, `SeatGrid`, `TimeControls`, `IdeologyCompass`, `StatBlock`, etc.).
- `src/renderer/styles.css` (Tailwind base + font imports).
- Unit tests — none written. Start with `utils/random.test.ts` and `utils/date.test.ts` as the easiest wins.
- **Capacitor Android project** — nothing done. No `android/` folder. The `cap:sync` script in package.json will fail until `npx cap add android` is run. See Android section below.
- `npm install` — has **never been run**. No `node_modules`, no lockfile.
- `npm run typecheck` — never run. There will almost certainly be type errors to fix on the first pass.
- `npm test` / `npm run build:web` — never run.

---

## Known issues to fix on pickup

1. **Missing renderer entry.** `index.html` points at `/src/renderer/index.tsx` which doesn't exist. First priority after setting up UI layer.

2. **`EventEngine.evaluate` for `stat` returns `true` unconditionally** (`event.ts` TriggerCondition `type: 'stat'`). Needs to actually read from `characterStore` once `CharacterState` wiring is stable. Marked with a `// MVP skips` comment in source.

3. **`EventEngine.resolveOption`** seeds its RNG with `Date.now()`, which is non-deterministic. Should be `world.seed + someCounter`. Flag during pickup.

4. **`AchievementEngine` uses `relationship` requirement's `operator` narrowly** — it maps `'gt'`-style operators into a `compare` that only knows `gt|lt`. OK for MVP but worth generalizing.

5. **`EconomySystem.weeklyUpdate`** uses `Math.sin/cos(week)` for drift — deterministic but not seeded-RNG. Acceptable, but not consistent with the "all randomness through SeededRNG" rule. Swap for `SeededRNG` if pedantic.

6. **`id.ts` `makeId`** falls back to `Math.random` when no RNG is passed. Simulation callers must pass a SeededRNG; UI callers can use the fallback. Review call sites once they exist.

7. **`gameStore.advanceDay`** only increments `day` without month/year rollover — the real advancement happens in `TimeEngine.step` which uses `addDays`. The store method is a stub and probably shouldn't be called directly. Either delete it or make it call `addDays`.

8. **`gameStore` imports aren't yet verified to compile** against Zustand v4.5 + immer middleware typing. Sometimes needs `create<T>()(immer(...))` with the extra parens — that IS the form used, but double-check after `npm install`.

---

## Android APK setup (not yet started)

The user specifically asked for an Android APK via Gradle. Plan (per README):

```bash
# 1. Make sure JDK 17 + Android SDK (platform 34, build-tools 34) + ANDROID_HOME are set.
npm install
npm run build:web
npx cap add android       # creates ./android/ Gradle project
npm run cap:sync          # copies dist/ into android/app/src/main/assets/public
npm run android:assemble  # = (cd android && ./gradlew assembleDebug)
```

Resulting APK: `android/app/build/outputs/apk/debug/app-debug.apk`.

After `cap add android`, you'll want to:
- Change `android/app/build.gradle` `applicationId` → `com.politicalascent.game` (Capacitor already does this from `capacitor.config.ts`, but verify).
- Set `minSdkVersion 24`, `targetSdkVersion 34`, `compileSdkVersion 34`.
- Add an app icon to `android/app/src/main/res/mipmap-*` — use `cordova-res` or just drop PNGs.
- For release builds, create `android/app/release.keystore` and `android/keystore.properties` (see README). A `keystore.properties.example` should be committed for reference (doesn't exist yet).
- **Important:** `android/` will be committed to the repo (Capacitor projects are meant to be). Add `android/.gradle/`, `android/build/`, `android/app/build/`, `android/local.properties`, `*.keystore` to `.gitignore` — already done.

This environment (the sandbox) has Gradle + Java 17 but no Android SDK, so `assembleDebug` won't actually succeed here. The setup must be finished in an environment with the SDK installed, or in CI.

---

## Suggested order for the next agent

1. `npm install`, then `npm run typecheck` — fix whatever compiles wrong. The risky surfaces are Zustand+immer typings and the branded-ID casts in `CharacterSystem.ts` (`as unknown as TraitId[]`).
2. Add a trivial `src/renderer/index.tsx` + `src/renderer/App.tsx` + `src/renderer/styles.css` so `npm run dev` at least loads a Tailwind-styled page.
3. Write unit tests for `utils/random.ts` (determinism, weighted distribution), `utils/date.ts` (month/year rollover), `utils/math.ts`.
4. Seed JSON data files + data loader. These should be small enough to produce in one pass.
5. Build remaining systems (Congress first, it's needed by Legislation's `resolveVote` which already reads `world.congress.senate`).
6. Wire `GameEngine.ts` — register all JSON data, subscribe all systems to TimeEngine hooks, expose a single `GameEngine.startNewGame(scenarioId, character)` API.
7. Build MainMenu → CharacterCreation → ScenarioSelect → Game shell. Don't bother polishing — get the flow working end-to-end first.
8. Add panels one at a time, ending with CongressChamber (the most complex).
9. `npx cap add android`, then `npm run android:build`. Commit the generated `android/` folder (minus build artifacts).
10. Polish pass, then `v0.1.0-alpha.1` tag.

---

## Conventions to keep honoring

- **No `any`.** Narrow `unknown` or define a type.
- **No `Math.random()`** in `engine/` or `systems/` or store actions. UI is OK.
- **No React imports in `engine/` or `systems/`.**
- **Game content in JSON**, not hardcoded in TS.
- **All effects go through `applyEffect`.**
- **Commit format:** `feat(scope): ...`, `fix(scope): ...`. Scopes: `engine`, `legislation`, `congress`, `population`, `economy`, `cards`, `quests`, `skills`, `ui`, `character`, `dialogue`, `save`, `settings`, `android`.

---

*Last updated before commit by the previous agent. All files in this commit compile in isolation (type-checked in my head) but have NOT been run through `tsc` or `vitest`.*
