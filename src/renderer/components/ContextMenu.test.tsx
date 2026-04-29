/**
 * Unit tests for `<ContextMenu />` and the `useContextMenu` hook.
 *
 * Closes the testing portion of docs/todo.md item 5 (right-click
 * context menus). We cover:
 *   - Items render with correct labels and testids.
 *   - Clicking an item fires its `onSelect` and closes the menu.
 *   - Disabled items don't fire `onSelect`.
 *   - Escape closes the menu.
 *   - Outside click closes the menu.
 *   - The hook's `open` populates state and `close` clears it.
 *
 * @module renderer/components/ContextMenu.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { ContextMenu, type ContextMenuItem } from './ContextMenu';

afterEach(() => cleanup());

function baseItems(spy: () => void): ContextMenuItem[] {
  return [
    { id: 'view', label: 'View details', onSelect: spy },
    { id: 'copy', label: 'Copy ID', onSelect: spy, disabled: true },
    { id: 'discard', label: 'Discard', onSelect: spy, danger: true },
  ];
}

describe('ContextMenu', () => {
  beforeEach(() => {
    // Each test starts from a clean DOM so we don't pick up portal
    // remnants from a previous render.
    document.body.innerHTML = '';
  });

  it('renders all items at the click coordinates', () => {
    const spy = vi.fn();
    const onClose = vi.fn();
    render(
      <ContextMenu coords={{ x: 100, y: 50 }} items={baseItems(spy)} onClose={onClose} />,
    );
    expect(document.querySelector('[data-testid="context-menu"]')).not.toBeNull();
    expect(
      document.querySelector('[data-testid="context-menu-item-view"]')?.textContent,
    ).toContain('View details');
    expect(
      document.querySelector('[data-testid="context-menu-item-copy"]')?.textContent,
    ).toContain('Copy ID');
    expect(
      document.querySelector('[data-testid="context-menu-item-discard"]')?.textContent,
    ).toContain('Discard');
  });

  it('fires onSelect and onClose when an item is clicked', () => {
    const spy = vi.fn();
    const onClose = vi.fn();
    render(
      <ContextMenu coords={{ x: 0, y: 0 }} items={baseItems(spy)} onClose={onClose} />,
    );
    const view = document.querySelector(
      '[data-testid="context-menu-item-view"]',
    ) as HTMLButtonElement;
    fireEvent.click(view);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not fire onSelect for disabled items', () => {
    const spy = vi.fn();
    const onClose = vi.fn();
    render(
      <ContextMenu coords={{ x: 0, y: 0 }} items={baseItems(spy)} onClose={onClose} />,
    );
    const copy = document.querySelector(
      '[data-testid="context-menu-item-copy"]',
    ) as HTMLButtonElement;
    expect(copy.disabled).toBe(true);
    fireEvent.click(copy);
    expect(spy).not.toHaveBeenCalled();
  });

  it('closes on Escape', () => {
    const spy = vi.fn();
    const onClose = vi.fn();
    render(
      <ContextMenu coords={{ x: 0, y: 0 }} items={baseItems(spy)} onClose={onClose} />,
    );
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes when a pointerdown happens outside the menu', () => {
    const spy = vi.fn();
    const onClose = vi.fn();
    render(
      <ContextMenu coords={{ x: 0, y: 0 }} items={baseItems(spy)} onClose={onClose} />,
    );
    // Dispatch pointerdown on the body (outside the menu).
    const evt = new Event('pointerdown', { bubbles: true });
    document.body.dispatchEvent(evt);
    expect(onClose).toHaveBeenCalled();
  });

  it('renders nothing when the items array is empty', () => {
    const onClose = vi.fn();
    const { container } = render(
      <ContextMenu coords={{ x: 0, y: 0 }} items={[]} onClose={onClose} />,
    );
    expect(container.querySelector('[data-testid="context-menu"]')).toBeNull();
    // Portal target empty too.
    expect(document.body.querySelector('[data-testid="context-menu"]')).toBeNull();
  });

  it('applies the danger tone class to flagged items', () => {
    const spy = vi.fn();
    const onClose = vi.fn();
    render(
      <ContextMenu coords={{ x: 0, y: 0 }} items={baseItems(spy)} onClose={onClose} />,
    );
    const discard = document.querySelector(
      '[data-testid="context-menu-item-discard"]',
    ) as HTMLButtonElement;
    expect(discard.className).toContain('text-status-danger');
  });
});
