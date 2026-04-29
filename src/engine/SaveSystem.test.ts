/**
 * SaveSystem round-trip + schema-guard tests.
 *
 * These run against the localStorage fallback path: the test setup
 * installs a `politicalAscent` bridge stub, but `hasElectronBridge`
 * is module-private, so we simulate the browser path by deleting the
 * stub before each test. That keeps the assertions independent of
 * the IPC envelope shape.
 *
 * @module engine/SaveSystem.test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  buildSavePayload,
  writeSave,
  readSave,
  listSaves,
  deleteSave,
  applySavePayload,
  SAVE_SCHEMA_VERSION,
} from './SaveSystem';
import { useGameStore } from '@/store/gameStore';
import { useCharacterStore } from '@/store/characterStore';
import { useWorldStore } from '@/store/worldStore';
import { useDevStore } from '@/store/devStore';

beforeEach(() => {
  // Force the localStorage code path so we exercise the schema/parse
  // logic without depending on the test setup's IPC stub.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (window as any).politicalAscent;
  window.localStorage.clear();
  useGameStore.getState().reset();
  useWorldStore.getState().reset();
  useCharacterStore.getState().reset();
  useDevStore.getState().disable();
});

describe('SaveSystem', () => {
  it('builds a payload with the current schema version and meta', () => {
    useCharacterStore.getState().setCharacter({
      ...useCharacterStore.getState(),
      name: 'Aurelia Vance',
    });
    const payload = buildSavePayload('  Test Save  ');
    expect(payload.meta.schemaVersion).toBe(SAVE_SCHEMA_VERSION);
    expect(payload.meta.name).toBe('Test Save');
    expect(payload.meta.characterName).toBe('Aurelia Vance');
    expect(payload.meta.developer).toBe(false);
  });

  it('tags developer-mode saves so the load list can warn the player', () => {
    useDevStore.getState().enable();
    const payload = buildSavePayload('cheat run');
    expect(payload.meta.developer).toBe(true);
  });

  it('round-trips a save through localStorage', async () => {
    useCharacterStore.getState().setCharacter({
      ...useCharacterStore.getState(),
      name: 'Round Trip',
    });
    const ok = await writeSave('slot-1', 'Round trip');
    expect(ok).toBe(true);

    const list = await listSaves();
    expect(list).toContain('slot-1');

    const res = await readSave('slot-1');
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.payload.meta.name).toBe('Round trip');
      expect(res.payload.meta.characterName).toBe('Round Trip');
    }
  });

  it('refuses payloads with the wrong schema version', async () => {
    window.localStorage.setItem(
      'pa:save:legacy',
      JSON.stringify({
        meta: { schemaVersion: 999, savedAt: 0, name: 'old', characterName: '', scenarioId: '', weekLabel: '', developer: false },
        stores: { game: {}, character: {}, world: {} },
      }),
    );
    const res = await readSave('legacy');
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toMatch(/schema/);
  });

  it('reports a missing slot without throwing', async () => {
    const res = await readSave('does-not-exist');
    expect(res.ok).toBe(false);
  });

  it('deletes saves and removes them from the list', async () => {
    await writeSave('to-remove', 'temp');
    expect(await listSaves()).toContain('to-remove');
    const ok = await deleteSave('to-remove');
    expect(ok).toBe(true);
    expect(await listSaves()).not.toContain('to-remove');
  });

  it('applySavePayload restores the captured stores', async () => {
    useGameStore.getState().addPoliticalCapital(80);
    const before = buildSavePayload('snapshot');

    // Mutate state away from the snapshot.
    useGameStore.getState().reset();
    expect(useGameStore.getState().politicalCapital).toBe(50);

    applySavePayload(before);
    expect(useGameStore.getState().politicalCapital).toBeGreaterThan(50);
  });
});
