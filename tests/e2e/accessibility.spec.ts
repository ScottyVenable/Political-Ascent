/**
 * Accessibility spec (scaffold).
 *
 * Runs the structural a11y checks from `fixtures/a11y-fixture.ts`. This is
 * intentionally loose until the real screens exist; today it only enforces
 * the emoji-leak rule (AGENTS.md §2.1) and counts obvious naming gaps.
 *
 * When axe-core/playwright is adopted, swap `runStructuralA11y` for the axe
 * run in the fixture; this spec stays.
 *
 * @see tests/e2e/fixtures/a11y-fixture.ts
 */
import { test, expect } from "./fixtures/a11y-fixture";
import { runStructuralA11y } from "./fixtures/a11y-fixture";

test.describe("accessibility", () => {
  test("initial screen has no emoji leaks and no unnamed controls", async ({
    gamePage,
  }) => {
    const report = await runStructuralA11y(gamePage);

    // Hard rule: zero emoji in visible UI text.
    expect(
      report.emojiLeaks,
      `Emoji leaked into UI: ${JSON.stringify(report.emojiLeaks)}`
    ).toEqual([]);

    // Softer assertions for now; tighten as screens stabilize.
    expect(report.missingAltImages, "img without alt").toBe(0);
    expect(report.unnamedButtons, "buttons without name").toBe(0);
  });
});
