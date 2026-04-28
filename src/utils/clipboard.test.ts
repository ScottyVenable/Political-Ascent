/**
 * Unit tests for `writeClipboard`.
 *
 * The helper exists specifically because the prior call sites used
 * `navigator.clipboard?.writeText(...).then(...)`, which silently
 * no-ops when the clipboard API is unavailable. These tests pin
 * the contract: `writeClipboard` always resolves with a boolean,
 * and one of the two branches always runs.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { writeClipboard } from './clipboard';

describe('writeClipboard', () => {
  const originalNavigator = globalThis.navigator;

  beforeEach(() => {
    // Restore from a known baseline before each test mutates it.
    Object.defineProperty(globalThis, 'navigator', {
      value: originalNavigator,
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(globalThis, 'navigator', {
      value: originalNavigator,
      configurable: true,
      writable: true,
    });
  });

  it('resolves true when navigator.clipboard.writeText succeeds', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(globalThis, 'navigator', {
      value: { clipboard: { writeText } },
      configurable: true,
      writable: true,
    });
    const ok = await writeClipboard('hello');
    expect(ok).toBe(true);
    expect(writeText).toHaveBeenCalledWith('hello');
  });

  it('falls back to execCommand when clipboard API is missing', async () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: {},
      configurable: true,
      writable: true,
    });
    const exec = vi.fn().mockReturnValue(true);
    // jsdom's `document.execCommand` exists but is a stub. Spy on it.
    const original = document.execCommand;
    document.execCommand = exec as unknown as typeof document.execCommand;
    try {
      const ok = await writeClipboard('hello');
      expect(ok).toBe(true);
      expect(exec).toHaveBeenCalledWith('copy');
    } finally {
      document.execCommand = original;
    }
  });

  it('resolves false when both paths fail', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    Object.defineProperty(globalThis, 'navigator', {
      value: { clipboard: { writeText } },
      configurable: true,
      writable: true,
    });
    const exec = vi.fn().mockReturnValue(false);
    const original = document.execCommand;
    document.execCommand = exec as unknown as typeof document.execCommand;
    try {
      const ok = await writeClipboard('hello');
      expect(ok).toBe(false);
    } finally {
      document.execCommand = original;
    }
  });
});
