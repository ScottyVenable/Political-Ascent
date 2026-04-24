# Changelog

All notable changes to Political Ascent are recorded here.

## [Unreleased]

### Added
- **Mobile layout optimization for Android (Capacitor) builds.** The in-game shell now functions on phone-sized viewports (≈360–420px) so the packaged APK is playable on device:
  - `Sidebar` is a permanent 192px column at `md` (≥768px) and a slide-in drawer below it, with a backdrop that dismisses on tap and auto-closes when a panel is selected. 44×44 tap targets on phones (WCAG 2.5.5).
  - `TopBar` gains a hamburger button under `md` and hides the `LV N · X XP` chip + `AP` text label below `sm` so the three zones (identity / date / resources) all fit on a 360px viewport.
  - `BottomBar` uses 44×44 speed buttons on phones, tightens padding, and collapses the "of 52 · <Month> <Year>" subtitle to "of 52 · <Year>" below `sm` (the month is already in the TopBar).
  - `Game` shell switches from `100vh` to `100dvh` so Android's collapsing URL bar and iOS home-bar do not leave a blank strip at the bottom; `env(safe-area-inset-*)` is applied on `#root` and the grid wrapper so the BottomBar clears the Android gesture pill.
  - `styles.css` disables overscroll pull-to-refresh, tap-highlight, and iOS text-size autosizing inside the game WebView.
  - `uiStore` gains `sidebarOpen` + `setSidebarOpen`; `setActivePanel` auto-closes the drawer.
  - New `menu` (hamburger) icon in the Icon registry.
- **Congress hemicycle redesign** (closes #41). Replaces the flat `SeatGrid` with a semi-circular parliament layout:
  - New `Hemicycle` component. Pure `layoutHemicycle(legislators, width)` computes seat positions across rows (`rows = max(3, round(sqrt(n/3.2)))` → ~4 for Senate/100, ~10 for House/435), radii from 0.45·cy to 0.95·cy, capacity proportional to arc length, exact seat distribution via Hamilton remainders.
  - Seats are ordered left-to-right by `ideology.x` — the leftmost physical seat goes to the most-left-wing legislator and vice versa, so the chamber always reads D · I · R.
  - Selected seat is highlighted with a gold-tinted outline; native `<title>` tooltip per seat; click / hover emit typed callbacks.
  - `CongressPanel` rebuilt: plinth chamber headers with `PartyStrip` (stacked 2px bar + count chips), filter bar switched to shared `Button` variants, and a sticky `LegislatorDetail` rail with tone-coloured relationship, priorities chips, and a voting-record list styled with Icon-based `VoteBadge`s.
  - 4 new Vitest cases for `layoutHemicycle` (seat count, viewport containment, ideology ordering, empty chamber).
- **Custom progress bar — `Meter`** (`src/renderer/components/Meter.tsx`). Inset-groove track with gold-to-blue toneable fill, optional `threshold` caret, optional `segments` tick marks, arrive-eased width transition. Ready for adoption in legislation vote bars and quest progress.
- **Custom slider — `Slider`** (`src/renderer/components/Slider.tsx`). Native `<input type="range">` restyled with a recessed 8px track, gold-gradient fill driven by `--pa-fill`, 14px diamond thumb with gold border + focus glow. Adopted in `Settings` (Audio/Display) and `CharacterCreation` (core-stat rows).
- **Dashboard situation-room redesign** (closes #39). Replaces the 2×2 generic-metrics grid with:
  - A KPI strip (Approval · GDP · Unemployment · Deficit) using the mono `text-data-lg` scale and a tiny trend glyph.
  - A primary **Focus card** that answers "what needs my attention right now?" — resolved from an `resolveFocus(event, pendingBills)` helper with priority `event > bill at vote > furthest-along pending > quiet`. Each state ships one gold CTA.
  - An ambient **The Press** news column to the right of the focus.
  - A bottom row pairing an **Identity** card (ideology compass + label) with a **This Week** agenda whose rows double as nav shortcuts.
  - 4 new unit tests covering the focus-resolver priority contract.
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
