/**
 * Tests for the stat-tier helper.
 */
import { describe, it, expect } from 'vitest';
import {
  statTier,
  statTierLabel,
  statTierChipClass,
} from './statTier';

describe('statTier', () => {
  it('classifies the canonical breakpoints', () => {
    expect(statTier(1)).toBe('weak');
    expect(statTier(3)).toBe('weak');
    expect(statTier(4)).toBe('average');
    expect(statTier(5)).toBe('average');
    expect(statTier(6)).toBe('strong');
    expect(statTier(7)).toBe('strong');
    expect(statTier(8)).toBe('exceptional');
    expect(statTier(10)).toBe('exceptional');
  });

  it('clamps out-of-range inputs', () => {
    expect(statTier(-5)).toBe('weak');
    expect(statTier(99)).toBe('exceptional');
  });

  it('returns average for non-finite inputs', () => {
    expect(statTier(Number.NaN)).toBe('average');
    // Infinities are not finite -> the helper falls back to 'average'
    // rather than clamping. Documents the current contract.
    expect(statTier(Number.POSITIVE_INFINITY)).toBe('average');
    expect(statTier(Number.NEGATIVE_INFINITY)).toBe('average');
  });

  it('returns a label per tier', () => {
    expect(statTierLabel('weak')).toBe('Weak');
    expect(statTierLabel('exceptional')).toBe('Exceptional');
  });

  it('returns a non-empty class string per tier', () => {
    expect(statTierChipClass('weak')).toContain('status-danger');
    expect(statTierChipClass('average')).toContain('text-secondary');
    expect(statTierChipClass('strong')).toContain('accent-gold');
    expect(statTierChipClass('exceptional')).toContain('accent-blue');
  });
});
