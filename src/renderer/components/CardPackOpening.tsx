/**
 * CardPackOpening — animated pack-reveal modal.
 *
 * Where this fits in the architecture:
 *   - Triggered from `CollectionPanel` (the in-game "store" / collection
 *     screen). The panel chooses a {@link CardPackId} and mounts this
 *     component with `onClose` to reset back to the grid.
 *   - Calls `cardPackEngine.openPack(id, seed)` once on mount and walks
 *     a small state machine for the reveal animation.
 *   - The seed is derived from `worldStore.seed + week + click counter`
 *     so the same save + same click reproduces the same pack — opens
 *     are deterministic and recoverable from a save.
 *
 * State machine:
 *   shake (600ms) → burst (350ms) → revealing[i] (per card 360ms) → settled
 *
 * Reduced motion: the global `prefers-reduced-motion` rule in styles.css
 * already neuters every keyframe. We additionally skip the shake → burst
 * sequence and reveal the whole grid at once for users who prefer it.
 *
 * @module renderer/components/CardPackOpening
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { cardPackEngine } from '@/engine/cardPackEngine';
import type { CardPackId, CardPackResult } from '@/types';
import { Button } from './Button';
import { CardFace } from './CardFace';
import { Icon } from './Icon';

export interface CardPackOpeningProps {
  packId: CardPackId;
  /** Deterministic seed — typically `worldSeed + week + clickCount`. */
  seed: number;
  onClose: () => void;
}

type Phase = 'shake' | 'burst' | 'revealing' | 'settled';

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

export function CardPackOpening({ packId, seed, onClose }: CardPackOpeningProps): JSX.Element {
  // Open the pack ONCE and memoize. Re-renders during the reveal must
  // not produce different cards.
  const result: CardPackResult = useMemo(
    () => cardPackEngine.openPack(packId, seed),
    [packId, seed],
  );
  const def = cardPackEngine.getPackDefinition(packId);

  const reduced = prefersReducedMotion();
  const [phase, setPhase] = useState<Phase>(reduced ? 'settled' : 'shake');
  const [revealCount, setRevealCount] = useState(reduced ? result.cards.length : 0);
  const timers = useRef<number[]>([]);

  // Drive the state machine with timers. We collect them so unmount
  // doesn't leave dangling timeouts firing setState on a dead tree.
  useEffect(() => {
    if (reduced) return;

    const t1 = window.setTimeout(() => setPhase('burst'), 600);
    const t2 = window.setTimeout(() => {
      setPhase('revealing');
    }, 600 + 350);
    timers.current.push(t1, t2);
    return () => {
      timers.current.forEach((id) => window.clearTimeout(id));
      timers.current = [];
    };
  }, [reduced]);

  // Reveal cards one at a time during the revealing phase.
  useEffect(() => {
    if (phase !== 'revealing') return;
    const total = result.cards.length;
    if (revealCount >= total) {
      setPhase('settled');
      return;
    }
    const id = window.setTimeout(() => {
      setRevealCount((c) => c + 1);
    }, 220);
    timers.current.push(id);
    return () => {
      window.clearTimeout(id);
    };
  }, [phase, revealCount, result.cards.length]);

  // Esc closes when settled.
  useEffect(() => {
    function onKey(e: KeyboardEvent): void {
      if (e.key === 'Escape' && phase === 'settled') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Opening ${def?.name ?? 'pack'}`}
      onClick={(e) => {
        // Backdrop dismiss — only after the reveal completes, so the
        // user can't accidentally dismiss the animation. The check
        // `target === currentTarget` ensures we only close on clicks
        // landing on the dimmed background, not bubbled clicks from
        // child cards or the Done button.
        if (phase === 'settled' && e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6"
      data-testid="pack-opening-backdrop"
    >
      <div className="bg-bg-secondary border border-rule rounded-sm shadow-glow-gold max-w-5xl w-full p-6">
        <header className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-headline text-2xl text-accent-gold">
              {def?.name ?? 'Pack'}
            </h2>
            {def?.description && (
              <p className="text-sm text-text-secondary mt-1">{def.description}</p>
            )}
          </div>
          {phase === 'settled' && (
            <Button variant="primary" size="sm" onClick={onClose}>
              Done
            </Button>
          )}
        </header>

        {/* Pre-reveal stage: animated wrapper */}
        {(phase === 'shake' || phase === 'burst') && (
          <div className="flex items-center justify-center py-16">
            <div
              className={
                'w-40 h-56 rounded-sm bg-gradient-to-br from-accent-gold/30 to-accent-blue/20 ' +
                'border-2 border-accent-gold flex items-center justify-center ' +
                (phase === 'shake' ? 'animate-pack-shake' : 'animate-pack-burst')
              }
              aria-hidden="true"
            >
              <Icon name="cards" size={64} className="text-accent-gold" />
            </div>
          </div>
        )}

        {/* Reveal grid */}
        {(phase === 'revealing' || phase === 'settled') && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {result.cards.slice(0, revealCount).map((card, i) => (
              <CardFace
                key={`${card.id}-${i}`}
                def={card}
                // Once settled, drop the reveal animation class so the card
                // sits at its final state — important for screenshot tests
                // and for users with `animations: disabled` browser settings.
                state={phase === 'settled' ? 'idle' : 'revealing'}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
