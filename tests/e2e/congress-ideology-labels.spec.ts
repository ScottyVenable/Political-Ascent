/**
 * Playwright coverage for todo#91 Congress ideology labels.
 *
 * Opens a member detail modal and verifies the Ideology row uses the
 * shared human-readable ideology label instead of raw x/y coordinates.
 */
import { expect, test, type Page } from '@playwright/test';

async function bootNewGame(page: Page): Promise<void> {
  await page.goto('/');
  await page.waitForSelector('#root', { timeout: 15_000 });
  await page.getByRole('button', { name: /new game/i }).click();
  await page.waitForSelector('text=Build Your Candidate', { timeout: 8_000 });
  await page.fill('input[placeholder*="Jordan"]', 'Ideology Label Tester');
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

test.describe('Congress ideology labels', () => {
  test('member modal shows readable ideology instead of raw coordinates', async ({ page }) => {
    await bootNewGame(page);

    await page.getByRole('button', { name: 'Congress', exact: true }).click();
    await page.waitForSelector('[data-testid="congress-member-list"]', { timeout: 8_000 });
    await page.locator('[data-testid="congress-member-row"]').first().click();

    const modal = page.locator('[data-testid="congress-member-modal"]');
    const stats = page.locator('[data-testid="member-modal-stats"]');
    await expect(modal).toBeVisible();
    await expect(stats).toContainText('Ideology');
    await expect(stats).not.toContainText(/-?\d\.\d{2}\s·\s-?\d\.\d{2}/);
    await expect(stats).toContainText(/Centrist|Left|Right|Authoritarian|Libertarian/);

    await modal.screenshot({
      path: 'tests/e2e/__screenshots__/congress-ideology-labels/member-modal.png',
    });
  });
});
