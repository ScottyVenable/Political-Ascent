import { expect, test, type Page } from '@playwright/test';

/**
 * Draft legislation (todo#40). Verifies the new deep-draft modal opens,
 * a policy module can be toggled in, the climate forecast updates with
 * composed totals, and submitting the draft enqueues a bill.
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

test.describe('draft legislation', () => {
  test('customize modal toggles modules, updates totals, and drafts the bill', async ({ page }) => {
    await reachDashboard(page);
    await page.getByRole('button', { name: /^legislation$/i }).click();
    // Switch to the Draft tab.
    await page.getByRole('button', { name: /draft new/i }).click();

    // Open the deep-draft screen on the first available template.
    const customize = page.getByTestId(/^draft-customize-/).first();
    await expect(customize).toBeVisible();
    await customize.click();

    const screen = page.getByTestId('draft-legislation-screen');
    await expect(screen).toBeVisible();
    await expect(page.getByTestId('draft-title-input')).toBeVisible();
    await expect(page.getByTestId('bill-preview')).toBeVisible();
    await expect(page.getByTestId('climate-forecast-pass')).toBeVisible();

    // Capture the initial passage % so we can confirm the forecast moves
    // when a module is added.
    const initialForecast = (await page.getByTestId('climate-forecast-pass').textContent()) ?? '';

    // Toggle a module on.
    const sunset = page.getByTestId('policy-module-module-sunset-clause');
    await expect(sunset).toBeVisible();
    await expect(sunset).toHaveAttribute('data-active', 'false');
    await sunset.click();
    await expect(sunset).toHaveAttribute('data-active', 'true');

    // Sunset clause has oppositionDelta -10, so passage chance should
    // strictly improve.
    const updatedForecast = (await page.getByTestId('climate-forecast-pass').textContent()) ?? '';
    expect(updatedForecast).not.toBe(initialForecast);

    // Bill preview reflects the rider phrase.
    await expect(page.getByTestId('bill-preview')).toContainText(/expires five years/i);

    // Move to the Mechanical Breakdown step. The submit affordance is now
    // gated on this confirmation panel — see DraftLegislationScreen wizard.
    const beforeCount = await page.getByRole('button', { name: /in flight/i }).textContent();
    await page.getByTestId('draft-review').click();
    await expect(page.getByTestId('breakdown-step')).toBeVisible();
    await expect(page.getByTestId('breakdown-pass-column')).toBeVisible();
    await expect(page.getByTestId('breakdown-fail-column')).toBeVisible();
    await page.getByTestId('breakdown-confirm').click();
    await expect(screen).toBeHidden();
    const afterCount = await page.getByRole('button', { name: /in flight/i }).textContent();
    expect(afterCount).not.toBe(beforeCount);
  });

  test('bill type selector changes opposition and aide advisory updates', async ({ page }) => {
    await reachDashboard(page);
    await page.getByRole('button', { name: /^legislation$/i }).click();
    await page.getByRole('button', { name: /draft new/i }).click();
    await page.getByTestId(/^draft-customize-/).first().click();
    await expect(page.getByTestId('draft-legislation-screen')).toBeVisible();

    // Bill-type segmented control is present and Act is selected by default.
    await expect(page.getByTestId('bill-type-selector')).toBeVisible();
    await expect(page.getByTestId('bill-type-act')).toHaveAttribute('data-active', 'true');

    // Switching to Constitutional Amendment should fire the
    // amendment-low-coalition aide advisory once opposition crosses the
    // threshold (amendment adds +30 opposition, base templates start
    // around 30–60).
    await page.getByTestId('bill-type-amendment').click();
    await expect(page.getByTestId('bill-type-amendment')).toHaveAttribute('data-active', 'true');
    await expect(page.getByTestId('aide-advisory')).toBeVisible();

    // Switch to Resolution — opposition drops, the warning may disappear.
    await page.getByTestId('bill-type-resolution').click();
    await expect(page.getByTestId('bill-type-resolution')).toHaveAttribute('data-active', 'true');
  });
});
