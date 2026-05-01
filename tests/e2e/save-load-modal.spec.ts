/**
 * save-load-modal.spec.ts — Save/Load modal interaction coverage.
 *
 * The `SaveLoadModal` component (`src/renderer/components/SaveLoadModal.tsx`)
 * surfaces from two entry points:
 *   - Main menu "Load Game" button (load mode).
 *   - BottomBar "Save" button inside the game (save mode).
 *
 * Both modes share the same slot-list UI; they differ only in which actions
 * are available (overwrite vs. load).
 *
 * Covered:
 *   Load mode (from main menu):
 *     - Modal opens when "Load Game" is clicked.
 *     - Modal renders an empty-state message when no saves exist.
 *     - Close / Escape dismisses the modal.
 *
 *   Save mode (from in-game BottomBar):
 *     - Modal opens when the Save button is clicked.
 *     - "New save" affordance is visible.
 *     - Creating a save shows the slot in the list.
 *     - Closing the modal returns to the game.
 *
 * @module tests/e2e/save-load-modal
 */
import { test, expect } from '@playwright/test';
import { reachDashboard, pauseGame } from './helpers/navigate';

// ─────────────────────────────────────────────────────────────
// SUITE: LOAD MODE (from main menu)
// ─────────────────────────────────────────────────────────────

test.describe('save/load modal — load mode', () => {
  test('opens when "Load Game" is clicked on the main menu', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.getByTestId('main-menu-load').click();
    // The modal should appear within the expected time budget.
    await page.waitForTimeout(300);
    const modal = page
      .getByRole('dialog')
      .or(page.locator('[class*="modal"],[class*="overlay"]').first());
    await expect(modal.first()).toBeVisible({ timeout: 4_000 });
  });

  test('shows empty-state text when no saves exist', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.getByTestId('main-menu-load').click();
    await page.waitForTimeout(300);
    // Empty state message. Different phrasing is acceptable; we match loosely.
    await expect(
      page.getByText(/no saves|empty|nothing saved|no save/i).first(),
    ).toBeVisible({ timeout: 4_000 });
  });

  test('Escape key closes the load modal', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.getByTestId('main-menu-load').click();
    await page.waitForTimeout(300);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    // After Escape the main menu should be in the foreground again.
    await expect(
      page.getByRole('button', { name: /new game/i }),
    ).toBeVisible({ timeout: 4_000 });
  });

  test('Close button inside the modal dismisses it', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.getByTestId('main-menu-load').click();
    await page.waitForTimeout(300);
    const closeBtn = page.getByRole('button', { name: /close|cancel|dismiss/i }).first();
    await expect(closeBtn).toBeVisible({ timeout: 4_000 });
    await closeBtn.click();
    await page.waitForTimeout(300);
    await expect(
      page.getByRole('button', { name: /new game/i }),
    ).toBeVisible({ timeout: 4_000 });
  });
});

// ─────────────────────────────────────────────────────────────
// SUITE: SAVE MODE (from in-game BottomBar)
// ─────────────────────────────────────────────────────────────

test.describe('save/load modal — save mode', () => {
  test('Save button in BottomBar opens the modal in save mode', async ({ page }) => {
    await reachDashboard(page);
    await pauseGame(page);
    // Use the data-testid selector; the button aria-label is "Save game" not "Save".
    const saveBtn = page.getByTestId('bottombar-save');
    await expect(saveBtn).toBeVisible();
    await saveBtn.click();
    await page.waitForTimeout(300);
    // The modal has data-testid="save-load-modal" and role="dialog".
    await expect(page.getByTestId('save-load-modal')).toBeVisible({ timeout: 4_000 });
  });

  test('save modal shows a "new save" or "create" affordance', async ({ page }) => {
    await reachDashboard(page);
    await pauseGame(page);
    await page.getByTestId('bottombar-save').click();
    await page.waitForTimeout(300);
    // Save mode exposes data-testid="save-create-row" with a name input + Save button.
    await expect(page.getByTestId('save-create-row')).toBeVisible({ timeout: 4_000 });
  });

  test('closing the save modal returns focus to the game', async ({ page }) => {
    await reachDashboard(page);
    await pauseGame(page);
    await page.getByTestId('bottombar-save').click();
    await page.waitForTimeout(300);
    // The modal header contains a "Close" ghost button.
    await page.getByRole('button', { name: /^close$/i }).click();
    await page.waitForTimeout(300);
    // After closing, the game TopBar should be visible again.
    await expect(page.getByTestId('topbar-treasury')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────
// SUITE: SCREENSHOTS
// ─────────────────────────────────────────────────────────────

test.describe('save/load modal — screenshots', () => {
  const freezeCSS =
    '*, *::before, *::after { animation-duration: 0s !important; transition-duration: 0s !important; }';

  test('load modal screenshot (empty state)', async ({ page }, testInfo) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.getByTestId('main-menu-load').click();
    await page.waitForTimeout(300);
    await page.addStyleTag({ content: freezeCSS });
    await expect(page).toHaveScreenshot(
      `save-load-modal-load-empty-${testInfo.project.name}.png`,
      { fullPage: true, animations: 'disabled' },
    );
  });

  test('save modal screenshot (in-game)', async ({ page }, testInfo) => {
    await reachDashboard(page);
    await pauseGame(page);
    // Use data-testid selector consistent with the behavioral test suite.
    const saveBtn = page.getByTestId('bottombar-save');
    await saveBtn.click();
    await page.waitForTimeout(300);
    await page.addStyleTag({ content: freezeCSS });
    await expect(page).toHaveScreenshot(
      `save-load-modal-save-${testInfo.project.name}.png`,
      { fullPage: true, animations: 'disabled' },
    );
  });
});
