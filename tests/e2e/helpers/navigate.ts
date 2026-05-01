/**
 * Shared navigation helpers for Political Ascent Playwright specs.
 *
 * The same "reach the dashboard" sequence appears in dozens of specs. Rather
 * than copy-pasting that 20-line block everywhere, all specs import from
 * this module. Benefits:
 *
 *   - A single update point if the character-creation flow changes.
 *   - Consistent timing across specs (same `waitForTimeout` budgets).
 *   - Named helper functions that document *intent* ("reach the dashboard
 *     via standard flow") rather than implementation steps.
 *
 * Architecture note: this file belongs in `tests/e2e/helpers/` and is
 * consumed only by Playwright specs. It must never be imported from source.
 *
 * @module tests/e2e/helpers/navigate
 */
import type { Page } from '@playwright/test';

// ─────────────────────────────────────────────────────────────
// SHARED HELPER: REACH DASHBOARD
// Executes the full character-creation → scenario-select flow,
// landing on the Game screen with the Dashboard panel active.
// Specs that exercise in-game panels start here.
// ─────────────────────────────────────────────────────────────

/**
 * Navigate from the main menu through character creation and scenario
 * selection to the in-game dashboard.
 *
 * Fills sensible defaults so the spec can reach the game screen as quickly
 * as possible. Tests that care about *specific* character choices should
 * supply those overrides and not use this helper.
 *
 * @param page         Playwright `Page` instance.
 * @param characterName  Name to type in the "Build Your Candidate" step.
 *                       Defaults to "Alex Rivera".
 */
export async function reachDashboard(
  page: Page,
  characterName = 'Alex Rivera',
): Promise<void> {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // Step: Main menu → character creation
  await page.getByRole('button', { name: /new game/i }).click();
  await page.waitForSelector('text=Build Your Candidate', { timeout: 8_000 });

  // Step 0 — name
  await page.fill('input[placeholder*="Jordan"]', characterName);
  await page.getByRole('button', { name: /^next$/i }).click();
  await page.waitForTimeout(150);

  // Step 1 — stats (accept defaults; they are always within budget)
  await page.waitForSelector('text=Core Stats', { timeout: 4_000 });
  await page.getByRole('button', { name: /^next$/i }).click();
  await page.waitForTimeout(150);

  // Step 2 — traits (pick the first available one to satisfy the min=1 rule)
  await page.getByText(/Pick 1.{1,3}3/).waitFor({ timeout: 4_000 });
  await page.getByRole('button', { name: /grassroots organizer/i }).click();
  await page.waitForTimeout(100);
  await page.getByRole('button', { name: /^next$/i }).click();
  await page.waitForTimeout(150);

  // Step 3 — ideology screen, then skip to scenario select
  await page.waitForSelector('text=Where do you stand?', { timeout: 4_000 });
  await page.getByRole('button', { name: /choose scenario/i }).click();
  await page.waitForTimeout(300);

  // Step 4 — scenario select: click the first available "Begin" button
  await page.waitForSelector('text=Choose Your Arena', { timeout: 6_000 });
  await page.getByRole('button', { name: /^begin$/i }).first().click();

  // Wait for the TopBar treasury indicator — the most reliable "game is ready"
  // signal we have. Appears only once Game.tsx has mounted and the engine has
  // seeded the initial world state.
  await page.waitForSelector('[data-testid="topbar-treasury"]', { timeout: 8_000 });
}

// ─────────────────────────────────────────────────────────────
// HELPER: PAUSE THE GAME
// Freezes the simulation clock via the game-store bridge so that
// time-sensitive assertions do not flap against a running clock.
// ─────────────────────────────────────────────────────────────

/**
 * Inject a script that calls `setPaused(true)` on the Zustand game store
 * without reloading the page. Requires the store to be exposed on
 * `window.__gameStore` (wired in `src/renderer/bootstrap.ts` when the
 * `?e2e=1` query flag is set).
 */
export async function pauseGame(page: Page): Promise<void> {
  await page.evaluate(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gs = (window as any).__gameStore;
    if (gs) gs.getState().setPaused(true);
  });
  await page.waitForTimeout(100);
}

// ─────────────────────────────────────────────────────────────
// HELPER: OPEN A NAMED PANEL
// Clicks the sidebar button matching the panel label so specs
// do not need to inline the exact button text.
// ─────────────────────────────────────────────────────────────

/**
 * Click a sidebar navigation entry by its visible label text.
 *
 * @param page   Playwright page.
 * @param label  Exact button label, e.g. "Dashboard", "Legislation".
 */
export async function openPanel(page: Page, label: string): Promise<void> {
  // The sidebar renders buttons with exact label text. `getByRole` with
  // exact match prevents accidental partial matches (e.g. "Cards" vs
  // "Collection").
  await page.getByRole('button', { name: new RegExp(`^${label}$`, 'i') }).first().click();
  await page.waitForTimeout(200);
}
