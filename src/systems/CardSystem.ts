import type { CardDefinition, CardInstance, CardId } from '@/types';
import { useCharacterStore } from '@/store/characterStore';
import { useGameStore } from '@/store/gameStore';
import { useWorldStore } from '@/store/worldStore';
import { applyEffects } from '@/engine/applyEffect';
import { SeededRNG } from '@/utils/random';
import { makeId } from '@/utils/id';
import { createLogger } from '@/utils/logger';

const log = createLogger('CardSystem');

/**
 * CardSystem — deck management & card play pipeline.
 *
 * - Card definitions are registered from JSON via `register()`.
 * - A player's `deck` (the full collection) and `hand` live on the character
 *   store. Drawing is deterministic given a seed.
 * - `play()` validates PC cost, spends it, and funnels the card's effects
 *   through `applyEffects`.
 */
export interface CardSystemAPI {
  register(defs: readonly CardDefinition[]): void;
  /** Get a registered definition by id. */
  getDefinition(cardId: CardId): CardDefinition | undefined;
  allDefinitions(): CardDefinition[];
  /** Build a CardInstance from a card definition id. */
  instantiate(cardId: CardId, rng?: SeededRNG): CardInstance;
  /** Deal up to `max - currentHandSize` cards from deck into hand. */
  drawToHandSize(max: number): number;
  /** Play a card from hand. Returns true on success. */
  play(instanceId: string): { ok: boolean; reason?: string };
  /** Discard a card from hand back into the deck. */
  discard(instanceId: string): void;
}

class CardSystemImpl implements CardSystemAPI {
  private registry = new Map<CardId, CardDefinition>();

  register(defs: readonly CardDefinition[]): void {
    for (const d of defs) this.registry.set(d.id, d);
    log.info('registered', { count: defs.length });
  }

  getDefinition(cardId: CardId): CardDefinition | undefined {
    return this.registry.get(cardId);
  }

  allDefinitions(): CardDefinition[] {
    return Array.from(this.registry.values());
  }

  instantiate(cardId: CardId, rng?: SeededRNG): CardInstance {
    const { currentDate } = useGameStore.getState();
    return {
      instanceId: makeId('card', rng),
      cardId,
      acquiredAt: `${currentDate.year}-${currentDate.month}-${currentDate.day}`,
    };
  }

  drawToHandSize(max: number): number {
    const char = useCharacterStore.getState();
    const need = Math.max(0, max - char.hand.length);
    if (need === 0) return 0;

    // Pool = deck entries not currently in hand.
    const inHand = new Set(char.hand.map((c) => c.instanceId));
    const pool = char.deck.filter((c) => !inHand.has(c.instanceId));
    if (pool.length === 0) return 0;

    const rng = new SeededRNG(
      useWorldStore.getState().seed + useGameStore.getState().week * 7,
    );
    const drawn: CardInstance[] = [];
    const available = [...pool];
    for (let i = 0; i < need && available.length > 0; i++) {
      const idx = rng.int(0, available.length - 1);
      drawn.push(available[idx]);
      available.splice(idx, 1);
    }

    useCharacterStore.setState((s) => ({
      ...s,
      hand: [...s.hand, ...drawn],
    }));
    return drawn.length;
  }

  play(instanceId: string): { ok: boolean; reason?: string } {
    const char = useCharacterStore.getState();
    const inst = char.hand.find((c) => c.instanceId === instanceId);
    if (!inst) return { ok: false, reason: 'Card not in hand' };
    const def = this.registry.get(inst.cardId);
    if (!def) return { ok: false, reason: 'Unknown card definition' };

    const game = useGameStore.getState();
    if (game.politicalCapital < def.cost) {
      return { ok: false, reason: 'Insufficient political capital' };
    }

    game.addPoliticalCapital(-def.cost);
    applyEffects(def.effects);

    // Remove from hand (played cards are consumed in MVP).
    useCharacterStore.setState((s) => ({
      ...s,
      hand: s.hand.filter((c) => c.instanceId !== instanceId),
      deck: s.deck.filter((c) => c.instanceId !== instanceId),
    }));

    useWorldStore.getState().pushNews({
      id: makeId('news'),
      date: game.currentDate,
      headline: `Played: ${def.name}`,
      severity: 'info',
    });

    return { ok: true };
  }

  discard(instanceId: string): void {
    useCharacterStore.setState((s) => ({
      ...s,
      hand: s.hand.filter((c) => c.instanceId !== instanceId),
    }));
  }
}

export const CardSystem: CardSystemAPI = new CardSystemImpl();
