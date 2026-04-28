import { expect, test, type Page } from '@playwright/test';

/**
 * Mobile portrait smoke (PR — exp--mobile-portrait-fixes).
 *
 * Pixel-class portrait viewports surfaced three regressions in the
 * 0.1.0-alpha.1-exp.20260428 prerelease APK:
 *
 *   1. The 192px sidebar consumed more than a third of the viewport
 *      and squeezed every panel into uselessness.
 *   2. KPI tile values clipped (`UNEMPLOYME`, `2.10%` cut off,
 *      `$1.7T` cut off) because the main panel was too narrow.
 *   3. The TopBar status bar overlapped the system status row, and
 *      the BottomBar week-readout collided with the speed buttons.
 *
 * The fixes:
 *
 *   • Sidebar renders as an overlay drawer below `md` (toggled from
 *     a hamburger button on the TopBar). The desktop column is gated
 *     by `hidden md:flex` so the main panel keeps the full viewport
 *     width on phones.
 *   • TopBar applies `env(safe-area-inset-*)` padding via the Game
 *     shell, hides "XP" and the "AP" caption below `sm`, and tightens
 *     gaps so the three zones fit on a 360px-wide line.
 *   • BottomBar shrinks the speed buttons (40→36 px) and abbreviates
 *     the long "of 52 · January 2025" footer below `sm`.
 *   • Dashboard KPI value font drops from `text-data-lg` (32px) to
 *     `text-2xl` (24px) on phones; values truncate cleanly.
 *
 * This spec runs on the `chromium-pixel-portrait` project (Pixel 7,
 * 412×915 portrait) so the breakpoint behaviour is exercised against
 * a realistic device profile, not just a custom desktop viewport.
 */

/**
 * Walk character creation with default choices and land on the
 * dashboard. Mirrors `character-panel.spec.ts::goToGame` but skipping
 * the avatar picker to keep this spec focused on layout, not content.
 */
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

  // Dashboard text appears as a nav entry; wait for the KPI strip to
  // be the indicator we have actually landed in-game.
  await page.locator('[data-testid="kpi-approval"]').first().waitFor({ timeout: 8_000 });
}

test.describe('mobile portrait', () => {
  test('sidebar is hidden by default and toggled via the hamburger', async ({ page }) => {
    await goToGame(page);

    // Inline desktop sidebar must be hidden on phones.
    const desktopSidebar = page.locator('[data-testid="sidebar-desktop"]');
    await expect(desktopSidebar).toBeHidden();

    // Drawer is rendered but off-screen (translate-x-full) until toggled.
    const drawer = page.locator('[data-testid="sidebar-drawer"]');
    await expect(drawer).toHaveAttribute('aria-hidden', 'true');

    // Hamburger opens the drawer.
    const menuButton = page.locator('[data-testid="topbar-menu-button"]');
    await expect(menuButton).toBeVisible();
    await menuButton.click();
    await expect(drawer).toHaveAttribute('aria-hidden', 'false');

    // Tapping a panel inside the drawer auto-closes it.
    await drawer.getByRole('button', { name: /^character$/i }).click();
    await expect(drawer).toHaveAttribute('aria-hidden', 'true');
  });

  test('KPI strip stays inside the viewport with no horizontal overflow', async ({ page }) => {
    await goToGame(page);

    // The main scrolling panel should not generate a horizontal scrollbar
    // on phones — every KPI value must render on its allotted half-width.
    const overflowsX = await page.evaluate(() => {
      const main = document.querySelector('main');
      if (!main) return true;
      return main.scrollWidth > main.clientWidth + 1;
    });
    expect(overflowsX).toBe(false);

    // Spot-check the GDP tile — its value used to clip on the prerelease.
    const gdp = page.locator('[data-testid="kpi-gdp"]');
    await expect(gdp).toBeVisible();
    const text = (await gdp.textContent()) ?? '';
    // Either "%" or "Pp" should be present (different scenarios produce
    // different starting GDP signs); we just want to know the trailing
    // character actually rendered rather than being cut by overflow.
    expect(/%|pp/i.test(text)).toBe(true);
  });

  test('BottomBar speed controls and week readout coexist without clipping', async ({ page }) => {
    await goToGame(page);

    const footer = page.locator('footer');
    await expect(footer).toBeVisible();

    const pause = footer.getByRole('button', { name: /pause/i });
    const fast = footer.getByRole('button', { name: /^fast$/i });
    await expect(pause).toBeVisible();
    await expect(fast).toBeVisible();

    // The week readout text must be present (might wrap but must not be
    // hidden behind the speed-button column).
    await expect(footer.getByText(/^WEEK\s+\d+/)).toBeVisible();
  });
});
