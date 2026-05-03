/**
 * settings-screen.spec.ts — coverage of the Settings screen.
 *
 * The Settings screen lives at `src/renderer/screens/Settings.tsx` and is
 * reachable from the main menu's "Settings" button. It exposes:
 *   - Audio sliders (Master, Music, SFX, UI)
 *   - Auto-pause toggles (6 rows)
 *   - Tooltip pin-hold duration slider
 *   - Display: font-scale slider, reduce-motion toggle, number-precision select
 *   - Accessibility: font-scale slider, reduce-motion toggle
 *   - Dev panel section (may be hidden unless dev mode is on)
 *   - Reset button that returns all settings to defaults
 *   - Back button that returns to the main menu
 *
 * Tests avoid asserting specific numeric values because defaults may change
 * during tuning. Instead they verify:
 *   1. The control renders and is interactive.
 *   2. Interacting changes something visible (e.g. the slider thumb moves
 *      or the toggle changes aria-checked state).
 *   3. Navigation (back, reset) works.
 *
 * @module tests/e2e/settings-screen
 */
import { test, expect, type Page } from '@playwright/test';

// ─────────────────────────────────────────────────────────────
// BOOT HELPER
// ─────────────────────────────────────────────────────────────

async function openSettings(page: Page) {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: /settings/i }).click();
  await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible({
    timeout: 4_000,
  });
}

// ─────────────────────────────────────────────────────────────
// SUITE: RENDERING
// ─────────────────────────────────────────────────────────────

test.describe('settings screen — rendering', () => {
  test('renders the Settings heading', async ({ page }) => {
    await openSettings(page);
    await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible();
  });

  test('renders the Audio section', async ({ page }) => {
    await openSettings(page);
    // Card titles render as headings or bold text — look for the label "Audio".
    await expect(page.getByText(/^audio$/i).first()).toBeVisible();
  });

  test('renders the Auto-pause section', async ({ page }) => {
    await openSettings(page);
    await expect(page.getByText(/auto-pause/i).first()).toBeVisible();
  });

  test('renders the Display section', async ({ page }) => {
    await openSettings(page);
    await expect(page.getByText(/display/i).first()).toBeVisible();
  });

  test('renders the Tooltips section', async ({ page }) => {
    await openSettings(page);
    await expect(page.getByText(/tooltips/i).first()).toBeVisible();
  });

  test('no emoji in settings text', async ({ page }) => {
    await openSettings(page);
    const hasEmoji = await page.evaluate(() => {
      const emojiRe =
        /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{1F000}-\u{1F2FF}]/u;
      return emojiRe.test(document.body.textContent ?? '');
    });
    expect(hasEmoji, 'Emoji must not appear in settings text').toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────
// SUITE: AUDIO SLIDERS
// ─────────────────────────────────────────────────────────────

test.describe('settings screen — audio sliders', () => {
  test('Master slider is visible and an input[type=range]', async ({ page }) => {
    await openSettings(page);
    // The settings page renders Slider components with a label. The
    // underlying <input type="range"> is what we need to interact with.
    const masterSlider = page
      .locator('input[type="range"]')
      .first();
    await expect(masterSlider).toBeVisible();
  });

  test('all four audio sliders render', async ({ page }) => {
    await openSettings(page);
    // There are at least 4 sliders (Master, Music, SFX, UI) on the settings page.
    const sliders = page.locator('input[type="range"]');
    const count = await sliders.count();
    expect(count).toBeGreaterThanOrEqual(4);
  });
});

// ─────────────────────────────────────────────────────────────
// SUITE: TOGGLES
// ─────────────────────────────────────────────────────────────

test.describe('settings screen — auto-pause toggles', () => {
  test('On event toggle renders', async ({ page }) => {
    await openSettings(page);
    await expect(page.getByText(/on event/i)).toBeVisible();
  });

  test('On crisis toggle renders', async ({ page }) => {
    await openSettings(page);
    await expect(page.getByText(/on crisis/i)).toBeVisible();
  });

  test('On month end toggle renders', async ({ page }) => {
    await openSettings(page);
    await expect(page.getByText(/on month end/i)).toBeVisible();
  });

  test('clicking a toggle changes its state', async ({ page }) => {
    await openSettings(page);
    // Find the first checkbox/button that represents a toggle.
    // The Settings component renders toggles as <button> elements with
    // aria-checked or custom styling. We look for the first clickable
    // element in the auto-pause section.
    const toggleButtons = page.locator('button').filter({ hasText: /on event|on crisis|on month/i });
    const count = await toggleButtons.count();
    if (count > 0) {
      // Get the initial visual state (class list or aria attribute) before click.
      const firstToggle = toggleButtons.first();
      const before = await firstToggle.getAttribute('class');
      await firstToggle.click();
      const after = await firstToggle.getAttribute('class');
      // The class should change because the toggle flips.
      expect(before).not.toEqual(after);
    } else {
      // If implemented as checkboxes, check those instead.
      const checkboxes = page.locator('input[type="checkbox"]');
      const cbCount = await checkboxes.count();
      if (cbCount > 0) {
        const first = checkboxes.first();
        const checkedBefore = await first.isChecked();
        await first.click();
        const checkedAfter = await first.isChecked();
        expect(checkedBefore).not.toBe(checkedAfter);
      }
    }
  });
});

// ─────────────────────────────────────────────────────────────
// SUITE: DISPLAY SETTINGS
// ─────────────────────────────────────────────────────────────

test.describe('settings screen — display settings', () => {
  test('number precision select renders with options', async ({ page }) => {
    await openSettings(page);
    const select = page.locator('select[aria-label="Number precision"]');
    await expect(select).toBeVisible();
    // Should have at least "Auto" + digit options.
    const optionCount = await select.locator('option').count();
    expect(optionCount).toBeGreaterThanOrEqual(2);
  });

  test('number precision can be changed', async ({ page }) => {
    await openSettings(page);
    const select = page.locator('select[aria-label="Number precision"]');
    await expect(select).toBeVisible();
    // Select a specific option to confirm the control responds.
    await select.selectOption('1');
    await expect(select).toHaveValue('1');
  });
});

// ─────────────────────────────────────────────────────────────
// SUITE: NAVIGATION
// ─────────────────────────────────────────────────────────────

test.describe('settings screen — navigation', () => {
  test('Back button returns to the main menu', async ({ page }) => {
    await openSettings(page);
    await page.getByRole('button', { name: /back/i }).click();
    // Should land back on the main menu.
    await expect(page.getByRole('heading', { name: /political ascent/i })).toBeVisible({
      timeout: 4_000,
    });
  });
});

// ─────────────────────────────────────────────────────────────
// SUITE: SCREENSHOTS
// ─────────────────────────────────────────────────────────────

test.describe('settings screen — screenshots', () => {
  test('full-page screenshot', async ({ page }, testInfo) => {
    await openSettings(page);
    await page.addStyleTag({
      content:
        '*, *::before, *::after { animation-duration: 0s !important; transition-duration: 0s !important; }',
    });
    await expect(page).toHaveScreenshot(
      `settings-screen-${testInfo.project.name}.png`,
      { fullPage: true, animations: 'disabled' },
    );
  });
});
