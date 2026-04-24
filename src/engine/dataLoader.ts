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
 */
export function loadAllData(): DataBundle {
  const cards = normalizeArray<CardDefinition>(importGlob('/src/data/cards/*.json'), ['id', 'name', 'type'])
    .map((c) => ({ ...c, id: c.id as unknown as CardId }));

  const traits = normalizeArray<TraitDefinition>(importGlob('/src/data/traits/*.json'), ['id', 'name'])
    .map((t) => ({ ...t, id: t.id as unknown as TraitId }));

  const events = normalizeArray<GameEventDefinition>(importGlob('/src/data/events/*.json'), ['id', 'title', 'options'])
    .map((e) => ({ ...e, id: e.id as unknown as EventId }));

  const quests = normalizeArray<QuestDefinition>(importGlob('/src/data/quests/*.json'), ['id', 'title', 'objectives'])
    .map((q) => ({ ...q, id: q.id as unknown as QuestId }));

  const achievements = normalizeArray<AchievementDefinition>(importGlob('/src/data/achievements/*.json'), ['id', 'name'])
    .map((a) => ({ ...a, id: a.id as unknown as AchievementId }));

  const billTemplates = normalizeArray<BillTemplate>(importGlob('/src/data/legislation/*.json'), ['id', 'title']);

  // Scenarios and their assets are nested per-folder.
  const scenarioFiles = importGlob('/src/data/scenarios/*/scenario.json');
  const populationFiles = importGlob('/src/data/scenarios/*/population.json');
  const economyFiles = importGlob('/src/data/scenarios/*/economy.json');
  const legislatorFiles = importGlob('/src/data/scenarios/*/legislators.json');

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

/** Vite-friendly eager glob wrapper (works in tests too). */
function importGlob(pattern: string): Record<string, unknown> {
  // import.meta.glob is a Vite compile-time primitive; typed loosely here.
  const metaGlob = (import.meta as unknown as {
    glob: (p: string, opts: { eager: true; import: string }) => Record<string, unknown>;
  }).glob;
  if (typeof metaGlob !== 'function') return {};
  try {
    return metaGlob(pattern, { eager: true, import: 'default' });
  } catch {
    return {};
  }
}

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
