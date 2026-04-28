/**
 * Top-level error boundary that catches render-time exceptions
 * anywhere in the React tree and presents a player-friendly crash
 * surface instead of a blank page.
 *
 * Where this fits in the architecture:
 *   - Wraps `<App />` in `index.tsx` so any uncaught exception in any
 *     screen, panel, or component bubbles up here rather than tearing
 *     down the whole renderer.
 *   - Captures the error + stack into the in-app log buffer (see
 *     `utils/logger`) so the "Download logs" button in the crash UI
 *     attaches the run-up to the failure as well as the failure itself.
 *   - Provides three actions to the player:
 *       1. **Reload** — the most common useful response.
 *       2. **Return to main menu** — soft-reset that keeps any
 *          unsaved auto-save data in memory (where applicable).
 *       3. **Download logs** — produce a JSON file the player can
 *          attach to a GitHub bug report.
 *
 * What's intentionally out of scope (todo#20 follow-ups):
 *   - "Possible solutions / common causes" surface — depends on the
 *     error taxonomy work in #20. The boundary records enough detail
 *     for that work to land in a follow-up PR without churn here.
 *   - In-app "Report" form posting to GitHub. We surface a download
 *     and a link to the issue tracker; an integrated form is a
 *     dedicated feature.
 *
 * @module renderer/components/ErrorBoundary
 */
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { createLogger, serialiseLogs } from '@/utils/logger';
import { writeClipboard } from '@/utils/clipboard';

const log = createLogger('error-boundary');

interface Props {
  /** The application tree the boundary protects. */
  children: ReactNode;
}

interface State {
  /**
   * The captured error, or `null` while the tree is healthy. Stored on
   * state (rather than in a ref) so React re-renders the fallback UI.
   */
  error: Error | null;
  /**
   * The component stack reported by React. Useful when debugging
   * which subtree threw — printed alongside the technical detail in
   * the crash overlay's collapsible section.
   */
  componentStack: string | null;
  /**
   * Whether the "Logs copied" toast in the crash UI is currently
   * visible. A boolean is enough; we only need to flash it briefly.
   */
  copied: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, componentStack: null, copied: false };

  /**
   * React class-component contract: called when a descendant throws.
   * Returning a state patch transitions the boundary into the
   * fallback render path. Side effects belong in
   * `componentDidCatch`, not here.
   */
  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Capture the component stack so the crash UI can show it.
    this.setState({ componentStack: info.componentStack ?? null });
    // Log to the ring buffer so a downloaded report includes the
    // crash itself (in addition to anything that led up to it).
    log.error('uncaught render error', error);
  }

  /**
   * Reset the boundary so the protected tree re-renders. Called by
   * the "Reload" / "Return to menu" buttons after they've taken
   * their respective navigation actions.
   */
  private reset = (): void => {
    this.setState({ error: null, componentStack: null });
  };

  /**
   * Force-reload the page. We use a full reload (rather than just
   * resetting the boundary) because some classes of error leave
   * application state in an unrecoverable shape (e.g. a corrupt save
   * partially loaded).
   */
  private handleReload = (): void => {
    window.location.reload();
  };

  /**
   * Soft reset back to the main menu. We push the menu route into
   * `location.hash` directly to avoid importing the router store
   * (which itself may be the source of the crash).
   */
  private handleReturnToMenu = (): void => {
    try {
      window.location.hash = '#main-menu';
    } catch {
      // ignore — the reset below will at least try to recover the tree
    }
    this.reset();
  };

  /**
   * Build a crash report payload (error + component stack + log
   * buffer) and download it as a JSON file.
   */
  private handleDownloadLogs = (): void => {
    const payload = {
      error: this.state.error
        ? {
            name: this.state.error.name,
            message: this.state.error.message,
            stack: this.state.error.stack,
          }
        : null,
      componentStack: this.state.componentStack,
      // serialiseLogs already produces a JSON string; parse it here so
      // the outer wrapper doesn't double-encode.
      logs: JSON.parse(serialiseLogs()) as unknown,
      capturedAt: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `political-ascent-crash-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  /** Copy the same payload to the clipboard for quick pasting. */
  private handleCopyLogs = async (): Promise<void> => {
    const ok = await writeClipboard(serialiseLogs());
    if (ok) {
      this.setState({ copied: true });
      window.setTimeout(() => this.setState({ copied: false }), 2000);
    }
  };

  render(): ReactNode {
    if (!this.state.error) return this.props.children;

    return (
      <main
        role="alert"
        aria-live="assertive"
        className="min-h-screen bg-bg-primary text-text-primary p-8 flex items-start justify-center"
      >
        <section className="max-w-2xl w-full bg-bg-elevated border border-accent-crimson/40 rounded-lg p-6 shadow-lg">
          <h1 className="font-headline text-2xl text-accent-crimson">
            Something went wrong.
          </h1>
          <p className="mt-2 text-text-secondary">
            Political Ascent encountered an unexpected error and stopped
            rendering this screen. Your in-progress simulation may still be
            recoverable from the most recent autosave.
          </p>

          <details className="mt-4 text-sm">
            <summary className="cursor-pointer text-text-secondary hover:text-text-primary">
              Technical detail
            </summary>
            <pre className="mt-2 max-h-64 overflow-auto bg-bg-primary/60 p-3 rounded text-xs font-mono whitespace-pre-wrap break-words">
              {`${this.state.error.name}: ${this.state.error.message}\n\n${this.state.error.stack ?? '(no stack)'}\n\nComponent stack:\n${this.state.componentStack ?? '(unavailable)'}`}
            </pre>
          </details>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={this.handleReload}
              className="px-4 py-2 rounded bg-accent-gold text-bg-primary font-semibold hover:brightness-110"
            >
              Reload
            </button>
            <button
              type="button"
              onClick={this.handleReturnToMenu}
              className="px-4 py-2 rounded border border-text-secondary text-text-primary hover:bg-bg-primary/40"
            >
              Return to main menu
            </button>
            <button
              type="button"
              onClick={this.handleDownloadLogs}
              className="px-4 py-2 rounded border border-text-secondary text-text-primary hover:bg-bg-primary/40"
            >
              Download logs
            </button>
            <button
              type="button"
              onClick={() => {
                void this.handleCopyLogs();
              }}
              className="px-4 py-2 rounded border border-text-secondary text-text-primary hover:bg-bg-primary/40"
            >
              {this.state.copied ? 'Logs copied' : 'Copy logs'}
            </button>
          </div>

          <p className="mt-4 text-xs text-text-muted">
            If this keeps happening, please attach the downloaded log file to
            a bug report on the project&apos;s issue tracker.
          </p>
        </section>
      </main>
    );
  }
}
