/**
 * Wait helpers for Political Ascent e2e specs.
 *
 * Playwright's built-in auto-waiting covers most cases. These helpers cover
 * the game-specific signals: the simulation clock tick, the data-loader
 * finishing its boot validation, and the dashboard settling after an
 * advance-turn click.
 *
 * @module tests/e2e/helpers/wait
 */
import type { Page } from "@playwright/test";

/** Wait for the `#root` element to become visible; 10s default. */
export async function waitForAppBoot(page: Page, timeoutMs = 10_000) {
  await page.waitForSelector("#root", { state: "visible", timeout: timeoutMs });
  await page.waitForLoadState("networkidle");
}

/**
 * Wait for the HUD date label to change from `current` to anything else.
 * Useful after advance-turn clicks when the spec needs to know the simulation
 * actually moved before asserting downstream effects.
 */
export async function waitForDateChange(
  page: Page,
  current: string,
  timeoutMs = 5_000
) {
  await page.waitForFunction(
    (snapshot: string) => {
      const el = document.querySelector('[data-testid="hud-date"]');
      return el ? (el.textContent ?? "").trim() !== snapshot : false;
    },
    current,
    { timeout: timeoutMs }
  );
}
