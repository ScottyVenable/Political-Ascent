import { expect, test, type Page } from '@playwright/test';

/**
 * Population focus modal (todo#31). Verifies that clicking a group
 * card opens the focus modal with mood + demographics sections, and
 * that Escape dismisses it.
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

test.describe('population focus modal', () => {
  test('clicking a group card opens the focus modal and Escape closes it', async ({ page }) => {
    await reachDashboard(page);
    await page.getByRole('button', { name: /^population$/i }).click();
    const grid = page.getByTestId('population-grid');
    await expect(grid).toBeVisible();
    const firstCard = page.getByTestId('population-group-card').first();
    await expect(firstCard).toBeVisible();
    await firstCard.click();

    const modal = page.getByTestId('population-focus-modal');
    await expect(modal).toBeVisible();
    await expect(page.getByTestId('population-focus-mood')).toBeVisible();
    await expect(page.getByTestId('population-focus-demographics')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(modal).toHaveCount(0);
  });
});
