/**
 * Tests for buildProfile() — Build Your Candidate archetype roll-up.
 *
 * @module utils/buildProfile.test
 */
import { describe, it, expect } from 'vitest';
import { buildProfile } from './buildProfile';
import type { CoreStats } from '../types/character';

const flat = (v: number): CoreStats => ({
  charisma: v,
  strategy: v,
  connections: v,
  integrity: v,
  wealth: v,
  stamina: v,
});

describe('buildProfile', () => {
  it('returns three archetypes in canonical order', () => {
    const profile = buildProfile(flat(5));
    expect(profile.map((p) => p.archetype)).toEqual(['persuasion', 'operations', 'resources']);
  });

  it('averages the two contributing stats per archetype', () => {
    const profile = buildProfile({
      charisma: 8,
      connections: 6, // persuasion avg = 7
      strategy: 4,
      integrity: 4, // operations avg = 4
      wealth: 2,
      stamina: 2, // resources avg = 2
    });
    expect(profile[0]).toMatchObject({ archetype: 'persuasion', score: 7, tier: 'strong' });
    expect(profile[1]).toMatchObject({ archetype: 'operations', score: 4, tier: 'average' });
    expect(profile[2]).toMatchObject({ archetype: 'resources', score: 2, tier: 'weak' });
  });

  it('rounds score to one decimal place', () => {
    // 5 + 6 = 11 / 2 = 5.5 → rounded display 5.5
    const profile = buildProfile({
      charisma: 5,
      connections: 6,
      strategy: 5,
      integrity: 5,
      wealth: 5,
      stamina: 5,
    });
    expect(profile[0].score).toBe(5.5);
  });

  it('exposes the contributing stat keys for UI labelling', () => {
    const profile = buildProfile(flat(5));
    expect(profile[0].contributors).toEqual(['charisma', 'connections']);
    expect(profile[1].contributors).toEqual(['strategy', 'integrity']);
    expect(profile[2].contributors).toEqual(['wealth', 'stamina']);
  });

  it('returns a non-empty blurb for every tier', () => {
    for (const v of [1, 4, 6, 9]) {
      const profile = buildProfile(flat(v));
      for (const entry of profile) {
        expect(entry.blurb.length).toBeGreaterThan(10);
      }
    }
  });

  it('exceptional tier triggers at score >= 8', () => {
    const profile = buildProfile(flat(8));
    expect(profile.every((p) => p.tier === 'exceptional')).toBe(true);
  });
});
