# Political Ascent — End-to-End Test Suite

Playwright + Page Object Model, in the service of AGENTS.md §5 (screenshot
review is mandatory for every UI-touching PR).

## Layout

```
tests/e2e/
  fixtures/
    game-fixture.ts       Seeded game page; use this instead of bare Playwright `page`.
    a11y-fixture.ts       Structural a11y checks (emoji leak, naming, alt text).
  pages/
    base.page.ts          Shared `data-testid` helpers + snapshot.
    main-menu.page.ts     Main menu intents (new game, settings).
    character-creation.page.ts
    dashboard.page.ts     HUD + nav + advance-turn.
  helpers/
    selectors.ts          Authoritative `data-testid` registry.
    wait.ts               Domain-aware waits (waitForDateChange, waitForAppBoot).
    visual.ts             Deterministic screenshot capture with optional clock freeze.
  live/
    playground.spec.ts    Headed live-play harness, excluded from CI via @live tag.
  smoke.spec.ts           Boot sanity.
  visual-regression.spec.ts
  accessibility.spec.ts
  __screenshots__/        Committed baselines (per-project folders).
```

## Running

| Intent                        | Command                          |
| ----------------------------- | -------------------------------- |
| Full headless suite           | `npm run test:e2e`               |
| Playwright UI mode            | `npm run test:e2e:ui`            |
| Update committed screenshots  | `npm run test:e2e:update`        |
| Accessibility only            | `npm run test:e2e:a11y`          |
| Visual regression only        | `npm run test:e2e:visual`        |
| Interactive live-play harness | `npm run play:live`              |

`play:live` opens a real browser paused on the game root with the page
objects instantiated. Useful for exploratory testing or for letting an AI
agent drive the game visually via the Playwright Inspector / Playwright MCP.

## Conventions

- **Selectors:** always `data-testid` (kebab-case). Register every id in
  `helpers/selectors.ts` and reference from the page object. No CSS class or
  raw-text selectors in specs.
- **Determinism:** always use the `gamePage` fixture; it injects a deterministic
  seed so screenshots stay stable. Override per-spec with
  `test.use({ seed: "..." })`.
- **Screenshots:** use `captureScreen(page, testInfo, name)` from
  `helpers/visual.ts`. It freezes animations and names the file by viewport.
- **Accessibility:** the `runStructuralA11y` helper enforces the no-emoji
  rule (AGENTS.md §2.1) and flags obvious naming gaps. `@axe-core/playwright`
  plugs in behind the same interface when approved.
- **Tags:** append `@live` to specs that must not run in CI (interactive only).

## Component contract

Every production component renders its `data-testid` exactly as declared in
`helpers/selectors.ts`. When a component needs a new testable surface, add
the id to the `TestIds` map **first**, import it in the component, and then
use it in the page object. This keeps the spec, the page object, and the
component in lockstep.

See AGENTS.md §5 for the full testing policy.
