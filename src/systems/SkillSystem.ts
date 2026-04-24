import type { Effect } from '@/types';
import { useCharacterStore } from '@/store/characterStore';
import { applyEffects } from '@/engine/applyEffect';
import { createLogger } from '@/utils/logger';

const log = createLogger('SkillSystem');

/**
 * SkillSystem — the player progression tree.
 *
 * Skill definitions are defined here (as data, not behaviour) so they ship
 * with the engine — they're referenced by every system. Unlock triggers
 * effects that are applied through the standard `applyEffects` pipeline.
 */
export interface SkillDefinition {
  id: string;
  name: string;
  description: string;
  /** Branch for UI grouping. */
  branch: 'charisma' | 'strategy' | 'connections' | 'integrity' | 'stamina' | 'wealth';
  /** Cumulative level required to spend a point here. */
  requiredLevel: number;
  /** Skill IDs that must be unlocked first. */
  prerequisites: string[];
  /** Effects applied once on unlock. */
  effects: Effect[];
}

export interface SkillSystemAPI {
  all(): SkillDefinition[];
  get(id: string): SkillDefinition | undefined;
  canUnlock(id: string): { ok: boolean; reason?: string };
  unlock(id: string): boolean;
}

const SKILL_TREE: SkillDefinition[] = [
  // Charisma branch
  {
    id: 'skill-orator',
    name: 'Accomplished Orator',
    description: '+1 Charisma permanently.',
    branch: 'charisma',
    requiredLevel: 2,
    prerequisites: [],
    effects: [{ type: 'stat', target: 'charisma', value: 1 }],
  },
  {
    id: 'skill-charmer',
    name: 'Chamber Charmer',
    description: '+1 Charisma and +10 political capital.',
    branch: 'charisma',
    requiredLevel: 4,
    prerequisites: ['skill-orator'],
    effects: [
      { type: 'stat', target: 'charisma', value: 1 },
      { type: 'resource', resource: 'politicalCapital', value: 10 },
    ],
  },
  // Strategy branch
  {
    id: 'skill-analyst',
    name: 'Policy Analyst',
    description: '+1 Strategy permanently.',
    branch: 'strategy',
    requiredLevel: 2,
    prerequisites: [],
    effects: [{ type: 'stat', target: 'strategy', value: 1 }],
  },
  {
    id: 'skill-tactician',
    name: 'Floor Tactician',
    description: '+1 Strategy, +15 political capital.',
    branch: 'strategy',
    requiredLevel: 4,
    prerequisites: ['skill-analyst'],
    effects: [
      { type: 'stat', target: 'strategy', value: 1 },
      { type: 'resource', resource: 'politicalCapital', value: 15 },
    ],
  },
  // Connections branch
  {
    id: 'skill-networker',
    name: 'Insider Networker',
    description: '+1 Connections permanently.',
    branch: 'connections',
    requiredLevel: 2,
    prerequisites: [],
    effects: [{ type: 'stat', target: 'connections', value: 1 }],
  },
  // Integrity branch
  {
    id: 'skill-principled',
    name: 'Principled Voice',
    description: '+1 Integrity permanently.',
    branch: 'integrity',
    requiredLevel: 2,
    prerequisites: [],
    effects: [{ type: 'stat', target: 'integrity', value: 1 }],
  },
  // Stamina branch
  {
    id: 'skill-iron-will',
    name: 'Iron Will',
    description: '+1 Stamina permanently.',
    branch: 'stamina',
    requiredLevel: 2,
    prerequisites: [],
    effects: [{ type: 'stat', target: 'stamina', value: 1 }],
  },
  // Wealth branch
  {
    id: 'skill-fundraiser',
    name: 'Prolific Fundraiser',
    description: '+1 Wealth, +20 political capital.',
    branch: 'wealth',
    requiredLevel: 3,
    prerequisites: [],
    effects: [
      { type: 'stat', target: 'wealth', value: 1 },
      { type: 'resource', resource: 'politicalCapital', value: 20 },
    ],
  },
];

const tree = new Map<string, SkillDefinition>(SKILL_TREE.map((s) => [s.id, s]));

export const SkillSystem: SkillSystemAPI = {
  all: () => Array.from(tree.values()),
  get: (id) => tree.get(id),

  canUnlock(id) {
    const def = tree.get(id);
    if (!def) return { ok: false, reason: 'Unknown skill' };

    const char = useCharacterStore.getState();
    if (char.unlockedSkills.includes(id)) return { ok: false, reason: 'Already unlocked' };
    if (char.skillPoints <= 0) return { ok: false, reason: 'No skill points' };
    if (char.level < def.requiredLevel) {
      return { ok: false, reason: `Requires level ${def.requiredLevel}` };
    }
    for (const p of def.prerequisites) {
      if (!char.unlockedSkills.includes(p)) {
        return { ok: false, reason: `Requires prerequisite skill: ${p}` };
      }
    }
    return { ok: true };
  },

  unlock(id) {
    const check = SkillSystem.canUnlock(id);
    if (!check.ok) return false;
    const def = tree.get(id);
    if (!def) return false;
    const char = useCharacterStore.getState();
    const success = char.spendSkillPoint(id);
    if (!success) return false;
    applyEffects(def.effects);
    log.info('skill unlocked', id);
    return true;
  },
};
