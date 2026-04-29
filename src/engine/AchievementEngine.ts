import type { AchievementDefinition, Requirement } from '@/types';
import { useGameStore } from '@/store/gameStore';
import { useWorldStore } from '@/store/worldStore';
import { useCharacterStore } from '@/store/characterStore';
import { useUIStore } from '@/store/uiStore';
import { createLogger } from '@/utils/logger';

const log = createLogger('AchievementEngine');

/**
 * AchievementEngine — evaluates unlock conditions and records unlocks.
 *
 * Definitions come from `src/data/achievements/achievements.json` — never
 * hardcoded here.
 */
export interface AchievementEngineAPI {
  registerAchievements(defs: readonly AchievementDefinition[]): void;
  check(): void;
  /** Return the full list of registered achievement definitions. */
  all(): AchievementDefinition[];
}

class AchievementEngineImpl implements AchievementEngineAPI {
  private registry = new Map<string, AchievementDefinition>();

  registerAchievements(defs: readonly AchievementDefinition[]): void {
    for (const d of defs) this.registry.set(d.id, d);
    log.info('registered', { count: defs.length });
  }

  all(): AchievementDefinition[] {
    return Array.from(this.registry.values());
  }

  check(): void {
    const world = useWorldStore.getState();
    for (const def of this.registry.values()) {
      if (world.unlockedAchievements.includes(def.id)) continue;
      if (def.scenarioId && useGameStore.getState().scenarioId !== def.scenarioId) continue;

      const allMet = def.conditions.every((c) => evaluateRequirement(c));
      if (allMet) {
        world.unlockAchievement(def.id);
        useUIStore.getState().pushToast({
          message: `Achievement unlocked \u2014 ${def.name}`,
          severity: 'success',
          ttl: 5000,
          // todo#54: clicking the toast opens the Achievements screen.
          actionRoute: 'achievements',
        });
        log.info('unlocked', def.id);
      }
    }
  }
}

function evaluateRequirement(req: Requirement): boolean {
  const game = useGameStore.getState();
  const char = useCharacterStore.getState();
  const world = useWorldStore.getState();
  switch (req.type) {
    case 'stat':
      return compare(char.stats[req.stat], req.operator, req.value);
    case 'trait':
      return char.traits.includes(req.traitId as never);
    case 'relationship': {
      const rel = world.relationships[req.npcId] ?? 0;
      return compare(rel, req.operator === 'gt' ? 'gt' : 'lt', req.value);
    }
    case 'flag':
      return (world.flags[req.flag] ?? false) === req.value;
  }
  // Unreachable — used for exhaustive `game` consumption to silence linter.
  void game;
  return false;
}

function compare(left: number, op: string, right: number): boolean {
  switch (op) {
    case 'gt': return left > right;
    case 'gte': return left >= right;
    case 'lt': return left < right;
    case 'lte': return left <= right;
    case 'eq': return left === right;
    default: return false;
  }
}

export const AchievementEngine: AchievementEngineAPI = new AchievementEngineImpl();
