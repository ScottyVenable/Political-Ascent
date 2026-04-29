import { expect, test, type Page } from '@playwright/test';

/**
 * Right-click context menu smoke (todo#5).
 *
 * Verifies that right-clicking a hand card surfaces the contextual
 * menu rendered by `<ContextMenu />` with the expected items, and
 * that pressing Escape dismisses it.
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

test('right-click on a card surfaces a context menu', async ({ page }) => {
  await goToGame(page);

  // Open the in-game Cards panel (the hand view, not the deckbuilder).
  await page.getByRole('button', { name: /^cards$/i }).first().click();
  await page.waitForTimeout(200);

  const row = page.locator('[data-testid^="card-row-"]').first();
  await expect(row).toBeVisible({ timeout: 4_000 });

  await row.click({ button: 'right' });

  const menu = page.locator('[data-testid="context-menu"]');
  await expect(menu).toBeVisible();
  await expect(menu.locator('[data-testid="context-menu-item-copy-id"]')).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(menu).toHaveCount(0);
});
