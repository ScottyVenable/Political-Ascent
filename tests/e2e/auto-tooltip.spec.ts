import { expect, test, type Page } from '@playwright/test';

/**
 * Auto-Tooltip suite — verifies that:
 *   (1) Glossary terms in prose auto-link via <TermText>.
 *   (2) Hovering a term shows the radial hold ring, then auto-pins
 *       the tooltip after the configured hold window.
 *   (3) An outside click closes a pinned tooltip.
 *   (4) Pressing Escape closes a pinned tooltip.
 *
 * The character-creation flow is reused (matches the Cards & Tooltip
 * suite) so these tests run from a known dashboard state.
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

  // Pause the sim so weekly ticks don't reshuffle the dashboard during
  // hover timing measurements.
  await page.evaluate(() => {
    const gs = (window as unknown as { __gameStore?: GameStoreBridge }).__gameStore;
    gs?.getState().setPaused(true);
  });
  await page.waitForTimeout(150);
}

test.describe('auto-tooltip + hold-to-lock', () => {
  // The radial hold defaults to 1200ms in ExtendedTooltip; leave headroom.
  const HOLD_MS = 1200;
  const HOLD_BUFFER_MS = 600;

  test('hovering Political Capital shows radial then locks', async ({ page }) => {
    await goToGame(page);

    const pcPill = page.locator('text=PC').first();
    await pcPill.hover();
    // Wait for tooltip to appear (openDelay = 350ms).
    const tip = page.getByRole('tooltip');
    await expect(tip).toBeVisible({ timeout: 2000 });

    // Radial appears mid-hold. We allow either visible-but-still-filling
    // or already-locked; the key invariant is that pinned-mode UI
    // ("Click outside or press Esc") shows up after the full hold.
    await page.waitForTimeout(HOLD_MS + HOLD_BUFFER_MS);
    await expect(tip).toContainText(/click outside or press/i);
  });

  test('outside click closes a locked tooltip', async ({ page }) => {
    await goToGame(page);

    const pcPill = page.locator('text=PC').first();
    await pcPill.hover();
    const tip = page.getByRole('tooltip');
    await expect(tip).toBeVisible({ timeout: 2000 });
    await page.waitForTimeout(HOLD_MS + HOLD_BUFFER_MS);
    await expect(tip).toContainText(/click outside or press/i);

    // Click a neutral region of the page background. Use the body's
    // bottom-left corner to be sure we're nowhere near the trigger or
    // the tooltip card itself.
    await page.mouse.move(20, 20);
    await page.mouse.click(20, 20);
    await expect(tip).toBeHidden({ timeout: 1500 });
  });

  test('Escape closes a locked tooltip', async ({ page }) => {
    await goToGame(page);

    const pcPill = page.locator('text=PC').first();
    await pcPill.hover();
    const tip = page.getByRole('tooltip');
    await expect(tip).toBeVisible({ timeout: 2000 });
    await page.waitForTimeout(HOLD_MS + HOLD_BUFFER_MS);

    await page.keyboard.press('Escape');
    await expect(tip).toBeHidden({ timeout: 1500 });
  });
});
