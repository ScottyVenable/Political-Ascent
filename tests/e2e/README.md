# End-to-end tests (Playwright)

This folder holds the Playwright suite for Political Ascent. Every UI-affecting PR
runs this suite and commits updated screenshots when behaviour or layout changes.

## Running

```bash
npm run test:e2e           # headless, all three viewports
npm run test:e2e:ui        # Playwright UI mode
npm run test:e2e:update    # refresh committed screenshots (review diffs carefully)
```

## Structure

- `*.spec.ts` — one spec file per screen or flow.
- `__screenshots__/` — auto-generated committed baselines, organised by viewport project.
- `test-results/` *(repo-root, git-ignored)* — transient traces, videos, HTML report.

## Rules for agents

1. Every new screen or panel gets its own spec file.
2. Each spec captures a full-page screenshot and at least one behavioural assertion.
3. Screenshot filenames are stable and descriptive (`dashboard-empty`, `legislation-bill-detail`).
4. Animations are disabled in screenshots (`animations: "disabled"`) to prevent flakes.
5. Review every screenshot you commit; flag anything the agent (you) notices as a follow-up issue.

See `AGENTS.md` §5 for the full testing policy.
