/**
 * Shared selectors and testid conventions.
 *
 * All production components expose `data-testid` in kebab-case. This file
 * centralizes the convention so both the component author and the spec author
 * can import the exact same ids instead of hand-copying strings.
 *
 * @module tests/e2e/helpers/selectors
 */

export const TestIds = {
  // HUD
  hudDate: "hud-date",
  hudPoliticalCapital: "hud-political-capital",
  hudApproval: "hud-approval",
  hudAdvanceTurn: "hud-advance-turn",

  // Navigation
  navDashboard: "nav-dashboard",
  navLegislation: "nav-legislation",
  navCongress: "nav-congress",
  navPopulation: "nav-population",
  navEconomy: "nav-economy",
  navSettings: "nav-settings",

  // Character creation
  characterName: "character-name",
  characterBackground: "character-background",
  characterTraits: "character-traits",
  characterConfirm: "character-confirm",

  // Main menu
  menuNewGame: "menu-new-game",
  menuContinue: "menu-continue",
  menuSettings: "menu-settings",
  menuQuit: "menu-quit",
  menuVersion: "menu-version",
} as const;

export type TestIdKey = keyof typeof TestIds;
