/**
 * tooltip — Extended (Paradox-style) tooltip data model.
 *
 * Where this fits in the architecture:
 *   - This module is a *data-only* registry. UI lives in
 *     `renderer/components/tooltip/`; consumers compose tooltips by
 *     calling {@link registerTooltip} at boot, then referencing terms by
 *     id via the renderer's `<Term term="…" />` component or
 *     `<ExtendedTooltip term="…" />` wrapper.
 *   - Inspired by Victoria 3 / Crusader Kings III: stat readouts hover
 *     to a panel that breaks the value down into base + modifiers, and
 *     terms inside that panel are themselves hoverable (nested).
 *   - The registry is intentionally globalish so every screen sees the
 *     same definitions without prop-drilling.
 *
 * @module renderer/tooltip/registry
 */

/**
 * One row of a value-breakdown table. Renders as
 *   <label> ………… <±value>
 *
 * The sign tinting (positive = green, negative = red) is applied by
 * the renderer based on the numeric sign of `value` unless `tone` is
 * forced.
 */
export interface ModifierRow {
  /** What contributed (e.g. "Charisma", "Trait: Veteran Orator"). */
  label: string;
  /** Numeric contribution. Sign drives default tinting. */
  value: number;
  /** Force a tone, overriding sign-based tinting. */
  tone?: 'positive' | 'negative' | 'neutral';
  /**
   * Optional term id — when set, the row label becomes a nested-tooltip
   * link to that term.
   */
  term?: string;
}

/**
 * One section in a tooltip body. Sections render top-to-bottom with a
 * thin rule between them.
 */
export type TooltipSection =
  | {
      kind: 'paragraph';
      /** Plain prose. May include `[term:…]` markers that the renderer
       * converts to nested-tooltip links. */
      text: string;
    }
  | {
      kind: 'breakdown';
      /** Optional heading above the breakdown table. */
      heading?: string;
      rows: ModifierRow[];
      /** If true, adds a "Total" row equal to sum(rows.value). */
      showTotal?: boolean;
    }
  | {
      kind: 'list';
      heading?: string;
      items: string[];
    }
  | {
      kind: 'tag-row';
      /** Small chips, e.g. faction, ideology, tags. */
      tags: string[];
    };

/**
 * Static definition of a tooltip-able term.
 *
 * Tooltips are *content* — pulled from JSON or built inline by the
 * system that owns the term. The shape here is the contract every
 * renderer relies on.
 */
export interface TooltipContent {
  /** Stable id used to address this tooltip. Slug-style. */
  id: string;
  /** Bold heading displayed at the top of the tooltip card. */
  title: string;
  /** Short subtitle shown directly below the title (e.g. "Stat", "Resource"). */
  subtitle?: string;
  /** Optional icon id from `Icon.tsx`. */
  icon?: string;
  /** One-line summary shown in compact tooltips. */
  summary?: string;
  /** Body sections, rendered in order. */
  sections: TooltipSection[];
  /**
   * Other term ids whose tooltips can also be opened from this one
   * via a "See also" link row at the bottom.
   */
  seeAlso?: string[];
}

// ────────────────────────────────────────────────────────────────
// REGISTRY
// ────────────────────────────────────────────────────────────────

const REGISTRY = new Map<string, TooltipContent>();

/** Register one or more tooltip definitions. Later writes override. */
export function registerTooltip(...defs: TooltipContent[]): void {
  for (const d of defs) REGISTRY.set(d.id, d);
}

/** Look up a tooltip by id. Returns `undefined` if not registered. */
export function getTooltip(id: string): TooltipContent | undefined {
  return REGISTRY.get(id);
}

/** All registered tooltip ids. Stable order = insertion order. */
export function allTooltipIds(): string[] {
  return Array.from(REGISTRY.keys());
}

/** Wipe the registry. Test-only convenience. */
export function clearTooltips(): void {
  REGISTRY.clear();
}
