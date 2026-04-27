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
  isValidElement,
  useCallback,
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
import { Icon, type IconName } from '../Icon';

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
  const { term, content, openDelay = 350, children } = props;

  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);

  const triggerRef = useRef<HTMLElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const tooltipId = useId();

  const resolved: TooltipContent | undefined = useMemo(() => {
    if (content) return content;
    if (term) return getTooltip(term);
    return undefined;
  }, [term, content]);

  /** Compute desired tooltip position relative to the trigger. */
  const positionTooltip = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    // Anchor: just below the trigger, left-aligned. The actual element
    // re-clamps once it knows its size (effect below).
    setCoords({
      top: rect.bottom + 8,
      left: rect.left,
    });
  }, []);

  const scheduleOpen = useCallback(() => {
    if (timerRef.current != null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      positionTooltip();
      setOpen(true);
    }, openDelay);
  }, [openDelay, positionTooltip]);

  const cancelOpen = useCallback(() => {
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const close = useCallback(() => {
    cancelOpen();
    setOpen(false);
    setPinned(false);
  }, [cancelOpen]);

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

  // Pin while shift is held during mouse-leave: stays open.
  const handleLeave = useCallback(
    (e: React.MouseEvent | React.FocusEvent) => {
      const shift = (e as React.MouseEvent).shiftKey;
      if (shift) {
        setPinned(true);
        return;
      }
      if (!pinned) close();
    },
    [pinned, close],
  );

  // Clean up on unmount.
  useEffect(() => () => cancelOpen(), [cancelOpen]);

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
      scheduleOpen();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (children.props as any).onMouseEnter?.(e);
    },
    onMouseLeave: (e: React.MouseEvent) => {
      handleLeave(e);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (children.props as any).onMouseLeave?.(e);
    },
    onFocus: (e: React.FocusEvent) => {
      scheduleOpen();
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
    <>
      {trigger}
      {open && resolved && coords && typeof document !== 'undefined' &&
        createPortal(
          <TooltipCard
            id={tooltipId}
            content={resolved}
            coords={coords}
            pinned={pinned}
            onClose={close}
          />,
          document.body,
        )}
    </>
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
  onClose: () => void;
}

function TooltipCard(props: TooltipCardProps): JSX.Element {
  const { id, content, coords, pinned, onClose } = props;
  const ref = useRef<HTMLDivElement | null>(null);
  const [adjusted, setAdjusted] = useState<CSSProperties | null>(null);

  // Re-clamp into viewport after mount so we never overflow the screen.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let { top, left } = coords;
    const margin = 8;
    if (left + rect.width + margin > vw) left = Math.max(margin, vw - rect.width - margin);
    if (top + rect.height + margin > vh) top = Math.max(margin, vh - rect.height - margin);
    setAdjusted({ top, left });
  }, [coords]);

  return (
    <div
      ref={ref}
      id={id}
      role="tooltip"
      style={{
        position: 'fixed',
        top: adjusted?.top ?? coords.top,
        left: adjusted?.left ?? coords.left,
        zIndex: 10000,
        maxWidth: 360,
        // Pinned tooltips become interactive; unpinned ones are pure
        // hover surfaces and should never block clicks beneath them.
        pointerEvents: pinned ? 'auto' : 'none',
      }}
      className="bg-bg-secondary border border-rule-strong rounded-sm shadow-glow-gold animate-tooltip-enter"
    >
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

        {!pinned && (
          <p className="font-mono text-[0.625rem] tracking-wider text-text-muted opacity-70 pt-1">
            Hold <kbd className="px-1 border border-rule rounded-sm">Shift</kbd> to pin
          </p>
        )}
      </div>
    </div>
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
              {t}
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
 * Render an inline glossary term as a dotted-underline link that opens
 * the term's tooltip on hover or keyboard focus.
 */
export function Term({ term, children }: TermProps): JSX.Element {
  return (
    <ExtendedTooltip term={term}>
      <span
        tabIndex={0}
        role="button"
        className="underline decoration-dotted decoration-accent-gold/60 underline-offset-2 cursor-help text-text-primary"
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
 */
function renderInlineTerms(text: string): ReactNode {
  if (!text.includes('[term:')) return text;

  const out: ReactNode[] = [];
  let lastIdx = 0;
  // Simpler manual parse to support both `[term:id]label[/]` and the
  // bracketless flavour. We split on [term:..] markers.
  const open = /\[term:([a-z0-9-]+)\]/gi;
  let match: RegExpExecArray | null;
  while ((match = open.exec(text)) !== null) {
    const before = text.slice(lastIdx, match.index);
    if (before) out.push(before);
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
  if (tail) out.push(tail);
  return <>{out}</>;
}

// Re-export registry helpers for convenience so consumers only need
// one import path.
export { registerTooltip, getTooltip, allTooltipIds, clearTooltips } from './registry';
export type { TooltipContent, TooltipSection, ModifierRow } from './registry';
