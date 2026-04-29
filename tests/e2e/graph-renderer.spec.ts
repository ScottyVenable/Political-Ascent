/**
 * Graph renderer polish (todo#66) — visual smoke test.
 *
 * Boots a new game, navigates to Economy, fast-forwards a few weeks
 * so the trends panel has data, then captures a screenshot. The
 * captured PNG is committed and reviewed manually to confirm the
 * Sparkline area-fill + last-dot polish landed.
 */
import { test } from '@playwright/test';
import type { Page } from '@playwright/test';

async function bootNewGame(page: Page): Promise<void> {
  await page.goto('/');
  await page.waitForSelector('#root', { timeout: 15_000 });
  await page.getByRole('button', { name: /new game/i }).click();
  await page.waitForSelector('text=Build Your Candidate', { timeout: 8_000 });
  await page.fill('input[placeholder*="Jordan"]', 'Alex Rivera');
  await page.getByRole('button', { name: /^next$/i }).click();
  await page.waitForSelector('text=Core Stats', { timeout: 4_000 });
  await page.getByRole('button', { name: /^next$/i }).click();
  await page.waitForSelector('text=Pick 1–3', { timeout: 4_000 });
  await page.locator('button:has(h5)').first().click();
  await page.getByRole('button', { name: /^next$/i }).click();
  await page.waitForSelector('text=Where do you stand?', { timeout: 4_000 });
  await page.getByRole('button', { name: /choose scenario/i }).click();
  await page.waitForSelector('text=Choose Your Arena', { timeout: 6_000 });
  await page.getByRole('button', { name: /^begin$/i }).first().click();
  await page.waitForSelector('text=Dashboard', { timeout: 8_000 });
}

test.describe('Graph renderer polish', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('Economy trends use the new sparkline (area + last dot)', async ({ page }) => {
    test.setTimeout(60_000);
    await bootNewGame(page);

    // Engine accumulates monthly history snapshots; advance the sim a
    // few months so the sparklines have real data. Use the segmented
    // speed control's stable test-id rather than a regex on label.
    await page.locator('[data-testid="bottombar-speed-4"]').click();
    // Engine snapshots EconomySystem history monthly; need ≥2 months
    // of sim time so the trends card renders sparklines with at least
    // 2 data points.
    await page.waitForTimeout(35_000);
    await page.locator('[data-testid="bottombar-speed-0"]').click();
    await page.waitForTimeout(150);

    await page.getByRole('button', { name: 'Economy', exact: true }).click();
    await page.waitForSelector('text=Trends (monthly)', { timeout: 5_000 });
    await page.waitForTimeout(200);

    await page.screenshot({
      path: 'tests/e2e/__screenshots__/graph-renderer/economy-trends.png',
      fullPage: false,
    });
  });
});
