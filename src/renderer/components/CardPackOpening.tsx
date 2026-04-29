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
 *   shake (600ms) → burst (350ms) → carousel (one card at a time,
 *   advance on click or arrows) → grid (overview of all cards) → settled
 *
 * todo#53: replaced the grid reveal with a single-card carousel. Each
 * card flips in from the back (CSS 3-D flip) as it enters the carousel
 * view. Once the player has seen all cards (or clicks "View All"), they
 * land on the overview grid before the Done button appears.
 *
 * Reduced motion: skips shake → burst → carousel; jumps straight to
 * the grid overview with all cards visible.
 *
 * @module renderer/components/CardPackOpening
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cardPackEngine } from '@/engine/cardPackEngine';
import type { CardPackId, CardPackResult } from '@/types';
import { useScrollLock } from '@/utils/useScrollLock';
import { Button } from './Button';
import { CardFace } from './CardFace';
import { Icon } from './Icon';

export interface CardPackOpeningProps {
  packId: CardPackId;
  /** Deterministic seed — typically `worldSeed + week + clickCount`. */
  seed: number;
  onClose: () => void;
}

type Phase = 'shake' | 'burst' | 'carousel' | 'grid' | 'settled';

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

export function CardPackOpening({ packId, seed, onClose }: CardPackOpeningProps): JSX.Element {
  // Lock body scroll while the pack-opening overlay is visible.
  useScrollLock();

  // Open the pack ONCE and memoize. Re-renders during the reveal must
  // not produce different cards.
  const result: CardPackResult = useMemo(
    () => cardPackEngine.openPack(packId, seed),
    [packId, seed],
  );
  const def = cardPackEngine.getPackDefinition(packId);

  const reduced = prefersReducedMotion();
  const [phase, setPhase] = useState<Phase>(reduced ? 'grid' : 'shake');

  // Carousel state: which card is currently being shown (0-based), and
  // how many have been revealed so far. The "revealed" count gates the
  // next-card reveal so the player can't skip ahead of the flip in.
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [revealedUpTo, setRevealedUpTo] = useState(reduced ? result.cards.length - 1 : -1);
  // Track whether the current card has finished flipping in so we can
  // show the advance arrow.
  const [cardFlipped, setCardFlipped] = useState(reduced);

  const timers = useRef<number[]>([]);

  // Drive the state machine with timers. We collect them so unmount
  // doesn't leave dangling timeouts firing setState on a dead tree.
  useEffect(() => {
    if (reduced) return;
    const t1 = window.setTimeout(() => setPhase('burst'), 600);
    const t2 = window.setTimeout(() => {
      setPhase('carousel');
      // Reveal card 0 immediately on entering carousel.
      setRevealedUpTo(0);
    }, 600 + 350);
    timers.current.push(t1, t2);
    return () => {
      timers.current.forEach((id) => window.clearTimeout(id));
      timers.current = [];
    };
  }, [reduced]);

  // When a new card enters the carousel, start the flip-in timer.
  // After the CSS animation completes (~500ms), mark the card as
  // flipped so the player sees the advance arrow.
  useEffect(() => {
    if (phase !== 'carousel') return;
    setCardFlipped(false);
    const t = window.setTimeout(() => setCardFlipped(true), 520);
    timers.current.push(t);
    return () => window.clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, carouselIndex]);

  const advance = useCallback(() => {
    const total = result.cards.length;
    const next = carouselIndex + 1;
    if (next >= total) {
      // All cards seen — move to the grid overview.
      setPhase('grid');
    } else {
      setCarouselIndex(next);
      setRevealedUpTo((prev) => Math.max(prev, next));
    }
  }, [carouselIndex, result.cards.length]);

  const prev = useCallback(() => {
    if (carouselIndex > 0) setCarouselIndex((i) => i - 1);
  }, [carouselIndex]);

  // Esc dismisses when settled; right/left arrows navigate the carousel.
  useEffect(() => {
    function onKey(e: KeyboardEvent): void {
      if (e.key === 'Escape' && (phase === 'settled' || phase === 'grid')) {
        onClose();
      }
      if (phase === 'carousel') {
        if ((e.key === 'ArrowRight' || e.key === 'ArrowDown') && cardFlipped) advance();
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') prev();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, cardFlipped, advance, prev, onClose]);

  const total = result.cards.length;
  const currentCard = result.cards[carouselIndex];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Opening ${def?.name ?? 'pack'}`}
      onClick={(e) => {
        // Backdrop dismiss — only after the reveal completes.
        if ((phase === 'settled' || phase === 'grid') && e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6"
      data-testid="pack-opening-backdrop"
    >
      <div className="bg-bg-secondary border border-rule rounded-sm shadow-glow-gold max-w-3xl w-full p-6 flex flex-col gap-4">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="font-headline text-2xl text-accent-gold">
              {def?.name ?? 'Pack'}
            </h2>
            {def?.description && (
              <p className="text-sm text-text-secondary mt-1">{def.description}</p>
            )}
          </div>
          {(phase === 'settled' || phase === 'grid') && (
            <Button variant="primary" size="sm" onClick={onClose}>
              Done
            </Button>
          )}
        </header>

        {/* Pre-reveal stage: animated pack wrapper */}
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

        {/*
          Carousel phase — one card at a time.
          The card flips in via a CSS 3-D transform. Once the flip
          completes, the prev/next controls appear.
          Screen-reader users get the card count live region.
        */}
        {phase === 'carousel' && currentCard && (
          <div className="flex flex-col items-center gap-4">
            <p
              className="font-mono text-label uppercase tracking-wider text-text-muted"
              aria-live="polite"
            >
              Card {carouselIndex + 1} of {total}
            </p>

            {/* Carousel navigation row */}
            <div className="flex items-center gap-4 w-full justify-center">
              {/* Back arrow — always present once past card 0 */}
              <button
                type="button"
                onClick={prev}
                disabled={carouselIndex === 0}
                aria-label="Previous card"
                className="p-2 rounded-sm text-text-muted hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <Icon name="chevron-left" size={24} />
              </button>

              {/*
                Single card shown large. `animate-card-reveal` is the
                existing flip-in keyframe already defined in styles.css.
                The key prop forces a re-mount (and re-animation) when
                the displayed card changes.
              */}
              <div
                key={`${currentCard.id}-${carouselIndex}`}
                className="w-56 animate-card-reveal"
                data-testid="pack-carousel-card"
              >
                <CardFace def={currentCard} state="revealing" />
              </div>

              {/* Next / finish arrow */}
              <button
                type="button"
                onClick={cardFlipped ? advance : undefined}
                disabled={!cardFlipped}
                aria-label={carouselIndex === total - 1 ? 'Finish reveal' : 'Next card'}
                className="p-2 rounded-sm text-accent-gold hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <Icon
                  name={carouselIndex === total - 1 ? 'check' : 'chevron-right'}
                  size={24}
                />
              </button>
            </div>

            {/* Mini pip row so the player knows their position */}
            <div className="flex gap-1.5" role="tablist" aria-label="Card position">
              {result.cards.map((_, i) => (
                <button
                  key={i}
                  role="tab"
                  aria-selected={i === carouselIndex}
                  aria-label={`Card ${i + 1}`}
                  onClick={() => {
                    // Only allow navigating back to already-revealed cards.
                    if (i <= revealedUpTo) setCarouselIndex(i);
                  }}
                  disabled={i > revealedUpTo}
                  className={[
                    'w-2 h-2 rounded-full transition-all',
                    i === carouselIndex
                      ? 'bg-accent-gold scale-125'
                      : i <= revealedUpTo
                        ? 'bg-text-secondary hover:bg-text-primary cursor-pointer'
                        : 'bg-bg-tertiary cursor-not-allowed',
                  ].join(' ')}
                />
              ))}
            </div>

            {/* Skip ahead to grid if player doesn't want to flip through */}
            <button
              type="button"
              onClick={() => {
                setRevealedUpTo(total - 1);
                setPhase('grid');
              }}
              className="font-mono text-[0.6875rem] uppercase tracking-wider text-text-muted hover:text-text-secondary transition-colors"
            >
              View all cards
            </button>
          </div>
        )}

        {/*
          Grid overview — shown after the carousel (or immediately for
          reduced-motion users). All cards are already visible. The
          player can browse before clicking Done.
        */}
        {(phase === 'grid' || phase === 'settled') && (
          <div>
            <p className="font-mono text-label uppercase tracking-wider text-text-muted mb-3">
              All {total} cards from this pack
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {result.cards.map((card, i) => (
                <CardFace
                  key={`${card.id}-${i}`}
                  def={card}
                  state="idle"
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

