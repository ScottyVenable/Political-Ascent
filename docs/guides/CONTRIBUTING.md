# Contributing

Please read `.github/COPILOT_INSTRUCTIONS.md` first — it is the single source of truth for coding standards on this project.

## Workflow

1. Branch from `development`: `exp--0.1--feature-name`.
2. Run `npm install`, `npm run typecheck`, `npm test` locally before opening a PR.
3. Follow the commit format: `feat(scope): ...`, `fix(scope): ...`, etc.
4. Scopes: `engine`, `legislation`, `congress`, `population`, `economy`, `cards`, `quests`, `skills`, `ui`, `character`, `dialogue`, `save`, `settings`, `android`.
5. Data content (events, cards, legislation) belongs in JSON, not TypeScript.

## Testing

- Unit: Vitest (`npm test`).
- Every engine/system public function should have coverage for its core flow.
- Pure functions in `utils/` must be 100% covered.
