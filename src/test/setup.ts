/**
 * Vitest setup — runs before each test file.
 *
 * Stubs the `window.politicalAscent` Electron bridge so renderer tests can
 * import code paths that talk to the preload API without the real IPC.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import '@testing-library/jest-dom/vitest';

type BridgeStub = {
  platform: () => Promise<string>;
  version: () => Promise<string>;
  saves: {
    list: () => Promise<string[]>;
    read: (id: string) => Promise<unknown>;
    write: (id: string, payload: unknown) => Promise<boolean>;
    delete: (id: string) => Promise<boolean>;
  };
  settings: {
    get: () => Promise<Record<string, unknown>>;
    set: (v: Record<string, unknown>) => Promise<boolean>;
  };
};

const saveMap = new Map<string, unknown>();
const settingsStore: Record<string, unknown> = {};

const stub: BridgeStub = {
  platform: async () => 'test',
  version: async () => '0.1.0-alpha.1',
  saves: {
    list: async () => Array.from(saveMap.keys()),
    read: async (id) => saveMap.get(id) ?? null,
    write: async (id, payload) => {
      saveMap.set(id, { version: 1, savedAt: Date.now(), payload });
      return true;
    },
    delete: async (id) => saveMap.delete(id),
  },
  settings: {
    get: async () => ({ ...settingsStore }),
    set: async (v) => {
      Object.assign(settingsStore, v);
      return true;
    },
  },
};

(globalThis as unknown as { politicalAscent: BridgeStub }).politicalAscent = stub;
// Also expose on window for renderer code that reads window.politicalAscent.
if (typeof window !== 'undefined') {
  (window as any).politicalAscent = stub;
}
