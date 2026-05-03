/**
 * Congress bio filters (todo#55) — UI presence + screenshot capture.
 *
 * Validates that the new gender / age / wealth filters render inside the
 * advanced-filter accordion and that the new sort buttons are present.
 * Captures a desktop-class viewport (1280×800) so the right-side member
 * list (which only mounts at the `lg` Tailwind breakpoint, 1024 px) is
 * visible alongside the hemicycle.
 *
 * @see src/renderer/panels/CongressPanel.tsx
 */
import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

/**
 * Walk the New Game flow from the main menu through to the in-game
 * dashboard. Mirrors the steps used by android-review.spec.ts so the
 * happy path doesn't drift between specs.
 */
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
  // Pick the first scenario and click its "Begin" button.
  await page.getByRole('button', { name: /^begin$/i }).first().click();
  // Sidebar nav appears once the game shell mounts.
  await page.waitForSelector('text=Dashboard', { timeout: 8_000 });
}

test.describe('Congress bio filters', () => {
  // Desktop-class viewport so the lg breakpoint mounts the member list.
  test.use({ viewport: { width: 1280, height: 800 } });

  test('shows gender / age / wealth filters and new sort keys', async ({ page }) => {
    await bootNewGame(page);
    await page.getByRole('button', { name: 'Congress', exact: true }).click();
    await expect(page.getByTestId('congress-chamber-tabs')).toBeVisible();

    // Open the advanced-filter accordion.
    const advToggle = page.getByTestId('congress-advanced-toggle');
    await expect(advToggle).toBeVisible();
    await advToggle.click();

    // New filter groups all visible.
    await expect(page.getByTestId('congress-gender-all')).toBeVisible();
    await expect(page.getByTestId('congress-age-all')).toBeVisible();
    await expect(page.getByTestId('congress-wealth-all')).toBeVisible();

    // New sort keys all visible.
    await expect(page.getByTestId('congress-sort-age')).toBeVisible();
    await expect(page.getByTestId('congress-sort-wealth')).toBeVisible();
    await expect(page.getByTestId('congress-sort-sponsorship')).toBeVisible();

    // Apply two filters; collapsed accordion should show "2" badge.
    await page.getByTestId('congress-gender-F').click();
    await page.getByTestId('congress-age-over65').click();
    await advToggle.click(); // collapse
    await expect(advToggle).toContainText('2');

    await page.screenshot({
      path: 'tests/e2e/__screenshots__/congress-bio-filters/desktop-with-filters.png',
      fullPage: false,
    });
  });
});
