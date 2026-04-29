/**
 * useScrollLock — prevents body scroll while a modal is mounted.
 *
 * Where this fits in the architecture:
 *   - A small React hook used by every full-screen overlay component
 *     (ModalShell, DraftLegislationScreen, CardPackOpening, etc.).
 *   - Operates purely on `document.body.style.overflow`. No store
 *     involvement; effect-based lifecycle is the right pattern here.
 *
 * Multiple concurrent overlays are safe: each mounts its own lock and
 * restores the value that was present when it mounted. The last unmount
 * returns overflow to its pre-modal state.
 *
 * @module utils/useScrollLock
 */
import { useEffect } from 'react';

/**
 * Call at the top of any overlay component to prevent the underlying
 * page from scrolling while the overlay is visible.
 *
 * Pass `active = false` when the component is always mounted but only
 * conditionally visible — e.g. a singleton modal component that returns
 * `null` when no modal is queued. The hook must still be called
 * unconditionally (Rules of Hooks), so the `active` flag lets callers
 * skip the side-effect without violating that rule.
 *
 * Automatically restores the previous overflow value whenever the lock
 * is removed (either because `active` went false or the component
 * unmounted).
 *
 * @param active - Whether to apply the lock right now. Defaults to `true`.
 *
 * @example
 * // Always-mounted singleton modal:
 * function VoteResultModal(): JSX.Element | null {
 *   const modal = modals.find(m => m.type === 'vote-result');
 *   useScrollLock(!!modal);   // lock only when there is an open modal
 *   if (!modal) return null;
 *   return <div className="fixed inset-0 …">…</div>;
 * }
 *
 * @example
 * // Component that is only mounted while the overlay is visible:
 * function MyModal(): JSX.Element {
 *   useScrollLock(); // always active — component lifetime = overlay lifetime
 *   return <div className="fixed inset-0 …">…</div>;
 * }
 */
export function useScrollLock(active = true): void {
  useEffect(() => {
    if (!active) return;

    // Capture whatever the body overflow was before we arrived
    // (usually '' or 'auto') so we can restore it on unmount.
    const previous = document.body.style.overflow;

    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previous;
    };
    // Re-run whenever `active` changes so toggling the lock mid-life
    // (e.g. singleton modal receiving/losing its payload) works cleanly.
  }, [active]);
}
