/**
 * achievements-screen.spec.ts — coverage of the Achievements screen.
 *
 * The Achievements screen (`src/renderer/screens/Achievements.tsx`) is
 * reachable from the main menu. In a fresh session (no game loaded), it shows
 * either an empty-state message or a grid of locked achievement cards — the
 * exact behaviour depends on whether the AchievementEngine has registered
 * any entries.
 *
 * Covered:
 *   - Screen renders with the "Achievements" heading.
 *   - Back button returns to the main menu.
 *   - Either an empty-state message renders *or* achievement cards render.
 *   - No emoji visible on the screen.
 *   - Screenshots at all three viewport sizes.
 *
 * @module tests/e2e/achievements-screen
 */
import { test, expect, type Page } from '@playwright/test';

// ─────────────────────────────────────────────────────────────
// BOOT HELPER
// ─────────────────────────────────────────────────────────────

async function openAchievements(page: Page) {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: /achievements/i }).click();
  await expect(page.getByRole('heading', { name: /achievements/i })).toBeVisible({
    timeout: 4_000,
  });
}

// ─────────────────────────────────────────────────────────────
// SUITE: RENDERING
// ─────────────────────────────────────────────────────────────

test.describe('achievements screen — rendering', () => {
  test('renders the Achievements heading', async ({ page }) => {
    await openAchievements(page);
    await expect(page.getByRole('heading', { name: /achievements/i })).toBeVisible();
  });

  test('renders either achievement cards or the empty-state message', async ({
    page,
  }) => {
    await openAchievements(page);
    // Two valid states: populated (card grid) or empty (no-data message).
    // We accept either — the point is that the screen renders something
    // meaningful rather than a blank white rectangle.
    const hasCards = await page.locator('[class*="card"], [class*="Card"]').first().isVisible();
    const hasEmpty = await page
      .getByText(/achievements will appear|no achievements/i)
      .isVisible();
    expect(hasCards || hasEmpty, 'Screen must show cards or empty-state').toBe(true);
  });

  test('no emoji visible on achievements screen', async ({ page }) => {
    await openAchievements(page);
    const hasEmoji = await page.evaluate(() => {
      const emojiRe =
        /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{1F000}-\u{1F2FF}]/u;
      return emojiRe.test(document.body.textContent ?? '');
    });
    // The Achievements component itself uses a unicode check mark "✓"
    // for unlocked achievements (not an emoji code point) — that should be
    // fine. But full-range emoji must not appear.
    expect(hasEmoji, 'Full-range emoji must not appear in achievements screen').toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────
// SUITE: NAVIGATION
// ─────────────────────────────────────────────────────────────

test.describe('achievements screen — navigation', () => {
  test('Back button returns to the main menu', async ({ page }) => {
    await openAchievements(page);
    await page.getByRole('button', { name: /back/i }).click();
    await expect(
      page.getByRole('heading', { name: /political ascent/i }),
    ).toBeVisible({ timeout: 4_000 });
  });
});

// ─────────────────────────────────────────────────────────────
// SUITE: SCREENSHOTS
// ─────────────────────────────────────────────────────────────

test.describe('achievements screen — screenshots', () => {
  test('full-page screenshot', async ({ page }, testInfo) => {
    await openAchievements(page);
    await page.addStyleTag({
      content:
        '*, *::before, *::after { animation-duration: 0s !important; transition-duration: 0s !important; }',
    });
    await expect(page).toHaveScreenshot(
      `achievements-screen-${testInfo.project.name}.png`,
      { fullPage: true, animations: 'disabled' },
    );
  });
});
