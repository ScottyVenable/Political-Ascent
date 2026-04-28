# Changelog

All notable changes to Political Ascent are recorded here.

## [Unreleased]

### Added
- **Polish pack** (`exp--polish-pack`).
  - **Global no-select chrome** (todo#4). `body, html` now carry `user-select: none` plus `-webkit-touch-callout: none` and `-webkit-tap-highlight-color: transparent` so accidental clicks no longer paint blue selection ranges across the dashboard, tooltips, or cards. Inputs, textareas, and `[contenteditable]` regions opt back in to text selection.
  - **Stat allocation polish** (todo#8). The character-creation Core Stats sliders no longer render the misaligned `pa-slider-ticks` border lines (they did not align to the integer snap points and were misleading). Each stat name is now wrapped in an `ExtendedTooltip` keyed to its glossary entry (`stat-charisma`, `stat-strategy`, `stat-connections`, `stat-integrity`, `stat-wealth`, `stat-stamina`) with a dotted-underline cursor-help affordance. The plain-text "Budget: N / 24–36" subtitle is replaced with a `StatBudget` meter — a labelled progress bar that flips tone (`under` muted-blue / `valid` gold / `over` red-striped) and exposes `data-tone` and `data-valid` attributes for testing.
  - **Treasury indicator** (todo#12). New `treasury: number` field on `GameState` (default `0`, floored at `0` — no debt yet) plus `addTreasury(delta)` store action. The TopBar now renders a third resource pill between PC and AP: a tabler `economy` (stacked-coins) icon plus a `$0` / `$12.4k` / `$1.3m` formatted readout, wrapped in an `ExtendedTooltip` for the new `treasury` glossary term. `initializeFromScenario` resets the treasury so a new run never inherits funds from a previous session.
  - 6 new Vitest cases (`gameStore.test.ts`) cover treasury default, additive behaviour, the zero floor, scenario reset, and PC parity.
  - 6 new Playwright tests (`tests/e2e/polish-pack.spec.ts`) cover `user-select: none` on body, `user-select: text` on inputs, the absence of slider ticks, the stat-name tooltip, the budget meter, and the treasury pill.
  - New glossary entries: `stat-wealth` (Wealth — financial standing) and `treasury` (campaign cash, distinct from PC).

- **Cards UX hardening** (`exp--cards-ux-hardening`).
  - **AP cost enforcement** in `CardSystem.play`: cards with `apCost` now require sufficient action points; both PC and AP are spent atomically (PC is refunded if AP spend somehow fails). `CardsPanel` Play button is disabled when AP is insufficient and exposes a `title` tooltip explaining the block reason.
  - **Cooldown & uses-per-game enforcement**: `CardStats.cooldownWeeks` and `CardStats.usesPerGame` are now honoured. `CardInstance.lastPlayedWeek` and `timesPlayed` are updated on a successful play. Multi-use cards stay in the deck across plays; single-use cards remain consumed (legacy behaviour). 6 new Vitest cases (AP block, AP+PC spend, cooldown record, cooldown block, cooldown elapsed, uses exhausted).
  - **Double-click protection**: `CardsPanel` tracks a `playingId` and disables both Play and Discard while a play is in flight. Try/finally guarantees the lock is released even if `applyEffects` throws.
  - **Pack-opening backdrop close**: `CardPackOpening` now dismisses on backdrop click, but only after the reveal state machine reaches `settled` and only if the click target is the backdrop itself (so child clicks don't bubble through). 2 new Playwright cases (close after settle, ignored during reveal).
  - **Prismatic rarity robustness**: the rotating conic-gradient border (used by The Statesman) is now hardened against the pack-reveal flip — the parent gets `isolation: isolate` + a fresh `z-index` stacking context, the pseudo-element gets `will-change: transform`, `pointer-events: none`, and explicit `transform-origin`. Reduced-motion users see a static gradient instead of a frozen frame.

- **Ideology compass redesign** (`exp--ideology-compass`).
  - `IdeologyCompass` rebuilt as a larger (default `size=320`, `360` in character creation) interactive picker. Click anywhere, drag the marker (Pointer Events with `setPointerCapture`), or use arrow keys (Shift = larger step) to set position. `role="slider"` + `aria-valuetext` for screen readers.
  - **Raw numeric coordinates are no longer shown.** The `x = … · y = …` font-mono readout in character-creation step 3 is gone. In its place a live orientation label (`data-testid="ideology-orientation"`, `aria-live="polite"`) reads e.g. "Centrist", "Moderate Right", "Strong Left-Libertarian".
  - New `ideologyLabel(point)` utility (`src/renderer/components/ideologyLabel.ts`) maps a 2-axis point to a human label using a 0.15 axis dead-zone, "Moderate" prefix below 0.4 magnitude, and "Strong" prefix at/above 0.75. 7 Vitest cases.
  - **Historical reference figures**: 20 ghost markers (FDR, JFK, Lincoln, Reagan, Sanders, AOC, Thatcher, Goldwater, Friedman, Chomsky, Mill, Rand, MLK, …) loaded from `src/data/ideology/reference-figures.json`. Hover (or focus) shows a tooltip with name and era. Quadrant labels (Lib-Left / Lib-Right / Auth-Left / Auth-Right) inset into the field.
  - 4 new Playwright tests (`tests/e2e/ideology-compass.spec.ts`) verifying live orientation, no raw-coord exposure, ghost-figure plotting, hover tooltip, and real-time label updates across `1280×720`, `1440×900`, `1920×1080`.

- **Auto-tooltip terms + hold-to-lock** (`exp--auto-tooltip-terms`).
  - `<TermText text="..." />` (`src/renderer/components/tooltip/TermText.tsx`) auto-links any registered glossary surface (title or alias) found in plain prose, eliminating the need to wrap each term manually.
  - Glossary matcher (`registry.ts → findTermMatches`): longest-first preference, non-overlapping ranges, unicode word-boundary regex, lazy compiled-pattern cache invalidated on `registerTooltip` / `clearTooltips`. 11 new Vitest cases.
  - `TooltipContent.aliases?: string[]` lets terms match shorthand surfaces like "PC" → Political Capital, "AP" → Action Points.
  - Glossary expanded with 16 new terms covering legislation (`bill`, `committee`, `floor-vote`, `whip`, `veto`), population (`cohort`, `radicalism`, `approval`, `turnout`), economy (`gdp`, `unemployment`, `deficit`), and structural concepts (`scandal`, `quest`, `event`, `scenario`). Every existing entry gained aliases.
  - `<TermText>` wired into `CardFace` (description + flavour), `DashboardPanel` (news body), `LegislationPanel` (template + bill descriptions), and `QuestsPanel` (quest descriptions). Auto-linking is one prop away for any future panel.
  - **Hold-to-lock**: `ExtendedTooltip` gained an `lockHoldMs` prop (default 1200ms). Hovering a term shows a gold radial progress arc in the tooltip's top-right corner; when the arc completes, the tooltip auto-pins. Outside-click (capture-phase `pointerdown`) closes a pinned tooltip; `Esc` still works. Footer text updates to reflect mode ("Hold to lock · Shift to pin now" → "Click outside or press Esc to close").
  - 3 new Playwright tests (`tests/e2e/auto-tooltip.spec.ts`) verifying radial-then-lock, outside-click-close, and Escape-close across `1280×720`, `1440×900`, `1920×1080`.

### Added (previous unreleased)
- **Card rarity, pack-opening, and stats system** (`exp--cards-and-tooltips`).
  - `CardRarity` union (`common | uncommon | rare | epic | legendary | prismatic`) with deterministic seeded distribution per pack template (`src/engine/cardPackEngine.ts`, 10 unit tests).
  - Optional `stats` block on `CardDefinition`: `power`, `cooldownWeeks`, `usesPerGame`, `level`, `factionAffinity`, `factionBonusMultiplier`. Backwards compatible — legacy cards continue to load.
  - 4 new high-rarity starter cards: `card-coalition-builder` (epic relationship), `card-shadow-broker` (epic sabotage), `card-floor-takeover` (epic legislation), `card-statesman` (prismatic wild).
  - New **Collection** panel (`src/renderer/panels/CollectionPanel.tsx`) with pack store (4 templates: Starter, Precinct, Press Cycle, Legislative) and rarity-filtered grid.
  - `CardFace` component (`src/renderer/components/CardFace.tsx`) shared between Cards/Collection/pack-opening: rarity-tinted frame, icon header, PC/AP cost cluster, description, optional stats strip (`StatPill` for Power/CD/Uses), flavour text, type tags.
  - **Pack-opening animation** (`src/renderer/components/CardPackOpening.tsx`): pure-CSS shake → burst → reveal-grid → settled phase machine. Honors `prefers-reduced-motion`.
  - Rarity CSS (`styles.css`): per-rarity colour + glow tokens, legendary box-shadow shimmer, prismatic conic-gradient `::before` spin, `pa-card-reveal` keyframe.
- **Extended Tooltip system** — Paradox-style hover tooltips (Victoria 3 / Crusader Kings III pattern).
  - `src/renderer/components/tooltip/`: `ExtendedTooltip` (portal, 500ms openDelay, viewport clamp, role="tooltip", Shift-to-pin, Esc to close); `registry` for term definitions; `glossary` seed file with `political-capital`, `action-points`, `alignment-bonuses`, plus card/legislation cross-links; 5 unit tests.
  - Tooltip content schema supports nested term-link bullet lists, See-also lists, italic summaries, and multi-paragraph prose body.
  - Wired into `TopBar` (PC and AP clusters) and `CardFace` (every card hover surfaces full definition).
  - Term references inside tooltip body open follow-up tooltips on hover (graph traversal).
- **Playwright coverage**: `tests/e2e/cards-and-tooltip.spec.ts` — 9 passing tests across `1280×720`, `1440×900`, `1920×1080` viewports with committed snapshots: Collection screen, PC tooltip, pack-open reveal.

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
