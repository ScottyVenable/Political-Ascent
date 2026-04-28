/**
 * Unit tests for `stripTermMarkers` — the glossary's plain-text
 * fallback that turns `[term:id]label[/]` markers into the visible
 * label without leaking the id or trailing `[/]` token. Regression
 * coverage for the bug Codex flagged on PR #57.
 *
 * @module renderer/panels/GlossaryPanel.test
 */

import { describe, it, expect } from 'vitest';
import { stripTermMarkers } from './GlossaryPanel';

describe('stripTermMarkers', () => {
  it('returns the input untouched when no markers are present', () => {
    expect(stripTermMarkers('plain prose')).toBe('plain prose');
  });

  it('keeps the visible label and drops the closing token', () => {
    expect(stripTermMarkers('Open [term:card-pack]packs[/].')).toBe('Open packs.');
  });

  it('substitutes the id when there is no explicit label', () => {
    expect(stripTermMarkers('Use [term:approval] to gauge mood.')).toBe(
      'Use approval to gauge mood.',
    );
  });

  it('handles multiple consecutive markers without leaking content', () => {
    const out = stripTermMarkers(
      'Spend [term:political-capital]PC[/] to whip [term:cohort]cohorts[/].',
    );
    expect(out).toBe('Spend PC to whip cohorts.');
  });

  it('does not splice the id into adjacent words (PR57 regression)', () => {
    // Buggy single-token replace produced "card-packpacks[/]" — make
    // sure we never regress to that shape.
    const out = stripTermMarkers('See [term:card-pack]packs[/] for more.');
    expect(out).not.toContain('card-pack');
    expect(out).not.toContain('[/]');
    expect(out).toBe('See packs for more.');
  });

  it('treats unmatched openers as bracketless markers', () => {
    // No `[/]` means render the id, not garbage.
    expect(stripTermMarkers('A [term:foo] sentence.')).toBe('A foo sentence.');
  });
});
