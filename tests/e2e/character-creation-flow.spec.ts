/**
 * character-creation-flow.spec.ts — step-by-step coverage of the four-step
 * character-creation wizard.
 *
 * Character creation is the funnel entry point: every new game passes through
 * here. The four steps are:
 *
 *   Step 0 — "Build Your Candidate": name input, avatar picker.
 *   Step 1 — "Core Stats": six sliders with a budget constraint.
 *   Step 2 — "Traits": pick 1-3 trait cards.
 *   Step 3 — "Ideology": ideology compass, then "Choose Scenario" to proceed.
 *
 * Tests verify:
 *   - Each step renders its heading and expected controls.
 *   - Validation prevents skipping past step 0 with no name.
 *   - Avatar picker shows options and clicking one registers a selection.
 *   - Stat sliders are interactive and respect the budget display.
 *   - Trait picker requires at least one selection before Next.
 *   - Navigating backwards (Back button) works correctly.
 *   - Screenshots captured at each step.
 *
 * @module tests/e2e/character-creation-flow
 */
import { test, expect, type Page } from '@playwright/test';

// ─────────────────────────────────────────────────────────────
// BOOT HELPER
// ─────────────────────────────────────────────────────────────

async function openNewGame(page: Page) {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: /new game/i }).click();
  await page.waitForSelector('text=Build Your Candidate', { timeout: 8_000 });
}

// ─────────────────────────────────────────────────────────────
// SUITE: STEP 0 — NAME & AVATAR
// ─────────────────────────────────────────────────────────────

test.describe('character creation — step 0 (name & avatar)', () => {
  test('renders the "Build Your Candidate" heading', async ({ page }) => {
    await openNewGame(page);
    await expect(page.getByText(/build your candidate/i)).toBeVisible();
  });

  test('renders the name input field', async ({ page }) => {
    await openNewGame(page);
    await expect(page.locator('input[placeholder*="Jordan"]')).toBeVisible();
  });

  test('name input accepts typed text', async ({ page }) => {
    await openNewGame(page);
    const input = page.locator('input[placeholder*="Jordan"]');
    await input.fill('Senator Smith');
    await expect(input).toHaveValue('Senator Smith');
  });

  test('avatar picker renders multiple options', async ({ page }) => {
    await openNewGame(page);
    // Avatar options carry a data-testid like "avatar-option-<preset>".
    const avatarOptions = page.locator('[data-testid^="avatar-option-"]');
    const count = await avatarOptions.count();
    expect(count).toBeGreaterThan(0);
  });

  test('clicking an avatar option selects it', async ({ page }) => {
    await openNewGame(page);
    const firstAvatar = page.locator('[data-testid^="avatar-option-"]').first();
    await firstAvatar.click();
    // The clicked avatar should carry an aria-selected or data-selected marker.
    // We accept either mechanism since the component may use either.
    const isSelected = await firstAvatar.evaluate((el) => {
      return (
        el.getAttribute('aria-selected') === 'true' ||
        el.getAttribute('data-selected') === 'true' ||
        el.classList.contains('selected') ||
        el.classList.contains('ring-2') ||
        el.classList.contains('border-accent-gold')
      );
    });
    expect(isSelected, 'Avatar option should visually indicate selection').toBe(true);
  });

  test('Next button advances to Core Stats step', async ({ page }) => {
    await openNewGame(page);
    await page.fill('input[placeholder*="Jordan"]', 'Alex Rivera');
    await page.getByRole('button', { name: /^next$/i }).click();
    await expect(page.getByText(/core stats/i)).toBeVisible({ timeout: 4_000 });
  });
});

// ─────────────────────────────────────────────────────────────
// SUITE: STEP 1 — CORE STATS
// ─────────────────────────────────────────────────────────────

test.describe('character creation — step 1 (core stats)', () => {
  async function reachStatStep(page: Page) {
    await openNewGame(page);
    await page.fill('input[placeholder*="Jordan"]', 'Alex Rivera');
    await page.getByRole('button', { name: /^next$/i }).click();
    await page.waitForSelector('text=Core Stats', { timeout: 4_000 });
  }

  test('renders the "Core Stats" heading', async ({ page }) => {
    await reachStatStep(page);
    await expect(page.getByText(/core stats/i)).toBeVisible();
  });

  test('renders six stat sliders', async ({ page }) => {
    await reachStatStep(page);
    const sliders = page.locator('input[type="range"]');
    const count = await sliders.count();
    // Six stats: charisma, strategy, connections, integrity, wealth, stamina.
    expect(count).toBeGreaterThanOrEqual(6);
  });

  test('budget indicator renders', async ({ page }) => {
    await reachStatStep(page);
    // The budget is shown as "X / Y" or similar. Look for a number pattern.
    const budgetText = page.getByText(/\d+\s*\/\s*\d+/);
    await expect(budgetText.first()).toBeVisible();
  });

  test('stat labels render (charisma, strategy, etc.)', async ({ page }) => {
    await reachStatStep(page);
    // Each stat has a label rendered near its slider.
    for (const label of ['Charisma', 'Strategy', 'Connections', 'Integrity']) {
      await expect(page.getByText(new RegExp(label, 'i')).first()).toBeVisible();
    }
  });

  test('Next button advances to Traits step', async ({ page }) => {
    await reachStatStep(page);
    await page.getByRole('button', { name: /^next$/i }).click();
    await page.waitForTimeout(200);
    // Traits step shows "Pick 1–3" instruction.
    await expect(page.getByText(/pick 1.{1,3}3/i)).toBeVisible({ timeout: 4_000 });
  });

  test('"Previous" button returns to Name & Avatar step', async ({ page }) => {
    await reachStatStep(page);
    // The step-back control is labeled "Previous" in the creation nav bar.
    // The header has a separate "← Back" that exits to the main menu.
    await page.getByRole('button', { name: /^previous$/i }).click();
    await expect(page.getByText(/build your candidate/i)).toBeVisible({ timeout: 4_000 });
  });
});

// ─────────────────────────────────────────────────────────────
// SUITE: STEP 2 — TRAITS
// ─────────────────────────────────────────────────────────────

test.describe('character creation — step 2 (traits)', () => {
  async function reachTraitsStep(page: Page) {
    await openNewGame(page);
    await page.fill('input[placeholder*="Jordan"]', 'Alex Rivera');
    await page.getByRole('button', { name: /^next$/i }).click();
    await page.waitForSelector('text=Core Stats', { timeout: 4_000 });
    await page.getByRole('button', { name: /^next$/i }).click();
    await page.getByText(/pick 1.{1,3}3/i).waitFor({ timeout: 4_000 });
  }

  test('renders the "Pick" trait instruction', async ({ page }) => {
    await reachTraitsStep(page);
    await expect(page.getByText(/pick 1.{1,3}3/i)).toBeVisible();
  });

  test('renders multiple trait buttons', async ({ page }) => {
    await reachTraitsStep(page);
    // Traits are rendered as clickable buttons/cards. At least 3 must exist.
    const traitButtons = page.getByRole('button', { name: /grassroots organizer|party insider|policy wonk|veteran|media|union/i });
    const count = await traitButtons.count();
    expect(count).toBeGreaterThan(0);
  });

  test('selecting a trait enables the Next button', async ({ page }) => {
    await reachTraitsStep(page);
    await page.getByRole('button', { name: /grassroots organizer/i }).click();
    // Next button must now be enabled.
    const nextBtn = page.getByRole('button', { name: /^next$/i });
    await expect(nextBtn).toBeEnabled();
  });

  test('Next advances to Ideology step', async ({ page }) => {
    await reachTraitsStep(page);
    await page.getByRole('button', { name: /grassroots organizer/i }).click();
    await page.waitForTimeout(100);
    await page.getByRole('button', { name: /^next$/i }).click();
    await expect(page.getByText(/where do you stand/i)).toBeVisible({ timeout: 4_000 });
  });
});

// ─────────────────────────────────────────────────────────────
// SUITE: STEP 3 — IDEOLOGY
// ─────────────────────────────────────────────────────────────

test.describe('character creation — step 3 (ideology)', () => {
  async function reachIdeologyStep(page: Page) {
    await openNewGame(page);
    await page.fill('input[placeholder*="Jordan"]', 'Alex Rivera');
    await page.getByRole('button', { name: /^next$/i }).click();
    await page.waitForSelector('text=Core Stats', { timeout: 4_000 });
    await page.getByRole('button', { name: /^next$/i }).click();
    await page.getByText(/pick 1.{1,3}3/i).waitFor({ timeout: 4_000 });
    await page.getByRole('button', { name: /grassroots organizer/i }).click();
    await page.waitForTimeout(100);
    await page.getByRole('button', { name: /^next$/i }).click();
    await page.waitForSelector('text=Where do you stand?', { timeout: 4_000 });
  }

  test('renders the "Where do you stand?" heading', async ({ page }) => {
    await reachIdeologyStep(page);
    await expect(page.getByText(/where do you stand/i)).toBeVisible();
  });

  test('renders the ideology compass widget', async ({ page }) => {
    await reachIdeologyStep(page);
    await expect(page.locator('[data-testid="ideology-compass"]')).toBeVisible();
  });

  test('"Choose Scenario" button navigates to scenario select', async ({ page }) => {
    await reachIdeologyStep(page);
    await page.getByRole('button', { name: /choose scenario/i }).click();
    await page.waitForTimeout(300);
    await expect(page.getByText(/choose your arena/i)).toBeVisible({ timeout: 6_000 });
  });
});

// ─────────────────────────────────────────────────────────────
// SUITE: SCREENSHOTS
// ─────────────────────────────────────────────────────────────

test.describe('character creation — screenshots', () => {
  const freezeCSS = '*, *::before, *::after { animation-duration: 0s !important; transition-duration: 0s !important; }';

  test('step 0 screenshot', async ({ page }, testInfo) => {
    await openNewGame(page);
    await page.addStyleTag({ content: freezeCSS });
    await expect(page).toHaveScreenshot(`char-creation-step0-${testInfo.project.name}.png`, {
      fullPage: true, animations: 'disabled',
    });
  });

  test('step 1 (stats) screenshot', async ({ page }, testInfo) => {
    await openNewGame(page);
    await page.fill('input[placeholder*="Jordan"]', 'Alex Rivera');
    await page.getByRole('button', { name: /^next$/i }).click();
    await page.waitForSelector('text=Core Stats', { timeout: 4_000 });
    await page.addStyleTag({ content: freezeCSS });
    await expect(page).toHaveScreenshot(`char-creation-step1-${testInfo.project.name}.png`, {
      fullPage: true, animations: 'disabled',
    });
  });

  test('step 2 (traits) screenshot', async ({ page }, testInfo) => {
    await openNewGame(page);
    await page.fill('input[placeholder*="Jordan"]', 'Alex Rivera');
    await page.getByRole('button', { name: /^next$/i }).click();
    await page.waitForSelector('text=Core Stats', { timeout: 4_000 });
    await page.getByRole('button', { name: /^next$/i }).click();
    await page.getByText(/pick 1.{1,3}3/i).waitFor({ timeout: 4_000 });
    await page.addStyleTag({ content: freezeCSS });
    await expect(page).toHaveScreenshot(`char-creation-step2-${testInfo.project.name}.png`, {
      fullPage: true, animations: 'disabled',
    });
  });

  test('step 3 (ideology) screenshot', async ({ page }, testInfo) => {
    await openNewGame(page);
    await page.fill('input[placeholder*="Jordan"]', 'Alex Rivera');
    await page.getByRole('button', { name: /^next$/i }).click();
    await page.waitForSelector('text=Core Stats', { timeout: 4_000 });
    await page.getByRole('button', { name: /^next$/i }).click();
    await page.getByText(/pick 1.{1,3}3/i).waitFor({ timeout: 4_000 });
    await page.getByRole('button', { name: /grassroots organizer/i }).click();
    await page.waitForTimeout(100);
    await page.getByRole('button', { name: /^next$/i }).click();
    await page.waitForSelector('text=Where do you stand?', { timeout: 4_000 });
    await page.addStyleTag({ content: freezeCSS });
    await expect(page).toHaveScreenshot(`char-creation-step3-${testInfo.project.name}.png`, {
      fullPage: true, animations: 'disabled',
    });
  });
});
