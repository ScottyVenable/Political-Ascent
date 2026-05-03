<!--
Pull Request template — Political Ascent
Cite GDD sections by §-number; do not paste GDD content here.
-->

## Summary

<!-- One paragraph. What changes and why. -->

## Linked issue

Closes #

## GDD section(s)

<!-- e.g. docs/GDD.md §4.2, §13.1.1 -->

## Type of change

- [ ] Feature (new user-visible surface)
- [ ] System (engine module added/changed)
- [ ] Content (narrative / data authoring)
- [ ] Bug fix
- [ ] Tech debt / refactor (no behaviour change)
- [ ] A11y
- [ ] Security
- [ ] Chore (tooling / CI / config)
- [ ] Docs only

## Screenshots / recordings

<!-- For renderer changes. Required for UI work. -->

## Test plan

<!-- Cite the test layers from GDD §13.1: L1 unit / L2 system / L3 store / L4 e2e. -->

- L1 unit:
- L2 system integration:
- L3 store integration:
- L4 renderer / e2e:

## Determinism note

<!-- Per GDD §13.2 — no Date.now, no Math.random outside seeded RNG. -->

- [ ] No new `Date.now()` calls in engine/system code
- [ ] No new `Math.random()` outside the seeded RNG
- [ ] Tick logic is pure given identical input state

## Save compatibility note

<!-- Per GDD §13.3. -->

- [ ] No persisted-state shape change
- [ ] Persisted-state shape changed → migration ladder entry added (§13.3.3)
- [ ] Save fixture corpus updated (`src/test/fixtures/saves/`) if applicable

## Changelog

<!-- Per docs/about/CHANGELOG.md (Keep-a-Changelog 1.1.0) and docs/changelogs/<stream>/. -->

- [ ] `[Unreleased]` updated in `docs/about/CHANGELOG.md`
- [ ] Per-stream entry added under `docs/changelogs/<stream>/` (filename pattern `YYYY-MM-DD-<version>-<slug>.md`)
- [ ] N/A — docs-only PR

## Pre-merge checklist

- [ ] `npm run lint` clean
- [ ] `npm run typecheck` clean
- [ ] `npm test` (unit) green
- [ ] `npm run test:e2e` green (if renderer touched)
- [ ] `npm run build` green
- [ ] No `console.log` left in production paths
