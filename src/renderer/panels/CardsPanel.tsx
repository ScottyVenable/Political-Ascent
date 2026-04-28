import { useState } from 'react';
import { useCharacterStore } from '@/store/characterStore';
import { useGameStore } from '@/store/gameStore';
import { useUIStore } from '@/store/uiStore';
import { CardSystem } from '@/systems/CardSystem';
import { CardFace } from '../components/CardFace';
import { Button } from '../components/Button';
import { useContextMenu } from '../hooks/useContextMenu';
import { writeClipboard } from '@/utils/clipboard';

/**
 * CardsPanel — view, reorder, and play cards in hand.
 *
 * Resource gating: a card is *playable* when the character has enough
 * political capital, enough action points, the cooldown has elapsed and
 * any uses-per-game budget hasn't been exhausted. The CardSystem is the
 * authority on all of these; we mirror just enough state here to render
 * the disabled button and a friendly tooltip on the cause.
 *
 * Drag-and-drop reordering (todo#3): every card row is HTML5-draggable.
 * Dropping over another card commits a new hand order through
 * `reorderHand()`. While a card is being dragged the rest of the grid
 * receives a subtle `opacity-50` hint so the player can see where the
 * card came from. The dropped card "lands" via the same lift/transition
 * declared on `<CardFace />`, giving the move a tactile finish.
 *
 * Card-like UX additions (todo#33):
 *   - **Drag-to-play drop zone** at the top of the hand. Dragging a
 *     card onto it triggers the same play flow as the Play button,
 *     giving the panel the tactile feel of a real TCG. Cards that
 *     fail their resource check fall back to the existing toast.
 *   - **Insertion indicator** — when a drag is in flight, the card
 *     currently being hovered renders a left-edge gold bar so the
 *     player can see where the dropped card will land.
 *   - **Playable glow ring** — the CardFace receives a subtle gold
 *     outline when its resource gates are clear, so a player can see
 *     at a glance which cards are live.
 *   - The **drag image** is the card art itself rather than the full
 *     row including action buttons (looks like a torn-off block in
 *     Chrome). We point `setDragImage` at the CardFace article.
 *
 * Double-click protection: `playingId` is set synchronously before the
 * play call so a fast second click on the same card is ignored even if
 * the Zustand subscription hasn't propagated yet.
 */
export function CardsPanel(): JSX.Element {
  const hand = useCharacterStore((s) => s.hand);
  const deck = useCharacterStore((s) => s.deck);
  const reorderHand = useCharacterStore((s) => s.reorderHand);
  const pc = useGameStore((s) => s.politicalCapital);
  const ap = useGameStore((s) => s.actionPoints.current);
  const week = useGameStore((s) => s.week);
  const pushToast = useUIStore((s) => s.pushToast);
  const [playingId, setPlayingId] = useState<string | null>(null);
  /**
   * Instance id of the card currently being dragged. Held in component
   * state (rather than a ref) so the drag visual on the source card
   * can react to it via Tailwind classes — the drag pseudo-state is
   * not reliable across browsers for HTML5 drag.
   */
  const [dragId, setDragId] = useState<string | null>(null);
  /**
   * Instance id the dragged card is currently hovered over. Used to
   * paint the left-edge insertion indicator. Cleared on dragLeave so
   * the indicator never lingers after the cursor moves on.
   */
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  /**
   * `true` while the cursor is over the dedicated "drop to play"
   * zone. Drives the zone's highlighted state.
   */
  const [overPlayZone, setOverPlayZone] = useState(false);
  const menu = useContextMenu();

  function play(instanceId: string): void {
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
      setPlayingId(null);
    }
  }

  function discard(instanceId: string): void {
    CardSystem.discard(instanceId);
  }

  /**
   * Reorder the hand so `sourceId` ends up immediately before `targetId`.
   * Both ids are looked up against the current hand, not against the
   * snapshot taken at drag-start, so the action is robust against a
   * draw or discard that happens mid-drag.
   */
  function moveBefore(sourceId: string, targetId: string): void {
    if (sourceId === targetId) return;
    const ids = hand.map((c) => c.instanceId);
    const without = ids.filter((id) => id !== sourceId);
    const targetIdx = without.indexOf(targetId);
    if (targetIdx === -1) return;
    without.splice(targetIdx, 0, sourceId);
    reorderHand(without);
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

      {/* Drag-to-play drop zone (todo#33). Always rendered when the
          hand is non-empty so the player learns it exists; when no
          drag is in flight it sits as a quiet hint, when the player
          starts dragging it lights up. The zone also responds to a
          plain click for keyboard/mouse users by surfacing a hint
          toast directing them to the per-card Play button. */}
      {hand.length > 0 && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Drop a card here to play it"
          data-testid="card-play-zone"
          data-active={dragId !== null ? 'true' : 'false'}
          data-over={overPlayZone ? 'true' : 'false'}
          onDragOver={(e) => {
            if (!dragId) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            if (!overPlayZone) setOverPlayZone(true);
          }}
          onDragLeave={() => setOverPlayZone(false)}
          onDrop={(e) => {
            e.preventDefault();
            const sourceId =
              e.dataTransfer.getData('text/plain') || dragId;
            setOverPlayZone(false);
            setDragId(null);
            if (sourceId) play(sourceId);
          }}
          onClick={() =>
            pushToast({
              message: 'Drag a card here, or click its Play button below.',
              severity: 'info',
              ttl: 2500,
            })
          }
          className={
            'rounded border-2 border-dashed transition-colors text-center text-sm py-3 px-4 ' +
            (overPlayZone
              ? 'border-accent-gold bg-accent-gold/15 text-accent-gold'
              : dragId
                ? 'border-accent-gold/60 bg-bg-tertiary/40 text-accent-gold/80'
                : 'border-rule text-text-muted')
          }
        >
          {overPlayZone
            ? 'Release to play'
            : dragId
              ? 'Drop here to play'
              : 'Tip: drag a card here to play it.'}
        </div>
      )}

      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
        data-testid="cards-hand-grid"
      >
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
          const isDragging = dragId === inst.instanceId;
          const isDropTarget = dropTargetId === inst.instanceId && dragId !== inst.instanceId;
          return (
            <div
              key={inst.instanceId}
              className={
                'relative flex flex-col gap-2 transition-opacity duration-150 ' +
                (isDragging ? 'opacity-40 ' : '') +
                // Playable glow (todo#33). Pulsing gold ring around
                // the entire row when the card is currently legal to
                // play. Faded when on cooldown or unaffordable so the
                // hand reads as "live cards versus dead cards" at a
                // glance.
                (canPay && !pending ? 'card-row-playable ' : '')
              }
              data-testid={`card-row-${def.id}`}
              data-instance-id={inst.instanceId}
              data-playable={canPay ? 'true' : 'false'}
              draggable={!pending}
              onDragStart={(e) => {
                // dataTransfer carries the instance id so a future
                // cross-region drop (e.g. dropping onto a "discard"
                // zone) can identify the card without relying on
                // component state alone.
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', inst.instanceId);
                // Prefer the card art as the drag image — the full
                // row including the action buttons looks ragged
                // when torn off in Chrome. We grab the first
                // child <article> rendered by CardFace.
                const article = (e.currentTarget as HTMLElement).querySelector(
                  'article[data-card-id]',
                );
                if (article instanceof HTMLElement) {
                  const r = article.getBoundingClientRect();
                  e.dataTransfer.setDragImage(article, r.width / 2, 24);
                }
                setDragId(inst.instanceId);
              }}
              onDragEnd={() => {
                setDragId(null);
                setDropTargetId(null);
                setOverPlayZone(false);
              }}
              onDragEnter={() => {
                if (dragId && dragId !== inst.instanceId) {
                  setDropTargetId(inst.instanceId);
                }
              }}
              onDragOver={(e) => {
                // Required to allow `drop` to fire. The browser will
                // otherwise treat the element as a no-drop target.
                if (dragId && dragId !== inst.instanceId) {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                }
              }}
              onDragLeave={() => {
                if (dropTargetId === inst.instanceId) setDropTargetId(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                const sourceId =
                  e.dataTransfer.getData('text/plain') || dragId;
                if (sourceId) moveBefore(sourceId, inst.instanceId);
                setDragId(null);
                setDropTargetId(null);
              }}
              onContextMenu={(e) =>
                menu.open(e, [
                  {
                    id: 'play',
                    label: pending ? 'Playing\u2026' : 'Play card',
                    icon: 'check',
                    onSelect: () => play(inst.instanceId),
                    disabled: !canPay || pending,
                  },
                  {
                    id: 'copy-id',
                    label: 'Copy card ID',
                    icon: 'copy',
                    onSelect: () => {
                      // See utils/clipboard.ts for why we don't chain
                      // off `navigator.clipboard?.writeText` directly.
                      void writeClipboard(def.id).then((ok) =>
                        pushToast({
                          message: ok ? `Copied: ${def.id}` : 'Clipboard unavailable',
                          severity: ok ? 'info' : 'warning',
                          ttl: ok ? 2000 : 2500,
                        }),
                      );
                    },
                  },
                  {
                    id: 'discard',
                    label: 'Discard',
                    icon: 'x',
                    onSelect: () => discard(inst.instanceId),
                    disabled: pending,
                    danger: true,
                  },
                ])
              }
            >
              {/* Insertion indicator — a left-edge gold bar that
                  appears when this row is the active drop target.
                  Absolutely-positioned so it doesn't shift any other
                  cards in the grid. */}
              {isDropTarget && (
                <span
                  aria-hidden
                  data-testid="card-drop-indicator"
                  className="absolute -left-1.5 top-0 bottom-0 w-1 bg-accent-gold rounded-sm shadow-[0_0_8px_rgba(201,168,76,0.6)]"
                />
              )}
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
      {menu.element}
    </div>
  );
}
