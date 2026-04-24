# UI Audit & Theme-Pass — April 2026

**Author:** Political Ascent Director (AI)
**Branch:** `exp--ui-audit-and-theme-pass`
**Reference:** `docs/reference images/UI-UX/UI Theme - 1.png` (Bloodborne fan-made UI restyle by Jennifer Bertaggia)

---

## 1. Scope

This is a walkthrough-driven audit of every top-level screen in the alpha build, captured on `exp--ui-audit-and-theme-pass` at commit `b7306b5`. Each screen was observed via Playwright at `1280×720`, annotated against the reference, and classified as either **on-theme**, **drift**, or **broken**.

A companion implementation pass in the same branch applies the highest-priority fixes (colour + typography). Higher-cost work (icon replacement, seat-map layout, economy sparkline, pacing) is left as scoped follow-up issues.

## 2. North-star theme (from reference)

| Token | Hex | Usage |
|---|---|---|
| `bg-bg-primary` (was `#0F1117`) | `#0B1012` | Root background |
| `bg-bg-secondary` | `#131919` | Cards, panels |
| `bg-bg-tertiary` | `#242F35` | Elevated rows, inputs |
| `accent-blue` (repurposed) | `#1B353F` | Cool teal — informational accents only |
| `accent-gold` (was `#C9A84C`) | `#948161` | Every primary action, every CTA |
| `text-primary` | `#D8D6CC` | Warm off-white body text |
| `text-secondary` | `#989A8F` | Secondary/muted labels |

**Typography.** Inria Serif for titles AND body. IBM Plex Mono reserved for numeric readouts. Loaded from Google Fonts; local fallbacks listed in `tailwind.config.ts`.

**Accent discipline.** Gold is the only primary-action colour. Blue tokens that previously carried action weight (Draft, Play, Start quest, Action Points) are now gold. Blue remains available as a cool informational accent (toast borders, compass tint, sub-text).

## 3. Screen-by-screen findings

Observations below use three severity tiers:

- **BLOCKER** — shipping-quality issue; fixed in this pass.
- **DRIFT** — visible inconsistency with the reference; fixed if trivial, otherwise filed.
- **POLISH** — non-urgent refinement; filed as follow-up.

### 3.1 Main Menu

- *On-theme.* Gold title, restrained layout, serif headline in place.
- DRIFT: Gradient uses `from-accent-blue/10` — now shifts to teal tint (`#1B353F`) which reads subtler. Acceptable post-theme.
- POLISH: No background texture/vignette yet — the ref suggests a faint institutional chamber silhouette.

### 3.2 Character Creation — Identity / Stats / Traits / Ideology

- *On-theme* stepper and card chrome.
- BLOCKER (fixed): stat preview delta `{base} → {final}` rendered in bright blue. **→ gold.**
- BLOCKER (fixed): Name input focus ring bright blue. **→ gold.**
- BLOCKER (fixed pre-audit via dataLoader): Traits screen displayed kebab-case IDs with no descriptions. Root cause was a broken `import.meta.glob` wrapper in `src/engine/dataLoader.ts` that silently returned `{}` from every data folder. Fixed in `b7306b5` — traits now show proper titles, flavour text, and mechanical descriptions.
- BLOCKER (fixed): Ideology step rendered only the raw coordinate pair `x: 0.00 y: 0.00`. **→ humanized label via `describeIdeology()`** (`Centrist`, `Libertarian Left`, `Authoritarian Right`, etc.) with raw coords kept as secondary text.
- POLISH: stat sliders use native `<input type="range">`; the reference implies a more ceremonial control with a gold thumb.

### 3.3 Scenario Select

- *On-theme.* Gold "Choose Your Arena" title, single card, sparse and correct.
- POLISH: Only one scenario exists (`Modern America 2025`); intentional at this stage of the roadmap.

### 3.4 In-game HUD / Dashboard

- *On-theme* side nav (gold active highlight), character line, speed controls.
- BLOCKER (fixed): Resources card rendered `Action Points 6/7` in bright blue. **→ gold.**
- BLOCKER (fixed): Approval average bar used `tone="neutral"` which was blue. **→ gold by default; success/danger tones override when crossing thresholds.**
- DRIFT (fixed): Economy snapshot rendered debt/deficit/trade as `$34000B` / `$1700B` / `$-900B`. **→ `formatBillionsUSD()` compacts to `$34.0T` / `$1.7T` / `-$900B`.**
- DRIFT (fixed): Ideology card showed `x: 0.00 / y: 0.00` only. **→ humanized label + compact coord line.**
- POLISH: Sidebar icons are ASCII glyphs (`◎ § ⌇ ⧉ $ ✎ ♠ ✦ ◉`). Functional, but the reference calls for monochrome geometric line icons. Replacing them with Game-icons.net / Tabler gold silhouettes is scoped to a follow-up issue.
- POLISH: No visible "next best action" affordance on the empty dashboard — low agency signal for a fresh run. Scoped for a pacing pass.

### 3.5 Legislation → Draft New

- *On-theme* bill cards, tag chips, opposition count.
- BLOCKER (fixed): Every bill's `Draft` button rendered `bg-accent-blue`. **→ gold via the unified Button rebrand.**
- POLISH: Bill cards lack any sense of "legislative weight" — a passage-chance forecast, required supporters, or PC cost estimate would all turn this screen from a catalogue into a decision.

### 3.6 Congress (Senate + House)

- DRIFT (fixed): Dots were bright primary blue (D) / bright primary red (R) / gold (I). Now muted steel-blue (`#5A7A8A`) / muted brick (`#A85958`) / gold — still distinguishable, no longer shouting.
- POLISH: Senate/House use the same flat "wrap" grid. The reference aesthetic would benefit from an actual hemicycle arc. Scoped.

### 3.7 Population

- BLOCKER (fixed): Every happiness/radicalism/activism bar used `tone="neutral"` → blue. Professional group's Happiness bar rendered green (success tone on values > 55), producing a dissonant blue-then-green palette within a single card. **→ neutral is now gold; success/warning/danger still apply on threshold crossings, which now reads as intentional tonal signal rather than random colour assignment.**
- POLISH: Loyalty is rendered as a raw integer (`Loyalty: 0`) with no scale indicator. Filed.

### 3.8 Economy

- *On-theme* "Current" list, serif heading.
- DRIFT (fixed by formatter cascade where used): raw `$34000B` readouts will be replaced as callers migrate to `formatBillionsUSD`.
- POLISH: Trends panel shows only a single-month value, so all three sparklines render as flat lines with `min 2.12 · max 2.12`. The panel needs either a longer history seed or a "collecting data…" empty state.

### 3.9 Quests

- BLOCKER (fixed): `Start quest` buttons were blue. **→ gold via Button rebrand.**
- POLISH: Quest cards don't show rewards or difficulty. Filed.

### 3.10 Cards (Hand)

- BLOCKER (fixed): `Play` buttons were blue. **→ gold.**
- POLISH: Rarity (`common` / `uncommon` / `rare` / `legendary`) is a text string. A coloured border or corner foil would carry far more weight per screen-inch. Filed.

### 3.11 Skills

- *On-theme* cards; the `No skill points` disabled buttons correctly fall back to muted tertiary.
- POLISH: No visual tree — skills are a flat list per stat. Reference doesn't demand a tree but one would serve the "career" fantasy well. Filed.

### 3.12 Character (self)

- **Best-looking screen in the build.** Gold stat progress bars, clean two-column grid, trait entry with title + flavour + mechanical text. This is the visual target for every other panel.

## 4. Implemented this PR

- `tailwind.config.ts` — palette remapped to reference; `font-title` / `font-headline` / `font-body` all resolve to Inria Serif.
- `index.html` — Inria Serif preconnect + stylesheet; theme-color meta tag updated.
- `Button.tsx` — `primary` and `gold` variants collapsed onto the same gold treatment. Primary is now the only CTA colour.
- `Bar.tsx` — `neutral` tone is gold.
- `DashboardPanel.tsx` — Action Points → gold; ideology humanized; economy values formatted via `formatBillionsUSD`.
- `CharacterCreation.tsx` — focus ring gold; stat-preview delta gold.
- `SeatGrid.tsx` — party dots + hover label use muted hex tones that match the palette.
- `src/utils/format.ts` — `formatBillionsUSD()` and `describeIdeology()` helpers + tests.
- `src/engine/dataLoader.ts` — `import.meta.glob` fix committed first (`b7306b5`).

## 5. Deferred — to be filed as issues

1. **Icon replacement pass.** Replace sidebar ASCII glyphs + any remaining inline symbols with Tabler or Game-icons.net gold monochrome SVGs via an `<Icon />` wrapper. Scope: `area: ui`, `type: feature`.
2. **Dashboard agency panel.** Add a "next best action" card on the Dashboard listing the 3 most impactful plays available this turn (active quest step, low-opposition bill, high-value card in hand). Scope: `area: ui`, `type: feature`.
3. **Hemicycle Congress layout.** Replace the flat seat grid with an arc. Scope: `area: ui`, `type: feature`.
4. **Economy sparkline empty state.** Handle `min == max` rendering and add a history seed so the trends panel reads from scenario start. Scope: `area: economy`, `type: polish`.
5. **Card rarity foil.** Visual treatment for rare/legendary cards. Scope: `area: cards`, `type: polish`.
6. **Ceremonial sliders.** Gold-thumb range input styling in character creation. Scope: `area: ui`, `type: polish`.
7. **Loyalty scale affordance.** Render loyalty against a −10 / 0 / +10 scale. Scope: `area: population`, `type: polish`.

## 6. Testing evidence

- `npm run typecheck` — pass.
- `npm test -- --run` — 65/65 pass (pre-fix baseline); new formatter tests added in this PR (see `src/utils/format.test.ts`).
- Playwright walkthrough captured in session; screenshot baselines will be regenerated in a follow-up commit on this branch once the theme lands.
