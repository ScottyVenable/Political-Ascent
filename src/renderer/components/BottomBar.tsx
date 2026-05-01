import { memo, useMemo, useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useWorldStore } from '@/store/worldStore';
import { useUIStore } from '@/store/uiStore';
import { useCharacterStore } from '@/store/characterStore';
import { TimeEngine } from '@/engine/TimeEngine';
import { toEpochDays } from '@/utils/date';
import { Icon } from './Icon';
import { Button } from './Button';
import { Slider } from './Slider';
import { SaveLoadModal, type SaveLoadMode } from './SaveLoadModal';
import { useRouter } from '../router';
import type { Bill, BillStage, GameSpeed } from '@/types';

/**
 * BottomBar — compact command strip at the foot of the game shell.
 *
 * Where this fits in the architecture:
 *   - Reads `gameStore` for time/speed, `worldStore` for in-flight bills,
 *     and routes through `uiStore` indirectly via `useRouter`.
 *   - Does not own simulation logic. It only renders a fast, persistent
 *     progress summary so players do not need to keep reopening the full
 *     Legislation panel just to check whether a bill is ready.
 *
 * The 2026 polish pass deliberately keeps the bar at 72px tall: speed is a
 * stylised slider, the week readout is a pill, and the centre is reserved for
 * the most urgent bill timeline. This matches the `Game` shell row height and
 * prevents a document-level scrollbar on 1920×1080 fullscreen displays.
 *
 * @module renderer/components/BottomBar
 */

interface SpeedOption {
  value: GameSpeed;
  label: string;
  shortLabel: string;
}

interface BillProgressSummary {
  bill: Bill;
  stageLabel: string;
  totalDays: number;
  elapsedDays: number;
  remainingDays: number;
  percent: number;
}

/** Speed values supported by the engine, ordered by slider notch. */
const SPEEDS: readonly SpeedOption[] = [
  { value: 0, label: 'Paused', shortLabel: '0x' },
  { value: 1, label: 'Normal speed', shortLabel: '1x' },
  { value: 2, label: 'Fast speed', shortLabel: '2x' },
  { value: 4, label: 'Very fast speed', shortLabel: '4x' },
];

// Helper — number of days from Jan-1 for the current simulated year. Week
// index is `ceil(dayOfYear / 7)` clamped to [1, 52]. 52-week years are a small
// simplification (real calendar has 52–53) but the display value is an
// atmospheric readout, not a mechanical one.
const DAYS_BEFORE_MONTH = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334] as const;
function weekOfYear(date: { year: number; month: number; day: number }): number {
  // Leap year correction is ignored on purpose — the week number is an
  // approximation shown to the player, not a simulation input.
  const monthIdx = Math.max(0, Math.min(11, date.month - 1));
  const doy = DAYS_BEFORE_MONTH[monthIdx] + date.day;
  return Math.max(1, Math.min(52, Math.ceil(doy / 7)));
}

const MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

function BottomBarImpl(): JSX.Element {
  const date = useGameStore((s) => s.currentDate);
  const speed = useGameStore((s) => s.speed);
  const isPaused = useGameStore((s) => s.isPaused);
  const pendingLegislation = useWorldStore((s) => s.pendingLegislation);
  const activeEvents = useWorldStore((s) => s.activeEvents);
  const playerId = useCharacterStore((s) => s.id);
  const setActivePanel = useUIStore((s) => s.setActivePanel);
  const navigate = useRouter((s) => s.navigate);

  // Save/load modal mode. `null` while closed; opening pauses the simulation so
  // the player is not fighting the clock while choosing a slot.
  const [saveLoad, setSaveLoad] = useState<SaveLoadMode | null>(null);
  const openSaveLoad = (mode: SaveLoadMode): void => {
    TimeEngine.setSpeed(0);
    setSaveLoad(mode);
  };

  const monthName = MONTH_SHORT[Math.max(0, Math.min(11, date.month - 1))];
  const week = weekOfYear(date);
  const today = toEpochDays(date);
  const currentSpeed = isPaused ? 0 : speed;
  const speedIndex = Math.max(0, SPEEDS.findIndex((option) => option.value === currentSpeed));
  const speedOption = SPEEDS[speedIndex] ?? SPEEDS[0];
  const activeBill = useMemo(
    () => selectActiveBillProgress(pendingLegislation, today, playerId),
    [pendingLegislation, today, playerId],
  );

  return (
    <footer
      className="pa-bottombar h-[72px] bg-bg-secondary border-t border-rule px-3 sm:px-4 grid items-center gap-3"
      data-testid="bottombar"
    >
      {/* ─── LEFT: Slider speed controls ─────────────────────────── */}
      <div className="pa-bottombar-speed min-w-0" data-testid="bottombar-speed">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="flex items-center gap-1.5 font-mono text-[0.625rem] uppercase tracking-widest text-text-muted">
            <Icon name={speedOption.value === 0 ? 'pause' : 'play'} size={12} aria-hidden />
            Speed
          </span>
          <span className="font-mono text-xs text-accent-gold tabular-nums" data-testid="bottombar-speed-label">
            {speedOption.shortLabel}
          </span>
        </div>
        <Slider
          value={speedIndex}
          min={0}
          max={SPEEDS.length - 1}
          step={1}
          segments={SPEEDS.length}
          ariaLabel="Game speed"
          onChange={(next) => TimeEngine.setSpeed(SPEEDS[Math.round(next)]?.value ?? 0)}
        />
      </div>

      {/* ─── CENTER: Active bill/event timeline ──────────────────── */}
      {activeBill ? (
        <button
          type="button"
          className="pa-bottombar-progress min-w-0 w-full rounded-sm border border-rule bg-bg-tertiary/30 px-3 py-2 text-left hover:border-accent-gold hover:bg-bg-tertiary/55 transition-colors"
          onClick={() => setActivePanel('legislation')}
          data-testid="bottombar-progress"
          aria-label={`Open Legislation. ${activeBill.bill.title} is in ${activeBill.stageLabel}.`}
        >
          <div className="flex items-center justify-between gap-3 mb-1">
            <span className="min-w-0 flex items-center gap-1.5 text-xs text-text-secondary">
              <Icon name="legislation" size={13} aria-hidden />
              <span className="truncate font-semibold text-text-primary">{activeBill.bill.title}</span>
            </span>
            <span className="shrink-0 font-mono text-[0.625rem] uppercase tracking-widest text-accent-gold">
              {activeBill.remainingDays === 0 ? 'Ready' : `${activeBill.remainingDays}d`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="shrink-0 font-mono text-[0.625rem] uppercase tracking-wider text-text-muted">
              {activeBill.stageLabel}
            </span>
            <div
              className="h-1.5 flex-1 rounded-full bg-bg-primary overflow-hidden"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={activeBill.totalDays}
              aria-valuenow={activeBill.elapsedDays}
              aria-label={`${activeBill.stageLabel} progress`}
            >
              <div
                className="h-full rounded-full bg-accent-gold transition-all duration-base"
                style={{ width: `${activeBill.percent}%` }}
              />
            </div>
          </div>
        </button>
      ) : (
        <button
          type="button"
          className="pa-bottombar-progress min-w-0 w-full rounded-sm border border-rule bg-bg-tertiary/20 px-3 py-2 text-left hover:border-accent-gold/60 transition-colors"
          onClick={() => setActivePanel(activeEvents.length > 0 ? 'news' : 'legislation')}
          data-testid="bottombar-progress-empty"
        >
          <div className="flex items-center gap-1.5 text-xs text-text-secondary">
            <Icon name={activeEvents.length > 0 ? 'alert' : 'legislation'} size={13} aria-hidden />
            <span className="truncate">
              {activeEvents.length > 0
                ? `${activeEvents.length} event${activeEvents.length === 1 ? '' : 's'} awaiting decision`
                : 'No active bill timeline'}
            </span>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-bg-primary overflow-hidden">
            <div className="h-full w-0 bg-accent-gold" />
          </div>
        </button>
      )}

      {/* ─── RIGHT: Compact date + game-management buttons ───────── */}
      <div className="pa-bottombar-actions min-w-0 flex items-center justify-end gap-1 sm:gap-2">
        <div className="hidden md:flex flex-col items-end rounded-sm border border-rule bg-bg-tertiary/30 px-2.5 py-1.5 leading-none" data-testid="bottombar-week">
          <span className="font-mono text-xs text-text-primary tabular-nums">W{week}</span>
          <span className="mt-1 font-mono text-[0.5625rem] uppercase tracking-widest text-text-muted">
            {monthName} {date.day}, {date.year}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => openSaveLoad('save')}
          data-testid="bottombar-save"
          aria-label="Save game"
        >
          <span className="hidden sm:inline">Save</span>
          <span className="sm:hidden" aria-hidden>S</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => openSaveLoad('load')}
          data-testid="bottombar-load"
          aria-label="Load game"
        >
          <span className="hidden sm:inline">Load</span>
          <span className="sm:hidden" aria-hidden>L</span>
        </Button>
        <span aria-hidden className="hidden sm:block h-6 w-px bg-rule mx-1" />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            TimeEngine.setSpeed(0);
            navigate('main-menu');
          }}
          data-testid="bottombar-main-menu"
          aria-label="Return to main menu"
        >
          <span className="hidden sm:inline">Menu</span>
          <span className="sm:hidden" aria-hidden>M</span>
        </Button>
      </div>

      {saveLoad && <SaveLoadModal mode={saveLoad} onClose={() => setSaveLoad(null)} />}
    </footer>
  );
}

/**
 * Pick the bill worth surfacing in the persistent timeline strip.
 *
 * Sponsored bills win ties so the player sees their own agenda first. Within
 * each bucket, the closest stage deadline wins because that is the item most
 * likely to demand attention soon.
 */
function selectActiveBillProgress(
  bills: readonly Bill[],
  today: number,
  playerId: string,
): BillProgressSummary | null {
  const summaries = bills.map((bill) => buildBillProgressSummary(bill, today)).filter(isSummary);
  summaries.sort((a, b) => {
    const aSponsored = isPlayerSponsored(a.bill, playerId) ? 0 : 1;
    const bSponsored = isPlayerSponsored(b.bill, playerId) ? 0 : 1;
    if (aSponsored !== bSponsored) return aSponsored - bSponsored;
    return a.remainingDays - b.remainingDays;
  });
  return summaries[0] ?? null;
}

function isPlayerSponsored(bill: Bill, playerId: string): boolean {
  return bill.sponsor === 'player' || (playerId.length > 0 && bill.sponsor === playerId);
}

function isSummary(value: BillProgressSummary | null): value is BillProgressSummary {
  return value !== null;
}

/** Derive clamped progress numbers for a bill's current clocked stage. */
function buildBillProgressSummary(bill: Bill, today: number): BillProgressSummary | null {
  if (!isClockedStage(bill.stage)) return null;
  if (bill.stageEnteredOnDay === undefined || bill.stageEndsOnDay === undefined) return null;

  const totalDays = Math.max(1, bill.stageEndsOnDay - bill.stageEnteredOnDay);
  const rawElapsed = today - bill.stageEnteredOnDay;
  const elapsedDays = Math.max(0, Math.min(totalDays, rawElapsed));
  const remainingDays = Math.max(0, bill.stageEndsOnDay - today);
  const percent = Math.round((elapsedDays / totalDays) * 100);

  return {
    bill,
    stageLabel: stageLabel(bill.stage),
    totalDays,
    elapsedDays,
    remainingDays,
    percent,
  };
}

function isClockedStage(stage: BillStage): stage is 'committee' | 'floor_debate' | 'vote' {
  return stage === 'committee' || stage === 'floor_debate' || stage === 'vote';
}

function stageLabel(stage: BillStage): string {
  switch (stage) {
    case 'committee':
      return 'Committee';
    case 'floor_debate':
      return 'Floor';
    case 'vote':
      return 'Vote';
    default:
      return stage;
  }
}

export const BottomBar = memo(BottomBarImpl);
