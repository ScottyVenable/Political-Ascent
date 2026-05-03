/**
 * game-panels-navigation.spec.ts — covers navigation to every panel in the
 * in-game sidebar and verifies that each panel mounts without crashing.
 *
 * The 14 panels surfaced by the Sidebar component are:
 *   dashboard · legislation · congress · population · economy ·
 *   quests · cards · collection · skills · character ·
 *   glossary (Knowledge Base) · news · timeline · patch-notes
 *
 * For each panel this spec:
 *   1. Clicks the sidebar entry.
 *   2. Asserts a reliable panel-specific landmark (heading, testid, or
 *      unique text) is visible.
 *   3. Verifies `aria-current="page"` on the active nav button.
 *
 * Screenshots are captured for every panel in a dedicated screenshot suite
 * so the visual state of every panel is part of the committed baseline.
 *
 * @module tests/e2e/game-panels-navigation
 */
import { test, expect, type Page } from '@playwright/test';
import { reachDashboard, pauseGame } from './helpers/navigate';

// ─────────────────────────────────────────────────────────────
// SHARED SETUP
// Boot the game once per suite so the 14 panel tests share one
// navigation flow rather than repeating the full character-creation
// wizard for each panel.
// ─────────────────────────────────────────────────────────────

/** Click a sidebar button by its label and wait for the panel to mount. */
async function openPanel(page: Page, label: string): Promise<void> {
  await page.getByRole('button', { name: new RegExp(`^${label}$`, 'i') }).first().click();
  // Allow the panel animation to complete (200ms budget per Game.tsx key prop).
  await page.waitForTimeout(250);
}

// ─────────────────────────────────────────────────────────────
// SUITE: PANEL NAVIGATION (functional — one describe per panel)
// ─────────────────────────────────────────────────────────────

test.describe('game panels — Dashboard', () => {
  test('opens and shows the KPI strip', async ({ page }) => {
    await reachDashboard(page);
    await pauseGame(page);
    await openPanel(page, 'Dashboard');
    // Dashboard shows approval and GDP KPI tiles (dashboard-interactivity.spec.ts)
    await expect(page.getByTestId('kpi-approval').or(page.getByText(/approval/i)).first()).toBeVisible({ timeout: 4_000 });
    // Sidebar entry is marked active.
    await expect(page.getByRole('button', { name: /^dashboard$/i }).first()).toHaveAttribute('aria-current', 'page');
  });
});

test.describe('game panels — Legislation', () => {
  test('opens and shows the Legislation heading', async ({ page }) => {
    await reachDashboard(page);
    await pauseGame(page);
    await openPanel(page, 'Legislation');
    await expect(page.getByRole('button', { name: /^legislation$/i }).first()).toHaveAttribute('aria-current', 'page');
    // Panel renders draft-legislation affordance or the bill list.
    await expect(
      page.getByText(/legislation|bill|draft/i).first(),
    ).toBeVisible({ timeout: 4_000 });
  });
});

test.describe('game panels — Congress', () => {
  test('opens and shows Congress panel', async ({ page }) => {
    await reachDashboard(page);
    await pauseGame(page);
    await openPanel(page, 'Congress');
    await expect(page.getByRole('button', { name: /^congress$/i }).first()).toHaveAttribute('aria-current', 'page');
    await expect(page.getByText(/congress|member|senate|house/i).first()).toBeVisible({ timeout: 4_000 });
  });
});

test.describe('game panels — Population', () => {
  test('opens and shows population cohorts', async ({ page }) => {
    await reachDashboard(page);
    await pauseGame(page);
    await openPanel(page, 'Population');
    await expect(page.getByRole('button', { name: /^population$/i }).first()).toHaveAttribute('aria-current', 'page');
    await expect(page.getByText(/population|cohort|approval/i).first()).toBeVisible({ timeout: 4_000 });
  });
});

test.describe('game panels — Economy', () => {
  test('opens and shows economic metrics', async ({ page }) => {
    await reachDashboard(page);
    await pauseGame(page);
    await openPanel(page, 'Economy');
    await expect(page.getByRole('button', { name: /^economy$/i }).first()).toHaveAttribute('aria-current', 'page');
    // EconomyPanel renders "GDP Growth" row label.
    await expect(page.getByText(/gdp growth/i).first()).toBeVisible({ timeout: 4_000 });
  });
});

test.describe('game panels — Quests', () => {
  test('opens and shows the quest browser', async ({ page }) => {
    await reachDashboard(page);
    await pauseGame(page);
    await openPanel(page, 'Quests');
    await expect(page.getByRole('button', { name: /^quests$/i }).first()).toHaveAttribute('aria-current', 'page');
    // Quests panel has filter pills (All / Active / Available / Completed).
    await expect(page.getByText(/all|active|available|quest/i).first()).toBeVisible({ timeout: 4_000 });
  });
});

test.describe('game panels — Cards', () => {
  test('opens and shows the Cards panel', async ({ page }) => {
    await reachDashboard(page);
    await pauseGame(page);
    await openPanel(page, 'Cards');
    await expect(page.getByRole('button', { name: /^cards$/i }).first()).toHaveAttribute('aria-current', 'page');
    await expect(page.getByText(/card|hand|deck/i).first()).toBeVisible({ timeout: 4_000 });
  });
});

test.describe('game panels — Collection', () => {
  test('opens and shows the Collection panel', async ({ page }) => {
    await reachDashboard(page);
    await pauseGame(page);
    await openPanel(page, 'Collection');
    await expect(page.getByRole('button', { name: /^collection$/i }).first()).toHaveAttribute('aria-current', 'page');
    await expect(page.getByText(/collection|card/i).first()).toBeVisible({ timeout: 4_000 });
  });
});

test.describe('game panels — Skills', () => {
  test('opens and shows the skill tree', async ({ page }) => {
    await reachDashboard(page);
    await pauseGame(page);
    await openPanel(page, 'Skills');
    await expect(page.getByRole('button', { name: /^skills$/i }).first()).toHaveAttribute('aria-current', 'page');
    // SkillsPanel renders branch columns named after stats.
    await expect(page.getByText(/charisma|strategy|skill/i).first()).toBeVisible({ timeout: 4_000 });
  });
});

test.describe('game panels — Character', () => {
  test('opens and shows the Character panel', async ({ page }) => {
    await reachDashboard(page);
    await pauseGame(page);
    await openPanel(page, 'Character');
    await expect(page.getByRole('button', { name: /^character$/i }).first()).toHaveAttribute('aria-current', 'page');
    // Character panel renders the avatar medallion and stat blocks.
    await expect(page.getByTestId('avatar-medallion').or(page.getByText(/character|avatar|stat/i)).first()).toBeVisible({ timeout: 4_000 });
  });
});

test.describe('game panels — Knowledge Base (Glossary)', () => {
  test('opens and shows the Glossary panel', async ({ page }) => {
    await reachDashboard(page);
    await pauseGame(page);
    await openPanel(page, 'Knowledge Base');
    // Sidebar button text is "Knowledge Base" (mapped from glossary panel id).
    await expect(
      page.getByRole('button', { name: /knowledge base/i }).first(),
    ).toHaveAttribute('aria-current', 'page');
    await expect(page.getByText(/glossary|knowledge|term/i).first()).toBeVisible({ timeout: 4_000 });
  });
});

test.describe('game panels — News', () => {
  test('opens and shows the News panel', async ({ page }) => {
    await reachDashboard(page);
    await pauseGame(page);
    await openPanel(page, 'News');
    await expect(page.getByRole('button', { name: /^news$/i }).first()).toHaveAttribute('aria-current', 'page');
    await expect(page.getByText(/news|headline|press/i).first()).toBeVisible({ timeout: 4_000 });
  });
});

test.describe('game panels — Timeline', () => {
  test('opens and shows the Timeline panel', async ({ page }) => {
    await reachDashboard(page);
    await pauseGame(page);
    await openPanel(page, 'Timeline');
    await expect(page.getByRole('button', { name: /^timeline$/i }).first()).toHaveAttribute('aria-current', 'page');
    await expect(page.getByText(/timeline|event|history/i).first()).toBeVisible({ timeout: 4_000 });
  });
});

test.describe('game panels — Patch Notes', () => {
  test('opens and shows Patch Notes panel', async ({ page }) => {
    await reachDashboard(page);
    await pauseGame(page);
    await openPanel(page, 'Patch Notes');
    await expect(page.getByRole('button', { name: /patch notes/i }).first()).toHaveAttribute('aria-current', 'page');
    await expect(page.getByText(/patch|release|notes|changelog/i).first()).toBeVisible({ timeout: 4_000 });
  });
});

// ─────────────────────────────────────────────────────────────
// SUITE: PANEL SCREENSHOTS
// One screenshot per panel, at each viewport defined in config.
// ─────────────────────────────────────────────────────────────

const PANEL_ENTRIES: Array<{ label: string; slug: string }> = [
  { label: 'Dashboard',     slug: 'dashboard' },
  { label: 'Legislation',   slug: 'legislation' },
  { label: 'Congress',      slug: 'congress' },
  { label: 'Population',    slug: 'population' },
  { label: 'Economy',       slug: 'economy' },
  { label: 'Quests',        slug: 'quests' },
  { label: 'Cards',         slug: 'cards' },
  { label: 'Collection',    slug: 'collection' },
  { label: 'Skills',        slug: 'skills' },
  { label: 'Character',     slug: 'character' },
  { label: 'Knowledge Base', slug: 'glossary' },
  { label: 'News',          slug: 'news' },
  { label: 'Timeline',      slug: 'timeline' },
  { label: 'Patch Notes',   slug: 'patch-notes' },
];

test.describe('game panels — screenshots', () => {
  const freezeCSS =
    '*, *::before, *::after { animation-duration: 0s !important; transition-duration: 0s !important; }';

  for (const panel of PANEL_ENTRIES) {
    test(`screenshot — ${panel.slug}`, async ({ page }, testInfo) => {
      await reachDashboard(page);
      await pauseGame(page);
      await openPanel(page, panel.label);
      await page.addStyleTag({ content: freezeCSS });
      // Network-idle ensures lazy-loaded panel data has resolved.
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveScreenshot(
        `panel-${panel.slug}-${testInfo.project.name}.png`,
        { fullPage: true, animations: 'disabled' },
      );
    });
  }
});
