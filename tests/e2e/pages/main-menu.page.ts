/**
 * Main Menu page object.
 *
 * The first screen the player sees: new game / continue / settings / quit.
 * Testids consumed here are declared on the matching component in
 * `src/renderer/screens/MainMenu.tsx` (add them as the screen is built out).
 *
 * @module tests/e2e/pages/main-menu
 */
import { BasePage } from "./base.page";

export class MainMenuPage extends BasePage {
  readonly newGameButton = this.byTestId("menu-new-game");
  readonly continueButton = this.byTestId("menu-continue");
  readonly settingsButton = this.byTestId("menu-settings");
  readonly quitButton = this.byTestId("menu-quit");
  readonly versionLabel = this.byTestId("menu-version");

  async startNewGame() {
    await this.newGameButton.click();
  }

  async openSettings() {
    await this.settingsButton.click();
  }
}
