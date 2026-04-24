import type {
  CardDefinition,
  GameEventDefinition,
  QuestDefinition,
  AchievementDefinition,
  BillTemplate,
  TraitDefinition,
  ScenarioDefinition,
  PopulationGroup,
  EconomicState,
  ScenarioId,
  CardId,
  EventId,
  QuestId,
  AchievementId,
  TraitId,
} from '@/types';
import type { DataBundle } from './GameEngine';
import { createLogger } from '@/utils/logger';

const log = createLogger('dataLoader');

/**
 * Data loader — reads every JSON bundle under `src/data/**` via Vite's
 * eager-glob import and produces a validated `DataBundle` for `GameEngine`.
 *
 * Validation here is intentionally lightweight: we confirm required fields
 * exist and types look right, and log a warning on mismatch. Hard failures
 * only occur for structurally unusable data (missing `id` fields, etc.).
 *
 * IMPORTANT — Vite glob semantics:
 * `import.meta.glob` is a compile-time primitive. Its FIRST ARGUMENT must be
 * a string LITERAL so Vite can statically resolve the file set at build time.
 * Passing the pattern through a helper function (e.g. `importGlob(pattern)`)
 * defeats the static analysis and silently returns an empty map, which in
 * turn makes the game boot with zero scenarios, cards, events, etc.
 * We therefore inline every glob call below with a literal pattern.
 */
export function loadAllData(): DataBundle {
  // Flat content bundles.
  const cardModules = import.meta.glob('/src/data/cards/*.json', { eager: true, import: 'default' });
  const traitModules = import.meta.glob('/src/data/traits/*.json', { eager: true, import: 'default' });
  const eventModules = import.meta.glob('/src/data/events/*.json', { eager: true, import: 'default' });
  const questModules = import.meta.glob('/src/data/quests/*.json', { eager: true, import: 'default' });
  const achievementModules = import.meta.glob('/src/data/achievements/*.json', { eager: true, import: 'default' });
  const legislationModules = import.meta.glob('/src/data/legislation/*.json', { eager: true, import: 'default' });

  const cards = normalizeArray<CardDefinition>(cardModules, ['id', 'name', 'type'])
    .map((c) => ({ ...c, id: c.id as unknown as CardId }));

  const traits = normalizeArray<TraitDefinition>(traitModules, ['id', 'name'])
    .map((t) => ({ ...t, id: t.id as unknown as TraitId }));

  const events = normalizeArray<GameEventDefinition>(eventModules, ['id', 'title', 'options'])
    .map((e) => ({ ...e, id: e.id as unknown as EventId }));

  const quests = normalizeArray<QuestDefinition>(questModules, ['id', 'title', 'objectives'])
    .map((q) => ({ ...q, id: q.id as unknown as QuestId }));

  const achievements = normalizeArray<AchievementDefinition>(achievementModules, ['id', 'name'])
    .map((a) => ({ ...a, id: a.id as unknown as AchievementId }));

  const billTemplates = normalizeArray<BillTemplate>(legislationModules, ['id', 'title']);

  // Scenarios and their assets are nested per-folder. Each literal glob
  // below is a separate statically-resolvable Vite call.
  const scenarioFiles = import.meta.glob('/src/data/scenarios/*/scenario.json', { eager: true, import: 'default' });
  const populationFiles = import.meta.glob('/src/data/scenarios/*/population.json', { eager: true, import: 'default' });
  const economyFiles = import.meta.glob('/src/data/scenarios/*/economy.json', { eager: true, import: 'default' });
  const legislatorFiles = import.meta.glob('/src/data/scenarios/*/legislators.json', { eager: true, import: 'default' });

  const scenarios: ScenarioDefinition[] = [];
  const populationsByScenario: Record<string, PopulationGroup[]> = {};
  const economyByScenario: Record<string, EconomicState> = {};
  const legislatorSeedByScenario: Record<string, { seed: number; split: { D: number; R: number; I?: number } }> = {};

  for (const [path, mod] of Object.entries(scenarioFiles)) {
    const payload = unwrap(mod) as ScenarioDefinition | undefined;
    if (!payload?.id) {
      log.warn('scenario missing id', path);
      continue;
    }
    scenarios.push({ ...payload, id: payload.id as unknown as ScenarioId });
  }

  for (const [path, mod] of Object.entries(populationFiles)) {
    const scenarioId = extractScenarioId(path);
    if (!scenarioId) continue;
    const payload = unwrap(mod) as { groups?: PopulationGroup[] } | PopulationGroup[] | undefined;
    const groups = Array.isArray(payload) ? payload : payload?.groups;
    if (!groups) {
      log.warn('population missing groups', path);
      continue;
    }
    populationsByScenario[scenarioId] = groups;
  }

  for (const [path, mod] of Object.entries(economyFiles)) {
    const scenarioId = extractScenarioId(path);
    if (!scenarioId) continue;
    const payload = unwrap(mod) as EconomicState | undefined;
    if (!payload) continue;
    economyByScenario[scenarioId] = { ...payload, history: [] };
  }

  for (const [path, mod] of Object.entries(legislatorFiles)) {
    const scenarioId = extractScenarioId(path);
    if (!scenarioId) continue;
    const payload = unwrap(mod) as { seed: number; split: { D: number; R: number; I?: number } } | undefined;
    if (payload && typeof payload.seed === 'number' && payload.split) {
      legislatorSeedByScenario[scenarioId] = payload;
    }
  }

  const bundle: DataBundle = {
    scenarios,
    populationsByScenario,
    economyByScenario,
    legislatorSeedByScenario,
    cards,
    traits,
    events,
    quests,
    achievements,
    billTemplates,
  };

  log.info('data loaded', {
    scenarios: scenarios.length,
    cards: cards.length,
    events: events.length,
    quests: quests.length,
    achievements: achievements.length,
    billTemplates: billTemplates.length,
    traits: traits.length,
  });

  return bundle;
}

/**
 * Unwrap a module record when an eager glob was taken WITHOUT `import: 'default'`.
 * With `import: 'default'` (our default) modules ARE the JSON payload; when the
 * option is omitted the module is `{ default: payload }`. This helper covers
 * both cases so tests that hand-craft module maps keep working.
 */
function unwrap(mod: unknown): unknown {
  if (mod && typeof mod === 'object' && 'default' in mod) {
    return (mod as { default: unknown }).default;
  }
  return mod;
}

function normalizeArray<T>(modules: Record<string, unknown>, requiredFields: readonly string[]): T[] {
  const out: T[] = [];
  for (const [path, mod] of Object.entries(modules)) {
    const payload = unwrap(mod);
    if (Array.isArray(payload)) {
      for (const item of payload) {
        if (isValid(item, requiredFields)) out.push(item as T);
        else log.warn('skipping invalid entry in', path);
      }
    } else if (payload && typeof payload === 'object') {
      if (isValid(payload, requiredFields)) out.push(payload as T);
      else log.warn('skipping invalid file', path);
    }
  }
  return out;
}

function isValid(obj: unknown, requiredFields: readonly string[]): boolean {
  if (!obj || typeof obj !== 'object') return false;
  const rec = obj as Record<string, unknown>;
  for (const f of requiredFields) {
    if (rec[f] === undefined || rec[f] === null) return false;
  }
  return true;
}

function extractScenarioId(path: string): string | null {
  const m = /\/scenarios\/([^/]+)\//.exec(path);
  return m ? m[1] : null;
}
