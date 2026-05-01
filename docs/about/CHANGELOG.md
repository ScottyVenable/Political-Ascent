# Changelog

All notable changes to Political Ascent are recorded here.

## [0.1.0-alpha.1] - 2026-04-24

### Added
- **Electron main process** (`src/main/main.ts`, `preload.ts`) with safe contextBridge IPC for save/load/settings; Vite-plugin-electron dev + build pipeline.
- **GameEngine orchestrator** wiring every system to TimeEngine's daily/weekly/monthly/annual hooks.
- **dataLoader** — loads all JSON bundles under `src/data/**` via `import.meta.glob` with lightweight validation.
- **Systems:** Congress (procedural 100+435 legislators, deterministic), Card (register/draw/play/discard), Quest (objective evaluation), Influence (weekly PC), Skill (branch tree + prerequisites), Dialogue (pure tree traversal).
- **MVP content:** Modern America 2024 scenario bundle; 12 cards, 10 traits, 5 events, 4 quests, 10 bill templates, 10 achievements.
- **Full UI:** router, ToastRoot, Modal shell, shared components (Button, Card, Bar, StatBlock, IdeologyCompass, 535-seat SeatGrid, TopBar, Sidebar) + screens (MainMenu, CharacterCreation, ScenarioSelect, Game, Settings, Achievements) + panels (Dashboard, Legislation, Congress, Population, Economy w/ sparklines, Quests, Cards, Skills, Character).
- **UI perf:** `memo` on hot components, selector-based Zustand subscriptions, keyboard shortcuts (Space/1–4 for pause/speed).
- **Tests:** added `applyEffect`, `CongressSystem`, `EconomySystem`, `CardSystem` unit tests (65 tests total).
- **PowerShell launcher** (`launcher.ps1`) with arrow-key menu, stylised colour theme, preflight checks, progress panels, and a non-interactive `-Task` mode.
- **Android scaffolding** via `npx cap add android` with `keystore.properties.example` for release signing.
- **Windows electron packaging** (`build:win`) — NSIS installer + portable via electron-builder.

### Fixed
- `EventEngine.resolveOption` uses deterministic SeededRNG instead of `Date.now()`.
- `EventEngine` `stat` trigger condition now actually evaluates player character stats.
- `EconomySystem.weeklyUpdate` uses seeded drift (was trig-based stub).
- Removed deprecated `bundledWebRuntime` from `capacitor.config.ts`.

## [Unreleased]

### Added
- **Documentation:** new `docs/BIBLE.md` (Project Bible — tone, themes, world canon, faction lore, sensitivity guidelines, visual & audio identity, naming, writing style, design principles, decision log, glossary).
- **Documentation:** rewritten `docs/ROADMAP.md` grounded in current shipped state — v0.1.1 polish sprint, v0.2 elections, v0.3 historical scenarios + map, v0.4 diplomacy + Creator Mode, v0.5 audio + full achievements, v1.0 launch.
- **Documentation:** GDD expanded with chapters 23–33 — balancing formulas, Press Room v1 spec, deferred-effect scheduler spec, onboarding flow, accessibility plan, content production pipeline, save format pointer, localization, telemetry, debug menu, v0.2 system previews.
- **Engine:** **deferred-effect scheduler** — `Effect.delayDays` is now honored. Effects with `delayDays > 0` are enqueued onto `worldStore.scheduledEffects` and drained by `EffectScheduler.processDue()` from the daily TimeEngine hook (GDD §25). New `applyEffectImmediate` helper for the scheduler bypass; `applyEffect`/`applyEffects` accept an optional traceability `source`.
- **Tests:** 8 new tests for `EffectScheduler` covering immediate fast-path, queue mechanics, due/not-due drain, source metadata round-trip, batch behavior, and empty-queue no-op (73 tests total).
- **CI:** `.github/workflows/android-apk-prerelease.yml` — manually-triggered (`workflow_dispatch`) workflow that builds a debug Android APK from the selected branch and publishes it as a GitHub **pre-release** tagged `apk-v<version>-<YYYYMMDD-HHMM>` (UTC) with the APK attached. Runs on `ubuntu-latest` with Node 20, JDK 17, Android SDK 34. Includes optional `release_notes` input.

