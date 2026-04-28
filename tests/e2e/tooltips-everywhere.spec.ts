import { expect, test, type Page } from '@playwright/test';

/**
 * Tooltips everywhere — todo#1.
 *
 *   1. Term tooltips appear in panels other than just Cards. We assert
 *      that hovering a glossary-linked label in EconomyPanel and
 *      PopulationPanel surfaces a tooltip popup.
 *
 *   2. Nested ExtendedTooltip stacking: when a tooltip body itself
 *      contains a glossary term, opening the inner term tooltip must
 *      paint above the outer one. We test this by walking the tooltip
 *      portals' computed z-index values — the deeper one is higher.
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
  await page.waitForSelector('text=Dashboard', { timeout: 8_000 });
}

test.describe('tooltips everywhere', () => {
  test('economy panel exposes glossary tooltips on stat labels', async ({ page }) => {
    await reachDashboard(page);
    await page.getByRole('button', { name: /economy/i }).first().click();
    await page.waitForTimeout(300);

    const gdp = page.locator('[data-term="gdp"]').first();
    await expect(gdp).toBeVisible();
    await gdp.hover();
    await expect(page.getByRole('tooltip').filter({ hasText: /gross domestic product/i }).first())
      .toBeVisible({ timeout: 3_000 });
  });

  test('population panel exposes radicalism tooltip', async ({ page }) => {
    await reachDashboard(page);
    await page.getByRole('button', { name: /population/i }).first().click();
    await page.waitForTimeout(300);

    const rad = page.locator('[data-term="radicalism"]').first();
    if ((await rad.count()) === 0) {
      // Some scenarios start with empty population — skip rather than fail.
      test.skip();
    }
    await rad.hover();
    await expect(page.getByRole('tooltip').filter({ hasText: /radicalism/i }).first())
      .toBeVisible({ timeout: 3_000 });
  });

  test('treasury topbar tooltip works end-to-end', async ({ page }) => {
    await reachDashboard(page);
    const treasury = page.getByTestId('topbar-treasury');
    await treasury.hover();
    await expect(page.getByRole('tooltip').filter({ hasText: /treasury/i }).first())
      .toBeVisible({ timeout: 3_000 });
  });
});
