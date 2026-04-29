import { expect, test, type Page } from '@playwright/test';

/**
 * Smoke test for the redesigned Quests panel: ensures the filter rail,
 * list, and detail pane all render after starting a fresh game.
 */

async function reachDashboard(page: Page): Promise<void> {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: /new game/i }).click();
  await page.waitForSelector('text=Build Your Candidate', { timeout: 8_000 });
  await page.fill('input[placeholder*="Jordan"]', 'Alex Rivera');
  await page.getByRole('button', { name: /^next$/i }).click();
  await page.waitForTimeout(150);
  await page.waitForSelector('text=Core Stats');
  await page.getByRole('button', { name: /^next$/i }).click();
  await page.waitForTimeout(150);
  await page.getByText(/Pick 1.{1,3}3/).waitFor({ timeout: 4_000 });
  await page.getByRole('button', { name: /grassroots organizer/i }).click();
  await page.waitForTimeout(100);
  await page.getByRole('button', { name: /^next$/i }).click();
  await page.waitForTimeout(150);
  await page.waitForSelector('text=Where do you stand?');
  await page.getByRole('button', { name: /choose scenario/i }).click();
  await page.waitForTimeout(300);
  await page.waitForSelector('text=Choose Your Arena', { timeout: 6_000 });
  await page.getByRole('button', { name: /^begin$/i }).first().click();
  await page.waitForSelector('[data-testid="topbar-treasury"]', { timeout: 8_000 });
}

test.describe('quests panel detail view', () => {
  test('renders filter pills, list, and detail pane', async ({ page }) => {
    await reachDashboard(page);
    await page.getByRole('button', { name: /^quests$/i }).click();
    await expect(page.getByTestId('quests-panel')).toBeVisible();
    // All four filter pills present.
    await expect(page.getByTestId('quest-filter-all')).toBeVisible();
    await expect(page.getByTestId('quest-filter-active')).toBeVisible();
    await expect(page.getByTestId('quest-filter-available')).toBeVisible();
    await expect(page.getByTestId('quest-filter-completed')).toBeVisible();
    // List + detail panes present.
    await expect(page.getByTestId('quest-list')).toBeVisible();
    await expect(page.getByTestId('quest-detail')).toBeVisible();
  });
});
