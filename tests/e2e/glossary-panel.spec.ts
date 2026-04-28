import { expect, test, type Page } from '@playwright/test';

/**
 * Glossary panel (todo#16). Verifies the new sidebar entry and the
 * panel's three regions: search, category filters, term list + detail.
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

async function openGlossary(page: Page): Promise<void> {
  await reachDashboard(page);
  await page.getByRole('button', { name: /^glossary$/i }).click();
  await page.waitForSelector('[data-testid="glossary-panel"]', { timeout: 4_000 });
}

test.describe('glossary panel', () => {
  test('sidebar exposes a Glossary nav entry that opens the panel', async ({ page }) => {
    await reachDashboard(page);
    const navBtn = page.getByRole('button', { name: /^glossary$/i });
    await expect(navBtn).toBeVisible();
    await navBtn.click();
    await expect(page.getByTestId('glossary-panel')).toBeVisible();
    await expect(page.getByRole('heading', { name: /^glossary$/i })).toBeVisible();
  });

  test('search filters the term list', async ({ page }) => {
    await openGlossary(page);
    const list = page.getByTestId('glossary-list');
    const initialCount = await list.locator('li').count();
    expect(initialCount).toBeGreaterThan(3);

    await page.getByTestId('glossary-search').fill('political capital');
    await page.waitForTimeout(150);
    const filteredCount = await list.locator('li').count();
    expect(filteredCount).toBeGreaterThan(0);
    expect(filteredCount).toBeLessThan(initialCount);
    // The political-capital entry must survive the filter.
    await expect(page.getByTestId('glossary-item-political-capital')).toBeVisible();
  });

  test('clicking a term renders its detail view', async ({ page }) => {
    await openGlossary(page);
    await page.getByTestId('glossary-item-political-capital').click();
    const detail = page.getByTestId('glossary-detail-political-capital');
    await expect(detail).toBeVisible();
    await expect(detail.getByRole('heading', { name: /political capital/i })).toBeVisible();
  });
});
