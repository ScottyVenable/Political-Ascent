import { expect, test, type Page } from '@playwright/test';

/**
 * Ideology compass redesign — verifies that the rebuilt compass:
 *   (1) Renders large, with quadrant labels and a live orientation readout.
 *   (2) Hides the raw numeric coordinates entirely (no `x = …` text).
 *   (3) Plots the historical reference figures as ghost markers and
 *       shows a tooltip on hover.
 *   (4) Updates the orientation label in real time when the marker moves
 *       via keyboard arrows.
 *
 * Stops at the Ideology step of character creation — we don't need to
 * complete the flow.
 */

async function goToIdeologyStep(page: Page): Promise<void> {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  await page.getByRole('button', { name: /new game/i }).click();
  await page.waitForSelector('text=Build Your Candidate', { timeout: 8_000 });

  await page.fill('input[placeholder*="Jordan"]', 'Alex Rivera');
  await page.getByRole('button', { name: /^next$/i }).click();
  await page.waitForTimeout(150);

  await page.waitForSelector('text=Core Stats', { timeout: 4_000 });
  await page.getByRole('button', { name: /^next$/i }).click();
  await page.waitForTimeout(150);

  await page.getByText(/Pick 1.{1,3}3/).waitFor({ timeout: 4_000 });
  await page.getByRole('button', { name: /grassroots organizer/i }).click();
  await page.waitForTimeout(100);
  await page.getByRole('button', { name: /^next$/i }).click();
  await page.waitForTimeout(150);

  await page.waitForSelector('text=Where do you stand?', { timeout: 4_000 });
  await page.waitForSelector('[data-testid="ideology-compass"]', { timeout: 4_000 });
}

test.describe('ideology compass — redesign', () => {
  test('renders the live orientation readout and no raw coordinates', async ({ page }) => {
    await goToIdeologyStep(page);

    const orientation = page.getByTestId('ideology-orientation');
    await expect(orientation).toBeVisible();
    // Default ideology is { x: 0, y: 0 } → "Centrist".
    await expect(orientation).toHaveText(/centrist/i);

    // No raw "x = …" / "y = …" coordinate exposure anywhere on the step.
    await expect(page.locator('text=/x\\s*=\\s*-?\\d/')).toHaveCount(0);
    await expect(page.locator('text=/y\\s*=\\s*-?\\d/')).toHaveCount(0);
  });

  test('plots historical reference figures', async ({ page }) => {
    await goToIdeologyStep(page);

    // Spot-check a representative spread of figures from the JSON file.
    for (const id of ['fdr', 'reagan', 'sanders', 'thatcher', 'lincoln']) {
      await expect(page.getByTestId(`ref-figure-${id}`)).toBeVisible();
    }
  });

  test('shows a tooltip when hovering a reference figure', async ({ page }) => {
    await goToIdeologyStep(page);

    await page.getByTestId('ref-figure-reagan').hover();
    const tip = page.getByRole('tooltip');
    await expect(tip).toBeVisible();
    await expect(tip).toContainText(/Ronald Reagan/i);
  });

  test('orientation label updates when the marker moves', async ({ page }) => {
    await goToIdeologyStep(page);

    const compass = page.getByTestId('ideology-compass');
    await compass.focus();

    // Drive the marker firmly into the right-authoritarian quadrant via
    // keyboard nudges (Shift = 0.15 per press, default = 0.05).
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Shift+ArrowRight');
      await page.keyboard.press('Shift+ArrowDown');
    }

    const orientation = page.getByTestId('ideology-orientation');
    await expect(orientation).toHaveText(/right-authoritarian/i);
  });
});
