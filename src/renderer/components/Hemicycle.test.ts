/**
 * Tests for the parliament-arc layout algorithm.
 *
 * We don't test pixel positions exactly (too brittle), but we verify
 * the invariants that would cause a visibly-broken chart:
 *   - Every legislator gets a seat (no drop-outs, no extras).
 *   - All seats land inside the SVG viewport.
 *   - Seats are sorted left-to-right by ideology.x.
 */
import { describe, it, expect } from 'vitest';
import { layoutHemicycle } from './Hemicycle';
import type { Legislator } from '@/types';

function mkLeg(i: number, x: number): Legislator {
  return {
    id: `l_${i}` as Legislator['id'],
    name: `Leg ${i}`,
    chamber: 'senate',
    party: x < -0.1 ? 'D' : x > 0.1 ? 'R' : 'I',
    state: 'XX',
    ideology: { x, y: 0 },
    priorities: [],
    personality: 'pragmatist',
    relationship: 0,
    leverage: 50,
    votingHistory: {},
    termEndsYear: 2030,
  };
}

describe('layoutHemicycle', () => {
  it('produces one seat per legislator', () => {
    const legs = Array.from({ length: 100 }, (_, i) => mkLeg(i, (i - 50) / 50));
    const { seats } = layoutHemicycle(legs, 520);
    expect(seats).toHaveLength(100);
  });

  it('keeps all seats inside the computed viewport', () => {
    const legs = Array.from({ length: 435 }, (_, i) => mkLeg(i, (i - 217) / 217));
    const { seats, viewHeight, seatR } = layoutHemicycle(legs, 800);
    for (const s of seats) {
      expect(s.x).toBeGreaterThanOrEqual(-seatR);
      expect(s.x).toBeLessThanOrEqual(800 + seatR);
      expect(s.y).toBeGreaterThanOrEqual(-seatR);
      expect(s.y).toBeLessThanOrEqual(viewHeight + seatR);
    }
  });

  it('orders seats left-to-right by ideology.x', () => {
    const legs = Array.from({ length: 50 }, (_, i) => mkLeg(i, (i - 25) / 25));
    const { seats } = layoutHemicycle(legs, 400);
    // The leftmost seat (lowest x coordinate) should be a D; the
    // rightmost should be an R.
    const sortedByX = [...seats].sort((a, b) => a.x - b.x);
    expect(sortedByX[0]?.legislator.party).toBe('D');
    expect(sortedByX[sortedByX.length - 1]?.legislator.party).toBe('R');
  });

  it('handles an empty chamber without crashing', () => {
    const { seats } = layoutHemicycle([], 400);
    expect(seats).toEqual([]);
  });
});
