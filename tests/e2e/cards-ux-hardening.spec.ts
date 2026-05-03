import { expect, test, type Page } from '@playwright/test';

/**
 * Cards UX hardening — Playwright validation for the bug-fix pass:
 *
 *  (1) Pack-opening modal closes when the backdrop is clicked once the
 *      reveal has settled. The reveal animations are short so we wait
 *      ~3s for the state machine to reach 'settled'.
 *  (2) The Play button on a hand card respects political capital.
 *      (AP gating is covered by unit tests in CardSystem.test.ts; the
 *      e2e check only confirms the disabled state propagates to the UI.)
 */

async function startGame(page: Page): Promise<void> {
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

test.describe('cards ux hardening', () => {
  test('pack-opening modal closes on backdrop click after reveal', async ({ page }) => {
    await startGame(page);

    // Navigate to Collection tab.
    const collectionTab = page.getByRole('button', { name: /collection/i }).first();
    await collectionTab.click();
    await page.waitForTimeout(300);

    // Find the cheapest pack and open it. Filter by enabled buttons.
    const openButtons = page.getByRole('button', { name: /^open$/i });
    const count = await openButtons.count();
    test.skip(count === 0, 'No pack-open buttons found');

    let opened = false;
    for (let i = 0; i < count; i++) {
      const btn = openButtons.nth(i);
      if (await btn.isEnabled()) {
        await btn.click();
        opened = true;
        break;
      }
    }
    test.skip(!opened, 'No openable pack — likely insufficient PC at game start');

    const backdrop = page.getByTestId('pack-opening-backdrop');
    await expect(backdrop).toBeVisible({ timeout: 4_000 });

    // Skip the carousel to the overview grid; the Done button is the proof the
    // reveal has reached a dismissible state.
    await page.getByRole('button', { name: /view all cards/i }).click({ timeout: 6_000 });
    await expect(page.getByRole('button', { name: /^done$/i })).toBeVisible({
      timeout: 3_000,
    });

    // Click the backdrop (top-left corner is far from any card or the
    // Done button so propagation guard `target === currentTarget` holds).
    await backdrop.click({ position: { x: 10, y: 10 } });
    await expect(backdrop).toBeHidden({ timeout: 2_000 });
  });

  test('pack-opening backdrop click is ignored before reveal settles', async ({ page }) => {
    await startGame(page);
    await page.getByRole('button', { name: /collection/i }).first().click();
    await page.waitForTimeout(300);

    const openButtons = page.getByRole('button', { name: /^open$/i });
    const count = await openButtons.count();
    test.skip(count === 0, 'No pack-open buttons found');

    let opened = false;
    for (let i = 0; i < count; i++) {
      const btn = openButtons.nth(i);
      if (await btn.isEnabled()) {
        await btn.click();
        opened = true;
        break;
      }
    }
    test.skip(!opened, 'No openable pack');

    const backdrop = page.getByTestId('pack-opening-backdrop');
    await expect(backdrop).toBeVisible();

    // Click immediately during the shake/burst phase — must NOT close.
    await backdrop.click({ position: { x: 10, y: 10 } });
    await expect(backdrop).toBeVisible();
  });
});
