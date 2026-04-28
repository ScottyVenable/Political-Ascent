import { useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useCharacterStore } from '@/store/characterStore';
import { useWorldStore } from '@/store/worldStore';
import { useUIStore, type PanelId } from '@/store/uiStore';
import { Card } from '../components/Card';
import { Bar } from '../components/Bar';
import { Button } from '../components/Button';
import { Icon, type IconName } from '../components/Icon';
import { IdeologyCompass } from '../components/IdeologyCompass';
import { TermText } from '../components/tooltip';
import { formatBillionsUSD, describeIdeology } from '@/utils/format';
import type { Bill, BillStage } from '@/types';

/**
 * DashboardPanel — the player's "situation room".
 *
 * The previous dashboard was a 2×2 grid of same-weight Cards, which
 * made it read as a status page rather than a command centre. The
 * redesign (UI_GAME_FEEL_PROPOSAL §8.2) follows three rules:
 *
 *   1. **One primary focus at a time.** The biggest region answers
 *      "what needs my attention right now?" — a pending event, a bill
 *      awaiting a vote, or an ambient-state summary when nothing is
 *      hot. The answer carries a single gold CTA pointing the player
 *      at the relevant panel.
 *   2. **KPI strip on top.** Four mono readouts (Approval · GDP ·
 *      Unemployment · Deficit) in the `text-data-lg` scale. No chrome,
 *      just numbers and tiny uppercase labels.
 *   3. **Ambient news column.** The press feed lives to the right of
 *      the focus area, as a vertical ticker rather than a co-equal
 *      panel. It gives the dashboard the "watching the room" feel
 *      without taking the top billing slot from the primary focus.
 *
 * The Identity + Ideology pair sits under the focus, sized to fit
 * alongside a short "this week" agenda so the dashboard is a single
 * readable viewport without needing a scrollbar at 1440×900.
 */

// ─────────────────────────────────────────────────────────────
// FOCUS RESOLVER
// What single thing is the player supposed to look at right now?
// Resolved into one of a small set of shapes so the component can
// render the UI by simple switch rather than branching on store
// state in the JSX.
// ─────────────────────────────────────────────────────────────

interface EventFocus {
  kind: 'event';
  title: string;
}
interface VoteFocus {
  kind: 'vote';
  bill: Bill;
}
interface PipelineFocus {
  kind: 'pipeline';
  count: number;
  leading: Bill;
}
interface QuietFocus {
  kind: 'quiet';
}

type Focus = EventFocus | VoteFocus | PipelineFocus | QuietFocus;

// Rank bills so "furthest along in the pipeline" wins when the player
// has multiple in flight. A bill at `vote` is more urgent than one
// still in `committee`. Values are relative weights only.
const STAGE_RANK: Record<BillStage, number> = {
  draft: 0,
  committee: 1,
  floor_debate: 2,
  vote: 3,
  signed: 4,
  implementing: 4,
  enacted: 5,
  vetoed: -1,
  failed: -1,
};

export function resolveFocus(
  activeEventTitle: string | undefined,
  pending: Bill[],
): Focus {
  if (activeEventTitle) return { kind: 'event', title: activeEventTitle };
  // A bill at the vote stage is the single most time-sensitive thing
  // in the game — pipeline falls behind it.
  const voteBill = pending.find((b) => b.stage === 'vote');
  if (voteBill) return { kind: 'vote', bill: voteBill };
  if (pending.length === 0) return { kind: 'quiet' };
  const leading = [...pending].sort(
    (a, b) => STAGE_RANK[b.stage] - STAGE_RANK[a.stage],
  )[0];
  return { kind: 'pipeline', count: pending.length, leading };
}

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────

export function DashboardPanel(): JSX.Element {
  const news = useWorldStore((s) => s.news);
  const population = useWorldStore((s) => s.population);
  const economy = useWorldStore((s) => s.economy);
  const pending = useWorldStore((s) => s.pendingLegislation);
  const activeEvents = useWorldStore((s) => s.activeEvents);
  const activeQuests = useWorldStore((s) => s.activeQuests);

  const pc = useGameStore((s) => s.politicalCapital);
  const ap = useGameStore((s) => s.actionPoints.current);
  const apMax = useGameStore((s) => s.actionPoints.max);

  const char = useCharacterStore((s) => ({
    name: s.name,
    ideology: s.ideology,
    level: s.level,
    xp: s.xp,
  }));

  const setActivePanel = useUIStore((s) => s.setActivePanel);

  const avgHappiness = useMemo(
    () =>
      population.length > 0
        ? Math.round(
            population.reduce((a, g) => a + g.happiness, 0) / population.length,
          )
        : 0,
    [population],
  );

  // Events are stored as `{ instanceId, eventId }` — the title lives on
  // the definition. EventEngine surfaces the active event modal on its
  // own; here we just need a signal that an event is pending, and its
  // id works as a human-readable fallback when no definition lookup
  // helper is in scope for this component.
  const activeEventTitle = activeEvents[0]?.eventId;

  const focus = useMemo(
    () => resolveFocus(activeEventTitle, pending),
    [activeEventTitle, pending],
  );

  return (
    // Vertical stack: KPI strip → main two-column → bottom row.
    // Gap-4 matches the surrounding panel padding in the shell.
    <div className="flex flex-col gap-4">
      {/* ───────────────── KPI STRIP ─────────────────
          Each tile is a button that navigates to the panel where the
          underlying number lives. The colour of the value follows the
          tone resolver below: positive→success, negative→danger,
          neutral→primary text. The Approval tile uses a continuous
          red→amber→green ramp so the player gets a quick visual read
          of cohort sentiment without parsing the digits. */}
      <section
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
        aria-label="Key indicators"
      >
        <Kpi
          label="Approval"
          value={`${avgHappiness}`}
          trend={avgHappiness >= 55 ? 'up' : avgHappiness < 40 ? 'down' : 'flat'}
          tone={approvalTone(avgHappiness)}
          onClick={() => setActivePanel('population')}
          testId="kpi-approval"
          ariaLabel={`Approval ${avgHappiness}. Open Population panel.`}
        >
          <Bar
            value={avgHappiness}
            tone={
              avgHappiness > 55
                ? 'success'
                : avgHappiness < 40
                  ? 'danger'
                  : 'neutral'
            }
            className="mt-2"
          />
        </Kpi>
        <Kpi
          label="GDP Growth"
          value={`${economy.gdpGrowth.toFixed(2)}%`}
          trend={economy.gdpGrowth >= 1 ? 'up' : economy.gdpGrowth < 0 ? 'down' : 'flat'}
          tone={
            economy.gdpGrowth > 0
              ? 'positive'
              : economy.gdpGrowth < 0
                ? 'negative'
                : 'neutral'
          }
          onClick={() => setActivePanel('economy')}
          testId="kpi-gdp"
          ariaLabel={`GDP Growth ${economy.gdpGrowth.toFixed(2)} percent. Open Economy panel.`}
        />
        <Kpi
          label="Unemployment"
          value={`${economy.unemployment.toFixed(1)}%`}
          trend={
            economy.unemployment <= 4
              ? 'up'
              : economy.unemployment > 6
                ? 'down'
                : 'flat'
          }
          tone={
            economy.unemployment <= 4
              ? 'positive'
              : economy.unemployment > 6
                ? 'negative'
                : 'neutral'
          }
          onClick={() => setActivePanel('economy')}
          testId="kpi-unemployment"
          ariaLabel={`Unemployment ${economy.unemployment.toFixed(1)} percent. Open Economy panel.`}
        />
        <Kpi
          label="Deficit"
          value={formatBillionsUSD(economy.deficit)}
          trend={economy.deficit > 0 ? 'down' : 'up'}
          tone={economy.deficit > 0 ? 'negative' : 'positive'}
          onClick={() => setActivePanel('economy')}
          testId="kpi-deficit"
          ariaLabel={`Deficit ${formatBillionsUSD(economy.deficit)}. Open Economy panel.`}
        />
      </section>

      {/* ───────────────── MAIN TWO-COLUMN ─────────────────
          The focus region claims 2 of 3 tracks at md-and-up so it
          reads as the primary element. On narrow screens each card
          stacks full-width. */}
      <section className="grid md:grid-cols-3 gap-4">
        <FocusCard
          focus={focus}
          onOpenLegislation={() => setActivePanel('legislation')}
        />
        <NewsColumn news={news} />
      </section>

      {/* ───────────────── BOTTOM ROW ───────────────── */}
      <section className="grid md:grid-cols-3 gap-4">
        <IdentityCard
          name={char.name}
          level={char.level}
          xp={char.xp}
          ideology={char.ideology}
        />
        <AgendaCard
          pc={pc}
          ap={ap}
          apMax={apMax}
          pendingBills={pending.length}
          activeQuests={activeQuests.length}
          onOpen={setActivePanel}
        />
      </section>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// KPI — single-stat tile
// ─────────────────────────────────────────────────────────────

/**
 * Direction of a stat's current trend. Only used to colour a tiny
 * indicator dot; we do not attempt to render actual historical
 * sparklines on the dashboard (the Economy panel already does that).
 */
type Trend = 'up' | 'down' | 'flat';

const TREND_CLS: Record<Trend, string> = {
  up: 'text-status-success',
  down: 'text-status-danger',
  flat: 'text-text-muted',
};

const TREND_GLYPH: Record<Trend, string> = {
  up: '▲',
  down: '▼',
  flat: '—',
};

/**
 * Tone for a KPI value. Drives the colour of the headline number.
 * - `positive`: green — a "good" number for this stat.
 * - `negative`: red — a "bad" number for this stat.
 * - `neutral`: default text colour.
 */
type Tone = 'positive' | 'negative' | 'neutral';

const TONE_CLS: Record<Tone, string> = {
  positive: 'text-status-success',
  negative: 'text-status-danger',
  neutral: 'text-text-primary',
};

/**
 * Approval tone resolver. Treats approval as a continuous red→green ramp
 * around mid-50s. Below 40 the player is in danger; 40-55 is neutral;
 * 55+ is healthy.
 */
function approvalTone(value: number): Tone {
  if (value < 40) return 'negative';
  if (value >= 55) return 'positive';
  return 'neutral';
}

function Kpi({
  label,
  value,
  trend,
  tone = 'neutral',
  onClick,
  testId,
  ariaLabel,
  children,
}: {
  label: string;
  value: string;
  trend: Trend;
  tone?: Tone;
  onClick?: () => void;
  testId?: string;
  ariaLabel?: string;
  children?: React.ReactNode;
}): JSX.Element {
  // The whole tile is interactive when an onClick is provided. We render
  // a real <button> rather than slap onClick on a <div> so keyboard
  // navigation, focus rings, and screen-reader semantics come for free.
  const inner = (
    <>
      <div className="flex items-center justify-between gap-1 min-w-0">
        <span className="font-mono text-label uppercase tracking-wider sm:tracking-widest text-text-muted truncate">
          {label}
        </span>
        <span
          className={`font-mono text-[0.625rem] shrink-0 ${TREND_CLS[trend]}`}
          aria-hidden
        >
          {TREND_GLYPH[trend]}
        </span>
      </div>
      <div
        className={`font-mono text-2xl sm:text-data-lg tabular-nums mt-1 leading-none ${TONE_CLS[tone]} truncate`}
      >
        {value}
      </div>
      {children}
    </>
  );

  const baseCls =
    'bg-bg-secondary border border-rule rounded-sm p-3 text-left ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold';

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel ?? label}
        data-testid={testId}
        className={
          baseCls +
          ' transition-colors duration-instant hover:border-accent-gold/60 hover:bg-bg-tertiary/40 cursor-pointer'
        }
      >
        {inner}
      </button>
    );
  }

  return (
    <div data-testid={testId} className={baseCls}>
      {inner}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// FOCUS CARD — "what needs my attention right now"
// ─────────────────────────────────────────────────────────────

function FocusCard({
  focus,
  onOpenLegislation,
}: {
  focus: Focus;
  onOpenLegislation: () => void;
}): JSX.Element {
  let icon: IconName;
  let kicker: string;
  let title: string;
  let body: string;
  let cta: { label: string; onClick: () => void } | null = null;

  switch (focus.kind) {
    case 'event':
      icon = 'alert';
      kicker = 'INCOMING';
      // The event modal surfaces automatically when activeEvents is
      // non-empty — the CTA here is mostly a signal to the player that
      // the modal is waiting behind any other transient UI.
      title = 'An event demands your attention.';
      body =
        'A decision is pending. Resolve the event to continue. The modal will open when you dismiss any overlay.';
      break;
    case 'vote':
      icon = 'legislation';
      kicker = 'ROLL CALL';
      title = focus.bill.title;
      body = `The bill has reached the floor and is ready for a vote. ${focus.bill.supportVotes} ayes · ${focus.bill.opposeVotes} nays locked in so far.`;
      cta = { label: 'Go to Legislation', onClick: onOpenLegislation };
      break;
    case 'pipeline':
      icon = 'legislation';
      kicker = 'IN FLIGHT';
      title = `${focus.count} bill${focus.count === 1 ? '' : 's'} advancing`;
      body = `Lead: “${focus.leading.title}” at ${stageLabel(focus.leading.stage)}. Review your pipeline or expedite.`;
      cta = { label: 'Go to Legislation', onClick: onOpenLegislation };
      break;
    case 'quiet':
    default:
      icon = 'clock';
      kicker = 'THE FLOOR';
      title = 'A quiet week on the Hill.';
      body =
        'No bills in flight and no events demanding action. A good time to draft new legislation, cultivate allies, or spend skill points.';
      cta = { label: 'Draft a Bill', onClick: onOpenLegislation };
      break;
  }

  return (
    <Card accent="gold" className="md:col-span-2">
      <div className="flex items-start gap-3">
        <div className="text-accent-gold mt-0.5">
          <Icon name={icon} size={24} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-mono text-label uppercase tracking-widest text-accent-gold">
            {kicker}
          </div>
          <h2 className="font-headline text-panel-title text-text-primary mt-1 leading-tight">
            {title}
          </h2>
          <p className="text-body text-text-secondary mt-3">{body}</p>
          {cta && (
            <div className="mt-4">
              <Button variant="primary" size="md" onClick={cta.onClick}>
                {cta.label}
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

/**
 * Human-readable stage label. Upper-cases the machine stage id and
 * replaces underscores. Centralised so the mapping does not drift
 * between the dashboard and the legislation panel.
 */
function stageLabel(stage: BillStage): string {
  return stage.replace(/_/g, ' ').toUpperCase();
}

// ─────────────────────────────────────────────────────────────
// NEWS COLUMN — ambient ticker
// ─────────────────────────────────────────────────────────────

function NewsColumn({
  news,
}: {
  news: ReadonlyArray<{
    id: string;
    headline: string;
    body?: string;
    severity?: 'info' | 'warning' | 'danger';
  }>;
}): JSX.Element {
  return (
    <Card title="The Press" subtitle="LATEST" className="h-full">
      {news.length === 0 ? (
        <p className="text-body text-text-muted italic">
          The press is quiet… for now.
        </p>
      ) : (
        <ul className="space-y-3 max-h-96 overflow-y-auto game-scroll pr-1">
          {news.slice(0, 12).map((n) => (
            <li
              key={n.id}
              className={
                'pl-3 border-l-2 ' +
                (n.severity === 'danger'
                  ? 'border-status-danger'
                  : n.severity === 'warning'
                    ? 'border-status-warning'
                    : 'border-rule-strong')
              }
            >
              <div
                className={
                  'font-headline text-sm leading-snug ' +
                  (n.severity === 'danger'
                    ? 'text-status-danger'
                    : n.severity === 'warning'
                      ? 'text-status-warning'
                      : 'text-text-primary')
                }
              >
                {n.headline}
              </div>
              {n.body && (
                <p className="text-[0.8125rem] text-text-secondary mt-0.5 leading-snug">
                  <TermText text={n.body} />
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────
// IDENTITY CARD — character + ideology summary
// ─────────────────────────────────────────────────────────────

function IdentityCard({
  name,
  level,
  xp,
  ideology,
}: {
  name: string;
  level: number;
  xp: number;
  ideology: { x: number; y: number };
}): JSX.Element {
  return (
    <Card title={name || 'Senator'} subtitle={`LV ${level} · ${xp} XP`} className="md:col-span-2">
      <div className="flex gap-4 items-center">
        <IdeologyCompass value={ideology} size={120} label={false} showReferenceFigures={false} />
        <div className="flex-1">
          <div className="font-mono text-label uppercase tracking-widest text-text-muted">
            Ideology
          </div>
          <div className="font-headline text-card-title text-accent-gold mt-1">
            {describeIdeology(ideology.x, ideology.y)}
          </div>
          <div className="font-mono text-data-sm text-text-muted mt-1 tabular-nums">
            x {ideology.x.toFixed(2)} · y {ideology.y.toFixed(2)}
          </div>
        </div>
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────
// AGENDA CARD — "this week", quick-nav resources
// ─────────────────────────────────────────────────────────────

function AgendaCard({
  pc,
  ap,
  apMax,
  pendingBills,
  activeQuests,
  onOpen,
}: {
  pc: number;
  ap: number;
  apMax: number;
  pendingBills: number;
  activeQuests: number;
  onOpen: (panel: PanelId) => void;
}): JSX.Element {
  return (
    <Card title="This Week" subtitle="AGENDA">
      <ul className="space-y-2">
        <AgendaRow
          icon="legislation"
          label="Bills in flight"
          value={pendingBills}
          onClick={() => onOpen('legislation')}
        />
        <AgendaRow
          icon="quests"
          label="Active quests"
          value={activeQuests}
          onClick={() => onOpen('quests')}
        />
        <AgendaRow
          icon="cards"
          label="Political capital"
          value={pc}
          suffix="PC"
          onClick={() => onOpen('cards')}
        />
        <AgendaRow
          icon="skills"
          label="Action points"
          value={`${ap}/${apMax}`}
          onClick={() => onOpen('skills')}
        />
      </ul>
    </Card>
  );
}

function AgendaRow({
  icon,
  label,
  value,
  suffix,
  onClick,
}: {
  icon: IconName;
  label: string;
  value: number | string;
  suffix?: string;
  onClick: () => void;
}): JSX.Element {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="w-full flex items-center gap-3 py-1.5 px-1 rounded-sm text-text-secondary hover:text-text-primary hover:bg-bg-tertiary/40 transition-colors duration-instant"
      >
        <Icon name={icon} size={16} className="text-text-muted" />
        <span className="flex-1 text-left text-body">{label}</span>
        <span className="font-mono text-data-sm text-text-primary tabular-nums">
          {value}
          {suffix && <span className="text-text-muted ml-1">{suffix}</span>}
        </span>
      </button>
    </li>
  );
}
