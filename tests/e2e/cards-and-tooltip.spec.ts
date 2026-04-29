import { expect, test, type Page } from '@playwright/test';

/**
 * Cards & Tooltip suite — exercises the deckbuilder Collection screen
 * (rarity-aware card grid, pack store, pack-opening reveal) and the
 * Paradox-style ExtendedTooltip on the TopBar PC counter.
 */

interface GameStoreBridge {
  getState: () => { setPaused: (paused: boolean) => void };
}

async function goToGame(page: Page): Promise<void> {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  await page.getByRole('button', { name: /new game/i }).click();
  await page.waitForSelector('text=Build Your Candidate', { timeout: 8_000 });

  await page.fill('input[placeholder*="Jordan"]', 'Alex Rivera');
  await page.getByRole('button', { name: /^next$/i }).click();
  await page.waitForTimeout(200);

  await page.waitForSelector('text=Core Stats', { timeout: 4_000 });
  await page.getByRole('button', { name: /^next$/i }).click();
  await page.waitForTimeout(200);

  await page.getByText(/Pick 1.{1,3}3/).waitFor({ timeout: 4_000 });
  await page.getByRole('button', { name: /grassroots organizer/i }).click();
  await page.waitForTimeout(150);
  await page.getByRole('button', { name: /^next$/i }).click();
  await page.waitForTimeout(200);

  await page.waitForSelector('text=Where do you stand?', { timeout: 4_000 });
  await page.getByRole('button', { name: /choose scenario/i }).click();
  await page.waitForTimeout(300);

  await page.waitForSelector('text=Choose Your Arena', { timeout: 6_000 });
  await page.getByRole('button', { name: /^begin$/i }).first().click();
  await page.waitForTimeout(400);

  await page.waitForSelector('text=Dashboard', { timeout: 8_000 });

  await page.evaluate(() => {
    const gs = (window as unknown as { __gameStore?: GameStoreBridge }).__gameStore;
    gs?.getState().setPaused(true);
  });
  await page.waitForTimeout(150);
}

test.describe('cards & tooltip', () => {
  test('Collection screen shows pack store and rarity grid', async ({ page }, testInfo) => {
    await goToGame(page);
    await page.getByRole('button', { name: 'Collection', exact: true }).click();
    await page.waitForTimeout(300);

    await expect(page.getByRole('heading', { name: /card packs/i })).toBeVisible();
    await expect(page.getByText(/starter pack/i).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: /^collection$/i })).toBeVisible();

    await expect(page).toHaveScreenshot(`collection-${testInfo.project.name}.png`, {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('Extended tooltip opens on Political Capital hover', async ({ page }, testInfo) => {
    await goToGame(page);

    const pcPill = page.locator('text=PC').first();
    await pcPill.hover();
    await page.waitForTimeout(500);

    const tip = page.getByRole('tooltip');
    await expect(tip).toBeVisible({ timeout: 2000 });
    await expect(tip).toContainText(/political capital/i);

    await expect(page).toHaveScreenshot(`tooltip-pc-${testInfo.project.name}.png`, {
      fullPage: false,
      animations: 'disabled',
    });
  });

  test('Opening a starter pack reveals five cards', async ({ page }, testInfo) => {
    await goToGame(page);
    await page.getByRole('button', { name: 'Collection', exact: true }).click();
    await page.waitForTimeout(300);

    await page.getByRole('button', { name: /^open$/i }).first().click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 2000 });
    await expect(dialog.getByRole('button', { name: /done/i })).toBeVisible({ timeout: 6000 });

    await expect(page).toHaveScreenshot(`pack-open-${testInfo.project.name}.png`, {
      fullPage: false,
      animations: 'disabled',
    });
  });
});
