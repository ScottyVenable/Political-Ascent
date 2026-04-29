# Changelog

All notable changes to Political Ascent are recorded here.

## [Unreleased]

### Added

- **Tooltip polish 3 — category-coloured term underlines** (`exp--tooltip-polish-3`, todo#51 + housekeeping). The inline `<Term>` chip now reads its registered tooltip's `subtitle` and applies a category-specific Tailwind decoration class (Resource → gold, Stat → sky, Mechanic → slate, Concept → violet, Legislation → emerald, Action → amber, Population → rose, Economy → teal, Cohort metric → pink, Event → orange). Unknown / missing subtitles fall back to the original `decoration-accent-gold/60` so legacy terms look unchanged. The mapping is exposed as `termCategoryDecorationClass(subtitle)` for tests and any future surfaces that need to colour terms outside of `<Term>`. New `termCategory.test.ts` covers fallback, case-insensitivity, whitespace tolerance, and uniqueness across the ten known categories. Branch also reconciles `docs/todo.md`: items 49, 50, 52, 57, 59, 79, 80, 83 were already shipped in earlier PRs but had not been crossed off — they are now annotated with the PR or commit they shipped in.

### Added

- **Mobile polish + new pre-release APK** (`exp--mobile-polish-and-apk`, todo#23 follow-up).
  - **Modal viewport sizing.** `ModalShell` now clamps to `max-h: calc(100dvh - 1.5rem)`, switches to a `flex flex-col` column with the header pinned and the body region scrolling internally (`overflow-y-auto min-h-0 game-scroll`). On portrait Pixel-class devices, long event descriptions and vote-result modals no longer overflow the viewport. Outer overlay padding now respects `env(safe-area-inset-*)` so the dialog can't tuck under the Pixel notch.
  - **Modal close glyph.** Replaced the literal `✕` Unicode character with `<Icon name="close" size={16} />` so the close affordance follows the same icon registry policy as everything else (and inherits `currentColor` for theme tinting).
  - **APK pre-release** `v0.1.0-alpha.1-exp.20260429` published. Bumped `package.json` to match (`0.1.0-alpha.1-exp.20260429`) and `android/app/build.gradle` to `versionCode 2 / versionName "0.1.0-alpha.1-exp.20260429"`. Debug APK ~3.83 MB.

### Added

- **Polish pack 2** (`exp--polish-pack-2`, todo#41 / todo#54 / todo#58 / todo#86).
  - **Determinism guard test** (todo#86). New `src/test/determinism.test.ts` walks `src/engine/`, `src/systems/`, and `src/store/` and fails the suite if any non-test, non-comment line contains `Math.random(`. Honours `// eslint-disable-line determinism/seeded-rng` for explicit, justified opt-outs. The guard caught one real violation: `uiStore.pushToast` was assigning `Math.floor(Math.random() * 1000)` to toast IDs. Replaced with a session-monotonic `toastSeq` counter so toast IDs remain unique without the prohibited primitive.
  - **Money formatting precision** (todo#58). New `formatBillionsUSDFull(n)` helper returns the full comma-grouped USD value (e.g. `$1,734,000,000,000`); new `formatBillionsUSDForDisplay(n, precision)` consumes the new `display.numberPrecision` setting (`'auto' | 0 | 1 | 2 | 3`). Settings panel grows a "Number precision" `<select>` between Reduce-motion and Fullscreen toggles. The Dashboard's Annual Deficit KPI now renders with the player's chosen precision and exposes the full comma-grouped value inside its hover tooltip. Nine new tests added to `format.test.ts`.
  - **Tooltip viewport clamp — left/top edges** (todo#41). `TooltipCard`'s post-mount clamp now runs in two phases: (1) far-edge push for right/bottom overflow (existing behaviour, comment-explained), then (2) a near-edge clamp that pins `top`/`left` to the 8px margin. Without phase 2 a tooltip anchored at `coords {top:0, left:0}` could render with the title flush against the viewport edge or partially clipped on small screens.
  - **Achievement toast → panel navigation** (todo#54, verified). `AchievementEngine` already emits toasts with `actionRoute: 'achievements'` and `ToastRoot` already binds a click handler that calls `navigate(t.actionRoute)`; verified end-to-end.

### Fixed

- **Save/load no longer wipes Zustand actions** (`exp--todo-tidy`, todo#81). `applySavePayload` was calling `useGameStore.setState(snapshot, true)` which Zustand interprets as full-replace and silently dropped the bound action methods (`setSpeed`, `setPaused`, etc.). On the very next render `GameEngine.startClock` would crash with `game.setSpeed is not a function`. Switched to merge-mode (`setState(snapshot)` without the second arg) so action methods survive the load while every persisted data field is still overwritten by the snapshot. Test coverage held at 7/7 because the tests only check data round-trip; the bug was action-binding which production code exercises but the tests didn't.
- **`dataLoader` warning** (`exp--todo-tidy`, todo#81 cluster). The legislation glob `/src/data/legislation/*.json` matched `policy-modules.json` from the draft-legislation PR and tried to validate it as a `BillTemplate`, logging `skipping invalid file` on every boot. Moved the file to `src/data/legislation/modules/policy-modules.json` (out of the bills glob) and updated the import path in `DraftLegislationScreen`.

### Added

- **Bottom bar polish + mobile portrait sweep** (`exp--bottom-bar-polish`, todo#23 + todo#38). Bottom bar gets a richer command strip: speed buttons render as a true segmented `radiogroup` (rounded-l on Pause, rounded-r on 4&times;, square middles, gold-glow on the active member), keyboard-shortcut chips (`Space`, `1`, `2`, `4`) render under each speed on tablet+, the centre week readout grows a slim year-progress bar (1px on phones, 2px on tablet+, gold), the right-side cluster now shows a vertical divider before the destructive Menu button, and the footer honours `env(safe-area-inset-bottom)` so the Pixel home indicator doesn't clip controls. New `data-testid` selectors: `bottombar`, `bottombar-speed`, `bottombar-speed-{0|1|2|4}`, `bottombar-week`, `bottombar-year-progress`. Mobile portrait spec extended to verify Population / Economy / Timeline / Skills panels layout cleanly in a Pixel-class viewport with no horizontal overflow.

### Added

- **Draft legislation customization** (`exp--draft-legislation`, todo#40). Replaces the one-click Draft button with a deep-customization modal opened from the Draft tab. The screen pre-loads the player's chosen template, then lets them edit the bill title, toggle policy modules (eight starter modules across fiscal / climate / labor / procedural / regional / regulatory categories, each contributing additive opposition + budget deltas plus their own `Effect`s), and read a synthesised "hypothetical bill text" preview that recomposes from the base description plus each active rider phrase. A sticky climate-forecast rail recalculates `LegislationSystem.estimatePassageChance` live as modules toggle, with composed totals (opposition, budget impact, module count, effect count) and an active-rider list. Submitting forwards a synthesised `BillTemplate` to the existing `LegislationSystem.draftBill` pipeline so the bill enters the same in-flight queue. A `Quick draft` ghost button is preserved for power users. New `PolicyModule` type (`src/types/legislation.ts`), data file `src/data/legislation/policy-modules.json`. Drag-and-drop ordering of modules is intentionally deferred — click-to-toggle is honest about scope. New Playwright case in `tests/e2e/draft-legislation.spec.ts`.

### Added

- **Skill tree visualisation** (`exp--skill-tree`, todo#34). Replaces the flat 3-column card grid with an RPG-style tree: six branch columns sorted by stat, hex-clipped skill badges with explicit locked / available / unlocked states (filled gold + check pip when unlocked, gold-ring pulse when available, dim grey when locked), in-branch prerequisite chains rendered as connector bars that light up gold once the predecessor is owned, and a sticky right-rail showing the focused node's full description, prereq chips (clickable to walk a chain), and the unlock affordance. Header strip now surfaces per-branch completion (`charisma 1/2`, etc.) so the player can see progress at a glance. New `data-testid` selectors: `skill-tree`, `skill-tree-grid`, `skill-points`, `skill-branch-totals`, `skill-branch-{name}`, `skill-node-{id}`, `skill-connector-{prev}-{next}`, `skill-detail-rail`, `skill-prereq-{id}`, `skill-unlock-button`. Two new Playwright cases in `tests/e2e/skill-tree.spec.ts`.

### Added

- **Timeline filters and search** (`exp--timeline-filters`, todo#35). The Timeline panel grows a filter bar above the chronology: three severity chips (Info / Warning / Danger) with live count badges plus a free-text search input that scans both headline and body. Toggling the last severity off auto-restores all three (matches the affordance pattern used by Steam and Slack log filters). New `data-testid` selectors: `timeline-filter-bar`, `timeline-filter-{info,warning,danger}`, `timeline-search`, `timeline-count`.

### Added

- **Economy panel detail** (`exp--economy-detail`, todo#32). Indicator rows now carry trend chips comparing the latest snapshot to one ~12 weeks back, with arrows colour-coded by metric direction (a falling unemployment rate is good news and renders in `text-status-success`, even though the delta is negative). Two new derived cards sit beneath the snapshot/trends grid: **Fiscal pressure** (debt-to-GDP ratio with a 100% danger threshold, tone-shifting bar) and **Distribution** (Gini coefficient as a 0–100 meter, with explanatory copy). New `data-testid` selectors: `economy-panel`, `economy-debt-to-gdp`, `economy-gini`.

### Added

- **Population focus pages** (`exp--population-focus`, todo#31). Population tab cards become clickable surfaces. Each card opens a `<GroupFocusModal />` with a two-column layout: mood (Happiness / Radicalism / Activism / Loyalty as bars, with a single-axis ideology compass strip showing the group's economic bias) on the left, demographics (size, income index, full tag chips, and a placeholder for group-targeted player actions like rallies and ad buys) on the right. Escape and backdrop click dismiss. New `data-testid` selectors: `population-grid`, `population-group-card`, `population-focus-modal`, `population-focus-mood`, `population-focus-demographics`. New Playwright case in `tests/e2e/population-focus.spec.ts`.

### Added

- **Congress panel — chamber tabs and member-detail modal** (`exp--congress-tabs`, todo#30). The chamber floor stops being a static stack of two charts.
  - **Three-state tab strip** at the top: Both Chambers / Senate / House. Senate-only and House-only views drop the second card so the focused chamber owns more vertical real estate. Tabs follow proper `role="tablist"` / `aria-selected` semantics.
  - **Hover preview** is now wired into the side rail. Mousing across seats lights up the rail without locking selection; clicking pins. The rail prefers hover and falls back to the last pinned selection so it never blanks out on mouseleave.
  - **Member-detail modal** opens on seat click. Two-column layout: stat block (relationship, personality, ideology, term, priorities, plus a research-mechanic placeholder Button) on the left; voting summary (Yea/Nay/Abstain totals as a 3-tile grid) and the most recent 25 votes on the right. Escape and backdrop dismiss.
  - The legacy "Close detail" affordance now clears both the rail and the hover state in one click.
  - Deeper opposition research (cards, AP/PC cost, hidden-info reveal) is intentionally deferred — file follow-up issue.

### Added

- **Save and load** (`exp--save-load`, todo#36). Real save/load lands at last.
  - New `src/engine/SaveSystem.ts` — single-source serialiser. Versioned envelope (`meta.schemaVersion = 1`) wrapping a snapshot of `gameStore`, `characterStore`, and `worldStore`. Schema mismatches refuse to load with a clear reason instead of silently corrupting state. Storage is platform-aware: Electron writes through the existing `pa:save:*` IPC bridge to `electron-store`; browser/Capacitor falls back to `localStorage` under the `pa:save:` prefix.
  - **Developer-mode tagging** wired up (todo#21 follow-through): saves taken while `useDevStore.enabled` is true carry `meta.developer = true`. The Load UI surfaces a red `DEV` chip on those rows.
  - **`<SaveLoadModal />` component** with shared slot-list rendering for both modes. Save mode adds a "create new save" row with a name field; both modes offer overwrite and delete with `alertdialog` confirmations. Newest first, corrupt slots sink to the bottom with the schema error inline.
  - **Wiring**: Main Menu now has a `Load Game` button that opens the modal in load mode and routes to `game` after a successful load. The in-game `BottomBar` gains `Save` / `Load` / `Menu` buttons in its previously-empty right slot. Opening either modal pauses the simulation; closing leaves it paused so the player chooses when to resume.
  - **`docs/guides/SAVE_FORMAT.md`** rewritten to match the shipped schema.
  - 7 Vitest cases in `SaveSystem.test.ts` cover round-trip through localStorage, schema-version refusal, missing-slot reporting, deletion, store restoration, and developer-mode tagging.

### Added

- **Cards panel — drag-to-play, drop indicator, playable glow** (`exp--card-play-polish`, todo#33). The hand panel now feels like a TCG instead of a list with arrows.
  - **Drag-to-play drop zone** at the top of the hand: dragging a card onto it triggers the same play flow as the per-card Play button. Failure surfaces as a toast (existing behaviour). Click on the zone surfaces a hint toast for keyboard/mouse users so the discoverability doesn't depend on a hover.
  - **Insertion indicator** — when a drag is in flight the row currently being hovered renders a left-edge gold bar. Absolutely-positioned so it never reflows the grid.
  - **Playable glow ring** — entire `card-row-playable` rows get a faint pulsing gold outline (1.8s period) when their resource gates clear. Reduced-motion users see a static ring. Cards on cooldown / unaffordable stay quiet so the hand reads as "live cards versus dead cards" at a glance.
  - **Drag image** is now the card art itself (CardFace `<article>`), not the row including the action buttons. Looks like a card you've picked up off the table rather than a torn UI fragment in Chrome.

- **Build Your Candidate — Stats step UX** (`exp--candidate-stats-ux`, todo#27 / #28). The Core Stats step now answers two questions a numeric score can't: "what tier is this?" and "what does that mean in play?".
  - **Tier chips per stat row** — Weak / Average / Strong / Exceptional, colour-coded via `statTierChipClass` (red / neutral / gold / blue). The chip reads the *final* value (after background bonuses) so the player sees the effective tier, not the raw allocation.
  - **One-line gameplay-impact blurb per row** — six stats × four tiers = 24 hand-written lines describing what the score *opens or closes* in the simulation. Wording targets loops (rallies, whip counts, donor calls) rather than mechanical multipliers so the copy stays accurate when the engine rebalances.
  - **Preset row** — "Reset to even" (5/5/5/5/5/5) and "Suggested for {background}" (a 30-point distribution per background that leans into the background's strengths and away from its weaknesses without being optimal). Quick way for a new player to start from a productive baseline; existing customisation flow is untouched.
  - New helper module `src/utils/statTier.ts` (5 unit tests) keeps the breakpoints (`≤3`, `4–5`, `6–7`, `8+`), labels, and class strings in one place.

- **In-app logger ring buffer** (`src/utils/logger.ts`, todo#22). The existing thin `createLogger` wrapper is replaced with a full logging subsystem: every entry is appended to a 500-entry ring buffer with timestamp, level (`debug` / `info` / `warn` / `error`), scope, message, and structured args. Errors are serialised correctly. Subscribers can listen for buffer updates so a future in-game log viewer panel can render live. Console pass-through is preserved in dev builds, suppressed in production. Ships with 5 unit tests covering each level, the level filter, subscription, ring-buffer trim, and Error serialisation.
- **Top-level ErrorBoundary** (`src/renderer/components/ErrorBoundary.tsx`, todo#20). Wraps `<App />` in `index.tsx`. On any uncaught render error, presents a player-friendly crash overlay with a collapsible technical-detail block, four actions (Reload / Return to main menu / Download logs / Copy logs), and clear language directing players to the issue tracker. The downloaded payload includes the error, component stack, full log buffer, and user-agent string. Global `window.onerror` and `unhandledrejection` listeners feed into the same log buffer so async failures land in any subsequent crash report.
- **Developer-mode store** (`src/store/devStore.ts`, todo#21). New Zustand slice with master `enabled` switch, `enabledAt` timestamp (consumed by the future save subsystem to tag developer saves), and five cheats: `godMode`, `infiniteResources`, `instantActions`, `revealHidden`, `verboseLogging`. Cheats are inert while the master switch is off; disabling wipes every cheat back to false. Convenience helper `devCheatActive(cheat)` for engine/systems call sites that don't want to touch React. Ships with 6 unit tests.
- **Settings → Developer card**. New section in the Settings screen surfaces the dev-mode toggle behind a confirmation dialog ("Saves created while developer mode is on will be tagged as developer saves"). Once armed, exposes individual toggles for each cheat. The verbose-logging toggle is mirrored into `setLogLevel` so debug entries start being captured immediately.

### Changed

- **Tooltip polish pass** (`exp--tooltip-polish`, todo#26 / #29 / #37 / #39). Behavioural changes to `<ExtendedTooltip />` that affect every panel:
  - **Hover-hold default lengthened to 3000ms** (todo#26). The radial progress ring still animates via rAF + `stroke-dashoffset`; the player now has a full three-second window before a tooltip auto-pins instead of the snappy 1.2s default.
  - **Single-pinned-tooltip discipline** (todo#29). New module-level `pinnedClosers` coordinator: when a tooltip transitions into the pinned state it evicts every other currently-pinned popup. Cleanup self-unregisters on unpin/unmount so a stale closer can never linger and silently swallow a future pin.
  - **Mouse-anchored top-left positioning** (todo#37). Hover tooltips now anchor their top-left corner at the cursor (with a 12px cursor-offset to avoid flicker on the 1px boundary). Keyboard-focus activations still fall back to the trigger's bounding rect since there's no mouse position to read. The viewport-clamp pass still runs after the popup measures itself, so a cursor near the right/bottom edge still flips the popup into view.
  - **Auto-link registered terms inside paragraph prose** (todo#39). `renderInlineTerms` now feeds plain (marker-free) text segments through `findTermMatches`, so any registered glossary surface anywhere in a section paragraph or list item becomes a nested `<Term>` link automatically. Explicit `[term:...]` markers still take precedence — authors can override the matcher whenever they want a non-matching label to point at a specific id.
  - 2 new component tests in `ExtendedTooltip.test.tsx`. 213 vitest passing. Lint/typecheck clean.

### Fixed

- **Codex review fixes across PR #63 / #64 / #66** (`exp--review-fixes-2`). Round-2 review pass on the most recent stack:
  - **Timeline empty-archive fallback** (PR63 P1). `useWorldStore((s) => s.newsArchive ?? s.news)` only fell back when `newsArchive` was `null`/`undefined`, but freshly migrated saves arrive with `newsArchive: []` and that empty archive silently won, erasing the player's prior history on screen. Treat an empty archive as "not yet populated" and fall back to the live ticker.
  - **Clipboard helper with execCommand fallback** (PR64 P2). `navigator.clipboard?.writeText(...).then(success, failure)` silently no-ops on insecure contexts and older Android WebView (the optional chain short-circuits before `.then`). New `src/utils/clipboard.ts` exports `writeClipboard(text): Promise<boolean>` that always resolves: tries the modern API, falls back to a deprecated-but-widely-supported `document.execCommand('copy')` textarea, returns `false` only if both paths fail. Both the Cards "Copy card ID" and Timeline "Copy headline" actions now consume this helper, so the player always gets a toast (success or "Clipboard unavailable"). 3 unit tests cover both paths.
  - **Mobile drawer reset on screen change** (PR66 P2). `mobileSidebarOpen` was only cleared inside `setActivePanel`, so quitting to the main menu while the drawer was open would leave the flag set and the drawer would render on top of the next session. Added a `useEffect` in the Game screen that clears the flag on both mount and unmount.
  - **Closed mobile drawer is `inert`** (PR66 P2). The off-screen drawer was `aria-hidden` but its descendant buttons remained tabbable, so a keyboard user could Tab into hidden controls and trigger panel changes invisibly. Attached a ref + effect that toggles the HTML `inert` attribute (broadly supported, blocks focus and pointer events on the entire subtree). React 18's typed JSX doesn't know about `inert`, so we set it imperatively to avoid a `// @ts-expect-error` cast.

### Added

- **Card physics: drag-to-reorder + hover lift + standardised height** (`exp--card-physics`, todo#3). The cards panel hand is now reorderable via HTML5 drag-and-drop — every card row is `draggable`, dropping a card onto another commits a new order through the new `reorderHand(orderedInstanceIds)` action on `characterStore`. The action preserves `CardInstance` identity (so React keys don't churn), is robust against draws landing mid-drag, and ignores stale ids surviving a discard. `CardFace` now declares a standardised `min-h` (180px compact / 280px regular) so cards across rows align, and a hover transform (`-translate-y-1 rotate-[-0.4deg]` on a 150ms `ease-arrive` curve) makes each card feel lifted off the table. The dragged source card fades to `opacity-40` so the player sees the move in flight. New unit suite `characterStore.test.ts` (5 cases covering identity preservation, missing target, stale-id, empty-hand). 208 vitest passing.

### Fixed

- **Mobile portrait layout** (`exp--mobile-portrait-fixes`). The 192px sidebar now collapses into an overlay drawer below the `md` breakpoint (toggled from a new TopBar hamburger), so the main panel keeps the full viewport width on phones. The Game shell applies `env(safe-area-inset-*)` padding and uses `100dvh` so the chrome doesn't clip under the Pixel notch / Dynamic Island / gesture bar. TopBar drops the "XP" suffix and "AP" caption below `sm`; BottomBar shrinks the speed buttons (40→36px) and abbreviates the long week footer; Dashboard KPI tiles use `text-2xl` on phones (vs. `text-data-lg` 32px on desktop) and truncate cleanly. New Pixel-7-portrait Playwright project + 3-test smoke (`tests/e2e/mobile-portrait.spec.ts`).

### Added

- **Character panel optimisation + avatar presets + reference-figure relocation** (`exp--character-panel`, todo#6, todo#9, todo#10). New `<AvatarMedallion />` and `<AvatarPicker />` components plus a curated 8-entry preset registry under `src/data/avatars/` (icon-glyph medallions, no AI-generated portraits per AGENTS.md §2.9). Character creation now opens with a live avatar preview alongside the name field and a preset picker beneath the background tiles. The Character panel is rebuilt around a hero header (avatar + name + background blurb + change-avatar toggle), separate Stats / Traits / Progression cards, and a full-width ideology compass that now shows the historical reference figures (FDR, Reagan, Sanders, Thatcher, etc.). The dashboard mini-compass explicitly hides reference figures so the two surfaces don't compete. New `setAvatar` action on `characterStore`. 11 unit tests + 1 Playwright smoke (`tests/e2e/character-panel.spec.ts`).

- **Right-click context menus on cards and timeline** (`exp--right-click-menus`, todo#5). New `<ContextMenu />` portal component + `useContextMenu` hook deliver lightweight, viewport-clamped contextual menus. Cards in the hand expose Play / Copy ID / Discard. Timeline entries expose Open detail (when the entry has a `relatedEntity`) and Copy headline. Menus close on Escape, outside pointerdown, scroll, or resize, and re-clamp into the viewport after layout. 7 unit tests + 1 Playwright smoke (`tests/e2e/right-click-menus.spec.ts`).

### Fixed

- **Codex review fixes across PR #50–#62** (`exp--review-fixes`). Single bundled PR addressing inline feedback from the automated Codex reviewer:
  - **Pinned tooltip clicks no longer self-close** (PR50 P1). The outside-click listener was registered on the capture phase, so React's bubbling-phase `stopPropagation()` inside the tooltip card never ran in time. Replaced the propagation guard with an ancestor walk that ignores any pointerdown inside an element with `role="tooltip"`. Pinned tooltips and any nested term tooltips inside them now stay open while the player interacts with them.
  - **Tooltip alias registry honours latest write** (PR50 P2). `buildMatcher` had a `if (!surfaces.has(key))` guard that contradicted its own "later writes override" comment. Removed the guard so mod or test re-registrations actually take effect.
  - **Compass orientation readout gated by `label` prop** (PR51 P2). Dashboard's `<IdeologyCompass label={false} />` no longer renders the orientation text directly under the puck (the dashboard already shows ideology in a separate identity card).
  - **Compass uses `application` role for 2D control** (PR51 P2). `role="slider"` requires scalar `aria-valuenow/min/max` that don't model two axes. Switched to `application` (interactive) / `img` (read-only) — the WAI-ARIA recommendation for keyboard-driven 2D widgets — and kept `aria-valuetext` carrying the orientation summary.
  - **Multi-use cards consumed on final play** (PR52 P1). `consumed` was derived only from `usesPerGame > 1`, so a 2-use card kept lingering in the deck after its second play, surfacing forever as a permanent dead draw. Now the card is consumed when the upcoming play would bring `timesPlayed` up to `usesPerGame`. New regression test in `CardSystem.test.ts`.
  - **Treasury formatter handles k→m boundary** (PR53 P2). `999_950` would round to `1000.0k`; now we re-check after rounding and promote to `1.0m`. New `TopBar.test.ts` with 5 cases.
  - **Glossary panel renders `[term:id]label[/]` markers correctly** (PR57 P1). Old single-token replace produced `card-packpacks[/]` shaped garbage in glossary prose. New exported `stripTermMarkers` mirrors the tooltip parser's rules, dropping markers while preserving labels (or substituting the id for bracketless markers). New `GlossaryPanel.test.ts` with 6 cases.
  - **Glossary breakdown view shows the Total row** (PR57 P2). Mirrors the tooltip widget's `showTotal !== false` semantics so the panel and tooltip agree on net values (e.g. Action Points: +3 base, +1 trait, −1 debuff = +3).
  - **Timeline reads from uncapped news archive** (PR58 P2). Added `WorldState.newsArchive` (uncapped) alongside the existing 50-cap `news` ticker. `pushNews` writes to both; the Timeline panel now reads `newsArchive` so older headlines stay visible across long campaigns. Falls back to `news` for save-file backwards compatibility.
  - **Quests panel respects instance status** (PR60 P1). Row builder previously hard-coded `'active'` for any active-quest instance, mislabelling rows even after `QuestSystem.dailyUpdate()` flipped them to `completed`/`failed`. Added explicit `failed` row state, filter, status icon (`x` Tabler glyph), and STATUS_ORDER entry.
  - **Launcher `sync:drive` runs in the current shell** (PR61 P2). Removed the hard-coded `pwsh` invocation; the launcher targets Windows PowerShell 5.1 and the standalone script is compatible with both hosts.
  - **MarkdownLite preserves wrapped list items** (PR62 P1). When the parser is in `ul` mode, an indented continuation line now appends to the current bullet instead of starting a paragraph. Fixes the broken-list rendering in the seeded `v0.1.0-alpha.md` changelog. Added 2 cases to `MarkdownLite.test.ts`.

### Added
- **Patch Notes panel + changelogs structure** (`exp--patch-notes-viewer`, todo#17, partial todo#19). New sidebar entry (`news` icon) opens an in-game viewer with three release-channel tabs (Stable / Development / Experimental). Each tab lists the markdown changelog files from the matching `docs/changelogs/<branch>/` folder; selecting an entry renders its content via a new `MarkdownLite` component that supports headings (h1/h2/h3), bullet lists, paragraphs, and inline code. Loading is bundled at build time via Vite's `import.meta.glob`, so no network call is needed. Seeded with `docs/changelogs/development/v0.1.0-alpha.md`. 7 new Vitest cases for the parser + 1 Playwright smoke. GitHub Releases API integration (for "what's new since last launch") deferred to a follow-up PR.
- **Sync-with-Drive launcher command** (`exp--sync-with-drive`, todo#18). New `sync:drive` task in `launcher.ps1` plus standalone `scripts/sync-drive.ps1`. Mirrors the working tree to `G:\My Drive\Entertainment\Game Development\Political Ascent` via `robocopy /MIR`, excluding `node_modules`, `.git`, `dist*`, `build`, `release`, `test-results`, `playwright-report`, `coverage`, and Android build outputs. Supports `-WhatIf` for dry runs and validates the destination drive is mounted before starting. Idempotent and safe to re-run.
- **Quests panel redesign** (`exp--quests-detail`, todo#13). Two-pane browser: filter pills (All / Active / Available / Completed) + list rail on the left, full detail pane on the right. Detail shows the description, full objectives list with progress, prerequisites, rewards (humanised from raw `Effect[]`), and a time-limit warning when present. Active quests use a `flag` icon, available a `circle`, completed a `check`, locked a `lock`, replacing the prior unicode glyphs. Added `circle`, `trophy`, and `lock` to the icon registry. 7 new Vitest cases for `describeEffect` + 1 Playwright smoke. Pressing the Start button on an Available quest still flows through `QuestSystem.start()`.
- **EntityLink component** (`exp--entity-clickability`, todo#14, partial). New reusable inline link that renders an entity reference (bill / npc / group / event) as a clickable, keyboard-accessible button. On click it switches the active sidebar panel to the appropriate destination (legislation / congress / population / timeline). The Timeline panel now uses `EntityLink` to make any news headline that carries a `relatedEntity` clickable, jumping the player straight to the panel where the entity lives. Keyboard focus ring + dotted underline make the affordance obvious. 8 new Vitest cases covering routing logic, rendering, click navigation, and override hooks. Future iterations will add hover ExtendedTooltips with entity summaries and deep-link sub-views.
- **Timeline panel** (`exp--timeline-panel`, todo#15). New sidebar entry (`clock` icon) opens a chronological log of every news headline the engine has emitted — bills passing/failing, event resolutions, scandals, ambient press cycles. Items are grouped by month (newest-first), each entry shows a relative date, and severity is communicated by the left border colour (info/warning/danger). Pure projection of `WorldState.news` with `groupByMonth` extracted as a named helper for unit testing. 4 new Vitest cases + 1 Playwright case.
- **Glossary panel** (`exp--glossary-panel`, todo#16). New first-class screen accessible from the sidebar (`book` icon). Renders every entry in the tooltip registry as a browsable, searchable encyclopedia. Three regions: case-insensitive search field (matches title / id / aliases), category filter pills (derived from the registry's `subtitle` field), and a two-column list+detail layout. The detail view re-renders each `TooltipSection` (paragraph, list, breakdown table, tag-row) at panel scale and surfaces `seeAlso` cross-links via `<Term>` so the player can keep drilling in. New `book` and `search` icons added to the registry. New `PanelId: 'glossary'`. 3 new Playwright cases in `tests/e2e/glossary-panel.spec.ts`.
- **Dashboard interactivity** (`exp--dashboard-interactivity`, todo#11). The four KPI tiles on the dashboard (Approval / GDP Growth / Unemployment / Deficit) are now real `<button>` elements that navigate to the panel where the underlying number lives. Each value is colour-coded by tone: positive numbers render in `text-status-success` (green), negatives in `text-status-danger` (red), and the Approval tile uses an explicit red→neutral→green ramp. Hover state lifts the border to `accent-gold/60` for affordance; focus ring uses the standard gold accent so keyboard navigation matches the rest of the chrome. New `data-testid` selectors (`kpi-approval`, `kpi-gdp`, `kpi-unemployment`, `kpi-deficit`). 3 new Playwright cases in `tests/e2e/dashboard-interactivity.spec.ts`.

### Fixed
- **Events firing multiple times after resolution** (`exp--events-bugfix`, todo#7).
  - Non-repeatable events are now gated by a persisted `firedEventIds: string[]` field on `WorldState` (replaces the in-memory `firedOnce` Set inside `EventEngine`). A save/load round-trip preserves the firing record, so one-shot events cannot re-trigger after the player loads.
  - Repeatable events now respect a per-event cooldown. `GameEventDefinition.cooldownWeeks` (defaults to 4) gates re-firing; `WorldState.eventCooldowns: Record<string, number>` stores the week of the most recent fire. The cooldown is stamped at queue time so a flapping condition cannot enqueue twice in one week.
  - `EventEngine.resolveOption` is now idempotent against rapid double-clicks via an in-flight `resolving` set; a second call with the same instance id while the first is still applying effects is a no-op.
  - 4 new Vitest cases in `src/engine/EventEngine.test.ts`.

### Added
- **Tooltips everywhere + nested z-stacking** (`exp--tooltips-everywhere`).
  - **Glossary affordances on stat labels across panels** (todo#1). `EconomyPanel` rows for `GDP Growth`, `Unemployment`, `Inflation`, and `Deficit` are now wrapped in `<Term>`; `PopulationPanel` Bar labels for `Happiness`, `Radicalism`, and `Activism` are likewise tooltip-bearing; `SkillsPanel` branch headers route to `stat-charisma`/`stat-strategy`/`stat-connections`/`stat-integrity`/`stat-stamina`/`stat-wealth`, and skill descriptions render via `<TermText>`.
  - **`Bar.label` and `Card.title`/`subtitle` accept `ReactNode`** so panels can pass a `<Term>`-wrapped element without losing the existing string-only call sites.
  - **`<Term>` exposes `data-term="<id>"`** for stable e2e selectors.
  - **Nested ExtendedTooltip stacking fix** (todo#1 second clause). When a tooltip body contains a glossary term whose own tooltip opens on hover, the inner tooltip must paint above its ancestor. `ExtendedTooltip` now reads a `TooltipDepthContext` (default 0), publishes `depth+1` to its trigger subtree and popup, and computes its `z-index` as `10000 + depth*10`. Outer tooltips sit at 10010, the first nested level at 10020, and so on — well above modals (`z-50`) and toasts (`z-40`).
  - 3 new Playwright cases (`tests/e2e/tooltips-everywhere.spec.ts`) verifying the GDP tooltip in EconomyPanel, the Radicalism tooltip in PopulationPanel, and the Treasury topbar tooltip end-to-end.
  - New glossary entries: `inflation`, `happiness`, `activism`.

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
