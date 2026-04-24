import { contextBridge, ipcRenderer } from 'electron';

/**
 * Preload script — exposes a narrow, typed API to the renderer.
 *
 * Nothing else from node or electron leaks into the web context. Keep this
 * surface minimal; every method here is an attack surface.
 */

export interface SaveSlot {
  version: number;
  savedAt: number;
  payload: unknown;
}

export interface PoliticalAscentBridge {
  platform: () => Promise<NodeJS.Platform>;
  version: () => Promise<string>;
  saves: {
    list: () => Promise<string[]>;
    read: (slotId: string) => Promise<SaveSlot | null>;
    write: (slotId: string, payload: unknown) => Promise<boolean>;
    delete: (slotId: string) => Promise<boolean>;
  };
  settings: {
    get: () => Promise<Record<string, unknown>>;
    set: (settings: Record<string, unknown>) => Promise<boolean>;
  };
}

const api: PoliticalAscentBridge = {
  platform: () => ipcRenderer.invoke('pa:app:platform'),
  version: () => ipcRenderer.invoke('pa:app:version'),
  saves: {
    list: () => ipcRenderer.invoke('pa:save:list'),
    read: (slotId) => ipcRenderer.invoke('pa:save:read', slotId),
    write: (slotId, payload) => ipcRenderer.invoke('pa:save:write', slotId, payload),
    delete: (slotId) => ipcRenderer.invoke('pa:save:delete', slotId),
  },
  settings: {
    get: () => ipcRenderer.invoke('pa:settings:get'),
    set: (settings) => ipcRenderer.invoke('pa:settings:set', settings),
  },
};

contextBridge.exposeInMainWorld('politicalAscent', api);
