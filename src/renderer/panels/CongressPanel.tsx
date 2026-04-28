/**
 * CongressPanel — the chamber floor.
 *
 * Redesign goals (UI_GAME_FEEL_PROPOSAL §8.4 / issue #41):
 *   - Show Congress as two chambers stacked vertically, each rendered
 *     as a semicircular hemicycle (see `Hemicycle.tsx`). This replaces
 *     the previous flat grid of coloured dots.
 *   - Above each hemicycle, a "plinth" header shows total seats,
 *     majority threshold, and a stacked party-ratio bar that lets the
 *     player read the coalition shape at a glance.
 *   - Clicking a seat opens a detail drawer alongside the chart
 *     (bottom strip on narrow screens, side rail on wide).
 *   - Party filter styled with the Button component so it no longer
 *     looks like raw inline CSS.
 *
 * Performance notes:
 *   - `Hemicycle` is memoized and only recomputes when its legislator
 *     list identity changes. Store selectors return the raw array
 *     reference so unrelated world updates do not trigger a re-layout
 *     of 535 seats.
 *   - Filtering to a single party typically cuts the working set in
 *     half so the re-layout on filter-toggle is cheap.
 */
import { useEffect, useMemo, useState } from 'react';
import { useWorldStore } from '@/store/worldStore';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { Hemicycle } from '../components/Hemicycle';
import type { Legislator, Party } from '@/types';

type PartyFilter = 'all' | Party;
/**
 * Which chamber view to render.
 *   - `both` — stacked Senate over House (the legacy layout).
 *   - `senate` / `house` — focus a single chamber. Frees the rest of
 *     the panel real estate for richer charts/data, per todo#30.
 */
type ChamberTab = 'both' | 'senate' | 'house';

const PARTY_LABEL: Record<Party, string> = {
  D: 'Democrat',
  R: 'Republican',
  I: 'Independent',
};

// Same palette as Hemicycle so the party-strip bars visually match
// the seats in the chart.
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

export function CongressPanel(): JSX.Element {
  const senate = useWorldStore((s) => s.congress.senate);
  const house = useWorldStore((s) => s.congress.house);

  const [filter, setFilter] = useState<PartyFilter>('all');
  const [selected, setSelected] = useState<Legislator | null>(null);
  // Hover preview lights up the side rail without locking selection.
  // Clicking a seat still pins via `selected` and opens the modal.
  const [hovered, setHovered] = useState<Legislator | null>(null);
  const [chamber, setChamber] = useState<ChamberTab>('both');
  // Modal opens on click. We keep it separate from `selected` so the
  // side rail can persist after the modal is dismissed (the player
  // often wants to keep studying the same member at a glance).
  const [modalOpen, setModalOpen] = useState(false);

  const senateFiltered = useMemo(
    () => (filter === 'all' ? senate : senate.filter((l) => l.party === filter)),
    [senate, filter],
  );
  const houseFiltered = useMemo(
    () => (filter === 'all' ? house : house.filter((l) => l.party === filter)),
    [house, filter],
  );

  /**
   * Seat-click handler: pin selection, light up rail, open modal. The
   * three actions share a single entry point so the panel never gets
   * into the half-state where one of them is missing.
   */
  const onSeatClick = (l: Legislator): void => {
    setSelected(l);
    setHovered(l);
    setModalOpen(true);
  };

  // The rail prefers hover (live) but falls back to the last pinned
  // selection so the rail does not blank out on mouseleave.
  const railSubject = hovered ?? selected;

  return (
    <div className="grid lg:grid-cols-[1fr_280px] gap-4 items-start">
      <div className="space-y-4 min-w-0">
        {/* ── CHAMBER TABS ──
            Three-state tab strip: Both / Senate / House. Senate-only
            and House-only views drop the second card so the focused
            chamber owns more vertical real estate. */}
        <div
          className="flex items-center gap-1 border-b border-bg-tertiary"
          role="tablist"
          aria-label="Chamber view"
          data-testid="congress-chamber-tabs"
        >
          {(
            [
              { id: 'both', label: 'Both Chambers' },
              { id: 'senate', label: 'Senate' },
              { id: 'house', label: 'House' },
            ] as const
          ).map((tab) => {
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

        {/* ── FILTER BAR ── */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-label uppercase tracking-widest text-text-muted mr-1">
            Filter
          </span>
          {(['all', 'D', 'R', 'I'] as const).map((p) => (
            <Button
              key={p}
              size="sm"
              variant={filter === p ? 'primary' : 'secondary'}
              onClick={() => setFilter(p)}
            >
              {p === 'all' ? 'All' : p}
            </Button>
          ))}
          {selected && (
            <button
              type="button"
              onClick={() => {
                setSelected(null);
                setHovered(null);
              }}
              className="ml-auto text-label font-mono uppercase tracking-widest text-text-muted hover:text-text-primary transition-colors"
            >
              Close detail
            </button>
          )}
        </div>

        {(chamber === 'both' || chamber === 'senate') && (
          <ChamberCard
            title="Senate"
            legislators={senateFiltered}
            totalSeats={senate.length}
            majority={Math.floor(senate.length / 2) + 1}
            onSelect={onSeatClick}
            onHover={setHovered}
            highlightId={selected?.id as string | undefined}
          />
        )}
        {(chamber === 'both' || chamber === 'house') && (
          <ChamberCard
            title="House of Representatives"
            legislators={houseFiltered}
            totalSeats={house.length}
            majority={Math.floor(house.length / 2) + 1}
            onSelect={onSeatClick}
            onHover={setHovered}
            highlightId={selected?.id as string | undefined}
          />
        )}
      </div>

      {/* ── DETAIL RAIL ── */}
      <div className="lg:sticky lg:top-0">
        <LegislatorDetail legislator={railSubject} />
      </div>

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
// CHAMBER CARD
// Plinth header + hemicycle for a single chamber.
// ─────────────────────────────────────────────────────────────

function ChamberCard({
  title,
  legislators,
  totalSeats,
  majority,
  onSelect,
  onHover,
  highlightId,
}: {
  title: string;
  legislators: readonly Legislator[];
  totalSeats: number;
  majority: number;
  onSelect: (l: Legislator) => void;
  onHover?: (l: Legislator | null) => void;
  highlightId?: string;
}): JSX.Element {
  const breakdown = useMemo(() => countByParty(legislators), [legislators]);

  return (
    <Card accent="gold" className="overflow-hidden">
      <header className="mb-3 pb-3 border-b border-rule">
        <div className="flex items-baseline justify-between gap-3 flex-wrap">
          <h3 className="font-headline text-panel-title text-text-primary">{title}</h3>
          <span className="font-mono text-data-sm text-text-muted tabular-nums">
            {legislators.length} of {totalSeats} · majority {majority}
          </span>
        </div>
        <PartyStrip breakdown={breakdown} total={legislators.length} className="mt-2" />
      </header>

      <div className="px-2 pt-1">
        <Hemicycle
          legislators={legislators}
          onSelect={onSelect}
          onHover={onHover}
          highlightId={highlightId}
        />
      </div>
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
// LEGISLATOR DETAIL RAIL
// Shown when a seat is clicked. Empty-state teaches the interaction.
// ─────────────────────────────────────────────────────────────

function LegislatorDetail({ legislator }: { legislator: Legislator | null }): JSX.Element {
  if (!legislator) {
    return (
      <Card title="Member" subtitle="DETAIL">
        <p className="text-body text-text-muted italic">
          Click a seat to inspect a legislator — their ideology,
          relationship with you, and voting record.
        </p>
      </Card>
    );
  }

  const r = legislator.relationship;
  const relTone: 'danger' | 'warning' | 'gold' =
    r < -25 ? 'danger' : r < 25 ? 'warning' : 'gold';
  const votes = Object.entries(legislator.votingHistory);

  return (
    <Card
      title={legislator.name}
      subtitle={`${legislator.party}-${legislator.state}${
        legislator.district !== undefined ? `-${legislator.district}` : ''
      } · ${legislator.chamber.toUpperCase()}`}
    >
      <div className="space-y-3">
        <DetailRow label="Relationship" value={`${r > 0 ? '+' : ''}${r}`} tone={relTone} />
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

        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="font-mono text-label uppercase tracking-widest text-text-muted">
              Voting record
            </span>
            <span className="font-mono text-data-sm text-text-muted tabular-nums">
              {votes.length}
            </span>
          </div>
          {votes.length === 0 ? (
            <p className="text-body text-text-muted italic">No votes cast yet.</p>
          ) : (
            <ul className="space-y-1 max-h-48 overflow-y-auto game-scroll pr-1">
              {votes.slice(-10).reverse().map(([billId, vote]) => (
                <li
                  key={billId}
                  className="flex justify-between items-center text-[0.8125rem]"
                >
                  <span className="text-text-secondary truncate mr-2">{billId}</span>
                  <VoteBadge vote={vote} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Card>
  );
}

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
// Click-to-open detail surface. The side rail stays as the live
// hover preview; this modal is where the player goes to *study* a
// member. Same data as the rail today, with extra room for an
// ideology compass and a research-mechanic placeholder (todo#30
// follow-up tracked as an issue).
// ─────────────────────────────────────────────────────────────

/**
 * Lay out the four-panel modal. Closes on Escape and on backdrop
 * click. We do not use ModalShell because the two competing
 * confirmation patterns (ModalShell's stack + this panel-level state)
 * fight over Escape; a self-contained modal keeps focus management
 * simple while we iterate on the panel.
 */
function MemberModal({
  legislator,
  onClose,
}: {
  legislator: Legislator;
  onClose: () => void;
}): JSX.Element {
  // Escape-to-close. Effect lives on the modal itself so unmounting
  // tears the listener down cleanly.
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
          {/* Left column: stat block. */}
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

          {/* Right column: voting record summary + recent votes. */}
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