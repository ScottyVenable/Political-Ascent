/**
 * humanize — convert internal data tags (camelCase, kebab-case,
 * snake_case ids) into player-readable strings (todo#75).
 *
 * Where this fits in the architecture:
 *   - Pure utility, no React, no store. Safe to import from engine,
 *     systems, and renderer alike.
 *   - Centralises the small label dictionaries that were previously
 *     duplicated inline in `Game.tsx` and `QuestsPanel.tsx` so we can
 *     keep them in sync as new resources, economy metrics, and cohort
 *     ids are added.
 *
 * Design notes:
 *   - Each well-known dictionary (`RESOURCE_LABEL`, `ECONOMY_LABEL`,
 *     `COHORT_LABEL`, `STAT_LABEL`) is a plain `Record<string,string>`
 *     export so callers can do quick lookups *and* the typed `as const`
 *     keys give us tab-completion in TypeScript.
 *   - `humaniseId(id)` is the generic fallback: it splits on
 *     camelCase boundaries, hyphens, and underscores, then Title-Cases
 *     the words. Used for ids we don't have an explicit override for.
 *
 * @module utils/humanize
 */

/**
 * Generic fallback humaniser. Splits on camelCase boundaries, hyphens,
 * and underscores; Title-cases each word; collapses extra whitespace.
 *
 * - `'politicalCapital'` → `'Political Capital'`
 * - `'working-class'`    → `'Working Class'`
 * - `'gdp_growth'`       → `'Gdp Growth'` (use `ECONOMY_LABEL` for the
 *   correct uppercase `GDP` rendering)
 * - `''`                 → `''`
 *
 * @param id Internal identifier in any common casing.
 * @returns A player-readable Title Case string.
 */
export function humaniseId(id: string): string {
  if (!id) return '';
  return id
    // Insert a space before each capital letter that follows a lowercase
    // letter (handles camelCase: 'politicalCapital' → 'political Capital').
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    // Convert hyphens and underscores to spaces.
    .replace(/[-_]+/g, ' ')
    // Normalise multiple spaces.
    .replace(/\s+/g, ' ')
    .trim()
    // Title-case each word.
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/**
 * Player-facing labels for resource ids used in `Effect.resource`.
 * Authoritative source: `src/engine/Effects.ts`.
 */
export const RESOURCE_LABEL: Record<string, string> = {
  politicalCapital: 'Political Capital',
  actionPoints: 'Action Points',
  xp: 'XP',
};

/**
 * Player-facing labels for economy metric ids used in
 * `Effect.metric`. Authoritative source: `src/engine/Economy.ts`.
 */
export const ECONOMY_LABEL: Record<string, string> = {
  gdpGrowth: 'GDP Growth',
  unemployment: 'Unemployment',
  inflation: 'Inflation',
  debt: 'Debt',
  deficit: 'Deficit',
  gini: 'Gini Coefficient',
  trade: 'Trade Balance',
};

/**
 * Player-facing labels for population cohort ids used in
 * `Effect.group`. The shipped scenario uses the kebab-case ids in this
 * map; modders can add new ids and the renderer will fall back to
 * `humaniseId()` if a label is missing.
 */
export const COHORT_LABEL: Record<string, string> = {
  'working-class': 'Working Class',
  professionals: 'Professionals',
  retirees: 'Retirees',
  students: 'Students',
};

/**
 * Player-facing labels for the six core stats used in `Effect.target`.
 * Currently a simple capitalise — kept as a dictionary so future stats
 * (e.g. `streetSmarts`) can override the default casing.
 */
export const STAT_LABEL: Record<string, string> = {
  charisma: 'Charisma',
  wisdom: 'Wisdom',
  cunning: 'Cunning',
  integrity: 'Integrity',
  vigor: 'Vigor',
  empathy: 'Empathy',
};

/** Look up a resource label, falling back to {@link humaniseId}. */
export function humaniseResource(id: string): string {
  return RESOURCE_LABEL[id] ?? humaniseId(id);
}

/** Look up an economy metric label, falling back to {@link humaniseId}. */
export function humaniseEconomyMetric(id: string): string {
  return ECONOMY_LABEL[id] ?? humaniseId(id);
}

/** Look up a cohort label, falling back to {@link humaniseId}. */
export function humaniseCohortId(id: string): string {
  return COHORT_LABEL[id] ?? humaniseId(id);
}

/** Look up a stat label, falling back to {@link humaniseId}. */
export function humaniseStat(id: string): string {
  return STAT_LABEL[id] ?? humaniseId(id);
}
