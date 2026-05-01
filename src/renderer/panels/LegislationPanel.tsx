import { useMemo, useState } from 'react';
import { GameEngine } from '@/engine/GameEngine';
import {
  LegislationSystem,
  EXPEDITE_PC_COST,
  STAGE_DURATION_DAYS,
} from '@/systems/LegislationSystem';
import { useWorldStore } from '@/store/worldStore';
import { useGameStore } from '@/store/gameStore';
import { useUIStore } from '@/store/uiStore';
import { toEpochDays } from '@/utils/date';
import { formatTag } from '@/utils/format';
import { billTypeLabel } from '@/utils/billType';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Bar } from '../components/Bar';
import { TermText } from '../components/tooltip';
import { DraftLegislationScreen } from '../components/DraftLegislationScreen';
import type { Bill, BillId, BillStage, BillTemplate } from '@/types';

/**
 * LegislationPanel — draft, track, expedite, and vote on bills.
 *
 * After the April 2026 pacing pass, bills progress through committee →
 * floor debate → vote on a day-by-day clock driven by
 * `LegislationSystem.dailyUpdate`. The player has two levers in this panel:
 *
 *  1. **Draft** — introduce a new bill into committee. A forecast badge
 *     shows the estimated passage chance so the player can decide whether
 *     the bill is worth the PC investment *before* spending political
 *     capital on it.
 *  2. **Expedite** — skip the remainder of the current stage's clock by
 *     paying PC. Rarely the right move early in a term, often the right
 *     move near election day.
 *
 * Time alone will carry a bill to a vote. PC only accelerates.
 */
export function LegislationPanel(): JSX.Element {
  const templates = useMemo(() => GameEngine.getBillTemplates(), []);
  const pending = useWorldStore((s) => s.pendingLegislation);
  const passed = useWorldStore((s) => s.passedLegislation);
  const failed = useWorldStore((s) => s.failedLegislation);
  const pc = useGameStore((s) => s.politicalCapital);
  const currentDate = useGameStore((s) => s.currentDate);
  const pushToast = useUIStore((s) => s.pushToast);

  // Today's monotonic day index. Re-derived from `currentDate` on each
  // render so the progress bars advance the moment the clock ticks.
  const today = toEpochDays(currentDate);

  const [tab, setTab] = useState<'draft' | 'pending' | 'archive'>('pending');
  // When non-null, the deep-customization modal is open with this
  // template pre-loaded. Closing the modal clears it back to null.
  const [draftTarget, setDraftTarget] = useState<BillTemplate | null>(null);

  function quickDraft(template: BillTemplate): void {
    // Power-user shortcut: skip the customization screen entirely.
    LegislationSystem.draftBill(template);
    pushToast({ message: `Drafted: ${template.title}`, severity: 'info', ttl: 3000 });
    setTab('pending');
  }

  function expedite(id: BillId): void {
    const res = LegislationSystem.expediteStage(id);
    if (!res.ok) {
      pushToast({ message: res.reason ?? 'Cannot expedite', severity: 'warning', ttl: 3000 });
    }
  }

  function vote(id: BillId): void {
    const res = LegislationSystem.resolveVote(id);
    pushToast({
      message: res.passed
        ? `PASSED ${res.yea}\u2013${res.nay}`
        : `FAILED ${res.yea}\u2013${res.nay}`,
      severity: res.passed ? 'success' : 'danger',
      ttl: 4000,
    });
  }

  // Sort drafts descending by estimated passage chance so the player's
  // best options surface first.
  const rankedTemplates = useMemo(() => {
    return [...templates].sort(
      (a, b) =>
        LegislationSystem.estimatePassageChance(b) - LegislationSystem.estimatePassageChance(a),
    );
  }, [templates]);

  return (
    <div>
      {/* ──────────────────────────────────────────────────────────
          LEGISLATIVE SESSION DASHBOARD (todo#62)
          Shows a top-line summary of the current term so the player
          can gauge their overall legislative health at a glance before
          diving into specific bills.
          ────────────────────────────────────────────────────────── */}
      <div
        className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 p-3 rounded-lg bg-bg-secondary border border-rule text-sm"
        data-testid="legislation-session-dashboard"
      >
        {/* Current legislative session name, derived from the game year */}
        <div>
          <div className="text-xs uppercase tracking-wider text-text-muted mb-1">Session</div>
          <div className="font-semibold text-accent-gold truncate">
            {currentDate.year}th Congress
          </div>
        </div>
        {/* Total bills introduced this term */}
        <div>
          <div className="text-xs uppercase tracking-wider text-text-muted mb-1">In Flight</div>
          <div className="font-mono text-lg">{pending.length}</div>
        </div>
        {/* Passed tally (green) */}
        <div>
          <div className="text-xs uppercase tracking-wider text-text-muted mb-1">Passed</div>
          <div className="font-mono text-lg text-status-success">{passed.length}</div>
        </div>
        {/* Failed tally (red) */}
        <div>
          <div className="text-xs uppercase tracking-wider text-text-muted mb-1">Failed</div>
          <div className="font-mono text-lg text-status-danger">{failed.length}</div>
        </div>
      </div>

      {/* Featured bill: the first pending bill (most recently drafted),
          shown as a compact hero strip with stage + passage forecast.
          If no bills are in flight, this strip is hidden. */}
      {pending.length > 0 && (
        <div
          className="mb-4 p-3 rounded-lg border border-accent-gold/30 bg-bg-secondary flex flex-col sm:flex-row sm:items-center gap-2"
          data-testid="legislation-featured-bill"
        >
          <div className="flex-1 min-w-0">
            <div className="text-xs uppercase tracking-wider text-text-muted mb-0.5">
              Active Bill
            </div>
            <div className="font-semibold truncate text-accent-gold">{pending[0].title}</div>
            <div className="text-xs text-text-secondary mt-0.5">
              Stage: <span className="capitalize">{pending[0].stage.replace('_', ' ')}</span>
              {pending[0].sponsor === 'player' && (
                <span className="ml-2 text-accent-gold">&#x2605; Sponsored by you</span>
              )}
            </div>
          </div>
          <div className="flex gap-3 flex-shrink-0 text-xs">
            <div className="text-center">
              <div className="text-text-muted mb-0.5">Support</div>
              <div className={`font-mono ${(pending[0].supportVotes ?? 0) >= 50 ? 'text-status-success' : 'text-status-danger'}`}>
                {pending[0].supportVotes}
              </div>
            </div>
            <div className="text-center">
              <div className="text-text-muted mb-0.5">Oppose</div>
              <div className="font-mono text-status-danger">{pending[0].opposeVotes}</div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTab('pending')}
              className="self-center"
            >
              View all
            </Button>
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-4">
        <TabButton active={tab === 'pending'} onClick={() => setTab('pending')}>
          In Flight ({pending.length})
        </TabButton>
        <TabButton active={tab === 'draft'} onClick={() => setTab('draft')}>
          Draft New
        </TabButton>
        <TabButton active={tab === 'archive'} onClick={() => setTab('archive')}>
          Archive ({passed.length + failed.length})
        </TabButton>
      </div>

      {tab === 'draft' && (
        <div className="grid md:grid-cols-2 gap-3">
          {rankedTemplates.map((t) => {
            const chance = LegislationSystem.estimatePassageChance(t);
            const totalDays =
              (t.stageDurations?.committee ?? STAGE_DURATION_DAYS.committee) +
              (t.stageDurations?.floor_debate ?? STAGE_DURATION_DAYS.floor_debate) +
              (t.stageDurations?.vote ?? STAGE_DURATION_DAYS.vote);
            return (
              <Card key={t.id} title={t.title} accent="gold">
                <p className="text-sm text-text-secondary mb-2"><TermText text={t.description} /></p>
                <div className="text-xs text-text-muted flex flex-wrap gap-2 mb-3">
                  {t.tags.map((tag) => (
                    <span key={tag} className="bg-bg-tertiary rounded px-2 py-0.5">
                      {formatTag(tag)}
                    </span>
                  ))}
                  <span className="ml-auto">Opposition {t.opposition}</span>
                </div>
                <div className="flex items-center gap-3 mb-3 text-xs">
                  <span
                    className={`px-2 py-0.5 rounded font-mono ${chanceToneClass(chance)}`}
                    title="Estimated passage probability based on current Senate composition, relationships, and opposition."
                  >
                    Forecast: {Math.round(chance * 100)}% pass
                  </span>
                  <span className="text-text-muted">~{totalDays} days to vote</span>
                </div>
                <Button variant="primary" size="sm" onClick={() => setDraftTarget(t)} data-testid={`draft-customize-${t.id}`}>
                  Customize &amp; Draft
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => quickDraft(t)}
                  className="ml-2"
                  data-testid={`draft-quick-${t.id}`}
                >
                  Quick draft
                </Button>
              </Card>
            );
          })}
        </div>
      )}

      {tab === 'pending' && (
        <div className="space-y-3">
          {pending.length === 0 && (
            <p className="text-sm text-text-muted italic">
              No bills in flight. Draft one to get started.
            </p>
          )}
          {pending.map((b) => (
            <PendingBillCard
              key={b.id}
              bill={b}
              today={today}
              pc={pc}
              onExpedite={() => expedite(b.id)}
              onVote={() => vote(b.id)}
            />
          ))}
        </div>
      )}

      {tab === 'archive' && (
        <div className="grid md:grid-cols-2 gap-3">
          {passed.map((b) => (
            <Card key={b.id} title={b.title} subtitle="Passed" accent="gold">
              {b.type && b.type !== 'act' && (
                <span className="inline-block px-1.5 py-0.5 rounded font-mono text-[0.625rem] uppercase tracking-wider bg-bg-tertiary text-text-muted mb-1">
                  {billTypeLabel(b.type)}
                </span>
              )}
              <p className="text-xs text-text-muted">
                Yea {b.supportVotes} &ndash; Nay {b.opposeVotes}
              </p>
            </Card>
          ))}
          {failed.map((b) => (
            <Card key={b.id} title={b.title} subtitle="Failed" accent="red">
              {b.type && b.type !== 'act' && (
                <span className="inline-block px-1.5 py-0.5 rounded font-mono text-[0.625rem] uppercase tracking-wider bg-bg-tertiary text-text-muted mb-1">
                  {billTypeLabel(b.type)}
                </span>
              )}
              <p className="text-xs text-text-muted">
                Yea {b.supportVotes} &ndash; Nay {b.opposeVotes}
              </p>
            </Card>
          ))}
          {passed.length + failed.length === 0 && (
            <p className="text-sm text-text-muted italic">No bills in the archive yet.</p>
          )}
        </div>
      )}

      {draftTarget && (
        <DraftLegislationScreen
          baseTemplate={draftTarget}
          onSubmitted={() => {
            setDraftTarget(null);
            setTab('pending');
          }}
          onClose={() => setDraftTarget(null)}
        />
      )}
    </div>
  );
}

/**
 * Visual card for an in-flight bill. Split out from the main component so
 * each card can memoise its progress math without re-rendering neighbours.
 */
function PendingBillCard({
  bill,
  today,
  pc,
  onExpedite,
  onVote,
}: {
  bill: Bill;
  today: number;
  pc: number;
  onExpedite: () => void;
  onVote: () => void;
}): JSX.Element {
  const clocked = (['committee', 'floor_debate', 'vote'] as const).includes(
    bill.stage as 'committee' | 'floor_debate' | 'vote',
  );

  // Derive progress numbers. Legacy saves without timers render with a
  // 0% bar; LegislationSystem.dailyUpdate will seed the timer on the next
  // tick and progress will appear.
  const totalDays =
    bill.stageEnteredOnDay !== undefined && bill.stageEndsOnDay !== undefined
      ? Math.max(1, bill.stageEndsOnDay - bill.stageEnteredOnDay)
      : 0;
  const elapsed =
    bill.stageEnteredOnDay !== undefined
      ? Math.max(0, Math.min(totalDays, today - bill.stageEnteredOnDay))
      : 0;
  const remaining =
    bill.stageEndsOnDay !== undefined ? Math.max(0, bill.stageEndsOnDay - today) : 0;

  const forecast = LegislationSystem.estimatePassageChance(bill);
  const stageKey = bill.stage as keyof typeof EXPEDITE_PC_COST;
  const pcCost = clocked ? EXPEDITE_PC_COST[stageKey] : 0;
  const canExpedite = clocked && pc >= pcCost;

  return (
    <Card title={bill.title} subtitle={stageLabel(bill.stage)} accent="gold">
      <p className="text-sm text-text-secondary mb-3"><TermText text={bill.description} /></p>

      {clocked && totalDays > 0 && (
        <div className="mb-3">
            <Bar
              value={elapsed}
              max={totalDays}
              tone="gold"
              label={`${stageLabel(bill.stage)} \u00b7 ${
                remaining === 0 ? 'ready to advance' : `day ${elapsed} of ${totalDays}`
              }`}
              valueLabel={remaining === 0 ? 'ready' : `${remaining} days left`}
            />
        </div>
      )}

      <div className="flex items-center gap-3 text-xs text-text-muted mb-3 flex-wrap">
        <span className={`px-2 py-0.5 rounded font-mono ${chanceToneClass(forecast)}`}>
          Forecast: {Math.round(forecast * 100)}%
        </span>
        {bill.type && bill.type !== 'act' && (
          <span className="px-2 py-0.5 rounded font-mono bg-bg-tertiary text-text-secondary">
            {billTypeLabel(bill.type)}
          </span>
        )}
        <span>Opposition: {bill.opposition}</span>
        <span>PC invested: {bill.pcInvested}</span>
      </div>

      <div className="flex gap-2 flex-wrap">
        {bill.stage === 'vote' ? (
          <Button size="sm" variant="primary" onClick={onVote}>
            Call the vote now
          </Button>
        ) : (
          <Button
            size="sm"
            variant="primary"
            onClick={onExpedite}
            disabled={!canExpedite}
            title={
              canExpedite
                ? `Skip the remaining ${remaining} days by spending ${pcCost} PC.`
                : `Needs ${pcCost} PC to expedite.`
            }
          >
            Expedite ({pcCost} PC)
          </Button>
        )}
      </div>
    </Card>
  );
}

/**
 * Maps passage probability to a tone class. Neutral grey in the uncertain
 * band (30&ndash;70%), success green for a likely pass, danger red for a
 * likely failure.
 */
function chanceToneClass(chance: number): string {
  if (chance >= 0.7) return 'bg-status-success/20 text-status-success';
  if (chance <= 0.3) return 'bg-status-danger/20 text-status-danger';
  return 'bg-bg-tertiary text-text-secondary';
}

function stageLabel(stage: BillStage): string {
  switch (stage) {
    case 'committee':
      return 'Committee';
    case 'floor_debate':
      return 'Floor Debate';
    case 'vote':
      return 'Scheduled Vote';
    case 'draft':
      return 'Drafting';
    case 'signed':
      return 'Signed';
    case 'vetoed':
      return 'Vetoed';
    case 'implementing':
      return 'Implementing';
    case 'enacted':
      return 'Enacted';
    case 'failed':
      return 'Failed';
    default:
      return stage;
  }
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded text-sm font-headline ${
        active
          ? 'bg-accent-gold text-bg-primary'
          : 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary'
      }`}
    >
      {children}
    </button>
  );
}
