/**
 * Avatar preset registry.
 *
 * The game does not (and per AGENTS.md §2.9 cannot) ship AI-generated
 * portrait art. Instead, the player picks from a curated list of
 * symbolic presets — each one is an icon glyph + tone colour rendered
 * in a circular medallion. This keeps the visual language consistent
 * with the rest of the UI (every pictogram is from the Icon registry)
 * while giving the player meaningful identity choices.
 *
 * Each preset references an icon id from `renderer/components/Icon`
 * and a Tailwind colour token. Loaders validate at boot.
 *
 * @module data/avatars
 */

import type { IconName } from '@/renderer/components/Icon';
import data from '@/data/avatars/avatars.json';

/**
 * One avatar entry. The accent string is a Tailwind colour token (e.g.
 * `accent-gold`) without the `text-` / `bg-` prefix; consumers compose
 * the prefix to use it.
 */
export interface AvatarPreset {
  /** Stable id persisted with the character. */
  readonly id: string;
  /** Player-facing label shown in the picker. */
  readonly label: string;
  /** One-line flavour description. */
  readonly description: string;
  /** Glyph drawn inside the medallion. */
  readonly icon: IconName;
  /** Tailwind colour token used as the medallion ring + glyph tint. */
  readonly accent: 'accent-gold' | 'accent-blue' | 'accent-red';
}

interface AvatarsFile {
  readonly $schemaVersion: number;
  readonly presets: AvatarPreset[];
}

const FILE = data as AvatarsFile;

/** Read-only snapshot of every avatar preset. */
export const AVATAR_PRESETS: readonly AvatarPreset[] = FILE.presets;

/** The id used when the player has not picked one yet. */
export const DEFAULT_AVATAR_ID = AVATAR_PRESETS[0]?.id ?? 'civic-organizer';

/**
 * Look up a preset by id. Falls back to the first preset if the id is
 * unknown — this keeps old saves rendering instead of crashing if an
 * avatar is removed in a future content update.
 */
export function getAvatarPreset(id: string | undefined | null): AvatarPreset {
  if (id) {
    const found = AVATAR_PRESETS.find((p) => p.id === id);
    if (found) return found;
  }
  return AVATAR_PRESETS[0];
}
