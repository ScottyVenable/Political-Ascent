import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { CharacterState, CoreStats, Background, IdeologyPoint, TraitId } from '@/types';
import { DEFAULT_AVATAR_ID } from '@/data/avatars';

interface CharacterStoreActions {
  setCharacter: (character: CharacterState) => void;
  updateStat: (stat: keyof CoreStats, delta: number) => void;
  addTrait: (traitId: TraitId) => void;
  addXP: (amount: number) => void;
  spendSkillPoint: (skillId: string) => boolean;
  setIdeology: (ideology: IdeologyPoint) => void;
  /** Pick an avatar preset id. See `src/data/avatars`. */
  setAvatar: (avatarId: string) => void;
  /**
   * Adjust the character's personal funds by `delta` dollars.
   * Positive delta = income (salary, speaking fees, investments).
   * Negative delta = expenditure (campaign spend, fines, bribes).
   * Clamped at 0 — the character cannot go into personal debt
   * (that mechanic is deferred to a later update).
   */
  adjustFunds: (delta: number) => void;
  /**
   * Reorder the cards in `hand` to match `orderedInstanceIds`.
   *
   * Used by the cards-panel drag-and-drop reordering (see todo#3).
   * Cards present in `hand` whose ids are missing from
   * `orderedInstanceIds` are appended at the end in their original
   * order — the action is therefore safe against a stale id list,
   * which can happen if a draw lands between drag-start and drop.
   */
  reorderHand: (orderedInstanceIds: string[]) => void;
  reset: () => void;
}

type Store = CharacterState & CharacterStoreActions;

const BLANK: CharacterState = {
  id: '',
  name: '',
  background: 'citizen' as Background,
  avatarId: DEFAULT_AVATAR_ID,
  stats: { charisma: 5, strategy: 5, connections: 5, integrity: 5, wealth: 5, stamina: 5 },
  traits: [],
  ideology: { x: 0, y: 0 },
  xp: 0,
  level: 1,
  skillPoints: 0,
  unlockedSkills: [],
  // Default personal funds for a citizen background with wealth = 5.
  // Real start value is set by CharacterCreator based on background.
  personalFunds: 250000,
  hand: [],
  deck: [],
};

/** XP curve: level N requires `N * 100` XP cumulative. */
function xpToLevel(xp: number): number {
  let level = 1;
  let needed = 100;
  let remaining = xp;
  while (remaining >= needed) {
    remaining -= needed;
    level += 1;
    needed = level * 100;
  }
  return level;
}

export const useCharacterStore = create<Store>()(
  immer((set) => ({
    ...BLANK,

    setCharacter: (character) => set(() => ({ ...character })),

    updateStat: (stat, delta) =>
      set((s) => {
        s.stats[stat] = Math.max(1, Math.min(10, s.stats[stat] + delta));
      }),

    addTrait: (traitId) =>
      set((s) => {
        if (!s.traits.includes(traitId)) s.traits.push(traitId);
      }),

    addXP: (amount) =>
      set((s) => {
        s.xp += amount;
        const newLevel = xpToLevel(s.xp);
        if (newLevel > s.level) {
          s.skillPoints += newLevel - s.level;
          s.level = newLevel;
        }
      }),

    spendSkillPoint: (skillId) => {
      let success = false;
      set((s) => {
        if (s.skillPoints > 0 && !s.unlockedSkills.includes(skillId)) {
          s.skillPoints -= 1;
          s.unlockedSkills.push(skillId);
          success = true;
        }
      });
      return success;
    },

    setIdeology: (ideology) =>
      set((s) => {
        s.ideology = ideology;
      }),

    setAvatar: (avatarId) =>
      set((s) => {
        s.avatarId = avatarId;
      }),

    adjustFunds: (delta) =>
      set((s) => {
        s.personalFunds = Math.max(0, (s.personalFunds ?? 0) + delta);
      }),

    reorderHand: (orderedInstanceIds) =>
      set((s) => {
        // Build the new hand by walking the requested order and
        // pulling each matching instance out of the current hand. This
        // preserves the CardInstance identities (lastPlayedWeek,
        // timesPlayed, etc.) instead of replacing them with new
        // objects, which would invalidate React keys and trigger a
        // full re-mount of every card in the grid.
        const remaining = new Map(s.hand.map((c) => [c.instanceId, c]));
        const next: typeof s.hand = [];
        for (const id of orderedInstanceIds) {
          const inst = remaining.get(id);
          if (inst) {
            next.push(inst);
            remaining.delete(id);
          }
        }
        // Anything that wasn't in the requested order is appended —
        // typically a card drawn between drag-start and drop.
        for (const inst of remaining.values()) next.push(inst);
        s.hand = next;
      }),

    reset: () => set(() => ({ ...BLANK })),
  })),
);
