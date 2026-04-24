import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { CharacterState, CoreStats, Background, IdeologyPoint, TraitId } from '@/types';

interface CharacterStoreActions {
  setCharacter: (character: CharacterState) => void;
  updateStat: (stat: keyof CoreStats, delta: number) => void;
  addTrait: (traitId: TraitId) => void;
  addXP: (amount: number) => void;
  spendSkillPoint: (skillId: string) => boolean;
  setIdeology: (ideology: IdeologyPoint) => void;
  reset: () => void;
}

type Store = CharacterState & CharacterStoreActions;

const BLANK: CharacterState = {
  id: '',
  name: '',
  background: 'citizen' as Background,
  stats: { charisma: 5, strategy: 5, connections: 5, integrity: 5, wealth: 5, stamina: 5 },
  traits: [],
  ideology: { x: 0, y: 0 },
  xp: 0,
  level: 1,
  skillPoints: 0,
  unlockedSkills: [],
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

    reset: () => set(() => ({ ...BLANK })),
  })),
);
