/**
 * Visual regression spec.
 *
 * Captures deterministic screenshots of the initial screen at every project
 * viewport. Expands as new screens come online; each new screen gets one
 * "freshly loaded" capture here and a richer spec next to its page object.
 *
 * @see tests/e2e/helpers/visual.ts
 */
import { test, expect } from "./fixtures/game-fixture";
import { captureScreen } from "./helpers/visual";

test.describe("visual regression", () => {
  test("initial screen matches baseline", async ({ gamePage }, testInfo) => {
    await captureScreen(gamePage, testInfo, "initial", {
      freezeAnimations: true,
    });
  });

  test("document root is visible", async ({ gamePage }) => {
    await expect(gamePage.locator("#root")).toBeVisible();
  });
});
