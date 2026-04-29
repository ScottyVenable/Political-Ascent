/**
 * Unit tests for `<AvatarPicker />`.
 *
 * Coverage:
 *  - Renders one tile per preset with the correct testid.
 *  - Selected tile carries `aria-checked="true"`.
 *  - Clicking a tile fires `onChange` with the preset id.
 *  - The `disabled` flag prevents selection.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import { AvatarPicker } from './AvatarPicker';
import { AVATAR_PRESETS } from '@/data/avatars';

afterEach(() => cleanup());

describe('AvatarPicker', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('renders every preset', () => {
    render(<AvatarPicker value={AVATAR_PRESETS[0].id} onChange={() => {}} />);
    for (const preset of AVATAR_PRESETS) {
      const tile = document.querySelector(`[data-testid="avatar-option-${preset.id}"]`);
      expect(tile).not.toBeNull();
    }
  });

  it('marks the selected tile with aria-checked=true', () => {
    const target = AVATAR_PRESETS[1];
    render(<AvatarPicker value={target.id} onChange={() => {}} />);
    const tile = document.querySelector<HTMLButtonElement>(
      `[data-testid="avatar-option-${target.id}"]`,
    );
    expect(tile?.getAttribute('aria-checked')).toBe('true');
    // Other tiles should not be checked.
    const other = AVATAR_PRESETS.find((p) => p.id !== target.id)!;
    const otherTile = document.querySelector<HTMLButtonElement>(
      `[data-testid="avatar-option-${other.id}"]`,
    );
    expect(otherTile?.getAttribute('aria-checked')).toBe('false');
  });

  it('fires onChange with the clicked preset id', () => {
    const spy = vi.fn();
    render(<AvatarPicker value={AVATAR_PRESETS[0].id} onChange={spy} />);
    const target = AVATAR_PRESETS[2];
    const tile = document.querySelector<HTMLButtonElement>(
      `[data-testid="avatar-option-${target.id}"]`,
    );
    fireEvent.click(tile!);
    expect(spy).toHaveBeenCalledWith(target.id);
  });

  it('blocks selection when disabled', () => {
    const spy = vi.fn();
    render(<AvatarPicker value={AVATAR_PRESETS[0].id} onChange={spy} disabled />);
    const tile = document.querySelector<HTMLButtonElement>(
      `[data-testid="avatar-option-${AVATAR_PRESETS[2].id}"]`,
    );
    expect(tile?.disabled).toBe(true);
    fireEvent.click(tile!);
    expect(spy).not.toHaveBeenCalled();
  });
});
