import { useCharacterStore } from '@/store/characterStore';
import { useGameStore } from '@/store/gameStore';
import { useUIStore } from '@/store/uiStore';
import { CardSystem } from '@/systems/CardSystem';
import { CardFace } from '../components/CardFace';
import { Button } from '../components/Button';

/**
 * CardsPanel — view and play cards in hand.
 */
export function CardsPanel(): JSX.Element {
  const hand = useCharacterStore((s) => s.hand);
  const deck = useCharacterStore((s) => s.deck);
  const pc = useGameStore((s) => s.politicalCapital);
  const pushToast = useUIStore((s) => s.pushToast);

  function play(instanceId: string): void {
    const res = CardSystem.play(instanceId);
    pushToast({
      message: res.ok ? 'Played.' : (res.reason ?? 'Cannot play'),
      severity: res.ok ? 'success' : 'warning',
      ttl: 2500,
    });
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
          const canPay = pc >= def.cost;
          return (
            <div key={inst.instanceId} className="flex flex-col gap-2">
              <CardFace def={def} state={canPay ? 'playable' : 'locked'} />
              <div className="flex gap-2">
                <Button size="sm" variant="primary" disabled={!canPay} onClick={() => play(inst.instanceId)}>
                  Play
                </Button>
                <Button size="sm" variant="ghost" onClick={() => discard(inst.instanceId)}>
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
