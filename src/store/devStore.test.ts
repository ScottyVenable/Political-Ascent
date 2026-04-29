/**
 * Tests for the developer-mode Zustand store.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useDevStore, devCheatActive } from './devStore';

describe('devStore', () => {
  beforeEach(() => {
    // Reset to defaults between tests.
    useDevStore.getState().disable();
  });

  it('starts disabled with all cheats off', () => {
    const s = useDevStore.getState();
    expect(s.enabled).toBe(false);
    expect(s.enabledAt).toBe(null);
    expect(s.godMode).toBe(false);
  });

  it('enable() sets enabledAt the first time only', () => {
    const before = Date.now();
    useDevStore.getState().enable();
    const first = useDevStore.getState().enabledAt;
    expect(first).not.toBe(null);
    expect(first).toBeGreaterThanOrEqual(before);

    // Disabling clears enabledAt; re-enabling produces a fresh stamp.
    useDevStore.getState().disable();
    expect(useDevStore.getState().enabledAt).toBe(null);
    useDevStore.getState().enable();
    expect(useDevStore.getState().enabledAt).not.toBe(null);
  });

  it('toggle() is inert while disabled', () => {
    useDevStore.getState().toggle('godMode');
    expect(useDevStore.getState().godMode).toBe(false);
  });

  it('toggle() flips the named cheat once enabled', () => {
    useDevStore.getState().enable();
    useDevStore.getState().toggle('godMode');
    expect(useDevStore.getState().godMode).toBe(true);
    useDevStore.getState().toggle('godMode');
    expect(useDevStore.getState().godMode).toBe(false);
  });

  it('disable() wipes every cheat back to false', () => {
    const s = useDevStore.getState();
    s.enable();
    s.toggle('godMode');
    s.toggle('revealHidden');
    s.disable();
    const after = useDevStore.getState();
    expect(after.enabled).toBe(false);
    expect(after.godMode).toBe(false);
    expect(after.revealHidden).toBe(false);
  });

  it('devCheatActive returns false unless both enabled and the cheat are on', () => {
    expect(devCheatActive('godMode')).toBe(false);
    useDevStore.getState().enable();
    expect(devCheatActive('godMode')).toBe(false);
    useDevStore.getState().toggle('godMode');
    expect(devCheatActive('godMode')).toBe(true);
    useDevStore.getState().disable();
    expect(devCheatActive('godMode')).toBe(false);
  });
});
