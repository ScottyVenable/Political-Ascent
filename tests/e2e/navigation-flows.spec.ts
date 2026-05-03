/**
 * navigation-flows.spec.ts — tests for all major screen-to-screen transitions.
 *
 * This spec guards the routing layer (`src/renderer/router.ts`) by verifying
 * that every navigation path:
 *   1. Takes the player to the expected screen.
 *   2. Back-navigation returns the player to the prior screen.
 *   3. No screen transition leaves the app in a broken state.
 *
 * Covered flows:
 *   - Main menu → Settings → Back to Main menu
 *   - Main menu → Achievements → Back to Main menu
 *   - Main menu → New Game → Back through each creation step
 *   - Main menu → New Game → all steps → game screen
 *   - In-game → Main menu button → returns to main menu
 *   - Router state is reflected in the UI (correct headings per route)
 *
 * @module tests/e2e/navigation-flows
 */
import { test, expect } from '@playwright/test';
import { reachDashboard, pauseGame } from './helpers/navigate';

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

const FREEZE_CSS =
  '*, *::before, *::after { animation-duration: 0s !important; transition-duration: 0s !important; }';

// ─────────────────────────────────────────────────────────────
// SUITE: MAIN MENU ROUTES
// ─────────────────────────────────────────────────────────────

test.describe('navigation flows — main menu routes', () => {
  test('main menu → settings → back to main menu', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /settings/i }).click();
    await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible({ timeout: 4_000 });
    await page.getByRole('button', { name: /back/i }).click();
    await expect(page.getByRole('heading', { name: /political ascent/i })).toBeVisible({ timeout: 4_000 });
  });

  test('main menu → achievements → back to main menu', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /achievements/i }).click();
    await expect(page.getByRole('heading', { name: /achievements/i })).toBeVisible({ timeout: 4_000 });
    await page.getByRole('button', { name: /back/i }).click();
    await expect(page.getByRole('heading', { name: /political ascent/i })).toBeVisible({ timeout: 4_000 });
  });

  test('main menu → new game → back from step 0 does not crash', async ({
    page,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /new game/i }).click();
    await page.waitForSelector('text=Build Your Candidate', { timeout: 8_000 });
    // There should be a back/cancel option on step 0 or we can navigate via
    // the browser back API. If there is a "Cancel" or "Back" button, click it.
    const backBtn = page.getByRole('button', { name: /back|cancel/i }).first();
    const backExists = await backBtn.isVisible({ timeout: 1_000 }).catch(() => false);
    if (backExists) {
      await backBtn.click();
      // Should return to main menu.
      await expect(
        page.getByRole('button', { name: /new game/i }),
      ).toBeVisible({ timeout: 4_000 });
    }
    // If no back button, at least confirm the page did not crash.
    await expect(page.locator('#root')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────
// SUITE: CHARACTER CREATION BACK-NAVIGATION
// ─────────────────────────────────────────────────────────────

test.describe('navigation flows — character creation back-navigation', () => {
  test('step 1 → previous → returns to step 0', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /new game/i }).click();
    await page.waitForSelector('text=Build Your Candidate', { timeout: 8_000 });
    await page.fill('input[placeholder*="Jordan"]', 'Alex Rivera');
    await page.getByRole('button', { name: /^next$/i }).click();
    await page.waitForSelector('text=Core Stats', { timeout: 4_000 });
    // "Previous" is the step-decrement button in the pinned nav.
    await page.getByRole('button', { name: /^previous$/i }).click();
    await expect(page.getByText(/build your candidate/i)).toBeVisible({ timeout: 4_000 });
  });

  test('step 2 → previous → returns to step 1', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /new game/i }).click();
    await page.waitForSelector('text=Build Your Candidate', { timeout: 8_000 });
    await page.fill('input[placeholder*="Jordan"]', 'Alex Rivera');
    await page.getByRole('button', { name: /^next$/i }).click();
    await page.waitForSelector('text=Core Stats', { timeout: 4_000 });
    await page.getByRole('button', { name: /^next$/i }).click();
    await page.getByText(/pick 1.{1,3}3/i).waitFor({ timeout: 4_000 });
    await page.getByRole('button', { name: /^previous$/i }).click();
    await expect(page.getByText(/core stats/i)).toBeVisible({ timeout: 4_000 });
  });

  test('step 3 → previous → returns to step 2', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /new game/i }).click();
    await page.waitForSelector('text=Build Your Candidate', { timeout: 8_000 });
    await page.fill('input[placeholder*="Jordan"]', 'Alex Rivera');
    await page.getByRole('button', { name: /^next$/i }).click();
    await page.waitForSelector('text=Core Stats', { timeout: 4_000 });
    await page.getByRole('button', { name: /^next$/i }).click();
    await page.getByText(/pick 1.{1,3}3/i).waitFor({ timeout: 4_000 });
    await page.getByRole('button', { name: /grassroots organizer/i }).click();
    await page.waitForTimeout(100);
    await page.getByRole('button', { name: /^next$/i }).click();
    await page.waitForSelector('text=Where do you stand?', { timeout: 4_000 });
    await page.getByRole('button', { name: /^previous$/i }).click();
    await expect(page.getByText(/pick 1.{1,3}3/i)).toBeVisible({ timeout: 4_000 });
  });
});

// ─────────────────────────────────────────────────────────────
// SUITE: IN-GAME NAVIGATION
// ─────────────────────────────────────────────────────────────

test.describe('navigation flows — in-game navigation', () => {
  test('in-game main menu button returns to the main menu', async ({ page }) => {
    await reachDashboard(page);
    await pauseGame(page);
    // Find the main-menu button in the BottomBar.
    const mainMenuBtn = page
      .getByRole('button', { name: /main menu|exit to menu/i })
      .first();
    await expect(mainMenuBtn).toBeVisible();
    await mainMenuBtn.click();
    // Might need confirmation dialog — accept it if shown.
    await page.waitForTimeout(300);
    const confirmBtn = page.getByRole('button', { name: /confirm|yes|ok/i }).first();
    if (await confirmBtn.isVisible({ timeout: 1_000 }).catch(() => false)) {
      await confirmBtn.click();
    }
    // Should land on the main menu.
    await expect(
      page.getByRole('button', { name: /new game/i }),
    ).toBeVisible({ timeout: 6_000 });
  });

  test('switching panels via sidebar updates aria-current on nav buttons', async ({
    page,
  }) => {
    await reachDashboard(page);
    await pauseGame(page);

    // Dashboard is active initially.
    await expect(
      page.getByRole('button', { name: /^dashboard$/i }).first(),
    ).toHaveAttribute('aria-current', 'page');

    // Switch to Economy.
    await page.getByRole('button', { name: /^economy$/i }).first().click();
    await page.waitForTimeout(250);

    await expect(
      page.getByRole('button', { name: /^economy$/i }).first(),
    ).toHaveAttribute('aria-current', 'page');

    // Dashboard should no longer be current.
    const dashAttr = await page
      .getByRole('button', { name: /^dashboard$/i })
      .first()
      .getAttribute('aria-current');
    expect(dashAttr).not.toBe('page');
  });
});

// ─────────────────────────────────────────────────────────────
// SUITE: SCREENSHOTS — navigation states
// ─────────────────────────────────────────────────────────────

test.describe('navigation flows — screenshots', () => {
  test('screenshot: settings screen', async ({ page }, testInfo) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /settings/i }).click();
    await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible({ timeout: 4_000 });
    await page.addStyleTag({ content: FREEZE_CSS });
    await expect(page).toHaveScreenshot(
      `nav-settings-${testInfo.project.name}.png`,
      { fullPage: true, animations: 'disabled' },
    );
  });
});
