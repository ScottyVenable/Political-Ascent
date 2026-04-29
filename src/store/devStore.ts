/**
 * Developer-mode store.
 *
 * Where this fits in the architecture:
 *   - A small Zustand slice that toggles privileged debug behaviour
 *     across the rest of the codebase. Engine and systems read these
 *     flags via direct store access (e.g. `useDevStore.getState()`)
 *     in non-React contexts; the renderer reads them via hooks.
 *   - Activating dev mode for the first time records a timestamp; the
 *     save subsystem (todo#21) reads this when persisting a save and
 *     marks the resulting file as a "developer save" so it can be
 *     visually distinguished in the load list.
 *   - Dev-mode toggles are intentionally non-persistent across reloads
 *     by default (you must opt in each session) so a player who tried
 *     it once does not accidentally invalidate every future save.
 *
 * Cheats included in this initial pass:
 *   - **godMode** — engine/systems should treat the player's run as
 *     unkillable: no automatic loss conditions trigger, no resource
 *     can drop below `0`, and crisis events that would normally end
 *     the game soft-fail.
 *   - **infiniteResources** — every resource read clamps to its
 *     configured maximum (or a high floor) when this flag is on. The
 *     resource system reads this flag when computing snapshots.
 *   - **instantActions** — actions that normally cost AP / PC / time
 *     resolve in a single tick at zero cost. Useful when iterating on
 *     panel UX without grinding through the economy.
 *   - **revealHidden** — hidden information (opponent hand, faction
 *     intent, scenario victory triggers) is rendered in tooltips and
 *     panels. Engine state is unchanged; only the UI reveals more.
 *
 * @module store/devStore
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

/**
 * Snapshot of every dev-mode flag. Kept flat so consumers can
 * destructure cheaply, and so a save tag can be a single boolean
 * derived from `enabled` without juggling nested keys.
 */
export interface DevState {
  /**
   * Master switch. `true` once the player confirms the warning dialog
   * in Settings → Developer. While `false`, every other flag is
   * ignored regardless of its individual value.
   */
  enabled: boolean;
  /**
   * Wall-clock timestamp (ms) of the first time `enabled` was set to
   * true in this session. Used by the save subsystem to tag a save
   * file as a developer save. `null` until first activation.
   */
  enabledAt: number | null;
  /** Disable lose conditions and clamp resources to their floors. */
  godMode: boolean;
  /** Floor every resource read to a high baseline. */
  infiniteResources: boolean;
  /** Skip AP/PC/time costs and resolve in one tick. */
  instantActions: boolean;
  /** Reveal hidden information in tooltips and panels. */
  revealHidden: boolean;
  /** Enable verbose `'debug'` log level globally. */
  verboseLogging: boolean;
}

/** Flag keys other than `enabled`/`enabledAt` (the cheats themselves). */
export type DevCheat =
  | 'godMode'
  | 'infiniteResources'
  | 'instantActions'
  | 'revealHidden'
  | 'verboseLogging';

interface DevActions {
  /**
   * Activate dev mode. Should only be called *after* the confirmation
   * dialog has been accepted (the dialog is owned by the Settings
   * panel and is intentionally not part of this store).
   */
  enable: () => void;
  /** Deactivate dev mode and clear every cheat flag. */
  disable: () => void;
  /** Toggle a single cheat. No-ops if `enabled` is false. */
  toggle: (cheat: DevCheat) => void;
  /** Reset every cheat to false but leave `enabled` as-is. */
  resetCheats: () => void;
}

type Store = DevState & DevActions;

const DEFAULTS: DevState = {
  enabled: false,
  enabledAt: null,
  godMode: false,
  infiniteResources: false,
  instantActions: false,
  revealHidden: false,
  verboseLogging: false,
};

export const useDevStore = create<Store>()(
  immer((set) => ({
    ...DEFAULTS,
    enable: () =>
      set((s) => {
        s.enabled = true;
        if (s.enabledAt === null) s.enabledAt = Date.now();
      }),
    disable: () =>
      set((s) => {
        // Wipe every cheat as well — leaving cheats armed while the
        // master switch is off is a footgun (a future toggle of
        // `enabled` would re-arm them silently).
        Object.assign(s, DEFAULTS);
      }),
    toggle: (cheat) =>
      set((s) => {
        if (!s.enabled) return; // see JSDoc: cheats are inert otherwise
        s[cheat] = !s[cheat];
      }),
    resetCheats: () =>
      set((s) => {
        s.godMode = false;
        s.infiniteResources = false;
        s.instantActions = false;
        s.revealHidden = false;
        s.verboseLogging = false;
      }),
  })),
);

/**
 * Convenience helper for engine/systems code that runs outside a
 * React context. Returns the flag for `cheat` only when dev mode is
 * enabled — otherwise always `false`. This keeps engine call sites
 * down to a single line:
 *
 * @example
 *   if (devCheatActive('godMode')) return; // skip lose check
 */
export function devCheatActive(cheat: DevCheat): boolean {
  const s = useDevStore.getState();
  return s.enabled && s[cheat];
}
