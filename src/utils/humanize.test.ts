/**
 * Tests for the humanize utility (todo#75).
 *
 * Coverage targets:
 *  - Generic `humaniseId` round-trips for camelCase, kebab-case,
 *    snake_case, mixed, and degenerate inputs.
 *  - Each typed lookup (`humaniseResource`, `humaniseEconomyMetric`,
 *    `humaniseCohortId`, `humaniseStat`) returns its dictionary value
 *    when present and falls back to the generic humaniser otherwise.
 */
import { describe, it, expect } from 'vitest';
import {
  humaniseId,
  humaniseResource,
  humaniseEconomyMetric,
  humaniseCohortId,
  humaniseStat,
  RESOURCE_LABEL,
  ECONOMY_LABEL,
  COHORT_LABEL,
} from './humanize';

describe('humaniseId', () => {
  it('splits camelCase into Title Case', () => {
    expect(humaniseId('politicalCapital')).toBe('Political Capital');
    expect(humaniseId('actionPoints')).toBe('Action Points');
  });

  it('splits kebab-case and snake_case', () => {
    expect(humaniseId('working-class')).toBe('Working Class');
    expect(humaniseId('young_voters')).toBe('Young Voters');
  });

  it('handles single-word ids', () => {
    expect(humaniseId('students')).toBe('Students');
  });

  it('returns the empty string for empty input', () => {
    expect(humaniseId('')).toBe('');
  });

  it('collapses repeated separators', () => {
    expect(humaniseId('foo--bar__baz')).toBe('Foo Bar Baz');
  });
});

describe('typed lookups', () => {
  it('returns dictionary values for known ids', () => {
    expect(humaniseResource('politicalCapital')).toBe(RESOURCE_LABEL.politicalCapital);
    expect(humaniseEconomyMetric('gdpGrowth')).toBe(ECONOMY_LABEL.gdpGrowth);
    expect(humaniseCohortId('working-class')).toBe(COHORT_LABEL['working-class']);
    expect(humaniseStat('charisma')).toBe('Charisma');
  });

  it('falls back to humaniseId for unknown ids', () => {
    // Made-up ids should still produce something readable so modders
    // adding new content do not see raw camelCase in the UI.
    expect(humaniseResource('mediaInfluence')).toBe('Media Influence');
    expect(humaniseEconomyMetric('reservesRatio')).toBe('Reserves Ratio');
    expect(humaniseCohortId('rural-farmers')).toBe('Rural Farmers');
    expect(humaniseStat('streetSmarts')).toBe('Street Smarts');
  });
});
