/**
 * SaveSystem — capture and restore a complete game state.
 *
 * Where this fits in the architecture:
 *   - The single authority on serialising and restoring runs. Every
 *     other surface (main menu "Continue", in-game pause "Save game",
 *     load list) calls into this module rather than touching the
 *     stores directly.
 *   - Storage is platform-aware: in Electron the save lives in
 *     `electron-store` (already wired in `src/main/main.ts` via the
 *     `pa:save:*` IPC handlers); in browser/Capacitor it lives under
 *     `localStorage` with the same key shape, so the rest of the
 *     app does not have to care which it's running in.
 *   - The payload is a flat record of the four engine-relevant
 *     stores plus a metadata header so the load list can render a
 *     row without having to deserialise the whole payload first.
 *
 * Schema versioning:
 *   - The current schema version is `SAVE_SCHEMA_VERSION`. Loaders
 *     check this and refuse mismatched payloads with a clear error
 *     rather than silently importing a malformed shape. A future
 *     migration system can hook here without ripping the call sites.
 *
 * Developer-mode tagging (todo#21):
 *   - Saves taken while `useDevStore.getState().enabled === true`
 *     receive `meta.developer = true`. The load UI surfaces a chip
 *     so a player who tried dev mode once does not accidentally
 *     resume it in their "main" run.
 *
 * @module engine/SaveSystem
 */

import { useGameStore } from '@/store/gameStore';
import { useCharacterStore } from '@/store/characterStore';
import { useWorldStore } from '@/store/worldStore';
import { useDevStore } from '@/store/devStore';
import { createLogger } from '@/utils/logger';

const log = createLogger('save');

/** Bumped on any breaking change to the payload shape. */
export const SAVE_SCHEMA_VERSION = 1;
/** Defensive slot-id policy shared across runtimes (renderer + Electron IPC). */
const SLOT_ID_RE = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/;
const RESERVED_SLOT_IDS = new Set(['__proto__', 'prototype', 'constructor']);

/**
 * Header that travels alongside every save. Kept slim enough to render
 * in a list without parsing the (potentially large) payload body.
 */
export interface SaveMeta {
  /** The schema version this payload was written against. */
  schemaVersion: number;
  /** Wall-clock timestamp the save was taken (ms since epoch). */
  savedAt: number;
  /** Player-supplied save name (free text, max 60 chars). */
  name: string;
  /** Character name at save-time, for the load list summary. */
  characterName: string;
  /** Scenario id at save-time. */
  scenarioId: string;
  /** Game year-week label at save-time, e.g. `"2025 · W12"`. */
  weekLabel: string;
  /** True if dev mode was enabled when the save was taken. */
  developer: boolean;
}

/** Full serialised payload. */
export interface SavePayload {
  meta: SaveMeta;
  /** A snapshot of the four authoritative stores. */
  stores: {
    game: unknown;
    character: unknown;
    world: unknown;
  };
}

/** Result returned by the read paths. Discriminated union for ergonomics. */
export type LoadResult =
  | { ok: true; payload: SavePayload }
  | { ok: false; reason: string };

/** localStorage key prefix used in browser/Capacitor builds. */
const LS_PREFIX = 'pa:save:';

/**
 * Validate user/code-provided slot ids before they touch persistence.
 *
 * Why strict?
 * - Saves are keyed by user-visible ids and cross process boundaries (IPC).
 * - Rejecting odd keys up front avoids edge-case corruption and object-key
 *   prototype traps (`__proto__`, `constructor`, etc.).
 */
export function isValidSlotId(slotId: string): boolean {
  return (
    SLOT_ID_RE.test(slotId) &&
    !RESERVED_SLOT_IDS.has(slotId)
  );
}

/** True if the Electron preload bridge is present in this runtime. */
function hasElectronBridge(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof (window as unknown as { politicalAscent?: unknown }).politicalAscent ===
      'object'
  );
}

/** Read the bridge object once, narrowed to the saves API. */
function bridge(): {
  list: () => Promise<string[]>;
  read: (id: string) => Promise<unknown>;
  write: (id: string, payload: unknown) => Promise<boolean>;
  delete: (id: string) => Promise<boolean>;
} {
  return (window as unknown as {
    politicalAscent: { saves: ReturnType<typeof bridge> };
  }).politicalAscent.saves;
}

/**
 * Build a `SavePayload` from the live stores. Pure data — no side
 * effects, safe to call whenever you need a snapshot (e.g. for an
 * autosave preview).
 *
 * The `name` argument is free text; we trim and truncate it so the
 * load list can render without overflow.
 */
export function buildSavePayload(name: string): SavePayload {
  const game = useGameStore.getState();
  const character = useCharacterStore.getState();
  const world = useWorldStore.getState();
  const dev = useDevStore.getState();
  const cleanName = name.trim().slice(0, 60) || 'Untitled save';

  const meta: SaveMeta = {
    schemaVersion: SAVE_SCHEMA_VERSION,
    savedAt: Date.now(),
    name: cleanName,
    characterName: character.name || '(unnamed)',
    scenarioId: game.scenarioId,
    weekLabel: `${game.year} · W${game.week}`,
    developer: dev.enabled,
  };

  // Strip Zustand actions out of the snapshot. Persisting functions
  // through `JSON.stringify` would silently drop them anyway, but
  // doing it explicitly keeps the payload self-describing in any
  // logs that print it.
  return {
    meta,
    stores: {
      game: stripFunctions(game),
      character: stripFunctions(character),
      world: stripFunctions(world),
    },
  };
}

/**
 * Recursively strip function-typed values out of an object. Used to
 * exclude the action methods on Zustand stores from serialisation.
 * Functions on plain values (e.g. arrays) are preserved as-is for
 * type stability; in practice none of the tracked stores nest
 * functions inside data fields, so this is sufficient.
 */
function stripFunctions<T>(value: T): T {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value as T;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (typeof v === 'function') continue;
    out[k] = v;
  }
  return out as T;
}

/** Narrow unknown to a plain object (not null, not array). */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** Runtime-validate metadata so corrupt saves fail cleanly instead of crashing later. */
function isValidMeta(meta: unknown): meta is SaveMeta {
  if (!isPlainObject(meta)) return false;
  return (
    meta.schemaVersion === SAVE_SCHEMA_VERSION &&
    typeof meta.savedAt === 'number' &&
    Number.isFinite(meta.savedAt) &&
    typeof meta.name === 'string' &&
    typeof meta.characterName === 'string' &&
    typeof meta.scenarioId === 'string' &&
    typeof meta.weekLabel === 'string' &&
    typeof meta.developer === 'boolean'
  );
}

/** Runtime-validate store payload containers before we pass data to Zustand. */
function isValidStores(stores: unknown): stores is SavePayload['stores'] {
  if (!isPlainObject(stores)) return false;
  return (
    isPlainObject(stores.game) &&
    isPlainObject(stores.character) &&
    isPlainObject(stores.world)
  );
}

/**
 * Type-guard a payload returned from storage. Returns true only if
 * the shape matches the current schema version. We do not attempt to
 * migrate older payloads here — that's a follow-up when we actually
 * have a v2 schema.
 */
function isValidPayload(p: unknown): p is SavePayload {
  if (!isPlainObject(p)) return false;
  return isValidMeta(p.meta) && isValidStores(p.stores);
}

/** Best-effort read of payload schema version for clearer user-facing errors. */
function readPayloadSchemaVersion(p: unknown): number | null {
  if (!isPlainObject(p)) return null;
  if (!isPlainObject(p.meta)) return null;
  const version = p.meta.schemaVersion;
  return typeof version === 'number' && Number.isFinite(version) ? version : null;
}

/**
 * Persist a save under the given slot id. Returns true on success.
 * Slot ids are arbitrary strings; the caller picks a UUID-like value
 * (or `"autosave"` for the rolling autosave slot).
 */
export async function writeSave(slotId: string, name: string): Promise<boolean> {
  if (!isValidSlotId(slotId)) {
    log.warn('writeSave rejected invalid slot id', { slotId });
    return false;
  }
  const payload = buildSavePayload(name);
  try {
    if (hasElectronBridge()) {
      const ok = await bridge().write(slotId, payload);
      log.info('writeSave (bridge)', { slotId, ok });
      return ok;
    }
    window.localStorage.setItem(LS_PREFIX + slotId, JSON.stringify(payload));
    log.info('writeSave (localStorage)', { slotId });
    return true;
  } catch (err) {
    log.error('writeSave failed', err);
    return false;
  }
}

/**
 * Read a save by slot id. Returns a discriminated union so the caller
 * can present a useful error message rather than treating "not found"
 * the same as "corrupt".
 */
export async function readSave(slotId: string): Promise<LoadResult> {
  if (!isValidSlotId(slotId)) {
    return { ok: false, reason: 'Invalid save slot id.' };
  }
  try {
    let raw: unknown;
    if (hasElectronBridge()) {
      const slot = await bridge().read(slotId);
      // The bridge returns `{ version, savedAt, payload }`; we want
      // the inner payload. Older slots predate the wrapper and are
      // already shaped like a SavePayload.
      raw = (slot as { payload?: unknown } | null)?.payload ?? slot;
    } else {
      const text = window.localStorage.getItem(LS_PREFIX + slotId);
      raw = text ? (JSON.parse(text) as unknown) : null;
    }
    if (raw == null) return { ok: false, reason: 'Save not found.' };
    if (!isValidPayload(raw)) {
      const foundVersion = readPayloadSchemaVersion(raw);
      if (foundVersion !== null && foundVersion !== SAVE_SCHEMA_VERSION) {
        return {
          ok: false,
          reason: `Save schema mismatch (expected v${SAVE_SCHEMA_VERSION}).`,
        };
      }
      return { ok: false, reason: 'Save payload is invalid or corrupt.' };
    }
    return { ok: true, payload: raw };
  } catch (err) {
    log.error('readSave failed', err);
    return { ok: false, reason: 'Could not read save (see logs).' };
  }
}

/** List every slot id known to the active backend. */
export async function listSaves(): Promise<string[]> {
  try {
    if (hasElectronBridge()) return await bridge().list();
    const ids: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (!k || !k.startsWith(LS_PREFIX)) continue;
      const id = k.slice(LS_PREFIX.length);
      if (isValidSlotId(id)) ids.push(id);
    }
    return ids;
  } catch (err) {
    log.error('listSaves failed', err);
    return [];
  }
}

/**
 * Delete a save. Returns true on success. Missing slot returns false
 * but does not throw — the load UI treats both the same.
 */
export async function deleteSave(slotId: string): Promise<boolean> {
  if (!isValidSlotId(slotId)) return false;
  try {
    if (hasElectronBridge()) return await bridge().delete(slotId);
    const key = LS_PREFIX + slotId;
    if (window.localStorage.getItem(key) === null) return false;
    window.localStorage.removeItem(key);
    return true;
  } catch (err) {
    log.error('deleteSave failed', err);
    return false;
  }
}

/**
 * Apply a payload to the live stores, replacing their contents. The
 * caller is responsible for any UI navigation (e.g. routing back to
 * the Game screen) — this function only restores state.
 */
export function applySavePayload(payload: SavePayload): void {
  // Merge (replace=false) rather than full-replace. Zustand's
  // `setState(state, true)` wipes everything — including the action
  // methods bound by the store factory — which would leave callers
  // calling `game.setSpeed(...)` against a plain data object after a
  // load. By merging instead we keep the action surface intact while
  // every persisted data field is overwritten by the snapshot. The
  // cast is intentional: the snapshot is `unknown` until the
  // schema-version gate in `isValidPayload` clears it.
  useGameStore.setState(payload.stores.game as object);
  useCharacterStore.setState(payload.stores.character as object);
  useWorldStore.setState(payload.stores.world as object);
  log.info('save applied', { meta: payload.meta });
}

/**
 * Convenience: read + apply in one call. Returns the meta on success
 * so the caller can confirm to the player which save was loaded.
 */
export async function loadSave(slotId: string): Promise<LoadResult> {
  const res = await readSave(slotId);
  if (res.ok) applySavePayload(res.payload);
  return res;
}
