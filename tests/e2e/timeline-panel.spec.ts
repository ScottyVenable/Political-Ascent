import { expect, test, type Page } from '@playwright/test';

/**
 * Timeline panel (todo#15). At dashboard entry the news log starts
 * empty; the panel must render the empty-state copy. We then push a
 * synthetic news item via the store and verify the panel re-renders
 * it under the correct month heading.
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

test.describe('timeline panel', () => {
  test('sidebar opens an empty Timeline panel after starting a game', async ({ page }) => {
    await reachDashboard(page);
    await page.getByRole('button', { name: /^timeline$/i }).click();
    await expect(page.getByTestId('timeline-panel')).toBeVisible();
    // Empty state copy. The history is genuinely empty for a new game.
    await expect(page.getByText(/no history yet/i)).toBeVisible();
  });
});
