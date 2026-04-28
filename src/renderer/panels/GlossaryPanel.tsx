/**
 * GlossaryPanel — browsable, searchable in-game encyclopedia.
 *
 * Closes docs/todo.md item 16. The tooltip registry has long stored
 * structured definitions for every gameplay term (PC, AP, stats,
 * cohort metrics, factions); the Extended-Tooltip widget surfaces
 * them on hover. This panel is the *index* — a first-class screen the
 * player can open from the sidebar to learn the game without having
 * to discover terms by hovering things.
 *
 * Three regions:
 *   - Search field at the top (case-insensitive prefix match against
 *     title + aliases).
 *   - Category filter pills (Resource / Stat / Mechanic / Cohort metric
 *     / etc., derived dynamically from the registry's `subtitle`
 *     field).
 *   - Two-column layout: a left list of matching terms and a right
 *     detail pane that renders the same content the tooltip uses,
 *     reusing `<TooltipBody>`.
 *
 * No new content is authored here. The panel is a pure projection of
 * `glossary.ts` registrations, so adding a new term anywhere in the
 * codebase automatically lights it up in the Glossary.
 *
 * @module renderer/panels/GlossaryPanel
 */

import { useMemo, useState } from 'react';
import { allTooltipIds, getTooltip, type TooltipContent } from '../components/tooltip/registry';
import { Icon } from '../components/Icon';
import { Card } from '../components/Card';
import { Term } from '../components/tooltip';

/**
 * Read every registered tooltip into an array. The registry preserves
 * insertion order, but that's content-author-dependent; the panel
 * sorts alphabetically by title for predictable navigation.
 */
function loadAll(): TooltipContent[] {
  return allTooltipIds()
    .map((id) => getTooltip(id))
    .filter((t): t is TooltipContent => t !== undefined)
    .sort((a, b) => a.title.localeCompare(b.title));
}

/**
 * Compute the set of distinct subtitles (categories) present in the
 * registry. Used to drive the filter pill row. We always offer "All"
 * as the first option.
 */
function collectCategories(items: TooltipContent[]): string[] {
  const set = new Set<string>();
  for (const t of items) {
    if (t.subtitle) set.add(t.subtitle);
  }
  return ['All', ...Array.from(set).sort()];
}

/**
 * Match predicate. Case-insensitive prefix-or-substring match against
 * the title, the id slug, and any alias. Empty query matches all.
 */
function matches(t: TooltipContent, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  if (t.title.toLowerCase().includes(q)) return true;
  if (t.id.toLowerCase().includes(q)) return true;
  if (t.aliases?.some((a) => a.toLowerCase().includes(q))) return true;
  return false;
}

export function GlossaryPanel(): JSX.Element {
  const all = useMemo(loadAll, []);
  const categories = useMemo(() => collectCategories(all), [all]);

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('All');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Filtered list — recomputes on every keystroke. The registry is
  // small (dozens of entries, not thousands) so the linear scan is
  // fine without memoisation beyond the outer load.
  const filtered = useMemo(() => {
    return all.filter(
      (t) => matches(t, query) && (category === 'All' || t.subtitle === category),
    );
  }, [all, query, category]);

  const selected = selectedId ? getTooltip(selectedId) : filtered[0];

  return (
    <div className="flex flex-col gap-4 h-full" data-testid="glossary-panel">
      {/* Header — title + search */}
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-headline text-panel-title text-text-primary">Glossary</h1>
          <p className="text-body text-text-secondary">
            Every in-game term, definition, and cross-link. Hover any term for the same
            extended tooltip you see anywhere else.
          </p>
        </div>
        <label className="relative w-72 max-w-full">
          <span className="sr-only">Search glossary</span>
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-text-muted">
            <Icon name="search" size={14} />
          </span>
          <input
            type="search"
            placeholder="Search terms…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedId(null);
            }}
            data-testid="glossary-search"
            className="w-full bg-bg-secondary border border-rule rounded-sm pl-7 pr-2 py-1.5 text-body text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-gold"
          />
        </label>
      </header>

      {/* Category filter pills */}
      <nav
        className="flex flex-wrap gap-2"
        aria-label="Glossary categories"
        data-testid="glossary-categories"
      >
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => {
              setCategory(c);
              setSelectedId(null);
            }}
            aria-pressed={category === c}
            className={
              'px-3 py-1 text-label uppercase tracking-widest font-mono rounded-sm border transition-colors duration-instant ' +
              (category === c
                ? 'bg-accent-gold text-bg-primary border-accent-gold'
                : 'bg-bg-secondary text-text-secondary border-rule hover:border-accent-gold/60')
            }
          >
            {c}
          </button>
        ))}
      </nav>

      {/* Two-column body */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 min-h-0">
        {/* Term list — scrolls independently */}
        <Card className="md:col-span-1 overflow-hidden flex flex-col">
          <div className="font-mono text-label uppercase tracking-widest text-text-muted mb-2">
            {filtered.length} {filtered.length === 1 ? 'term' : 'terms'}
          </div>
          {filtered.length === 0 ? (
            <p className="text-body text-text-muted italic">
              No terms match your search.
            </p>
          ) : (
            <ul className="space-y-1 overflow-y-auto game-scroll pr-1" data-testid="glossary-list">
              {filtered.map((t) => {
                const isActive = selected?.id === t.id;
                return (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(t.id)}
                      data-testid={`glossary-item-${t.id}`}
                      className={
                        'w-full text-left px-2 py-1.5 rounded-sm text-body transition-colors duration-instant ' +
                        (isActive
                          ? 'bg-accent-gold text-bg-primary'
                          : 'text-text-primary hover:bg-bg-tertiary/60')
                      }
                    >
                      <div className="font-headline">{t.title}</div>
                      {t.subtitle && (
                        <div
                          className={
                            'font-mono text-label uppercase tracking-widest ' +
                            (isActive ? 'text-bg-primary/70' : 'text-text-muted')
                          }
                        >
                          {t.subtitle}
                        </div>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {/* Detail pane — renders the same shape as the tooltip body */}
        <Card className="md:col-span-2 overflow-y-auto game-scroll" data-testid="glossary-detail">
          {selected ? <DetailView term={selected} /> : (
            <p className="text-body text-text-muted italic">Select a term on the left.</p>
          )}
        </Card>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// DETAIL VIEW
// Renders one TooltipContent in panel form. Deliberately rebuilt from
// the registry data rather than reusing the tooltip popup, because the
// panel is non-modal and benefits from larger headings + more breathing
// room than the floating-card layout.
// ─────────────────────────────────────────────────────────────

function DetailView({ term }: { term: TooltipContent }): JSX.Element {
  return (
    <article className="space-y-4" data-testid={`glossary-detail-${term.id}`}>
      <header>
        {term.subtitle && (
          <div className="font-mono text-label uppercase tracking-widest text-accent-gold">
            {term.subtitle}
          </div>
        )}
        <h2 className="font-headline text-panel-title text-text-primary">{term.title}</h2>
        {term.summary && (
          <p className="text-body text-text-secondary mt-1">{term.summary}</p>
        )}
      </header>

      {term.sections.map((section, idx) => {
        switch (section.kind) {
          case 'paragraph':
            return (
              <p key={idx} className="text-body text-text-primary leading-relaxed">
                {/* `[term:id]` markers are left as plain text here; the
                    inline tooltip widget handles them in tooltip context.
                    Stripping them keeps the panel readable. */}
                {section.text.replace(/\[term:([^\]]+)\]/g, '$1')}
              </p>
            );
          case 'list':
            return (
              <div key={idx}>
                {section.heading && (
                  <h3 className="font-headline text-text-primary mb-1">{section.heading}</h3>
                )}
                <ul className="list-disc list-inside text-body text-text-primary space-y-1">
                  {section.items.map((item, i) => (
                    <li key={i}>{item.replace(/\[term:([^\]]+)\]/g, '$1')}</li>
                  ))}
                </ul>
              </div>
            );
          case 'breakdown':
            return (
              <div key={idx}>
                {section.heading && (
                  <h3 className="font-headline text-text-primary mb-1">{section.heading}</h3>
                )}
                <table className="w-full font-mono text-body">
                  <tbody>
                    {section.rows.map((row, i) => {
                      const tone =
                        row.tone ??
                        (row.value > 0 ? 'positive' : row.value < 0 ? 'negative' : 'neutral');
                      const cls =
                        tone === 'positive'
                          ? 'text-status-success'
                          : tone === 'negative'
                            ? 'text-status-danger'
                            : 'text-text-primary';
                      return (
                        <tr key={i}>
                          <td className="text-text-secondary py-0.5">{row.label}</td>
                          <td className={`text-right tabular-nums ${cls}`}>
                            {row.value > 0 ? `+${row.value}` : row.value}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          case 'tag-row':
            return (
              <div key={idx} className="flex flex-wrap gap-1.5">
                {section.tags.map((tag) => (
                  <span
                    key={tag}
                    className="font-mono text-label uppercase tracking-widest px-2 py-0.5 bg-bg-tertiary text-text-secondary rounded-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            );
        }
      })}

      {term.seeAlso && term.seeAlso.length > 0 && (
        <footer className="border-t border-rule pt-3">
          <h3 className="font-mono text-label uppercase tracking-widest text-text-muted mb-2">
            See also
          </h3>
          <div className="flex flex-wrap gap-3">
            {term.seeAlso.map((id) => {
              const linked = getTooltip(id);
              if (!linked) return null;
              return (
                <Term key={id} term={id}>
                  {linked.title}
                </Term>
              );
            })}
          </div>
        </footer>
      )}
    </article>
  );
}
