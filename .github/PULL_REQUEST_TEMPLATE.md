## Summary

<!-- What changes, and why. One or two sentences. -->

## Linked issues

<!-- "Closes #12" to auto-close; "Refs #34" for tracking. -->

## Testing evidence

- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm test`
- [ ] `npm run test:e2e` (for UI changes)

### Screenshots

<!-- Required for UI changes. Drop screenshots captured by Playwright or attach new ones. Include viewport size. -->

### Agent analysis

<!-- If you are an AI agent: what did you observe in the screenshots? What could be improved or should be tracked as follow-up issues? -->

## Docs updated

<!-- Tick all that apply or explain why none apply. -->

- [ ] GDD (`docs/GDD.md`)
- [ ] Architecture (`docs/ARCHITECTURE.md`)
- [ ] Roadmap (`docs/ROADMAP.md`)
- [ ] Changelog (`docs/about/CHANGELOG.md`)
- [ ] Contributing (`docs/guides/CONTRIBUTING.md`)
- [ ] Modding (`docs/guides/MODDING.md`)
- [ ] Save format (`docs/guides/SAVE_FORMAT.md`)
- [ ] Icons & Assets (`docs/guides/ICONS_AND_ASSETS.md`)
- [ ] Credits (`docs/about/CREDITS.md`)
- [ ] Research (`docs/research/…`)
- [ ] Wiki pages (list them)
- [ ] No doc change needed because: <!-- reason -->

## Risks / rollback

<!-- How risky is this change? How would we roll back if it broke something? -->

## Checklist

- [ ] Branch name follows `exp--<version>--<feature>`.
- [ ] Base branch is `experimental/`.
- [ ] No emoji in shipped game content (`src/**/*.tsx`, `src/data/**/*.json`).
- [ ] No `Math.random()` in engine/systems/stores.
- [ ] No `any` introduced.
- [ ] JSDoc on every new exported symbol.
- [ ] Project board card moved to **In Review**.
