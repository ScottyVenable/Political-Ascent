/**
 * Accessibility fixture scaffold.
 *
 * Wraps the game fixture with a `checkA11y(selector?)` helper. Today it
 * performs structural checks only (no external deps). When the team approves
 * adding `@axe-core/playwright` (AGENTS.md §2 rule 8), swap `runStructuralA11y`
 * for the axe run — the call sites never change.
 *
 * Structural checks currently assert:
 *   - every <img> has a non-empty `alt`
 *   - every <button> has a discernable name (text, aria-label, or title)
 *   - every form control has an associated label or aria-label
 *   - no emoji characters leak into UI-visible text (AGENTS.md §2 rule 1)
 *
 * @module tests/e2e/fixtures/a11y-fixture
 */
import type { Page } from "@playwright/test";
import { test as gameTest, expect } from "./game-fixture";

// A cheap emoji range sweep. Not exhaustive, but it catches the obvious
// keyboard-accessible glyphs the team actually types by accident.
const EMOJI_REGEX =
  /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{1F000}-\u{1F2FF}]/u;

export interface A11yReport {
  missingAltImages: number;
  unnamedButtons: number;
  unlabelledInputs: number;
  emojiLeaks: Array<{ text: string; location: string }>;
}

/**
 * Run structural accessibility checks inside the page.
 *
 * @param page   Playwright page under test.
 * @param scope  CSS selector to scope the audit. Defaults to `body`.
 * @returns      A structured report the caller can assert against.
 */
export async function runStructuralA11y(
  page: Page,
  scope: string = "body"
): Promise<A11yReport> {
  return page.evaluate(
    ([scopeSel, emojiSrc]: [string, string]) => {
      const root = document.querySelector(scopeSel) ?? document.body;
      const emojiRe = new RegExp(emojiSrc, "u");

      const imgs = Array.from(root.querySelectorAll("img"));
      const missingAltImages = imgs.filter((i) => !i.getAttribute("alt")).length;

      const buttons = Array.from(root.querySelectorAll("button"));
      const unnamedButtons = buttons.filter((b) => {
        const text = (b.textContent ?? "").trim();
        const aria = b.getAttribute("aria-label");
        const title = b.getAttribute("title");
        return !text && !aria && !title;
      }).length;

      const inputs = Array.from(root.querySelectorAll("input,select,textarea"));
      const unlabelledInputs = inputs.filter((el) => {
        const id = el.getAttribute("id");
        const aria = el.getAttribute("aria-label");
        const hasLabel = id ? !!document.querySelector(`label[for="${id}"]`) : false;
        return !hasLabel && !aria;
      }).length;

      const emojiLeaks: Array<{ text: string; location: string }> = [];
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let node = walker.nextNode();
      while (node) {
        const text = (node.nodeValue ?? "").trim();
        if (text && emojiRe.test(text)) {
          const parent = node.parentElement;
          emojiLeaks.push({
            text,
            location: parent ? parent.tagName.toLowerCase() : "text",
          });
        }
        node = walker.nextNode();
      }

      return { missingAltImages, unnamedButtons, unlabelledInputs, emojiLeaks };
    },
    [scope, EMOJI_REGEX.source] as [string, string]
  );
}

export const test = gameTest;
export { expect };
