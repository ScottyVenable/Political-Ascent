# UI Game-Feel Proposal — "From Dev App to Game"

**Author:** Political Ascent Director (AI)
**Date:** April 2026
**Status:** Proposal — awaiting Lead Director approval before implementation
**Reference:** `docs/reference images/UI-UX/UI Theme - 1.png` (Bloodborne fan-made UI restyle by Jennifer Bertaggia)
**Companion to:** `docs/research/ui-audit-2026-04.md` (screen-by-screen bug audit), `docs/GDD.md §18` (design language spec)

---

## Table of Contents

1. [The Problem Statement](#1-the-problem-statement)
2. [North-Star Principles](#2-north-star-principles)
3. [Typography System](#3-typography-system)
4. [Colour & Token Audit](#4-colour--token-audit)
5. [Animation & Motion Language](#5-animation--motion-language)
6. [Component Redesigns](#6-component-redesigns)
   - [6.1 Button](#61-button)
   - [6.2 Progress Bar](#62-progress-bar)
   - [6.3 Card / Panel](#63-card--panel)
   - [6.4 Scrollbars](#64-scrollbars)
   - [6.5 Tooltips](#65-tooltips)
   - [6.6 Modals](#66-modals)
   - [6.7 Toast / Notifications](#67-toast--notifications)
   - [6.8 Tab Bars](#68-tab-bars)
   - [6.9 Input Fields](#69-input-fields)
   - [6.10 Icon Wrapper](#610-icon-wrapper)
7. [Shell Redesign — TopBar, Sidebar, BottomBar](#7-shell-redesign--topbar-sidebar-bottombar)
8. [Screen-by-Screen Proposals](#8-screen-by-screen-proposals)
   - [8.1 Main Menu](#81-main-menu)
   - [8.2 Dashboard (Situation Room)](#82-dashboard-situation-room)
   - [8.3 Legislation (Pipeline View)](#83-legislation-pipeline-view)
   - [8.4 Congress](#84-congress)
   - [8.5 Population](#85-population)
   - [8.6 Economy](#86-economy)
   - [8.7 Cards (Physical Hand)](#87-cards-physical-hand)
   - [8.8 Skills](#88-skills)
   - [8.9 Character Sheet](#89-character-sheet)
   - [8.10 Quests](#810-quests)
9. [Implementation Sequencing](#9-implementation-sequencing)

---

## 1. The Problem Statement

The current UI is built like a well-structured web admin panel. It is clean, dark, and palettecorrect — the April 2026 theme pass fixed the most egregious colour violations. But the structural language is still that of a SaaS product:

- **Shell pattern:** `min-h-screen flex flex-col` with a `w-48` sidebar and `flex-1 overflow-y-auto` main area. This is the Tailwind template for a monitoring dashboard. It communicates nothing about what is at stake.
- **No persistent game-state chrome.** Speed controls live in the top-right like a media player seek bar. There is no bottom bar, no card hand, no "next action" affordance. Nothing in the UI at rest tells you time is passing or that choices are available.
- **Symmetric card grids.** Every panel is `grid-cols-2 gap-4`. This is the same layout a developer uses for a settings screen. Grids do not communicate hierarchy, urgency, or consequence.
- **Flat typography.** Only one type size is used meaningfully in practice. There is no contrast between a headline stat and its label, or between an urgent event and background noise.
- **No tactile feedback.** Buttons press with a brightness filter and a `transition-colors`. Nothing sounds, moves, or resists. Objects do not feel like objects.
- **Emoji in the shell.** `📅`, `🏳` in `TopBar.tsx` — a direct rule violation and a visual register clash with the Inria Serif institutional aesthetic.

The reference image (Jennifer Bertaggia's Bloodborne UI restyle) shows what we are aiming for: a product where the iconography, font scale, colour restrain, and spatial hierarchy all communicate a singular, authored tone. Every pixel is a design decision, not a default.

This document specifies the path from where we are to that target.

---

## 2. North-Star Principles

These principles apply to every component, screen, and animation in this proposal.

**P1 — One primary accent, used sparingly.**
Gold (`#948161`) is the *only* primary action colour. Its scarcity is what gives it weight. A button is gold because it matters. If everything is gold, nothing is.

**P2 — Serif for meaning, mono for precision.**
Inria Serif communicates authority, history, consequence. IBM Plex Mono communicates precision and data. Never use Inria Serif for a number that changes every tick; never use Plex Mono for a headline that makes an argument.

**P3 — Motion communicates state change, not decoration.**
Animations exist to show that something happened: a bar filling, a stage advancing, a card being played, time moving. They do not exist to look polished. Fast-in / slow-out (ease-out) for arrivals. Slow-in / fast-out (ease-in) for dismissals. Duration never exceeds 400ms.

**P4 — The shell tells you what is happening without you navigating.**
At any moment, without clicking anything, the player should know: what time is it, how many action points remain, whether something urgently needs attention, and what cards they can play. The shell must carry game state, not just navigation.

**P5 — Texture over chrome.**
A panel border is better than a panel shadow. A subtle noise overlay is better than a gradient. A thin ruled line is better than a heavy container. The aesthetic is institutional and printed, not glassy and layered.

**P6 — No emoji anywhere a player can see it.**
Applies to all shipped UI. Violations should fail CI. See `docs/guides/ICONS_AND_ASSETS.md`.

---

## 3. Typography System

### 3.1 Current state

The font stack is partially implemented. `tailwind.config.ts` maps `font-title`, `font-headline`, `font-body`, and `font-flavor` to Inria Serif. `font-mono` maps to IBM Plex Mono. However:

- `styles.css` sets `body { font-family: 'Inter' }`, which overrides the Tailwind `font-body` token unless the class is explicitly set on every element.
- IBM Plex Mono is **not** loaded in `index.html` — only Inria Serif is loaded from Google Fonts. The `font-mono` token falls back to `ui-monospace`, which renders as Courier New on Windows. Every number in the game is currently rendered in Courier New.
- There is no size scale discipline. Components use `text-xs`, `text-sm`, `text-lg`, and `text-2xl` without a semantic rationale.

### 3.2 Required fixes

**`index.html`** — Add IBM Plex Mono to the Google Fonts preload. A single weight (400) is sufficient for data readouts:

```html
<link
  href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400&family=Inria+Serif:ital,wght@0,300;0,400;0,700;1,400&display=swap"
  rel="stylesheet"
/>
```

**`styles.css`** — Remove the `font-family: Inter` override and replace with the Inria Serif token:

```css
body {
  font-family: 'Inria Serif', Georgia, serif;
}
```

### 3.3 Semantic size scale

Define and use these classes consistently. Add them as Tailwind extensions or as CSS classes in `styles.css`:

| Class | Size | Weight | Font | Usage |
|---|---|---|---|---|
| `text-screen-title` | `4rem / 64px` | 700 | Inria Serif | Main menu title only |
| `text-panel-title` | `1.5rem / 24px` | 700 | Inria Serif | Panel headings (Dashboard, Legislation, etc.) |
| `text-card-title` | `1.125rem / 18px` | 700 | Inria Serif | Card / section headings within a panel |
| `text-body` | `0.9375rem / 15px` | 400 | Inria Serif | All body copy, descriptions |
| `text-label` | `0.75rem / 12px` | 400 | Inria Serif | Secondary labels, captions |
| `text-data-lg` | `2rem / 32px` | 400 | IBM Plex Mono | Primary stat readouts (PC, AP, approval %) |
| `text-data` | `1.125rem / 18px` | 400 | IBM Plex Mono | Secondary stat readouts (economy figures) |
| `text-data-sm` | `0.75rem / 12px` | 400 | IBM Plex Mono | Timestamps, raw coords, debug values |

### 3.4 Hierarchy example: Resources card

Current implementation reads everything at roughly the same visual weight. The proposed version:

```
POLITICAL CAPITAL          (text-label, text-text-muted — 12px Inria Serif)
58                         (text-data-lg, text-accent-gold — 32px IBM Plex Mono)
━━━━━━━━━━━━━━●───         (pip row or bar)

ACTION POINTS              (text-label, text-text-muted)
7 / 7                      (text-data, text-text-primary — 18px IBM Plex Mono)
```

The number commands the hierarchy. The label annotates. The reader's eye knows immediately what to look at.

---

## 4. Colour & Token Audit

### 4.1 Current token map (post-theme-pass)

From `tailwind.config.ts`:

| Token | Hex | Correct use |
|---|---|---|
| `bg-primary` | `#0B1012` | Root background, outermost shell |
| `bg-secondary` | `#131919` | Cards, panels, sidebar, topbar |
| `bg-tertiary` | `#242F35` | Elevated rows, tag chips, input backgrounds |
| `accent-blue` | `#1B353F` | Informational accents, Democrat seats — **never CTA** |
| `accent-red` | `#8C2F2F` | Danger actions, Republican seats |
| `accent-gold` | `#948161` | **The only primary CTA colour** — actions, active states |
| `text-primary` | `#D8D6CC` | All body text |
| `text-secondary` | `#989A8F` | Labels, captions |
| `text-muted` | `#5F6158` | Ghost labels, disabled states, timestamps |
| `status-success` | `#6B8F5A` | Passed bills, positive trends |
| `status-warning` | `#C9A84C` | Stalled bills, moderately unhappy groups |
| `status-danger` | `#8C2F2F` | Failed bills, crisis states |

### 4.2 Additions needed

These tokens do not exist in `tailwind.config.ts` but are required by this proposal:

| Token | Hex | Rationale |
|---|---|---|
| `border-rule` | `rgba(148,129,97,0.15)` | The standard thin rule used between sections — gold-tinted, very subtle |
| `border-accent` | `rgba(148,129,97,0.40)` | Elevated card borders, active states |
| `border-danger` | `rgba(140,47,47,0.50)` | Danger state card borders |
| `glow-gold` | box-shadow: `0 0 12px rgba(148,129,97,0.25)` | Active button glow — not bright, just alive |
| `glow-danger` | box-shadow: `0 0 12px rgba(140,47,47,0.25)` | Danger/crisis glow |
| `overlay-vignette` | `radial-gradient(ellipse at center, transparent 60%, #040605 100%)` | Main menu and modal backdrop atmospheric layer |

### 4.3 Forbidden colour uses

The following usages are prohibited and should be caught in code review:

- Any use of `accent-blue` as a button background.
- Any inline `style` colour not derived from a CSS custom property.
- Any raw hex not mapped from the token table above.
- Any Unicode emoji character in a JSX return value (should be an `<Icon />` call).

---

## 5. Animation & Motion Language

### 5.1 Guiding constraint

We are in an Electron app. Animations run at whatever frame rate the host machine can provide, unbounded by a 60fps vsync-locked game loop. This is both an advantage (smoothness) and a risk (janky repaints on slower machines). All animations must:

- Use CSS `transition` or `animation` over JavaScript-driven animation where possible.
- Never animate layout properties (`width`, `height`, `padding`, `margin`) directly — use `transform: scaleX()` or `opacity` instead.
- Respect `prefers-reduced-motion` via a Tailwind `motion-reduce:` variant on every animated class.

### 5.2 The easing vocabulary

Three easing curves cover every animation in this game. Define them as CSS custom properties in `styles.css`:

```css
:root {
  /* Arrival: fast-in, slow-out. Used for panels sliding in, bars filling,
     items entering the screen. The player should see the destination quickly. */
  --ease-arrive: cubic-bezier(0.0, 0.0, 0.2, 1.0);

  /* Departure: slow-in, fast-out. Used for dismissals, toasts fading,
     items leaving. The player should not be kept waiting. */
  --ease-depart: cubic-bezier(0.4, 0.0, 1.0, 1.0);

  /* Standard: symmetric ease. Used for hover states, colour transitions,
     anything bidirectional. */
  --ease-standard: cubic-bezier(0.4, 0.0, 0.2, 1.0);
}
```

### 5.3 Duration scale

| Token | Duration | Usage |
|---|---|---|
| `duration-instant` | `80ms` | Hover colour changes, focus rings |
| `duration-fast` | `150ms` | Button press feedback |
| `duration-normal` | `250ms` | Panel transitions, bar fills |
| `duration-slow` | `400ms` | Modal entrance, screen-level transitions |
| `duration-ambient` | `2000–4000ms` | Looping atmospheric effects (pulse, shimmer) — extremely subtle |

### 5.4 Defined animation catalogue

Every animation in the game should exist in this catalogue. Nothing ad-hoc.

---

#### `anim-panel-enter`
**What:** A panel slides in when the active panel changes.
**How:** `translateY(8px) opacity(0)` → `translateY(0) opacity(1)`, `duration-slow`, `ease-arrive`.
**Where:** Applied to the `<main>` content region in `Game.tsx` on `activePanel` change.
**Note:** Only `opacity` and `transform` are animated — no layout shift.

```css
@keyframes panel-enter {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
.animate-panel-enter {
  animation: panel-enter 400ms var(--ease-arrive) both;
}
```

---

#### `anim-bar-fill`
**What:** A progress bar animates its fill width on mount/value-change.
**How:** `scaleX(0)` → `scaleX(1)` with `transform-origin: left`, `duration-normal`, `ease-arrive`.
**Where:** `Bar.tsx` fill element. Also used for the bill stage track.
**Important:** Drive the fill width with an inline `style={{ width: '${pct}%' }}` but animate via `transition: width 250ms var(--ease-arrive)`. The `transition-all` currently on `Bar.tsx` will catch this if changed to `transition-[width]`.

---

#### `anim-number-tick`
**What:** A stat number counts up from its previous value to its new value when the weekly tick fires.
**How:** A short CSS counter animation or a minimal vanilla JS requestAnimationFrame tick (100ms duration, ease-out). The number does not jump — it rolls.
**Where:** PC, AP, approval %, and large economy figures in TopBar and Dashboard.
**Why:** Numbers that tick feel like a running simulation. Numbers that jump feel like form inputs.

---

#### `anim-card-enter`
**What:** Cards animate in when the hand updates (new week draw).
**How:** `translateY(20px) opacity(0)` → `translateY(0) opacity(1)`, staggered by 60ms per card, `duration-normal`, `ease-arrive`.
**Where:** Bottom bar card chips on draw; CardsPanel full cards.

---

#### `anim-card-play`
**What:** When a card is played, it lifts and fades out upward.
**How:** `translateY(0) opacity(1)` → `translateY(-12px) opacity(0)`, `duration-fast`, `ease-depart`.
**Where:** The played card instance in the hand.

---

#### `anim-toast-enter` / `anim-toast-exit`
**What:** Toasts slide in from the bottom-right.
**How:** Enter: `translateX(100%) opacity(0)` → `translateX(0) opacity(1)`, `duration-normal`, `ease-arrive`. Exit: reverse, `duration-fast`, `ease-depart`.
**Where:** `ToastRoot.tsx`.

---

#### `anim-pulse-gold`
**What:** A very slow, very subtle gold glow pulse on elements that require player attention (a bill ready to vote, a card in hand the player can afford to play right now).
**How:** `box-shadow: 0 0 8px rgba(148,129,97,0)` → `box-shadow: 0 0 8px rgba(148,129,97,0.35)`, `2s ease-in-out infinite alternate`.
**Where:** Legislation bill cards in "vote" stage; card chips in bottom bar when affordable.

```css
@keyframes pulse-gold {
  from { box-shadow: 0 0 0px rgba(148, 129, 97, 0); }
  to   { box-shadow: 0 0 10px rgba(148, 129, 97, 0.35); }
}
.animate-pulse-gold {
  animation: pulse-gold 2s ease-in-out infinite alternate;
}
```

---

#### `anim-speed-indicator`
**What:** The active speed button in the bottom bar has a subtle scan-line animation to show time is running.
**How:** A 1px horizontal line descends through the button face on a 1.5s loop. Extremely subtle. Paused entirely when `isPaused`.
**Where:** The active `<SpeedButton>` in `BottomBar`.

---

#### `anim-modal-enter`
**What:** Modal slides in over the backdrop.
**How:** Backdrop: `opacity(0)` → `opacity(1)`, `duration-slow`. Modal card: `translateY(-16px) opacity(0)` → `translateY(0) opacity(1)`, `duration-slow`, `ease-arrive`.
**Where:** `ModalShell.tsx`.

---

### 5.5 What we explicitly do not animate

- Sidebar panel switching (immediate; it is navigation, not a game event).
- Text cursor or caret in inputs.
- Recharts chart renders (Recharts has its own animation that we configure, not override).
- Anything on the weekly tick that would cause visual jank (no layout reflow on tick).

---

## 6. Component Redesigns

### 6.1 Button

**Current state:** `rounded font-headline font-medium transition-colors`, standard border-radius rectangle. The active state is a `brightness-110` filter. It reads like a web form button.

**Target state:** A game CTA button communicates physicality — it has a `pressed` state that feels like something moved, not just changed colour.

**Proposed spec:**

```
Default:
  bg: bg-accent-gold (#948161)
  text: bg-primary (#0B1012)
  border: 1px solid rgba(148,129,97,0.6) + 1px bottom at rgba(148,129,97,0.8) (creates a "ledge")
  border-radius: 2px (near-square — institutional, not pill-shaped)
  font: Inria Serif, font-medium, tracking-[0.05em] uppercase (labels are uppercase in the reference)
  transition: all 80ms ease-standard

Hover:
  bg: lighten gold ~8% — use filter: brightness(1.12)
  box-shadow: glow-gold (subtle, not dramatic)

Active (pressed):
  transform: translateY(1px)
  box-shadow: none (the "ledge" disappears — the button has physically pressed)
  filter: brightness(0.95)

Disabled:
  bg: bg-tertiary
  text: text-muted
  border: border-rule
  cursor: not-allowed
  no glow, no hover effect

Focus-visible:
  outline: 2px solid accent-gold
  outline-offset: 2px
```

**Secondary variant:**
```
bg: transparent
border: 1px solid border-accent (gold at 40%)
text: text-secondary
Hover: bg-tertiary, text-primary
Active: translateY(1px)
```

**Ghost variant:**
```
bg: transparent
border: none
text: text-muted
Hover: text-secondary
```

**Key change from current:** The `rounded` class (8px radius) becomes `rounded-sm` (2px). This is the single biggest signal shift. Pill-rounded corners read "mobile app." Sharp corners read "terminal, institutional, serious."

---

### 6.2 Progress Bar

**Current state:** `h-2 rounded-full bg-bg-tertiary` track with a `bg-accent-gold rounded-full` fill. The `h-2` is 8px — barely visible at the resolution the game targets. The fill animates via `transition-all`.

**Target state:** Progress bars in this game are legibility instruments. A bar should communicate clearly whether something is high, low, rising, or at a threshold.

**Variants:**

**`BarVariant.stat`** — Used for character stats, population metrics, loyalty.
```
Height: 4px (h-1 in Tailwind)
Track: bg-tertiary, no radius (rect, not pill)
Fill: solid colour, no radius, animates on value change via transition-[width]
Shows a tick mark at the 50% position (neutral threshold indicator)
No glow
```

**`BarVariant.resource`** — Used for PC and AP in TopBar (pip row) and Dashboard.
```
Instead of a bar: render as N filled dots + M empty dots
Dot size: 8px × 8px, spacing: 4px
Filled dot: bg-accent-gold, square (border-radius: 1px)
Empty dot: bg-tertiary, square
Animates: when a pip fills, it flashes briefly (scale 1.4 → 1.0, 80ms)
Maximum display: 10 pips. If max > 10, group into 5-pip clusters with a gap.
```

**`BarVariant.progress`** — Used for bill stage tracks, quest progress.
```
Height: 6px
Track: bg-tertiary, rect
Fill: accent-gold, rect
Stage nodes: small diamonds at each stage position (CSS clip-path: polygon)
Active node: filled gold diamond with pulse-gold animation
Inactive node: empty diamond, text-muted
```

**`BarVariant.sparkline`** — Used for economy trends, approval history.
```
Not a bar — a Recharts LineChart rendered at ~80px height, no axes, no labels
Line: accent-gold, stroke-width 1.5
Below fill: gradient from accent-gold/20 to transparent
No animation on Recharts render (too noisy); just displays current data
```

**`BarVariant.approval`** — Used in the Dashboard for the approval meter.
```
Height: 12px
Track: full-width rect
Fill: colour transitions based on value:
  < 35%: status-danger fill
  35–55%: status-warning fill  
  > 55%: status-success fill
A thin vertical line at 50% as the "majority line" reference
Text label above showing value + trend arrow (↑ ↓ →)
```

---

### 6.3 Card / Panel

**Current state:** `bg-bg-secondary rounded-lg border border-[accent]/40 p-4 shadow-md`. The `rounded-lg` (12px) reads as a material card. The `shadow-md` has nothing to cast onto.

**Target state:** Institutional panels with ruled edges, not material cards.

**Proposed spec:**

```
Container:
  bg: bg-secondary (#131919)
  border: 1px solid border-rule (rgba(148,129,97,0.15))
  border-radius: 2px (rounded-sm — square, not pill)
  padding: 16px (p-4 unchanged)
  box-shadow: none — no material shadow
  
Header (title + subtitle line):
  padding-bottom: 8px
  border-bottom: 1px solid border-rule
  title: font-title, text-card-title (18px), text-primary
  subtitle: font-mono, text-data-sm (12px), text-muted
  
Accent variants:
  gold: border-left: 3px solid accent-gold (the left bar, not full border)
  red:  border-left: 3px solid accent-red
  blue: border-left: 3px solid accent-blue
  none: no left bar
  
Hover (when card is interactive/clickable):
  border-color: border-accent (raises from 15% to 40% opacity)
  transition: border-color 80ms ease-standard
```

**Section dividers within a card:**

A consistent thin ruled line (`border-t border-rule mt-3 pt-3`) between logical sections inside a card. This replaces the current mix of `mb-2`, `mb-3`, `space-y-2` without semantic meaning.

---

### 6.4 Scrollbars

**Current state:** The browser/OS default scrollbar, which is a wide gray rectangle — completely inconsistent with the dark palette.

**Target state:** A thin, game-styled scrollbar that doesn't break the aesthetic.

Add to `styles.css`:

```css
/* Thin scrollbar — 4px track, gold thumb, dark background.
   Applied globally via the .game-scroll class. Webkit only in Electron. */
.game-scroll::-webkit-scrollbar {
  width: 4px;
}
.game-scroll::-webkit-scrollbar-track {
  background: var(--color-bg-secondary, #131919);
}
.game-scroll::-webkit-scrollbar-thumb {
  background: var(--color-accent-gold, #948161);
  border-radius: 2px;
}
.game-scroll::-webkit-scrollbar-thumb:hover {
  background: color-mix(in srgb, var(--color-accent-gold, #948161) 80%, white);
}

/* Firefox */
.game-scroll {
  scrollbar-width: thin;
  scrollbar-color: #948161 #131919;
}
```

Apply `game-scroll` class to: the `<main>` content region in `Game.tsx`, the news list in `DashboardPanel`, any overflow container in `PopulationPanel` or `CongressPanel`.

---

### 6.5 Tooltips

**Current state:** No tooltip component exists. Hover intent context is absent from the entire UI.

**Target state:** A minimal tooltip system for stat labels, icon buttons, and card cost explanations.

**Proposed `Tooltip.tsx` component:**

```
Trigger: hover or focus on any element wrapped with <Tooltip content="...">
Appearance:
  bg: bg-tertiary (#242F35)
  border: 1px solid border-rule
  border-radius: 2px
  padding: 4px 8px
  font: text-label (12px Inria Serif)
  text: text-secondary
  max-width: 200px
  
Animation:
  Enter: opacity(0) translateY(4px) → opacity(1) translateY(0), 150ms ease-arrive
  Exit: opacity(1) → opacity(0), 80ms ease-depart
  
Positioning: Floating-UI (already available as a peer of React) for safe viewport placement
```

Tooltips are required on:
- All `<Icon />` instances that lack an adjacent visible label.
- PC and AP pip displays (tooltip shows "Political Capital: 58 / 100").
- Speed buttons (tooltip shows "Pause", "Normal", "Fast", "Blazing").
- All Bill tags in LegislationPanel.

---

### 6.6 Modals

**Current state:** `ModalShell.tsx` exists but has no documented entry animation. The backdrop is a simple `bg-black/60`.

**Target state:**

```
Backdrop:
  bg: rgba(4,6,5,0.80) (near-black from the reference, slightly green-tinted)
  backdrop-filter: blur(2px)
  animation: opacity 0→1, 400ms ease-arrive
  
Modal container:
  max-width: 560px
  bg: bg-secondary
  border: 1px solid border-accent
  border-radius: 2px
  box-shadow: 0 0 40px rgba(0,0,0,0.8)
  animation: translateY(-16px) opacity 0→1, 400ms ease-arrive
  
Header:
  padding: 16px 20px 12px
  border-bottom: 1px solid border-rule
  title: font-title, text-panel-title (24px), text-primary
  close button: × glyph, top-right, ghost variant
  
Body:
  padding: 20px
  
Footer:
  padding: 12px 20px 16px
  border-top: 1px solid border-rule
  flex row, justify-end, gap-2
```

---

### 6.7 Toast / Notifications

**Current state:** `ToastRoot.tsx` exists. Severity colours follow the existing token map.

**Target state — layout and animation improvements:**

```
Position: bottom-right, 16px from edge
Stack: newest on top, max 4 visible
Width: 320px
  
Per toast:
  bg: bg-secondary
  border-left: 4px solid [severity colour]
  border-top/right/bottom: 1px solid border-rule
  border-radius: 0 2px 2px 0 (left is flush with the 4px severity bar)
  padding: 10px 14px
  
Severity bars:
  info:    accent-blue (#1B353F)
  success: status-success (#6B8F5A)
  warning: status-warning (#C9A84C)
  danger:  status-danger (#8C2F2F) — additionally has glow-danger box-shadow
  
Animation: anim-toast-enter / anim-toast-exit (see §5.4)
Auto-dismiss: progress bar underneath the toast text showing remaining TTL
  (a 1px line that depletes left-to-right, matching the severity bar colour)
```

---

### 6.8 Tab Bars

**Current state:** `LegislationPanel.tsx` and `CharacterCreation.tsx` use inline button arrays for tabs with a `bg-accent-gold` active class. The active tab looks identical to a primary button.

**Target state:**

```
Tab bar container:
  border-bottom: 1px solid border-rule
  no background
  
Tab button:
  Default: text-secondary, no bg, padding: 8px 16px
  Hover: text-primary, no bg
  Active:
    text-accent-gold
    border-bottom: 2px solid accent-gold (sits below the border-rule, covering it)
    font-weight: 700
  Transition: color 80ms, border 80ms
```

The active indicator is a bottom-border underline, not a filled background. This is the pattern used in editorial and financial publications — it reads "selected section," not "pressed button."

---

### 6.9 Input Fields

**Current state:** Standard HTML inputs with a blue focus ring (fixed to gold in the April 2026 pass for character creation, but not globally standardised).

**Target state:**

```
text input / textarea:
  bg: bg-tertiary (#242F35)
  border: 1px solid border-rule
  border-radius: 2px
  padding: 8px 12px
  font: body (Inria Serif), text-body (15px), text-primary
  
  Placeholder: text-muted, italic
  
  Focus:
    border-color: accent-gold (full opacity)
    outline: none
    box-shadow: 0 0 0 2px rgba(148,129,97,0.15) (soft focus glow, not a harsh ring)
    transition: border-color 80ms, box-shadow 80ms
  
  Error:
    border-color: status-danger
    box-shadow: 0 0 0 2px rgba(140,47,47,0.15)

Range input (stat sliders in character creation):
  Track: bg-tertiary, 4px height, rect
  Thumb:
    -webkit-appearance: none
    width: 14px, height: 14px
    bg: accent-gold
    border-radius: 2px (square diamond feel — rotate 45deg)
    cursor: pointer
    box-shadow: glow-gold on focus
```

---

### 6.10 Icon Wrapper

**Current state:** No `<Icon />` component exists. ASCII glyphs are used in `Sidebar.tsx`. Emoji are used in `TopBar.tsx`. No centralised icon system.

**Target state:** A typed `<Icon />` component that renders SVG icons inline, styled with `currentColor`, from a central registry. This is already specified in `docs/guides/ICONS_AND_ASSETS.md` but not implemented.

**Proposed `Icon.tsx`:**

```tsx
// The IconId union is generated from the registered SVG set.
// Approved sets: Tabler (MIT) for navigation/UI, Game-icons.net (CC BY 3.0)
// for thematic game elements. See docs/guides/ICONS_AND_ASSETS.md §3.

type IconId =
  | 'dashboard'
  | 'legislation'
  | 'congress'
  | 'population'
  | 'economy'
  | 'quests'
  | 'cards'
  | 'skills'
  | 'character'
  | 'calendar'
  | 'pause'
  | 'play'
  | 'fast-forward'
  | 'settings'
  | 'menu'
  | 'alert'
  | 'chevron-up'
  | 'chevron-down'
  | 'chevron-right'
  | 'check'
  | 'x'
  | 'gavel'        // Game-icons.net
  | 'scroll'       // Game-icons.net
  | 'podium'       // Game-icons.net
  | 'coin-stack';  // Game-icons.net

interface IconProps {
  name: IconId;
  size?: number;
  className?: string;
  'aria-label'?: string;
  'aria-hidden'?: boolean;
}
```

SVG sources are vendored into `src/assets/icons/` as raw `.svg` files. The registry maps each `IconId` to its SVG path string. Vite's `?raw` import or an inline SVG sprite sheet both work; the sprite sheet approach is preferred for production (single HTTP request in web builds, inline in Electron).

---

## 7. Shell Redesign — TopBar, Sidebar, BottomBar

### 7.1 TopBar

**Current state:** A horizontal bar with character name, date (with emoji), PC/AP as plain numbers, and speed buttons on the right.

**Target state — slim information bar, no controls:**

```
Left zone:
  Character name — font-title, text-data (18px), text-primary
  Level + ideology label — text-label, text-muted (12px), separated by ·
  
Centre zone:
  Month / Year in large mono: JANUARY 2025
  Day of week below: TUESDAY (text-label, text-muted)
  
Right zone:
  PC readout: pip row (see BarVariant.resource §6.2) with "PC" label
  AP readout: pip row with "AP" label
  Alert icon: if any crisis events are pending, a gold <Icon name="alert" /> 
              with a pulse-gold animation
```

Speed controls move entirely to the BottomBar. No emoji anywhere. The TopBar is read-only information.

Height: `48px` (reduced from current — it carries less interactive weight now).

---

### 7.2 Sidebar

**Current state:** ASCII glyph icons, no game state data, plain nav list.

**Target state:**

```
Width: 192px (unchanged)
  
Nav section:
  Each nav item:
    Default: <Icon name="..." size=16 /> + label text (text-label, text-secondary)
    Active: left gold bar (border-l-2 border-accent-gold) + text-accent-gold + bg-tertiary
    Hover: bg-tertiary/50, text-primary
    Icon: currentColor — gold when active, secondary when default

  Icons to use (Tabler set):
    dashboard     → tabler: layout-dashboard
    legislation   → tabler: file-text (or game-icons: scroll)
    congress      → tabler: building-government (or game-icons: podium)
    population    → tabler: users
    economy       → tabler: chart-line
    quests        → tabler: list-check
    cards         → tabler: cards (or game-icons: card-hand)
    skills        → tabler: award
    character     → tabler: user-circle

Situation strip (between nav and footer):
  Separator: border-t border-rule, margin: 8px 0
  
  Approval line:
    [bar, 40px wide] [value %] [trend arrow ↑↓→]
    bar uses BarVariant.approval colour logic at 4px height
    
  Active quest (truncated to 1 line):
    <Icon name="quests" size=12 /> Quest: <name, 20 chars max, ellipsis>
    
  Urgency indicator (when something needs attention):
    Gold dot + "Vote ready" or "Event pending" — text-label, text-accent-gold
    
Footer:
  "← Exit to Menu" — ghost button, text-label, text-muted
```

---

### 7.3 BottomBar (new component)

**This component does not exist. It is the highest-priority addition in this proposal.**

```
Height: 72px
bg: bg-secondary
border-top: 1px solid border-rule
Layout: flex, items-center, px-4, gap-6

Left zone (speed controls):
  Pause button: <Icon name="pause" /> — square, 36px × 36px
    Active (paused): bg-accent-gold, text-bg-primary, glow-gold
    Default: bg-tertiary, text-secondary
    
  Speed buttons: 1× 2× 4×
    Each: 32px × 32px, font-mono text-sm
    Active (running at this speed): bg-tertiary, border: 1px solid accent-gold, 
           text-accent-gold
           + the anim-speed-indicator scan-line animation
    Default: bg-tertiary, text-muted, no border
    
  All controls: border-radius 2px, transition: all 80ms

Centre zone (week indicator):
  Week N of 52 — font-mono, text-data-sm, text-secondary
  Below: a thin week-progress bar (BarVariant.progress, 120px wide, 3px tall)
         showing elapsed days within the current week
  Month YYYY — font-title, text-label, text-muted

Right zone (card hand):
  Label: "HAND" — text-label, text-muted, tracking-widest
  Card chips: up to 5 cards rendered as slim vertical chips
  
  Per chip:
    Width: 48px, height: 56px
    bg: bg-tertiary
    border: 1px solid border-rule
    border-radius: 2px
    
    Top half: card type colour indicator (a 4px top bar — gold for rare/legendary,
              blue for common/uncommon)
    Bottom half: cost pip — font-mono, text-xs, text-accent-gold, centered
    
    When affordable (pc >= cost): border-accent-gold, animate-pulse-gold
    When not affordable: border-rule, text-muted
    
    Hover: scale(1.08), border-accent-gold, z-10 (card lifts out of the row)
           Show card name tooltip above
    Click: Navigate to CardsPanel; the clicked card is highlighted
    
  If hand > 5: show 4 chips + "+N more" label
  If hand = 0: "No cards" in text-muted italic
```

---

## 8. Screen-by-Screen Proposals

### 8.1 Main Menu

**Current state:** Centred flex column, gradient backdrop, title + tagline + 4 buttons.

**Changes:**

```
Background:
  Keep #0B1012 base
  Add overlay-vignette radial gradient (darker edges, lighter centre)
  Add a very faint noise texture overlay (CSS background-image: url(noise.svg),
  opacity 0.03 — institutional paper feel)
  
Title block:
  "AN AMERICAN CAREER" — font-mono, tracking-[0.3em], text-xs, text-accent-gold (unchanged)
  "Political Ascent" — font-title, text-screen-title (64px), text-primary
    "Ascent" part: text-accent-gold (unchanged)
    
Tagline:
  "The floor is open. The cameras are rolling. The clock starts now."
  font-body italic text-secondary — unchanged but increase font size to text-body (15px)
  
Button column:
  Gap reduced from gap-3 to gap-2
  All buttons use the redesigned Button spec (§6.1): rounded-sm, uppercase label, gold ledge
  "New Game": primary variant, full redesign
  "Load Game": secondary variant (add this — it's specified in GDD but missing)
  "Achievements": secondary variant
  "Settings": ghost variant
  "Quit": ghost variant, text-muted
  
  Hover animation: on hover, the button's left edge gets a 2px gold line
                   (::before pseudo, scaleY 0 → 1, 120ms)
  
Version footer:
  v0.1.0-alpha.1 text unchanged, text-muted
  Add a horizontal rule above it: border-t border-rule
```

---

### 8.2 Dashboard (Situation Room)

**Current state:** Symmetric `grid-cols-2 gap-4` of 4 generic `<Card>` components.

**Target state:** An asymmetric 3-zone situation room. See §1 of this document for the layout sketch.

```
Layout: grid grid-cols-[1fr_2fr_1fr] gap-4 (roughly 25%/50%/25%)

LEFT COLUMN — Your Status
  Character name + title (Senator, Representative, etc.)
  PC: pip row + "58 / 100" label
  AP: pip row + "7 / 7" label
  Separator rule
  Level + XP bar (BarVariant.stat)
  Ideology label (e.g., "Libertarian Left") with the <IdeologyCompass> at 80px — 
    small but present

CENTRE COLUMN — World State
  Approval header: "PUBLIC APPROVAL" label (text-label, tracking-widest, text-muted)
  Approval value: text-data-lg (32px mono), [colour based on threshold]
  Approval trend: ↑ 3% this month / ↓ 5% this month — text-label, coloured
  Approval sparkline: BarVariant.sparkline, 60px tall, full width
  Separator rule
  Situation items (the "hot list") — max 4 items, ordered by urgency:
    Each item:
      Left: severity dot (gold / warning / danger)
      Text: headline (text-body, text-primary), subtext (text-label, text-muted)
      Right: optional action button (e.g., "View Bill")
  Latest news section below, collapsible, shows last 6 items

RIGHT COLUMN — Next Actions
  Header: "YOUR MOVE" (text-label, tracking-widest, text-muted)
  3–5 recommended actions derived from game state:
    Each action:
      Icon (relevant to type) + label + cost badge
      Click navigates to the relevant panel
      Sorted by: urgency (crisis) → available quest step → affordable card → draftable bill
  If no actions available: "No immediate moves. The week ticks."
```

**Why this works:** The player can sit on the Dashboard and see at once: how they're polling, what's happening in the world, and what they can do about it. That is a situation room. The current layout shows them 4 KPI boxes with no hierarchy.

---

### 8.3 Legislation (Pipeline View)

**Current state:** Tab bar with three tabs (In Flight / Draft New / Archive). Draft New is a flat card grid.

**Target state:**

```
Layout:
  [DRAFT NEW →] button — top-right, primary variant, stays fixed as the CTA
  Not a tab. The pipeline is always visible.
  
PIPELINE SECTION:
  Heading: "ACTIVE LEGISLATION" (text-label, tracking-widest, text-muted)
  If empty: "No bills in progress. Use Draft New to introduce legislation."
  
  Per bill in pipeline:
    Container: Card variant, gold left-bar if in "vote" stage + pulse-gold
    
    Header row: Bill title (text-card-title) + party tags + PC invested badge
    
    Stage track:
      [Introduction] ━━●━━━━━━━━━ [Committee] ━━━━━━━━━━━ [Floor] ━━━━━━━━━━━ [Vote]
      
      Track: 4px line, bg-tertiary full width
      Stages: 4 diamond nodes (clip-path: polygon(50% 0, 100% 50%, 50% 100%, 0 50%))
        Completed: filled accent-gold
        Active: filled accent-gold + pulse-gold animation
        Pending: bg-tertiary, border 1px border-rule
      Labels below each node: text-label, text-muted
      Active node: label in text-accent-gold
      
    Status row: Opposition N · Support N / Oppose N · Cost to advance: N PC
    
    Action buttons (inline, not separate row):
      Stage < vote: [Advance Stage] — primary if affordable, disabled if not
      Stage = vote: [Resolve Vote] — primary, always enabled (vote is free)
      
    Failed/stalled states:
      If bill has been in current stage > 14 days without advancing:
        Status label: "STALLED" in text-muted + warning dot
      If opposition > 60:
        Status label: "HIGH OPPOSITION" + danger dot

DRAFT PANEL (side-over / right-side panel):
  Opens when "DRAFT NEW" is clicked
  Slides in from the right (translateX(100%) → translateX(0), 300ms ease-arrive)
  Width: 380px
  Overlay: backdrop does not dim the pipeline (non-modal — player can still see the pipeline)
  Bill template cards: title + description + tags + opposition score + [Draft] button
  Close: × in top-right corner or Escape key

ARCHIVE SECTION:
  Collapsible accordion below the pipeline
  Heading: "ARCHIVE (N passed · N failed)" + expand chevron
  When expanded: two sub-lists (passed bills in success-tinted cards, failed in danger-tinted)
```

---

### 8.4 Congress

**Current state:** Party filter buttons + two flat seat grids.

**Target state:**

```
Layout: two columns — left: control panel, right: seat detail

LEFT — Control & Analysis (1/3 width)
  MAJORITY CONTROL bar:
    Full-width horizontal bar, no track bg
    Three segments: D [pct%] in accent-blue, R [pct%] in accent-red, I in accent-gold
    Labels: "D 48" / "R 50" / "I 2" overlaid on segments or below
    Dotted vertical line at 50% — "Majority"
    Below bar: "Republicans hold the Senate 50–48" in text-body text-secondary
    
  PERSUADABLE section:
    Heading: "PERSUADABLE" (text-label, tracking-widest, text-muted)
    5 legislators whose support score is within ±15% of the player's reach
    Per item: name (text-body) + party dot + support score bar (40px wide)
    
  COMMITTEE CHAIRS section (post-MVP):
    Placeholder with "Coming in v0.2"

RIGHT — Seat Grid (2/3 width)
  Toggle: [Senate] [House] — tab bar variant (§6.8)
  
  Current SeatGrid component is acceptable for MVP.
  The colour change from the audit pass (muted steel-blue/brick) stays.
  Hover shows name + party + state tooltip.
  
  Upgrade path (post-MVP): replace flat grid with SVG hemicycle arc component.
```

---

### 8.5 Population

**Current state:** List of population group cards with approval/radicalism/activism bars.

**Target state:**

```
Layout: two columns — left: group list, right: group detail

LEFT — Group List
  Search/filter bar at top (text input, text-label, placeholder "Filter groups…")
  Sorted by: most unhappy first (approval ASC)
  
  Per group card (compact — 48px tall):
    [Group name, text-body] [approval bar, 80px, BarVariant.stat] [value %] [trend arrow]
    Left border: colour-coded by happiness:
      > 60%: border-status-success
      40–60%: border-rule (neutral)
      < 40%: border-status-danger
    Click: selects the group and shows detail in right panel

RIGHT — Group Detail
  Heading: group name (text-panel-title)
  Sub-tags: ideology, income, region (text-label chip badges)
  
  Stats in a 2×3 grid (label above, large mono value below):
    Happiness | Radicalism | Activism
    Loyalty   | Pop %      | Trend (7d)
    
  Bars for top 3 stats: BarVariant.stat
  Recent events that affected this group (last 3 relevant events from news log)
  
  If no group selected: "Select a group to see detail."
```

---

### 8.6 Economy

**Current state:** Two-column KPI list + a trends panel with flat-line sparklines.

**Target state:**

```
Layout: header summary + two-column detail

HEADER SUMMARY ROW (full width):
  Four key metrics in a horizontal bar, each taking ~25% width:
    GDP GROWTH: [value] [trend direction] [sparkline, 60px]
    UNEMPLOYMENT: [value] [trend] [sparkline]
    INFLATION: [value] [trend] [sparkline]
    DEBT / GDP: [value] [colour-coded by threshold]
    
  Each metric: text-label for name (uppercase), text-data-lg for value (mono),
               trend arrow coloured by direction/severity
  
DETAIL SECTION:
  Left column (full metrics list):
    Same Row component as current — label / value pairs
    But now includes a mini trend indicator (sparkline, 40px, inline)
    
  Right column (simulation notes):
    "What's driving this" — a small narrative panel populated from the game engine
    3–5 bullet points summarising current economic causes
    (Implemented as a simple string array in worldStore for now)
    
EMPTY SPARKLINE STATE:
  When history is < 2 weeks:
    Show "Collecting data…" with an italic text-muted label
    Do not render a flat-line chart — it gives a false sense of stasis
```

---

### 8.7 Cards (Physical Hand)

**Current state:** Flat product grid with `<UICard>` components and Play/Discard buttons.

**Target state:**

```
Layout: two zones — HAND (top) and DECK BROWSER (bottom, collapsible)

HAND ZONE:
  Heading: "YOUR HAND" (text-label, tracking-widest, text-muted) + "(N cards)"
  
  If empty: "No cards in hand. Cards are drawn at the start of each week."
  
  Per card: vertical portrait format, 140px wide × 200px tall
    Art zone: bg-gradient-to-br from-bg-tertiary to-accent-gold/10
              A corner device in the top-left (a small diamond shape in the card's
              rarity colour — pure CSS clip-path, no image asset needed)
    
    Card name: font-title, text-sm, text-primary, centered, padding 8px
    Type badge: text-label, text-muted, centered
    
    Rarity treatment (border on all 4 sides):
      common:    border-bg-tertiary (default)
      uncommon:  border-accent-blue (teal)
      rare:      border-accent-gold (gold border)
      legendary: border-accent-gold + animate-pulse-gold + corner shimmer
                 (::after pseudo with a radial gradient, animates opacity 0→0.3)
    
    Cost badge: top-right corner, absolute position
                bg-bg-primary, font-mono, text-xs, text-accent-gold
                Format: "5 PC" — no further decoration
    
    Flavour text: if present, shown in a small italic serif block
    
    Action row (appears on hover — cards slide up 4px on hover):
      [PLAY N PC] — primary button, full width
      [DISCARD]   — ghost button, full width
      
      If unaffordable: PLAY button is disabled, cost badge turns text-muted
    
  Layout: horizontal scroll row, gap-3, cards don't wrap
          Use the game-scroll scrollbar styling

DECK BROWSER (collapsible):
  Heading: "FULL DECK (N cards)" + expand chevron
  When expanded: same card format but condensed (80px × 110px),
                 shown as a wrapping grid
  Cards in deck but not in hand: opacity 0.6
```

---

### 8.8 Skills

**Current state:** Flat list of skill cards per stat. No visual tree. No sense of progression.

**Target state:**

```
Layout: sidebar stat list + main skill area

LEFT — Stat Selector:
  List of 5–6 stats (Charisma, Intelligence, etc.)
  Per stat: name + current level number + a compact XP bar
  Active stat: gold left-bar, text-primary
  
MAIN — Skill Tier Display:
  Heading: [Stat Name] Skills
  Subheading: "Level N — N points to spend"
  
  Tiers laid out as horizontal rows:
    TIER 1 (unlock at level 2):  [skill] [skill] [skill]
    TIER 2 (unlock at level 4):  [skill] [skill] [skill]  
    TIER 3 (unlock at level 6):  [skill] [skill]
    
  Locked tiers: visible but desaturated + lock icon overlay
  
  Per skill node (60px × 60px square):
    Default (unlearned, available): bg-tertiary, border-rule, icon centered
    Hover: border-accent-gold, glow-gold
    Unlocked: bg-accent-gold/20, border-accent-gold, icon in gold
    Locked (tier not reached): border-rule, icon in text-muted, lock overlay
    
  Connector lines between nodes in a tier: 1px bg-tertiary line
  
  Skill name + short description shown in a detail panel 
  below the grid when any node is hovered.
  
  [UNLOCK SKILL] button below the detail panel — primary variant, 
                 disabled if no skill points.
```

---

### 8.9 Character Sheet

**Current state:** Already identified in the April 2026 audit as "the best-looking screen in the build." Two-column grid, gold stat progress bars, trait titles + flavour + mechanical text. This is the visual target.

**Incremental improvements only:**

```
Add ideology compass to the character sheet header (currently shown only in Dashboard)
Add a "Career timeline" section at the bottom: a horizontal timeline of 
  major events (bills passed/failed, elections, crises) using the news log.
  Each node: a diamond marker at the date, with a short label below.
  (Pure CSS, no new library)
Portrait placeholder: add a proper portrait frame — a 96px × 96px square with 
  a gold border-2px, bg-tertiary, and a game-icons.net person glyph centered.
  The frame has a worn-paper texture (CSS noise overlay) to give it weight.
```

---

### 8.10 Quests

**Current state:** Quest cards with name, objective list, and Start/Abandon buttons.

**Target state:**

```
Layout: split — active quest detail (top, full width) + quest list (bottom)

ACTIVE QUEST DETAIL:
  Heading: quest title (text-panel-title, font-title)
  Narrative text: quest description in text-body italic, serif — 
                  this should feel like a briefing, not a bullet point
  
  Objective tracker:
    Each objective as a step in a vertical stepper:
      Completed: check icon (gold), text-muted, line-through (subtle)
      Active:    gold diamond, text-primary, bold
      Pending:   dash, text-muted
      
    Progress bar across all objectives: BarVariant.progress
    
  Reward preview: bottom of card — "Reward: N PC · N XP · [description]"
                  in text-label, text-muted
  
QUEST LIST (below):
  Active quests: highlighted with gold left-bar + text-primary
  Available (not started): text-secondary + [START] gold button
  Completed: text-muted, collapsible section
  
  Quest log entry format:
    Icon (quest category) + name + status label (ACTIVE / COMPLETE / AVAILABLE)
```

---

## 9. Implementation Sequencing

All branches off `experimental`. Each row is one PR.

| Priority | Branch | Scope | Game-feel delta |
|---|---|---|---|
| 1 | `exp--game-shell-bottom-bar` | `BottomBar.tsx` (new), `TopBar.tsx` cleanup (remove emoji, slim, add pip display), `Sidebar.tsx` icons + situation strip, `Game.tsx` shell restructure | **Critical** — transforms the fundamental product register |
| 2 | `exp--component-polish-pass` | `Button.tsx` (rounded-sm, pressed state, uppercase, ledge), `Card.tsx` (rounded-sm, left-bar accent, ruled header), `Bar.tsx` (new variants: resource pips, progress track), `styles.css` (custom scrollbars, CSS variables, animation keyframes, IBM Plex Mono font load), `index.html` (IBM Plex Mono preload) | **Critical** — every panel uses these; fixes the baseline feel |
| 3 | `exp--dashboard-situation-room` | `DashboardPanel.tsx` full redesign to 3-column situation room | **High** — the most-seen panel becomes useful |
| 4 | `exp--legislation-pipeline` | `LegislationPanel.tsx` pipeline view, stage track component, slide-over draft drawer | **High** — legislation is a core loop |
| 5 | `exp--tooltip-system` | `Tooltip.tsx` (new), integrate on all icons + pip displays + speed buttons | **Medium** — information density requires tooltips to not overwhelm |
| 6 | `exp--cards-physical-hand` | `CardsPanel.tsx` portrait format, rarity borders, art zone placeholder | **Medium** — cards become objects |
| 7 | `exp--sidebar-icons` | `Icon.tsx` wrapper (new), vendor Tabler SVG set, replace all ASCII glyphs | Depends on priority 2 for `Icon.tsx` foundation |
| 8 | `exp--congress-control-panel` | `CongressPanel.tsx` party control bar + persuadable section | **Medium** — strategic context |
| 9 | `exp--skills-tree-layout` | `SkillsPanel.tsx` tier layout | **Lower** — less-visited panel |
| 10 | `exp--main-menu-atmosphere` | `MainMenu.tsx` noise texture, button hover animation, Load Game button | **Lower** — first impression polish |

Priorities 1 and 2 should be delivered in the same sprint. The shell and the components depend on each other — delivering the bottom bar before the button redesign, or vice versa, produces a half-finished state that is harder to evaluate.

---

*This document supersedes the deferred items list in `docs/research/ui-audit-2026-04.md §5` where those items are covered here. New issues should be filed against the GitHub Project referencing this document for scope definition.*
