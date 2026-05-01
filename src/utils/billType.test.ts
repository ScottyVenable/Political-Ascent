/**
 * Unit tests for `src/utils/billType.ts`.
 */
import { describe, it, expect } from 'vitest';
import { applyBillType, modifierFor, billTypeLabel, BILL_TYPE_MODIFIERS } from './billType';
import type { BillTemplate } from '@/types';

const BASE: BillTemplate = {
  id: 'tpl',
  title: 'Test Bill',
  description: 'tests something',
  tags: ['economy'],
  budgetImpact: 0,
  pcCost: { committee: 10, floor: 10, vote: 10 },
  opposition: 50,
  implementationDays: 30,
  effects: [],
  affectedGroups: [],
};

describe('billType', () => {
  it('defaults a missing type to act (no modification)', () => {
    const out = applyBillType({ ...BASE });
    expect(out.opposition).toBe(50);
    expect(out.pcCost).toEqual({ committee: 10, floor: 10, vote: 10 });
  });

  it('lowers opposition and halves PC cost for resolutions', () => {
    const out = applyBillType({ ...BASE, type: 'resolution' });
    expect(out.opposition).toBe(35);
    expect(out.pcCost).toEqual({ committee: 5, floor: 5, vote: 5 });
  });

  it('raises opposition by 30 and triples PC cost for amendments', () => {
    const out = applyBillType({ ...BASE, type: 'amendment' });
    expect(out.opposition).toBe(80);
    expect(out.pcCost).toEqual({ committee: 30, floor: 30, vote: 30 });
  });

  it('clamps opposition into 0..100 even when modifiers would overflow', () => {
    const high = applyBillType({ ...BASE, opposition: 90, type: 'amendment' });
    expect(high.opposition).toBe(100);
    const low = applyBillType({ ...BASE, opposition: 5, type: 'resolution' });
    expect(low.opposition).toBe(0);
  });

  it('modifierFor resolves type or defaults to act', () => {
    expect(modifierFor({ type: 'amendment' })).toBe(BILL_TYPE_MODIFIERS.amendment);
    expect(modifierFor({})).toBe(BILL_TYPE_MODIFIERS.act);
  });

  it('billTypeLabel returns a player-facing label for every type', () => {
    expect(billTypeLabel('resolution')).toBe('Resolution');
    expect(billTypeLabel('act')).toBe('Act');
    expect(billTypeLabel('amendment')).toBe('Constitutional Amendment');
    expect(billTypeLabel('appropriations')).toBe('Appropriations');
  });
});
