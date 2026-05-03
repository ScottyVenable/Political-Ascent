/**
 * Tests for legislative module analysis helpers.
 *
 * These lock down the math behind deep-draft rider stacks so the UI can
 * explain complexity, public appeal, fiscal strain, and incompatibilities
 * without drifting away from the actual synthesized bill.
 *
 * @module utils/legislativeModules.test
 */
import { describe, expect, it } from 'vitest';
import type { PolicyModule } from '@/types';
import {
  analyzePolicyModules,
  findModuleConflicts,
  moduleComplexity,
  modulePublicAppeal,
  summarizeEffect,
} from './legislativeModules';

const popularModule: PolicyModule = {
  id: 'popular',
  name: 'Popular Pilot',
  category: 'procedural',
  strategicRole: 'coalition_builder',
  summary: 'A popular pilot.',
  previewText: 'creates a popular pilot',
  oppositionDelta: -4,
  budgetImpactDelta: -10,
  complexity: 6,
  publicAppeal: 12,
  recommendedTags: ['economy'],
  effects: [{ type: 'group_happiness', group: 'working-class', value: 3 }],
};

const expensiveModule: PolicyModule = {
  id: 'expensive',
  name: 'Expensive Benefit',
  category: 'fiscal',
  strategicRole: 'benefit_expansion',
  summary: 'A costly benefit.',
  previewText: 'adds a costly benefit',
  oppositionDelta: 10,
  budgetImpactDelta: -300,
  complexity: 18,
  publicAppeal: 4,
  recommendedTags: ['education'],
  effects: [],
};

const conflictingModule: PolicyModule = {
  id: 'conflict',
  name: 'Conflicting Benefit',
  category: 'fiscal',
  summary: 'Conflicts with expensive benefit.',
  previewText: 'adds a conflicting benefit',
  oppositionDelta: 5,
  budgetImpactDelta: -50,
  incompatibleWith: ['expensive'],
  effects: [],
};

describe('legislative module analysis', () => {
  it('uses explicit complexity and public appeal when provided', () => {
    expect(moduleComplexity(popularModule)).toBe(6);
    expect(modulePublicAppeal(popularModule)).toBe(12);
  });

  it('detects selected incompatible modules', () => {
    const conflicts = findModuleConflicts([expensiveModule, conflictingModule]);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].moduleName).toBe('Conflicting Benefit');
  });

  it('combines opposition, complexity, appeal, diversity, and fiscal strain', () => {
    const analysis = analyzePolicyModules({ opposition: 45, budgetImpact: 0, tags: ['economy'] }, [
      popularModule,
      expensiveModule,
    ]);

    expect(analysis.budgetImpact).toBe(-310);
    expect(analysis.complexity).toBe(24);
    expect(analysis.categoryDiversity).toBe(2);
    expect(analysis.fiscalStrainPenalty).toBeGreaterThan(0);
    expect(analysis.finalOpposition).toBeGreaterThanOrEqual(0);
    expect(analysis.finalOpposition).toBeLessThanOrEqual(100);
    expect(analysis.warnings.some((warning) => warning.message.includes('fiscally heavy'))).toBe(
      true,
    );
  });

  it('summarizes effects into compact player text', () => {
    expect(summarizeEffect({ type: 'economy', metric: 'gdpGrowth', value: 0.2 })).toBe(
      'gdpGrowth +0.2',
    );
    expect(summarizeEffect({ type: 'group_happiness', group: 'students', value: -2 })).toBe(
      'students mood -2',
    );
  });
});
