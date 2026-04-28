/**
 * Cross-environment clipboard write.
 *
 * Codex review (PR#64 P2): the call sites previously chained
 * `navigator.clipboard?.writeText(...).then(success, failure)`. The
 * optional chain short-circuits *before* `.then` when the clipboard
 * API is missing (insecure context, older Android WebView, etc.), so
 * neither the success nor the failure handler fires and the player
 * sees a silent no-op. This helper guarantees one of the two outcomes
 * always runs, even when the API is entirely absent.
 *
 * It also catches the rejection branch (permission denied, document
 * not focused) which a bare optional chain would swallow because the
 * caller's `.then(_, _)` is the last link in the chain.
 *
 * @param text - The text to write to the system clipboard.
 * @returns A promise that resolves to `true` on success, `false`
 *          otherwise. Never rejects.
 */
export async function writeClipboard(text: string): Promise<boolean> {
  // 1) Modern path. `navigator` itself can be undefined in unit tests
  //    that swap out `globalThis`, so guard both layers.
  const nav = typeof navigator !== 'undefined' ? navigator : undefined;
  const cb = nav?.clipboard;
  if (cb && typeof cb.writeText === 'function') {
    try {
      await cb.writeText(text);
      return true;
    } catch {
      // Permission denied / document not focused / iframe sandbox.
      // Fall through to the legacy path so we still try.
    }
  }

  // 2) Legacy fallback for insecure contexts and older Android WebView,
  //    using the (deprecated) `document.execCommand('copy')`. The
  //    textarea is positioned off-screen but still in the DOM so the
  //    selection can be made.
  if (typeof document === 'undefined') return false;
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    textarea.style.pointerEvents = 'none';
    document.body.appendChild(textarea);
    textarea.select();
    // `execCommand` returns true on success, false on rejection.
    // Older browsers throw rather than return false; the catch
    // covers both cases.
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}
