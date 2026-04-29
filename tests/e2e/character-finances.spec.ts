/**
 * Playwright coverage for todo#74 personal-finance actions.
 *
 * Creates a fresh character, opens the Character panel, exercises one
 * income action, and captures the Personal Finances card so the action
 * layout can be reviewed alongside the data assertion.
 */
import { expect, test } from '@playwright/test';

async function bootNewGame(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/');
  await page.waitForSelector('#root', { timeout: 15_000 });
  await page.getByRole('button', { name: /new game/i }).click();
  await page.waitForSelector('text=Build Your Candidate', { timeout: 8_000 });
  await page.fill('input[placeholder*="Jordan"]', 'Finance Tester');
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

test.describe('Character personal finances', () => {
  test('tracks funds and applies income actions from the Character panel', async ({ page }) => {
    await bootNewGame(page);

    await page.getByRole('button', { name: 'Character', exact: true }).click();
    await page.waitForSelector('[data-testid="character-finances"]', { timeout: 8_000 });

    const funds = page.locator('[data-testid="character-personal-funds"]');
    await expect(funds).toHaveText('$150.0K');

    await page.locator('[data-testid="finance-action-paid-speaking"]').click();
    await expect(funds).toHaveText('$173.5K');

    await page.locator('[data-testid="finance-action-campaign-self-fund"]').click();
    await expect(funds).toHaveText('$156.0K');
    await expect(page.locator('[data-testid="topbar-treasury"] span').last()).toHaveText('$17.5k');

    await page.locator('[data-testid="character-finances"]').screenshot({
      path: 'tests/e2e/__screenshots__/character-finances/personal-finances.png',
    });
  });
});
