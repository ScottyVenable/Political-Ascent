/**
 * Page Object base class for Political Ascent e2e specs.
 *
 * Page Objects are the boundary between "what the UI looks like" (selectors,
 * DOM shape) and "what the player does" (intents: sign a bill, open a card).
 * Specs should read like player narrative; all brittleness lives here.
 *
 * Convention: production UI components expose `data-testid` attributes so
 * specs never depend on class names, text strings, or DOM position.
 *
 * @module tests/e2e/pages/base
 */
import type { Page, Locator } from "@playwright/test";

export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  /** Resolve an element by its `data-testid`. */
  protected byTestId(id: string): Locator {
    return this.page.locator(`[data-testid="${id}"]`);
  }

  /** Full-page screenshot with animations frozen for determinism. */
  async snapshot(name: string) {
    await this.page.waitForLoadState("networkidle");
    return this.page.screenshot({ fullPage: true, animations: "disabled", path: undefined }).then(
      (buffer) => ({ name, buffer })
    );
  }
}
