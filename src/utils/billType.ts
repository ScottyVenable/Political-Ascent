/**
 * Bill-type modifiers — see `docs/LEGISLATION_OVERHAUL_PLAN.md` §3.1.
 *
 * Pure functions only. The drafting wizard reads these to surface the
 * effective opposition / PC cost the player will pay so they can compare
 * vehicles before committing.
 *
 * @module utils/billType
 */
import type { BillType, BillTemplate } from '@/types';

export interface BillTypeMod {
  /** Additive offset applied to the synthesised template's opposition. */
  oppositionAdj: number;
  /** Multiplier on the per-stage PC cost. */
  pcCostMul: number;
  /** Multiplier on the per-stage default duration. */
  durationMul: number;
  /** Player-facing one-line description of the vehicle. */
  description: string;
}

/**
 * Static modifier table. Defaults to {@link BILL_TYPE_MODIFIERS.act} when a
 * legacy template carries no `type` field.
 */
export const BILL_TYPE_MODIFIERS: Record<BillType, BillTypeMod> = {
  resolution: {
    oppositionAdj: -15,
    pcCostMul: 0.5,
    durationMul: 0.5,
    description: 'Non-binding statement. Cheap, low-friction, limited reach.',
  },
  act: {
    oppositionAdj: 0,
    pcCostMul: 1,
    durationMul: 1,
    description: 'Standard legislation. The default the engine was tuned for.',
  },
  amendment: {
    oppositionAdj: 30,
    pcCostMul: 3,
    durationMul: 2,
    description: 'Constitutional amendment. Slow, expensive, hostile floor.',
  },
  appropriations: {
    oppositionAdj: 5,
    pcCostMul: 1,
    durationMul: 1,
    description: 'Spending bill. Must include a fiscal module to be valid.',
  },
};

/** Resolve the modifier for an arbitrary template, defaulting to `act`. */
export function modifierFor(t: Pick<BillTemplate, 'type'>): BillTypeMod {
  return BILL_TYPE_MODIFIERS[t.type ?? 'act'];
}

/**
 * Apply a bill type to a synthesised template, returning the effective
 * opposition + scaled PC cost. Stage durations are surfaced as a multiplier
 * (the system applies it at draft time).
 *
 * @example
 *   const eff = applyBillType({ ...base, type: 'amendment' });
 *   eff.opposition  // base.opposition + 30, clamped 0..100
 *   eff.pcCost.vote // base.pcCost.vote * 3
 */
export function applyBillType(t: BillTemplate): BillTemplate {
  const mod = modifierFor(t);
  return {
    ...t,
    opposition: Math.max(0, Math.min(100, t.opposition + mod.oppositionAdj)),
    pcCost: {
      committee: Math.round(t.pcCost.committee * mod.pcCostMul),
      floor: Math.round(t.pcCost.floor * mod.pcCostMul),
      vote: Math.round(t.pcCost.vote * mod.pcCostMul),
    },
  };
}

/** Player-facing label. Centralised so the UI never disagrees with the model. */
export function billTypeLabel(t: BillType): string {
  switch (t) {
    case 'resolution':
      return 'Resolution';
    case 'act':
      return 'Act';
    case 'amendment':
      return 'Constitutional Amendment';
    case 'appropriations':
      return 'Appropriations';
  }
}
