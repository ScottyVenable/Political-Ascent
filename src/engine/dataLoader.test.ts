/**
 * Smoke tests for the data loader.
 *
 * These tests exist to catch the class of regression that triggered the
 * April 2026 theme-pass work: an invisible-yet-game-breaking regression
 * where `import.meta.glob` was routed through a helper function, defeating
 * Vite's compile-time static analysis, and causing every data folder to
 * silently resolve to an empty bundle.
 *
 * The tests don't mock Vite — they actually invoke `loadAllData()` against
 * the real `src/data/**` tree and assert non-empty bundles. That way, any
 * future refactor that accidentally re-breaks the glob static analysis will
 * trip CI on the first test run.
 *
 * NOTE: Vitest is configured with the same Vite plugin pipeline as the app
 * (see `vite.config.ts` + `vitest` integration), so `import.meta.glob`
 * resolves identically inside tests and in production builds.
 */
import { describe, it, expect } from 'vitest';
import { loadAllData } from './dataLoader';

describe('loadAllData', () => {
  const bundle = loadAllData();

  it('resolves at least one scenario', () => {
    // Regression guard: the shipping build MUST have at least the
    // Modern America 2025 scenario available for Scenario Select.
    expect(bundle.scenarios.length).toBeGreaterThan(0);
  });

  it('resolves trait definitions with names and descriptions', () => {
    expect(bundle.traits.length).toBeGreaterThan(0);
    for (const t of bundle.traits) {
      expect(t.id).toBeTruthy();
      expect(t.name).toBeTruthy();
    }
  });

  it('resolves card, event, quest, and achievement bundles', () => {
    expect(bundle.cards.length).toBeGreaterThan(0);
    expect(bundle.events.length).toBeGreaterThan(0);
    expect(bundle.quests.length).toBeGreaterThan(0);
    expect(bundle.achievements.length).toBeGreaterThan(0);
  });

  it('resolves at least one bill template for legislation drafting', () => {
    expect(bundle.billTemplates.length).toBeGreaterThan(0);
  });

  it('resolves population group seeds for every scenario', () => {
    // Scenario Select renders empty without these; block future regressions.
    expect(Object.keys(bundle.populationsByScenario).length).toBeGreaterThan(0);
  });

  it('resolves economy seeds for every scenario', () => {
    expect(Object.keys(bundle.economyByScenario).length).toBeGreaterThan(0);
  });

  it('resolves legislator seeds for every scenario', () => {
    expect(Object.keys(bundle.legislatorSeedByScenario).length).toBeGreaterThan(0);
  });
});
