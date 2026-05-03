# Changelog

All notable changes to Political Ascent are recorded here.

This file follows [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/) and the project's three-stream release model (see [docs/ROADMAP.md §1](../ROADMAP.md)).

> **Layered changelog model**
>
> | File / folder | Purpose |
> |---|---|
> | **`docs/about/CHANGELOG.md`** *(this file)* | Canonical, user-facing summary. Authoritative once a version is promoted to **stable**. The `[Unreleased]` block at the top tracks experimental work in flight. |
> | [`docs/changelogs/stable/`](../changelogs/stable/) | Per-release notes archive for promoted stable builds. One file per version. |
> | [`docs/changelogs/experimental/`](../changelogs/experimental/) | Pre-release notes per `exp` tag. Files may be amended until the parent version promotes. |
> | [`docs/changelogs/development/`](../changelogs/development/) | Informal nightly / branch dev notes. Not promotion-binding. |
>
> Promotion gates are defined in [GDD.md §13.7.1](../GDD.md). A version moves from experimental to stable only when every dev→exp **and** exp→stable gate is green.

---

## [Unreleased]

Tracks **M1 — Legislative Overhaul** work in flight on `exp--legislative-overhaul`. Targets `0.2.0-alpha.1` per [ROADMAP §4](../ROADMAP.md).

### Added

- **Congress member ideology labels** (`exp--congress-ideology-labels`, todo#91). Congress member details now use the shared `ideologyLabel()` helper instead of exposing raw compass coordinates like `0.42 · -0.31`. Seat hover tooltips and member modals show phrases such as `Right-Libertarian`, `Moderate Left-Authoritarian`, or `Centrist`. Added Playwright coverage that opens a Congress member modal, asserts no raw coordinate pair is present, and captures the modal. Also added the missing approved `filter` icon registry entry used by the advanced-filter accordion and removed an unused member-list prop from `CongressPanel.tsx`.
- **Character personal-finance actions** (`exp--character-personal-funds`, todo#74). The Character panel's Personal Finances card now lets players change their tracked `personalFunds`. Three deterministic income actions (Salary + reimbursements, Paid speaking circuit, Liquidate assets) plus Self-fund campaign (transfers personal funds into Treasury without overdraft). New pure helper `src/utils/personalFinance.ts`; 7 helper tests plus 3 character-store tests. New Playwright coverage.
- **Build Profile card on Core Stats step** (`exp--byc-stats-detail`, todo#27). Three-card "Build Profile" panel under the six raw stat sliders distills the distribution into named archetypes — **Persuasion** (charisma + connections), **Operations** (strategy + integrity), **Resources** (wealth + stamina). Each card shows live averaged score, tier chip, contributing stat pair, and tier-specific gameplay-impact blurb. New pure utility `src/utils/buildProfile.ts` with 6 Vitest cases; new Playwright spec.
- **Canonical chart primitives + EconomyPanel polish** (`exp--graph-renderer-polish`, todo#66). New `src/renderer/components/charts/` module ships `Sparkline` (line chart with optional area-fill gradient, latest-value dot, configurable tone palette, optional `responsive` mode) and `MiniBarChart` (vertical bars with rounded tops, axis labels, optional value labels, per-bar tone overrides, scaled to peak). Two near-identical local Sparkline implementations in `EconomyPanel.tsx` and `DashboardPanel.tsx` collapsed into the canonical component. 14 new Vitest cases. New Playwright spec.
- **Congress demographic filters & sort** (`exp--congress-bio-filters`, todo#55). `Legislator` now carries `age`, `gender` (F/M), and `wealth` (USD); `CongressSystem` seeds them deterministically — senators skew older than house members, wealth follows a log-normal-ish curve. Congress advanced-filter accordion gains Gender / Age / Wealth rows; sort row gains Age, Wealth, and Bills (sponsorship count derived live). Seat tooltip and member modal surface the new fields. Filters cooperate with the dim/hide hemicycle toggle. 2 new Vitest cases; new Playwright spec.
- **Main-menu version is now a clickable patch-notes link + build provenance** (`exp--main-menu-version-link`, todo#89). Footer version pill rendered as a button styled as a hyperlink — clicking opens the in-game `PatchNotesPanel` inside a modal. A second line shows `build <short-commit> · <YYYY-MM-DD>`, both inlined at compile time by Vite via a new `define` block in `vite.config.ts` (`__BUILD_COMMIT__`, `__BUILD_DATE__`). `git rev-parse --short HEAD` falls back to `'unknown'`.
- **Mobile polish + new pre-release APK** (`exp--mobile-polish-and-apk`, todo#23 follow-up). `ModalShell` clamps to `max-h: calc(100dvh - 1.5rem)`, switches to `flex flex-col` with header pinned and body scrolling internally; outer overlay padding respects `env(safe-area-inset-*)`. Replaced literal `✕` close glyph with `<Icon name="close" size={16} />`. APK pre-release `v0.1.0-alpha.1-exp.20260429` published; bumped `package.json` and `android/app/build.gradle`.
- **Polish pack 2** (`exp--polish-pack-2`, todo#41 / #54 / #58 / #86). Determinism guard test (`src/test/determinism.test.ts`) walks `src/engine/`, `src/systems/`, `src/store/` and fails on `Math.random(`; caught and fixed `uiStore.pushToast`. New `formatBillionsUSDFull` / `formatBillionsUSDForDisplay` helpers + `display.numberPrecision` setting; Settings panel grows a precision `<select>`; Dashboard Annual Deficit honours it. Tooltip viewport clamp gains a near-edge phase pinning top/left to 8px margin. Achievement toast `actionRoute` navigation verified.
- **Bottom bar polish + mobile portrait sweep** (`exp--bottom-bar-polish`, todo#23 + todo#38). Speed buttons render as a true segmented `radiogroup`; keyboard-shortcut chips render under each speed on tablet+; centre week readout grows a slim year-progress bar; right-side cluster gains a vertical divider before the destructive Menu button; footer honours `env(safe-area-inset-bottom)`. New `data-testid` selectors. Mobile portrait spec extended.
- **Draft legislation customization** (`exp--draft-legislation`, todo#40). Replaces one-click Draft with a deep-customization modal: edit bill title, toggle policy modules (eight starter modules), read a synthesised "hypothetical bill text" preview. Sticky climate-forecast rail recalculates `LegislationSystem.estimatePassageChance` live as modules toggle. Submitting forwards a synthesised `BillTemplate` to the existing pipeline. New `PolicyModule` type, data file `src/data/legislation/policy-modules.json`. Drag-and-drop module ordering deferred. New Playwright case.
- **Skill tree visualisation** (`exp--skill-tree`, todo#34). Replaces flat 3-column card grid with RPG-style tree: six branch columns sorted by stat, hex-clipped skill badges with explicit locked / available / unlocked states, in-branch prerequisite chains rendered as connector bars, sticky right-rail with focused node description, prereq chips, and unlock affordance. Header strip shows per-branch completion. Two new Playwright cases.
- **Timeline filters and search** (`exp--timeline-filters`, todo#35). Three severity chips (Info / Warning / Danger) with live count badges plus free-text search input scanning headline and body. Toggling the last severity off auto-restores all three.
- **Economy panel detail** (`exp--economy-detail`, todo#32). Indicator rows carry trend chips comparing latest snapshot to ~12 weeks back, arrows colour-coded by metric direction. Two new derived cards: **Fiscal pressure** (debt-to-GDP with 100% danger threshold) and **Distribution** (Gini coefficient as a 0–100 meter).
- **Population focus pages** (`exp--population-focus`, todo#31). Population tab cards become clickable surfaces opening `<GroupFocusModal />` with mood (Happiness / Radicalism / Activism / Loyalty) on the left and demographics + group-targeted action placeholder on the right.
- **Congress panel — chamber tabs and member-detail modal** (`exp--congress-tabs`, todo#30). Three-state tab strip (Both / Senate / House); hover preview wired into the side rail; click-pinned member-detail modal with stat block on the left and voting summary + recent 25 votes on the right.
- **Save and load** (`exp--save-load`, todo#36). New `src/engine/SaveSystem.ts` — versioned envelope (`meta.schemaVersion = 1`) wrapping snapshots of `gameStore`, `characterStore`, `worldStore`. Schema mismatches refuse to load. Storage is platform-aware: Electron → `pa:save:*` IPC → `electron-store`; browser/Capacitor → `localStorage` under `pa:save:`. Developer-mode tagging (`meta.developer = true`). New `<SaveLoadModal />`. `docs/guides/SAVE_FORMAT.md` rewritten. 7 Vitest cases.
- **Cards panel — drag-to-play, drop indicator, playable glow** (`exp--card-play-polish`, todo#33). Drop zone at the top of the hand. Insertion indicator (left-edge gold bar) on the row being hovered. Pulsing gold outline on `card-row-playable` rows when resource gates clear; static ring under reduced motion. Drag image is the card art (CardFace), not the row.
- **Build Your Candidate — Stats step UX** (`exp--candidate-stats-ux`, todo#27 / #28). Tier chips per stat row (Weak / Average / Strong / Exceptional) reading the *final* value. One-line gameplay-impact blurb per row (24 hand-written lines). Preset row: "Reset to even" and "Suggested for {background}". New helper `src/utils/statTier.ts` with 5 unit tests.
- **In-app logger ring buffer** (`src/utils/logger.ts`, todo#22). 500-entry ring buffer with timestamp, level, scope, message, structured args. Subscribers can listen for buffer updates. Console pass-through preserved in dev, suppressed in production. 5 unit tests.
- **Top-level ErrorBoundary** (`src/renderer/components/ErrorBoundary.tsx`, todo#20). Wraps `<App />` in `index.tsx`. Crash overlay with collapsible technical-detail block; four actions (Reload / Return to main menu / Download logs / Copy logs). Global `window.onerror` and `unhandledrejection` listeners feed the log buffer.
- **Developer-mode store** (`src/store/devStore.ts`, todo#21). Master `enabled` switch, `enabledAt` timestamp, five cheats (`godMode`, `infiniteResources`, `instantActions`, `revealHidden`, `verboseLogging`). Disabling wipes cheats. Helper `devCheatActive(cheat)`. 6 unit tests.
- **Settings → Developer card.** Surfaces the dev-mode toggle behind a confirmation dialog. Verbose-logging toggle mirrors into `setLogLevel`.
- **Card physics: drag-to-reorder + hover lift + standardised height** (`exp--card-physics`, todo#3). HTML5 drag-and-drop hand reorder via new `reorderHand(orderedInstanceIds)` action. `CardFace` declares standardised `min-h` (180px compact / 280px regular). Hover transform `-translate-y-1 rotate-[-0.4deg]` on a 150ms `ease-arrive` curve. Dragged source fades to `opacity-40`. New `characterStore.test.ts` (5 cases).
- **Character panel optimisation + avatar presets + reference-figure relocation** (`exp--character-panel`, todo#6, #9, #10). New `<AvatarMedallion />`, `<AvatarPicker />` plus 8-entry preset registry under `src/data/avatars/` (icon-glyph medallions; no AI-generated portraits per AGENTS.md §2.9). Character creation opens with live avatar preview + preset picker. Character panel rebuilt around hero header + Stats / Traits / Progression cards + full-width ideology compass with reference figures (FDR, Reagan, Sanders, Thatcher). Dashboard mini-compass hides reference figures. New `setAvatar` action. 11 unit tests + 1 Playwright smoke.
- **Right-click context menus on cards and timeline** (`exp--right-click-menus`, todo#5). New `<ContextMenu />` portal + `useContextMenu` hook. Cards: Play / Copy ID / Discard. Timeline: Open detail / Copy headline. Closes on Escape, outside pointerdown, scroll, or resize; re-clamps after layout. 7 unit tests + 1 Playwright smoke.
- **Patch Notes panel + changelogs structure** (`exp--patch-notes-viewer`, todo#17, partial #19). New sidebar entry (`news` icon) opens an in-game viewer with three release-channel tabs (Stable / Development / Experimental). New `MarkdownLite` component (h1/h2/h3, bullet lists, paragraphs, inline code). Bundled at build time via `import.meta.glob`. Seeded with `docs/changelogs/development/v0.1.0-alpha.md`. 7 parser tests + 1 Playwright smoke. GitHub Releases API integration deferred.
- **Sync-with-Drive launcher command** (`exp--sync-with-drive`, todo#18). New `sync:drive` task in `launcher.ps1` plus standalone `scripts/sync-drive.ps1`. Mirrors the working tree to Google Drive via `robocopy /MIR`. Supports `-WhatIf`. Validates destination drive is mounted.
- **Quests panel redesign** (`exp--quests-detail`, todo#13). Two-pane browser with filter pills (All / Active / Available / Completed) + list rail + detail pane. Detail shows description, full objectives with progress, prerequisites, rewards (humanised from raw `Effect[]`), time-limit warning. New icons (`circle`, `trophy`, `lock`). 7 `describeEffect` tests + 1 Playwright smoke.
- **EntityLink component** (`exp--entity-clickability`, todo#14, partial). Inline link rendering an entity reference (bill / npc / group / event) as a clickable, keyboard-accessible button. Timeline panel uses `EntityLink` to make news headlines with `relatedEntity` jump to the destination panel. 8 unit tests.
- **Timeline panel** (`exp--timeline-panel`, todo#15). New sidebar entry (`clock` icon) — chronological log of every news headline grouped by month (newest-first). Severity communicated via left border colour. 4 Vitest cases + 1 Playwright case.
- **Glossary panel** (`exp--glossary-panel`, todo#16). New first-class screen accessible from sidebar (`book` icon). Search field (matches title / id / aliases), category filter pills, two-column list+detail layout. Detail re-renders each `TooltipSection` at panel scale; surfaces `seeAlso` cross-links. New `book` and `search` icons. New `PanelId: 'glossary'`. 3 Playwright cases.
- **Dashboard interactivity** (`exp--dashboard-interactivity`, todo#11). Four KPI tiles (Approval / GDP Growth / Unemployment / Deficit) become real `<button>`s navigating to the underlying panel. Values colour-coded by tone. New `data-testid` selectors. 3 Playwright cases.
- **Tooltips everywhere + nested z-stacking** (`exp--tooltips-everywhere`, todo#1). Glossary affordances on stat labels across `EconomyPanel`, `PopulationPanel`, `SkillsPanel`. `Bar.label` and `Card.title`/`subtitle` accept `ReactNode`. `<Term>` exposes `data-term="<id>"`. Nested ExtendedTooltip stacking via `TooltipDepthContext`; outer tooltips at z-index 10010, first nested level at 10020. New glossary entries: `inflation`, `happiness`, `activism`. 3 Playwright cases.
- **Polish pack** (`exp--polish-pack`). Global no-select chrome (todo#4) on `body, html` with `-webkit-touch-callout: none` and `-webkit-tap-highlight-color: transparent`; inputs/textareas/`[contenteditable]` opt back in. Stat allocation polish (todo#8): removed misaligned `pa-slider-ticks`; each stat name wrapped in `ExtendedTooltip` keyed to its glossary entry; `StatBudget` meter replaces plain-text budget subtitle. Treasury indicator (todo#12): new `treasury: number` field on `GameState` (default 0, floored at 0); `addTreasury(delta)` action; TopBar `economy` icon + formatted readout; new `treasury` glossary term. 6 Vitest + 6 Playwright tests.
- **Cards UX hardening** (`exp--cards-ux-hardening`). AP cost enforcement in `CardSystem.play`; PC + AP spent atomically. `CardStats.cooldownWeeks` and `usesPerGame` honoured; `lastPlayedWeek` and `timesPlayed` updated on play. Multi-use cards persist across plays. Double-click protection via `playingId` lock. Pack-opening backdrop close after `settled` only. Prismatic rarity hardened with `isolation: isolate` + fresh stacking context.
- **Ideology compass redesign** (`exp--ideology-compass`). Larger interactive picker (default 320, 360 in character creation). Click / drag (Pointer Events with `setPointerCapture`) / arrow keys (Shift = larger step). Raw numeric coordinates removed; live orientation label (`data-testid="ideology-orientation"`, `aria-live="polite"`). New `ideologyLabel(point)` utility. 20 historical reference figures from `src/data/ideology/reference-figures.json` with hover/focus tooltips. 4 Playwright tests.
- **Auto-tooltip terms + hold-to-lock** (`exp--auto-tooltip-terms`). New `<TermText text="..." />` auto-links registered glossary surfaces. Glossary matcher: longest-first, non-overlapping, unicode word-boundary regex, lazy compiled-pattern cache. 11 Vitest cases. `TooltipContent.aliases?: string[]` for shorthand surfaces. Glossary expanded with 16 new terms. `<TermText>` wired into `CardFace`, `DashboardPanel`, `LegislationPanel`, `QuestsPanel`. Hold-to-lock: `lockHoldMs` (default 1200ms) with gold radial progress arc. 3 Playwright tests.
- **Card rarity, pack-opening, and stats system** (`exp--cards-and-tooltips`). `CardRarity` union with deterministic seeded distribution per pack template. Optional `stats` block on `CardDefinition`. 4 new high-rarity starter cards. New **Collection** panel with pack store (4 templates) and rarity-filtered grid. `CardFace` shared component with rarity-tinted frame. Pack-opening animation (shake → burst → reveal-grid → settled), `prefers-reduced-motion` honoured. Rarity CSS tokens.
- **Extended Tooltip system** — Paradox-style hover tooltips (Victoria 3 / CK3 pattern). `src/renderer/components/tooltip/`: `ExtendedTooltip` (portal, 500ms openDelay, viewport clamp, `role="tooltip"`, Shift-to-pin, Esc to close); `registry`; `glossary` seed. Wired into `TopBar` and `CardFace`. Term references in tooltip body open follow-up tooltips on hover.
- **Playwright coverage** — `tests/e2e/cards-and-tooltip.spec.ts` (9 tests across 1280×720, 1440×900, 1920×1080).
- **Congress hemicycle redesign** (closes #41). Replaces `SeatGrid` with semi-circular parliament layout. New `Hemicycle` component; pure `layoutHemicycle(legislators, width)` computing seat positions across rows. Seats ordered left-to-right by `ideology.x`. `CongressPanel` rebuilt with plinth chamber headers + `PartyStrip` + sticky `LegislatorDetail` rail. 4 Vitest cases.
- **Custom progress bar — `Meter`** (`src/renderer/components/Meter.tsx`). Inset-groove track with gold-to-blue toneable fill; optional `threshold` caret; optional `segments` ticks; arrive-eased width transition.
- **Custom slider — `Slider`** (`src/renderer/components/Slider.tsx`). Restyled native range with recessed 8px track, gold-gradient fill driven by `--pa-fill`, 14px diamond thumb. Adopted in Settings and Character Creation.
- **Dashboard situation-room redesign** (closes #39). KPI strip (Approval · GDP · Unemployment · Deficit). **Focus card** resolved from `resolveFocus(event, pendingBills)` (priority `event > bill at vote > furthest-along pending > quiet`). Ambient **The Press** news column. Bottom row pairs **Identity** card + **This Week** agenda. 4 unit tests.
- **Game-feel foundation pass** (`docs/research/game-feel-foundation-2026-04.md`). Loaded IBM Plex Mono. Removed global `body { font-family: Inter }` override. New design tokens (`border-rule*`, `border-danger`, `shadow-glow-*`, `duration-instant`, `ease-arrive`, `ease-depart`, semantic font-size scale). New animations (`panel-enter`, `pulse-gold`, `toast-enter`, `card-enter`, `pip-flash`); reduced-motion honoured globally. New `.game-scroll` styled scrollbar; global `:focus-visible` gold outline. New `Icon` component over vendored Tabler glyphs (MIT). New `ResourcePips`. New `BottomBar` (72px command strip).
- **Tooltip polish 3 — category-coloured term underlines** (`exp--tooltip-polish-3`, todo#51). `<Term>` chip reads its tooltip's `subtitle` and applies a category-specific Tailwind decoration class. Mapping exposed as `termCategoryDecorationClass(subtitle)`. New `termCategory.test.ts`.

### Changed

- **Congress hemicycle fits viewport + Character creator point-budget polish** (`exp--congress-fit-and-budget`, todo#56 + #28). Hemicycle uses `w-full h-auto max-w-full max-h-full` with default `xMidYMid meet`; container switched to `max-h-[55vh] min-h-[220px] flex items-center justify-center`. `StatBudget` gains a vertical hairline at min/max and a status line.
- **Humanise data tags across the renderer** (`exp--humanize-data-tags`, todo#75). New `src/utils/humanize.ts` centralises label dictionaries previously duplicated in `Game.tsx` and `QuestsPanel.tsx`. Generic `humaniseId(id)` plus typed lookups (`humaniseResource`, `humaniseEconomyMetric`, `humaniseCohortId`, `humaniseStat`). Wired into both `describeEffect` implementations. 7 tests + updated `QuestsPanel.test.ts`.
- **UX polish pack 1** (`exp--ux-polish-pack-1`, todo#26 + #29/#37/#76/#77/#90). Tooltip pin default 2s → 3s. `docs/todo.md` archive: 24 strikethrough-completed items moved to `## Completed (archived)`; 6 historical items added.
- **Tooltip polish pass** (`exp--tooltip-polish`, todo#26 / #29 / #37 / #39). Hover-hold default lengthened to 3000ms. Single-pinned-tooltip discipline (`pinnedClosers` evicts other pinned popups on transition). Mouse-anchored top-left positioning with 12px cursor-offset; keyboard-focus activations fall back to trigger bounding rect. Auto-link registered terms inside paragraph prose via `findTermMatches`. 2 component tests added.
- **`Button`** visual language: `rounded-sm`, uppercase tracking-widest headline type, `active:translate-y-px`, `shadow-glow-gold` on primary hover, 80ms transitions.
- **`Card`**: 3px left-bar accent (was full 40%-opacity border); `rounded-sm` (was `rounded-lg`); header separated by `border-b border-rule`; `shadow-md` removed.
- **`TopBar`**: slim 48px three-zone grid (identity · date · resources). Removed emoji. Speed controls moved to `BottomBar`.
- **`Sidebar`**: navigation uses `<Icon />` instead of ASCII glyphs. Active state is gold-filled.
- **`Game` shell**: three-row grid (`48px` TopBar / `1fr` main / `72px` BottomBar). `<main>` re-mounts on panel change via `key={activePanel}`.

### Fixed

- **Save/load no longer wipes Zustand actions** (`exp--todo-tidy`, todo#81). `applySavePayload` was calling `useGameStore.setState(snapshot, true)` (full-replace), silently dropping bound action methods. Switched to merge-mode.
- **`dataLoader` warning** (`exp--todo-tidy`, todo#81). Legislation glob `/src/data/legislation/*.json` matched `policy-modules.json` and tried to validate as `BillTemplate`. Moved to `src/data/legislation/modules/policy-modules.json` and updated import path.
- **Codex review fixes across PR #63 / #64 / #66** (`exp--review-fixes-2`). Timeline empty-archive fallback (PR63 P1): treat `newsArchive: []` as not-yet-populated. Clipboard helper with execCommand fallback (PR64 P2): new `src/utils/clipboard.ts`. Mobile drawer reset on screen change (PR66 P2). Closed mobile drawer is `inert` (toggle imperatively).
- **Mobile portrait layout** (`exp--mobile-portrait-fixes`). 192px sidebar collapses into overlay drawer below `md`; new TopBar hamburger toggle. Game shell uses `100dvh` + `env(safe-area-inset-*)` padding. TopBar drops "XP" suffix and "AP" caption below `sm`. BottomBar shrinks speed buttons (40→36px) and abbreviates the long week footer. Dashboard KPI tiles use `text-2xl` on phones. New Pixel-7-portrait Playwright project + 3-test smoke.
- **Codex review fixes across PR #50–#62** (`exp--review-fixes`). Pinned tooltip clicks no longer self-close (PR50 P1). Tooltip alias registry honours latest write (PR50 P2). Compass orientation readout gated by `label` prop (PR51 P2). Compass uses `application` role for 2D control (PR51 P2). Multi-use cards consumed on final play (PR52 P1). Treasury formatter handles k→m boundary (PR53 P2). Glossary panel renders `[term:id]label[/]` markers correctly (PR57 P1, new `stripTermMarkers`). Glossary breakdown view shows the Total row (PR57 P2). Timeline reads from uncapped `WorldState.newsArchive` (PR58 P2). Quests panel respects instance status (PR60 P1). Launcher `sync:drive` runs in current shell (PR61 P2). MarkdownLite preserves wrapped list items (PR62 P1).
- **Events firing multiple times after resolution** (`exp--events-bugfix`, todo#7). Non-repeatable events gated by persisted `firedEventIds: string[]` on `WorldState`. Repeatable events honour per-event cooldown via `GameEventDefinition.cooldownWeeks` (default 4) + `WorldState.eventCooldowns`. Cooldown stamped at queue time. `EventEngine.resolveOption` idempotent against rapid double-clicks via in-flight `resolving` set. 4 Vitest cases.

### Documentation

- **Scenario plan document** (`exp--scenario-plan-and-archive-3`, todo#42). New `docs/SCENARIO_PLAN.md` lays out implementation order for the nine planned scenarios, each with period framing, key historical events, political figures, social movements & cohorts, major issues, branching seams, and engine work required.
- **Todo archive sweep 2** (`exp--todo-archive-sweep-2`). Reconciled `docs/todo.md` against the codebase: items #4, #20, #22, #46, #61/#71 (duplicate), #62, #67, #78, #84, #85 moved to archived with file/line evidence. Process notes #24/#25 marked as adopted.

---

## [0.1.0-alpha.1] — 2026-04-24

First development-stream tag aggregating the bootstrap + initial system implementations. Not a stable release.

### Added

- **Electron main process** (`src/main/main.ts`, `preload.ts`) with safe contextBridge IPC for save/load/settings; Vite-plugin-electron dev + build pipeline.
- **GameEngine orchestrator** wiring every system to TimeEngine's daily/weekly/monthly/annual hooks.
- **`dataLoader`** — loads all JSON bundles under `src/data/**` via `import.meta.glob` with lightweight validation.
- **Systems:** Congress (procedural 100+435 legislators, deterministic), Card (register/draw/play/discard), Quest (objective evaluation), Influence (weekly PC), Skill (branch tree + prerequisites), Dialogue (pure tree traversal).
- **MVP content:** Modern America 2024 scenario bundle; 12 cards, 10 traits, 5 events, 4 quests, 10 bill templates, 10 achievements.
- **Full UI:** router, ToastRoot, Modal shell, shared components (Button, Card, Bar, StatBlock, IdeologyCompass, 535-seat SeatGrid, TopBar, Sidebar) + screens (MainMenu, CharacterCreation, ScenarioSelect, Game, Settings, Achievements) + panels (Dashboard, Legislation, Congress, Population, Economy w/ sparklines, Quests, Cards, Skills, Character).
- **UI perf:** `memo` on hot components, selector-based Zustand subscriptions, keyboard shortcuts (Space/1–4 for pause/speed).
- **Tests:** added `applyEffect`, `CongressSystem`, `EconomySystem`, `CardSystem` unit tests (65 tests total).
- **PowerShell launcher** (`launcher.ps1`) with arrow-key menu, stylised colour theme, preflight checks, progress panels, and a non-interactive `-Task` mode.
- **Android scaffolding** via `npx cap add android` with `keystore.properties.example` for release signing.
- **Windows electron packaging** (`build:win`) — NSIS installer + portable via electron-builder.

### Fixed

- `EventEngine.resolveOption` uses deterministic `SeededRNG` instead of `Date.now()`.
- `EventEngine` `stat` trigger condition now actually evaluates player character stats.
- `EconomySystem.weeklyUpdate` uses seeded drift (was trig-based stub).
- Removed deprecated `bundledWebRuntime` from `capacitor.config.ts`.

---

## [0.1.0-alpha.0] — Pre-tag scaffold

Initial scaffold notes preserved from the project's first `[Unreleased]` block, predating the `0.1.0-alpha.1` tag. Retained verbatim for historical continuity.

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

---

## Authoring rules

When you land a change, write a changelog entry. Where it lives depends on the stream.

### Where to add

| Situation | File |
|---|---|
| Feature merged to `development` (or any `exp--*` branch that lands on dev) | A new file under [`docs/changelogs/development/`](../changelogs/development/) **and** an entry in this file's `[Unreleased]`. |
| Cutting an `experimental` pre-release tag (`v*.*.*-exp.YYYYMMDD`) | A new file under [`docs/changelogs/experimental/`](../changelogs/experimental/). The `[Unreleased]` block in this file remains the working draft until promotion. |
| Promoting a version to `stable` | A new file under [`docs/changelogs/stable/`](../changelogs/stable/) **and** convert this file's `[Unreleased]` block into a numbered version section dated with the release day. |

### File naming

- Stream-folder files: `YYYY-MM-DD-<version>-<slug>.md` (e.g. `2026-05-02-0.2.0-alpha.1-legislative-overhaul.md`).
- Stable-folder files for full releases may omit the slug: `YYYY-MM-DD-<version>.md`.
- Historical files predating this convention are preserved as-is. New files must follow the convention.

### Required entries before stable promotion

Every gate in [GDD §13.7.1](../GDD.md) must be reflected in the stable changelog entry. At minimum:

- A **Security** subsection (even if empty — explicit "no security-relevant changes" note).
- A **Migration notes** block if `meta.schemaVersion` increased since the prior stable.
- Cross-references to any GDD §14 risk that was retired or newly opened by this release.

### Section names (Keep a Changelog 1.1.0)

Use only these subsections, in this order, omitting any that are empty for the version:

`### Added` · `### Changed` · `### Deprecated` · `### Removed` · `### Fixed` · `### Security`

A `### Documentation` subsection is permitted in `[Unreleased]` and dev-stream files for doc-only changes; it must be folded into `### Changed` at stable promotion.

---

## Compare links

Placeholder hashes will be reconciled by Jesse during release. The pattern below is the contract.

[Unreleased]: https://github.com/ScottyVenable/Political-Ascent/compare/v0.1.0-alpha.1...HEAD
[0.1.0-alpha.1]: https://github.com/ScottyVenable/Political-Ascent/releases/tag/v0.1.0-alpha.1
[0.1.0-alpha.0]: https://github.com/ScottyVenable/Political-Ascent/commits/v0.1.0-alpha.1
