import { useState } from 'react';
import { Button } from '../components/Button';
import { SaveLoadModal } from '../components/SaveLoadModal';
import { PatchNotesPanel } from '../panels/PatchNotesPanel';
import { useScrollLock } from '@/utils/useScrollLock';
import { useRouter } from '../router';

/**
 * App version string. Sourced from `package.json` at build time would be
 * cleaner, but Vite already inlines the npm package version into the env
 * via the host process. We hardcode the public-facing identifier here so
 * the marketing label and the underlying semver do not drift on copy
 * tweaks.
 *
 * The build-provenance suffix (commit + date) is injected by Vite via
 * `define` in `vite.config.ts` (todo#89) and surfaces below the version.
 */
const APP_VERSION = 'v0.1.0-alpha.1';

/**
 * Main menu — entry point. Heavy on atmosphere, light on options: a
 * stylized title slab, a short tagline, and the core four buttons.
 */
export function MainMenu(): JSX.Element {
  const navigate = useRouter((s) => s.navigate);
  // Local state for the load-game modal. Lives on the menu rather
  // than a global slot because the menu is the only entry point and
  // we want it to evaporate on navigation away.
  const [loadOpen, setLoadOpen] = useState(false);
  // todo#89: clicking the version pill opens the in-game patch-notes
  // browser as a modal overlay so testers can read what's new without
  // committing to starting a save.
  const [patchOpen, setPatchOpen] = useState(false);
  useScrollLock(patchOpen);

  // Build provenance — values are inlined at compile time by Vite's
  // `define` plugin (see vite.config.ts). The `typeof` guard keeps the
  // file resilient when imported by an environment that did not
  // substitute the define (e.g. a one-off ts-node script).
  const commit = typeof __BUILD_COMMIT__ !== 'undefined' ? __BUILD_COMMIT__ : 'dev';
  const buildDate = typeof __BUILD_DATE__ !== 'undefined' ? __BUILD_DATE__ : '';

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      {/* Ambient gradient backdrop */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-accent-blue/10 via-transparent to-accent-red/10" />

      <main className="relative flex-1 flex flex-col items-center justify-center text-center px-6">
        <div className="mb-2 tracking-[0.3em] text-xs text-accent-gold font-mono">AN AMERICAN CAREER</div>
        <h1 className="font-headline text-6xl md:text-7xl font-bold text-text-primary mb-4">
          Political <span className="text-accent-gold">Ascent</span>
        </h1>
        <p className="max-w-xl text-text-secondary italic mb-10">
          The floor is open. The cameras are rolling. The clock starts now.
        </p>

        <div className="flex flex-col gap-3 w-56">
          <Button variant="primary" size="lg" onClick={() => navigate('character-creation')}>
            New Game
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => setLoadOpen(true)}
            data-testid="main-menu-load"
          >
            Load Game
          </Button>
          <Button variant="secondary" size="lg" onClick={() => navigate('achievements')}>
            Achievements
          </Button>
          <Button variant="secondary" size="lg" onClick={() => navigate('settings')}>
            Settings
          </Button>
          <Button
            variant="ghost"
            size="lg"
            onClick={() => {
              if (typeof window !== 'undefined' && 'close' in window) window.close();
            }}
          >
            Quit
          </Button>
        </div>
      </main>

      {/*
        todo#89: footer surfaces the version + build provenance.
        - The version itself is rendered as a button so it reads as a
          hyperlink (underline on hover, focus-ring) and opens the
          patch-notes modal.
        - Commit hash + build date sit in a dimmer line so the player
          can copy/paste them into a bug report without distracting
          from the main menu's tone.
      */}
      <footer className="relative text-center text-xs text-text-muted py-4 flex flex-col items-center gap-0.5">
        <div>
          <button
            type="button"
            onClick={() => setPatchOpen(true)}
            className="text-accent-gold underline-offset-4 hover:underline focus-visible:underline focus:outline-none focus-visible:ring-1 focus-visible:ring-accent-gold rounded"
            data-testid="main-menu-version"
            aria-label={`Open patch notes (${APP_VERSION})`}
          >
            {APP_VERSION}
          </button>
          <span> · Political Ascent — a turn-based political career sim</span>
        </div>
        <div className="font-mono text-[0.625rem] tracking-wide text-text-muted/70">
          build {commit}
          {buildDate ? ` · ${buildDate}` : ''}
        </div>
      </footer>

      {loadOpen && (
        <SaveLoadModal
          mode="load"
          onClose={() => setLoadOpen(false)}
          onLoaded={() => navigate('game')}
        />
      )}

      {/*
        Patch-notes modal (todo#89). Reuses the in-game ``PatchNotesPanel``
        so the same content surface appears whether the player is on the
        main menu or already in a save. Click outside / Esc dismiss.
      */}
      {patchOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Patch notes"
          onClick={() => setPatchOpen(false)}
          data-testid="patch-notes-modal"
        >
          <div
            className="w-full max-w-4xl bg-bg-secondary rounded-lg border border-bg-tertiary shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="px-5 py-3 border-b border-bg-tertiary flex items-center justify-between">
              <h2 className="font-headline text-lg text-text-primary">Patch Notes</h2>
              <button
                type="button"
                onClick={() => setPatchOpen(false)}
                className="font-mono text-xs uppercase tracking-widest text-text-muted hover:text-text-primary focus:outline-none focus-visible:ring-1 focus-visible:ring-accent-gold rounded px-2 py-1"
                aria-label="Close patch notes"
              >
                Close
              </button>
            </header>
            <div className="flex-1 overflow-y-auto p-4">
              <PatchNotesPanel />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
