/**
 * Live-play harness.
 *
 * Unlike the regular spec files, this one is intended to be run **headed and
 * paused** so the Lead Director (or an agent with Playwright MCP access) can
 * drive the game interactively and still have the full Playwright API
 * available for assertions, screenshots, and traces.
 *
 * Run:
 *     npm run play:live
 *
 * The harness navigates to the game root, mounts the page objects, and hands
 * control to `page.pause()`, which opens the Playwright Inspector. Close the
 * inspector to end the run.
 *
 * This is a test file by file extension only; it is excluded from CI via the
 * `@live` tag filter in the CI npm scripts.
 *
 * @module tests/e2e/live/playground
 */
import { test } from "../fixtures/game-fixture";
import { MainMenuPage } from "../pages/main-menu.page";
import { DashboardPage } from "../pages/dashboard.page";

test.describe("@live live-play harness", () => {
  test("interactive session", async ({ gamePage }) => {
    const mainMenu = new MainMenuPage(gamePage);
    const dashboard = new DashboardPage(gamePage);
    // Exposed for quick access in the inspector console:
    //   await mainMenu.startNewGame();
    //   await dashboard.advanceOneWeek();
    void mainMenu;
    void dashboard;

    // Hand control to the human/agent. The inspector lets you click, type,
    // evaluate expressions, and take screenshots on demand.
    await gamePage.pause();
  });
});
