# Copilot Instructions — Political Ascent

GitHub Copilot automatically reads this file when working in this repository.

Authoritative instruction files, in priority order:

1. **[AGENTS.md](../AGENTS.md)** — operating manual for all AI agents (how to plan, code, test, commit, open PRs, maintain docs/Project/Wiki, run Playwright + screenshot suite, act as co-creative director).
2. **[.github/COPILOT_INSTRUCTIONS.md](./COPILOT_INSTRUCTIONS.md)** — long-form coding standards (types, file layout, commenting, patterns, what-never-to-do).
3. **[docs/guides/ICONS_AND_ASSETS.md](../docs/guides/ICONS_AND_ASSETS.md)** — no-emoji policy, approved icon sets and sprite sources, attribution rules.
4. **[docs/GDD.md](../docs/GDD.md)** — game design document (the "what").
5. **[docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md)** — technical architecture (the "how").
6. **[docs/ROADMAP.md](../docs/ROADMAP.md)** — priorities and milestones.
7. **[docs/guides/CONTRIBUTING.md](../docs/guides/CONTRIBUTING.md)** — contributor workflow.

If any two documents conflict:

- Agent behaviour rules → `AGENTS.md` wins.
- Coding standards → `.github/COPILOT_INSTRUCTIONS.md` wins.
- Game design → `docs/GDD.md` wins.
- Technical architecture → `docs/ARCHITECTURE.md` wins.

## Non-negotiable summary (read the full files for detail)

- No emoji in shipped game content. Use `<Icon />` with assets from Lucide / Tabler / Phosphor / Game-icons.net. See `docs/guides/ICONS_AND_ASSETS.md`.
- No `Math.random()` in engine/systems/stores. Use `SeededRNG`.
- No React in `src/engine/` or `src/systems/`.
- No `any`. No hardcoded game content (use JSON in `src/data/`).
- Branch on demand: `exp--<feature-kebab>` off `development` (or `experimental` for follow-up work). Open PRs against `experimental`. Never merge directly to `development` or `release`. Delete feature branches after merge.
- Every PR includes tests (Vitest) and, for UI changes, Playwright screenshots reviewed by the agent.
- Every PR updates the relevant docs, the GitHub Project card, and the Wiki if applicable.
- Extensive commenting is required. Code is written for the Lead Director to learn from; assume a smart reader unfamiliar with game-development idioms.
- You are a co-creative director, not a stenographer. Push back on weak designs. Back observations with screenshots and test output.
