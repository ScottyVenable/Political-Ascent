# Icons, Sprites & Visual Assets — Sourcing & Usage Guide

**Status:** Normative. All contributors and AI agents must follow this guide when producing or referencing visual assets in Political Ascent.

---

## 1. Policy: No emoji in shipped game content

Political Ascent does **not** ship Unicode emoji (e.g., `U+1F525 FIRE`) anywhere a player can see them. This includes:

- Character creation backgrounds, traits, trait descriptions.
- Event modals, news headlines, tooltips.
- Card art / card labels / card type indicators.
- Quest descriptions.
- Achievements.
- UI buttons, toolbars, navigation items.
- Legacy screens and flavour text.
- In-game newspaper / briefing layouts.

### Why

1. Emoji renders inconsistently across platforms (Windows, macOS, Linux, Android each pick different glyphs).
2. Emoji cannot be restyled to fit the game's typography and palette.
3. Emoji carries cultural and tonal baggage inconsistent with the game's "authentic, non-editorialising" tone.
4. Accessibility readers often announce emoji awkwardly inside prose.

### Where emoji is still acceptable

- **Developer-only surfaces:** git commit messages, PR descriptions, internal docs in `docs/` (not shipped to players), debug panels gated behind `import.meta.env.DEV`.
- **Nothing else.**

---

## 2. What to use instead

Every place you would reach for an emoji, use one of these in this priority order:

1. **SVG icon** from an approved open-source icon set (section 3).
2. **Custom SVG** authored in-house and committed under `src/assets/icons/`.
3. **Free sprite / UI asset** from an approved source (section 4), with correct license file committed alongside.
4. **Text label** in the game's typography. (If you cannot decide between emoji and label, label wins.)

### Component rule

All icon rendering goes through a single `<Icon />` component:

```tsx
import { Icon } from "@/renderer/components/Icon";

<Icon name="gavel" size={18} aria-label="Legislation" />
```

The component:

- Accepts a `name` drawn from a typed enum of icon IDs (so unknown icons fail at build time).
- Resolves `name` to an SVG via a central registry.
- Forbids raw emoji characters at the typing layer (the `name` type is a string union, not a free string).
- Renders with `currentColor` fill so icons re-theme with Tailwind text color classes.

---

## 3. Approved open-source icon sets

Pick from these. All are **free for commercial use** with attribution requirements varying. License files must be vendored into `src/assets/licenses/<set-name>/`.

| Set | License | Count | Good for |
|---|---|---|---|
| [Lucide](https://lucide.dev/) | ISC | 1400+ | General UI, navigation, status indicators. First-choice default. |
| [Tabler Icons](https://tabler.io/icons) | MIT | 5000+ | When Lucide lacks a concept; very consistent stroke style. |
| [Phosphor Icons](https://phosphoricons.com/) | MIT | 9000+ | When we need a variant (thin / regular / bold / fill) of the same concept. |
| [Heroicons](https://heroicons.com/) | MIT | 300+ | Minimal, works well at small sizes. |
| [Game-icons.net](https://game-icons.net/) | CC BY 3.0 | 4000+ | Thematic game-flavoured icons (scrolls, gavels, seals). **Attribution required.** |
| [Twemoji SVGs](https://github.com/jdecked/twemoji) | CC BY 4.0 | full set | *Only* if we ever need a cross-platform consistent emoji *rendering* (we currently do not). **Attribution required.** |

**Do not mix sets within a single panel.** Lucide + Tabler can live in the same app, but a single toolbar should pick one set and stay there. Exception: game-icons.net for thematic flourishes (card rarity, achievement badges) alongside a utility set for chrome.

### Attribution

For CC BY sets, attribution lives in:

1. `src/assets/licenses/<set-name>/LICENSE.txt` (full text).
2. `docs/about/CREDITS.md` (human-readable credits list).
3. Settings → About screen in-game (renders from `CREDITS.md`).

---

## 4. Approved sprite & UI-asset sources

For larger visual assets — backgrounds, card frames, portrait placeholders, texture fills.

| Source | License model | Notes |
|---|---|---|
| [Kenney.nl](https://kenney.nl/) | CC0 (public domain) | First choice for UI frames, button states, card frames. No attribution required. |
| [OpenGameArt.org](https://opengameart.org/) | Varies per asset (CC0, CC BY, GPL) | **Read each asset's license.** Pin license file per asset imported. |
| [Itch.io free-asset creators](https://itch.io/game-assets/free) | Varies | Check per-asset license. Many are CC0 or CC BY. |
| [Freepik](https://www.freepik.com/) | Free tier **requires attribution**; paid tier does not | Prefer Freepik paid or CC0 alternatives. |
| [unDraw](https://undraw.co/) | MIT-like, free | Illustration style for empty-states and onboarding. |

### Asset import checklist

Before committing any external asset:

- [ ] Downloaded from the original creator's site, not a scraper.
- [ ] License terms read in full.
- [ ] License file vendored under `src/assets/licenses/<asset-or-pack-id>/LICENSE.txt`.
- [ ] Attribution line added to `docs/about/CREDITS.md`.
- [ ] Asset placed in the correct subfolder (see section 6).
- [ ] Asset optimised (SVG run through SVGO, PNG through `oxipng` or `pngquant`).
- [ ] File size is justified for its purpose (reject 2 MB PNGs for UI icons).

---

## 5. Forbidden sources

Never use:

- Paid stock sites' "free preview" assets with watermarks removed.
- Assets of uncertain provenance (reverse-image-search unclear).
- Assets derived from copyrighted games (Paradox, Kalypso, etc.).
- AI-generated images without documented generator, model, prompt, and license stance — and currently **no AI-generated image assets are approved for Political Ascent**. (AI-generated *code* is governed separately by `AGENTS.md` and `.github/COPILOT_INSTRUCTIONS.md`.)

---

## 6. Asset folder layout

```
src/
  assets/
    icons/                  SVG icons, filename matches Icon component name
      gavel.svg
      scroll.svg
      ...
    sprites/                Sprite sheets (PNG + JSON atlas)
      cards/
      ui/
    ui/                     UI frames, backgrounds, dividers
      frames/
      backgrounds/
    portraits/              NPC and player placeholder portraits
    licenses/               Vendored license files per pack/asset
      lucide/
        LICENSE.txt
      kenney-ui-pack/
        LICENSE.txt
      ...
docs/
  about/
    CREDITS.md              Human-readable attribution list
```

---

## 7. Development workflow

1. **Need an icon concept?** Search Lucide first, then Tabler, then Phosphor, then Game-icons.net.
2. **Found one?** Copy the raw SVG into `src/assets/icons/<name>.svg`. Strip any `fill="#..."` so the icon inherits `currentColor`.
3. **Register it** by adding `<name>` to the `IconName` type union in the Icon component registry.
4. **Verify license:** ensure the pack's license file is under `src/assets/licenses/<pack>/`. Add to `docs/about/CREDITS.md` if missing.
5. **Use via `<Icon name="..." />`.** Never inline raw SVG at the call site.
6. **PR description must list new icons/assets** with their source URL and license.

---

## 8. Enforcement

- CI lint rule: forbid Unicode emoji characters inside `.tsx`, `.ts`, `.json` files under `src/` (regex over the ranges `U+1F300–U+1FAFF`, `U+2600–U+27BF`, `U+FE0F` variation selector). The `src/assets/licenses/` subtree is exempt. *(To be added in a follow-up task.)*
- Content review checklist (`docs/guides/CONTENT_REVIEW.md`, future) blocks merge if JSON content introduces emoji.
- `<Icon>` component enforces registry membership at the type level.

---

## 9. Exceptions

Any exception must be approved by the Lead Director and documented in the PR description. Current standing exceptions:

- None.
