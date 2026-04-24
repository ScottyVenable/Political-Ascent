/**
 * CardSystem — playing a card must spend PC and apply effects; lack of PC
 * must block the play without applying effects.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { CardSystem } from './CardSystem';
import { useGameStore } from '@/store/gameStore';
import { useCharacterStore } from '@/store/characterStore';
import { useWorldStore } from '@/store/worldStore';
import type { CardDefinition, CardId, ScenarioId } from '@/types';

const DEF: CardDefinition = {
  id: 'test-card' as CardId,
  name: 'Test Card',
  type: 'action',
  rarity: 'common',
  description: 'test',
  cost: 10,
  effects: [{ type: 'resource', resource: 'xp', value: 30 }],
  tags: [],
};

describe('CardSystem.play', () => {
  beforeEach(() => {
    useGameStore.getState().reset();
    useCharacterStore.getState().reset();
    useWorldStore.getState().reset();
    useWorldStore.getState().initializeWorld({ scenarioId: 'test' as ScenarioId, seed: 1 });

    CardSystem.register([DEF]);
    const inst = CardSystem.instantiate(DEF.id);
    useCharacterStore.setState((s) => ({
      ...s,
      deck: [inst],
      hand: [inst],
    }));
  });

  it('fails when insufficient PC', () => {
    useGameStore.setState((s) => ({ ...s, politicalCapital: 5 }));
    const handBefore = useCharacterStore.getState().hand.length;
    const inst = useCharacterStore.getState().hand[0];
    const res = CardSystem.play(inst.instanceId);
    expect(res.ok).toBe(false);
    expect(useCharacterStore.getState().hand.length).toBe(handBefore);
  });

  it('succeeds, spends PC, applies effects, removes from hand', () => {
    useGameStore.setState((s) => ({ ...s, politicalCapital: 50 }));
    const inst = useCharacterStore.getState().hand[0];
    const res = CardSystem.play(inst.instanceId);
    expect(res.ok).toBe(true);
    expect(useGameStore.getState().politicalCapital).toBe(40);
    expect(useCharacterStore.getState().xp).toBeGreaterThanOrEqual(30);
    expect(useCharacterStore.getState().hand.find((h) => h.instanceId === inst.instanceId)).toBeUndefined();
  });
});
