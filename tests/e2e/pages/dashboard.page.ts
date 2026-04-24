/**
 * Dashboard page object.
 *
 * The primary in-game screen once a campaign is running. Exposes the most
 * common observations a test makes: current date, political capital,
 * approval rating, the top headline, and navigation to sub-panels.
 *
 * @module tests/e2e/pages/dashboard
 */
import { BasePage } from "./base.page";

export class DashboardPage extends BasePage {
  readonly dateLabel = this.byTestId("hud-date");
  readonly politicalCapital = this.byTestId("hud-political-capital");
  readonly approvalRating = this.byTestId("hud-approval");
  readonly topHeadline = this.byTestId("dashboard-headline-0");

  readonly navLegislation = this.byTestId("nav-legislation");
  readonly navCongress = this.byTestId("nav-congress");
  readonly navPopulation = this.byTestId("nav-population");
  readonly navEconomy = this.byTestId("nav-economy");
  readonly navSettings = this.byTestId("nav-settings");

  readonly advanceTurnButton = this.byTestId("hud-advance-turn");

  /**
   * Advance one full simulated week and wait for the HUD to settle.
   * Returning the date *after* the advance lets specs assert forward progress.
   */
  async advanceOneWeek(): Promise<string> {
    await this.advanceTurnButton.click();
    await this.page.waitForLoadState("networkidle");
    return (await this.dateLabel.textContent()) ?? "";
  }
}
