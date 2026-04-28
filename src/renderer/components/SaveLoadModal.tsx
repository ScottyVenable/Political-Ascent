/**
 * SaveLoadModal — slot-based save and load UI.
 *
 * Two modes:
 *   - `mode="save"`: shows a "Create new save" row plus existing
 *     slots. Clicking an existing slot offers to overwrite it.
 *   - `mode="load"`: shows existing slots only. Clicking a slot
 *     loads it; the caller is responsible for navigation.
 *
 * Both modes share the same slot list and delete affordance, so the
 * player learns the layout once.
 *
 * Wires todo#36 (real save/load) and surfaces the dev-mode chip from
 * todo#21 so a player can tell at a glance which saves were taken
 * with cheats enabled.
 *
 * @module renderer/components/SaveLoadModal
 */
import { useCallback, useEffect, useState } from 'react';
import { Button } from './Button';
import { Icon } from './Icon';
import {
  deleteSave,
  listSaves,
  loadSave,
  readSave,
  writeSave,
  type SaveMeta,
} from '@/engine/SaveSystem';
import { useUIStore } from '@/store/uiStore';
import { createLogger } from '@/utils/logger';

const log = createLogger('save-ui');

/**
 * Thin wrapper around `pushToast` so each call site stays a one-liner.
 * The save UI only needs short, low-severity confirmations; severities
 * outside that band would belong on the toast store directly.
 */
function toast(message: string, severity: 'info' | 'success' | 'danger' = 'info'): void {
  useUIStore.getState().pushToast({ message, severity, ttl: 3500 });
}

export type SaveLoadMode = 'save' | 'load';

interface Props {
  mode: SaveLoadMode;
  onClose: () => void;
  /** Called after a successful load so the host can route to the game screen. */
  onLoaded?: () => void;
}

interface SlotEntry {
  id: string;
  meta: SaveMeta | null;
  /** Set if the meta could not be parsed (corrupt or schema-mismatched). */
  error?: string;
}

/**
 * Format a timestamp as a human-friendly relative date. Avoids pulling
 * in a heavy date library for what is one display string.
 */
function formatSavedAt(ms: number): string {
  const d = new Date(ms);
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Fetch every slot id and resolve each to its meta header. We do this
 * in parallel — the Electron bridge can support it and localStorage
 * is synchronous anyway.
 */
async function loadSlots(): Promise<SlotEntry[]> {
  const ids = await listSaves();
  const entries = await Promise.all(
    ids.map(async (id): Promise<SlotEntry> => {
      const res = await readSave(id);
      if (res.ok) return { id, meta: res.payload.meta };
      return { id, meta: null, error: res.reason };
    }),
  );
  // Newest first; orphan/corrupt rows sink to the bottom.
  return entries.sort((a, b) => {
    if (!a.meta && !b.meta) return a.id.localeCompare(b.id);
    if (!a.meta) return 1;
    if (!b.meta) return -1;
    return b.meta.savedAt - a.meta.savedAt;
  });
}

export function SaveLoadModal({ mode, onClose, onLoaded }: Props): JSX.Element {
  const [slots, setSlots] = useState<SlotEntry[] | null>(null);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  // Slot id pending a destructive confirmation, or `null` if no
  // confirmation is in flight. We reuse the same state for "overwrite
  // this save" and "delete this save" — only one such prompt can be
  // open at a time.
  const [pendingAction, setPendingAction] = useState<
    { kind: 'overwrite' | 'delete'; id: string } | null
  >(null);

  const refresh = useCallback(async () => {
    setSlots(await loadSlots());
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // ── Actions ──────────────────────────────────────────────────────

  /** Create a brand-new save slot. */
  const onCreate = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      // Slot id: timestamp + short random tag. Guarantees ordering
      // by id and avoids collisions when two saves are taken in the
      // same second. The random tag intentionally uses Math.random
      // because save-slot ids are not gameplay-deterministic.
      const id = `slot-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const ok = await writeSave(id, name || `Save ${new Date().toLocaleTimeString()}`);
      if (ok) {
        toast('Game saved.', 'success');
        setName('');
        await refresh();
      } else {
        toast('Save failed — see logs.', 'danger');
      }
    } finally {
      setBusy(false);
    }
  }, [busy, name, refresh]);

  /** Overwrite an existing slot. */
  const onOverwrite = useCallback(
    async (id: string) => {
      if (busy) return;
      setBusy(true);
      try {
        const slot = slots?.find((s) => s.id === id);
        const slotName = slot?.meta?.name ?? 'Save';
        const ok = await writeSave(id, slotName);
        toast(ok ? 'Save overwritten.' : 'Save failed.', ok ? 'success' : 'danger');
        await refresh();
      } finally {
        setBusy(false);
        setPendingAction(null);
      }
    },
    [busy, slots, refresh],
  );

  /** Load an existing slot and dismiss the modal. */
  const onLoad = useCallback(
    async (id: string) => {
      if (busy) return;
      setBusy(true);
      try {
        const res = await loadSave(id);
        if (res.ok) {
          toast(`Loaded "${res.payload.meta.name}".`, 'success');
          onLoaded?.();
          onClose();
        } else {
          toast(`Load failed: ${res.reason}`, 'danger');
          log.error('load failed', res);
        }
      } finally {
        setBusy(false);
      }
    },
    [busy, onClose, onLoaded],
  );

  /** Delete a slot after confirmation. */
  const onDelete = useCallback(
    async (id: string) => {
      if (busy) return;
      setBusy(true);
      try {
        const ok = await deleteSave(id);
        toast(ok ? 'Save deleted.' : 'Delete failed.', ok ? 'success' : 'danger');
        await refresh();
      } finally {
        setBusy(false);
        setPendingAction(null);
      }
    },
    [busy, refresh],
  );

  // ── Render ───────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={mode === 'save' ? 'Save game' : 'Load game'}
      onClick={onClose}
      data-testid="save-load-modal"
    >
      <div
        className="w-full max-w-2xl bg-bg-secondary rounded-lg border border-bg-tertiary shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between border-b border-bg-tertiary px-5 py-3">
          <h2 className="font-headline text-lg font-bold text-accent-gold">
            {mode === 'save' ? 'Save Game' : 'Load Game'}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </header>

        <div className="px-5 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* ── New-save row (save mode only) ──────────────────── */}
          {mode === 'save' && (
            <section className="space-y-2" data-testid="save-create-row">
              <label
                htmlFor="save-name-input"
                className="block text-label uppercase tracking-widest text-text-muted"
              >
                Save name
              </label>
              <div className="flex gap-2">
                <input
                  id="save-name-input"
                  type="text"
                  value={name}
                  maxLength={60}
                  placeholder="e.g. Just before the vote"
                  onChange={(e) => setName(e.target.value)}
                  className="flex-1 bg-bg-primary border border-bg-tertiary rounded-sm px-3 py-2 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent-gold"
                />
                <Button variant="primary" onClick={onCreate} disabled={busy}>
                  Save
                </Button>
              </div>
            </section>
          )}

          {/* ── Slot list ─────────────────────────────────────── */}
          <section className="space-y-2" data-testid="save-slot-list">
            {slots == null && (
              <p className="text-text-muted italic">Loading saves…</p>
            )}
            {slots && slots.length === 0 && (
              <p className="text-text-muted italic">
                {mode === 'save'
                  ? 'No saved games yet — create one above.'
                  : 'No saved games yet. Start a new game from the main menu.'}
              </p>
            )}
            {slots?.map((slot) => (
              <article
                key={slot.id}
                data-testid="save-slot"
                data-slot-id={slot.id}
                data-developer={slot.meta?.developer ? 'true' : 'false'}
                className="border border-bg-tertiary rounded-sm bg-bg-primary/40 px-4 py-3 flex flex-wrap items-center gap-3"
              >
                <div className="flex-1 min-w-0">
                  {slot.meta ? (
                    <>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-headline text-text-primary truncate">
                          {slot.meta.name}
                        </span>
                        {slot.meta.developer && (
                          <span className="px-1.5 py-0.5 rounded-sm bg-status-danger/20 text-status-danger text-[0.625rem] uppercase tracking-widest">
                            Dev
                          </span>
                        )}
                      </div>
                      <p className="text-text-secondary text-sm truncate">
                        {slot.meta.characterName} · {slot.meta.weekLabel}
                      </p>
                      <p className="text-text-muted text-label">
                        {formatSavedAt(slot.meta.savedAt)}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-status-danger text-sm">
                        Slot {slot.id} (unreadable)
                      </p>
                      <p className="text-text-muted text-label">{slot.error}</p>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {mode === 'load' && slot.meta && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => void onLoad(slot.id)}
                      disabled={busy}
                    >
                      Load
                    </Button>
                  )}
                  {mode === 'save' && slot.meta && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        setPendingAction({ kind: 'overwrite', id: slot.id })
                      }
                      disabled={busy}
                    >
                      Overwrite
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Delete save ${slot.meta?.name ?? slot.id}`}
                    onClick={() =>
                      setPendingAction({ kind: 'delete', id: slot.id })
                    }
                    disabled={busy}
                  >
                    <Icon name="x" size={14} aria-hidden />
                  </Button>
                </div>
              </article>
            ))}
          </section>
        </div>
      </div>

      {/* ── Confirmation dialog ─────────────────────────────── */}
      {pendingAction && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4"
          role="alertdialog"
          aria-modal="true"
          data-testid="save-confirm"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-full max-w-sm bg-bg-secondary rounded-lg border border-status-danger/50 shadow-2xl p-5 space-y-4">
            <p className="text-text-primary">
              {pendingAction.kind === 'overwrite'
                ? 'Overwrite this save with the current game state?'
                : 'Delete this save? This cannot be undone.'}
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setPendingAction(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() =>
                  pendingAction.kind === 'overwrite'
                    ? void onOverwrite(pendingAction.id)
                    : void onDelete(pendingAction.id)
                }
              >
                {pendingAction.kind === 'overwrite' ? 'Overwrite' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
