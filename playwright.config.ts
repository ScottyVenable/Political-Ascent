import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for Political Ascent.
 *
 * The suite boots Vite dev server (`npm run dev`) against the web build of the
 * game and exercises the UI in Chromium at three viewport sizes mandated by
 * AGENTS.md §5.2. Screenshots are stored under `tests/e2e/__screenshots__/`
 * and are part of the code review artefact — agents must *look at them* and
 * report what they see.
 *
 * Run modes:
 *   npm run test:e2e           Headless, full suite.
 *   npm run test:e2e:ui        Playwright UI mode for local authoring.
 *   npm run test:e2e:update    Refresh committed screenshots (use carefully).
 */
export default defineConfig({
  testDir: "./tests/e2e",
  // Give Vite's dev server plenty of time to boot on cold starts.
  timeout: 30_000,
  expect: {
    // Tiny pixel tolerance keeps anti-aliasing differences from flipping CI red.
    // Anything visually meaningful will still surface as a diff the agent can read.
    toHaveScreenshot: { maxDiffPixelRatio: 0.01 },
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ["list"],
    ["html", { outputFolder: "test-results/playwright-report", open: "never" }],
  ],
  // Always record the full trace on first retry so PR authors can replay
  // failures locally without having to reproduce them manually.
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
    video: "retain-on-failure",
    screenshot: "only-on-failure",
  },

  // Three mandated viewport sizes. Each becomes its own project so they run
  // in parallel and produce clearly-named screenshot folders.
  projects: [
    {
      name: "chromium-1280x720",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 720 } },
    },
    {
      name: "chromium-1440x900",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
    {
      name: "chromium-1920x1080",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1920, height: 1080 } },
    },
    // Mobile portrait — Pixel-class viewport. Used by the
    // mobile-portrait.spec.ts smoke that guards the drawer sidebar,
    // safe-area handling, and TopBar/BottomBar compaction below the
    // `md` breakpoint.
    {
      name: "chromium-pixel-portrait",
      use: {
        ...devices["Pixel 7"],
      },
    },
  ],

  // Boot the Vite dev server before the suite and tear it down afterwards.
  // Reused across projects so we pay the startup cost once.
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: "ignore",
    stderr: "pipe",
  },
});
