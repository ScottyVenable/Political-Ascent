/**
 * Character Creation page object.
 *
 * Drives the background selection, trait picking, and skill allocation flow.
 * Intentionally narrow — only the actions specs need. Extend as the screen
 * grows (e.g., rerolling portraits, importing presets).
 *
 * @module tests/e2e/pages/character-creation
 */
import { BasePage } from "./base.page";

export class CharacterCreationPage extends BasePage {
  readonly nameInput = this.byTestId("character-name");
  readonly backgroundSelect = this.byTestId("character-background");
  readonly traitList = this.byTestId("character-traits");
  readonly confirmButton = this.byTestId("character-confirm");

  /**
   * Fill the character form with a deterministic preset.
   * Uses stable background/trait ids so screenshot diffs stay meaningful.
   */
  async fill({
    name,
    background,
    traits,
  }: {
    name: string;
    background: string;
    traits: string[];
  }) {
    await this.nameInput.fill(name);
    await this.backgroundSelect.selectOption(background);
    for (const traitId of traits) {
      await this.traitList.locator(`[data-trait-id="${traitId}"]`).click();
    }
  }

  async confirm() {
    await this.confirmButton.click();
  }
}
