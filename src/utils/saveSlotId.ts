/**
 * Save-slot id validation shared by renderer and Electron main process.
 *
 * Why shared:
 * - Save ids cross the renderer/main IPC boundary.
 * - Keeping one validator prevents policy drift in this security-sensitive path.
 *
 * @module utils/saveSlotId
 */

/** Slot ids are short ASCII identifiers safe as object keys and storage suffixes. */
const SLOT_ID_RE = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/;
/** Block prototype-trap keys even if they match the regex. */
const RESERVED_SLOT_IDS = new Set(['__proto__', 'prototype', 'constructor']);

/**
 * Returns true only for safe, expected save slot ids.
 *
 * @param slotId Candidate slot id from UI, tests, or IPC.
 * @returns `true` when the id matches policy and is not reserved.
 */
export function isValidSaveSlotId(slotId: unknown): slotId is string {
  return (
    typeof slotId === 'string' &&
    SLOT_ID_RE.test(slotId) &&
    !RESERVED_SLOT_IDS.has(slotId)
  );
}
