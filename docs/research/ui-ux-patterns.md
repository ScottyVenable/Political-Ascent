# Research: UI/UX Patterns for Dense Simulation Games

**Focus:** How to present high-complexity state without overwhelming the player. Drawn from Vic3, CK3, Anno 1800, Stellaris, Frostpunk, and Football Manager.

---

## 1. Information density rules

1. **One primary metric per panel region.** Every sub-region on screen should have one clearly dominant number. Supporting data is one size step smaller.
2. **Trends beat absolutes.** A sparkline next to a number is worth 3 additional numbers.
3. **Colour means one thing per panel.** Do not re-use red for *bad* in one widget and *conservative party* in the next. Pick a palette role per panel.
4. **Whitespace is a feature.** Anno and FM both use generous padding in stat blocks; Vic3's density without padding is frequently critiqued.

## 2. Tooltip tiering

- **Tier 1 (hover 0ms):** Label + one-sentence meaning.
- **Tier 2 (hover 400ms or click):** Breakdown of contributing modifiers.
- **Tier 3 (explicit drill-in button):** Full source list with links into relevant panels.

Implement as a `<Tooltip level={1|2|3}>` component. Avoid showing everything at tier 1.

## 3. Event modals

- Always show **who is speaking** (named staffer or faction representative). Anonymous narrators reduce tone.
- Always show **what resources will be spent** on each option, up front.
- Always show **what we know about the outcome chance** (e.g., "~60%"), not just binary pass/fail.
- Offer a **"not now" option** on non-crisis events; forcing a choice on every trivial event causes fatigue.

## 4. Map / chamber modes

- Provide 4–6 **view modes** that recolour the same visualisation. Users learn one mode at a time.
- Include a **legend** anchored to the view (not a tooltip) — legends must be persistently visible.
- Default mode must be the one a new player can interpret in <5 seconds.

## 5. Onboarding

- Prefer **contextual tips** (first time you open the Legislation panel, show a one-card overlay) over a front-loaded tutorial.
- Allow dismiss-forever on every tip.
- Provide a **concept glossary** screen linked from every unknown term.

## 6. Notifications

- Three severities: *Info*, *Warning*, *Critical*.
- Critical notifications soft-pause the game and require dismissal.
- Info/warning stack in a side drawer and persist until dismissed or resolved.
- Every notification deep-links to the panel that can act on it (Anno 1800 rule).

## 7. Accessibility defaults

- Font scaling slider; aim for clean layout at 125% and 150%.
- Colour-blind-safe palette for data viz (Okabe-Ito or similar).
- Keyboard shortcuts for every time control and every primary panel.
- Reduced-motion toggle that disables vote animations and chart animations.

## 8. Performance budgets for UI

- Dashboard renders in <16 ms on a 10-year-in save.
- Congress chamber (535 seats) renders in <16 ms on zoom in/out.
- No panel transitions longer than 200 ms.
- All Zustand selectors use equality checks; no full-state subscriptions in leaf components.

---

## 9. Direct acceptance criteria to lift into Milestone 18 (Polish)

- [ ] Every numeric UI value is wrapped in a tooltip that shows source modifiers.
- [ ] Dashboard alerts all deep-link to the relevant panel and pre-select the relevant entity.
- [ ] Congress chamber ships with at least 5 view modes, with a persistent legend.
- [ ] Notification system supports Info / Warning / Critical with correct pause behaviour.
- [ ] Font scaling 100 / 125 / 150% all lay out correctly on 1280×720 through 2560×1440.
- [ ] Colour-blind-safe palette toggle available in Settings → Accessibility.
- [ ] Concept glossary screen accessible from any tooltip with a "Learn more" link.
