/**
 * CongressPanel — the chamber floor.
 *
 * Redesign pass (todo#69, April 2026):
 *   - Eliminated the "both chambers" view. Players choose Senate or House
 *     with a two-tab strip; one chamber owns the entire viewport at a time,
 *     giving the hemicycle more room and making the member list readable.
 *   - Left column: plinth header + hemicycle. Right column: scrollable
 *     member roster with real-time search, party filter, sort options, and
 *     a hide/dim toggle. Typing in the search box updates the hemicycle
 *     in real time — non-matching seats fade to ~18% opacity so spatial
 *     context (left/right arc position) is preserved while matched members
 *     are visually prominent.
 *   - Hovering a seat shows a floating tooltip anchored at the cursor.
 *   - Clicking a seat or a member row opens the full MemberModal.
 *
 * Vote count fix (todo#83): vote counts now populate because
 * `LegislationSystem.resolveVote` records each senator's individual vote
 * into `legislator.votingHistory` immediately after the roll-call.
 *
 * Performance:
 *   - `Hemicycle` is memoized and recomputes only when the legislators
 *     list identity changes. The dimmedIds Set is rebuilt by useMemo
 *     whenever search/filter/chamber state changes.
 *   - Member list is a windowed `<ul>` in CSS — no virtualizer needed
 *     for 100 senators; for 435 representatives this is borderline but
 *     acceptable until a virtual-scroll library is approved.
 *
 * @module renderer/panels/CongressPanel
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useScrollLock } from '@/utils/useScrollLock';
import { useWorldStore } from '@/store/worldStore';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { Hemicycle } from '../components/Hemicycle';
import type { Legislator, Party, LegislatorPersonality } from '@/types';

type PartyFilter = 'all' | Party;
/** Single-chamber tab — no more "both". */
type ChamberTab = 'senate' | 'house';

/** Direction to sort the member list. */
type SortKey = 'name' | 'state' | 'relationship' | 'votes';
/** Whether filtered-out seats are hidden entirely or dimmed in the hemicycle. */
type FilterMode = 'dim' | 'hide';

/**
 * Coarse ideology bucket based on ideology.x axis.
 * Matches left/right real-world seating convention used by layoutHemicycle.
 */
type IdeologyFilter = 'all' | 'left' | 'center' | 'right';

/** Filter by personality archetype. */
type PersonalityFilter = 'all' | LegislatorPersonality;

const PARTY_LABEL: Record<Party, string> = {
  D: 'Democrat',
  R: 'Republican',
  I: 'Independent',
};

const PARTY_BAR: Record<Party, string> = {
  D: 'bg-[#5A7A8A]',
  R: 'bg-[#A85958]',
  I: 'bg-accent-gold',
};

const PARTY_TEXT: Record<Party, string> = {
  D: 'text-[#7B9BAB]',
  R: 'text-[#C07A79]',
  I: 'text-accent-gold',
};

/** Tooltip shown at cursor when hovering a hemicycle seat. */
interface HoverTooltip {
  legislator: Legislator;
  /** Client-space X (pixels from left of viewport). */
  x: number;
  /** Client-space Y (pixels from top of viewport). */
  y: number;
}

export function CongressPanel(): JSX.Element {
  const senate = useWorldStore((s) => s.congress.senate);
  const house = useWorldStore((s) => s.congress.house);

  const [chamber, setChamber] = useState<ChamberTab>('senate');
  const [partyFilter, setPartyFilter] = useState<PartyFilter>('all');
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [ideologyFilter, setIdeologyFilter] = useState<IdeologyFilter>('all');
  const [personalityFilter, setPersonalityFilter] = useState<PersonalityFilter>('all');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [filterMode, setFilterMode] = useState<FilterMode>('dim');
  const [selected, setSelected] = useState<Legislator | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  /** Floating tooltip state for seat hover. */
  const [hoverTooltip, setHoverTooltip] = useState<HoverTooltip | null>(null);

  // The full list for the active chamber.
  const chamberMembers = chamber === 'senate' ? senate : house;

  // Normalised search term for case-insensitive matching.
  const searchLower = search.toLowerCase();

  /**
   * Members that match ALL active filters (party, state, ideology bucket,
   * personality) AND the search string.
   * This is the set rendered in the right-side list.
   */
  const matchedMembers = useMemo(() => {
    return chamberMembers.filter((l) => {
      // Party
      if (partyFilter !== 'all' && l.party !== partyFilter) return false;
      // State
      if (stateFilter !== 'all' && l.state !== stateFilter) return false;
      // Ideology bucket: left < -0.33, right > 0.33, center otherwise.
      if (ideologyFilter !== 'all') {
        const x = l.ideology.x;
        if (ideologyFilter === 'left'   && x >= -0.33) return false;
        if (ideologyFilter === 'center' && (x < -0.33 || x > 0.33)) return false;
        if (ideologyFilter === 'right'  && x <= 0.33)  return false;
      }
      // Personality
      if (personalityFilter !== 'all' && l.personality !== personalityFilter) return false;
      // Text search — name, state, or personality.
      if (searchLower) {
        const hit =
          l.name.toLowerCase().includes(searchLower) ||
          l.state.toLowerCase().includes(searchLower) ||
          l.personality.toLowerCase().includes(searchLower);
        if (!hit) return false;
      }
      return true;
    });
  }, [chamberMembers, partyFilter, stateFilter, ideologyFilter, personalityFilter, searchLower]);

  /** Sorted list for the right-side roster. */
  const sortedMembers = useMemo(() => {
    return [...matchedMembers].sort((a, b) => {
      switch (sortKey) {
        case 'name': return a.name.localeCompare(b.name);
        case 'state': return a.state.localeCompare(b.state) || a.name.localeCompare(b.name);
        case 'relationship': return b.relationship - a.relationship;
        // Sort by total votes cast (ascending = fewest recorded votes first).
        case 'votes': {
          const av = Object.keys(a.votingHistory).length;
          const bv = Object.keys(b.votingHistory).length;
          return bv - av; // descending: most-active first
        }
        default: return 0;
      }
    });
  }, [matchedMembers, sortKey]);

  /**
   * Set of legislator ids to dim (or hide) in the hemicycle.
   *
   * When there is no active filter/search, the set is empty and all seats
   * are fully opaque. When a filter is active, seats NOT in `matchedMembers`
   * are either dimmed (filterMode='dim') or excluded from the legislators
   * list passed to Hemicycle (filterMode='hide').
   */
  const dimmedIds = useMemo<ReadonlySet<string>>(() => {
    const hasFilter =
      partyFilter !== 'all' ||
      stateFilter !== 'all' ||
      ideologyFilter !== 'all' ||
      personalityFilter !== 'all' ||
      searchLower.length > 0;
    if (!hasFilter) return new Set();
    const matchedSet = new Set(matchedMembers.map((l) => l.id as unknown as string));
    return new Set(
      chamberMembers
        .map((l) => l.id as unknown as string)
        .filter((id) => !matchedSet.has(id)),
    );
  }, [chamberMembers, matchedMembers, partyFilter, stateFilter, ideologyFilter, personalityFilter, searchLower]);

  /**
   * The legislators list passed to the Hemicycle.
   * In 'hide' mode we exclude dimmed members entirely; in 'dim' mode we
   * show all seats but let Hemicycle fade the non-matched ones.
   */
  const hemicycleMembers = useMemo(() => {
    if (filterMode === 'hide' && dimmedIds.size > 0) {
      return chamberMembers.filter((l) => !dimmedIds.has(l.id as unknown as string));
    }
    return chamberMembers;
  }, [chamberMembers, dimmedIds, filterMode]);

  /** Open the member modal. */
  const onSeatClick = useCallback((l: Legislator): void => {
    setSelected(l);
    setModalOpen(true);
    setHoverTooltip(null);
  }, []);

  /** Update the floating tooltip position and subject on hover. */
  const onHoverPos = useCallback((l: Legislator | null, x: number, y: number): void => {
    setHoverTooltip(l ? { legislator: l, x, y } : null);
  }, []);

  /** Total seat counts for the plinth header. */
  const totalSeats = chamberMembers.length;
  const majority = Math.floor(totalSeats / 2) + 1;

  // Party breakdown across the full (unfiltered) chamber, so the
  // PartyStrip always shows the real composition regardless of filter.
  const breakdown = useMemo(
    () => countByParty(chamberMembers),
    [chamberMembers],
  );

  return (
    <div className="space-y-3">
      {/* ── CHAMBER TABS ── */}
      <div
        className="flex items-center gap-1 border-b border-bg-tertiary"
        role="tablist"
        aria-label="Chamber"
        data-testid="congress-chamber-tabs"
      >
        {([
          { id: 'senate', label: 'Senate' },
          { id: 'house', label: 'House' },
        ] as const).map((tab) => {
          const active = chamber === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              data-testid={`congress-tab-${tab.id}`}
              onClick={() => setChamber(tab.id)}
              className={[
                'px-3 py-2 -mb-px font-mono text-label uppercase tracking-widest transition-colors',
                active
                  ? 'border-b-2 border-accent-gold text-accent-gold'
                  : 'border-b-2 border-transparent text-text-muted hover:text-text-primary',
              ].join(' ')}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── MAIN LAYOUT: hemicycle left + member list right ── */}
      <div className="grid lg:grid-cols-[1fr_320px] gap-4 items-start">

        {/* ── LEFT: PLINTH + HEMICYCLE ── */}
        {/*
          Constrained height (50vh - header offset) so the hemicycle
          never requires vertical scrolling to see in full (todo#56).
          The SVG is `w-full h-auto` inside a fixed-height container,
          so the viewBox scales down to fit. overflow-hidden prevents
          the rare case where the SVG aspect is taller than the container.
        */}
        <Card accent="gold" className="overflow-hidden">
          <header className="mb-3 pb-3 border-b border-rule">
            <div className="flex items-baseline justify-between gap-3 flex-wrap">
              <h3 className="font-headline text-panel-title text-text-primary capitalize">
                {chamber === 'senate' ? 'Senate' : 'House of Representatives'}
              </h3>
              <span className="font-mono text-data-sm text-text-muted tabular-nums">
                {totalSeats} seats · majority {majority}
              </span>
            </div>
            <PartyStrip breakdown={breakdown} total={totalSeats} className="mt-2" />
          </header>
          {/*
            Constrained height so the hemicycle never requires vertical
            scrolling to see in full (todo#56). The SVG is
            `w-full h-auto max-h-full` inside a flex column whose body
            has `max-h-[55vh]` — `flex items-center justify-center`
            keeps the chamber centred while it scales down to fit.
            On phones with very short viewports we fall back to
            `min-h` so the hemicycle keeps a legible minimum size.
          */}
          <div className="px-2 pt-1 max-h-[55vh] min-h-[220px] overflow-hidden flex items-center justify-center">
            <Hemicycle
              legislators={hemicycleMembers}
              onSelect={onSeatClick}
              onHoverPos={onHoverPos}
              highlightId={selected?.id as string | undefined}
              dimmedIds={filterMode === 'dim' ? dimmedIds : undefined}
            />
          </div>
        </Card>

        {/* ── RIGHT: MEMBER ROSTER ── */}
        <div className="space-y-3 lg:sticky lg:top-0">
          <MemberListPanel
            members={sortedMembers}
            total={chamberMembers.length}
            chamberMembers={chamberMembers}
            partyFilter={partyFilter}
            setPartyFilter={setPartyFilter}
            stateFilter={stateFilter}
            setStateFilter={setStateFilter}
            ideologyFilter={ideologyFilter}
            setIdeologyFilter={setIdeologyFilter}
            personalityFilter={personalityFilter}
            setPersonalityFilter={setPersonalityFilter}
            search={search}
            setSearch={setSearch}
            sortKey={sortKey}
            setSortKey={setSortKey}
            filterMode={filterMode}
            setFilterMode={setFilterMode}
            onSelect={onSeatClick}
            selected={selected}
          />
        </div>
      </div>

      {/* ── CURSOR TOOLTIP ── */}
      {hoverTooltip && (
        <SeatTooltip
          legislator={hoverTooltip.legislator}
          x={hoverTooltip.x}
          y={hoverTooltip.y}
        />
      )}

      {/* ── MEMBER MODAL ── */}
      {modalOpen && selected && (
        <MemberModal
          legislator={selected}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SEAT TOOLTIP
// Fixed-position card that follows the cursor. Shown on seat hover;
// dismissed on mouseleave via the parent state reset.
// ─────────────────────────────────────────────────────────────

/**
 * Lightweight floating card shown when the player hovers a hemicycle
 * seat. Positioned at `(x, y)` in client space with a small offset so
 * the cursor doesn't cover the text. The tooltip is `pointer-events-none`
 * so it doesn't swallow the SVG mouse events underneath it.
 *
 * @param legislator — member to summarise.
 * @param x — clientX from the SVG circle's onMouseEnter.
 * @param y — clientY from the SVG circle's onMouseEnter.
 */
function SeatTooltip({
  legislator: l,
  x,
  y,
}: {
  legislator: Legislator;
  x: number;
  y: number;
}): JSX.Element {
  const r = l.relationship;
  const relCls =
    r < -25 ? 'text-status-danger' :
    r < 25  ? 'text-status-warning' :
    'text-accent-gold';

  const votes = Object.entries(l.votingHistory);
  const yeas = votes.filter(([, v]) => v === 'yea').length;
  const nays = votes.filter(([, v]) => v === 'nay').length;

  return (
    <div
      className="fixed z-50 pointer-events-none bg-bg-secondary border border-bg-tertiary rounded-md shadow-xl px-3 py-2 min-w-[180px]"
      style={{
        left: Math.min(x + 12, window.innerWidth - 200),
        top: Math.max(y - 60, 8),
      }}
      data-testid="congress-seat-tooltip"
    >
      <p className="font-headline text-sm font-bold text-text-primary">{l.name}</p>
      <p className={`font-mono text-[0.6875rem] uppercase tracking-widest ${PARTY_TEXT[l.party]}`}>
        {l.party}-{l.state}
        {l.district !== undefined ? `-${l.district}` : ''}&nbsp;·&nbsp;{l.chamber.toUpperCase()}
      </p>
      <div className="mt-1 flex items-baseline justify-between text-[0.75rem]">
        <span className="text-text-muted font-mono">Rel.</span>
        <span className={`font-mono font-bold tabular-nums ${relCls}`}>
          {r > 0 ? '+' : ''}{r}
        </span>
      </div>
      {votes.length > 0 && (
        <div className="mt-0.5 flex items-baseline justify-between text-[0.75rem]">
          <span className="text-text-muted font-mono">Votes</span>
          <span className="font-mono tabular-nums text-text-secondary">
            <span className="text-status-success">{yeas}Y</span>
            {' / '}
            <span className="text-status-danger">{nays}N</span>
          </span>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MEMBER LIST PANEL
// Scrollable roster with search, party filter, sort, and hide/dim toggle.
// ─────────────────────────────────────────────────────────────

function MemberListPanel({
  members,
  total,
  chamberMembers,
  partyFilter,
  setPartyFilter,
  stateFilter,
  setStateFilter,
  ideologyFilter,
  setIdeologyFilter,
  personalityFilter,
  setPersonalityFilter,
  search,
  setSearch,
  sortKey,
  setSortKey,
  filterMode,
  setFilterMode,
  onSelect,
  selected,
}: {
  members: readonly Legislator[];
  total: number;
  /** Full unfiltered chamber list — used to derive available states. */
  chamberMembers: readonly Legislator[];
  partyFilter: PartyFilter;
  setPartyFilter: (p: PartyFilter) => void;
  stateFilter: string;
  setStateFilter: (s: string) => void;
  ideologyFilter: IdeologyFilter;
  setIdeologyFilter: (i: IdeologyFilter) => void;
  personalityFilter: PersonalityFilter;
  setPersonalityFilter: (p: PersonalityFilter) => void;
  search: string;
  setSearch: (s: string) => void;
  sortKey: SortKey;
  setSortKey: (k: SortKey) => void;
  filterMode: FilterMode;
  setFilterMode: (m: FilterMode) => void;
  onSelect: (l: Legislator) => void;
  selected: Legislator | null;
}): JSX.Element {
  const searchRef = useRef<HTMLInputElement>(null);

  // Collect the states that actually appear in this chamber (avoid
  // showing states with no representatives in that chamber).
  const availableStates = useMemo(() => {
    const seen = new Set<string>();
    for (const l of chamberMembers) seen.add(l.state);
    return ['all', ...Array.from(seen).sort()] as const;
  }, [chamberMembers]);

  // Track whether the advanced-filter accordion is open.
  const [advancedOpen, setAdvancedOpen] = useState(false);

  // How many advanced filters are currently active (for badge).
  const advancedCount =
    (stateFilter !== 'all' ? 1 : 0) +
    (ideologyFilter !== 'all' ? 1 : 0) +
    (personalityFilter !== 'all' ? 1 : 0);

  function clearAdvanced(): void {
    setStateFilter('all');
    setIdeologyFilter('all');
    setPersonalityFilter('all');
  }

  return (
    <Card title="Members" subtitle={`${members.length} of ${total}`}>
      {/* ── SEARCH ── */}
      <div className="relative mb-2">
        <Icon
          name="search"
          size={14}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted"
        />
        <input
          ref={searchRef}
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Name, state, or personality…"
          className="w-full bg-bg-tertiary border border-rule rounded-sm pl-8 pr-3 py-1.5 font-mono text-[0.8125rem] text-text-primary placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-accent-gold/40"
          data-testid="congress-member-search"
          aria-label="Search members"
        />
      </div>

      {/* ── PARTY FILTER ── */}
      <div className="flex items-center gap-1 mb-2 flex-wrap">
        {(['all', 'D', 'R', 'I'] as const).map((p) => (
          <Button
            key={p}
            size="sm"
            variant={partyFilter === p ? 'primary' : 'secondary'}
            onClick={() => setPartyFilter(p)}
            data-testid={`congress-filter-${p}`}
          >
            {p === 'all' ? 'All' : p}
          </Button>
        ))}
        {/* Hide / Dim toggle */}
        <button
          type="button"
          onClick={() => setFilterMode(filterMode === 'dim' ? 'hide' : 'dim')}
          className="ml-auto flex items-center gap-1 font-mono text-label uppercase tracking-widest text-text-muted hover:text-text-primary transition-colors"
          title={filterMode === 'dim' ? 'Dim filtered seats (click to hide instead)' : 'Hide filtered seats (click to dim instead)'}
          data-testid="congress-filter-mode-toggle"
        >
          <Icon name={filterMode === 'dim' ? 'eye' : 'eye-off'} size={13} />
          {filterMode === 'dim' ? 'Dim' : 'Hide'}
        </button>
      </div>

      {/* ── ADVANCED FILTERS (collapsible) ── */}
      <div className="mb-2 border border-rule rounded-sm overflow-hidden">
        <button
          type="button"
          className="w-full flex items-center justify-between px-2 py-1.5 font-mono text-label uppercase tracking-widest text-text-muted hover:text-text-primary hover:bg-bg-tertiary/50 transition-colors"
          onClick={() => setAdvancedOpen(!advancedOpen)}
          aria-expanded={advancedOpen}
          data-testid="congress-advanced-toggle"
        >
          <span className="flex items-center gap-1.5">
            <Icon name="filter" size={12} />
            Advanced Filters
            {advancedCount > 0 && (
              <span className="ml-1 px-1.5 py-0 rounded-full bg-accent-gold text-bg-primary font-bold text-[0.625rem] tabular-nums">
                {advancedCount}
              </span>
            )}
          </span>
          <Icon name={advancedOpen ? 'chevron-up' : 'chevron-down'} size={12} />
        </button>

        {advancedOpen && (
          <div className="px-2 pb-2 pt-1 space-y-2 border-t border-rule bg-bg-tertiary/30">
            {/* State filter */}
            <div className="flex items-center gap-2">
              <label
                htmlFor="congress-state-filter"
                className="font-mono text-label uppercase tracking-widest text-text-muted shrink-0 w-20"
              >
                State
              </label>
              <select
                id="congress-state-filter"
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value)}
                className="flex-1 bg-bg-secondary border border-rule rounded-sm px-2 py-1 font-mono text-[0.8125rem] text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-gold/40"
                data-testid="congress-state-filter"
              >
                <option value="all">All States</option>
                {availableStates.filter((s) => s !== 'all').map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Ideology bucket */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-label uppercase tracking-widest text-text-muted shrink-0 w-20">
                Ideology
              </span>
              <div className="flex items-center gap-1 flex-wrap">
                {(['all', 'left', 'center', 'right'] as const).map((i) => (
                  <Button
                    key={i}
                    size="sm"
                    variant={ideologyFilter === i ? 'primary' : 'secondary'}
                    onClick={() => setIdeologyFilter(i)}
                    data-testid={`congress-ideology-${i}`}
                  >
                    {i.charAt(0).toUpperCase() + i.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            {/* Personality */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-label uppercase tracking-widest text-text-muted shrink-0 w-20">
                Personality
              </span>
              <div className="flex items-center gap-1 flex-wrap">
                {(['all', 'loyalist', 'maverick', 'opportunist', 'ideologue', 'pragmatist'] as const).map((p) => (
                  <Button
                    key={p}
                    size="sm"
                    variant={personalityFilter === p ? 'primary' : 'secondary'}
                    onClick={() => setPersonalityFilter(p)}
                    data-testid={`congress-personality-${p}`}
                  >
                    {p === 'all' ? 'All' : p.charAt(0).toUpperCase() + p.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            {/* Clear all advanced filters */}
            {advancedCount > 0 && (
              <button
                type="button"
                onClick={clearAdvanced}
                className="font-mono text-label uppercase tracking-widest text-status-danger hover:text-status-danger/80 transition-colors"
                data-testid="congress-advanced-clear"
              >
                Clear Advanced Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── SORT ── */}
      <div className="flex items-center gap-1 mb-3 flex-wrap">
        <span className="font-mono text-label uppercase tracking-widest text-text-muted mr-1">
          Sort
        </span>
        {(['name', 'state', 'relationship', 'votes'] as const).map((key) => (
          <Button
            key={key}
            size="sm"
            variant={sortKey === key ? 'primary' : 'secondary'}
            onClick={() => setSortKey(key)}
            data-testid={`congress-sort-${key}`}
          >
            {key === 'relationship' ? 'Rel.' : key === 'votes' ? 'Votes' : key.charAt(0).toUpperCase() + key.slice(1)}
          </Button>
        ))}
      </div>

      {/* ── ROSTER ── */}
      {members.length === 0 ? (
        <p className="text-body text-text-muted italic">No members match the current filter.</p>
      ) : (
        <ul
          className="space-y-0.5 max-h-[60vh] overflow-y-auto game-scroll pr-1"
          data-testid="congress-member-list"
        >
          {members.map((l) => {
            const r = l.relationship;
            const relCls =
              r < -25 ? 'text-status-danger' :
              r < 25  ? 'text-status-warning' :
              'text-accent-gold';
            const isSelected = selected?.id === l.id;
            return (
              <li key={l.id as unknown as string}>
                <button
                  type="button"
                  onClick={() => onSelect(l)}
                  className={[
                    'w-full flex items-center gap-2 px-2 py-1 rounded-sm text-left text-[0.8125rem] transition-colors',
                    isSelected
                      ? 'bg-accent-gold/10 border border-accent-gold/30'
                      : 'hover:bg-bg-tertiary/60 border border-transparent',
                  ].join(' ')}
                  data-testid="congress-member-row"
                >
                  <span className={`font-mono text-[0.6875rem] uppercase w-4 shrink-0 ${PARTY_TEXT[l.party]}`}>
                    {l.party}
                  </span>
                  <span className="flex-1 truncate text-text-primary">{l.name}</span>
                  <span className="font-mono text-[0.6875rem] text-text-muted shrink-0">{l.state}</span>
                  <span className={`font-mono text-[0.6875rem] tabular-nums shrink-0 ${relCls}`}>
                    {r > 0 ? '+' : ''}{r}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────
// PARTY STRIP
// Stacked horizontal bar showing D/I/R proportion + count chips.
// ─────────────────────────────────────────────────────────────

function PartyStrip({
  breakdown,
  total,
  className = '',
}: {
  breakdown: Record<Party, number>;
  total: number;
  className?: string;
}): JSX.Element {
  const parties: Party[] = ['D', 'I', 'R'];
  return (
    <div className={className}>
      <div
        className="flex h-2 rounded-sm overflow-hidden bg-bg-tertiary border border-rule"
        role="img"
        aria-label={parties
          .map((p) => `${PARTY_LABEL[p]} ${breakdown[p]}`)
          .join(', ')}
      >
        {parties.map((p) => {
          const pct = total > 0 ? (breakdown[p] / total) * 100 : 0;
          return (
            <div key={p} className={PARTY_BAR[p]} style={{ width: `${pct}%` }} />
          );
        })}
      </div>
      <div className="flex gap-4 mt-1 font-mono text-label uppercase tracking-widest">
        {parties.map((p) => (
          <span key={p} className={PARTY_TEXT[p]}>
            {p}{' '}
            <span className="text-text-muted tabular-nums">{breakdown[p]}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function countByParty(legislators: readonly Legislator[]): Record<Party, number> {
  const out: Record<Party, number> = { D: 0, R: 0, I: 0 };
  for (const l of legislators) out[l.party] += 1;
  return out;
}

// ─────────────────────────────────────────────────────────────
// DETAIL UTILITIES  (DetailRow, VoteBadge)
// Shared between SeatTooltip, MemberListPanel, and MemberModal.
// ─────────────────────────────────────────────────────────────

function DetailRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'gold' | 'danger' | 'warning';
}): JSX.Element {
  const toneCls =
    tone === 'danger'
      ? 'text-status-danger'
      : tone === 'warning'
        ? 'text-status-warning'
        : tone === 'gold'
          ? 'text-accent-gold'
          : 'text-text-primary';
  return (
    <div className="flex justify-between items-baseline">
      <span className="font-mono text-label uppercase tracking-widest text-text-muted">
        {label}
      </span>
      <span className={`font-mono text-data-sm tabular-nums ${toneCls}`}>{value}</span>
    </div>
  );
}

function VoteBadge({ vote }: { vote: 'yea' | 'nay' | 'abstain' }): JSX.Element {
  const cls =
    vote === 'yea'
      ? 'text-status-success'
      : vote === 'nay'
        ? 'text-status-danger'
        : 'text-text-muted';
  const icon = vote === 'yea' ? 'check' : vote === 'nay' ? 'close' : 'clock';
  return (
    <span
      className={`font-mono text-[0.6875rem] uppercase tracking-wider flex items-center gap-1 ${cls}`}
    >
      <Icon name={icon} size={11} />
      {vote}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// MEMBER MODAL
// Full detail surface opened on seat click or member row click.
// ─────────────────────────────────────────────────────────────

/**
 * Deep-dive modal for a single legislator. Shows stat block + voting
 * record summary + recent votes. Closes on Escape or backdrop click.
 */
function MemberModal({
  legislator,
  onClose,
}: {
  legislator: Legislator;
  onClose: () => void;
}): JSX.Element {
  // Lock body scroll while the member detail overlay is open.
  useScrollLock();

  useEffect(() => {
    function onKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const r = legislator.relationship;
  const relTone =
    r < -25 ? 'danger' : r < 25 ? 'warning' : 'gold';
  const votes = Object.entries(legislator.votingHistory);
  const yeas = votes.filter(([, v]) => v === 'yea').length;
  const nays = votes.filter(([, v]) => v === 'nay').length;
  const abst = votes.filter(([, v]) => v === 'abstain').length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`${legislator.name} member detail`}
      onClick={onClose}
      data-testid="congress-member-modal"
    >
      <div
        className="w-full max-w-3xl bg-bg-secondary rounded-lg border border-bg-tertiary shadow-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between border-b border-bg-tertiary px-5 py-3">
          <div>
            <h2 className="font-headline text-xl font-bold text-accent-gold">
              {legislator.name}
            </h2>
            <p className="font-mono text-label uppercase tracking-widest text-text-muted">
              {PARTY_LABEL[legislator.party]} · {legislator.state}
              {legislator.district !== undefined && `-${legislator.district}`} ·{' '}
              {legislator.chamber.toUpperCase()}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </header>

        <div className="px-5 py-4 grid md:grid-cols-2 gap-5 overflow-y-auto game-scroll">
          {/* Left: stat block */}
          <section className="space-y-3" data-testid="member-modal-stats">
            <DetailRow
              label="Relationship"
              value={`${r > 0 ? '+' : ''}${r}`}
              tone={relTone}
            />
            <DetailRow label="Personality" value={legislator.personality} />
            <DetailRow
              label="Ideology"
              value={`${legislator.ideology.x.toFixed(2)} · ${legislator.ideology.y.toFixed(2)}`}
            />
            <DetailRow label="Term ends" value={String(legislator.termEndsYear)} />

            <div>
              <div className="font-mono text-label uppercase tracking-widest text-text-muted mb-1">
                Priorities
              </div>
              <div className="flex flex-wrap gap-1">
                {legislator.priorities.length === 0 ? (
                  <span className="text-body text-text-muted italic">None recorded</span>
                ) : (
                  legislator.priorities.map((p) => (
                    <span
                      key={p}
                      className="font-mono text-[0.6875rem] uppercase tracking-wider px-1.5 py-0.5 bg-bg-tertiary text-text-secondary rounded-sm"
                    >
                      {p}
                    </span>
                  ))
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-bg-tertiary/60 space-y-1">
              <div className="font-mono text-label uppercase tracking-widest text-text-muted">
                Research
              </div>
              <p className="text-body text-text-secondary leading-relaxed">
                Deeper opposition research — financial disclosures,
                statements, voting patterns by issue — is planned for
                a follow-up. The cards &ldquo;Press Inquiry&rdquo; and &ldquo;Hire
                Researcher&rdquo; will route here.
              </p>
              <Button variant="secondary" size="sm" disabled>
                Research member (coming soon)
              </Button>
            </div>
          </section>

          {/* Right: voting record */}
          <section className="space-y-3" data-testid="member-modal-votes">
            <div>
              <div className="font-mono text-label uppercase tracking-widest text-text-muted mb-2">
                Voting summary
              </div>
              <div className="grid grid-cols-3 gap-2">
                <VoteTotal label="Yea" count={yeas} tone="success" />
                <VoteTotal label="Nay" count={nays} tone="danger" />
                <VoteTotal label="Abst." count={abst} tone="muted" />
              </div>
            </div>

            <div>
              <div className="font-mono text-label uppercase tracking-widest text-text-muted mb-2">
                Recent votes
              </div>
              {votes.length === 0 ? (
                <p className="text-body text-text-muted italic">
                  No votes cast yet.
                </p>
              ) : (
                <ul className="space-y-1 max-h-72 overflow-y-auto game-scroll pr-1">
                  {votes
                    .slice(-25)
                    .reverse()
                    .map(([billId, vote]) => (
                      <li
                        key={billId}
                        className="flex justify-between items-center text-[0.8125rem] border-b border-bg-tertiary/40 py-1"
                      >
                        <span className="text-text-secondary truncate mr-2">
                          {billId}
                        </span>
                        <VoteBadge vote={vote} />
                      </li>
                    ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

/** Bordered tile rendering a single voting-record total. */
function VoteTotal({
  label,
  count,
  tone,
}: {
  label: string;
  count: number;
  tone: 'success' | 'danger' | 'muted';
}): JSX.Element {
  const cls =
    tone === 'success'
      ? 'text-status-success border-status-success/40'
      : tone === 'danger'
        ? 'text-status-danger border-status-danger/40'
        : 'text-text-muted border-bg-tertiary';
  return (
    <div className={`border rounded-sm px-2 py-1.5 text-center ${cls}`}>
      <div className="font-mono text-data-lg tabular-nums">{count}</div>
      <div className="font-mono text-[0.625rem] uppercase tracking-widest">
        {label}
      </div>
    </div>
  );
}

