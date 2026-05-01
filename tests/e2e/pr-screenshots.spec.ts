import { expect, test, type Page } from '@playwright/test';

/**
 * PR screenshot capture spec — produces the screenshot grid attached to the
 * "play-test readiness" PR description. Walks MainMenu → CharacterCreation →
 * ScenarioSelect → Dashboard, then opens each major panel and saves a
 * timestamped capture under `tests/e2e/__screenshots__/play-test-readiness/`.
 *
 * Not part of the regression baseline — the suite uses `page.screenshot`
 * (not `toHaveScreenshot`) so first runs do not fail with "snapshot doesn't
 * exist". Re-run when the visual baseline changes; commit the latest set.
 */

async function reachDashboard(page: Page): Promise<void> {
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
  await page.waitForSelector('[data-testid="topbar-treasury"]', { timeout: 8_000 });
}

const PANELS: Array<{ button: RegExp; file: string; testid?: string }> = [
  { button: /^dashboard$/i, file: 'dashboard' },
  { button: /^legislation$/i, file: 'legislation' },
  { button: /^congress$/i, file: 'congress' },
  { button: /^population$/i, file: 'population' },
  { button: /^economy$/i, file: 'economy' },
  { button: /^cards$/i, file: 'cards' },
  { button: /^skills$/i, file: 'skills' },
  { button: /^quests$/i, file: 'quests' },
  { button: /^character$/i, file: 'character' },
  { button: /^news$/i, file: 'news' },
  { button: /^timeline$/i, file: 'timeline' },
  { button: /knowledge base/i, file: 'knowledge-base' },
];

test.describe('PR screenshots', () => {
  test('main menu', async ({ page }, testInfo) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.screenshot({
      path: `tests/e2e/__screenshots__/play-test-readiness/main-menu-${testInfo.project.name}.png`,
      fullPage: true,
    });
  });

  test('character creation step 1', async ({ page }, testInfo) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /new game/i }).click();
    await page.waitForSelector('text=Build Your Candidate');
    await page.screenshot({
      path: `tests/e2e/__screenshots__/play-test-readiness/character-creation-${testInfo.project.name}.png`,
      fullPage: true,
    });
  });

  test('all panels', async ({ page }, testInfo) => {
    await reachDashboard(page);
    for (const panel of PANELS) {
      const btn = page.getByRole('button', { name: panel.button }).first();
      if (!(await btn.isVisible())) continue;
      await btn.click();
      await page.waitForTimeout(250);
      await page.screenshot({
        path: `tests/e2e/__screenshots__/play-test-readiness/panel-${panel.file}-${testInfo.project.name}.png`,
        fullPage: false,
      });
    }
  });

  test('bottom bar progress and card focus modal polish', async ({ page }, testInfo) => {
    await reachDashboard(page);

    await page.getByRole('button', { name: /^legislation$/i }).click();
    await page.getByRole('button', { name: /draft new/i }).click();
    await page.getByTestId(/^draft-quick-/).first().click();

    const progress = page.getByTestId('bottombar-progress');
    await expect(progress).toBeVisible({ timeout: 4_000 });
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight + 1),
      )
      .toBe(true);
    await page.getByRole('button', { name: /^dashboard$/i }).click();
    await progress.click();
    await expect(page.getByTestId('legislation-session-dashboard')).toBeVisible();

    await page.screenshot({
      path: `tests/e2e/__screenshots__/ui-polish/bottom-bar-progress-${testInfo.project.name}.png`,
      fullPage: false,
    });

    await page.getByRole('button', { name: /^cards$/i }).first().click();
    const firstCard = page.locator('article[data-card-id]').first();
    await expect(firstCard).toBeVisible({ timeout: 4_000 });
    await firstCard.click();
    await expect(page.getByTestId('card-focus-modal')).toBeVisible();

    await page.screenshot({
      path: `tests/e2e/__screenshots__/ui-polish/card-focus-modal-${testInfo.project.name}.png`,
      fullPage: false,
    });
  });
});
