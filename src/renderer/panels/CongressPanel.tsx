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
import { useMemo, useState } from 'react';
import { useWorldStore } from '@/store/worldStore';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { Hemicycle } from '../components/Hemicycle';
import type { Legislator, Party } from '@/types';

type PartyFilter = 'all' | Party;

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

  const senateFiltered = useMemo(
    () => (filter === 'all' ? senate : senate.filter((l) => l.party === filter)),
    [senate, filter],
  );
  const houseFiltered = useMemo(
    () => (filter === 'all' ? house : house.filter((l) => l.party === filter)),
    [house, filter],
  );

  return (
    <div className="grid lg:grid-cols-[1fr_280px] gap-4 items-start">
      <div className="space-y-4 min-w-0">
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
              onClick={() => setSelected(null)}
              className="ml-auto text-label font-mono uppercase tracking-widest text-text-muted hover:text-text-primary transition-colors"
            >
              Close detail
            </button>
          )}
        </div>

        <ChamberCard
          title="Senate"
          legislators={senateFiltered}
          totalSeats={senate.length}
          majority={Math.floor(senate.length / 2) + 1}
          onSelect={setSelected}
          highlightId={selected?.id as string | undefined}
        />
        <ChamberCard
          title="House of Representatives"
          legislators={houseFiltered}
          totalSeats={house.length}
          majority={Math.floor(house.length / 2) + 1}
          onSelect={setSelected}
          highlightId={selected?.id as string | undefined}
        />
      </div>

      {/* ── DETAIL RAIL ── */}
      <div className="lg:sticky lg:top-0">
        <LegislatorDetail legislator={selected} />
      </div>
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
  highlightId,
}: {
  title: string;
  legislators: readonly Legislator[];
  totalSeats: number;
  majority: number;
  onSelect: (l: Legislator) => void;
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