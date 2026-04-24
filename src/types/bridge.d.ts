/**
 * Window typings for the Electron context-bridge API.
 *
 * The actual bridge is implemented in `src/main/preload.ts`. In non-electron
 * contexts (browser/Android), `window.politicalAscent` falls back to a
 * localStorage-backed shim registered in `src/renderer/platform/bridge.ts`.
 */

export interface SavedSlot {
  version: number;
  savedAt: number;
  payload: unknown;
}

export interface PoliticalAscentBridge {
  platform: () => Promise<string>;
  version: () => Promise<string>;
  saves: {
    list: () => Promise<string[]>;
    read: (slotId: string) => Promise<SavedSlot | null>;
    write: (slotId: string, payload: unknown) => Promise<boolean>;
    delete: (slotId: string) => Promise<boolean>;
  };
  settings: {
    get: () => Promise<Record<string, unknown>>;
    set: (settings: Record<string, unknown>) => Promise<boolean>;
  };
}

declare global {
  interface Window {
    politicalAscent?: PoliticalAscentBridge;
  }
}

export {};
