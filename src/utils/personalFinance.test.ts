/**
 * Tests for personal-finance action math used by CharacterPanel.
 *
 * @module utils/personalFinance.test
 */
import { describe, expect, it } from 'vitest';
import type { CharacterState } from '@/types';
import {
  assetLiquidationDelta,
  campaignSelfFundDelta,
  paidSpeakingDelta,
  personalFinanceActions,
  salaryReimbursementDelta,
} from './personalFinance';

function character(overrides: Partial<CharacterState> = {}): CharacterState {
  return {
    id: 'pc-test',
    name: 'Alex Rivera',
    background: 'citizen',
    avatarId: 'civic-organizer',
    stats: { charisma: 5, strategy: 5, connections: 5, integrity: 5, wealth: 5, stamina: 5 },
    traits: [],
    ideology: { x: 0, y: 0 },
    xp: 0,
    level: 1,
    skillPoints: 0,
    unlockedSkills: [],
    personalFunds: 250_000,
    hand: [],
    deck: [],
    ...overrides,
  };
}

describe('personalFinance action deltas', () => {
  it('computes salary from background and wealth', () => {
    const citizen = character({ background: 'citizen' });
    const executive = character({ background: 'executive' });

    expect(salaryReimbursementDelta(citizen)).toBe(6_000);
    expect(salaryReimbursementDelta(executive)).toBe(9_500);
  });

  it('makes paid speaking scale with charisma and connections', () => {
    const lowSocial = character({ stats: { charisma: 2, strategy: 5, connections: 2, integrity: 5, wealth: 5, stamina: 5 } });
    const highSocial = character({ stats: { charisma: 9, strategy: 5, connections: 9, integrity: 5, wealth: 5, stamina: 5 } });

    expect(paidSpeakingDelta(highSocial)).toBeGreaterThan(paidSpeakingDelta(lowSocial));
  });

  it('makes asset liquidation scale strongly with wealth', () => {
    const lowWealth = character({ stats: { charisma: 5, strategy: 5, connections: 5, integrity: 5, wealth: 2, stamina: 5 } });
    const highWealth = character({ stats: { charisma: 5, strategy: 5, connections: 5, integrity: 5, wealth: 9, stamina: 5 } });

    expect(assetLiquidationDelta(highWealth)).toBeGreaterThan(assetLiquidationDelta(lowWealth));
  });

  it('caps self-funding spend at the available balance', () => {
    const broke = character({ personalFunds: 2_000 });

    expect(campaignSelfFundDelta(broke)).toBe(-2_000);
  });

  it('disables campaign self-funding at zero balance', () => {
    const actions = personalFinanceActions(character({ personalFunds: 0 }));
    const selfFund = actions.find((action) => action.id === 'campaign-self-fund');

    expect(selfFund?.disabled).toBe(true);
    expect(selfFund?.delta).toBe(0);
    expect(selfFund?.treasuryDelta).toBe(0);
  });

  it('self-funding exposes a matching positive Treasury transfer', () => {
    const actions = personalFinanceActions(character({ personalFunds: 100_000 }));
    const selfFund = actions.find((action) => action.id === 'campaign-self-fund');

    expect(selfFund?.delta).toBe(-22_500);
    expect(selfFund?.treasuryDelta).toBe(22_500);
  });

  it('returns three income actions and one expense action', () => {
    const actions = personalFinanceActions(character());

    expect(actions.filter((action) => action.kind === 'income')).toHaveLength(3);
    expect(actions.filter((action) => action.kind === 'expense')).toHaveLength(1);
  });
});
