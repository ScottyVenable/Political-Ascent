/**
 * useContextMenu — small hook that pairs an open/close boolean with
 * the cursor coordinates and item list for `<ContextMenu />`.
 *
 * Usage pattern:
 *
 *   const menu = useContextMenu();
 *
 *   <Card
 *     onContextMenu={(e) => {
 *       e.preventDefault();
 *       menu.open(e, [
 *         { id: 'view', label: 'View details', icon: 'info', onSelect: () => ... },
 *         { id: 'copy', label: 'Copy ID', icon: 'tag', onSelect: () => ... },
 *       ]);
 *     }}
 *   >...</Card>
 *
 *   {menu.element}
 *
 * The hook owns the menu's lifetime so callers don't have to thread
 * useState/useCallback boilerplate. Calling `menu.open()` while a menu
 * is already open replaces it (so right-clicking a different element
 * dismisses the previous menu and shows the new one at the new spot).
 *
 * @module renderer/hooks/useContextMenu
 * @see ContextMenu
 */

import { useCallback, useState, type JSX, type MouseEvent } from 'react';
import { ContextMenu, type ContextMenuItem } from '../components/ContextMenu';

interface OpenMenu {
  coords: { x: number; y: number };
  items: ContextMenuItem[];
}

export interface UseContextMenuResult {
  /**
   * Open (or replace) the menu at the click coordinates. Pass the
   * synthetic React event from `onContextMenu`; the hook reads
   * `clientX/clientY` and calls `preventDefault` on your behalf so
   * the browser's native menu doesn't fight ours.
   */
  open: (event: MouseEvent, items: ContextMenuItem[]) => void;
  /** Programmatically dismiss any open menu. Idempotent. */
  close: () => void;
  /**
   * The rendered ContextMenu (or `null` when closed). Drop this into
   * your JSX once at the top level of the component using the hook.
   */
  element: JSX.Element | null;
  /** True while a menu is visible. Useful for conditional styling. */
  isOpen: boolean;
}

/**
 * Stateful hook returning the menu element + open/close handles.
 */
export function useContextMenu(): UseContextMenuResult {
  const [menu, setMenu] = useState<OpenMenu | null>(null);

  const open = useCallback((event: MouseEvent, items: ContextMenuItem[]) => {
    event.preventDefault();
    // Stop the right-click from bubbling to ancestors that might also
    // try to open their own menu. The expected behaviour for nested
    // menu zones is "innermost wins".
    event.stopPropagation();
    setMenu({ coords: { x: event.clientX, y: event.clientY }, items });
  }, []);

  const close = useCallback(() => setMenu(null), []);

  const element = menu ? (
    <ContextMenu coords={menu.coords} items={menu.items} onClose={close} />
  ) : null;

  return { open, close, element, isOpen: menu !== null };
}
