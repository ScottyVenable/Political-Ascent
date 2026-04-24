# Changelog

All notable changes to Political Ascent are recorded here.

## [Unreleased]

### Added
- **Game-feel foundation pass** (`docs/research/game-feel-foundation-2026-04.md`).
  - Loaded IBM Plex Mono (was silently missing; all numeric readouts rendered as Courier New on Windows).
  - Removed the global `body { font-family: Inter }` override in `src/renderer/styles.css` that was defeating the Tailwind `font-body` token system-wide. Body now inherits Inria Serif.
  - New design tokens: `border-rule`, `border-rule-strong`, `border-danger`; `shadow-glow-gold`, `shadow-glow-danger`; `duration-instant` (80ms); `ease-arrive`, `ease-depart` easing curves; semantic font-size scale (`text-screen-title`, `text-panel-title`, `text-card-title`, `text-body`, `text-label`, `text-data-lg`, `text-data`, `text-data-sm`).
  - New animations in `styles.css`: `panel-enter`, `pulse-gold`, `toast-enter`, `card-enter`, `pip-flash`. `prefers-reduced-motion` honored globally.
  - New `.game-scroll` styled scrollbar (6px gold thumb) and global `:focus-visible` gold outline.
  - New `src/renderer/components/Icon.tsx` with a typed `IconName` union over vendored Tabler icons (MIT). Initial set: 9 nav glyphs + 4 speed-control glyphs + 8 utility chevrons/alerts.
  - New `src/renderer/components/ResourcePips.tsx` for discrete bounded resources (Action Points display in the TopBar).
  - New `src/renderer/components/BottomBar.tsx` — 72px command strip with four square speed buttons + Week/Year readout.

### Changed
- **`Button`** visual language: `rounded-sm`, uppercase tracking-widest headline type, `active:translate-y-px` pressed state, `shadow-glow-gold` on hover for the primary variant, 80ms transitions.
- **`Card`**: accent is now a 3px left-bar instead of a full 40%-opacity border; `rounded-sm` replaces `rounded-lg`; header separated from body by `border-b border-rule`; `shadow-md` removed.
- **`TopBar`**: slim 48px three-zone grid (identity · date · resources). Removed emoji (📅 🏳 ❚❚). Speed controls moved to the new `BottomBar`.
- **`Sidebar`**: navigation uses `<Icon />` instead of ASCII glyphs (◎ § ⌇ ⧉ ♠ ✦ ✎). Active state is gold-filled.
- **`Game` shell**: three-row grid (`48px` TopBar / `1fr` main / `72px` BottomBar). `<main>` re-mounts on panel change via `key={activePanel}` to trigger `animate-panel-enter`.

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
- Initial project scaffold (Electron + Vite + React + TypeScript + Tailwind + Zustand).
- Core TypeScript types for Character, World, Bill, Event, Card, Quest, Achievement.
- Engine shells: GameEngine, TimeEngine, EventEngine, ActionEngine, AchievementEngine.
- System shells for Character, Legislation, Congress, Population, Economy, Card, Quest, Influence, Skill, Dialogue.
- Zustand stores: game, character, world, ui, settings (with immer middleware).
- Main Menu, Character Creation, Scenario Select, Game shell with TopBar/Sidebar/BottomBar.
- Modern America 2024 scenario data (procedural legislator seeding, 6 population groups, starting economy).
- Card, event, quest, trait, bill-template, and achievement starter JSON.
- Seeded RNG (Mulberry32), math helpers, formatting, logger utility.
- Capacitor Android wrapper for APK builds (debug + release).
- Docs: GDD, Architecture, Roadmap, Copilot instructions.
