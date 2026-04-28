import { describe, it, expect } from 'vitest';
import { ideologyLabel } from './ideologyLabel';

describe('ideologyLabel', () => {
  it('returns Centrist at the origin', () => {
    expect(ideologyLabel({ x: 0, y: 0 })).toBe('Centrist');
  });

  it('returns Centrist anywhere inside the deadzone', () => {
    expect(ideologyLabel({ x: 0.1, y: -0.1 })).toBe('Centrist');
  });

  it('uses single-axis label when perpendicular axis is in the deadzone', () => {
    expect(ideologyLabel({ x: -0.5, y: 0.05 })).toBe('Left');
    expect(ideologyLabel({ x: 0.05, y: 0.5 })).toBe('Authoritarian');
  });

  it('compounds quadrant when both axes are out of the deadzone', () => {
    expect(ideologyLabel({ x: -0.5, y: -0.5 })).toBe('Left-Libertarian');
    expect(ideologyLabel({ x: 0.5, y: 0.5 })).toBe('Right-Authoritarian');
  });

  it('prefixes "Moderate" for low-intensity points', () => {
    expect(ideologyLabel({ x: -0.3, y: -0.3 })).toBe('Moderate Left-Libertarian');
  });

  it('prefixes "Strong" for high-intensity points', () => {
    expect(ideologyLabel({ x: 0.85, y: -0.6 })).toBe('Strong Right-Libertarian');
  });

  it('uses the max axis magnitude for intensity, not the norm', () => {
    // x is strong, y is moderate — should still read as "Strong".
    expect(ideologyLabel({ x: -0.8, y: 0.3 })).toBe('Strong Left-Authoritarian');
  });
});
