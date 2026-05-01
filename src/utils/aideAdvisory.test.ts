/**
 * Unit tests for `src/utils/aideAdvisory.ts`.
 */
import { describe, it, expect } from 'vitest';
import { selectAideAdvisory } from './aideAdvisory';
import type { BillTemplate, PolicyModule } from '@/types';

function bill(overrides: Partial<BillTemplate> = {}): BillTemplate {
  return {
    id: 't',
    title: 't',
    description: 't',
    tags: ['economy'],
    budgetImpact: 0,
    pcCost: { committee: 10, floor: 10, vote: 10 },
    opposition: 30,
    implementationDays: 30,
    effects: [],
    affectedGroups: [],
    ...overrides,
  };
}

function fiscalModule(): PolicyModule {
  return {
    id: 'module-fiscal',
    name: 'Some fiscal',
    category: 'fiscal',
    summary: '',
    previewText: '',
    oppositionDelta: 0,
    budgetImpactDelta: 0,
    effects: [],
  };
}

describe('selectAideAdvisory', () => {
  it('warns when an appropriations bill has no fiscal module', () => {
    const r = selectAideAdvisory({
      synthesised: bill({ type: 'appropriations' }),
      activeModules: [],
    });
    expect(r?.tone).toBe('warning');
    expect(r?.headline).toMatch(/fiscal module/i);
  });

  it('does not warn when an appropriations bill includes a fiscal module', () => {
    // The fiscal-module guard should not fire; some other rule may or may
    // not return one — we only assert the *appropriations* warning is gone.
    const r = selectAideAdvisory({
      synthesised: bill({ type: 'appropriations' }),
      activeModules: [fiscalModule()],
    });
    expect(r?.headline ?? '').not.toMatch(/fiscal module/i);
  });

  it('warns when an amendment cannot clear the 2/3 floor', () => {
    const r = selectAideAdvisory({
      synthesised: bill({ type: 'amendment', opposition: 70 }),
      activeModules: [],
    });
    expect(r?.headline).toMatch(/floor levels/i);
  });

  it('warns when opposition is above 75', () => {
    const r = selectAideAdvisory({
      synthesised: bill({ opposition: 85 }),
      activeModules: [],
    });
    expect(r?.headline).toMatch(/hostile/i);
  });

  it('warns when budget impact is below -30', () => {
    const r = selectAideAdvisory({
      synthesised: bill({ budgetImpact: -50 }),
      activeModules: [],
    });
    expect(r?.headline).toMatch(/30B\/yr/i);
  });

  it('flags an empty rider list as info', () => {
    const r = selectAideAdvisory({
      synthesised: bill(),
      activeModules: [],
    });
    expect(r?.tone).toBe('info');
    expect(r?.headline).toMatch(/no riders/i);
  });

  it('flags Christmas-tree bills (5+ riders) as info', () => {
    const mods = Array.from({ length: 5 }, (_, i) => ({
      ...fiscalModule(),
      id: `m-${i}`,
    }));
    const r = selectAideAdvisory({
      synthesised: bill(),
      activeModules: mods,
    });
    expect(r?.headline).toMatch(/christmas-tree/i);
  });

  it('returns the positive "clean draft" advisory when nothing else fires', () => {
    const r = selectAideAdvisory({
      synthesised: bill({ opposition: 30, budgetImpact: 0 }),
      activeModules: [fiscalModule(), { ...fiscalModule(), id: 'm2' }],
    });
    expect(r?.tone).toBe('positive');
    expect(r?.headline).toMatch(/clean draft/i);
  });

  it('returns null when no rule applies', () => {
    // 1 module + opposition 60 + neutral budget — none of the rules match.
    const r = selectAideAdvisory({
      synthesised: bill({ opposition: 60 }),
      activeModules: [fiscalModule()],
    });
    expect(r).toBeNull();
  });
});
