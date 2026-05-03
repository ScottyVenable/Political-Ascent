import { describe, it, expect } from 'vitest';
import { composeBillText } from './DraftLegislationScreen';
import type { BillTemplate, PolicyModule } from '@/types';

/**
 * Unit tests for `composeBillText` — the bill-type-aware preview composer.
 *
 * Each bill type should open with a distinct legal preamble:
 *  - resolution   → "Be it Resolved…"
 *  - act          → "An Act to…"
 *  - amendment    → "Proposed Amendment — Resolved…"
 *  - appropriations → "An Act making appropriations…"
 *
 * Riders should follow the opening in player-specified order; later riders
 * should contain "; further, it" to separate them clearly.
 */

/** Minimal template stub — only the fields `composeBillText` reads. */
function makeTemplate(overrides: Partial<BillTemplate> = {}): BillTemplate {
  return {
    id: 'test-bill',
    title: 'Test Bill',
    description: 'improve public health',
    tags: [],
    opposition: 30,
    budgetImpact: -5,
    implementationDays: 90,
    effects: [],
    affectedGroups: [],
    type: 'act',
    ...overrides,
  } as BillTemplate;
}

/** Minimal module stub — only `previewText` is used in composition. */
function makeModule(id: string, previewText: string): PolicyModule {
  return {
    id,
    name: id,
    category: 'fiscal',
    summary: '',
    previewText,
    oppositionDelta: 0,
    budgetImpactDelta: 0,
    effects: [],
  } as PolicyModule;
}

describe('composeBillText', () => {
  describe('type-aware openings (no modules)', () => {
    it('opens with "An Act to…" for type=act', () => {
      const text = composeBillText(makeTemplate({ type: 'act' }), []);
      expect(text).toMatch(/^An Act to improve public health/);
    });

    it('opens with "Be it Resolved…" for type=resolution', () => {
      const text = composeBillText(makeTemplate({ type: 'resolution' }), []);
      expect(text).toMatch(/^Be it Resolved by the Congress/);
      expect(text).toContain('improve public health');
    });

    it('opens with "Proposed Amendment" for type=amendment', () => {
      const text = composeBillText(makeTemplate({ type: 'amendment' }), []);
      expect(text).toMatch(/^Proposed Amendment/);
      expect(text).toContain('two-thirds');
    });

    it('opens with "An Act making appropriations" for type=appropriations', () => {
      const text = composeBillText(makeTemplate({ type: 'appropriations' }), []);
      expect(text).toMatch(/^An Act making appropriations/);
    });

    it('defaults to "An Act to…" when type is undefined', () => {
      // makeTemplate without a type override — type field simply absent.
      const template = makeTemplate({ description: 'improve public health' });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { type: _type, ...templateWithoutType } = template;
      const text = composeBillText(templateWithoutType as BillTemplate, []);
      expect(text).toMatch(/^An Act to/);
    });
  });

  describe('stated purpose', () => {
    it('uses purpose field over description when set', () => {
      const t = makeTemplate({
        type: 'act',
        purpose: 'expand broadband access in rural counties',
      });
      const text = composeBillText(t, []);
      expect(text).toContain('expand broadband access');
      expect(text).not.toContain('improve public health');
    });
  });

  describe('rider ordering', () => {
    it('first rider attaches directly after the opening', () => {
      const t = makeTemplate({ type: 'act' });
      const m = makeModule('m1', 'expires after five years');
      const text = composeBillText(t, [m]);
      expect(text).toContain('expires after five years');
    });

    it('second rider is preceded by "; further, it"', () => {
      const t = makeTemplate({ type: 'act' });
      const m1 = makeModule('m1', 'raises the marginal rate');
      const m2 = makeModule('m2', 'exempts small businesses');
      const text = composeBillText(t, [m1, m2]);
      expect(text).toContain('; further, it exempts small businesses');
    });

    it('rider order matches the module array order', () => {
      const t = makeTemplate({ type: 'resolution' });
      const m1 = makeModule('first', 'does alpha');
      const m2 = makeModule('second', 'does beta');
      const text = composeBillText(t, [m1, m2]);
      expect(text.indexOf('alpha')).toBeLessThan(text.indexOf('beta'));
    });
  });
});
