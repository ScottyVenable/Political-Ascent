/**
 * ContextMenu — portal-rendered right-click menu primitive.
 *
 * Closes docs/todo.md item 5. Right-click on cards, news headlines,
 * and other interactive elements should bring up a small contextual
 * menu of relevant actions ("View details", "Copy ID", "Share to
 * journal", etc.) the way a desktop application does.
 *
 * Design choices and how this fits the codebase:
 *   - Renders into `document.body` via `createPortal` so it never gets
 *     clipped by the parent panel's overflow:hidden / scroll regions.
 *     Positioning is `position: fixed` at the cursor coordinates,
 *     re-clamped after mount so we don't paint past the viewport edge.
 *   - Closes on Escape, click-outside, scroll, window resize, or any
 *     successful item selection. The dismissal contract is "any
 *     interaction outside the menu closes it" — same posture as
 *     ExtendedTooltip.
 *   - Items are pure data (`ContextMenuItem`) so callers can build the
 *     menu in a const and unit-test it without rendering React.
 *   - Real `<button>` elements with focus rings. The first item
 *     auto-focuses on open so keyboard users can immediately tab/arrow
 *     between options.
 *   - The icon name is typed against `IconName` so we never pass a
 *     glyph the registry doesn't actually carry.
 *
 * Authors who want to attach a menu to an element should reach for the
 * companion `useContextMenu` hook, which wraps the open/close state.
 *
 * @module renderer/components/ContextMenu
 * @see useContextMenu
 */

import { useEffect, useRef, useState, type CSSProperties, type JSX } from 'react';
import { createPortal } from 'react-dom';
import { Icon, type IconName } from './Icon';

/**
 * One row of the context menu. Items are flat (no submenus); if the
 * design ever needs nesting we'll extend this with `children?:
 * ContextMenuItem[]` and a hover-to-open submenu pattern.
 */
export interface ContextMenuItem {
  /** Stable id for testids and React keys. */
  id: string;
  /** Plain-text label rendered to the right of the icon. */
  label: string;
  /** Optional icon name from the registry (left of the label). */
  icon?: IconName;
  /** Action to run when the item is activated (click/Enter/Space). */
  onSelect: () => void;
  /** Greyed out and not clickable when true. */
  disabled?: boolean;
  /**
   * Highlights the item with the danger tone. Use sparingly — reserved
   * for destructive actions like "Discard card".
   */
  danger?: boolean;
}

export interface ContextMenuProps {
  /** Viewport coordinates of the originating right-click. */
  coords: { x: number; y: number };
  /** Items to render, top-to-bottom. Empty array renders nothing. */
  items: ContextMenuItem[];
  /**
   * Callback fired for every kind of dismissal: Escape, click-outside,
   * scroll, resize, item selection. Owner state should set
   * `menu = null` here.
   */
  onClose: () => void;
}

/**
 * Render a ContextMenu at the given viewport coordinates. The menu
 * does not render any backdrop — it's a thin floating list. Dismissal
 * is handled inside the component; the parent only owns the open/closed
 * boolean (typically through `useContextMenu`).
 *
 * @example
 *   {menu && (
 *     <ContextMenu
 *       coords={menu.coords}
 *       items={menu.items}
 *       onClose={() => setMenu(null)}
 *     />
 *   )}
 */
export function ContextMenu(props: ContextMenuProps): JSX.Element | null {
  const { coords, items, onClose } = props;
  const ref = useRef<HTMLDivElement | null>(null);
  const [adjusted, setAdjusted] = useState<CSSProperties | null>(null);

  // Re-clamp into viewport after mount — we don't know our own size
  // until the DOM lays us out, and the cursor may be near a screen
  // edge. Same approach as TooltipCard.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const margin = 8;
    let { x, y } = coords;
    if (x + rect.width + margin > window.innerWidth) {
      x = Math.max(margin, window.innerWidth - rect.width - margin);
    }
    if (y + rect.height + margin > window.innerHeight) {
      y = Math.max(margin, window.innerHeight - rect.height - margin);
    }
    setAdjusted({ top: y, left: x });
    // Auto-focus the first non-disabled item so keyboard users can
    // immediately interact without having to Tab into the menu.
    const firstEnabled = el.querySelector<HTMLButtonElement>(
      'button[data-menu-item]:not([disabled])',
    );
    firstEnabled?.focus();
  }, [coords]);

  // Outside-click + Escape + scroll/resize all close the menu.
  // The listeners run on capture so we beat any in-menu click that
  // would otherwise fire before our outside detection.
  useEffect(() => {
    function onPointerDown(e: PointerEvent): void {
      const target = e.target as Node | null;
      if (target && ref.current?.contains(target)) return;
      onClose();
    }
    function onKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    }
    function onScrollOrResize(): void {
      onClose();
    }
    window.addEventListener('pointerdown', onPointerDown, true);
    window.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown, true);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [onClose]);

  if (items.length === 0) return null;
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      ref={ref}
      role="menu"
      data-testid="context-menu"
      style={{
        position: 'fixed',
        top: adjusted?.top ?? coords.y,
        left: adjusted?.left ?? coords.x,
        // Above tooltips (10010+) so right-clicking inside a pinned
        // tooltip surfaces the menu rather than being painted under it.
        zIndex: 10100,
        minWidth: 180,
      }}
      className="bg-bg-secondary border border-rule-strong rounded-sm shadow-glow-gold py-1"
    >
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="menuitem"
          data-menu-item
          data-testid={`context-menu-item-${item.id}`}
          disabled={item.disabled}
          onClick={() => {
            // Run the action first so closing the menu doesn't tear
            // down the DOM the action might want to read from.
            item.onSelect();
            onClose();
          }}
          className={
            'w-full flex items-center gap-2 px-3 py-1.5 text-left text-body ' +
            'focus:outline-none focus:bg-bg-tertiary hover:bg-bg-tertiary ' +
            'disabled:opacity-50 disabled:cursor-not-allowed ' +
            (item.danger ? 'text-status-danger' : 'text-text-primary')
          }
        >
          {item.icon && <Icon name={item.icon} size={14} className="shrink-0" />}
          <span className="flex-1 truncate">{item.label}</span>
        </button>
      ))}
    </div>,
    document.body,
  );
}
