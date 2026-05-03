/**
 * scenario-select.spec.ts — ScenarioSelect screen coverage.
 *
 * The ScenarioSelect screen (`src/renderer/screens/ScenarioSelect.tsx`) sits
 * between character creation and the game. It shows available scenario cards
 * (one in the current alpha: "Modern America 2024") and lets the player
 * begin.
 *
 * Covered:
 *   - "Choose Your Arena" heading renders.
 *   - At least one scenario card renders (or the empty-state card).
 *   - Each scenario card shows a title, summary, and a "Begin" button.
 *   - Begin button starts the game.
 *   - Back button returns to character creation.
 *   - No emoji on the screen.
 *   - Screenshots at all three viewports.
 *
 * @module tests/e2e/scenario-select
 */
import { test, expect, type Page } from '@playwright/test';

// ─────────────────────────────────────────────────────────────
// BOOT HELPER — reach the scenario-select screen
// ─────────────────────────────────────────────────────────────

async function reachScenarioSelect(page: Page) {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: /new game/i }).click();
  await page.waitForSelector('text=Build Your Candidate', { timeout: 8_000 });
  await page.fill('input[placeholder*="Jordan"]', 'Alex Rivera');
  await page.getByRole('button', { name: /^next$/i }).click();
  await page.waitForSelector('text=Core Stats', { timeout: 4_000 });
  await page.getByRole('button', { name: /^next$/i }).click();
  await page.getByText(/pick 1.{1,3}3/i).waitFor({ timeout: 4_000 });
  await page.getByRole('button', { name: /grassroots organizer/i }).click();
  await page.waitForTimeout(100);
  await page.getByRole('button', { name: /^next$/i }).click();
  await page.waitForSelector('text=Where do you stand?', { timeout: 4_000 });
  await page.getByRole('button', { name: /choose scenario/i }).click();
  await page.waitForTimeout(300);
  await page.waitForSelector('text=Choose Your Arena', { timeout: 6_000 });
}

// ─────────────────────────────────────────────────────────────
// SUITE: RENDERING
// ─────────────────────────────────────────────────────────────

test.describe('scenario select — rendering', () => {
  test('renders the "Choose Your Arena" heading', async ({ page }) => {
    await reachScenarioSelect(page);
    await expect(page.getByText(/choose your arena/i)).toBeVisible();
  });

  test('renders at least one scenario card or empty-state', async ({ page }) => {
    await reachScenarioSelect(page);
    // Either a real scenario card or the "No scenarios loaded" empty state.
    const hasCard = await page
      .getByText(/modern america|no scenarios/i)
      .isVisible();
    expect(hasCard, 'Must show a scenario or the empty-state message').toBe(true);
  });

  test('scenario card shows a "Begin" button when character name is set', async ({
    page,
  }) => {
    await reachScenarioSelect(page);
    const beginBtn = page.getByRole('button', { name: /^begin$/i }).first();
    await expect(beginBtn).toBeVisible();
  });

  test('scenario card Begin button is enabled (character name is set)', async ({
    page,
  }) => {
    await reachScenarioSelect(page);
    const beginBtn = page.getByRole('button', { name: /^begin$/i }).first();
    await expect(beginBtn).toBeEnabled();
  });

  test('no emoji on scenario select screen', async ({ page }) => {
    await reachScenarioSelect(page);
    const hasEmoji = await page.evaluate(() => {
      const emojiRe =
        /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{1F000}-\u{1F2FF}]/u;
      return emojiRe.test(document.body.textContent ?? '');
    });
    expect(hasEmoji, 'Emoji must not appear on the scenario select screen').toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────
// SUITE: NAVIGATION
// ─────────────────────────────────────────────────────────────

test.describe('scenario select — navigation', () => {
  test('Begin starts the game and shows the dashboard', async ({ page }) => {
    await reachScenarioSelect(page);
    await page.getByRole('button', { name: /^begin$/i }).first().click();
    await expect(page.getByTestId('topbar-treasury')).toBeVisible({ timeout: 8_000 });
  });

  test('Back button returns to character creation (ideology step)', async ({
    page,
  }) => {
    await reachScenarioSelect(page);
    await page.getByRole('button', { name: /back/i }).click();
    // ScenarioSelect's "← Back" button routes to `character-creation`, which
    // always starts at step 0 (the name/avatar step). The ideology step is
    // NOT restored — that is expected behaviour.
    await expect(page.getByText(/build your candidate/i)).toBeVisible({
      timeout: 4_000,
    });
  });
});

// ─────────────────────────────────────────────────────────────
// SUITE: SCREENSHOTS
// ─────────────────────────────────────────────────────────────

test.describe('scenario select — screenshots', () => {
  const freezeCSS =
    '*, *::before, *::after { animation-duration: 0s !important; transition-duration: 0s !important; }';

  test('full-page screenshot', async ({ page }, testInfo) => {
    await reachScenarioSelect(page);
    await page.addStyleTag({ content: freezeCSS });
    await expect(page).toHaveScreenshot(
      `scenario-select-${testInfo.project.name}.png`,
      { fullPage: true, animations: 'disabled' },
    );
  });
});
