/**
 * Tests for the term category → underline decoration mapping (todo#51).
 *
 * The function under test maps a tooltip's `subtitle` to a Tailwind
 * decoration class so that inline `Term` chips read as visually
 * grouped by category. We assert:
 *
 *  - Known categories return their dedicated decoration class.
 *  - Matching is case-insensitive and tolerates surrounding whitespace.
 *  - Unknown / undefined / empty subtitles fall back to the original
 *    gold-on-60% decoration so legacy tooltips look unchanged.
 *
 * No DOM rendering is needed; this is pure-function coverage.
 */
import { describe, it, expect } from 'vitest';
import { termCategoryDecorationClass } from './ExtendedTooltip';

describe('termCategoryDecorationClass', () => {
  it('returns the gold fallback when the subtitle is missing', () => {
    expect(termCategoryDecorationClass(undefined)).toBe('decoration-accent-gold/60');
    expect(termCategoryDecorationClass('')).toBe('decoration-accent-gold/60');
  });

  it('matches each known category to a unique decoration class', () => {
    // The spread of categories should produce nine *distinct* classes.
    // We collect them into a Set and check the size as a fast way to
    // catch accidental duplicate mappings introduced during refactors.
    const classes = [
      termCategoryDecorationClass('Resource'),
      termCategoryDecorationClass('Stat'),
      termCategoryDecorationClass('Mechanic'),
      termCategoryDecorationClass('Concept'),
      termCategoryDecorationClass('Legislation'),
      termCategoryDecorationClass('Action'),
      termCategoryDecorationClass('Population'),
      termCategoryDecorationClass('Economy'),
      termCategoryDecorationClass('Cohort metric'),
      termCategoryDecorationClass('Event'),
    ];
    expect(new Set(classes).size).toBe(classes.length);
    // Every entry should be a `decoration-*` Tailwind class.
    for (const cls of classes) expect(cls.startsWith('decoration-')).toBe(true);
  });

  it('matches case-insensitively and trims surrounding whitespace', () => {
    expect(termCategoryDecorationClass('STAT')).toBe(termCategoryDecorationClass('stat'));
    expect(termCategoryDecorationClass('  Resource  ')).toBe(
      termCategoryDecorationClass('resource'),
    );
  });

  it('falls back to the gold decoration for unknown subtitles', () => {
    expect(termCategoryDecorationClass('Unknown category')).toBe('decoration-accent-gold/60');
    expect(termCategoryDecorationClass('faction')).toBe('decoration-accent-gold/60');
  });
});
