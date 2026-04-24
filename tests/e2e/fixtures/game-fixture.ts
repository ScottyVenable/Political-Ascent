/**
 * Game test fixtures for Political Ascent Playwright suite.
 *
 * Extends the base Playwright `test` object with game-aware capabilities:
 *   - `gameUrl`   Absolute URL of the running dev server with a deterministic
 *                 seed injected into the query string.
 *   - `gamePage`  A pre-booted page that has navigated to the game root and
 *                 waited for the React root to mount, so specs can skip the
 *                 boring boot dance.
 *   - `seed`      The deterministic seed used for the run, exposed so specs
 *                 can assert seed-dependent behaviour without hardcoding it.
 *
 * Rationale: AGENTS.md §4.1 bans non-determinism in engine logic; our tests
 * mirror that. Every spec that uses this fixture replays the same world.
 *
 * @module tests/e2e/fixtures/game-fixture
 */
import { test as base, expect, type Page } from "@playwright/test";

/**
 * Default deterministic seed for e2e runs. Fixed across branches so committed
 * screenshots stay stable. Override per-spec with `test.use({ seed: "..." })`.
 */
export const DEFAULT_E2E_SEED = "political-ascent-e2e-default";

export interface GameFixtures {
  /** Seed used to initialize the game RNG for this test. */
  seed: string;
  /** Base URL with the seed query string appended. */
  gameUrl: string;
  /** A page that has already navigated to the game root. */
  gamePage: Page;
}

export const test = base.extend<GameFixtures>({
  seed: [DEFAULT_E2E_SEED, { option: true }],

  gameUrl: async ({ baseURL, seed }, use) => {
    // Suffix the URL with a deterministic seed. The renderer reads this via
    // `window.location.search` during boot (see src/renderer/bootstrap.ts).
    const url = new URL(baseURL ?? "http://localhost:5173");
    url.searchParams.set("seed", seed);
    url.searchParams.set("e2e", "1");
    await use(url.toString());
  },

  gamePage: async ({ page, gameUrl }, use) => {
    await page.goto(gameUrl);
    // The root mount is the single most reliable boot signal. If this times
    // out the whole suite bails early — the game never booted.
    await expect(page.locator("#root")).toBeVisible({ timeout: 15_000 });
    await page.waitForLoadState("networkidle");
    await use(page);
  },
});

export { expect } from "@playwright/test";
