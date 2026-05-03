import { test, type Page } from '@playwright/test';

/**
 * Capture screenshots of the new Legislation Drafting wizard (Phase 1
 * overhaul) for the PR description. Writes:
 *   - draft-screen-compose-<viewport>.png — drafting screen with the
 *     new bill-type selector, aide advisory, and drag-reorderable rider
 *     list visible. We toggle three modules and switch to Resolution to
 *     show the aide flipping to the "no riders" / "low coalition" tone.
 *   - draft-screen-breakdown-<viewport>.png — the Mechanical Breakdown
 *     confirmation step.
 *
 * Uses page.screenshot (not toHaveScreenshot) so first runs do not fail
 * with "snapshot doesn't exist".
 */

async function reachDraftScreen(page: Page): Promise<void> {
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
  await page.getByRole('button', { name: /^legislation$/i }).click();
  await page.getByRole('button', { name: /draft new/i }).click();
  await page.getByTestId(/^draft-customize-/).first().click();
  await page.getByTestId('draft-legislation-screen').waitFor();
}

test('legislation drafting wizard — compose + breakdown', async ({ page }, testInfo) => {
  await reachDraftScreen(page);

  // Toggle three modules so the active-rider list is non-trivial and
  // drag-reorder affordances are visible.
  await page.getByTestId('policy-module-module-progressive-tax').click();
  await page.getByTestId('policy-module-module-clean-energy-credit').click();
  await page.getByTestId('policy-module-module-sunset-clause').click();

  await page.screenshot({
    path: `tests/e2e/__screenshots__/legislation-overhaul-p1/draft-screen-compose-${testInfo.project.name}.png`,
    fullPage: false,
  });

  // Switch to Constitutional Amendment to surface the aide warning, then
  // capture again so the advisory tone is visible in the screenshot grid.
  await page.getByTestId('bill-type-amendment').click();
  await page.waitForTimeout(150);
  await page.screenshot({
    path: `tests/e2e/__screenshots__/legislation-overhaul-p1/draft-screen-amendment-${testInfo.project.name}.png`,
    fullPage: false,
  });

  // Move to the Mechanical Breakdown step and capture it.
  await page.getByTestId('bill-type-act').click();
  await page.getByTestId('draft-review').click();
  await page.getByTestId('breakdown-step').waitFor();
  await page.screenshot({
    path: `tests/e2e/__screenshots__/legislation-overhaul-p1/draft-screen-breakdown-${testInfo.project.name}.png`,
    fullPage: false,
  });
});
