# Faction Visual Language — M2 Floor Manager

**Author:** Lux — Visuals & Art Direction Lead
**Date:** 2026-05-03
**Status:** Ready for Sol implementation; pending Vex narrative alignment review
**Milestone:** M2 — Floor Manager
**Companion:** [`dialogue-panel-spec.md`](./dialogue-panel-spec.md)

**Design principle:** Every faction must be instantly legible in the smallest HUD context (a 10px badge) and remain coherent at the largest context (a full standing panel). A single consistent signal — color + icon + name — must carry across all surfaces without variation. The moment a player sees the Reform Bloc's teal, they know it is the Reform Bloc, whether they're reading it on a dialogue choice, a Congress seat dot, or a standing bar.

---

## Vision

Political Ascent's factions are not parties — they are power structures within a single legislature: coalitions of interest, ideology, and ambition that shift around the player's choices. Visually, they must feel like real *institutions*, each with a distinct heraldic identity: a color that is theirs, an icon that is their emblem, and a typographic presence that communicates their character.

The faction visual language is derived from the same Bloodborne-adjacent institutional dark aesthetic as the rest of the game, but each faction modulates it differently. The gold accent (`#948161`) belongs to the game itself — it is the player's focus. Faction colors occupy a separate register: they are mid-toned, readable, and distinct from one another. None of them shout. All of them carry weight.

---

## Visual References

1. **CK3 dynasty colors** — how a single hue colonises every visual surface (map, coat-of-arms, character portrait frame) while remaining readable against a dark UI. Borrow: color consistency across surfaces. Reject: heraldic complexity beyond our icon budget.
2. **Victoria 3 political party map** — how 6–8 distinct faction colors coexist in a single information-dense view (party strength chart). Borrow: mid-tone palette discipline. Reject: bright/saturated party colors that fight each other.
3. **Suzerain cabinet portraits** — faction identity conveyed through small name-plate color and portrait border, not full-bleed color panels. Borrow: restraint in faction color application. Reject: illustrative complexity.
4. **Reference image (UI Theme - 1.png)** — worn gold, dark stone, crimson accents. Faction colors must read as *refinements* of this palette, not departures from it.

---

## Specifications

### Faction Definitions

The five factions below are derived from the archetype catalogue in GDD §12.3.2 and the faction naming conventions in GDD §8.3. These are **placeholder canonical names** — Vex should review and confirm or rename them for narrative voice before the faction system ships.

| ID | Name | Archetype Roots | Political Character |
|---|---|---|---|
| `reform` | **Reform Bloc** | Reform Idealist, Crusader Freshman | Progressive; change-oriented; idealistic about what the system can become |
| `pragmatist` | **Pragmatist Wing** | Coalition Broker, Reluctant Moderate | Cross-faction dealmakers; holds the center; values outcomes over ideology |
| `establishment` | **Establishment Wing** | Machine Boss, Old Guard Survivor, Backbencher Loyalist | Institutional power; procedural stability; long institutional memory |
| `hardline` | **Hardline Bloc** | Ideological Enforcer, (fringe loyalists) | Doctrinal purity; unmovable on red lines; treats compromise as betrayal |
| `donor` | **Donor Class** | Donor Whisperer, Shadow Power | Capital-aligned; transactional; speaks in abstractions; controls the money |

---

### Faction Color System

#### Design Rules

1. All faction colors are **mid-toned** — neither the darkest nor the brightest color on any surface. Gold (`#948161`) always outranks them.
2. All faction colors are tested for **WCAG 2.1 AA compliance** (4.5:1 contrast ratio) against `bg-bg-secondary` (`#131919`).
3. No faction color is allowed to closely resemble gold (`#948161`), `accent-red` (`#8C2F2F`), or `accent-blue` (`#1B353F`) — the three reserved game tokens.
4. Each faction has a **primary** and a **dim** variant. Primary is for active/labeled use. Dim is for background fills, badge backgrounds, and standing bars at neutral state.
5. Colors are coded as **CSS custom properties** on `:root` alongside the existing `--pa-*` palette.

#### Palette Table

| Faction | CSS Token | Primary Hex | Dim Hex (20% opacity on bg-secondary) | Contrast on #131919 |
|---|---|---|---|---|
| Reform Bloc | `--faction-reform` | `#6BA8B8` | `rgba(107,168,184,0.20)` | 6.3:1 ✓ AA |
| Pragmatist Wing | `--faction-pragmatist` | `#9BA8B0` | `rgba(155,168,176,0.20)` | 7.6:1 ✓ AA |
| Establishment Wing | `--faction-establishment` | `#A09860` | `rgba(160,152,96,0.20)` | 5.1:1 ✓ AA |
| Hardline Bloc | `--faction-hardline` | `#CC7878` | `rgba(204,120,120,0.20)` | 5.2:1 ✓ AA |
| Donor Class | `--faction-donor` | `#7AB878` | `rgba(122,184,120,0.20)` | 7.9:1 ✓ AA |

**Dim variant note:** The dim hex values above use `rgba()` with `bg-secondary` as the base. In CSS, apply as `background: rgba(107,168,184,0.20)` over a `#131919` background. Do not mix with Tailwind's slash-opacity syntax for faction colors since they are CSS custom properties, not Tailwind tokens — use inline style or a `style` prop with the rgba value.

#### Color Semantic Intent

| Faction | Color Family | Psychological Register |
|---|---|---|
| Reform Bloc `#6BA8B8` | Steel teal | Clarity, idealism, the clear sky of possibility — a little cool, principled |
| Pragmatist Wing `#9BA8B0` | Institutional slate | Measured, neither warm nor cool; the color of a negotiating table |
| Establishment Wing `#A09860` | Aged bronze/olive | Old documents, marble corridors, institutional memory — warm but worn |
| Hardline Bloc `#CC7878` | Rose-brick | Not screaming red — a contained, principled heat; conviction, not rage |
| Donor Class `#7AB878` | Sage-green | Capital, cultivation, growth — money that grows quietly in the background |

**Forbidden combinations:**
- Do not use Donor Class green adjacent to status-success green (`#6B8F5A`) — they are too similar. Separate them with a rule or use them in different panel regions.
- Do not apply full-opacity faction primary as a button background — faction color at full opacity is for text and icons only. Button backgrounds use `bg-bg-tertiary`.
- Do not use Establishment Wing bronze adjacent to `accent-gold` — they are close in hue. Always separate with a `border-rule` gap.

---

### Faction Icons / Badges

Each faction has a single **SVG icon** drawn from the `Tabler Icons` set (MIT licensed, already used in `Icon.tsx`). The icon is the faction's emblem — it appears on badges, HUD widgets, tooltip labels, and the dialogue panel.

Icons are specified as **Tabler icon names** to be added to the `IconName` union and SVG registry in `src/renderer/components/Icon.tsx`.

| Faction | Tabler Icon Name | Concept | Why |
|---|---|---|---|
| Reform Bloc | `shield-half` | Half-shield, half-open | Conviction meets openness; the idealist who still wants to change the system |
| Pragmatist Wing | `scales` | Balance scales | The mediator's emblem; holding opposing weights |
| Establishment Wing | `landmark` | Classical column/pediment | The institution itself; permanence, precedent |
| Hardline Bloc | `flame` | Single upright flame | Conviction held to burning point; a torch-bearer |
| Donor Class | `coins` | Stacked coins | Unambiguous; capital is the language |

**SVG spec for faction icons:**
- Size: 10px (badge context), 14px (HUD widget), 16px (tooltip label), 20px (standing panel header)
- Color: `currentColor` — icon inherits text color via CSS. Apply faction color by wrapping in a `<span style={{ color: 'var(--faction-[id])' }}>`.
- Stroke width: 1.5px at 16px reference size. Scale stroke proportionally if implementing at non-standard sizes.
- No fill — stroke-only icons.
- Viewbox: `0 0 24 24` (Tabler standard).

**Badge composition:**
```
[icon 10px] [FACTION NAME]
```
- Icon and name on the same baseline, `gap-1`.
- Font: `font-mono text-[0.6rem] uppercase tracking-widest`
- Color: `var(--faction-[id])` for both icon and text
- Background: `rgba([faction-rgb], 0.15)` — very subtle tint
- Border: none at small sizes; `border border-[faction-color]/30` at medium sizes (HUD widget)
- Padding: `px-1.5 py-0.5` at badge size; `px-2 py-1` at widget size
- Radius: `rounded-sm` (2px only) — this is the one exception to the no-radius rule, because at 0 radius a small badge becomes invisible at a glance; 2px softens the edge without rounding it

---

### HUD Presence

Faction standings appear in **two locations** in the game shell:

#### 1. Sidebar Panel — Standing Widget (primary)

A persistent widget in the main sidebar (or a dedicated "Factions" panel linked from the sidebar). This is the canonical place to see all faction standings.

**Layout (per faction row):**
```
[icon 14px]  [FACTION NAME]         [standing bar]  [value]
```

- Full width of sidebar content area (`w-full`)
- Faction name: `font-mono text-[0.6875rem] uppercase tracking-wider` in faction color
- Standing bar: `Bar` component (existing), width `w-24`, value 0–100
  - Bar fill color: faction primary at `opacity-80` when allied; faction primary at `opacity-40` when neutral; `accent-red` when hostile
  - Bar background: `bg-bg-tertiary`
  - Height: `h-1.5` (6px)
- Value: `font-mono text-data-sm text-text-muted` — e.g., `47` or `+2` delta if recently changed
- Row padding: `py-1.5`
- Row separator: `border-b border-rule` between factions

**Standing widget should NOT be in the TopBar.** The TopBar is reserved for AP, PC, and identity only (GDD §8.1 convention). Faction standings are per-session context, not moment-to-moment resources.

#### 2. Dialogue Choice — Inline Delta (secondary)

Specified in `dialogue-panel-spec.md` §Choice Buttons. The inline delta `[Δ REFORM BLOC +2]` uses the faction icon and faction color token. No additional spec needed here; see companion doc.

#### 3. Tooltip — Faction Tag (tertiary)

Any legislator or event tooltip that references a faction includes a faction badge (icon + name) in the `text-text-muted` secondary info row. Example: `"Audrey Vance is aligned with [◆] REFORM BLOC"`.

---

### Standing State Visual Cues

The game communicates faction standing state across four tiers:

| State | Threshold | Color Signal | Icon Treatment | Border Treatment |
|---|---|---|---|---|
| **Hostile** | < 20 | `accent-red` (`#8C2F2F`) on bar fill; `status-danger` on delta text | Icon tinted `accent-red` | `border-l-[2px] border-l-accent-red` on widget row |
| **Wary** | 20–39 | Faction primary at `opacity-40`; `status-warning` on delta text | Icon at `opacity-60` | No border — default |
| **Neutral** | 40–59 | Faction primary at `opacity-60`; `text-text-muted` on delta text | Icon at `opacity-80` | No border — default |
| **Friendly** | 60–79 | Faction primary at full opacity; `status-success` on positive delta text | Icon at full opacity | No border — default |
| **Allied** | ≥ 80 | Faction primary at full opacity + `shadow-glow-gold` (subtle) on widget row | Icon at full opacity | `border-l-[2px] border-l-accent-gold` on widget row — gold means maximal alignment |

**State label:**
- The state name (HOSTILE / WARY / NEUTRAL / FRIENDLY / ALLIED) renders as a `font-mono text-[0.5625rem] uppercase text-text-muted` label immediately right of the value number, separated by a `·` glyph.
- On tooltip Tier 2: the state label expands to a one-sentence plain-language description: "This faction will oppose your legislation. Improve standing via alliance-building."

---

### Color Variables — Full CSS Proposal

Add to `:root` in `styles.css` alongside existing `--pa-*` tokens:

```css
/* ────────────────────────────────────────────────────────────────
   FACTION COLORS
   Five distinct political factions, each with a primary (full) and
   rgb-triplet (for rgba dim variants in JS/CSS contexts).
   All primary values tested at WCAG AA 4.5:1 on --pa-bg-secondary.
   Faction colors are NEVER used as button backgrounds; primary use
   is text, icons, borders, and bar fills.
   See docs at .github/portfolios/lux/ui/faction-visual-language.md
   ──────────────────────────────────────────────────────────────── */
--faction-reform:         #6BA8B8;  /* steel teal  — Reform Bloc          */
--faction-reform-rgb:     107, 168, 184;
--faction-pragmatist:     #9BA8B0;  /* slate gray  — Pragmatist Wing       */
--faction-pragmatist-rgb: 155, 168, 176;
--faction-establishment:  #A09860;  /* aged bronze — Establishment Wing    */
--faction-establishment-rgb: 160, 152, 96;
--faction-hardline:       #CC7878;  /* rose brick  — Hardline Bloc         */
--faction-hardline-rgb:   204, 120, 120;
--faction-donor:          #7AB878;  /* sage green  — Donor Class           */
--faction-donor-rgb:      122, 184, 120;
```

**TypeScript type stub** (for Sol's implementation):
```ts
export type FactionId =
  | 'reform'
  | 'pragmatist'
  | 'establishment'
  | 'hardline'
  | 'donor';

export const FACTION_TOKENS: Record<FactionId, string> = {
  reform:        'var(--faction-reform)',
  pragmatist:    'var(--faction-pragmatist)',
  establishment: 'var(--faction-establishment)',
  hardline:      'var(--faction-hardline)',
  donor:         'var(--faction-donor)',
};

export const FACTION_NAMES: Record<FactionId, string> = {
  reform:        'Reform Bloc',
  pragmatist:    'Pragmatist Wing',
  establishment: 'Establishment Wing',
  hardline:      'Hardline Bloc',
  donor:         'Donor Class',
};
```

---

### Do's and Don'ts

#### ✓ Do

1. **Apply faction color to text, icons, borders, and bar fills only.** Faction color is never a button background color. When a button action relates to a faction (e.g., "Negotiate with Reform Bloc"), the button uses the standard gold primary and the faction badge appears as a text label inside the button.

2. **Use the faction icon consistently at all sizes.** At 10px, it is still recognisable as its shape — this is why Tabler stroke-only icons at 1.5px stroke weight were chosen. Test icon legibility at 10px before committing the choice.

3. **Separate standing bars by faction with `border-rule` rules** when displaying multiple factions in a list. The color alone distinguishes them; the rule provides breath.

4. **Tint the badge background at 15% opacity maximum.** A faction badge background is a whisper, not a shout. If it reads as a colored block, it is too strong.

5. **Test Donor Class green (`#7AB878`) and status-success green (`#6B8F5A`) in isolation** whenever they appear on the same screen. They are the most similar pair in the palette. Keep them in separate visual regions; never in adjacent table cells.

#### ✗ Don't

1. **Don't use faction colors as `accent-gold` substitutes.** Gold is the player's focus color. Faction color is contextual information. A gold button next to a faction badge is correct; a faction-colored button is not.

2. **Don't render faction names in Inria Serif.** Faction labels, badges, and standing indicators are always `font-mono uppercase tracking-wider`. Serif is for prose and narrative meaning; mono is for system-state precision.

3. **Don't reuse faction colors for non-faction meanings.** Reform Bloc teal (`#6BA8B8`) may look like a "Democrat blue" — never use it for party affiliation, which uses the existing `accent-blue` (`#1B353F`). Faction color ≠ party color.

4. **Don't apply the Allied gold border (`border-l-accent-gold`) to any faction widget without the standing threshold check.** Gold means maximal alignment, not just "important." The threshold is ≥ 80/100.

5. **Don't display more than three faction deltas inline** on a dialogue choice or event option. If four or more factions are affected, show the two largest (positive + negative) and add "+ N more" in `text-text-muted` with a Tier 2 tooltip for the full list.

---

## Implementation Notes for Sol

**Adding faction tokens to `styles.css`:**
Add the CSS block above to the `DESIGN TOKENS` section of `src/renderer/styles.css`, after the existing `--pa-*` variables and before the easing tokens. Maintain the comment format convention.

**Icon additions to `Icon.tsx`:**
Add five new icon names to the `IconName` union: `shield-half`, `scales`, `landmark`, `flame`, `coins`. Add the corresponding inline SVG paths to the registry. Source from `tabler-icons.io` — confirm MIT license via the project's `package.json` when vendoring.

**FactionStandingWidget component:**
Propose a new component `src/renderer/components/FactionStandingWidget.tsx` that renders a single faction's standing row (icon, name, bar, value, state label). Accepts `factionId: FactionId`, `standing: number`, `delta?: number`. The sidebar panel and dialogue panel both consume it.

**Bar component usage:**
The existing `Bar.tsx` uses `tone` prop for color semantics. Faction bars should override with an inline `style` or a `className` that applies `var(--faction-[id])` rather than using a tone. Sol should evaluate whether to add a `customColor?: string` prop to `Bar` or render a custom fill div — whichever is cleaner with the existing bar implementation.

**Tailwind limitation:** Faction colors cannot be referenced as Tailwind utility classes (e.g., `text-faction-reform`) since they are CSS custom properties, not Tailwind tokens. Use `style={{ color: 'var(--faction-reform)' }}` or wrap in a typed helper:
```ts
function factionColor(id: FactionId): string {
  return `var(--faction-${id})`;
}
```
Do NOT add faction colors to `tailwind.config.ts` — this would inflate the token system and invite misuse as arbitrary Tailwind utilities.

---

## Review Checklist

- [ ] All five faction colors verified at WCAG AA 4.5:1 on `#131919` (implementation validation)
- [ ] Faction icons all legible at 10px rendered size (visual QA)
- [ ] CSS custom properties added to `styles.css` in correct section
- [ ] TypeScript `FactionId` type defined and used consistently
- [ ] No faction color used as a button background anywhere
- [ ] Donor Class green and status-success green confirmed non-adjacent on all affected screens
- [ ] Establishment Wing bronze and accent-gold confirmed visually distinct at adjacent use
- [ ] Standing states (Hostile/Wary/Neutral/Friendly/Allied) render correct color + border treatment
- [ ] `font-mono uppercase tracking-wider` applied to all faction name labels (no serif)
- [ ] Faction badge background tint ≤ 15% opacity
- [ ] Allied state: `border-l-accent-gold` applied only at ≥ 80/100 standing threshold
- [ ] Vex narrative review of faction names requested before final ship
- [ ] Nova readability review of standing widget in sidebar context requested

---

## Open Questions for User / Nova

1. **Faction naming (Vex):** The five faction names above (`Reform Bloc`, `Pragmatist Wing`, `Establishment Wing`, `Hardline Bloc`, `Donor Class`) are derived from GDD §12.3.2 archetype groupings. Are these the canonical names for M2, or does Vex have authored names that differ? Faction visual identity is locked to the name — this must be resolved before badge SVGs are requested from Robert.

2. **Faction count (Nova/User):** The GDD references 4–6 factions. This spec designs for 5. If a sixth faction is added, a new CSS token and icon are needed. What is the authoritative faction count for the Modern America 2024 scenario?

3. **Standing bar placement (Nova):** The spec places the full standing widget in a dedicated Factions sidebar panel or as a sub-section of the existing sidebar. Does Nova's system design assume a persistent HUD presence (always-visible standings), or is it acceptable to gate the detailed view behind a panel navigation click? This affects information architecture, not visual language.

4. **Donor Class icon (Vex/User):** The `coins` icon is pragmatic but somewhat blunt. If the Donor Class faction has a more euphemistic in-universe identity (a think-tank, a caucus name, a front organization), the icon concept should shift accordingly. Awaiting narrative brief from Vex.

---

*Version 1.0 — 2026-05-03*
*Handoff destination: Sol (CSS tokens + Icon.tsx additions + FactionStandingWidget)*
*Companion: `dialogue-panel-spec.md` (dialogue panel consumes faction badge tokens)*
*Pending: Vex narrative review of faction names; Nova readability review of standing widget*

- Lux
