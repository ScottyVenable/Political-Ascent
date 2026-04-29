import { expect, test, type Page } from '@playwright/test';

/**
 * Statesman card animation (todo#2).
 *
 * The Statesman is the deckbuilder's signature prismatic card. The
 * animated rainbow border is the player-facing payoff for owning the
 * top-rarity tier; if it doesn't render or sweeps spotlight wedges
 * outside the card frame, the moment is broken.
 *
 * v1 of the prismatic frame rotated the entire ::before rectangle via
 * `transform: rotate()`, which caused the corners of the rectangle to
 * sweep outside the card's rounded clip — an ugly "spotlight" effect.
 * v2 (current) registers `--pa-prismatic-angle` via @property and
 * animates the angle inside `conic-gradient(from var(...), …)` so the
 * gradient stops rotate around a static rectangle.
 *
 * This suite verifies:
 *   1. The Statesman appears in the Collection panel with
 *      `data-rarity="prismatic"`.
 *   2. Its `::before` pseudo-element exists and uses a conic-gradient
 *      keyed off the custom angle property.
 *   3. The element itself is NOT being rotated by `transform`
 *      (regression guard against v1 reappearing).
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

  // Pause time so cooldowns and event triggers don't interfere with
  // the animation we're trying to inspect.
  await page.evaluate(() => {
    const gs = (window as unknown as { __gameStore?: GameStoreBridge }).__gameStore;
    gs?.getState().setPaused(true);
  });
  await page.waitForTimeout(150);
}

test.describe('Statesman card animation', () => {
  test('renders prismatic frame with animated conic gradient (no rectangle rotation)', async ({
    page,
  }) => {
    await goToGame(page);
    await page.getByRole('button', { name: 'Collection', exact: true }).click();
    await page.waitForTimeout(400);

    const statesman = page.locator('[data-card-id="card-statesman"]');
    await expect(statesman).toBeVisible({ timeout: 5_000 });
    await expect(statesman).toHaveAttribute('data-rarity', 'prismatic');

    // The pseudo-element ::before is what carries the rotating
    // gradient. We can't query a pseudo-element directly, so we read
    // its computed style via the parent and `getComputedStyle(el,
    // '::before')`.
    const beforeStyle = await statesman.evaluate((el) => {
      const cs = window.getComputedStyle(el, '::before');
      return {
        background: cs.backgroundImage,
        animationName: cs.animationName,
      };
    });
    expect(beforeStyle.background).toContain('conic-gradient');
    expect(beforeStyle.animationName).toMatch(/pa-prismatic-spin/);

    // Regression guard: in v1 the *element* spun via `transform:
    // rotate(...)`. In v2 only the gradient angle animates, so the
    // pseudo-element's transform should remain identity (or "none").
    // We tolerate jsdom's "matrix(...)" identity form.
    const transform = await statesman.evaluate((el) => {
      return window.getComputedStyle(el, '::before').transform;
    });
    expect(transform === 'none' || transform === 'matrix(1, 0, 0, 1, 0, 0)').toBe(true);
  });
});
