/**
 * NewsPanel — chronological news feed for the current game session.
 *
 * todo#47: aggregates all recent news headlines and events in a
 * scrollable chronological feed. Distinct from `TimelinePanel` (the
 * historical archive) in that it emphasises recency and "breaking news"
 * presentation rather than a structured chronological record.
 *
 * Features:
 *   - Shows `world.news` (most recent 50) from the live ticker.
 *   - Severity filter row: Info / Warning / Danger.
 *   - Free-text search on headline text.
 *   - Clicking a headline opens a detail modal with the full body and
 *     a button to jump to the related entity if present.
 *   - Shows a "No news yet" empty state at game start.
 *
 * @module renderer/panels/NewsPanel
 */

import { useMemo, useState } from 'react';
import { useWorldStore } from '@/store/worldStore';
import { useUIStore, type PanelId } from '@/store/uiStore';
import { Card } from '../components/Card';
import { Icon } from '../components/Icon';
import type { NewsItem } from '@/types';

// ─────────────────────────────────────────────────────────────
// SEVERITY STYLES
// Mirrors the TimelinePanel palette so the two views feel consistent.
// ─────────────────────────────────────────────────────────────

const SEV_BORDER: Record<NewsItem['severity'], string> = {
  info: 'border-rule',
  warning: 'border-status-warning',
  danger: 'border-status-danger',
};

const SEV_TEXT: Record<NewsItem['severity'], string> = {
  info: 'text-text-primary',
  warning: 'text-status-warning',
  danger: 'text-status-danger',
};

const SEV_DOT: Record<NewsItem['severity'], string> = {
  info: 'bg-text-muted',
  warning: 'bg-status-warning',
  danger: 'bg-status-danger',
};

const SEV_LABEL: Record<NewsItem['severity'], string> = {
  info: 'Info',
  warning: 'Warning',
  danger: 'Critical',
};

// ─────────────────────────────────────────────────────────────
// DATE FORMATTER
// Converts a GameDate (week/year integers) to a readable string.
// ─────────────────────────────────────────────────────────────

/** Format a `GameDate` as e.g. "Wk 14, 2025". */
function formatDate(date: { week: number; year: number }): string {
  return `Wk ${date.week}, ${date.year}`;
}

// ─────────────────────────────────────────────────────────────
// ENTITY → PANEL MAP
// Maps a relatedEntity type to the panel that shows more detail.
// Used by the "View details" button in the modal.
// ─────────────────────────────────────────────────────────────

const ENTITY_PANEL: Partial<Record<string, PanelId>> = {
  bill: 'legislation',
  event: 'timeline',
  npc: 'congress',
  group: 'population',
};

// ─────────────────────────────────────────────────────────────
// NEWS ITEM CARD
// Each headline renders as a bordered card. The left edge is
// coloured by severity so the player can scan urgency at a glance.
// ─────────────────────────────────────────────────────────────

/**
 * A single headline row in the news feed.
 */
function NewsCard({
  item,
  onSelect,
}: {
  item: NewsItem;
  onSelect: (item: NewsItem) => void;
}): JSX.Element {
  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className={
        'w-full text-left bg-bg-secondary border-l-4 border border-rule rounded-sm p-3 ' +
        'hover:bg-bg-tertiary/40 hover:border-l-accent-gold/60 transition-colors duration-instant ' +
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold ' +
        SEV_BORDER[item.severity]
      }
    >
      <div className="flex items-start gap-2">
        {/* Severity dot */}
        <span
          className={`mt-1.5 shrink-0 rounded-full w-2 h-2 ${SEV_DOT[item.severity]}`}
          aria-hidden
        />
        <div className="flex-1 min-w-0">
          <p className={`font-headline text-sm leading-snug ${SEV_TEXT[item.severity]}`}>
            {item.headline}
          </p>
          <div className="flex items-center gap-3 mt-1">
            <span className="font-mono text-[0.625rem] uppercase tracking-wider text-text-muted">
              {formatDate(item.date)}
            </span>
            <span className="font-mono text-[0.625rem] uppercase tracking-wider text-text-muted">
              {SEV_LABEL[item.severity]}
            </span>
            {item.relatedEntity && (
              <span className="font-mono text-[0.625rem] uppercase tracking-wider text-accent-gold/70">
                {item.relatedEntity.type}
              </span>
            )}
          </div>
        </div>
        {/* Expand indicator */}
        <Icon name="chevron-right" size={12} className="text-text-muted mt-1 shrink-0" />
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// DETAIL MODAL (inline, not a portal)
// A simple inline detail panel that slides in when a headline is
// selected. Kept in-panel rather than a portal modal to preserve
// the news context and avoid scroll-lock overhead for this flow.
// ─────────────────────────────────────────────────────────────

/**
 * Detail view for a selected news item. Shows the full body (if any),
 * severity, date, and a button to jump to the related entity panel.
 */
function NewsDetail({
  item,
  onClose,
}: {
  item: NewsItem;
  onClose: () => void;
}): JSX.Element {
  const setActivePanel = useUIStore((s) => s.setActivePanel);

  const relatedPanel = item.relatedEntity ? ENTITY_PANEL[item.relatedEntity.type] : undefined;

  return (
    <Card
      className="flex flex-col gap-3"
      data-testid="news-detail"
      role="region"
      aria-label={`News detail: ${item.headline}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <span
            className={
              'font-mono text-[0.625rem] uppercase tracking-wider ' + SEV_TEXT[item.severity]
            }
          >
            {SEV_LABEL[item.severity]}
          </span>
          <h2 className={`font-headline text-text-primary text-lg leading-snug mt-0.5`}>
            {item.headline}
          </h2>
          <p className="font-mono text-[0.625rem] uppercase tracking-wider text-text-muted mt-1">
            {formatDate(item.date)}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close news detail"
          className="text-text-muted hover:text-text-primary transition-colors shrink-0 mt-1"
        >
          <Icon name="close" size={14} />
        </button>
      </div>

      {/* Body */}
      {item.body ? (
        <p className="text-body text-text-secondary leading-relaxed">{item.body}</p>
      ) : (
        <p className="text-body text-text-muted italic">No additional details available.</p>
      )}

      {/* Related entity link */}
      {relatedPanel && (
        <div className="border-t border-rule pt-3">
          <button
            type="button"
            onClick={() => {
              setActivePanel(relatedPanel);
              onClose();
            }}
            className="flex items-center gap-1.5 text-body text-accent-gold hover:brightness-110 transition-all"
          >
            <Icon name="chevron-right" size={12} />
            View in {relatedPanel} panel
          </button>
        </div>
      )}
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN PANEL
// ─────────────────────────────────────────────────────────────

/**
 * Top-level News panel. Shows the live news ticker with severity
 * filters, search, and click-to-detail behaviour.
 */
export function NewsPanel(): JSX.Element {
  const news = useWorldStore((s) => s.news);

  const [selectedItem, setSelectedItem] = useState<NewsItem | null>(null);
  const [query, setQuery] = useState('');
  const [activeSeverities, setActiveSeverities] = useState<Set<NewsItem['severity']>>(
    () => new Set<NewsItem['severity']>(['info', 'warning', 'danger']),
  );

  /** Toggle a severity filter on/off. If all would be deselected, restore all. */
  function toggleSeverity(sev: NewsItem['severity']): void {
    setActiveSeverities((prev) => {
      const next = new Set(prev);
      if (next.has(sev)) {
        next.delete(sev);
      } else {
        next.add(sev);
      }
      if (next.size === 0) return new Set<NewsItem['severity']>(['info', 'warning', 'danger']);
      return next;
    });
    // Clear selection when filters change — the selected item may no
    // longer be visible, which would leave the detail panel stale.
    setSelectedItem(null);
  }

  const filtered = useMemo(() => {
    return news.filter(
      (item) =>
        activeSeverities.has(item.severity) &&
        (!query || item.headline.toLowerCase().includes(query.toLowerCase())),
    );
  }, [news, activeSeverities, query]);

  return (
    <div className="flex flex-col gap-4 h-full" data-testid="news-panel">
      {/* Panel header */}
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-headline text-panel-title text-text-primary">News</h1>
          <p className="text-body text-text-secondary">
            Recent headlines from your political career. Click any item for the full story.
          </p>
        </div>

        {/* Search */}
        <label className="relative w-64 max-w-full">
          <span className="sr-only">Search headlines</span>
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-text-muted">
            <Icon name="search" size={14} />
          </span>
          <input
            type="search"
            placeholder="Search headlines…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedItem(null);
            }}
            data-testid="news-search"
            className="w-full bg-bg-secondary border border-rule rounded-sm pl-7 pr-2 py-1.5 text-body text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-gold"
          />
        </label>
      </header>

      {/* Severity filter pills */}
      <nav
        className="flex gap-2 flex-wrap"
        aria-label="News severity filters"
        data-testid="news-severity-filters"
      >
        {(['danger', 'warning', 'info'] as const).map((sev) => {
          const count = news.filter((n) => n.severity === sev).length;
          const active = activeSeverities.has(sev);
          return (
            <button
              key={sev}
              type="button"
              onClick={() => toggleSeverity(sev)}
              aria-pressed={active}
              className={
                'flex items-center gap-1.5 px-3 py-1 font-mono text-label uppercase tracking-widest rounded-sm border transition-colors duration-instant ' +
                (active
                  ? 'border-transparent bg-bg-tertiary ' + SEV_TEXT[sev]
                  : 'border-rule text-text-muted opacity-50')
              }
            >
              <span className={`w-2 h-2 rounded-full ${SEV_DOT[sev]}`} aria-hidden />
              {SEV_LABEL[sev]} ({count})
            </button>
          );
        })}
        <span className="font-mono text-label text-text-muted self-center">
          {filtered.length} {filtered.length === 1 ? 'item' : 'items'}
        </span>
      </nav>

      {/* Main content — list + optional detail */}
      <div className={`flex-1 min-h-0 flex gap-4 ${selectedItem ? 'grid grid-cols-1 md:grid-cols-2' : ''}`}>
        {/* News list */}
        <div className="flex-1 min-h-0 overflow-y-auto game-scroll space-y-2 pr-1" data-testid="news-list">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3 text-text-muted">
              <Icon name="news" size={32} className="opacity-30" />
              <p className="text-body italic">
                {news.length === 0
                  ? 'No news yet. Advance time to see headlines.'
                  : 'No headlines match your filters.'}
              </p>
            </div>
          ) : (
            filtered.map((item) => (
              <NewsCard
                key={item.id}
                item={item}
                onSelect={(it) => setSelectedItem(selectedItem?.id === it.id ? null : it)}
              />
            ))
          )}
        </div>

        {/* Detail pane — only shown when an item is selected */}
        {selectedItem && (
          <div className="flex-1 min-h-0 overflow-y-auto game-scroll">
            <NewsDetail item={selectedItem} onClose={() => setSelectedItem(null)} />
          </div>
        )}
      </div>
    </div>
  );
}
