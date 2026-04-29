/**
 * Tooltip auto-matcher tests — surface scanning, alias resolution,
 * overlap rejection, longest-first preference.
 *
 * These tests exercise `findTermMatches` against a fresh registry per
 * case so we never depend on the production glossary.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  registerTooltip,
  clearTooltips,
  findTermMatches,
} from './registry';

describe('findTermMatches', () => {
  beforeEach(() => {
    clearTooltips();
  });

  it('returns no matches for an empty registry', () => {
    expect(findTermMatches('Spend PC to whip a vote.')).toEqual([]);
  });

  it('returns no matches for empty text', () => {
    registerTooltip({ id: 'pc', title: 'Political Capital', sections: [], aliases: ['PC'] });
    expect(findTermMatches('')).toEqual([]);
  });

  it('matches a registered title (case-insensitive)', () => {
    registerTooltip({ id: 'pc', title: 'Political Capital', sections: [] });
    const m = findTermMatches('Spend political capital wisely.');
    expect(m).toHaveLength(1);
    expect(m[0].id).toBe('pc');
    expect(m[0].surface).toBe('political capital');
  });

  it('matches aliases as well as titles', () => {
    registerTooltip({
      id: 'pc',
      title: 'Political Capital',
      sections: [],
      aliases: ['PC'],
    });
    const m = findTermMatches('Spend PC and political capital here.');
    expect(m.map((x) => x.surface)).toEqual(['PC', 'political capital']);
    expect(m.every((x) => x.id === 'pc')).toBe(true);
  });

  it('preserves original casing in the surface field', () => {
    registerTooltip({ id: 'pc', title: 'Political Capital', sections: [] });
    const m = findTermMatches('POLITICAL CAPITAL is shouted here.');
    expect(m[0].surface).toBe('POLITICAL CAPITAL');
  });

  it('only matches whole words — "AP" does not match inside "trapping"', () => {
    registerTooltip({
      id: 'ap',
      title: 'Action Points',
      sections: [],
      aliases: ['AP'],
    });
    expect(findTermMatches('A trapping for the unwary.')).toEqual([]);
  });

  it('returns matches in document order', () => {
    registerTooltip({ id: 'pc', title: 'Political Capital', sections: [] });
    registerTooltip({ id: 'ap', title: 'Action Points', sections: [] });
    const m = findTermMatches('First Action Points then Political Capital.');
    expect(m.map((x) => x.id)).toEqual(['ap', 'pc']);
    expect(m[0].start).toBeLessThan(m[1].start);
  });

  it('prefers the longer surface when two terms overlap', () => {
    // Registering a short alias and a longer title that contains it.
    registerTooltip({
      id: 'capital',
      title: 'Capital',
      sections: [],
    });
    registerTooltip({
      id: 'pc',
      title: 'Political Capital',
      sections: [],
    });
    const m = findTermMatches('We need political capital now.');
    expect(m).toHaveLength(1);
    expect(m[0].id).toBe('pc');
    expect(m[0].surface).toBe('political capital');
  });

  it('emits non-overlapping ranges for adjacent terms', () => {
    registerTooltip({ id: 'pc', title: 'PC', sections: [] });
    registerTooltip({ id: 'ap', title: 'AP', sections: [] });
    const m = findTermMatches('Spend PC AP here.');
    expect(m).toHaveLength(2);
    expect(m[0].end).toBeLessThanOrEqual(m[1].start);
  });

  it('handles multiple occurrences of the same term', () => {
    registerTooltip({ id: 'pc', title: 'PC', sections: [] });
    const m = findTermMatches('PC then PC again then PC.');
    expect(m).toHaveLength(3);
    expect(m.every((x) => x.id === 'pc')).toBe(true);
  });

  it('escapes regex metacharacters in surfaces', () => {
    registerTooltip({
      id: 'cpp',
      title: 'C++',
      sections: [],
      aliases: ['C++'],
    });
    const m = findTermMatches('We taught the AI C++ today.');
    expect(m).toHaveLength(1);
    expect(m[0].surface).toBe('C++');
  });
});
