import type {
  QuestDefinition,
  QuestInstance,
  QuestObjective,
  QuestId,
  Bill,
} from '@/types';
import { useCharacterStore } from '@/store/characterStore';
import { useGameStore } from '@/store/gameStore';
import { useWorldStore } from '@/store/worldStore';
import { applyEffects } from '@/engine/applyEffect';
import { makeId } from '@/utils/id';
import { createLogger } from '@/utils/logger';

const log = createLogger('QuestSystem');

/**
 * QuestSystem — tracks quest instances, evaluates objectives, dispenses
 * rewards.
 *
 * Quest definitions live in JSON. The player's active quests live on the
 * world store. Objectives are evaluated every daily tick; reward effects are
 * funnelled through `applyEffects` on completion.
 */
export interface QuestSystemAPI {
  register(defs: readonly QuestDefinition[]): void;
  getDefinition(id: QuestId): QuestDefinition | undefined;
  allDefinitions(): QuestDefinition[];
  /** Start a quest if prerequisites are satisfied and it isn't already active. */
  start(id: QuestId): boolean;
  /** Evaluate all active quests; complete/fail/progress as appropriate. */
  dailyUpdate(): void;
}

class QuestSystemImpl implements QuestSystemAPI {
  private registry = new Map<QuestId, QuestDefinition>();
  /** Tracks the day index at which each quest instance started. */
  private startedDays = new Map<string, number>();

  register(defs: readonly QuestDefinition[]): void {
    for (const d of defs) this.registry.set(d.id, d);
    log.info('registered', { count: defs.length });
  }

  getDefinition(id: QuestId): QuestDefinition | undefined {
    return this.registry.get(id);
  }

  allDefinitions(): QuestDefinition[] {
    return Array.from(this.registry.values());
  }

  start(id: QuestId): boolean {
    const def = this.registry.get(id);
    if (!def) return false;

    const world = useWorldStore.getState();
    if (world.activeQuests.some((q) => q.questId === id)) return false;

    for (const prereq of def.prerequisites) {
      // Must be completed previously (tracked via flag set on completion).
      if (!world.flags[`quest-complete:${prereq}`]) return false;
    }

    const game = useGameStore.getState();
    const inst: QuestInstance = {
      instanceId: makeId('quest'),
      questId: id,
      status: 'active',
      startedAt: `${game.currentDate.year}-${game.currentDate.month}-${game.currentDate.day}`,
      progress: Object.fromEntries(def.objectives.map((o) => [o.id, false])),
    };
    world.addQuest(inst);
    this.startedDays.set(inst.instanceId, dayIndex(game.currentDate));
    log.info('quest started', id);
    return true;
  }

  dailyUpdate(): void {
    const world = useWorldStore.getState();
    const game = useGameStore.getState();

    // Handle `trigger_quest` effect requests (set as flags by applyEffect).
    for (const [flag, val] of Object.entries(world.flags)) {
      if (!val || !flag.startsWith('quest-requested:')) continue;
      const requested = flag.slice('quest-requested:'.length) as QuestId;
      if (this.start(requested)) {
        world.setFlag(flag, false);
      } else {
        // Clear the request either way so it doesn't spam every tick.
        world.setFlag(flag, false);
      }
    }

    for (const inst of world.activeQuests) {
      if (inst.status !== 'active') continue;
      const def = this.registry.get(inst.questId);
      if (!def) continue;

      // Timeout check.
      const started = this.startedDays.get(inst.instanceId);
      if (def.timeLimitDays !== undefined && started !== undefined) {
        const elapsed = dayIndex(game.currentDate) - started;
        if (elapsed > def.timeLimitDays) {
          world.updateQuest(inst.instanceId, { status: 'failed' });
          continue;
        }
      }

      const progress = { ...inst.progress };
      let changed = false;
      for (const obj of def.objectives) {
        if (progress[obj.id]) continue;
        if (evaluateObjective(obj, world.passedLegislation, started ?? 0, game)) {
          progress[obj.id] = true;
          changed = true;
        }
      }

      if (changed) {
        world.updateQuest(inst.instanceId, { progress });
        const done = def.objectives.every((o) => progress[o.id]);
        if (done) {
          world.updateQuest(inst.instanceId, { status: 'completed' });
          world.setFlag(`quest-complete:${inst.questId}`, true);
          applyEffects(def.rewardEffects);
          world.pushNews({
            id: makeId('news'),
            date: game.currentDate,
            headline: `Quest completed: ${def.title}`,
            severity: 'info',
          });
        }
      }
    }
  }
}

/** Rough day index since year 0 — sufficient for delta-comparison. */
function dayIndex(d: { year: number; month: number; day: number }): number {
  return d.year * 365 + d.month * 31 + d.day;
}

function evaluateObjective(
  obj: QuestObjective,
  passedBills: readonly Bill[],
  questStartDay: number,
  game: { week: number; currentDate: { year: number; month: number; day: number } },
): boolean {
  if (obj.completed) return true;
  const check = obj.check;

  if ('type' in check && check.type === 'pass_bill') {
    const tags = check.tags;
    return passedBills.some((b) => tags.every((t) => b.tags.includes(t as never)));
  }
  if ('type' in check && check.type === 'week_elapsed') {
    const now = dayIndex(game.currentDate);
    return (now - questStartDay) >= check.weeks * 7;
  }
  if ('type' in check && check.type === 'stat') {
    const char = useCharacterStore.getState();
    const value = char.stats[check.stat];
    return compare(value, check.operator, check.value);
  }
  if ('type' in check && check.type === 'flag') {
    const flags = useWorldStore.getState().flags;
    return (flags[check.flag] ?? false) === check.value;
  }
  if ('type' in check && check.type === 'relationship') {
    const rel = useWorldStore.getState().relationships[check.npcId] ?? 0;
    return compare(rel, check.operator, check.value);
  }
  if ('type' in check && check.type === 'trait') {
    return useCharacterStore.getState().traits.some((t) => (t as unknown as string) === check.traitId);
  }
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

export const QuestSystem: QuestSystemAPI = new QuestSystemImpl();
