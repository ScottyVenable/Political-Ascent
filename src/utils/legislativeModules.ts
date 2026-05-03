/**
 * Legislative module analysis helpers for the deep-draft bill builder.
 *
 * This module owns the pure math behind rider complexity, public appeal,
 * compatibility, and warning text. Keeping this outside React lets the
 * drafting UI stay presentational while tests lock down the rules players
 * are learning to reason about.
 *
 * @module utils/legislativeModules
 */
import type { BillTemplate, PolicyModule, PolicyTag, Effect } from '@/types';
import { clamp } from './math';

/**
 * Soft complexity ceiling used by the draft UI before warning players.
 *
 * The number is intentionally not a hard block: legislative packages can be
 * sprawling, but the forecast should teach players that sprawling bills are
 * harder to defend in committee and on the floor.
 */
export const MODULE_COMPLEXITY_BUDGET = 60;

/** Pair of currently selected modules that cannot coexist in one bill. */
export interface ModuleConflict {
  moduleId: string;
  moduleName: string;
  conflictingId: string;
  conflictingName: string;
}

/** Player-facing note emitted by module analysis for the forecast rail. */
export interface ModuleWarning {
  severity: 'info' | 'warning' | 'danger';
  message: string;
}

/**
 * Full rider-stack forecast used to synthesize bill opposition and explain it.
 */
export interface ModuleAnalysis {
  baseOpposition: number;
  moduleOppositionDelta: number;
  complexity: number;
  complexityPenalty: number;
  publicAppeal: number;
  publicAppealRelief: number;
  categoryDiversity: number;
  coalitionBonus: number;
  fiscalStrainPenalty: number;
  budgetImpact: number;
  finalOpposition: number;
  conflicts: ModuleConflict[];
  warnings: ModuleWarning[];
}

/**
 * Return a stable complexity value for a module, deriving a conservative
 * fallback for older JSON entries that have no explicit `complexity` field.
 *
 * @param module Policy rider being inspected.
 * @returns Complexity points contributed by the rider.
 */
export function moduleComplexity(module: PolicyModule): number {
  if (module.complexity !== undefined) return module.complexity;
  const budgetPressure = Math.min(12, Math.abs(module.budgetImpactDelta) / 12);
  const oppositionPressure = Math.min(10, Math.abs(module.oppositionDelta));
  const effectPressure = Math.min(6, module.effects.length * 1.5);
  return Math.round(Math.max(2, budgetPressure + oppositionPressure + effectPressure));
}

/**
 * Return a stable public-appeal value for a module, deriving a modest
 * fallback from opposition and effect count when old JSON lacks metadata.
 *
 * @param module Policy rider being inspected.
 * @returns Appeal points that soften opposition in the aggregate forecast.
 */
export function modulePublicAppeal(module: PolicyModule): number {
  if (module.publicAppeal !== undefined) return module.publicAppeal;
  const accessibility = module.oppositionDelta < 0 ? 6 : 0;
  const visibleBenefits = module.effects.filter(
    (effect) => effect.type === 'group_happiness' || effect.type === 'group_loyalty',
  ).length;
  return Math.round(accessibility + visibleBenefits * 2 - Math.max(0, module.oppositionDelta / 3));
}

/**
 * Find mutually exclusive modules selected in the current rider stack.
 *
 * @param modules Ordered rider stack selected by the player.
 * @returns Unique conflict pairs, with display names for warning text.
 */
export function findModuleConflicts(modules: readonly PolicyModule[]): ModuleConflict[] {
  const byId = new Map(modules.map((module) => [module.id, module]));
  const seenPairs = new Set<string>();
  const conflicts: ModuleConflict[] = [];

  for (const module of modules) {
    for (const conflictingId of module.incompatibleWith ?? []) {
      const conflicting = byId.get(conflictingId);
      if (!conflicting) continue;
      const key = [module.id, conflictingId].sort().join('::');
      if (seenPairs.has(key)) continue;
      seenPairs.add(key);
      conflicts.push({
        moduleId: module.id,
        moduleName: module.name,
        conflictingId,
        conflictingName: conflicting.name,
      });
    }
  }

  return conflicts;
}

/**
 * Analyze the current rider stack and convert it into bill-level pressure.
 *
 * @param template Base bill data that modules modify.
 * @param modules Ordered rider stack selected by the player.
 * @returns Full opposition, budget, complexity, warning, and conflict forecast.
 */
export function analyzePolicyModules(
  template: Pick<BillTemplate, 'opposition' | 'budgetImpact' | 'tags'>,
  modules: readonly PolicyModule[],
): ModuleAnalysis {
  const moduleOppositionDelta = modules.reduce((sum, module) => sum + module.oppositionDelta, 0);
  const budgetImpact =
    template.budgetImpact + modules.reduce((sum, module) => sum + module.budgetImpactDelta, 0);
  const complexity = modules.reduce((sum, module) => sum + moduleComplexity(module), 0);
  const complexityPenalty = Math.floor(complexity / 14);
  const publicAppeal = modules.reduce((sum, module) => sum + modulePublicAppeal(module), 0);
  const publicAppealRelief = Math.floor(publicAppeal / 8);
  const categoryDiversity = new Set(modules.map((module) => module.category)).size;
  const coalitionBonus = Math.min(6, Math.max(0, categoryDiversity - 1) * 2);
  const fiscalStrainPenalty =
    budgetImpact < -250 ? Math.min(12, Math.ceil(Math.abs(budgetImpact + 250) / 45)) : 0;
  const finalOpposition = clamp(
    template.opposition +
      moduleOppositionDelta +
      complexityPenalty +
      fiscalStrainPenalty -
      publicAppealRelief -
      coalitionBonus,
    0,
    100,
  );
  const conflicts = findModuleConflicts(modules);

  return {
    baseOpposition: template.opposition,
    moduleOppositionDelta,
    complexity,
    complexityPenalty,
    publicAppeal,
    publicAppealRelief,
    categoryDiversity,
    coalitionBonus,
    fiscalStrainPenalty,
    budgetImpact,
    finalOpposition,
    conflicts,
    warnings: buildModuleWarnings(template.tags, modules, complexity, budgetImpact, conflicts),
  };
}

/**
 * Human-readable, compact effect summary for module cards.
 *
 * @param effect Gameplay effect appended by a policy rider.
 * @returns Short label that fits inside a dense module card.
 */
export function summarizeEffect(effect: Effect): string {
  switch (effect.type) {
    case 'economy':
      return `${effect.metric} ${signed(effect.value)}`;
    case 'group_happiness':
      return `${effect.group} mood ${signed(effect.value)}`;
    case 'group_loyalty':
      return `${effect.group} loyalty ${signed(effect.value)}`;
    case 'resource':
      return `${effect.resource} ${signed(effect.value)}`;
    case 'relationship':
      return `relationship ${signed(effect.value)}`;
    case 'stat':
      return `${effect.target} ${signed(effect.value)}`;
    case 'flag':
      return effect.value ? `sets ${effect.flag}` : `clears ${effect.flag}`;
    case 'grant_card':
      return `grants card ${effect.cardId}`;
    case 'trigger_quest':
      return `starts quest ${effect.questId}`;
    default: {
      const exhaustive: never = effect;
      return exhaustive;
    }
  }
}

/**
 * Convert a module strategy role into a compact player-facing label.
 *
 * @param role Optional strategic role from module JSON.
 * @returns Fallback-safe label for cards and the active rider stack.
 */
export function moduleRoleLabel(role: PolicyModule['strategicRole']): string {
  switch (role) {
    case 'pay_for':
      return 'Pay-for';
    case 'benefit_expansion':
      return 'Benefit';
    case 'coalition_builder':
      return 'Coalition';
    case 'oversight':
      return 'Oversight';
    case 'implementation':
      return 'Implementation';
    case 'enforcement':
      return 'Enforcement';
    case 'carveout':
      return 'Carveout';
    default:
      return 'Rider';
  }
}

function buildModuleWarnings(
  billTags: readonly PolicyTag[],
  modules: readonly PolicyModule[],
  complexity: number,
  budgetImpact: number,
  conflicts: readonly ModuleConflict[],
): ModuleWarning[] {
  const warnings: ModuleWarning[] = [];

  for (const conflict of conflicts) {
    warnings.push({
      severity: 'danger',
      message: `${conflict.moduleName} conflicts with ${conflict.conflictingName}. Remove one before introducing the bill.`,
    });
  }

  if (complexity > MODULE_COMPLEXITY_BUDGET) {
    warnings.push({
      severity: 'warning',
      message: `Complexity is above the ${MODULE_COMPLEXITY_BUDGET}-point comfort zone. Committee delay and opposition risk are rising.`,
    });
  }

  if (budgetImpact < -250) {
    warnings.push({
      severity: 'warning',
      message:
        'The package is fiscally heavy. Add a pay-for, sunset clause, or narrower pilot to soften opposition.',
    });
  }

  const offAgendaModules = modules.filter((module) => {
    if (!module.recommendedTags || module.recommendedTags.length === 0) return false;
    return !module.recommendedTags.some((tag) => billTags.includes(tag));
  });
  if (offAgendaModules.length > 0) {
    warnings.push({
      severity: 'info',
      message: `${offAgendaModules.length} rider${offAgendaModules.length === 1 ? '' : 's'} are off-agenda for this bill category. This can broaden a coalition, but it reads as horse-trading.`,
    });
  }

  return warnings;
}

function signed(value: number): string {
  if (value > 0) return `+${value}`;
  return `${value}`;
}
