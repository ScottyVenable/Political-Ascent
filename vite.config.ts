import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import electron from 'vite-plugin-electron/simple';

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
