/**
 * full-screen-screenshots.spec.ts — dedicated screenshot baseline suite.
 *
 * This spec exists purely to capture and maintain committed screenshot
 * baselines for every major screen and state combination, at all three
 * viewport sizes mandated by AGENTS.md §5.2:
 *   - 1280×720  (chromium-1280x720 project)
 *   - 1440×900  (chromium-1440x900 project)
 *   - 1920×1080 (chromium-1920x1080 project)
 *
 * Each test navigates to a specific screen, freezes animations, and
 * captures a full-page screenshot with a deterministic name. The Playwright
 * project matrix (playwright.config.ts) runs each test in all three
 * viewports automatically.
 *
 * Tests in this file deliberately perform no behavioural assertions beyond
 * screenshot match — the behavioural coverage lives in the per-screen spec
 * files. This separation keeps the screenshot suite lean and easy to update
 * when intentional visual changes ship.
 *
 * @module tests/e2e/full-screen-screenshots
 */
import { test, expect } from '@playwright/test';
import { reachDashboard, pauseGame, openPanel } from './helpers/navigate';

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────

/** Freeze all CSS transitions/animations for pixel-stable screenshots. */
const FREEZE_CSS =
  '*, *::before, *::after { animation-duration: 0s !important; transition-duration: 0s !important; }';

// ─────────────────────────────────────────────────────────────
// SUITE: PRE-GAME SCREENS
// ─────────────────────────────────────────────────────────────

test.describe('screenshots — pre-game screens', () => {
  test('main menu', async ({ page }, testInfo) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.addStyleTag({ content: FREEZE_CSS });
    await expect(page).toHaveScreenshot(`screen-main-menu-${testInfo.project.name}.png`, {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('settings screen', async ({ page }, testInfo) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /settings/i }).click();
    await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible({ timeout: 4_000 });
    await page.addStyleTag({ content: FREEZE_CSS });
    await expect(page).toHaveScreenshot(`screen-settings-${testInfo.project.name}.png`, {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('achievements screen', async ({ page }, testInfo) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /achievements/i }).click();
    await expect(page.getByRole('heading', { name: /achievements/i })).toBeVisible({ timeout: 4_000 });
    await page.addStyleTag({ content: FREEZE_CSS });
    await expect(page).toHaveScreenshot(`screen-achievements-${testInfo.project.name}.png`, {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('character creation — step 0', async ({ page }, testInfo) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /new game/i }).click();
    await page.waitForSelector('text=Build Your Candidate', { timeout: 8_000 });
    await page.addStyleTag({ content: FREEZE_CSS });
    await expect(page).toHaveScreenshot(`screen-char-creation-0-${testInfo.project.name}.png`, {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('scenario select', async ({ page }, testInfo) => {
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
    await page.addStyleTag({ content: FREEZE_CSS });
    await expect(page).toHaveScreenshot(`screen-scenario-select-${testInfo.project.name}.png`, {
      fullPage: true,
      animations: 'disabled',
    });
  });
});

// ─────────────────────────────────────────────────────────────
// SUITE: IN-GAME SCREENS
// ─────────────────────────────────────────────────────────────

test.describe('screenshots — in-game screens', () => {
  test('game — dashboard panel', async ({ page }, testInfo) => {
    await reachDashboard(page);
    await pauseGame(page);
    await page.addStyleTag({ content: FREEZE_CSS });
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot(`screen-game-dashboard-${testInfo.project.name}.png`, {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('game — economy panel', async ({ page }, testInfo) => {
    await reachDashboard(page);
    await pauseGame(page);
    await openPanel(page, 'Economy');
    await page.addStyleTag({ content: FREEZE_CSS });
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot(`screen-game-economy-${testInfo.project.name}.png`, {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('game — population panel', async ({ page }, testInfo) => {
    await reachDashboard(page);
    await pauseGame(page);
    await openPanel(page, 'Population');
    await page.addStyleTag({ content: FREEZE_CSS });
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot(`screen-game-population-${testInfo.project.name}.png`, {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('game — legislation panel', async ({ page }, testInfo) => {
    await reachDashboard(page);
    await pauseGame(page);
    await openPanel(page, 'Legislation');
    await page.addStyleTag({ content: FREEZE_CSS });
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot(`screen-game-legislation-${testInfo.project.name}.png`, {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('game — congress panel', async ({ page }, testInfo) => {
    await reachDashboard(page);
    await pauseGame(page);
    await openPanel(page, 'Congress');
    await page.addStyleTag({ content: FREEZE_CSS });
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot(`screen-game-congress-${testInfo.project.name}.png`, {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('game — skills panel', async ({ page }, testInfo) => {
    await reachDashboard(page);
    await pauseGame(page);
    await openPanel(page, 'Skills');
    await page.addStyleTag({ content: FREEZE_CSS });
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot(`screen-game-skills-${testInfo.project.name}.png`, {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('game — character panel', async ({ page }, testInfo) => {
    await reachDashboard(page);
    await pauseGame(page);
    await openPanel(page, 'Character');
    await page.addStyleTag({ content: FREEZE_CSS });
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot(`screen-game-character-${testInfo.project.name}.png`, {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('game — quests panel', async ({ page }, testInfo) => {
    await reachDashboard(page);
    await pauseGame(page);
    await openPanel(page, 'Quests');
    await page.addStyleTag({ content: FREEZE_CSS });
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot(`screen-game-quests-${testInfo.project.name}.png`, {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('game — knowledge base panel', async ({ page }, testInfo) => {
    await reachDashboard(page);
    await pauseGame(page);
    await openPanel(page, 'Knowledge Base');
    await page.addStyleTag({ content: FREEZE_CSS });
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot(`screen-game-glossary-${testInfo.project.name}.png`, {
      fullPage: true,
      animations: 'disabled',
    });
  });
});
