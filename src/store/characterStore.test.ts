import { describe, it, expect, beforeEach } from 'vitest';
import { useCharacterStore } from './characterStore';
import type { CardInstance } from '@/types';

/**
 * Unit tests for the character-store actions added by todo#3
 * (drag-and-drop card reordering). The other character-store actions
 * are exercised through the engine integration tests; this file
 * focuses on `reorderHand` because it has its own corner cases (stale
 * id list, missing target, identity preservation) that the integration
 * suite would not catch.
 */

function inst(id: string): CardInstance {
  // Minimal CardInstance fixture — only the fields touched by
  // `reorderHand`. The store is structurally typed, so as long as the
  // shape matches at the property level the tests are valid. We cast
  // through `unknown` because `CardId` is a branded string and
  // synthesising a valid one in test setup would require leaking the
  // brand internals; this is a controlled fixture, not production.
  return {
    instanceId: id,
    cardId: `card-${id}`,
    lastPlayedWeek: null,
    timesPlayed: 0,
  } as unknown as CardInstance;
}

describe('characterStore.reorderHand', () => {
  beforeEach(() => {
    useCharacterStore.getState().reset();
  });

  it('reorders the hand to match the requested instance id list', () => {
    const a = inst('a');
    const b = inst('b');
    const c = inst('c');
    useCharacterStore.setState({ hand: [a, b, c] });

    useCharacterStore.getState().reorderHand(['c', 'a', 'b']);

    const { hand } = useCharacterStore.getState();
    expect(hand.map((card) => card.instanceId)).toEqual(['c', 'a', 'b']);
  });

  it('preserves the original CardInstance object identities', () => {
    // React keys + downstream subscribers rely on this — replacing the
    // instances would force every card to remount.
    const a = inst('a');
    const b = inst('b');
    useCharacterStore.setState({ hand: [a, b] });

    useCharacterStore.getState().reorderHand(['b', 'a']);

    const { hand } = useCharacterStore.getState();
    expect(hand[0]).toBe(b);
    expect(hand[1]).toBe(a);
  });

  it('appends instances that are missing from the requested order', () => {
    // Simulates a draw landing between drag-start and drop: the
    // dragged card list does not yet know about the freshly drawn id.
    const a = inst('a');
    const b = inst('b');
    const c = inst('c');
    useCharacterStore.setState({ hand: [a, b, c] });

    useCharacterStore.getState().reorderHand(['b', 'a']);

    const { hand } = useCharacterStore.getState();
    expect(hand.map((card) => card.instanceId)).toEqual(['b', 'a', 'c']);
  });

  it('ignores ids in the requested order that are not in the hand', () => {
    // Defends against stale ids surviving across a discard.
    const a = inst('a');
    const b = inst('b');
    useCharacterStore.setState({ hand: [a, b] });

    useCharacterStore.getState().reorderHand(['ghost', 'b', 'a']);

    const { hand } = useCharacterStore.getState();
    expect(hand.map((card) => card.instanceId)).toEqual(['b', 'a']);
  });

  it('is a no-op on an empty hand', () => {
    useCharacterStore.getState().reorderHand(['a', 'b']);
    expect(useCharacterStore.getState().hand).toEqual([]);
  });
});

describe('characterStore.adjustFunds', () => {
  beforeEach(() => {
    useCharacterStore.getState().reset();
  });

  it('increases personal funds for income actions', () => {
    useCharacterStore.setState({ personalFunds: 100_000 });

    useCharacterStore.getState().adjustFunds(12_500);

    expect(useCharacterStore.getState().personalFunds).toBe(112_500);
  });

  it('decreases personal funds for spend actions', () => {
    useCharacterStore.setState({ personalFunds: 100_000 });

    useCharacterStore.getState().adjustFunds(-25_000);

    expect(useCharacterStore.getState().personalFunds).toBe(75_000);
  });

  it('floors personal funds at zero instead of allowing personal debt', () => {
    useCharacterStore.setState({ personalFunds: 10_000 });

    useCharacterStore.getState().adjustFunds(-50_000);

    expect(useCharacterStore.getState().personalFunds).toBe(0);
  });
});
