/**
 * Visual helpers for consistent screenshots.
 *
 * Provides a single entry point `captureScreen(page, name)` that:
 *   - disables animations and caret blink
 *   - waits for network idle
 *   - freezes the clock via a deterministic `Date.now()` override (optional)
 *
 * Specs that opt into `freezeClock` get pixel-stable HUDs even when the
 * simulation is running, which makes the screenshot diff a real signal.
 *
 * @module tests/e2e/helpers/visual
 */
import type { Page, TestInfo } from "@playwright/test";
import { expect } from "@playwright/test";

export interface CaptureOptions {
  /** Disable CSS animations and scroll-related transitions. */
  freezeAnimations?: boolean;
  /** Override `Date.now()` to a constant so clock-driven UI is stable. */
  freezeClockAt?: number;
  /** Screenshot only this element instead of the full page. */
  selector?: string;
}

/**
 * Take a named screenshot and compare against the committed baseline.
 *
 * Screenshot file is `<name>-<project>.png` where `<project>` is the Playwright
 * project (viewport) so each viewport lands in its own folder.
 */
export async function captureScreen(
  page: Page,
  testInfo: TestInfo,
  name: string,
  options: CaptureOptions = {}
) {
  const { freezeAnimations = true, freezeClockAt, selector } = options;

  if (freezeClockAt !== undefined) {
    await page.addInitScript((epoch: number) => {
      const RealDate = Date;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis as any).Date = class extends RealDate {
        constructor(...args: unknown[]) {
          if (args.length === 0) {
            super(epoch);
          } else {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            super(...(args as any));
          }
        }
        static now() {
          return epoch;
        }
      };
    }, freezeClockAt);
  }

  await page.waitForLoadState("networkidle");
  const target = selector ? page.locator(selector) : page;
  await expect(target).toHaveScreenshot(`${name}-${testInfo.project.name}.png`, {
    fullPage: selector ? undefined : true,
    animations: freezeAnimations ? "disabled" : undefined,
  });
}
