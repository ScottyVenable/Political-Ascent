import { expect, test } from "@playwright/test";

/**
 * Smoke suite — confirms the app boots and the root document renders.
 *
 * This is a lightweight placeholder that expands as screens come online.
 * Each added screen gets its own spec under `tests/e2e/` with:
 *   - a navigation step,
 *   - a behavioural assertion (what the player should see),
 *   - a full-page screenshot captured at the three viewports defined in
 *     playwright.config.ts.
 *
 * AGENTS.md §5.2 requires committed screenshots for every UI-affecting PR.
 */

test.describe("app boot", () => {
  test("renders the document root", async ({ page }) => {
    await page.goto("/");
    // The Vite dev server serves index.html which mounts React into #root.
    await expect(page.locator("#root")).toBeVisible({ timeout: 10_000 });
  });

  test("captures the initial screen", async ({ page }, testInfo) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    // Name the screenshot by project (viewport) so each viewport lands in its
    // own folder and diffs are grouped cleanly.
    await expect(page).toHaveScreenshot(`initial-${testInfo.project.name}.png`, {
      fullPage: true,
      animations: "disabled",
    });
  });
});
