/**
 * Unit tests for QuestsPanel helpers.
 */

import { describe, expect, it } from 'vitest';
import { describeEffect } from './QuestsPanel';
import type { Effect } from '@/types';

describe('describeEffect', () => {
  it('humanises a positive resource grant', () => {
    const eff: Effect = { type: 'resource', resource: 'politicalCapital', value: 10 };
    expect(describeEffect(eff)).toBe('+10 politicalCapital');
  });

  it('humanises a negative stat penalty without a stray plus', () => {
    const eff: Effect = { type: 'stat', target: 'integrity', value: -2 };
    expect(describeEffect(eff)).toBe('-2 integrity');
  });

  it('describes a flag effect with the flag value', () => {
    const eff: Effect = { type: 'flag', flag: 'has-mandate', value: true };
    expect(describeEffect(eff)).toBe('Sets flag "has-mandate" to true');
  });

  it('describes a card grant', () => {
    const eff: Effect = { type: 'grant_card', cardId: 'speech-1' };
    expect(describeEffect(eff)).toBe('Grants card: speech-1');
  });

  it('describes a quest trigger', () => {
    const eff: Effect = { type: 'trigger_quest', questId: 'q-2' };
    expect(describeEffect(eff)).toBe('Unlocks quest: q-2');
  });

  it('describes a group happiness effect', () => {
    const eff: Effect = { type: 'group_happiness', group: 'workers', value: 5 };
    expect(describeEffect(eff)).toBe('+5 happiness for workers');
  });

  it('describes an economy effect', () => {
    const eff: Effect = { type: 'economy', metric: 'gdpGrowth', value: 1.2 };
    expect(describeEffect(eff)).toBe('+1.2 gdpGrowth');
  });
});
