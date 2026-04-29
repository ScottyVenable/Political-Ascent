import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { execSync } from 'node:child_process';
import electron from 'vite-plugin-electron/simple';

/**
 * Resolve the short commit hash and ISO build date at config time so
 * they can be inlined into the renderer via `define` (todo#89).
 *
 * `git rev-parse --short HEAD` is fast and works in every dev/CI
 * environment that has git available. If it fails (rare — e.g. a
 * shallow tarball), we fall back to `'unknown'` rather than abort
 * the build.
 */
function readGitCommit(): string {
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return 'unknown';
  }
}

const BUILD_COMMIT = readGitCommit();
const BUILD_DATE = new Date().toISOString().slice(0, 10);

/**
 * Vite config.
 *
 * - Builds the React renderer into `dist/`.
 * - When `VITE_TARGET=electron`, also builds the Electron main + preload
 *   bundles into `dist-electron/` via `vite-plugin-electron`. We keep that
 *   plugin conditional so plain `vite dev` / web-only builds don't pull in
 *   the electron dependency graph unnecessarily.
 * - Hosts the vitest config so `npm test` picks it up automatically.
 */
const isElectron = process.env.VITE_TARGET === 'electron';

export default defineConfig({
  plugins: [
    react(),
    ...(isElectron
      ? [
          electron({
            main: {
              entry: 'src/main/main.ts',
              vite: {
                build: {
                  outDir: 'dist-electron',
                  rollupOptions: { external: ['electron', 'electron-store'] },
                },
              },
            },
            preload: {
              input: 'src/main/preload.ts',
              vite: {
                build: {
                  outDir: 'dist-electron',
                  rollupOptions: { external: ['electron'] },
                },
              },
            },
          }),
        ]
      : []),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  root: '.',
  publicDir: 'public',
  base: isElectron ? './' : '/',
  define: {
    // todo#89: surface build provenance on the main menu so testers can
    // report what they were running. Both are stringified so the runtime
    // sees a real string literal after substitution.
    __BUILD_COMMIT__: JSON.stringify(BUILD_COMMIT),
    __BUILD_DATE__: JSON.stringify(BUILD_DATE),
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2022',
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    setupFiles: ['src/test/setup.ts'],
  },
});
