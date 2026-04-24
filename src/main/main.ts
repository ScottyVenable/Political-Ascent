import { app, BrowserWindow, ipcMain, Menu, shell } from 'electron';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import Store from 'electron-store';

/**
 * Electron main process entry point.
 *
 * Responsibilities:
 *  - Create the BrowserWindow with sensible security defaults (context
 *    isolation on, node integration off, sandbox on).
 *  - Serve the Vite dev server in development or the packaged `dist/`
 *    directory in production.
 *  - Host IPC handlers for persisted save/settings data via `electron-store`.
 *  - Keep an application menu so Quit / Devtools / About are discoverable.
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const isDev = !app.isPackaged;
const DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL ?? 'http://localhost:5173';

interface SaveSchema {
  version: number;
  savedAt: number;
  payload: unknown;
}

interface StoreSchema {
  saves: Record<string, SaveSchema>;
  settings: Record<string, unknown>;
}

const persist = new Store<StoreSchema>({
  name: 'political-ascent',
  defaults: { saves: {}, settings: {} },
});

function createMainWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#0F1117',
    show: false,
    autoHideMenuBar: false,
    title: 'Political Ascent',
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
  });

  win.once('ready-to-show', () => win.show());

  win.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: 'deny' };
  });

  if (isDev) {
    void win.loadURL(DEV_SERVER_URL);
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    void win.loadFile(join(__dirname, '../dist/index.html'));
  }

  return win;
}

function buildMenu(): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        { role: isDev ? 'reload' : 'quit' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'togglefullscreen' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Project repository',
          click: (): void => {
            void shell.openExternal('https://github.com/ScottyVenable/Political-Ascent');
          },
        },
        { role: 'about' },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function registerIpc(): void {
  ipcMain.handle('pa:save:list', () => Object.keys(persist.get('saves')));

  ipcMain.handle('pa:save:read', (_event, slotId: string) => {
    const saves = persist.get('saves');
    return saves[slotId] ?? null;
  });

  ipcMain.handle('pa:save:write', (_event, slotId: string, payload: unknown) => {
    if (typeof slotId !== 'string' || !slotId) return false;
    const saves = persist.get('saves');
    saves[slotId] = { version: 1, savedAt: Date.now(), payload };
    persist.set('saves', saves);
    return true;
  });

  ipcMain.handle('pa:save:delete', (_event, slotId: string) => {
    const saves = persist.get('saves');
    if (slotId in saves) {
      delete saves[slotId];
      persist.set('saves', saves);
      return true;
    }
    return false;
  });

  ipcMain.handle('pa:settings:get', () => persist.get('settings'));

  ipcMain.handle('pa:settings:set', (_event, settings: Record<string, unknown>) => {
    if (settings && typeof settings === 'object') {
      persist.set('settings', settings);
      return true;
    }
    return false;
  });

  ipcMain.handle('pa:app:version', () => app.getVersion());
  ipcMain.handle('pa:app:platform', () => process.platform);
}

void app.whenReady().then(() => {
  buildMenu();
  registerIpc();
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Defensive: block any in-app navigation to arbitrary URLs.
app.on('web-contents-created', (_event, contents) => {
  contents.on('will-navigate', (event, navigationUrl) => {
    if (isDev && navigationUrl.startsWith(DEV_SERVER_URL)) return;
    if (!navigationUrl.startsWith('file://')) {
      event.preventDefault();
      void shell.openExternal(navigationUrl);
    }
  });
});
