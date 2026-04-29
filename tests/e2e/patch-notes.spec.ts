import { expect, test, type Page } from '@playwright/test';

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

test.describe('patch notes panel', () => {
  test('opens with all three tabs and renders bundled markdown', async ({ page }) => {
    await reachDashboard(page);
    await page.getByRole('button', { name: /^patch notes$/i }).click();
    await expect(page.getByTestId('patch-notes-panel')).toBeVisible();
    await expect(page.getByTestId('patch-notes-tab-stable')).toBeVisible();
    await expect(page.getByTestId('patch-notes-tab-development')).toBeVisible();
    await expect(page.getByTestId('patch-notes-tab-experimental')).toBeVisible();
    // Development tab is the default; the seeded entry should render.
    await expect(page.getByTestId('patch-notes-list')).toBeVisible();
    await expect(page.getByTestId('patch-notes-detail')).toBeVisible();
    // The MarkdownLite root is mounted with parsed content.
    await expect(page.getByTestId('markdown-lite').first()).toBeVisible();
  });
});
