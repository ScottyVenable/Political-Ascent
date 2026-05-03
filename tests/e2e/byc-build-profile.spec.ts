/**
 * Playwright spec for the Build Your Candidate "Build Profile" card
 * (todo#27). Walks the wizard to the Core Stats step, tweaks two
 * sliders to skew the distribution, and captures a screenshot of
 * the new derived-archetype panel.
 */
import { test, expect } from '@playwright/test';

test.describe('Build Profile card', () => {
  test('renders three archetypes with live updates from sliders', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#root', { timeout: 15_000 });
    await page.getByRole('button', { name: /new game/i }).click();

    // Step 0 — basics
    await page.waitForSelector('text=Build Your Candidate', { timeout: 8_000 });
    await page.fill('input[placeholder*="Jordan"]', 'Profile Tester');
    await page.getByRole('button', { name: /^next$/i }).click();

    // Step 1 — Core Stats. Wait for the build-profile card to render.
    await page.waitForSelector('text=Core Stats', { timeout: 4_000 });
    await page.waitForSelector('[data-testid="build-profile"]', { timeout: 4_000 });

    // Sanity: three archetype cards present.
    await expect(page.locator('[data-testid="build-profile-persuasion"]')).toBeVisible();
    await expect(page.locator('[data-testid="build-profile-operations"]')).toBeVisible();
    await expect(page.locator('[data-testid="build-profile-resources"]')).toBeVisible();

    // Push charisma to 10 by clicking the + button repeatedly so
    // Persuasion clearly hits exceptional in the screenshot.
    const charismaPlus = page.locator(
      '[data-testid="stat-row-charisma"] button[aria-label="Increase charisma"]',
    );
    for (let i = 0; i < 10; i += 1) {
      await charismaPlus.click();
    }
    // And drop wealth to 1 to make Resources clearly weak.
    const wealthMinus = page.locator(
      '[data-testid="stat-row-wealth"] button[aria-label="Decrease wealth"]',
    );
    for (let i = 0; i < 10; i += 1) {
      await wealthMinus.click();
    }

    // Capture the Build Profile region.
    const profile = page.locator('[data-testid="build-profile"]');
    await profile.screenshot({
      path: 'tests/e2e/__screenshots__/byc-stats/build-profile.png',
    });
  });
});
