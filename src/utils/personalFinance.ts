/**
 * Personal-finance action helpers for the Character screen.
 *
 * Where this fits in the architecture:
 *   - `CharacterPanel.tsx` uses these helpers to turn a character's
 *     current stats/background/funds into a small, deterministic list
 *     of finance actions. The store still owns the balance mutation;
 *     this module only describes the action math and labels.
 *   - Keeping the math pure lets us unit-test the money deltas without
 *     mounting the renderer, and it keeps the renderer focused on
 *     presentation.
 *
 * Why this exists (todo#74):
 *   - `personalFunds` was already tracked on the character, but the
 *     Character screen only displayed it. These actions give the player
 *     ways to raise or deploy that balance while we wait for deeper
 *     staff/campaign-finance systems.
 *   - Every amount is deterministic and stat-scaled. No randomness is
 *     used, so repeated test runs and save/load flows remain stable.
 *
 * @module utils/personalFinance
 */
import type { Background, CharacterState } from '@/types';

/** The four finance actions surfaced in the Character screen. */
export type PersonalFinanceActionId =
  | 'salary-reimbursement'
  | 'paid-speaking'
  | 'asset-liquidation'
  | 'campaign-self-fund';

/** Whether an action increases or decreases personal funds. */
export type PersonalFinanceActionKind = 'income' | 'expense';

/** One deterministic action that can change the character's money. */
export interface PersonalFinanceAction {
  id: PersonalFinanceActionId;
  label: string;
  kind: PersonalFinanceActionKind;
  /** Signed dollar delta to pass to `characterStore.adjustFunds`. */
  delta: number;
  /** Optional signed Treasury delta for transfer-style actions. */
  treasuryDelta?: number;
  /** Short gameplay-facing description shown under the action label. */
  description: string;
  /** Disabled when the character cannot afford the spend action. */
  disabled: boolean;
}

const BACKGROUND_INCOME_MULTIPLIER: Record<Background, number> = {
  citizen: 1,
  veteran: 1.15,
  executive: 1.6,
};

/**
 * Round finance deltas to a clean $500 step.
 *
 * Political Ascent displays money compactly (`$12.5K`, `$1.2M`), so
 * tiny dollar-level precision reads as fake detail. Rounding to $500
 * keeps action results legible while preserving enough granularity for
 * stats/background to matter.
 */
function roundMoney(amount: number): number {
  return Math.max(0, Math.round(amount / 500) * 500);
}

/**
 * Derive the monthly salary/reimbursement deposit.
 *
 * Wealth has a small effect here because a wealthier character has
 * better accountants and reimbursement discipline, but this remains
 * the smallest income route: salary should feel reliable, not decisive.
 */
export function salaryReimbursementDelta(character: CharacterState): number {
  const base = 4_800;
  const wealthBump = character.stats.wealth * 250;
  return roundMoney((base + wealthBump) * BACKGROUND_INCOME_MULTIPLIER[character.background]);
}

/**
 * Derive paid-speaking income.
 *
 * Charisma sells the room; connections get the booking. This keeps the
 * action aligned with the Build Profile "Persuasion" axis and makes a
 * high-social build visibly better at monetising attention.
 */
export function paidSpeakingDelta(character: CharacterState): number {
  const base = 6_000;
  const charismaBump = character.stats.charisma * 1_800;
  const networkBump = character.stats.connections * 1_200;
  return roundMoney((base + charismaBump + networkBump) * BACKGROUND_INCOME_MULTIPLIER[character.background]);
}

/**
 * Derive asset-liquidation income.
 *
 * This is the big emergency lever. It scales mostly with Wealth and a
 * little with Background so executives can convert assets into cash
 * faster than a grassroots citizen, without making every other income
 * source irrelevant at low levels.
 */
export function assetLiquidationDelta(character: CharacterState): number {
  const base = 12_500;
  const wealthBump = character.stats.wealth * 9_000;
  return roundMoney((base + wealthBump) * BACKGROUND_INCOME_MULTIPLIER[character.background]);
}

/**
 * Derive the recommended self-funding spend.
 *
 * Spending is intentionally capped to a fraction of current personal
 * funds. The Character screen is not a campaign-finance simulator yet,
 * so this avoids a one-click accidental wipeout while still making the
 * balance interact with the rest of the game economy later.
 */
export function campaignSelfFundDelta(character: CharacterState): number {
  const available = character.personalFunds ?? 0;
  if (available <= 0) return 0;
  const target = 10_000 + character.stats.wealth * 2_500;
  return -roundMoney(Math.min(available, target));
}

/**
 * Build the Character screen's finance actions for the current player.
 *
 * @param character Current persisted character state.
 * @returns Deterministic finance actions with signed deltas. Positive
 *          values increase `personalFunds`; negative values spend it.
 *
 * @example
 * const [salary] = personalFinanceActions(character);
 * adjustFunds(salary.delta);
 */
export function personalFinanceActions(character: CharacterState): PersonalFinanceAction[] {
  const campaignDelta = campaignSelfFundDelta(character);

  return [
    {
      id: 'salary-reimbursement',
      label: 'Salary + reimbursements',
      kind: 'income',
      delta: salaryReimbursementDelta(character),
      description: 'Reliable office income, scaled lightly by wealth and background.',
      disabled: false,
    },
    {
      id: 'paid-speaking',
      label: 'Paid speaking circuit',
      kind: 'income',
      delta: paidSpeakingDelta(character),
      description: 'Monetises charisma and connections into immediate cash.',
      disabled: false,
    },
    {
      id: 'asset-liquidation',
      label: 'Liquidate assets',
      kind: 'income',
      delta: assetLiquidationDelta(character),
      description: 'Convert private holdings into campaign-ready money.',
      disabled: false,
    },
    {
      id: 'campaign-self-fund',
      label: 'Self-fund campaign',
      kind: 'expense',
      delta: campaignDelta,
      treasuryDelta: Math.abs(campaignDelta),
      description: 'Move private money into Treasury without overdrafting.',
      disabled: campaignDelta === 0,
    },
  ];
}
