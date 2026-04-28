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

// ─────────────────────────────────────────────────────────────
// Resource & cooldown gates introduced in the cards-ux-hardening
// pass. Each `describe` block creates a fresh card definition so
// the registry and stores stay hermetic.
// ─────────────────────────────────────────────────────────────

describe('CardSystem.play — action point gating', () => {
  const AP_DEF: CardDefinition = {
    id: 'ap-card' as CardId,
    name: 'AP Card',
    type: 'action',
    rarity: 'common',
    description: 'costs ap',
    cost: 5,
    apCost: 3,
    effects: [{ type: 'resource', resource: 'xp', value: 1 }],
    tags: [],
  };

  beforeEach(() => {
    useGameStore.getState().reset();
    useCharacterStore.getState().reset();
    useWorldStore.getState().reset();
    useWorldStore.getState().initializeWorld({ scenarioId: 'test' as ScenarioId, seed: 1 });
    CardSystem.clear();
    CardSystem.register([AP_DEF]);
    const inst = CardSystem.instantiate(AP_DEF.id);
    useCharacterStore.setState((s) => ({ ...s, deck: [inst], hand: [inst] }));
  });

  it('blocks when AP balance is below apCost', () => {
    useGameStore.setState((s) => ({
      ...s,
      politicalCapital: 100,
      actionPoints: { current: 2, max: 6 },
    }));
    const inst = useCharacterStore.getState().hand[0];
    const res = CardSystem.play(inst.instanceId);
    expect(res.ok).toBe(false);
    expect(res.reason).toMatch(/action points/i);
    // PC must NOT be deducted on a failed play.
    expect(useGameStore.getState().politicalCapital).toBe(100);
  });

  it('spends both PC and AP on success', () => {
    useGameStore.setState((s) => ({
      ...s,
      politicalCapital: 100,
      actionPoints: { current: 6, max: 6 },
    }));
    const inst = useCharacterStore.getState().hand[0];
    const res = CardSystem.play(inst.instanceId);
    expect(res.ok).toBe(true);
    expect(useGameStore.getState().politicalCapital).toBe(95);
    expect(useGameStore.getState().actionPoints.current).toBe(3);
  });
});

describe('CardSystem.play — cooldown gating', () => {
  const CD_DEF: CardDefinition = {
    id: 'cd-card' as CardId,
    name: 'Cooldown Card',
    type: 'action',
    rarity: 'rare',
    description: 'cools down',
    cost: 5,
    effects: [{ type: 'resource', resource: 'xp', value: 1 }],
    tags: [],
    stats: { cooldownWeeks: 3, usesPerGame: 2 },
  };

  beforeEach(() => {
    useGameStore.getState().reset();
    useCharacterStore.getState().reset();
    useWorldStore.getState().reset();
    useWorldStore.getState().initializeWorld({ scenarioId: 'test' as ScenarioId, seed: 1 });
    CardSystem.clear();
    CardSystem.register([CD_DEF]);
    const inst = CardSystem.instantiate(CD_DEF.id);
    useCharacterStore.setState((s) => ({ ...s, deck: [inst], hand: [inst] }));
    useGameStore.setState((s) => ({ ...s, politicalCapital: 100, week: 5 }));
  });

  it('records lastPlayedWeek and timesPlayed when uses-per-game allows reuse', () => {
    const inst = useCharacterStore.getState().hand[0];
    const res = CardSystem.play(inst.instanceId);
    expect(res.ok).toBe(true);

    // Multi-use cards stay in the deck; consumed cards are removed.
    const stored = useCharacterStore.getState().deck.find((c) => c.instanceId === inst.instanceId);
    expect(stored).toBeDefined();
    expect(stored?.lastPlayedWeek).toBe(5);
    expect(stored?.timesPlayed).toBe(1);
  });

  it('blocks while still on cooldown', () => {
    const inst = useCharacterStore.getState().hand[0];
    CardSystem.play(inst.instanceId);
    // Rebuild hand so we can attempt to play it again the same week.
    useCharacterStore.setState((s) => ({ ...s, hand: [...s.deck] }));
    const res = CardSystem.play(inst.instanceId);
    expect(res.ok).toBe(false);
    expect(res.reason).toMatch(/cooldown/i);
  });

  it('allows replay once cooldown has elapsed', () => {
    const inst = useCharacterStore.getState().hand[0];
    CardSystem.play(inst.instanceId);
    useGameStore.setState((s) => ({ ...s, week: 8 })); // 3 weeks later, exactly off CD
    useCharacterStore.setState((s) => ({ ...s, hand: [...s.deck] }));
    const res = CardSystem.play(inst.instanceId);
    expect(res.ok).toBe(true);
  });

  it('blocks once usesPerGame is exhausted', () => {
    const inst = useCharacterStore.getState().hand[0];
    CardSystem.play(inst.instanceId);
    useGameStore.setState((s) => ({ ...s, week: 8 }));
    useCharacterStore.setState((s) => ({ ...s, hand: [...s.deck] }));
    CardSystem.play(inst.instanceId);
    useGameStore.setState((s) => ({ ...s, week: 11 })); // off CD again
    useCharacterStore.setState((s) => ({ ...s, hand: [...s.deck] }));
    const res = CardSystem.play(inst.instanceId);
    expect(res.ok).toBe(false);
    expect(res.reason).toMatch(/uses remaining/i);
  });
});
