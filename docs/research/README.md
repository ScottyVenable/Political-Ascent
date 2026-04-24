# Research

This folder contains design research used to inform the systems, UX, and feel of **Political Ascent**. Each document studies a reference title (or a topical area) and extracts the mechanics, UI patterns, and pacing lessons that are applicable to a political RPG + grand strategy + management simulation.

> Research here is **descriptive**, not prescriptive. It collects patterns we can learn from. The GDD (`docs/GDD.md`) remains the authoritative design spec. Anything adopted from research must be reflected back into the GDD and/or Architecture docs.

## Index

| File | Reference | Primary lessons for Political Ascent |
|------|-----------|--------------------------------------|
| [victoria-3.md](victoria-3.md) | Victoria 3 (Paradox, 2022) | Population groups (POPs), law-passing lifecycle, interest groups, political movements, long-horizon simulation |
| [crusader-kings-3.md](crusader-kings-3.md) | Crusader Kings III (Paradox, 2020) | Character-driven story, traits, relationships/schemes, lifestyle trees, stress and stewardship |
| [anno-1800.md](anno-1800.md) | Anno 1800 (Ubisoft, 2019) | Population tiers, needs satisfaction loops, management UX clarity, diegetic news feeds |
| [comparative-systems.md](comparative-systems.md) | Tropico 6, Democracy 4, Suzerain, Frostpunk, Stellaris | Cross-cutting patterns: decisions-over-time, faction tension, crisis cadence, approval loops |
| [ui-ux-patterns.md](ui-ux-patterns.md) | Multi-source UI study | Tooltips, information density, map modes, event modals, onboarding |
| [political-simulation-fidelity.md](political-simulation-fidelity.md) | Academic & sim notes | How much realism is "enough"; abstraction principles for legislative process |
| [ui-audit-2026-04.md](ui-audit-2026-04.md) | Bloodborne-inspired theme audit | Per-screen walkthrough of the alpha build, theme-pass fixes, deferred polish items |

## How to add a research entry

1. Branch from `development`: `exp--0.1--research-<topic>`.
2. Add a Markdown file under `docs/research/`.
3. Use the structure: **Summary → Relevant Mechanics → What Translates → What Does Not → Suggested Hooks in our Systems → Open Questions → References**.
4. Link back from this `README.md` index.
5. If research changes design direction, update the GDD in the same PR.

## Editorial rules

- Cite sources; do not reproduce long copyrighted passages. Paraphrase.
- No screenshots of other games committed to this repo. Link to public storefronts / wikis instead.
- Flag anything speculative with a `> NOTE:` callout.
- Keep it readable in 10–15 minutes per doc.
