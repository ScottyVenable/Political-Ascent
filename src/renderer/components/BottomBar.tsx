import { memo, useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { TimeEngine } from '@/engine/TimeEngine';
import { Icon, type IconName } from './Icon';
import { Button } from './Button';
import { SaveLoadModal, type SaveLoadMode } from './SaveLoadModal';
import { useRouter } from '../router';
import type { GameSpeed } from '@/types';

/**
 * BottomBar — command strip at the foot of the game shell.
 *
 * Layout (UI_GAME_FEEL_PROPOSAL §7.3):
 *
 *   [LEFT]   Four square speed buttons: pause · 1× · 2× · 4×
 *   [CENTER] "WEEK N OF 52" large; "<Month> <Year>" below (ambient context)
 *   [RIGHT]  Reserved for hand-peek in a follow-up PR (see
 *            UI_GAME_FEEL_PROPOSAL §8.7 "Cards as physical objects").
 *
 * The speed controls live here, not on the TopBar, for two reasons:
 *   1. They are command-like (RTS-style bottom-bar) rather than
 *      identity-like.
 *   2. Keeping the TopBar at 48px means the date/identity can be smaller
 *      and quieter; speed buttons want visual weight and we give it to
 *      them here.
 */

interface SpeedOption {
  value: GameSpeed;
  icon: IconName;
  label: string;
}

/**
 * Speed values supported by the engine.
 *
 * Note: `TimeEngine.setSpeed(0)` delegates to `.stop()` — pausing and
 * running-at-speed go through the same entry point.
 */
const SPEEDS: readonly SpeedOption[] = [
  { value: 0, icon: 'pause', label: 'Pause' },
  { value: 1, icon: 'play', label: 'Normal speed' },
  { value: 2, icon: 'fast-forward', label: 'Fast' },
  { value: 4, icon: 'blazing', label: 'Very fast' },
];

// Helper — number of days from Jan-1 for the current simulated year.
// Week index is `ceil(dayOfYear / 7)` clamped to [1, 52]. 52-week years
// are a small simplification (real calendar has 52–53) but the display
// value is an atmospheric readout, not a mechanical one.
const DAYS_BEFORE_MONTH = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334] as const;
function weekOfYear(date: { year: number; month: number; day: number }): number {
  // Leap year correction is ignored on purpose — the week number is an
  // approximation shown to the player, not a simulation input.
  const monthIdx = Math.max(0, Math.min(11, date.month - 1));
  const doy = DAYS_BEFORE_MONTH[monthIdx] + date.day;
  return Math.max(1, Math.min(52, Math.ceil(doy / 7)));
}

const MONTH_FULL = [
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
] as const;

function BottomBarImpl(): JSX.Element {
  const date = useGameStore((s) => s.currentDate);
  const speed = useGameStore((s) => s.speed);
  const isPaused = useGameStore((s) => s.isPaused);
  const navigate = useRouter((s) => s.navigate);

  // Save/load modal mode. `null` while closed; opening pauses the
  // simulation so the player isn't fighting the clock while choosing
  // a slot. The previous speed is restored when the modal closes.
  const [saveLoad, setSaveLoad] = useState<SaveLoadMode | null>(null);
  const openSaveLoad = (mode: SaveLoadMode): void => {
    TimeEngine.setSpeed(0);
    setSaveLoad(mode);
  };

  const monthName = MONTH_FULL[Math.max(0, Math.min(11, date.month - 1))];
  const week = weekOfYear(date);
  // Year-progress percentage drives the slim bar under the WEEK
  // readout so the player can see at a glance how far through the
  // simulated calendar year they are. Atmospheric, not mechanical.
  const yearPct = Math.round((week / 52) * 100);

  return (
    <footer
      className="h-[88px] sm:h-[92px] bg-bg-secondary border-t border-rule px-2 sm:px-5 grid items-center gap-1"
      style={{
        gridTemplateColumns: '1fr auto 1fr',
        // Honour the device safe-area on phones with a bottom gesture
        // bar (iPhone notch class, Pixel home indicator, etc.) without
        // double-padding when the wrapper Game shell already adds it —
        // we only inflate the height when the env() value is non-zero.
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
      data-testid="bottombar"
    >
      {/* ─── LEFT: Speed controls ─────────────────────────────── */}
      <div
        className="flex items-center gap-1 sm:gap-1.5"
        role="radiogroup"
        aria-label="Game speed"
        data-testid="bottombar-speed"
      >
        {SPEEDS.map((s, idx) => {
          // "Active" = the engine is currently running at this speed.
          // Pause is active both when explicitly paused and when speed
          // is zero (those are the same state today, but the guard is
          // defensive against a future decoupling).
          const isActive =
            s.value === 0 ? isPaused || speed === 0 : !isPaused && speed === s.value;
          // Keyboard shortcut hint: pause on Space, speeds 1/2/4 on
          // their numeric keys. Rendered as a tiny chip under each
          // button on tablet+ where there's room.
          const hotkey = s.value === 0 ? 'Space' : String(s.value);
          return (
            <button
              key={s.value}
              type="button"
              role="radio"
              aria-checked={isActive}
              aria-label={`${s.label} (${hotkey})`}
              onClick={() => TimeEngine.setSpeed(s.value)}
              data-testid={`bottombar-speed-${s.value}`}
              data-active={isActive}
              className={
                // Slightly smaller hit-target on phones so all four
                // speeds fit alongside the centre week readout without
                // pushing it off-axis. The grouping (rounded-l on the
                // first, rounded-r on the last, square middle) reads
                // as a segmented control.
                'relative w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center ' +
                'transition-all duration-instant active:translate-y-px ' +
                (idx === 0 ? 'rounded-l-sm ' : '') +
                (idx === SPEEDS.length - 1 ? 'rounded-r-sm ' : '') +
                (isActive
                  ? 'bg-accent-gold text-bg-primary shadow-glow-gold z-10'
                  : 'bg-bg-tertiary/60 text-text-secondary border border-rule ' +
                    '-ml-px hover:text-text-primary hover:border-accent-gold')
              }
            >
              <Icon name={s.icon} size={16} />
              <span
                aria-hidden
                className="hidden sm:block absolute -bottom-4 left-1/2 -translate-x-1/2 font-mono text-[0.5625rem] uppercase tracking-widest text-text-muted whitespace-nowrap"
              >
                {hotkey}
              </span>
            </button>
          );
        })}
      </div>

      {/* ─── CENTER: Week readout ─────────────────────────────── */}
      <div className="flex flex-col items-center leading-none min-w-0" data-testid="bottombar-week">
        <span className="font-mono text-base sm:text-data-lg text-text-primary tabular-nums">
          WEEK {week}
        </span>
        {/* Long form on tablet+, abbreviated month on phones so the
            line doesn't wrap into the speed buttons. */}
        <span className="hidden sm:inline font-mono text-label uppercase tracking-widest text-text-muted mt-1">
          of 52 &middot; {monthName} {date.year}
        </span>
        <span className="sm:hidden font-mono text-[0.625rem] uppercase tracking-widest text-text-muted mt-1">
          of 52 &middot; {monthName.slice(0, 3)} {date.year}
        </span>
        {/* Slim year-progress bar. 1px tall on phones, 2px on tablet+,
            tinted gold so it visually matches the active speed pip. */}
        <div
          className="mt-1.5 h-px sm:h-0.5 w-24 sm:w-32 bg-bg-tertiary/80 rounded-sm overflow-hidden"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={52}
          aria-valuenow={week}
          aria-label="Progress through the simulated year"
          data-testid="bottombar-year-progress"
        >
          <div
            className="h-full bg-accent-gold transition-all duration-base"
            style={{ width: `${yearPct}%` }}
          />
        </div>
      </div>

      {/* ─── RIGHT: Game-management buttons ─────────────
          Save / Load / Main Menu. Kept compact so the speed
          buttons retain visual primacy on the bottom bar; on phones
          we collapse the labels to icons via `sm:inline`. Closes
          docs/todo.md item 36 (and previews item 38 by giving the
          player a way out of the run). */}
      <div className="flex items-center justify-end gap-1 sm:gap-2">
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
        {/* Vertical divider before the destructive-ish "back to menu"
            action so the player doesn't fat-finger it after Save. */}
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

      {saveLoad && (
        <SaveLoadModal
          mode={saveLoad}
          onClose={() => setSaveLoad(null)}
        />
      )}
    </footer>
  );
}

export const BottomBar = memo(BottomBarImpl);
