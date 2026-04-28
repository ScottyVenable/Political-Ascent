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
  /**
   * Drop every registered definition. Used by tests to keep the
   * registry hermetic between cases. Production code should never
   * need this.
   */
  clear(): void;
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

  clear(): void {
    this.registry.clear();
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
    // ── 1. Locate card and definition ──────────────────────────
    const char = useCharacterStore.getState();
    const inst = char.hand.find((c) => c.instanceId === instanceId);
    if (!inst) return { ok: false, reason: 'Card not in hand' };
    const def = this.registry.get(inst.cardId);
    if (!def) return { ok: false, reason: 'Unknown card definition' };

    const game = useGameStore.getState();

    // ── 2. Resource gates ─────────────────────────────────────
    // Political capital — checked first because it's the most common
    // reason a play is denied.
    if (game.politicalCapital < def.cost) {
      return { ok: false, reason: 'Insufficient political capital' };
    }
    // Action points — defaults to 0 so legacy cards (no apCost) keep
    // working unchanged.
    const apCost = def.apCost ?? 0;
    if (apCost > 0 && game.actionPoints.current < apCost) {
      return { ok: false, reason: 'Insufficient action points' };
    }

    // ── 3. Cooldown & uses-per-game gates ─────────────────────
    // These were declared in CardStats but never enforced. We track per
    // *instance* so two copies of the same card can be on different
    // cooldowns (relevant when cards are duplicated by future effects).
    const stats = def.stats;
    if (stats?.cooldownWeeks && stats.cooldownWeeks > 0 && inst.lastPlayedWeek != null) {
      const weeksSince = game.week - inst.lastPlayedWeek;
      if (weeksSince < stats.cooldownWeeks) {
        const wait = stats.cooldownWeeks - weeksSince;
        return {
          ok: false,
          reason: `On cooldown (${wait} week${wait === 1 ? '' : 's'} left)`,
        };
      }
    }
    if (
      stats?.usesPerGame != null &&
      stats.usesPerGame > 0 &&
      (inst.timesPlayed ?? 0) >= stats.usesPerGame
    ) {
      return { ok: false, reason: 'No uses remaining this game' };
    }

    // ── 4. Spend resources & apply effects ────────────────────
    game.addPoliticalCapital(-def.cost);
    if (apCost > 0) {
      // spendAP returns false only when balance < amount, which we just
      // verified. The defensive branch keeps the type honest.
      const spent = game.spendAP(apCost);
      if (!spent) {
        // Refund PC and bail — should not happen, but a hard invariant.
        game.addPoliticalCapital(def.cost);
        return { ok: false, reason: 'Action point spend failed' };
      }
    }
    applyEffects(def.effects);

    // ── 5. Update instance bookkeeping then remove from hand ──
    // The card is "consumed" (removed from deck) when this play uses
    // up its last allowed use. Single-play cards (no usesPerGame, or
    // usesPerGame === 1) are consumed immediately. Multi-use cards
    // (usesPerGame > 1) stay in the deck while there are uses left,
    // and are consumed on the play that brings timesPlayed up to
    // usesPerGame — which is what stops them from sticking around as
    // permanent dead draws after their final use.
    const nextTimesPlayed = (inst.timesPlayed ?? 0) + 1;
    const cap = stats?.usesPerGame;
    const consumed = !cap || cap <= 1 || nextTimesPlayed >= cap;
    useCharacterStore.setState((s) => {
      const updatedDeck = s.deck.map((c) =>
        c.instanceId === instanceId
          ? {
              ...c,
              lastPlayedWeek: game.week,
              timesPlayed: nextTimesPlayed,
            }
          : c,
      );
      return {
        ...s,
        hand: s.hand.filter((c) => c.instanceId !== instanceId),
        deck: consumed
          ? updatedDeck.filter((c) => c.instanceId !== instanceId)
          : updatedDeck,
      };
    });

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
