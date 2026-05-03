# Contributing

> **GDD reference:** N/A (process page)
> **Implementation status:** N/A
> **Last reviewed:** 2026-05-02 (Vex, GDD v0.4-DRAFT)

Full contributor workflow is in
[`docs/guides/CONTRIBUTING.md`](https://github.com/ScottyVenable/Political-Ascent/blob/development/docs/guides/CONTRIBUTING.md).
This page is the high-level version.

## Branch model (simplified)

- **Long-lived (exactly three):** `development`, `experimental`, `release`.
- **Feature branches** are created on demand from `development` (or from `experimental` if continuing in-flight work) and named `exp--<feature-kebab>` — no pre-allocated per-milestone branches.
- Every PR targets `experimental` first. `experimental` is the only branch that gets merged into `development`; `development` is the only branch promoted to `release`.
- Never merge directly to `development` or `release`.
- Delete feature branches once their PR is merged.

## Expectations per PR

- Tests (Vitest) and, for UI changes, Playwright screenshots.
- Docs updated in the same PR.
- Linked issue on the [Project Board](https://github.com/users/ScottyVenable/projects/6).

## Code standards

- TypeScript, no `any`, no `Math.random()` in engine/systems/stores.
- Data in `src/data/*.json`, types in `src/types/`.
- Extensive comments — see [`AGENTS.md`](https://github.com/ScottyVenable/Political-Ascent/blob/development/AGENTS.md)
  and [`.github/COPILOT_INSTRUCTIONS.md`](https://github.com/ScottyVenable/Political-Ascent/blob/development/.github/COPILOT_INSTRUCTIONS.md).
- No emoji in shipped UI; use the icon system.
  See [`docs/guides/ICONS_AND_ASSETS.md`](https://github.com/ScottyVenable/Political-Ascent/blob/development/docs/guides/ICONS_AND_ASSETS.md).
