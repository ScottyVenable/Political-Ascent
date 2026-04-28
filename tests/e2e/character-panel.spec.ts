import { expect, test, type Page } from '@playwright/test';

/**
 * Character panel + avatar smoke (todo#6, #9, #10).
 *
 * Walks character creation picking a non-default avatar, opens the
 * Character panel in-game, and verifies:
 *   - The hero medallion reflects the chosen avatar.
 *   - "Change avatar" reveals the picker and switching updates the
 *     medallion live.
 *   - The full-size ideology compass shows reference figures.
 *   - The dashboard mini-compass does NOT show reference figures.
 */

interface GameStoreBridge {
  getState: () => { setPaused: (paused: boolean) => void };
}

async function goToGame(page: Page, avatarOption = 'avatar-option-veteran-officer'): Promise<void> {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  await page.getByRole('button', { name: /new game/i }).click();
  await page.waitForSelector('text=Build Your Candidate', { timeout: 8_000 });

  await page.fill('input[placeholder*="Jordan"]', 'Alex Rivera');
  await page.locator(`[data-testid="${avatarOption}"]`).click();
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

test.describe('character panel + avatar', () => {
  test('avatar picked at creation is reflected on the Character panel and can be changed', async ({
    page,
  }) => {
    await goToGame(page, 'avatar-option-veteran-officer');

    // Dashboard mini compass: reference figures hidden.
    const dashCompass = page.locator('[data-testid="ideology-compass"]').first();
    await expect(dashCompass).toBeVisible();
    await expect(dashCompass.locator('[data-testid^="ref-figure-"]')).toHaveCount(0);

    // Open Character panel.
    await page.getByRole('button', { name: /^character$/i }).first().click();
    await page.waitForTimeout(200);

    // Hero medallion should show the chosen veteran-officer preset.
    const hero = page.locator('[data-testid="avatar-medallion"]').first();
    await expect(hero).toHaveAttribute('data-preset', 'veteran-officer');

    // Toggle the picker, switch to scholar, confirm hero updates.
    await page.locator('[data-testid="character-panel-change-avatar"]').click();
    await page.locator('[data-testid="avatar-option-scholar"]').click();
    await expect(hero).toHaveAttribute('data-preset', 'scholar');

    // Big ideology compass on Character panel should display reference figures.
    const bigCompass = page.locator('[data-testid="ideology-compass"]').last();
    await expect(bigCompass.locator('[data-testid^="ref-figure-"]').first()).toBeVisible();
  });
});
