import { useState } from 'react';
import { useCharacterStore } from '@/store/characterStore';
import { useGameStore } from '@/store/gameStore';
import { useUIStore } from '@/store/uiStore';
import { CardSystem } from '@/systems/CardSystem';
import { CardFace } from '../components/CardFace';
import { Button } from '../components/Button';

/**
 * CardsPanel — view and play cards in hand.
 *
 * Resource gating: a card is *playable* when the character has enough
 * political capital, enough action points, the cooldown has elapsed and
 * any uses-per-game budget hasn't been exhausted. The CardSystem is the
 * authority on all of these; we mirror just enough state here to render
 * the disabled button and a friendly tooltip on the cause.
 *
 * Double-click protection: `playingId` is set synchronously before the
 * play call so a fast second click on the same card is ignored even if
 * the Zustand subscription hasn't propagated yet.
 */
export function CardsPanel(): JSX.Element {
  const hand = useCharacterStore((s) => s.hand);
  const deck = useCharacterStore((s) => s.deck);
  const pc = useGameStore((s) => s.politicalCapital);
  const ap = useGameStore((s) => s.actionPoints.current);
  const week = useGameStore((s) => s.week);
  const pushToast = useUIStore((s) => s.pushToast);
  const [playingId, setPlayingId] = useState<string | null>(null);

  function play(instanceId: string): void {
    // Guard against rapid double-clicks. Even though `CardSystem.play`
    // is idempotent (it looks up the instance in the hand each call),
    // emitting two toasts and two news entries is jarring.
    if (playingId !== null) return;
    setPlayingId(instanceId);
    try {
      const res = CardSystem.play(instanceId);
      pushToast({
        message: res.ok ? 'Played.' : (res.reason ?? 'Cannot play'),
        severity: res.ok ? 'success' : 'warning',
        ttl: 2500,
      });
    } finally {
      // Always clear, even if applyEffects throws — otherwise the panel
      // would lock up for the rest of the session.
      setPlayingId(null);
    }
  }

  function discard(instanceId: string): void {
    CardSystem.discard(instanceId);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-headline text-lg text-accent-gold">Hand ({hand.length})</h3>
        <span className="text-xs text-text-muted">Deck remaining: {deck.length - hand.length}</span>
      </div>

      {hand.length === 0 && (
        <p className="text-sm text-text-muted italic">Your hand is empty. Cards are drawn at the start of each week.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {hand.map((inst) => {
          const def = CardSystem.getDefinition(inst.cardId);
          if (!def) return null;
          // Compute disabled state and a human reason in one pass so the
          // button title attribute can explain *why* it's disabled.
          const apCost = def.apCost ?? 0;
          const stats = def.stats;
          let blockedReason: string | null = null;
          if (pc < def.cost) blockedReason = 'Not enough political capital';
          else if (apCost > 0 && ap < apCost) blockedReason = 'Not enough action points';
          else if (stats?.cooldownWeeks && inst.lastPlayedWeek != null) {
            const weeksSince = week - inst.lastPlayedWeek;
            if (weeksSince < stats.cooldownWeeks) {
              const wait = stats.cooldownWeeks - weeksSince;
              blockedReason = `On cooldown (${wait} week${wait === 1 ? '' : 's'})`;
            }
          } else if (
            stats?.usesPerGame != null &&
            stats.usesPerGame > 0 &&
            (inst.timesPlayed ?? 0) >= stats.usesPerGame
          ) {
            blockedReason = 'No uses left this game';
          }
          const canPay = blockedReason === null;
          const pending = playingId === inst.instanceId;
          return (
            <div key={inst.instanceId} className="flex flex-col gap-2">
              <CardFace def={def} state={canPay ? 'playable' : 'locked'} />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="primary"
                  disabled={!canPay || pending}
                  onClick={() => play(inst.instanceId)}
                  title={blockedReason ?? undefined}
                  data-testid={`card-play-${def.id}`}
                >
                  {pending ? 'Playing\u2026' : 'Play'}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => discard(inst.instanceId)}
                  disabled={pending}
                >
                  Discard
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
