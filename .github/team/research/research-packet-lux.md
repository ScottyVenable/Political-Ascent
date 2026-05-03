# Research Packet — Lux: Visuals & Art Direction Lead

**Destination:** `.github/team/research/` (team resource)
**Intended audience:** Lux

---

## Purpose

Equips Lux with the visual language references, UI/UX patterns, and art-direction conventions most relevant to a gothic-political strategy game, so that every spec and style decision Lux delivers is grounded in genre precedent and implementable by Sol without ambiguity.

---

## Role Summary

Lux defines and protects Political Ascent's visual identity: art style, UI/UX language, color palettes, typography, motifs, and asset specs. Lux does not implement code or create final art — she produces direction documents and specs clear enough for Sol to execute. She pulls reference images from Robert and aligns visual language with Vex's narrative tone and Nova's systems readability requirements.

---

## Key Concepts & Domain Knowledge

- **Dark / gothic political aesthetic in games** — Political Ascent's UI audit (2026-04) established a Bloodborne-inspired, politically sober visual language: dark stone backgrounds, gold accent rings, serif + mono typography pairs, sharp corners, no rounded "friendly" UI. Understanding what makes a dark UI *readable* vs. merely dark is the central challenge.
- **Visual language for faction systems** — Faction identity in strategy games is expressed through consistent color, iconography, and typographic voice. Lux must ensure that each political faction has a visually distinct signal that remains legible in tables, maps, and tooltips simultaneously.
- **Information density in simulation UIs** — Paradox-style games require extremely dense information surfaces. The risk is illegibility; the solution is typographic hierarchy, consistent slot sizing, and aggressive use of negative space at the *layout* level, even when individual panels are dense.
- **Design token architecture** — Political Ascent uses CSS design tokens (as established in the game-feel foundation pass, 2026-04). Lux's specs must express color, spacing, radius, and typography in terms of token names, not raw hex/px values. Sol implements from tokens.
- **Typography pairing for political/strategy games** — Serif for authority/narrative, monospace for data/simulation. This pairing is already established in the project. Lux should understand weight, tracking, and size-scale disciplines within that pairing (e.g., uppercase tracked small-caps for panel headers).
- **Color contrast and accessibility** — WCAG 2.1 AA requires a 4.5:1 contrast ratio for body text, 3:1 for large text. Dark-themed UIs commonly fail this on mid-grey text against dark backgrounds. Every palette decision must be contrast-tested; Rook validates via automated axe scans.
- **Reduced-motion design** — Political Ascent mandates reduced-motion support (P5). Animations must have motion-safe alternatives. Lux's specs should include both a "full animation" and "reduced motion" variant for any animated UI element.
- **Visual feedback for simulation state** — Players must be able to read approval ratings, economy health, and legislation status at a glance. This requires a visual grammar for "good / neutral / bad / critical" states that is consistent across all panels: same icon family, same color semantic, same typography treatment.
- **Asset pipeline specs** — Lux doesn't create final art but must specify technical constraints: resolution (@1x/@2x), color depth, export format (SVG preferred for UI icons, PNG for complex illustrations), naming convention, and performance budget (icon sprite sheet vs. individual files).
- **Mood board construction** — Effective mood boards are curated and annotated, not image dumps. Each reference image should be accompanied by a callout: "use this for the texture quality" or "NOT this composition, but this lighting temperature." Specificity makes the board actionable.

---

## Reference Games / Comparable Projects

| Title | What Lux should study |
|---|---|
| **Crusader Kings III** (Paradox, 2020) | Gold-on-dark UI chrome; heraldic motif system; how dynasty colors propagate consistently through portraits, map markers, and tooltips. |
| **Victoria 3** (Paradox, 2022) | Information-dense legislative and political panels; readable faction-colored political maps; typographic hierarchy under extreme data density. |
| **Bloodborne** (FromSoftware, 2015) | The aesthetic reference for Political Ascent's visual language — Victorian gothic, worn gold, dark stone, crimson accents. Study HUD minimalism, menu typography, item card layouts. |
| **Suzerain** (Torpor Games, 2020) | Political game UI that conveys gravitas through restraint — limited palette, serif-heavy text, cabinet/meeting room metaphors. |
| **Disco Elysium** (ZA/UM, 2019) | Skill-check UI panels; political world-building through visual collage; how psychedelic-but-legible information surfaces can coexist. |

---

## Best Practices for This Project

1. **Spec in tokens, not raw values.** Every color, spacing, and radius in a deliverable to Sol must reference an existing token (e.g., `--color-gold-accent`) or explicitly request a new token be added. Raw hex values in specs create implementation drift.
2. **Annotate every reference image** with specific callouts (what to use and what to ignore). An unannotated mood board forces Sol and Nova to interpret visual intent, which creates inconsistency.
3. **Include a11y notes in every UI/UX spec.** For each new surface, state the expected contrast ratios, keyboard focus behavior, and reduced-motion variant. Rook gates on these; Lux must supply them.
4. **Align with Nova on readability before finalizing system panels.** Economy charts, legislation timelines, and approval graphs are both gameplay systems (Nova's domain) and visual surfaces (Lux's domain). Lux should request a readability review from Nova before finalizing any data-display panel spec.
5. **Version major style decisions.** When palette, typography, or a core motif changes, document the version and rationale in a dated entry within the style guide. The visual identity must be historically traceable.

---

## Useful Patterns & Anti-Patterns

| Do | Avoid |
|---|---|
| Express colors as token references in specs | Raw hex values that bypass the token system |
| Include "do / don't" examples in style guides | Style guides without negative examples — ambiguity follows |
| Annotate every reference image with specific callouts | Unannotated image dumps as "mood boards" |
| Design panels at both "full density" and "minimal" states | Only designing the comfortable empty-state |
| Spec keyboard focus states (gold ring, current convention) | Omitting focus/hover/active/disabled states from specs |
| Test color choices at 4.5:1 contrast before finalizing | Delivering a palette that fails WCAG and bouncing back from Rook |

---

## Quick Reference Links (Internal)

- [Lux's agent file](../../agents/Lux.agent.md)
- [TEAM.md](../../TEAM.md)
- [GDD §8 — UI / UX Conventions](../../../docs/GDD.md)
- [GDD §5 — Pillars (P5: Accessible depth)](../../../docs/GDD.md)
- [docs/UI_GAME_FEEL_PROPOSAL.md](../../../docs/UI_GAME_FEEL_PROPOSAL.md)
- [docs/research/ui-audit-2026-04.md](../../../docs/research/ui-audit-2026-04.md) (Bloodborne theme audit, per-screen findings)
- [docs/research/game-feel-foundation-2026-04.md](../../../docs/research/game-feel-foundation-2026-04.md) (token system, typography, shell restructure)
- [docs/research/ui-ux-patterns.md](../../../docs/research/ui-ux-patterns.md) (tooltip, modal, onboarding patterns)
- [docs/research/crusader-kings-3.md](../../../docs/research/crusader-kings-3.md) (visual comparables)
- [docs/reference images/UI-UX/](../../../docs/reference%20images/UI-UX/) (existing reference image library)
- [.github/portfolios/robert/images/](../../portfolios/robert/images/) (Robert's reference image store)

---

## Handoffs Cheatsheet

| Agent | What Lux gives | What Lux receives |
|---|---|---|
| **Sol** | Finalized UI/UX specs, asset briefs, design token specs, style-guide diffs — clear enough to implement without follow-up | Implemented surfaces for visual review; feedback on technical feasibility of visual specs |
| **Vex** | Visual language proposals for narrative alignment review (faction colors, character visual direction) | Narrative tone & lore reference to inform visual translation |
| **Nova** | Visual readability constraints for systems panels; requests for readability review of data surfaces | Systems that require visual feedback; readability requirements for economy/legislation displays |
| **Rook** | A11y targets and perf budgets for visual deliverables; UI specs ready for validation | UI defects with screenshots; a11y violations; visual regression reports |
| **Jesse** | Visual work items; label requests (`area:visuals`, `area:ui-ux`) | Art-direction issue assignments; milestone tracking |
| **Robert** | Reference image requests; art-direction research questions | Reference images (`.github/portfolios/robert/images/`); mood board source material; genre visual analysis |

---

*Researched by Robert — 2026-05-03*
