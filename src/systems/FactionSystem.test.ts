import { describe, it, expect, beforeEach } from 'vitest';
import { FactionSystem } from './FactionSystem';

describe('FactionSystem scaffold', () => {
  beforeEach(() => {
    FactionSystem.registerFactions([
      { id: 'labor', name: 'Labor Bloc' },
      { id: 'industry', name: 'Industry Coalition' },
    ]);
    FactionSystem.setStanding('labor', 0);
    FactionSystem.setStanding('industry', 0);
  });

  it('clamps standings into -100..100', () => {
    FactionSystem.setStanding('labor', 150);
    FactionSystem.setStanding('industry', -150);

    const state = FactionSystem.getState();
    expect(state.standings.labor).toBe(100);
    expect(state.standings.industry).toBe(-100);
  });

  it('applyBillOutcome adjusts sponsor standing with wired inputs', () => {
    FactionSystem.applyBillOutcome({
      billId: 'bill-1',
      passed: true,
      tags: ['economy'],
      sponsorFactionId: 'labor',
    });

    FactionSystem.applyBillOutcome({
      billId: 'bill-2',
      passed: false,
      tags: ['taxation'],
      sponsorFactionId: 'labor',
    });

    const state = FactionSystem.getState();
    expect(state.standings.labor).toBe(0);
  });
});
