import { expect, test, type Page } from '@playwright/test';

/**
 * Dashboard interactivity (todo#11).
 *
 * The KPI strip on the dashboard is now interactive: each tile is a
 * real button that navigates to the panel where the stat lives, and
 * the headline number is colour-coded by tone (positive/negative/
 * neutral).
 *
 * These tests:
 *   1. Verify the four expected `data-testid` tiles render and are
 *      visible after reaching the dashboard.
 *   2. Click the GDP tile and confirm the Economy panel opens.
 *   3. Click the Approval tile and confirm the Population panel opens.
 *
 * Reaches the dashboard via the same creation flow as polish-pack.
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

test.describe('dashboard interactivity', () => {
  test('renders all four KPI tiles as buttons', async ({ page }) => {
    await reachDashboard(page);
    for (const id of ['kpi-approval', 'kpi-gdp', 'kpi-unemployment', 'kpi-deficit']) {
      const tile = page.getByTestId(id);
      await expect(tile).toBeVisible();
      // Each tile must be a real button so keyboard nav works.
      await expect(tile).toHaveJSProperty('tagName', 'BUTTON');
    }
  });

  test('clicking GDP tile opens the Economy panel', async ({ page }) => {
    await reachDashboard(page);
    await page.getByTestId('kpi-gdp').click();
    // EconomyPanel renders the GDP Growth row label.
    await expect(page.getByText(/GDP Growth/i).first()).toBeVisible({ timeout: 4_000 });
    // Sidebar Economy nav should be in the active state (aria-current=page).
    await expect(page.getByRole('button', { name: /^economy$/i })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  test('clicking Approval tile opens the Population panel', async ({ page }) => {
    await reachDashboard(page);
    await page.getByTestId('kpi-approval').click();
    await expect(page.getByRole('button', { name: /^population$/i })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });
});
