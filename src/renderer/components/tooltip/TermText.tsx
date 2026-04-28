/**
 * TermText — auto-link any registered glossary term in plain prose.
 *
 * What it solves:
 *   The original tooltip system required call sites to wrap each term
 *   manually with `<Term term="…" />` or embed `[term:…]` markers in
 *   strings. That gets old fast across hundreds of card descriptions,
 *   bill summaries, quest blurbs, and event copy. `TermText` accepts
 *   plain prose and inlines a `<Term>` for every registered surface
 *   (title or alias) it can find, leaving non-matching text untouched.
 *
 * How it works:
 *   {@link findTermMatches} returns non-overlapping match offsets in
 *   document order. We splice those into a React node array, wrapping
 *   matched ranges in `<Term>` (which itself uses `<ExtendedTooltip>`),
 *   and render the rest as bare strings.
 *
 * What it deliberately does NOT do:
 *   - Walk into nested React children. Pass plain strings only — if
 *     you have markup, decompose it at the call site.
 *   - Match across HTML elements. The matcher is text-only.
 *   - Modify casing. Surface text is preserved verbatim.
 *
 * @module renderer/tooltip/TermText
 */
import { Fragment, type ReactNode } from 'react';
import { Term } from './ExtendedTooltip';
import { findTermMatches } from './registry';

export interface TermTextProps {
  /** The prose to scan. Strings only — pre-render any nested markup. */
  text: string;
  /**
   * Optional list of term ids to *exclude* from auto-linking. Useful
   * when the surface text is also the heading right above it (avoids
   * "Political Capital → Political Capital" tautologies).
   */
  exclude?: readonly string[];
  /**
   * Optional cap on the number of auto-links emitted. Default 8 — past
   * that, text starts to look like a link farm. The first N matches in
   * document order win.
   */
  limit?: number;
}

/**
 * Render `text` with any registered term surfaces auto-linked.
 *
 * @example
 *   <TermText text="Spend PC to whip a vote in committee." />
 *   // PC and committee become tooltip links; rest is plain.
 */
export function TermText({ text, exclude, limit = 8 }: TermTextProps): JSX.Element {
  if (!text) return <></>;
  const excludeSet = new Set(exclude ?? []);
  // Find all candidate matches and drop excluded ids.
  const matches = findTermMatches(text)
    .filter((m) => !excludeSet.has(m.id))
    .slice(0, limit);

  if (matches.length === 0) return <>{text}</>;

  // Splice the matches into a node array.
  const out: ReactNode[] = [];
  let cursor = 0;
  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    if (m.start > cursor) out.push(text.slice(cursor, m.start));
    out.push(
      <Term key={`${m.id}-${m.start}`} term={m.id}>
        {m.surface}
      </Term>,
    );
    cursor = m.end;
  }
  if (cursor < text.length) out.push(text.slice(cursor));

  return (
    <>
      {out.map((node, i) => (
        <Fragment key={i}>{node}</Fragment>
      ))}
    </>
  );
}
