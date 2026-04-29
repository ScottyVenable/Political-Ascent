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
  window: {
    /**
     * Set the window fullscreen state and persist it so it is
     * restored on the next launch. (#80)
     */
    setFullscreen: (value: boolean) => Promise<boolean>;
    /**
     * Returns the current fullscreen state of the BrowserWindow.
     * Used by Settings to initialise its toggle. (#80)
     */
    isFullscreen: () => Promise<boolean>;
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
  window: {
    setFullscreen: (value) => ipcRenderer.invoke('pa:window:setFullscreen', value),
    isFullscreen: () => ipcRenderer.invoke('pa:window:isFullscreen'),
  },
};

contextBridge.exposeInMainWorld('politicalAscent', api);
