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
  /**
   * Surface forms that should auto-link to this tooltip when found in
   * prose. The title is added implicitly. Aliases are case-insensitive
   * and matched on whole-word boundaries only.
   *
   * @example aliases: ['PC', 'political capital'] for `political-capital`
   */
  aliases?: string[];
}

// ────────────────────────────────────────────────────────────────
// REGISTRY
// ────────────────────────────────────────────────────────────────

const REGISTRY = new Map<string, TooltipContent>();

/** Register one or more tooltip definitions. Later writes override. */
export function registerTooltip(...defs: TooltipContent[]): void {
  for (const d of defs) REGISTRY.set(d.id, d);
  invalidateMatcher();
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
  invalidateMatcher();
}

// ────────────────────────────────────────────────────────────────
// AUTO-MATCHER
// ────────────────────────────────────────────────────────────────

/**
 * One match emitted by {@link findTermMatches}.
 *
 * Indexes are character offsets into the *original* input string so
 * the caller can splice the prose around them.
 */
export interface TermMatch {
  /** Term id resolved from the registry. */
  id: string;
  /** Inclusive start offset in the source text. */
  start: number;
  /** Exclusive end offset in the source text. */
  end: number;
  /** The exact substring that matched (preserves original casing). */
  surface: string;
}

/**
 * The compiled matcher table. Built lazily from the registry the first
 * time {@link findTermMatches} is called and invalidated whenever the
 * registry changes.
 *
 * Each entry pairs a single regex (whole-word, case-insensitive) with
 * the term id it resolves to. Surfaces are sorted longest-first so
 * "political capital" wins over "capital" when both register.
 */
interface MatcherEntry {
  id: string;
  pattern: RegExp;
}
let MATCHER: MatcherEntry[] | null = null;

function invalidateMatcher(): void {
  MATCHER = null;
}

/** Escape a literal surface for use inside a RegExp. */
function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Compile (or reuse) the surface → term-id matcher table. */
function buildMatcher(): MatcherEntry[] {
  if (MATCHER) return MATCHER;
  // Collect (surface, id) pairs from titles + aliases. Surfaces are
  // de-duplicated case-insensitively; later writes override earlier ones.
  const surfaces = new Map<string, string>();
  for (const def of REGISTRY.values()) {
    const all = [def.title, ...(def.aliases ?? [])];
    for (const surface of all) {
      const key = surface.toLowerCase();
      if (!surfaces.has(key)) surfaces.set(key, def.id);
    }
  }
  // Longest-first so multi-word surfaces win over their suffixes.
  const sorted = Array.from(surfaces.entries()).sort(
    (a, b) => b[0].length - a[0].length,
  );
  // "Word boundary" here is a unicode-friendly assertion: the surface
  // must not be touching letters/digits on either side. Plain `\b`
  // does not work for multi-word surfaces because the inner spaces
  // count as boundaries themselves.
  MATCHER = sorted.map(([surface, id]) => ({
    id,
    pattern: new RegExp(`(^|[^\\p{L}\\p{N}])(${escapeRegex(surface)})(?=$|[^\\p{L}\\p{N}])`, 'iu'),
  }));
  return MATCHER;
}

/**
 * Scan `text` for any registered term surface and return the matches
 * in document order, with no overlaps.
 *
 * Algorithm: for each registered surface (longest-first), find every
 * occurrence; reject matches that overlap an already-accepted match.
 * Cost: O(terms × text) — fine for tooltip prose (rarely >1 KB).
 *
 * @example
 *   findTermMatches('Spend PC to whip a vote.')
 *   // → [{ id: 'political-capital', start: 6, end: 8, surface: 'PC' }]
 */
export function findTermMatches(text: string): TermMatch[] {
  if (!text) return [];
  const matcher = buildMatcher();
  const accepted: TermMatch[] = [];

  // Walk every term and collect candidate hits.
  for (const { id, pattern } of matcher) {
    // Build a global flavour of the per-term pattern for iteration.
    const global = new RegExp(pattern.source, pattern.flags + 'g');
    let m: RegExpExecArray | null;
    while ((m = global.exec(text)) !== null) {
      // The leading non-letter char is captured in group 1 and is *not*
      // part of the term surface; strip it from the offset.
      const lead = m[1] ?? '';
      const surfaceStart = m.index + lead.length;
      const surface = m[2];
      const surfaceEnd = surfaceStart + surface.length;

      // Reject if it overlaps any already-accepted match.
      const overlaps = accepted.some(
        (a) => surfaceStart < a.end && surfaceEnd > a.start,
      );
      if (overlaps) continue;
      accepted.push({ id, start: surfaceStart, end: surfaceEnd, surface });
      // Advance past the match to avoid zero-width loops on edge cases.
      if (global.lastIndex === m.index) global.lastIndex++;
    }
  }

  // Sort the accepted matches by document order for the consumer.
  accepted.sort((a, b) => a.start - b.start);
  return accepted;
}

/** Force the matcher to recompile. Test-only. */
export function _resetMatcherForTest(): void {
  invalidateMatcher();
}
