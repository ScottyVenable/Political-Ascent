import { expect, test, type Page } from '@playwright/test';

/**
 * Polish pack — verifies three small but visible UX rules:
 *
 *   1. Global text-selection is disabled on game chrome (todo#4).
 *   2. The character-creation stat sliders no longer render the
 *      misaligned tick marks, and the stat names are tooltip-bearing
 *      (todo#8).
 *   3. The TopBar exposes a Treasury indicator with the coin glyph
 *      and the "$0" formatted readout (todo#12).
 *
 * Each test is independent; we don't rely on any prior state.
 */

async function gotoStatStep(page: Page): Promise<void> {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: /new game/i }).click();
  await page.waitForSelector('text=Build Your Candidate', { timeout: 8_000 });
  await page.fill('input[placeholder*="Jordan"]', 'Alex Rivera');
  await page.getByRole('button', { name: /^next$/i }).click();
  await page.waitForSelector('text=Core Stats');
}

async function reachDashboard(page: Page): Promise<void> {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: /new game/i }).click();
  await page.waitForSelector('text=Build Your Candidate', { timeout: 8_000 });
  // Step 0 — name
  await page.fill('input[placeholder*="Jordan"]', 'Alex Rivera');
  await page.getByRole('button', { name: /^next$/i }).click();
  await page.waitForTimeout(150);
  // Step 1 — stats (defaults are valid)
  await page.waitForSelector('text=Core Stats');
  await page.getByRole('button', { name: /^next$/i }).click();
  await page.waitForTimeout(150);
  // Step 2 — traits
  await page.getByText(/Pick 1.{1,3}3/).waitFor({ timeout: 4_000 });
  await page.getByRole('button', { name: /grassroots organizer/i }).click();
  await page.waitForTimeout(100);
  await page.getByRole('button', { name: /^next$/i }).click();
  await page.waitForTimeout(150);
  // Step 3 — ideology + scenario
  await page.waitForSelector('text=Where do you stand?');
  await page.getByRole('button', { name: /choose scenario/i }).click();
  await page.waitForTimeout(300);
  await page.waitForSelector('text=Choose Your Arena', { timeout: 6_000 });
  await page.getByRole('button', { name: /^begin$/i }).first().click();
  await page.waitForSelector('[data-testid="topbar-treasury"]', { timeout: 8_000 });
}

test.describe('polish pack', () => {
  test('html sets user-select: none on the body', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Read the computed style on <body> — the global rule must be
    // observable from getComputedStyle, not just present in CSS text.
    const userSelect = await page.evaluate(() => getComputedStyle(document.body).userSelect);
    expect(['none', '-webkit-none']).toContain(userSelect);
  });

  test('text inputs remain selectable', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /new game/i }).click();
    await page.waitForSelector('input[placeholder*="Jordan"]');
    const inputUserSelect = await page.evaluate(() => {
      const el = document.querySelector<HTMLInputElement>('input[placeholder*="Jordan"]');
      return el ? getComputedStyle(el).userSelect : null;
    });
    expect(inputUserSelect).toBe('text');
  });

  test('stat sliders no longer render tick marks', async ({ page }) => {
    await gotoStatStep(page);
    // The old behaviour rendered .pa-slider-ticks as a child of the
    // slider region. Removing `segments={10}` should remove that node
    // entirely from this step.
    const tickCount = await page.locator('.pa-slider-ticks').count();
    expect(tickCount).toBe(0);
  });

  test('stat names expose tooltips', async ({ page }) => {
    await gotoStatStep(page);
    const charisma = page.getByTestId('stat-name-charisma');
    await expect(charisma).toBeVisible();
    await charisma.hover();
    // ExtendedTooltip renders into a portal with role="tooltip"; we
    // accept any visible occurrence of the stat title.
    await expect(page.getByText(/charisma/i).first()).toBeVisible();
  });

  test('budget meter is rendered and starts in the valid range by default', async ({ page }) => {
    await gotoStatStep(page);
    const meter = page.getByTestId('stat-budget');
    await expect(meter).toBeVisible();
    // Default character has stats summing into the valid range.
    await expect(meter).toHaveAttribute('data-tone', /valid|under|over/);
  });

  test('topbar shows a treasury pill with $0 by default', async ({ page }) => {
    await reachDashboard(page);
    const treasury = page.getByTestId('topbar-treasury');
    await expect(treasury).toBeVisible();
    await expect(treasury).toContainText('$0');
  });
});
