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
 * todo#45: The panel is now a tabbed "Knowledge Base" with four tabs:
 *   - Glossary — the original searchable term reference.
 *   - How to Play — quick-start gameplay guide.
 *   - History — American political history context.
 *   - Tips & Tricks — strategic advice.
 *
 * Three regions in the Glossary tab:
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
import { formatTag } from '@/utils/format';

/**
 * Strip `[term:id]label[/]` and bracketless `[term:id]` markers from
 * a string, leaving the visible label (or the id if there is no
 * label). Used for plain-text rendering in the glossary detail view,
 * where we don't want to also render nested tooltips. The previous
 * single-token regex left the id stitched onto the next word and
 * dropped the closing `[/]` token, producing strings like
 * "card-packpacks[/]".
 *
 * Mirrors the parsing rules of `parseTermMarkers` in ExtendedTooltip.
 *
 * @example
 *   stripTermMarkers('See [term:card-pack]packs[/].') // → 'See packs.'
 *   stripTermMarkers('Use [term:approval] to gauge mood.') // → 'Use approval to gauge mood.'
 */
export function stripTermMarkers(text: string): string {
  if (!text || !text.includes('[term:')) return text;
  const open = /\[term:([a-z0-9-]+)\]/gi;
  let out = '';
  let cursor = 0;
  let m: RegExpExecArray | null;
  while ((m = open.exec(text)) != null) {
    out += text.slice(cursor, m.index);
    const id = m[1];
    const after = text.slice(m.index + m[0].length);
    const closeIdx = after.indexOf('[/]');
    const nextOpenIdx = after.search(/\[term:/i);
    // Determine where the label ends: the closer wins if it appears
    // before the next opener (or there is no next opener); otherwise
    // there is no explicit label, in which case we render the id.
    if (closeIdx >= 0 && (nextOpenIdx < 0 || closeIdx < nextOpenIdx)) {
      out += after.slice(0, closeIdx);
      cursor = m.index + m[0].length + closeIdx + '[/]'.length;
    } else {
      out += id;
      cursor = m.index + m[0].length;
    }
    open.lastIndex = cursor;
  }
  out += text.slice(cursor);
  return out;
}


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

  // todo#45: tabbed Knowledge Base. The active tab drives which content
  // region is visible. 'glossary' is the default and matches existing
  // player expectations.
  const [activeTab, setActiveTab] = useState<'glossary' | 'how-to-play' | 'history' | 'tips'>(
    'glossary',
  );

  // Filtered list — recomputes on every keystroke. The registry is
  // small (dozens of entries, not thousands) so the linear scan is
  // fine without memoisation beyond the outer load.
  const filtered = useMemo(() => {
    return all.filter(
      (t) => matches(t, query) && (category === 'All' || t.subtitle === category),
    );
  }, [all, query, category]);

  const selected = selectedId ? getTooltip(selectedId) : filtered[0];

  /**
   * Navigate the glossary to a specific term by id (todo#44).
   * Clears the search query and category filter so the term becomes
   * visible in the left pane list, then selects it.
   */
  function navigateTo(id: string): void {
    setQuery('');
    setCategory('All');
    setSelectedId(id);
  }

  return (
    <div className="flex flex-col gap-4 h-full" data-testid="glossary-panel">
      {/* Panel header */}
      <header>
        <h1 className="font-headline text-panel-title text-text-primary">Knowledge Base</h1>
        <p className="text-body text-text-secondary">
          Glossary, guides, history, and tips for Political Ascent.
        </p>
      </header>

      {/* Tab row (todo#45) */}
      <nav
        role="tablist"
        aria-label="Knowledge Base sections"
        className="flex gap-1 border-b border-rule pb-0"
        data-testid="knowledge-tabs"
      >
        {(
          [
            { id: 'glossary', label: 'Glossary' },
            { id: 'how-to-play', label: 'How to Play' },
            { id: 'history', label: 'History' },
            { id: 'tips', label: 'Tips & Tricks' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={
              'px-4 py-2 font-mono text-label uppercase tracking-widest rounded-t-sm border-b-2 transition-colors duration-instant ' +
              (activeTab === tab.id
                ? 'text-accent-gold border-accent-gold bg-bg-secondary'
                : 'text-text-muted border-transparent hover:text-text-primary hover:border-rule')
            }
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Glossary tab */}
      {activeTab === 'glossary' && (
        <div className="flex flex-col gap-4 flex-1 min-h-0">
          {/* Search field */}
          <div className="flex items-center justify-between gap-4">
            <p className="text-body text-text-secondary">
              Every in-game term, definition, and cross-link.
            </p>
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
          </div>

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
          {selected ? <DetailView term={selected} onNavigate={navigateTo} /> : (
            <p className="text-body text-text-muted italic">Select a term on the left.</p>
          )}
        </Card>
      </div>
        </div>
      )} {/* end glossary tab */}

      {/* ─── HOW TO PLAY tab (todo#45) ─────────────────────────────────
          Structured quick-start guide. Content is authored inline here;
          it will be migrated to a JSON/Markdown source when the "no-code
          editor" system (item 19) ships. */}
      {activeTab === 'how-to-play' && (
        <div className="flex-1 overflow-y-auto game-scroll space-y-6" data-testid="knowledge-how-to-play">
          <HowToPlayContent />
        </div>
      )}

      {/* ─── HISTORY tab (todo#45) ─────────────────────────────────────
          American political history background for scenario context. */}
      {activeTab === 'history' && (
        <div className="flex-1 overflow-y-auto game-scroll space-y-6" data-testid="knowledge-history">
          <HistoryContent />
        </div>
      )}

      {/* ─── TIPS & TRICKS tab (todo#45) ────────────────────────────── */}
      {activeTab === 'tips' && (
        <div className="flex-1 overflow-y-auto game-scroll space-y-6" data-testid="knowledge-tips">
          <TipsContent />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// KNOWLEDGE BASE CONTENT TABS (todo#45)
// Each tab is a separate component so it can be lazy-loaded or moved
// to a JSON/Markdown source later without changing the parent layout.
// ─────────────────────────────────────────────────────────────

/**
 * A reusable section block for the static content tabs.
 */
function KbSection({ title, children }: { title: string; children: React.ReactNode }): JSX.Element {
  return (
    <section>
      <h2 className="font-headline text-text-primary text-xl mb-2 border-b border-rule pb-1">
        {title}
      </h2>
      <div className="text-body text-text-secondary space-y-2 leading-relaxed">{children}</div>
    </section>
  );
}

/** How to Play quick-start guide. */
function HowToPlayContent(): JSX.Element {
  return (
    <>
      <KbSection title="Welcome to Political Ascent">
        <p>
          You are a politician climbing from local office to the nation&apos;s highest seat of power.
          Every decision you make — from drafting legislation to managing your public image — has
          real consequences for the people you govern and the factions you work with.
        </p>
      </KbSection>

      <KbSection title="Resources">
        <p>
          <strong className="text-text-primary">Political Capital (PC)</strong> is your primary
          currency. Spend it on actions, cards, and favours. It regenerates each week based on
          your approval and relationships.
        </p>
        <p>
          <strong className="text-text-primary">Action Points (AP)</strong> represent how much
          you can accomplish in a single week. Most actions cost 1 AP; some powerful moves cost
          more. AP resets at the start of each week.
        </p>
      </KbSection>

      <KbSection title="Time">
        <p>
          The game advances in weeks. Use the controls at the bottom to pause, play, or speed up.
          Events and legislative progress happen over real time — don&apos;t let bills stall in
          committee.
        </p>
      </KbSection>

      <KbSection title="Legislation">
        <p>
          Draft bills, gather co-sponsors, and navigate them through committees and floor votes.
          The passage chance shown on each bill is a live estimate — use cards and actions to
          improve it before a vote is called.
        </p>
      </KbSection>

      <KbSection title="Cards">
        <p>
          Cards are one-time abilities that let you take actions outside the normal weekly
          routine. Earn them through quests, achievements, and card packs. Each card has a PC
          cost; some also cost AP.
        </p>
      </KbSection>

      <KbSection title="Approval & Cohorts">
        <p>
          Your approval rating is the average happiness of all voter cohorts. Different cohorts
          care about different issues — improving the economy helps working-class blocs, while
          strong civil liberties legislation helps progressive ones. Open the Population panel to
          see each cohort&apos;s mood in detail.
        </p>
      </KbSection>

      <KbSection title="Tips">
        <ul className="list-disc list-inside space-y-1">
          <li>Hover any term to see its extended tooltip — including this panel.</li>
          <li>Click a KPI tile on the Dashboard to jump to the relevant detail panel.</li>
          <li>Right-click cards and timeline entries for quick actions.</li>
          <li>Pin a tooltip (hold to lock or Shift-leave) to keep it open while you read.</li>
        </ul>
      </KbSection>
    </>
  );
}

/** American political history context for current scenarios. */
function HistoryContent(): JSX.Element {
  return (
    <>
      <KbSection title="The American Political System">
        <p>
          The United States has a bicameral legislature: the Senate (100 seats, two per state)
          and the House of Representatives (435 seats, apportioned by population). Bills must
          pass both chambers and be signed by the President to become law.
        </p>
      </KbSection>

      <KbSection title="Political Capital in Real Life">
        <p>
          &quot;Political capital&quot; is a real concept in American politics — the trust, goodwill, and
          influence a politician accumulates through electoral wins, favours, and public approval.
          George W. Bush famously said after his 2004 re-election: &quot;I earned capital in this
          campaign, political capital, and now I intend to spend it.&quot;
        </p>
      </KbSection>

      <KbSection title="The Modern Era (2000 – Present)">
        <p>
          The default scenario, Modern America 2024, takes place against a backdrop of deep
          partisan polarisation, social media influence, and debates over economic inequality,
          healthcare, immigration, and climate change. The two major parties occupy increasingly
          narrow ideological coalitions, making cross-aisle compromise rare but high-value.
        </p>
      </KbSection>

      <KbSection title="Planned Historical Scenarios">
        <p>
          Future scenarios will cover the 1776 founding era, the Civil War, the Industrial
          Revolution, the Great Depression, World War II, the Cold War, and the post-9/11 period.
          Each will have period-accurate factions, legislation, and events.
        </p>
      </KbSection>
    </>
  );
}

/** Strategic tips and tricks. */
function TipsContent(): JSX.Element {
  return (
    <>
      <KbSection title="Early Game">
        <ul className="list-disc list-inside space-y-1">
          <li>Focus your first few bills on issues that multiple cohorts care about — early wins build momentum.</li>
          <li>Invest skill points in PC generation early; it compounds over the whole run.</li>
          <li>Don&apos;t neglect your working-class approval — it&apos;s your largest base and hardest to win back once lost.</li>
        </ul>
      </KbSection>

      <KbSection title="Legislation Strategy">
        <ul className="list-disc list-inside space-y-1">
          <li>Check the &quot;passage chance&quot; estimate on each bill before calling a vote.</li>
          <li>Co-sponsoring with members who have high-influence committee seats accelerates the process.</li>
          <li>Use cards like &quot;Floor Whip&quot; and &quot;Call Favour&quot; to swing close votes.</li>
          <li>Bills that stall in committee cost no AP to abandon — cut losses early.</li>
        </ul>
      </KbSection>

      <KbSection title="Managing Approval">
        <ul className="list-disc list-inside space-y-1">
          <li>Approval above 55 gives you a governing mandate — use it to push bold legislation.</li>
          <li>Below 40, switch to repair mode: small popular bills, press conferences, and community outreach.</li>
          <li>Radical cohorts are volatile — their happiness swings fast in response to events, so watch for sudden drops.</li>
        </ul>
      </KbSection>

      <KbSection title="Cards & Packs">
        <ul className="list-disc list-inside space-y-1">
          <li>Common cards are reliable workhorses; keep at least two AP-cost-free cards in hand.</li>
          <li>Legendary cards are game-changers — save PC to play them at the right moment.</li>
          <li>Card packs are best opened before a major vote, not after.</li>
        </ul>
      </KbSection>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// DETAIL VIEW
// Renders one TooltipContent in panel form. Deliberately rebuilt from
// the registry data rather than reusing the tooltip popup, because the
// panel is non-modal and benefits from larger headings + more breathing
// room than the floating-card layout.
// ─────────────────────────────────────────────────────────────

/**
 * Full detail view for a single glossary term in the right pane.
 *
 * `onNavigate` is called when the player clicks a "See also" tag,
 * navigating the glossary to that term (todo#44).
 */
function DetailView({ term, onNavigate }: { term: TooltipContent; onNavigate: (id: string) => void }): JSX.Element {
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
                {/* `[term:id]label[/]` markers (and bracketless `[term:id]`)
                    are stripped to plain text here; tooltip context renders
                    the rich version. We must not leave the trailing `[/]`
                    or splice the id into the prose, which the previous
                    single-token replace did (e.g. "card-packpacks[/]"). */}
                {stripTermMarkers(section.text)}
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
                    <li key={i}>{stripTermMarkers(item)}</li>
                  ))}
                </ul>
              </div>
            );
          case 'breakdown': {
            // Mirror the tooltip widget's breakdown layout: itemised rows
            // followed by a Total row when `showTotal !== false`. Without
            // this, glossary readers lose the net value (e.g. "Action
            // Points: +3 base, +1 trait, −1 debuff = +3"), which makes
            // the panel contradict the source tooltip semantics.
            const total = section.rows.reduce((s, r) => s + r.value, 0);
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
                    {section.showTotal !== false && (
                      <tr className="border-t border-rule">
                        <td className="font-headline text-text-primary pt-1">Total</td>
                        <td
                          className={
                            'text-right tabular-nums pt-1 ' +
                            (total > 0
                              ? 'text-status-success'
                              : total < 0
                                ? 'text-status-danger'
                                : 'text-text-secondary')
                          }
                        >
                          {total > 0 ? `+${total}` : total}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            );
          }
          case 'tag-row':
            return (
              <div key={idx} className="flex flex-wrap gap-1.5">
                {section.tags.map((tag) => (
                  <span
                    key={tag}
                    className="font-mono text-label uppercase tracking-widest px-2 py-0.5 bg-bg-tertiary text-text-secondary rounded-sm"
                  >
                    {formatTag(tag)}
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
                // Wrap in Term for hover tooltip; clicking navigates to
                // that entry in the glossary list pane (todo#44).
                <Term key={id} term={id}>
                  <button
                    type="button"
                    className="underline decoration-dotted text-accent-gold hover:text-text-primary transition-colors text-sm"
                    onClick={() => onNavigate(id)}
                  >
                    {linked.title}
                  </button>
                </Term>
              );
            })}
          </div>
        </footer>
      )}
    </article>
  );
}
