import { expect, test, type Page } from '@playwright/test';

/**
 * Skill tree (todo#34). Verifies the new tree renders with branch
 * columns, hovering a node updates the detail rail, and clicking a
 * prereq chip refocuses the rail to that node.
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

test.describe('skill tree', () => {
  test('branch columns render and the detail rail follows hover', async ({ page }) => {
    await reachDashboard(page);
    await page.getByRole('button', { name: /^skills$/i }).click();

    await expect(page.getByTestId('skill-tree')).toBeVisible();
    await expect(page.getByTestId('skill-tree-grid')).toBeVisible();
    // All six branches present.
    for (const b of ['charisma', 'strategy', 'connections', 'integrity', 'stamina', 'wealth']) {
      await expect(page.getByTestId(`skill-branch-${b}`)).toBeVisible();
    }

    // Empty rail copy at first.
    const rail = page.getByTestId('skill-detail-rail');
    await expect(rail).toHaveAttribute('data-empty', 'true');

    // Hover the first node and the rail should update.
    const firstNode = page.getByTestId('skill-node-skill-orator');
    await firstNode.hover();
    await expect(rail).toHaveAttribute('data-skill-id', 'skill-orator');
  });

  test('clicking a prereq chip refocuses the rail to that node', async ({ page }) => {
    await reachDashboard(page);
    await page.getByRole('button', { name: /^skills$/i }).click();

    // Pin the chained skill (which has skill-orator as prereq).
    await page.getByTestId('skill-node-skill-charmer').click();
    const rail = page.getByTestId('skill-detail-rail');
    await expect(rail).toHaveAttribute('data-skill-id', 'skill-charmer');

    // Hovering away should not clear the pinned selection — but
    // clicking the prereq chip should refocus it.
    await page.getByTestId('skill-prereq-skill-orator').click();
    await expect(rail).toHaveAttribute('data-skill-id', 'skill-orator');
  });
});
