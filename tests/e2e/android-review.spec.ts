/**
 * Android landscape review spec.
 *
 * Captures every screen and in-game panel at two representative Android
 * landscape resolutions so the team can assess layout, safe-area handling,
 * icon usage, and readability without running a physical device build.
 *
 * Viewports:
 *   - 844 × 390  — "compact phone" (Galaxy S21 / Pixel 6 class)
 *   - 960 × 540  — "large phone / small tablet"
 *
 * These heights are intentionally tight so any vertical cramping in the
 * TopBar / BottomBar / Sidebar is immediately visible.
 *
 * Test coverage:
 *   Pre-game  → Main Menu, Settings, Achievements
 *   Character → Identity (step 0), Stats (step 1), Traits (step 2),
 *               Ideology (step 3), Scenario Select
 *   Game      → Dashboard, Legislation, Congress, Population, Economy,
 *               Quests, Cards, Skills, Character panels
 *
 * Screenshot output:
 *   tests/e2e/__screenshots__/android-review/<vpName>--<label>.png
 *
 * Run via:
 *   npm run test:e2e:android
 *
 * @module tests/e2e/android-review
 */
import { test } from "@playwright/test";
import type { Page } from "@playwright/test";

// ─────────────────────────────────────────────────────────────
// VIEWPORT DEFINITIONS
// ─────────────────────────────────────────────────────────────

/**
 * The two Android landscape breakpoints we audit every PR. Chosen to
 * represent the most common compact handset landscape (390 px tall) and
 * a slightly larger class (540 px tall) that reveals different layout
 * decisions.
 */
const ANDROID_VIEWPORTS = [
  { name: "android-844x390", width: 844, height: 390 },
  { name: "android-960x540", width: 960, height: 540 },
] as const;

// ─────────────────────────────────────────────────────────────
// ZUSTAND STORE TYPE SHIMS
// Minimal shapes used only in type assertions inside page.evaluate()
// callbacks. These are compile-time only — they never exist at runtime.
// ─────────────────────────────────────────────────────────────

interface GameStoreBridge {
  getState: () => { setPaused: (paused: boolean) => void };
}

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

/**
 * Freeze all CSS animations and transitions, wait for the page to be
 * network-idle, then capture a viewport-size screenshot.
 *
 * We freeze animations so pixel comparisons are stable across runs.
 * `fullPage: false` ensures we capture exactly the clamped 100dvh
 * viewport — the same chrome the user sees on a real device.
 */
async function snap(page: Page, label: string, vpName: string): Promise<void> {
  // Inject a one-time style tag that collapses all animation timing.
  // `addStyleTag` is idempotent for string content, so calling it on
  // multiple snaps in one test is safe.
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration:   0s !important;
        animation-delay:      0s !important;
        transition-duration:  0s !important;
        transition-delay:     0s !important;
      }
    `,
  });
  await page.waitForLoadState("networkidle");
  // One extra tick so React finishes any store-subscription renders.
  await page.waitForTimeout(200);
  await page.screenshot({
    path: `tests/e2e/__screenshots__/android-review/${vpName}--${label}.png`,
    fullPage: false,
  });
}

/**
 * Wait for the dev-mode window bridge (installed in src/renderer/index.tsx)
 * to finish its async setup. Called by goToGame before any store access.
 * Times out after 5 s — if the bridge never arrives something is wrong
 * with the build.
 */
async function awaitBridge(page: Page): Promise<void> {
  await page.waitForFunction(
    () =>
      "__routerStore" in window &&
      "__gameStore" in window &&
      "__uiStore" in window,
    { timeout: 5_000 }
  );
}

/**
 * Drives the full character-creation → scenario-select → game flow
 * through the real UI so we exercise the actual interaction paths.
 *
 * Step-by-step:
 *  0. Identity   — type a name (≥ 2 chars); background defaults to "citizen"
 *  1. Stats      — defaults sum to 30 (within 24–36 budget), valid immediately
 *  2. Traits     — click the first listed trait (need ≥ 1 to advance)
 *  3. Ideology   — no constraint; click "Choose Scenario →"
 *     Scenario select — click "Begin" on the first card
 *
 * After this function resolves the active route is 'game' and the Sidebar
 * is visible. The game clock is then paused via the window bridge so the
 * HUD date does not drift while we take screenshots.
 */
async function goToGame(page: Page): Promise<void> {
  // ── Click "New Game" from the main menu ──────────────────────────────
  await page.getByRole("button", { name: /new game/i }).click();
  // Wait for the character-creation heading to confirm the route change.
  await page.waitForSelector("text=Build Your Candidate", { timeout: 8_000 });

  // ── Step 0: Identity ─────────────────────────────────────────────────
  // Type a name. `fill` replaces the input value in one step so we do not
  // have to clear it first.
  await page.fill('input[placeholder*="Jordan"]', "Alex Rivera");
  // Confirm the Next button is now enabled (name length ≥ 2).
  await page.getByRole("button", { name: /^next$/i }).click();
  await page.waitForTimeout(250);

  // ── Step 1: Stats ─────────────────────────────────────────────────────
  // Default stat total is 30 (5 × 6 stats), which is within the 24–36
  // valid budget, so the Next button is immediately enabled.
  await page.waitForSelector("text=Core Stats", { timeout: 4_000 });
  await page.getByRole("button", { name: /^next$/i }).click();
  await page.waitForTimeout(250);

  // ── Step 2: Traits ────────────────────────────────────────────────────
  // At least one trait must be selected (traits.length ≥ 1) to enable Next.
  // Trait buttons live inside the scrollable content area — this selector
  // avoids accidentally targeting the Previous / Next nav buttons which
  // sit in the fixed footer outside the scroll region.
  await page.waitForSelector("text=Pick 1–3", { timeout: 4_000 });
  await page.locator(".overflow-y-auto button").first().click();
  await page.waitForTimeout(200);
  await page.getByRole("button", { name: /^next$/i }).click();
  await page.waitForTimeout(250);

  // ── Step 3: Ideology ──────────────────────────────────────────────────
  // No constraint on the ideology compass; the player can advance regardless
  // of where the dot sits. Click "Choose Scenario →" to commit character.
  await page.waitForSelector("text=Where do you stand?", { timeout: 4_000 });
  await page.getByRole("button", { name: /choose scenario/i }).click();
  await page.waitForTimeout(350);

  // ── Scenario Select ───────────────────────────────────────────────────
  // The scenario card's "Begin" button is disabled if character.name is
  // blank — it won't be because we typed "Alex Rivera" above.
  await page.waitForSelector("text=Choose Your Arena", { timeout: 6_000 });
  await page.getByRole("button", { name: /^begin$/i }).first().click();
  await page.waitForTimeout(500);

  // ── Game shell ────────────────────────────────────────────────────────
  // Wait for the Sidebar to confirm the game screen has mounted.
  await page.waitForSelector("text=Dashboard", { timeout: 8_000 });

  // Pause the game clock immediately so the date does not drift while we
  // move between panels and take screenshots.
  await page.evaluate(() => {
    const gs = (
      window as unknown as { __gameStore?: GameStoreBridge }
    ).__gameStore;
    gs?.getState().setPaused(true);
  });
  await page.waitForTimeout(150);
}

/**
 * Navigate to a specific in-game panel by clicking its Sidebar button.
 *
 * We use an accessible role query so the selector stays robust even if
 * Tailwind class names change. The `exact` flag prevents "Congress" from
 * matching "CongressPanel" text elsewhere on the page.
 */
async function clickPanel(page: Page, label: string): Promise<void> {
  await page.getByRole("button", { name: label, exact: true }).click();
  // Let the panel-enter CSS animation finish (it is a short fade-up in
  // styles.css). We freeze durations in `snap()` later, but we still
  // want React to have committed the new subtree before we screenshot.
  await page.waitForTimeout(300);
}

// ─────────────────────────────────────────────────────────────
// TEST SUITE
// ─────────────────────────────────────────────────────────────

for (const vp of ANDROID_VIEWPORTS) {
  test.describe(`Android landscape ${vp.width}×${vp.height}`, () => {
    // Override the viewport for every test in this block.
    test.use({ viewport: { width: vp.width, height: vp.height } });

    // Boot to the main menu and wait for app initialisation before each test.
    test.beforeEach(async ({ page }) => {
      await page.goto("/");
      await page.waitForSelector("#root", { timeout: 15_000 });
      await page.waitForLoadState("networkidle");
    });

    // ── PRE-GAME SCREENS ──────────────────────────────────────────────

    test("main menu", async ({ page }) => {
      // The app boots directly to the main menu; no interaction needed.
      await snap(page, "main-menu", vp.name);
    });

    test("settings", async ({ page }) => {
      await page.getByRole("button", { name: /settings/i }).click();
      await page.waitForTimeout(300);
      await snap(page, "settings", vp.name);
    });

    test("achievements", async ({ page }) => {
      await page.getByRole("button", { name: /achievements/i }).click();
      await page.waitForTimeout(300);
      await snap(page, "achievements", vp.name);
    });

    // ── CHARACTER CREATION — each step captured individually ──────────

    test("char-creation step 0 identity", async ({ page }) => {
      // Capture step 0 (name + background) before touching anything.
      await page.getByRole("button", { name: /new game/i }).click();
      await page.waitForSelector("text=Build Your Candidate", { timeout: 8_000 });
      await snap(page, "char-step-0-identity", vp.name);
    });

    test("char-creation step 1 stats", async ({ page }) => {
      await page.getByRole("button", { name: /new game/i }).click();
      await page.waitForSelector("text=Build Your Candidate", { timeout: 8_000 });
      await page.fill('input[placeholder*="Jordan"]', "Alex Rivera");
      await page.getByRole("button", { name: /^next$/i }).click();
      await page.waitForSelector("text=Core Stats", { timeout: 4_000 });
      await snap(page, "char-step-1-stats", vp.name);
    });

    test("char-creation step 2 traits", async ({ page }) => {
      await page.getByRole("button", { name: /new game/i }).click();
      await page.waitForSelector("text=Build Your Candidate", { timeout: 8_000 });
      await page.fill('input[placeholder*="Jordan"]', "Alex Rivera");
      await page.getByRole("button", { name: /^next$/i }).click();
      await page.waitForSelector("text=Core Stats", { timeout: 4_000 });
      await page.getByRole("button", { name: /^next$/i }).click();
      await page.waitForSelector("text=Pick 1–3", { timeout: 4_000 });
      await snap(page, "char-step-2-traits", vp.name);
    });

    test("char-creation step 3 ideology", async ({ page }) => {
      await page.getByRole("button", { name: /new game/i }).click();
      await page.waitForSelector("text=Build Your Candidate", { timeout: 8_000 });
      await page.fill('input[placeholder*="Jordan"]', "Alex Rivera");
      await page.getByRole("button", { name: /^next$/i }).click();
      await page.waitForSelector("text=Core Stats", { timeout: 4_000 });
      await page.getByRole("button", { name: /^next$/i }).click();
      await page.waitForSelector("text=Pick 1–3", { timeout: 4_000 });
      // Select the first trait so Next is enabled, then advance.
      await page.locator(".overflow-y-auto button").first().click();
      await page.waitForTimeout(150);
      await page.getByRole("button", { name: /^next$/i }).click();
      await page.waitForSelector("text=Where do you stand?", { timeout: 4_000 });
      await snap(page, "char-step-3-ideology", vp.name);
    });

    test("scenario select", async ({ page }) => {
      // Complete character creation so scenario-select is reachable.
      await page.getByRole("button", { name: /new game/i }).click();
      await page.waitForSelector("text=Build Your Candidate", { timeout: 8_000 });
      await page.fill('input[placeholder*="Jordan"]', "Alex Rivera");
      await page.getByRole("button", { name: /^next$/i }).click();
      await page.waitForSelector("text=Core Stats", { timeout: 4_000 });
      await page.getByRole("button", { name: /^next$/i }).click();
      await page.waitForSelector("text=Pick 1–3", { timeout: 4_000 });
      await page.locator(".overflow-y-auto button").first().click();
      await page.waitForTimeout(150);
      await page.getByRole("button", { name: /^next$/i }).click();
      await page.waitForSelector("text=Where do you stand?", { timeout: 4_000 });
      await page.getByRole("button", { name: /choose scenario/i }).click();
      await page.waitForSelector("text=Choose Your Arena", { timeout: 6_000 });
      await snap(page, "scenario-select", vp.name);
    });

    // ── GAME PANELS ───────────────────────────────────────────────────
    // Each test below navigates all the way to the game screen, then
    // clicks the appropriate Sidebar entry before snapping. This is
    // intentionally end-to-end — it exercises the real flow the player
    // experiences and catches any navigation regression.

    test("game — dashboard", async ({ page }) => {
      await goToGame(page);
      // Dashboard is the default panel; no extra click needed.
      await snap(page, "game-dashboard", vp.name);
    });

    test("game — legislation", async ({ page }) => {
      await goToGame(page);
      await clickPanel(page, "Legislation");
      await snap(page, "game-legislation", vp.name);
    });

    test("game — congress", async ({ page }) => {
      await goToGame(page);
      await clickPanel(page, "Congress");
      await snap(page, "game-congress", vp.name);
    });

    test("game — population", async ({ page }) => {
      await goToGame(page);
      await clickPanel(page, "Population");
      await snap(page, "game-population", vp.name);
    });

    test("game — economy", async ({ page }) => {
      await goToGame(page);
      await clickPanel(page, "Economy");
      await snap(page, "game-economy", vp.name);
    });

    test("game — quests", async ({ page }) => {
      await goToGame(page);
      await clickPanel(page, "Quests");
      await snap(page, "game-quests", vp.name);
    });

    test("game — cards", async ({ page }) => {
      await goToGame(page);
      await clickPanel(page, "Cards");
      await snap(page, "game-cards", vp.name);
    });

    test("game — skills", async ({ page }) => {
      await goToGame(page);
      await clickPanel(page, "Skills");
      await snap(page, "game-skills", vp.name);
    });

    test("game — character sheet", async ({ page }) => {
      await goToGame(page);
      await clickPanel(page, "Character");
      await snap(page, "game-character", vp.name);
    });
  });
}

