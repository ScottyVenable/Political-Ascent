/**
 * TimelinePanel — chronological log of past news, events, and milestones.
 *
 * Closes docs/todo.md item 15. The world store already accumulates a
 * `news` array (capped at 50 entries) every time the engine pushes a
 * headline — bills passing/failing, event resolutions, scandals, etc.
 * Up to now those headlines were only visible in the dashboard ticker
 * and scrolled away as new entries arrived.
 *
 * This panel is the player's reflective view: a single chronological
 * timeline grouped by month, with severity colour-coding so the eye
 * can quickly find crises versus routine events. Entries display
 * "MMM D, YYYY" relative dates and the same severity-bordered card
 * the dashboard uses, so the visual language is consistent.
 *
 * Future items (deferred):
 *   - Filter by severity / by related-entity type.
 *   - Click an entry to open the underlying entity (bill / event).
 *   - Export the timeline as a session recap.
 *
 * @module renderer/panels/TimelinePanel
 */

import { useMemo, useState } from 'react';
import { useWorldStore } from '@/store/worldStore';
import { useUIStore } from '@/store/uiStore';
import { Card } from '../components/Card';
import { TermText } from '../components/tooltip';
import { EntityLink, type EntityRefType, panelForEntity } from '../components/EntityLink';
import { useContextMenu } from '../hooks/useContextMenu';
import { writeClipboard } from '@/utils/clipboard';
import type { NewsItem } from '@/types';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/**
 * Stable composite key (year, month) used both for groupBy and for
 * rendering the section heading. Stored as a sortable number so the
 * keys can be sorted descending without parsing strings.
 */
function monthKey(item: NewsItem): number {
  return item.date.year * 12 + (item.date.month - 1);
}

function monthLabel(key: number): string {
  const year = Math.floor(key / 12);
  const month = key % 12;
  return `${MONTH_NAMES[month]} ${year}`;
}

/**
 * Group news items by month. Within each group, items keep their
 * original order (the worldStore unshifts so newest is first), and
 * groups themselves are emitted newest-first. This is exposed as a
 * named export so it can be unit-tested without rendering React.
 */
export function groupByMonth(items: ReadonlyArray<NewsItem>): Array<{ key: number; label: string; items: NewsItem[] }> {
  const buckets = new Map<number, NewsItem[]>();
  for (const item of items) {
    const k = monthKey(item);
    const existing = buckets.get(k);
    if (existing) existing.push(item);
    else buckets.set(k, [item]);
  }
  return Array.from(buckets.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([key, items]) => ({ key, label: monthLabel(key), items }));
}

const SEVERITY_BORDER: Record<NewsItem['severity'], string> = {
  info: 'border-rule-strong',
  warning: 'border-status-warning',
  danger: 'border-status-danger',
};

const SEVERITY_TEXT: Record<NewsItem['severity'], string> = {
  info: 'text-text-primary',
  warning: 'text-status-warning',
  danger: 'text-status-danger',
};

export function TimelinePanel(): JSX.Element {
  // Read from the uncapped archive so the chronology is complete.
  // Older save files (from before `newsArchive` existed) won't have
  // the field; fall back to the live ticker so loading them doesn't
  // crash the panel and the player still sees recent history.
  //
  // Codex review (PR#63 P1): `??` only catches `null`/`undefined`, but
  // freshly migrated saves arrive with `newsArchive: []` (the store's
  // default), which would silently win and erase the player's prior
  // history. Treat an empty archive as "not yet populated" and fall
  // back to the live ticker too.
  const news = useWorldStore((s) => {
    const archive = s.newsArchive;
    return archive && archive.length > 0 ? archive : s.news;
  });

  // Severity filter — null entries default to "all visible". Each
  // chip toggles its severity in/out of the visible set so the
  // player can isolate, e.g., only crises.
  const [severityFilter, setSeverityFilter] = useState<Set<NewsItem['severity']>>(
    () => new Set<NewsItem['severity']>(['info', 'warning', 'danger']),
  );
  // Free-text search across headline + body. Cheap and obvious;
  // pages with hundreds of entries become navigable.
  const [query, setQuery] = useState('');

  function toggleSeverity(s: NewsItem['severity']): void {
    setSeverityFilter((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      // Never let the player land in an empty filter — re-enable all
      // when the last chip is turned off, which matches how Steam,
      // Slack, and similar log filters behave.
      if (next.size === 0) return new Set<NewsItem['severity']>(['info', 'warning', 'danger']);
      return next;
    });
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return news.filter((item) => {
      if (!severityFilter.has(item.severity)) return false;
      if (q.length === 0) return true;
      if (item.headline.toLowerCase().includes(q)) return true;
      if (item.body && item.body.toLowerCase().includes(q)) return true;
      return false;
    });
  }, [news, severityFilter, query]);

  const grouped = useMemo(() => groupByMonth(filtered), [filtered]);
  const setActivePanel = useUIStore((s) => s.setActivePanel);
  const pushToast = useUIStore((s) => s.pushToast);
  const menu = useContextMenu();

  // Pre-computed totals power the chip badges so the player sees
  // how many entries fall into each severity bucket at a glance.
  const totals = useMemo(() => {
    let info = 0,
      warning = 0,
      danger = 0;
    for (const n of news) {
      if (n.severity === 'info') info += 1;
      else if (n.severity === 'warning') warning += 1;
      else danger += 1;
    }
    return { info, warning, danger };
  }, [news]);

  return (
    <div className="flex flex-col gap-4" data-testid="timeline-panel">
      <header className="space-y-3">
        <div>
          <h1 className="font-headline text-panel-title text-text-primary">Timeline</h1>
          <p className="text-body text-text-secondary">
            Every event, vote, and headline of your tenure. Most recent first.
          </p>
        </div>

        {/* Filter bar. The severity chips toggle visibility; the
            search input narrows by free-text match. Both are
            controlled state so reopening the panel preserves them
            across the session (but not across saves — that would
            require a UI store slice and a versioned save migration). */}
        <div
          className="flex flex-wrap items-center gap-2"
          data-testid="timeline-filter-bar"
        >
          <SeverityChip
            tone="info"
            label="Info"
            count={totals.info}
            active={severityFilter.has('info')}
            onClick={() => toggleSeverity('info')}
          />
          <SeverityChip
            tone="warning"
            label="Warning"
            count={totals.warning}
            active={severityFilter.has('warning')}
            onClick={() => toggleSeverity('warning')}
          />
          <SeverityChip
            tone="danger"
            label="Danger"
            count={totals.danger}
            active={severityFilter.has('danger')}
            onClick={() => toggleSeverity('danger')}
          />
          <div className="flex-1 min-w-[160px]">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search headlines\u2026"
              data-testid="timeline-search"
              className="w-full bg-bg-tertiary border border-rule rounded-sm px-2 py-1 text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-gold"
              aria-label="Search timeline"
            />
          </div>
          <span className="font-mono text-label text-text-muted tabular-nums" data-testid="timeline-count">
            {filtered.length} / {news.length}
          </span>
        </div>
      </header>

      {grouped.length === 0 ? (
        <Card>
          <p className="text-body text-text-muted italic">
            No history yet. Pass a bill, resolve an event, or wait a week — the press
            will do the rest.
          </p>
        </Card>
      ) : (
        grouped.map((group) => (
          <section
            key={group.key}
            data-testid={`timeline-month-${group.key}`}
            className="space-y-2"
          >
            <h2 className="font-mono text-label uppercase tracking-widest text-accent-gold">
              {group.label}
            </h2>
            <ol className="space-y-2">
              {group.items.map((item) => (
                <li
                  key={item.id}
                  data-testid={`timeline-item-${item.id}`}
                  className={
                    'pl-3 py-2 pr-3 border-l-4 bg-bg-secondary rounded-sm ' +
                    SEVERITY_BORDER[item.severity]
                  }
                  onContextMenu={(e) => {
                    // Build a per-headline menu. "Open detail" appears
                    // only when the item links to an entity; "Copy
                    // headline" is always available.
                    const items = [];
                    if (item.relatedEntity) {
                      const target = panelForEntity(
                        item.relatedEntity.type as EntityRefType,
                      );
                      items.push({
                        id: 'open-detail',
                        label: 'Open detail',
                        icon: 'external-link' as const,
                        onSelect: () => setActivePanel(target),
                      });
                    }
                    items.push({
                      id: 'copy-headline',
                      label: 'Copy headline',
                      icon: 'copy' as const,
                      onSelect: () => {
                        // `writeClipboard` always resolves — either
                        // path will fire one of the two toasts so the
                        // player gets feedback even on Android WebView
                        // where `navigator.clipboard` is undefined.
                        void writeClipboard(item.headline).then((ok) =>
                          pushToast({
                            message: ok ? 'Headline copied' : 'Clipboard unavailable',
                            severity: ok ? 'info' : 'warning',
                            ttl: ok ? 2000 : 2500,
                          }),
                        );
                      },
                    });
                    menu.open(e, items);
                  }}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <h3
                      className={
                        'font-headline text-body leading-snug ' +
                        SEVERITY_TEXT[item.severity]
                      }
                    >
                      {item.relatedEntity ? (
                        // Wrap the headline as a clickable EntityLink so
                        // the player can jump to the relevant panel
                        // (legislation/congress/population/timeline).
                        <EntityLink
                          type={item.relatedEntity.type as EntityRefType}
                          id={item.relatedEntity.id}
                        >
                          {item.headline}
                        </EntityLink>
                      ) : (
                        item.headline
                      )}
                    </h3>
                    <time
                      className="font-mono text-label text-text-muted shrink-0 tabular-nums"
                      dateTime={`${item.date.year}-${String(item.date.month).padStart(2, '0')}-${String(item.date.day).padStart(2, '0')}`}
                    >
                      {MONTH_NAMES[item.date.month - 1]?.slice(0, 3)} {item.date.day},{' '}
                      {item.date.year}
                    </time>
                  </div>
                  {item.body && (
                    <p className="text-body text-text-secondary mt-1 leading-snug">
                      <TermText text={item.body} />
                    </p>
                  )}
                </li>
              ))}
            </ol>
          </section>
        ))
      )}
      {menu.element}
    </div>
  );
}

/**
 * Severity filter chip. Shows the bucket name + count, and inverts
 * its colours when active so the active set is unambiguous at a
 * glance. Pure presentational helper — all state lives in the panel.
 */
function SeverityChip({
  tone,
  label,
  count,
  active,
  onClick,
}: {
  tone: NewsItem['severity'];
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}): JSX.Element {
  const dotColor =
    tone === 'danger'
      ? 'bg-status-danger'
      : tone === 'warning'
        ? 'bg-status-warning'
        : 'bg-text-muted';
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={`timeline-filter-${tone}`}
      data-active={active}
      aria-pressed={active}
      className={
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-sm border text-body transition-colors ' +
        (active
          ? 'bg-bg-secondary border-accent-gold text-text-primary'
          : 'bg-bg-tertiary border-rule text-text-muted hover:text-text-secondary')
      }
    >
      <span className={`h-2 w-2 rounded-full ${dotColor}`} aria-hidden />
      <span>{label}</span>
      <span className="font-mono text-label tabular-nums opacity-80">{count}</span>
    </button>
  );
}
