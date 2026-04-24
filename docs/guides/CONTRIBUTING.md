# Contributing

Read these before your first PR:

1. [AGENTS.md](../../AGENTS.md) — operating manual for AI agents; humans using Copilot should follow the same practices.
2. [.github/COPILOT_INSTRUCTIONS.md](../../.github/COPILOT_INSTRUCTIONS.md) — coding standards.
3. [docs/guides/ICONS_AND_ASSETS.md](ICONS_AND_ASSETS.md) — **no emoji** in shipped game content; approved icon sets and sprite sources.

## Workflow

1. Create a feature branch on demand: `exp--<feature-kebab>` (e.g. `exp--legislation-vote-ui`). Branch off `development`, or off `experimental` when continuing in-flight work. No pre-allocated per-milestone branches.
2. Run `npm install`, `npm run lint`, `npm run typecheck`, `npm test`, and `npm run test:e2e` locally before opening a PR.
3. Follow the commit format: `feat(scope): ...`, `fix(scope): ...`, etc. See [COPILOT_INSTRUCTIONS §Commit Format](../../.github/COPILOT_INSTRUCTIONS.md).
4. Scopes: `engine`, `legislation`, `congress`, `population`, `economy`, `cards`, `quests`, `skills`, `ui`, `character`, `dialogue`, `save`, `settings`, `android`, `docs`, `ci`, `agents`.
5. Data content (events, cards, legislation, achievements, scenarios) belongs in JSON under `src/data/`, not TypeScript.
6. Open PRs against `experimental/` — never merge directly to `development` or `release`.
7. Every PR uses the [pull request template](../../.github/PULL_REQUEST_TEMPLATE.md) and includes testing evidence and (for UI changes) Playwright screenshots.
8. Update the relevant docs and the GitHub Project board card in the same PR.

## Testing

- **Unit:** Vitest (`npm test`).
  - Every engine/system public function must have happy-path + edge-case coverage.
  - Pure functions in `src/utils/` must be 100% line + branch covered.
- **End-to-end + screenshots:** Playwright (`npm run test:e2e`).
  - Every UI-affecting PR must capture screenshots at 1280×720, 1440×900, and 1920×1080.
  - Agents are expected to *analyse* screenshots and file UI regression issues for anything they notice.
- **Typecheck + lint:** `npm run typecheck` and `npm run lint` must pass.

## Reporting and tracking

- File bugs, features, UI regressions, docs tasks, and chores via the [issue templates](../../.github/ISSUE_TEMPLATE/).
- All active work is tracked on the **Political Ascent** GitHub Project board. Move your card as the work progresses.
- Player- and modder-facing reference lives in the GitHub **Wiki**. Update affected Wiki pages in the same PR cycle as code changes.
