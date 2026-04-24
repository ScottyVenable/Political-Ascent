# Game-feel Foundation — April 2026

## Context

`docs/UI_GAME_FEEL_PROPOSAL.md` (1309 lines) laid out a comprehensive plan
to move Political Ascent's UI from "productivity-app dark mode" to
"institutional, Bloodborne-adjacent political thriller". The proposal
listed ten numbered priorities plus per-screen redesign specs.

This research note records which parts of that proposal shipped in the
first foundation PR (`exp--game-feel-foundation` → experimental →
development) and which parts were **intentionally deferred**.

## What shipped

All of these were landed together because they interlock — any of them
taken alone would leave the shell inconsistent.

1. **Typography fixes (proposal §3)**
   - `index.html`: added IBM Plex Mono to the Google Fonts stylesheet.
     All numeric readouts were previously rendering as Courier New on
     Windows because the mono face was never loaded.
   - `src/renderer/styles.css`: removed the `body { font-family: Inter }`
     override that was silently defeating the Tailwind `font-body` token
     system-wide. Body now inherits Inria Serif.
   - `tailwind.config.ts`: added the semantic font-size scale
     (`text-screen-title`, `text-panel-title`, `text-card-title`,
     `text-body`, `text-label`, `text-data-lg`, `text-data`,
     `text-data-sm`). Components opt in by meaning, not by pixel size.

2. **Design tokens (proposal §4)**
   - Border colours: `border-rule`, `border-rule-strong`, `border-danger`.
   - Box shadows: `shadow-glow-gold`, `shadow-glow-danger`.
   - Transition durations (`duration-instant` = 80ms) and easing curves
     (`ease-arrive`, `ease-depart`). All exposed through Tailwind **and**
     as CSS custom properties (`--pa-ease-*`) so keyframes and vendor
     pseudo-elements can reach them.

3. **Animations (proposal §5)**
   - Keyframes: `pa-panel-enter`, `pa-pulse-gold`, `pa-toast-enter`,
     `pa-card-enter`, `pa-pip-flash`.
   - `prefers-reduced-motion` honored globally: a single `@media` block
     disables every animation without per-component wiring.
   - Game-styled scrollbar (`.game-scroll`) with 6px gold thumb.
   - Keyboard focus ring (`:focus-visible`) with gold 2px outline.

4. **Icon system (proposal §2, §6)**
   - New `src/renderer/components/Icon.tsx`: typed `IconName` union +
     inline SVG registry. Icons are Tabler (MIT), vendored as inline JSX
     to avoid an HTTP round-trip and keep them colour-inheritable via
     `currentColor`.
   - Initial set: nine panel nav icons + four speed-control glyphs +
     eight utility chevrons/alerts.
   - Removed ASCII glyphs (`◎ § ⌇ ⧉ ♠ ✦ ✎`) from the Sidebar and the
     emoji (📅, ❚❚) from the TopBar.

5. **Component redesigns (proposal §6)**
   - **`Button`**: `rounded-sm` (2px not 4px), uppercase tracking-widest
     headline type, `active:translate-y-px` pressed state,
     `shadow-glow-gold` on hover for the primary variant, 80ms
     transitions.
   - **`Card`**: removed `shadow-md`, dropped to `rounded-sm`, accent is
     now a 3px left border bar instead of a full outline. Header gets a
     `border-b border-rule` separator; subtitle is mono/uppercase/small.
   - **`ResourcePips`** (new): 8px-square pip row used for Action Points
     in the TopBar. Filled pips use `bg-accent-gold`; empty pips are
     tertiary with a rule border.

6. **Shell restructure (proposal §7)**
   - Three-row grid layout (`48px` TopBar / `1fr` main / `72px` BottomBar).
   - **TopBar** is now identity-date-resources only. Three grid zones,
     one question each: "who am I · when am I · what can I spend".
   - **BottomBar** (new) holds speed controls and week/year readout.
     RTS-style command strip; four 40-px square speed buttons with gold
     fill when active.
   - **Sidebar** uses Icon component, active state is gold-filled.
   - **Main panel** re-mounts on panel change via `key={activePanel}`,
     triggering the `panel-enter` animation every time the player
     switches panels — makes the shell feel like a place you navigate,
     not a tab bar.

## What was intentionally deferred

Scope was trimmed from the proposal during assessment. The following
were dropped or postponed:

- **Number-tick-up animations** (proposal §5.4). Added complexity and
  re-render cost without proportional game-feel benefit. May revisit if
  a specific readout (e.g. vote tally during roll-call) needs drama.
- **Speed-indicator scan-line** (proposal §5.6). Would require a
  full-viewport overlay. The pulsing gold fill on the active speed
  button is sufficient signal.
- **Slide-over modal drawer** (proposal §7.5). The current `ModalShell`
  remains; switching to a slide-over requires every modal-using panel
  to be audited. Future PR.

These per-screen redesigns from proposal §8 are NOT in this PR and are
tracked as follow-up issues:

- §8.1 Main-menu atmosphere (newsprint background, animated title).
- §8.2 Dashboard "situation room" layout.
- §8.3 Legislation pipeline (diamond stage-track).
- §8.4 Congress control-panel grid.
- §8.7 Cards as physical objects (fan layout, tilt on hover).
- §8.8 Skills as a constellation tree.
- §8.10 Quests as a case file.

Each of these is a larger undertaking than the foundation and depends on
the tokens, icons, and components that shipped here. Splitting them out
keeps each PR reviewable.

## Verification

- `npm run lint`: clean.
- `npm run typecheck`: clean (tsc on both `tsconfig.web.json` and
  `tsconfig.electron.json`).
- `npm test -- --run`: 89/89 tests pass (10 test files).
- Live verification via Playwright-driven screenshot of the dashboard at
  1440×900: TopBar shows identity zone / date zone / PC+AP zone with no
  emoji; Sidebar renders Icon-based nav with gold active state; main
  panel shows Cards with gold left-bar accent; BottomBar shows four
  speed buttons + "WEEK 1 / of 52 · January 2025".

## Follow-up tracking

A follow-up issue should be filed for each of the deferred per-screen
redesigns. Each follow-up PR should reference the specific proposal
section it implements so the lineage from the original 1309-line spec
stays traceable.
