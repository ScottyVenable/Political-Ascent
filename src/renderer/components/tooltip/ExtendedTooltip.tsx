/**
 * ExtendedTooltip — the Paradox-style hover panel.
 *
 * Visual & interaction model (Victoria 3 / CK3 inspired):
 *   - Hover any term/stat → tooltip slides up after a short delay.
 *   - Hold Shift on hover-out → tooltip "pins" so the player can read
 *     it at length and click on nested terms.
 *   - Inside the tooltip, `[term:foo]` markers in paragraph text become
 *     underlined links that open *child* tooltips when hovered.
 *   - Esc closes any pinned tooltip; focus moves back to the trigger.
 *
 * Implementation notes:
 *   - Renders into a portal anchored to `document.body` so the tooltip
 *     escapes overflow:hidden ancestors (panels, sidebars).
 *   - Position is computed once on open and re-clamped to the viewport
 *     so a tooltip near the right edge flips to the left.
 *   - Pure React + Tailwind. No external dependencies.
 *   - Honours `prefers-reduced-motion` via the global rule in styles.css.
 *
 * @see registry.ts for the data shape it consumes.
 */
import {
  cloneElement,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { getTooltip, type ModifierRow, type TooltipContent, type TooltipSection } from './registry';
import { findTermMatches } from './registry';
import { Icon, type IconName } from '../Icon';
import { useSettingsStore } from '@/store/settingsStore';
import { formatTag } from '@/utils/format';

// ────────────────────────────────────────────────────────────────
// PIN COORDINATOR (todo#29, todo#77)
// ────────────────────────────────────────────────────────────────
// Per docs/todo.md item 29: "When pinning another tooltip, the
// previous one is closed automatically."
// Per docs/todo.md item 77: nested (parent–child) tooltips CAN be
// pinned simultaneously; only same-level (sibling) ones cannot.
//
// We track pinned tooltips by depth. A new pin at depth D evicts all
// other pinned tooltips at depth D or shallower that are NOT an
// ancestor of this one — i.e., only peers get closed. A child pinning
// does not evict its parent.
//
// Memory hygiene: callbacks self-unregister via the cleanup returned
// by `registerPin` so a tooltip closing for any reason (Esc, outside
// click, unmount) won't leave a stale closer behind.

interface PinnedEntry {
  depth: number;
  close: () => void;
}

const pinnedEntries = new Set<PinnedEntry>();

/**
 * Register a newly-pinned tooltip. Returns an unregister function.
 *
 * Eviction rule (todo#77):
 *   - Same depth AND already in the set → evict (only one peer pinned at a time).
 *   - Lower depth (ancestor) → keep (nested tooltips can stack pinned).
 *   - Higher depth (deeper descendant) → keep (callers handle their own).
 */
function registerPin(depth: number, closeMe: () => void): () => void {
  const entry: PinnedEntry = { depth, close: closeMe };
  // Evict any currently-pinned tooltip at the SAME depth (siblings).
  // Ancestors (lower depth) are intentionally preserved. (#77)
  for (const other of pinnedEntries) {
    if (other.close !== closeMe && other.depth >= depth) {
      other.close();
    }
  }
  pinnedEntries.add(entry);
  return () => {
    pinnedEntries.delete(entry);
  };
}

// ────────────────────────────────────────────────────────────────
// NESTED Z-INDEX SUPPORT
// ────────────────────────────────────────────────────────────────
// When a tooltip's content (or its trigger's surrounding card) itself
// contains another ExtendedTooltip — typically a `<TermText>` inside a
// card description that the outer card has its own tooltip for — the
// inner tooltip must visually stack above the outer one. Otherwise the
// outer card's hover popup paints on top of the term tooltip and the
// player can't read it. (See docs/todo.md item 1.)
//
// We solve this with a depth context: every ExtendedTooltip increments
// the depth for both its trigger subtree and its rendered popup. The
// rendered popup's z-index then bakes the depth in: deeper nests sit
// higher. The base z stays at 10000 (above modals at z-50, toasts at
// z-40), and each level adds 10 — well within the 32-bit z-index range
// while leaving headroom between layers.

/** Internal: how deep we are in the tooltip stack. 0 = outermost. */
const TooltipDepthContext = createContext<number>(0);
/** Per-level z-index increment. */
const TOOLTIP_BASE_Z = 10000;
const TOOLTIP_DEPTH_STEP = 10;

/**
 * Context that tracks the set of term IDs currently being shown by
 * ancestor tooltips in the stack. Used for todo#50 to prevent showing
 * a tooltip for a term that is already visible in an ancestor — the
 * player is already reading it, so opening another for the same term
 * would be redundant and confusing.
 */
const OpenTermsContext = createContext<ReadonlySet<string>>(new Set());

// ────────────────────────────────────────────────────────────────
// PUBLIC API
// ────────────────────────────────────────────────────────────────

export interface ExtendedTooltipProps {
  /**
   * Either `term` (registry lookup) or `content` (inline) must be
   * provided. `content` wins if both are set.
   */
  term?: string;
  content?: TooltipContent;
  /** Delay before the tooltip appears, in ms. Default 350. */
  openDelay?: number;
  /**
   * How long the player must hover before the tooltip auto-locks (in
   * ms). A radial progress arc fills during the hold. Set to 0 to
   * disable hold-to-lock; the tooltip then only locks on Shift-leave
   * (legacy behaviour). When omitted, falls back to the player's
   * `tooltipPinMs` setting (default 2000ms). (todo#49)
   */
  lockHoldMs?: number;
  /**
   * Optional footer content rendered below the tooltip body.
   * Used for todo#46 sparkline injection in KPI tiles.
   */
  footerContent?: React.ReactNode;
  /**
   * Children must accept `onMouseEnter`, `onMouseLeave`, `onFocus`,
   * `onBlur`. The component clones the child to attach handlers — most
   * built-in elements work. Pass a single React element.
   */
  children: ReactElement;
}

/**
 * Wrap any element to give it an extended tooltip on hover/focus.
 *
 * @example
 *   <ExtendedTooltip term="political-capital">
 *     <span className="font-mono">{pc} PC</span>
 *   </ExtendedTooltip>
 */
export function ExtendedTooltip(props: ExtendedTooltipProps): JSX.Element {
  const { term, content, openDelay = 350, lockHoldMs: lockHoldMsProp, children, footerContent } = props;

  // Honour the player's tooltip-pin-duration setting (todo#49).
  // If the caller explicitly passes `lockHoldMs`, that value wins;
  // otherwise we read from the settings store so all tooltips respect
  // the player's preference without every call site needing updating.
  const settingsPin = useSettingsStore((s) => s.gameplay.tooltipPinMs);
  const lockHoldMs = lockHoldMsProp ?? settingsPin;

  // Read parent depth so a nested tooltip stacks above its ancestor.
  // The depth we publish is parentDepth+1; the popup z-index is
  // computed from this same value so visuals and stacking stay in sync.
  const parentDepth = useContext(TooltipDepthContext);
  const ownDepth = parentDepth + 1;
  const tooltipZ = TOOLTIP_BASE_Z + ownDepth * TOOLTIP_DEPTH_STEP;

  // todo#50: If an ancestor tooltip in the stack is already showing
  // this term, don't open another instance — the player is already
  // reading it. We detect this by checking `OpenTermsContext`.
  const openTerms = useContext(OpenTermsContext);
  const isAlreadyOpen = term !== undefined && openTerms.has(term);

  // Build the new open-terms Set to pass to our children so that they
  // can detect if one of their terms matches something we're showing.
  const ownOpenTerms = useMemo<ReadonlySet<string>>(
    () => (term ? new Set([...openTerms, term]) : openTerms),
    [openTerms, term],
  );

  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  /**
   * 0–1 progress of the hover-hold timer. While > 0 and < 1, the card
   * renders a radial progress arc in its corner. Reaches 1 → the
   * tooltip auto-pins.
   */
  const [holdProgress, setHoldProgress] = useState(0);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);

  const triggerRef = useRef<HTMLElement | null>(null);
  const timerRef = useRef<number | null>(null);
  /** rAF handle for the hold-progress animation loop. */
  const holdRafRef = useRef<number | null>(null);
  /** Timestamp (performance.now) when the current hold started. */
  const holdStartRef = useRef<number | null>(null);
  /**
   * Last-known mouse position relative to the viewport. Captured on
   * every mouseenter/mousemove on the trigger. Used as the tooltip's
   * top-left anchor (todo#37) so the popup follows the cursor instead
   * of the trigger's bounding rect. `null` while the trigger has not
   * been hovered (e.g. keyboard focus); we then fall back to the
   * trigger's bounding rect so keyboard users still get a tooltip in
   * a sensible spot.
   */
  const mouseRef = useRef<{ x: number; y: number } | null>(null);
  const tooltipId = useId();

  const resolved: TooltipContent | undefined = useMemo(() => {
    if (content) return content;
    if (term) return getTooltip(term);
    return undefined;
  }, [term, content]);

  /**
   * Compute desired tooltip position. Per docs/todo.md item 37 we
   * anchor the *top-left of the tooltip* at the mouse cursor (with a
   * small offset so the cursor doesn't sit on the border). When the
   * tooltip was opened by keyboard focus there is no mouse position,
   * so we fall back to the trigger's bounding rect.
   *
   * The viewport-clamp pass inside `TooltipCard` still runs after the
   * card knows its own size, so a cursor near the right or bottom
   * edge produces a tooltip that flips back into the viewport.
   */
  const positionTooltip = useCallback(() => {
    // Small offset so the cursor itself doesn't sit on the tooltip's
    // top-left corner (it would intercept hover-out otherwise on the
    // 1px boundary and produce flicker).
    const CURSOR_OFFSET_X = 12;
    const CURSOR_OFFSET_Y = 12;
    const m = mouseRef.current;
    if (m) {
      setCoords({ top: m.y + CURSOR_OFFSET_Y, left: m.x + CURSOR_OFFSET_X });
      return;
    }
    // Keyboard fallback: anchor below the trigger as before.
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setCoords({ top: rect.bottom + 8, left: rect.left });
  }, []);

  const scheduleOpen = useCallback(() => {
    if (timerRef.current != null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      positionTooltip();
      setOpen(true);
    }, openDelay);
  }, [openDelay, positionTooltip]);

  /**
   * Cancel any in-flight hold animation and reset the progress arc.
   * Called on mouse-leave (when not pinning) and on close.
   */
  const cancelHold = useCallback(() => {
    if (holdRafRef.current != null) {
      cancelAnimationFrame(holdRafRef.current);
      holdRafRef.current = null;
    }
    holdStartRef.current = null;
    setHoldProgress(0);
  }, []);

  /**
   * Start (or restart) the hover-hold timer. Drives the radial progress
   * via rAF so the arc animates smoothly without re-render thrash; once
   * it reaches 100%, flip `pinned=true` and stop the loop.
   *
   * Bypassed entirely when `lockHoldMs <= 0`.
   */
  const startHold = useCallback(() => {
    if (lockHoldMs <= 0) return;
    cancelHold();
    holdStartRef.current = performance.now();
    const tick = (): void => {
      const start = holdStartRef.current;
      if (start == null) return;
      const elapsed = performance.now() - start;
      const p = Math.min(1, elapsed / lockHoldMs);
      setHoldProgress(p);
      if (p >= 1) {
        // Lock the tooltip and stop the loop.
        setPinned(true);
        holdRafRef.current = null;
        holdStartRef.current = null;
        return;
      }
      holdRafRef.current = requestAnimationFrame(tick);
    };
    holdRafRef.current = requestAnimationFrame(tick);
  }, [lockHoldMs, cancelHold]);

  const cancelOpen = useCallback(() => {
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const close = useCallback(() => {
    cancelOpen();
    cancelHold();
    setOpen(false);
    setPinned(false);
  }, [cancelOpen, cancelHold]);

  // Outside-click closes a pinned tooltip. The listener is on capture
  // so React's bubbling-phase `stopPropagation()` inside the card
  // wouldn't help us here — the listener fires first. Instead we
  // detect "inside" by walking up from the event target looking for a
  // `role="tooltip"` ancestor (every tooltip card sets this attribute,
  // including any tooltip nested inside another tooltip's content).
  // Without this guard, clicking a Term link or button inside a pinned
  // tooltip would immediately close the tooltip you were trying to
  // interact with — exactly the case hold-to-lock is designed to enable.
  useEffect(() => {
    if (!open || !pinned) return;
    function onPointerDown(e: PointerEvent): void {
      const target = e.target as Element | null;
      if (target && triggerRef.current?.contains(target)) return;
      if (target && typeof target.closest === 'function' && target.closest('[role="tooltip"]')) {
        return;
      }
      close();
    }
    window.addEventListener('pointerdown', onPointerDown, true);
    return () => window.removeEventListener('pointerdown', onPointerDown, true);
  }, [open, pinned, close]);

  // Keyboard: Esc closes a pinned tooltip and returns focus.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') {
        close();
        triggerRef.current?.focus();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  // Pin coordinator (todo#29, todo#77): when this tooltip transitions
  // into the pinned state, register with the module-level coordinator.
  // Passing `ownDepth` allows the coordinator to evict only same-depth
  // peers (siblings), not ancestors (parents) — so a child can pin
  // without closing its parent.
  useEffect(() => {
    if (!pinned) return;
    const unregister = registerPin(ownDepth, close);
    return unregister;
  }, [pinned, ownDepth, close]);

  // Pin while shift is held during mouse-leave: stays open. Otherwise
  // close (and abort any in-flight hold animation).
  //
  // todo#57: if the mouse moved into a [role="tooltip"] card (i.e. the
  // player slid the cursor from the trigger into the tooltip panel), do
  // NOT close the tooltip. The card's own onMouseLeave will trigger
  // close when the cursor actually exits the tooltip area.
  const handleLeave = useCallback(
    (e: React.MouseEvent | React.FocusEvent) => {
      const shift = (e as React.MouseEvent).shiftKey;
      if (shift) {
        cancelHold();
        setPinned(true);
        return;
      }
      // Detect mouse-to-tooltip transition: if relatedTarget is inside
      // a tooltip card, the cursor hasn't truly left the interaction
      // zone — just moved from trigger into the tooltip panel.
      const nativeEvt = e.nativeEvent as MouseEvent;
      const relatedTarget = nativeEvt.relatedTarget as Element | null;
      if (relatedTarget && relatedTarget.closest?.('[role="tooltip"]')) {
        // Cancel the hold-arc animation (cursor is now over the card,
        // not pressing on the trigger) but keep the tooltip visible.
        cancelHold();
        return;
      }
      if (!pinned) {
        cancelHold();
        close();
      }
    },
    [pinned, close, cancelHold],
  );

  // Clean up on unmount.
  useEffect(() => () => {
    cancelOpen();
    cancelHold();
  }, [cancelOpen, cancelHold]);

  // todo#50: if an ancestor is already showing this term, render the
  // child element without any tooltip behaviour. The player is already
  // reading the tooltip — opening a second identical one would just
  // confuse them. We still need to clone to forward refs, but we strip
  // the hover handlers so no tooltip is triggered.
  if (isAlreadyOpen) {
    // Just render the child as-is, no tooltip wrapping.
    return <>{children}</>;
  }

  // Clone trigger to attach handlers.
  if (!isValidElement(children)) {
    return <>{children}</>;
  }
  const trigger = cloneElement(children, {
    ref: (node: HTMLElement | null) => {
      triggerRef.current = node;
      // Forward to original ref if present.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const original = (children as any).ref;
      if (typeof original === 'function') original(node);
      else if (original && typeof original === 'object') original.current = node;
    },
    onMouseEnter: (e: React.MouseEvent) => {
      // Capture cursor position so positionTooltip() can anchor the
      // popup's top-left to the mouse instead of the trigger rect.
      mouseRef.current = { x: e.clientX, y: e.clientY };
      scheduleOpen();
      startHold();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (children.props as any).onMouseEnter?.(e);
    },
    onMouseMove: (e: React.MouseEvent) => {
      // Track the cursor while the open delay is still pending so the
      // tooltip lands wherever the cursor settled, not where it first
      // entered. Once the popup has opened we stop following — a
      // moving popup would interfere with reading.
      if (!open) {
        mouseRef.current = { x: e.clientX, y: e.clientY };
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (children.props as any).onMouseMove?.(e);
    },
    onMouseLeave: (e: React.MouseEvent) => {
      // Drop the cursor anchor so the next entry recaptures fresh
      // coordinates rather than re-using a stale position.
      mouseRef.current = null;
      handleLeave(e);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (children.props as any).onMouseLeave?.(e);
    },
    onFocus: (e: React.FocusEvent) => {
      // Keyboard activation: clear the mouse anchor so positionTooltip
      // falls back to the trigger's bounding rect instead of using a
      // stale cursor position from the last hover.
      mouseRef.current = null;
      scheduleOpen();
      startHold();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (children.props as any).onFocus?.(e);
    },
    onBlur: (e: React.FocusEvent) => {
      handleLeave(e);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (children.props as any).onBlur?.(e);
    },
    'aria-describedby': open && resolved ? tooltipId : undefined,
  } as Record<string, unknown>);

  return (
    <OpenTermsContext.Provider value={ownOpenTerms}>
      <TooltipDepthContext.Provider value={ownDepth}>
        {trigger}
        {open && resolved && coords && typeof document !== 'undefined' &&
          createPortal(
            <TooltipCard
              id={tooltipId}
              content={resolved}
              coords={coords}
              pinned={pinned}
              holdProgress={holdProgress}
              onClose={close}
              onLeave={(relatedTarget) => {
                // Close the tooltip when the cursor leaves the card, UNLESS it
                // moved back onto the trigger (the trigger's onMouseEnter will
                // re-open it) or into another tooltip (nested stack). (#57)
                if (triggerRef.current?.contains(relatedTarget ?? null)) return;
                if (relatedTarget && relatedTarget.closest?.('[role="tooltip"]')) return;
                if (!pinned) close();
              }}
              zIndex={tooltipZ}
              footerContent={footerContent}
            />,
            document.body,
          )}
      </TooltipDepthContext.Provider>
    </OpenTermsContext.Provider>
  );
}

// ────────────────────────────────────────────────────────────────
// CARD
// ────────────────────────────────────────────────────────────────

interface TooltipCardProps {
  id: string;
  content: TooltipContent;
  coords: { top: number; left: number };
  pinned: boolean;
  /** 0–1 hover-hold progress; renders the corner arc when 0 < p < 1. */
  holdProgress: number;
  onClose: () => void;
  /**
   * Called when the mouse leaves the tooltip card. The `relatedTarget`
   * is the element the cursor moved to. The parent uses this to decide
   * whether to close the tooltip (todo#57).
   */
  onLeave?: (relatedTarget: Element | null) => void;
  /**
   * Computed z-index for this popup. Outermost tooltip = 10010, each
   * nested level adds 10. Lets nested term tooltips paint over the
   * card-description popup that contained the term in the first place.
   */
  zIndex: number;
  /**
   * Optional footer content to render below the main tooltip body.
   * Used for todo#46 to inject sparkline SVGs into KPI tile tooltips
   * without requiring a new `TooltipSection` kind.
   */
  footerContent?: React.ReactNode;
}

function TooltipCard(props: TooltipCardProps): JSX.Element {
  const { id, content, coords, pinned, holdProgress, onClose, onLeave, zIndex, footerContent } = props;
  const ref = useRef<HTMLDivElement | null>(null);
  const [adjusted, setAdjusted] = useState<CSSProperties | null>(null);

  // Re-clamp into viewport after mount so we never overflow the screen.
  //
  // The clamp runs in two phases per axis:
  //   1. **Far-edge push:** if the card extends past the right or bottom
  //      edge, shift it back so the far edge sits inside the margin.
  //   2. **Near-edge clamp:** if the card now sits past the left or top
  //      edge (either because the cursor was near the origin or because
  //      step 1 pushed it that far on a small viewport), pin it to the
  //      margin so the title is always visible. (todo#41)
  //
  // We re-run on every `coords` change because the parent re-emits
  // anchor coords on each pointer move while unpinned.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let { top, left } = coords;
    const margin = 8;
    // Phase 1: far-edge push.
    if (left + rect.width + margin > vw) {
      left = Math.max(margin, vw - rect.width - margin);
    }
    if (top + rect.height + margin > vh) {
      top = Math.max(margin, vh - rect.height - margin);
    }
    // Phase 2: near-edge clamp. Guarantees the top-left corner of the
    // tooltip stays inside the visible viewport even when the trigger
    // is hugging the top/left edges of the screen.
    if (left < margin) left = margin;
    if (top < margin) top = margin;
    setAdjusted({ top, left });
  }, [coords]);

  // The radial appears only while we are still actively holding (i.e.
  // not yet pinned and progress is between epsilon and 1). At p=1 the
  // parent has already pinned the tooltip and stopped feeding progress.
  const showHoldRing = !pinned && holdProgress > 0.02 && holdProgress < 1;

  return (
    <div
      ref={ref}
      id={id}
      role="tooltip"
      onPointerDown={(e) => {
        // Stop pointerdown inside the (pinned) card from bubbling to
        // the window-level outside-click handler that would close us.
        if (pinned) e.stopPropagation();
      }}
      onMouseLeave={(e) => {
        // Notify the parent ExtendedTooltip that the cursor left the
        // card, so it can decide whether to close (todo#57).
        onLeave?.(e.relatedTarget as Element | null);
      }}
      style={{
        position: 'fixed',
        top: adjusted?.top ?? coords.top,
        left: adjusted?.left ?? coords.left,
        zIndex,
        maxWidth: 360,
        // Always interactive so the player can hover into the tooltip
        // from the trigger without it closing. (#57)
        pointerEvents: 'auto',
      }}
      className="bg-bg-secondary border border-rule-strong rounded-sm shadow-glow-gold animate-tooltip-enter"
    >
      {showHoldRing && <HoldRing progress={holdProgress} />}
      <header className="flex items-start gap-2 px-3 py-2 border-b border-rule">
        {content.icon && (
          <Icon name={content.icon as IconName} size={16} className="text-accent-gold mt-0.5 shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <h4 className="font-headline text-sm text-text-primary leading-tight">{content.title}</h4>
          {content.subtitle && (
            <p className="font-mono text-[0.625rem] uppercase tracking-wider text-text-muted mt-0.5">
              {content.subtitle}
            </p>
          )}
        </div>
        {pinned && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close tooltip"
            className="text-text-muted hover:text-text-primary transition-colors"
          >
            <Icon name="close" size={12} />
          </button>
        )}
      </header>

      <div className="px-3 py-2 space-y-2">
        {content.summary && (
          <p className="text-xs text-text-secondary italic">{content.summary}</p>
        )}
        {content.sections.map((section, i) => (
          <SectionRenderer key={i} section={section} />
        ))}

        {content.seeAlso && content.seeAlso.length > 0 && (
          <div className="pt-2 border-t border-rule">
            <p className="font-mono text-[0.625rem] uppercase tracking-wider text-text-muted mb-1">
              See also
            </p>
            <div className="flex flex-wrap gap-1.5">
              {content.seeAlso.map((id) => (
                <SeeAlsoLink key={id} termId={id} />
              ))}
            </div>
          </div>
        )}

        {footerContent && (
          <div className="pt-2 border-t border-rule">{footerContent}</div>
        )}

        {!pinned && (
          <p className="font-mono text-[0.625rem] tracking-wider text-text-muted opacity-70 pt-1">
            Hold to lock · <kbd className="px-1 border border-rule rounded-sm">Shift</kbd> to pin now
          </p>
        )}
        {pinned && (
          <p className="font-mono text-[0.625rem] tracking-wider text-text-muted opacity-70 pt-1">
            Click outside or press <kbd className="px-1 border border-rule rounded-sm">Esc</kbd> to close
          </p>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// HOLD RING — radial progress shown in the tooltip's top-right corner
// while the player is hover-holding to lock. Pure SVG, no animations
// library: we re-render at 60Hz only while the hold is active, which
// is bounded to ~1–2 seconds total.
// ─────────────────────────────────────────────────────────────

function HoldRing({ progress }: { progress: number }): JSX.Element {
  // 14px radius, 2px stroke; circumference ≈ 87.96.
  const r = 7;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - progress);
  return (
    <svg
      aria-hidden="true"
      width={20}
      height={20}
      viewBox="0 0 20 20"
      className="absolute top-1.5 right-1.5 pointer-events-none"
    >
      {/* Track */}
      <circle cx={10} cy={10} r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={2} />
      {/* Progress arc — starts at the top (−90deg rotation) and sweeps clockwise. */}
      <circle
        cx={10}
        cy={10}
        r={r}
        fill="none"
        stroke="var(--pa-accent-gold, #c9a84c)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        transform="rotate(-90 10 10)"
        // No CSS transition — the rAF loop already drives updates at
        // ~60Hz so the arc fills smoothly without lag. A CSS transition
        // here caused the visual to chase the actual value and appear
        // "stuck" because new frames arrived faster than the transition
        // completed. (todo#59)
      />
    </svg>
  );
}

// ────────────────────────────────────────────────────────────────
// SECTIONS
// ────────────────────────────────────────────────────────────────

function SectionRenderer({ section }: { section: TooltipSection }): JSX.Element {
  switch (section.kind) {
    case 'paragraph':
      return <p className="text-xs text-text-secondary leading-relaxed">{renderInlineTerms(section.text)}</p>;

    case 'breakdown': {
      const total = section.rows.reduce((s, r) => s + r.value, 0);
      return (
        <div>
          {section.heading && (
            <p className="font-mono text-[0.625rem] uppercase tracking-wider text-text-muted mb-1">
              {section.heading}
            </p>
          )}
          <ul className="space-y-0.5">
            {section.rows.map((row, i) => (
              <BreakdownRow key={i} row={row} />
            ))}
            {section.showTotal !== false && (
              <li className="flex items-baseline justify-between text-xs pt-1 mt-1 border-t border-rule">
                <span className="font-headline text-text-primary">Total</span>
                <span
                  className={
                    'font-mono ' +
                    (total > 0
                      ? 'text-status-success'
                      : total < 0
                        ? 'text-status-danger'
                        : 'text-text-secondary')
                  }
                >
                  {total > 0 ? '+' : ''}
                  {total}
                </span>
              </li>
            )}
          </ul>
        </div>
      );
    }

    case 'list':
      return (
        <div>
          {section.heading && (
            <p className="font-mono text-[0.625rem] uppercase tracking-wider text-text-muted mb-1">
              {section.heading}
            </p>
          )}
          <ul className="text-xs text-text-secondary list-disc list-inside space-y-0.5">
            {section.items.map((item, i) => (
              <li key={i}>{renderInlineTerms(item)}</li>
            ))}
          </ul>
        </div>
      );

    case 'tag-row':
      return (
        <div className="flex flex-wrap gap-1">
          {section.tags.map((t) => (
            <span
              key={t}
              className="bg-bg-tertiary text-text-muted rounded-sm px-1.5 py-0.5 text-[0.625rem] font-mono uppercase tracking-wider"
            >
              {formatTag(t)}
            </span>
          ))}
        </div>
      );
  }
}

function BreakdownRow({ row }: { row: ModifierRow }): JSX.Element {
  const tone =
    row.tone ??
    (row.value > 0 ? 'positive' : row.value < 0 ? 'negative' : 'neutral');
  const toneCls =
    tone === 'positive'
      ? 'text-status-success'
      : tone === 'negative'
        ? 'text-status-danger'
        : 'text-text-secondary';

  return (
    <li className="flex items-baseline justify-between text-xs">
      <span className="text-text-secondary">
        {row.term ? <Term term={row.term}>{row.label}</Term> : row.label}
      </span>
      <span className={`font-mono tabular-nums ${toneCls}`}>
        {row.value > 0 ? '+' : ''}
        {row.value}
      </span>
    </li>
  );
}

// ────────────────────────────────────────────────────────────────
// TERM — inline glossary link
// ────────────────────────────────────────────────────────────────

export interface TermProps {
  term: string;
  children: ReactNode;
}

/**
 * Map a tooltip's `subtitle` (treated as its category label) to a
 * Tailwind underline-decoration colour so terms read as visually
 * grouped at a glance — Stats look different from Resources, which
 * look different from Legislation, etc. (todo#51)
 *
 * The function falls back to the original gold-on-60% decoration when
 * we don't recognise the subtitle, which preserves the look of every
 * existing term without a dedicated category mapping.
 *
 * Categories are matched case-insensitively. Keys are deliberately
 * kept narrow — adding a new colour should be a deliberate design
 * decision, not a side-effect of authoring a new tooltip subtitle.
 *
 * @param subtitle Raw `TooltipContent.subtitle` string (or undefined).
 * @returns A Tailwind class string applied to the Term's underline span.
 */
export function termCategoryDecorationClass(subtitle: string | undefined): string {
  // Default — original behaviour for any term without a known category.
  const fallback = 'decoration-accent-gold/60';
  if (!subtitle) return fallback;
  const key = subtitle.trim().toLowerCase();
  switch (key) {
    case 'resource':
      // Resources (Political Capital, Action Points) — gold, the
      // currency colour used elsewhere in the HUD.
      return 'decoration-accent-gold/70';
    case 'stat':
      // Player stats (Charisma, Wisdom) — sky blue, mirrors the
      // character-sheet stat block.
      return 'decoration-sky-400/70';
    case 'mechanic':
      // System mechanics (committees, sponsorship) — neutral steel
      // so they don't compete with Stats or Resources.
      return 'decoration-slate-400/70';
    case 'concept':
      // Abstract concepts (ideology, factions) — violet, distinct
      // from any in-game numeric resource.
      return 'decoration-violet-400/70';
    case 'legislation':
      // Bills, laws, voting — emerald, matches the bill-passed badge.
      return 'decoration-emerald-400/70';
    case 'action':
      // One-shot player actions — amber, the "do something" colour.
      return 'decoration-amber-400/70';
    case 'population':
      // Cohort-level demographics — rose, matches the cohort tiles.
      return 'decoration-rose-400/70';
    case 'economy':
      // Macro indicators (GDP, deficit, unemployment) — teal.
      return 'decoration-teal-400/70';
    case 'cohort metric':
      // Per-cohort happiness/loyalty/radicalism — pink, sits in the
      // population family but visibly distinct.
      return 'decoration-pink-400/70';
    case 'event':
      // World events — orange, matches the news/timeline accents.
      return 'decoration-orange-400/70';
    default:
      return fallback;
  }
}

/**
 * Render an inline glossary term as a dotted-underline link that opens
 * the term's tooltip on hover or keyboard focus.
 *
 * The decoration colour is derived from the term's registered subtitle
 * (its category) so players can pattern-match on category at a glance.
 * (todo#51)
 */
export function Term({ term, children }: TermProps): JSX.Element {
  const def = getTooltip(term);
  const decorationCls = termCategoryDecorationClass(def?.subtitle);
  return (
    <ExtendedTooltip term={term}>
      <span
        tabIndex={0}
        role="button"
        data-term={term}
        data-term-category={def?.subtitle ?? ''}
        className={`underline decoration-dotted ${decorationCls} underline-offset-2 cursor-help text-text-primary`}
      >
        {children}
      </span>
    </ExtendedTooltip>
  );
}

function SeeAlsoLink({ termId }: { termId: string }): JSX.Element | null {
  const def = getTooltip(termId);
  if (!def) return null;
  return (
    <Term term={termId}>
      <span className="text-xs">{def.title}</span>
    </Term>
  );
}

// ────────────────────────────────────────────────────────────────
// INLINE TERM PARSING
// ────────────────────────────────────────────────────────────────

/**
 * Convert prose like
 *   "Spend [term:political-capital]PC[/] to push a bill."
 * into a mixed string + Term nodes. The closing `[/]` is optional —
 * if absent, the term consumes whatever text immediately follows up to
 * the next `[term:` or end of string.
 *
 * Per docs/todo.md item 39, plain-text segments between markers (or
 * the entire text when no markers are present) are also scanned for
 * registered glossary surfaces via `findTermMatches`, so authors get
 * automatic nested tooltips inside paragraphs and list items without
 * having to wrap every term by hand. Authors can still opt out for a
 * specific surface by simply omitting it from the registry.
 */
function renderInlineTerms(text: string): ReactNode {
  if (!text.includes('[term:')) {
    // Fast path: no explicit markers at all. Run the auto-linker over
    // the whole string and return the resulting mixed nodes.
    return autoLinkPlainText(text);
  }

  const out: ReactNode[] = [];
  let lastIdx = 0;
  // Simpler manual parse to support both `[term:id]label[/]` and the
  // bracketless flavour. We split on [term:..] markers.
  const open = /\[term:([a-z0-9-]+)\]/gi;
  let match: RegExpExecArray | null;
  while ((match = open.exec(text)) !== null) {
    const before = text.slice(lastIdx, match.index);
    if (before) out.push(autoLinkPlainText(before, `pre-${match.index}`));
    const id = match[1];
    // Find label up to [/] or next [term: or EOS.
    const after = text.slice(open.lastIndex);
    const closeIdx = after.indexOf('[/]');
    const nextTermIdx = after.search(/\[term:/i);
    let labelEnd: number;
    if (closeIdx >= 0 && (nextTermIdx < 0 || closeIdx < nextTermIdx)) {
      labelEnd = closeIdx;
    } else if (nextTermIdx >= 0) {
      labelEnd = nextTermIdx;
    } else {
      labelEnd = after.length;
    }
    const label = after.slice(0, labelEnd);
    out.push(
      <Term key={`${id}-${match.index}`} term={id}>
        {label}
      </Term>,
    );
    const consumed = labelEnd + (closeIdx === labelEnd ? 3 : 0);
    open.lastIndex += consumed;
    lastIdx = open.lastIndex;
  }
  const tail = text.slice(lastIdx);
  if (tail) out.push(autoLinkPlainText(tail, 'tail'));
  return <>{out}</>;
}

/**
 * Auto-link any registered term surfaces in a plain (marker-free)
 * string. Returns either the bare string (no matches) or a fragment
 * with `<Term>` nodes spliced in. The cap matches `<TermText>` so a
 * dense paragraph doesn't turn into a wall of underlines.
 */
function autoLinkPlainText(text: string, keyPrefix = 'al'): ReactNode {
  if (!text) return text;
  // Avoid pulling in TermText (which adds <Fragment> wrappers we don't
  // need here) and call the matcher directly. Keep the cap modest —
  // sectionRenderer paragraphs are short by design.
  const matches = findTermMatches(text).slice(0, 6);
  if (matches.length === 0) return text;
  const out: ReactNode[] = [];
  let cursor = 0;
  for (const m of matches) {
    if (m.start > cursor) out.push(text.slice(cursor, m.start));
    out.push(
      <Term key={`${keyPrefix}-${m.id}-${m.start}`} term={m.id}>
        {m.surface}
      </Term>,
    );
    cursor = m.end;
  }
  if (cursor < text.length) out.push(text.slice(cursor));
  return <>{out}</>;
}

// Re-export registry helpers for convenience so consumers only need
// one import path.
export { registerTooltip, getTooltip, allTooltipIds, clearTooltips } from './registry';
export type { TooltipContent, TooltipSection, ModifierRow } from './registry';
