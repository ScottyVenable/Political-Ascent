/**
 * Tooltip registry — registration, lookup, and override semantics.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  registerTooltip,
  getTooltip,
  allTooltipIds,
  clearTooltips,
} from './registry';

describe('tooltip registry', () => {
  beforeEach(() => {
    clearTooltips();
  });

  it('returns undefined for unknown ids', () => {
    expect(getTooltip('nope')).toBeUndefined();
  });

  it('round-trips a registered tooltip', () => {
    registerTooltip({
      id: 'foo',
      title: 'Foo',
      sections: [{ kind: 'paragraph', text: 'hello' }],
    });
    const t = getTooltip('foo');
    expect(t?.title).toBe('Foo');
  });

  it('later registrations override earlier ones with the same id', () => {
    registerTooltip({
      id: 'foo',
      title: 'Original',
      sections: [],
    });
    registerTooltip({
      id: 'foo',
      title: 'Updated',
      sections: [],
    });
    expect(getTooltip('foo')?.title).toBe('Updated');
  });

  it('lists ids in registration order', () => {
    registerTooltip({ id: 'a', title: 'A', sections: [] });
    registerTooltip({ id: 'b', title: 'B', sections: [] });
    registerTooltip({ id: 'c', title: 'C', sections: [] });
    expect(allTooltipIds()).toEqual(['a', 'b', 'c']);
  });

  it('clearTooltips empties the registry', () => {
    registerTooltip({ id: 'a', title: 'A', sections: [] });
    clearTooltips();
    expect(allTooltipIds()).toEqual([]);
  });
});
