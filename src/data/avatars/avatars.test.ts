/**
 * Unit tests for the avatar preset registry.
 *
 * @module data/avatars/avatars.test
 */
import { describe, it, expect } from 'vitest';
import { AVATAR_PRESETS, DEFAULT_AVATAR_ID, getAvatarPreset } from './index';

describe('avatar presets', () => {
  it('ships at least four presets', () => {
    expect(AVATAR_PRESETS.length).toBeGreaterThanOrEqual(4);
  });

  it('every preset has a stable id, label, icon, and accent', () => {
    for (const preset of AVATAR_PRESETS) {
      expect(preset.id).toMatch(/^[a-z][a-z0-9-]*$/);
      expect(preset.label.length).toBeGreaterThan(0);
      expect(preset.icon.length).toBeGreaterThan(0);
      expect(['accent-gold', 'accent-blue', 'accent-red']).toContain(preset.accent);
    }
  });

  it('preset ids are unique', () => {
    const seen = new Set<string>();
    for (const preset of AVATAR_PRESETS) {
      expect(seen.has(preset.id)).toBe(false);
      seen.add(preset.id);
    }
  });

  it('DEFAULT_AVATAR_ID resolves to a real preset', () => {
    expect(AVATAR_PRESETS.some((p) => p.id === DEFAULT_AVATAR_ID)).toBe(true);
  });

  it('getAvatarPreset returns the matching preset', () => {
    const target = AVATAR_PRESETS[1];
    expect(getAvatarPreset(target.id).id).toBe(target.id);
  });

  it('getAvatarPreset falls back to the first preset for unknown ids', () => {
    expect(getAvatarPreset('not-a-real-id').id).toBe(AVATAR_PRESETS[0].id);
  });

  it('getAvatarPreset falls back when given null or undefined', () => {
    expect(getAvatarPreset(null).id).toBe(AVATAR_PRESETS[0].id);
    expect(getAvatarPreset(undefined).id).toBe(AVATAR_PRESETS[0].id);
  });
});
