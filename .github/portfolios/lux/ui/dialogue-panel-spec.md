# DialoguePanel UI Spec — M2 Floor Manager

**Author:** Lux — Visuals & Art Direction Lead
**Date:** 2026-05-03
**Status:** Ready for Sol implementation
**Milestone:** M2 — Floor Manager
**Companion:** [`faction-visual-language.md`](./faction-visual-language.md)

**Visual north-star:** Dark institutional gravity. A dialogue in Political Ascent is not a pop-up — it is a *meeting*. The panel must communicate weight: a named figure across a table, a record of what was said, choices that carry real cost.

**Reference:**
- `docs/UI_GAME_FEEL_PROPOSAL.md` §6, §7 — component language
- `docs/reference images/UI-UX/UI Theme - 1.png` — Bloodborne restyle reference
- `docs/research/ui-ux-patterns.md` §3 — event modal rules
- `src/renderer/components/ModalShell.tsx` — existing modal overlay pattern
- `src/renderer/components/Card.tsx`, `Button.tsx` — component canon

---

## Vision

The dialogue panel presents itself as a *dossier opened on the desk* — a formal encounter rendered with institutional restraint. Gold touches mark action. Muted separators hold structure. No rounded corners, no drop-shadows. The speaker's portrait is framed like a file photograph: precise, a little severe. The player reads, weighs, and acts.

---

## Visual References

1. **Suzerain** — meeting-room dialogue with speaker portrait and stacked option cards. Borrow: panel anchoring, speaker nameplate. Reject: rounded card corners, light background.
2. **CK3 councillor modal** — gold-framed portrait, dynasty color badge below name. Borrow: portrait frame treatment, compact faction indicator. Reject: centred layout (PA's reading direction is left-to-right).
3. **Disco Elysium skill-check panel** — locked options rendered greyed with a requirement callout. Borrow: locked-choice visual grammar. Reject: illustrated chaos aesthetic.
4. **Reference image (UI Theme - 1.png, Jennifer Bertaggia)** — worn gold border on a dark stone field, serif titling. This entire panel must feel like it came from the same design hand.

---

## Specifications

### Layout

**Position:** Centered modal overlay. Backdrop: `bg-black/65` (matches `ModalShell`). The underlying game remains visible but desaturated by the overlay — the player is *in* the conversation, not in the game world.

**Panel dimensions:**
- Minimum width: `680px`
- Maximum width: `max-w-4xl` (896px) — wider than standard lg modal to seat the two-column layout
- Maximum height: `calc(100dvh - 3rem)`
- Internal layout: CSS Grid, two columns — `speaker-column / content-column`

```
┌──────────────────────────────────────────────────────────────────────────┐
│  SPEAKER COLUMN (w-52 / 208px)    │  CONTENT COLUMN (flex-1)            │
│  ────────────────────────────────────────────────────────────────────── │
│  [Portrait]                       │  Node text (scrollable)             │
│  [Nameplate]                      │                                      │
│  [Faction Badge]                  │  ──── border-rule separator ─────── │
│  [Role label]                     │  [Choice 1]  ▸ faction Δ           │
│                                   │  [Choice 2]  ▸ faction Δ           │
│                                   │  [Choice 3 — LOCKED]               │
│                                   │  [Continue / Exit]                  │
└──────────────────────────────────────────────────────────────────────────┘
```

**Z-layer:** `z-50` — matches ModalShell. Dialogue must sit above all game panels, below only system-level notifications (toast root at `z-[60]`).

**Panel background:** `bg-bg-secondary` (`#131919`). No outer radius — `rounded-none`. Left border: `border-l-[3px] border-l-accent-gold` — the same 3px bar accent used on `Card` with `accent="gold"`. The bar signals that this surface is an authored game moment, not a system modal.

**Border:** `border border-rule-strong` on all sides. No drop-shadow.

---

### Speaker Column (`w-52 shrink-0`)

Background: `bg-bg-primary` — one step darker than the panel, reinforcing the "file photo" framing against the panel surface.

Padding: `p-4` all sides.

**Portrait area:**
- Use `AvatarMedallion` component at size `lg` (existing component: `src/renderer/components/AvatarMedallion.tsx`).
- Frame: 2px `border-rule-strong` border — no radius (`rounded-none`).
- Portrait area: `aspect-square w-full max-w-[160px]` centred in column.
- On avatars not yet available: a `bg-bg-tertiary` placeholder rectangle with the character's initials in `font-mono text-data text-text-muted` centred.

**Faction badge:**
- Positioned below portrait, `mt-2`.
- Pill-shaped (exception to no-radius rule: `rounded-sm px-2 py-0.5`) — deliberately small; it is a tag, not a headline.
- Background: faction's `--faction-[id]` CSS custom property at 20% opacity (`/20`).
- Text: faction name, `font-mono text-[0.6rem] uppercase tracking-widest`, colour: faction's full token value.
- Icon: 10px SVG faction icon (see `faction-visual-language.md`) inline-left of text.
- Example: `[◆] REFORM BLOC`

**Nameplate:**
- `mt-3 border-t border-rule pt-3`
- Character name: `font-headline text-card-title text-text-primary` — full proper name, Title Case.
- Role/title line: `font-mono text-[0.6875rem] uppercase tracking-wider text-text-muted mt-0.5` — e.g. `SENATE MAJORITY WHIP · D`

**Relationship indicator** *(compact, not prominent)*:
- Below role, `mt-2`.
- A 5-segment pip row using `ResourcePips`-style squares (4px × 4px, 3px gap).
- 0 filled pips = hostile (pips rendered in `accent-red/40`); 2–3 = neutral (`text-muted/40`); 4–5 = allied (`accent-gold/60`).
- Label: `font-mono text-[0.5625rem] uppercase text-text-muted` — `RELATIONSHIP`
- Tooltip on hover (Tier 1): exact relationship score + last interaction note.

---

### Content Column (`flex-1 flex flex-col`)

**Node text area:**
- Padding: `px-6 pt-6 pb-4`
- Font: `font-body text-body text-text-primary leading-[1.6]` — Inria Serif 15px
- Line-height: `1.6` (slightly taller than the body default of 1.55 — dialogue is meant to be read slowly)
- Overflow: `overflow-y-auto game-scroll` — the `game-scroll` utility applies the 6px gold-thumb scrollbar. Long node text scrolls; choices remain pinned below.
- Max height for text area: `max-h-[260px]` — above this the text scrolls. Encourages writers to keep nodes concise.
- The node text container must have `aria-live="polite"` for screen readers.

**Text reveal animation (typewriter):**
- Characters reveal at 22ms per character via a CSS clip-path or JS interval on mount.
- After full reveal (or at any point if player presses any key/button), text snaps to full display instantly — "skip typewriter" is always available.
- Reduced-motion fallback: `@media (prefers-reduced-motion: reduce)` — text appears instantly on mount; no reveal animation.
- Implementation note for Sol: use a `useTypewriter(text, 22)` hook that returns `displayText: string` and `isComplete: boolean`. When `isComplete` is false, all choice buttons should be disabled except a "Skip" affordance (ghost button, top-right of content area). When `isComplete` is true, enable choices.

---

### Choice Buttons

**Container:** `border-t border-rule mt-4 px-6 pt-4 pb-6 flex flex-col gap-2`

Each choice is a full-width button-like row, NOT using the `Button` component directly — they require richer content. Use a custom `<DialogueChoice>` sub-component:

```
[ ◆ choice text                               [Δ REFORM BLOC +2] ]
```

**Normal state:**
- Background: `bg-bg-tertiary/60`
- Border: `border border-rule`
- Padding: `px-4 py-3`
- Text: `font-body text-body text-text-primary` (NOT uppercase — this is prose, not a label)
- Hover: `bg-bg-tertiary border-rule-strong` + `shadow-glow-gold` (subtle gold glow)
- Focus-visible: 2px `outline-accent-gold` offset-2 — gold focus ring convention
- Active: `translate-y-px` (1px press affordance, same as Button)
- Cursor: `cursor-pointer`
- No radius (`rounded-none`) — sharp corners always

**Focus state:** All choices keyboard-navigable. On open, first non-locked choice receives focus. Arrow Up/Down cycle between choices. Enter/Space selects.

**Locked choice (faction standing gate):**
- Background: `bg-bg-primary` (darker, recessed)
- Border: `border border-rule` (no change — kept quiet)
- Text: `text-text-muted` (greyed)
- Prepend a lock icon (`<Icon name="lock" size={12} />`) before the choice text in `text-text-muted`
- Append lock reason: `font-mono text-[0.625rem] text-text-muted uppercase` — e.g., `REQUIRES REFORM BLOC: ALLIED`
- Cursor: `cursor-not-allowed`
- **Not focusable** (`tabIndex={-1}`) — keyboard nav skips locked choices
- Tooltip on hover (Tier 1): "Your standing with [Faction] is [state]. [Faction] allies only."

**Disabled choice (requirement not met — non-faction):**
- Same as locked but lock icon replaced by an alert icon (`<Icon name="alert-circle" size={12} />`).
- Examples: ideology gate, stat gate.

**Faction standing delta indicator** *(inline, right-aligned in choice row)*:
```
[Δ REFORM BLOC +2]
```
- Visible only if the choice has at least one faction standing delta.
- Container: `ml-auto shrink-0 flex items-center gap-1 pl-4`
- Icon: faction's SVG icon at 10px, coloured with faction token
- Delta value: `font-mono text-[0.625rem] text-text-muted` — e.g., `+2` in `status-success` colour when positive; `-2` in `status-danger` when negative; neutral deltas suppressed unless ≥ ±1.
- If multiple factions are affected, show only the largest delta inline; others appear in a Tier 2 tooltip.
- Tooltip Tier 1 (hover): full list of all faction deltas for this choice.

**Continue / Exit row:**
- Appears only on non-choice leaf nodes (narration-only) or as a "Close" option on `isEnding: true` nodes.
- Single gold `Button` variant `"primary"` — `CONTINUE` or `END CONVERSATION`
- Right-aligned: `flex justify-end mt-2`

---

### Entry & Exit Transitions

**Entry:**
- The backdrop fades in: `opacity-0 → opacity-1` over `var(--pa-dur-normal)` (250ms) `ease-arrive`
- The panel slides in from below: `translateY(24px) opacity-0 → translateY(0) opacity-1` over `var(--pa-dur-slow)` (400ms) `ease-arrive`, delayed 80ms after backdrop starts
- Use `animate-panel-enter` class variant or a custom `animate-dialogue-enter` keyframe extending the existing `pa-panel-enter` with Y offset increased to 24px.

**Exit:**
- Panel translates down 12px and fades out: `translateY(0) opacity-1 → translateY(12px) opacity-0` over `var(--pa-dur-normal)` (250ms) `ease-depart`
- Backdrop fades out behind it over same duration.

**Reduced-motion:** Both transitions snap to instant opacity change with zero transform. Driven by the global `@media (prefers-reduced-motion: reduce)` block in `styles.css` — no per-component wiring needed.

---

### Color Palette

All colors reference existing tokens from `tailwind.config.ts` and `styles.css`. No new tokens are required for the dialogue panel itself; faction standing delta indicators and faction badges use the new faction tokens proposed in `faction-visual-language.md`.

| Surface | Token | Hex |
|---|---|---|
| Panel background | `bg-bg-secondary` | `#131919` |
| Speaker column background | `bg-bg-primary` | `#0B1012` |
| Choice row (normal) | `bg-bg-tertiary/60` | `#242F35` at 60% |
| Choice row (locked) | `bg-bg-primary` | `#0B1012` |
| Panel left accent bar | `border-l-accent-gold` | `#948161` |
| Panel border | `border-rule-strong` | `rgba(148,129,97,0.40)` |
| Section separators | `border-rule` | `rgba(148,129,97,0.15)` |
| Node text | `text-text-primary` | `#D8D6CC` |
| Labels (mono) | `text-text-muted` | `#5F6158` |
| Choice text | `text-text-primary` | `#D8D6CC` |
| Locked choice text | `text-text-muted` | `#5F6158` |
| Gold focus ring | `outline-accent-gold` | `#948161` |
| Positive delta | `status-success` | `#6B8F5A` |
| Negative delta | `status-danger` | `#8C2F2F` |
| Backdrop | `bg-black/65` | `rgba(0,0,0,0.65)` |

---

### Accessibility

**ARIA roles:**
```
<div role="dialog" aria-modal="true" aria-labelledby="dialogue-speaker-name" aria-describedby="dialogue-node-text">
```
- `aria-labelledby` points to the speaker nameplate `<h2>`.
- `aria-describedby` points to the node text container `<div id="dialogue-node-text">`.
- The panel registers in the accessibility tree as a dialog. Focus is trapped within it (use `useFocusTrap()` hook — write new, or extract from ModalShell pattern).

**Keyboard navigation:**
- On open: focus moves to first non-locked choice (or "Continue" if narration-only node).
- `Tab` / `Shift+Tab`: cycles through interactive elements (choices → close button → back to first choice).
- `Arrow Down` / `Arrow Up`: cycles between choice rows specifically (more natural than tab for list navigation).
- `Enter` / `Space`: selects focused choice.
- `Escape`: closes panel if `isEnding: true` or a `close` option is available; otherwise, no-ops (prevents accidental dismissal mid-conversation).

**Screen reader considerations:**
- When node text finishes typewriter reveal, `aria-live="polite"` on the text container announces the full text.
- Choice lock status is communicated via `aria-disabled="true"` and a hidden `<span className="sr-only">` containing the lock reason.
- Faction standing delta is wrapped in `<span className="sr-only">` with prose description: "affects Reform Bloc standing by positive 2".

**Contrast verification (all on `#131919`):**
- `#D8D6CC` text: ~10.5:1 ✓ AAA
- `#989A8F` secondary: ~6.0:1 ✓ AA
- `#5F6158` muted: ~3.0:1 — used only for supplementary labels and locked states, not body text (informational exception per WCAG). Do not use for primary text.
- `#948161` gold: ~4.8:1 ✓ AA
- Faction colors: verified in `faction-visual-language.md`

---

### Responsive — Desktop First

**Primary viewport:** 1280×720. Panel at max-w-4xl is 896px, which leaves 384px of dimmed game context visible on either side. Correct.

**Compact desktop (1024-wide):** Panel collapses to `max-w-2xl` (672px). Speaker column narrows to `w-44` (176px). Portrait scales proportionally.

**Mobile (Capacitor Android port, ≥ 375px):**
- Two-column layout collapses to single column: speaker area becomes a horizontal strip (portrait `w-14 h-14` inline-left, nameplate inline-right).
- Choice buttons gain `min-h-[48px]` for touch target compliance.
- Padding increases to `px-4` on choice rows.
- Panel height: `h-[85dvh]` pinned to bottom (sheet-style instead of centered).

---

## Technical Notes for Sol

**Component breakdown:**
```
<DialoguePanel>
  ├── <SpeakerColumn> — portrait, faction badge, nameplate, relationship pips
  ├── <NodeTextArea> — scrollable node text with typewriter hook
  └── <ChoiceList>
        ├── <DialogueChoice> × n (normal / locked / disabled variants)
        └── <DialogueContinueButton> (narration-only / ending nodes)
```

**Props shape (suggestive, Sol owns the final API):**
```ts
interface DialoguePanelProps {
  nodeText: string;
  speaker: {
    name: string;
    avatarId: string;
    role: string;
    factionId: FactionId;
    relationship: number; // -100..100
  };
  choices: DialogueChoiceData[];
  onChoose: (choiceIndex: number) => void;
  onClose?: () => void;
}

interface DialogueChoiceData {
  text: string;
  locked: boolean;
  lockReason?: string;        // "REQUIRES REFORM BLOC: ALLIED"
  factionDeltas?: { factionId: FactionId; delta: number }[];
  isEnding?: boolean;
}
```

**Tailwind classes of note:**
- `rounded-none` — no radius on panel, choices, or portrait frame
- `border-l-[3px] border-l-accent-gold` — panel left accent bar
- `border border-rule-strong` — panel outer border
- `border border-rule` — choice rows, section separators
- `game-scroll` — scrollable node text area
- `font-body text-body text-text-primary leading-[1.6]` — node text
- `font-mono text-[0.6875rem] uppercase tracking-wider text-text-muted` — labels
- `shadow-glow-gold` — choice hover glow
- `active:translate-y-px` — choice press affordance
- `focus-visible:outline-2 focus-visible:outline-accent-gold focus-visible:outline-offset-2` — focus ring

**Existing components to reuse:**
- `AvatarMedallion` — speaker portrait
- `ResourcePips` — relationship pip row (adapt: change fill color semantics for relationship state)
- `Icon` — faction icon (add new icon names: `shield-half`, `scales`, `landmark`, `flame`, `coins` — see `faction-visual-language.md`)
- The `useFocusTrap` / `useScrollLock` utilities already exist in ModalShell; extract to shared hook file.

**Do not use `ModalShell` as the container.** The dialogue panel requires the two-column speaker layout which cannot be composed inside ModalShell's single-column header/body/footer structure. Build `DialoguePanel` independently, using `ModalShell`'s overlay (backdrop + `fixed inset-0 z-50`) as a pattern reference only.

**State machine note:** The dialogue system engine (`DialogueSystem.ts`) is pure — `getNode`, `visibleOptions`, `choose`. The panel component should hold a local state `currentNodeId` and call `DialogueSystem.getNode(nodeId)` and `DialogueSystem.visibleOptions(nodeId, worldState)` on each render. On choice selection, call `choose(nodeId, choiceIndex)` which returns `{ nextNodeId, effects }`.

---

## Review Checklist

- [ ] Speaker column renders correctly at 680px minimum width
- [ ] Typewriter animation plays at ~22ms/char and can be skipped instantly
- [ ] Choice buttons disable during typewriter reveal
- [ ] Locked choices show lock icon + reason, are not keyboard-focusable
- [ ] Faction standing delta renders inline on affected choices
- [ ] Gold focus ring visible on keyboard navigation through choices
- [ ] `Escape` key does not close mid-conversation (only on `isEnding` nodes)
- [ ] `game-scroll` scrollbar on node text area
- [ ] Entry animation: panel slides from below + backdrop fade
- [ ] Reduced-motion: no animation, instant display
- [ ] ARIA dialog role + `aria-labelledby` / `aria-describedby` present
- [ ] `aria-disabled` on locked choices with sr-only lock reason text
- [ ] Two-column layout at 1280px; single-column strip at ≤ 768px
- [ ] No emoji characters; no raw hex inline styles
- [ ] `rounded-none` on all surfaces (panel, choices, portrait frame)

---

*Version 1.0 — 2026-05-03*
*Handoff destination: Sol (renderer implementation)*
*Companion: `faction-visual-language.md` (required for faction badge tokens)*

- Lux
