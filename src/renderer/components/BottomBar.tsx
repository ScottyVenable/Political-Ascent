import { memo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { TimeEngine } from '@/engine/TimeEngine';
import { Icon, type IconName } from './Icon';
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

  const monthName = MONTH_FULL[Math.max(0, Math.min(11, date.month - 1))];
  const week = weekOfYear(date);

  return (
    <footer
      className="h-[72px] bg-bg-secondary border-t border-rule px-3 md:px-5 grid items-center gap-2"
      style={{ gridTemplateColumns: '1fr auto 1fr' }}
    >
      {/* ─── LEFT: Speed controls ─────────────────────────────── */}
      <div className="flex items-center gap-1 md:gap-1.5">
        {SPEEDS.map((s) => {
          // "Active" = the engine is currently running at this speed.
          // Pause is active both when explicitly paused and when speed
          // is zero (those are the same state today, but the guard is
          // defensive against a future decoupling).
          const isActive =
            s.value === 0 ? isPaused || speed === 0 : !isPaused && speed === s.value;
          return (
            <button
              key={s.value}
              type="button"
              aria-label={s.label}
              aria-pressed={isActive}
              onClick={() => TimeEngine.setSpeed(s.value)}
              className={
                // 44×44 on phones (WCAG tap-target), 40×40 on desktop so
                // the row of four still fits the 72px footer comfortably.
                'w-11 h-11 md:w-10 md:h-10 rounded-sm flex items-center justify-center ' +
                'transition-all duration-instant active:translate-y-px ' +
                (isActive
                  ? 'bg-accent-gold text-bg-primary shadow-glow-gold'
                  : 'bg-bg-tertiary/60 text-text-secondary border border-rule ' +
                    'hover:text-text-primary hover:border-accent-gold')
              }
            >
              <Icon name={s.icon} size={16} />
            </button>
          );
        })}
      </div>

      {/* ─── CENTER: Week readout ─────────────────────────────── */}
      <div className="flex flex-col items-center leading-none">
        <span className="font-mono text-data md:text-data-lg text-text-primary tabular-nums">
          WEEK {week}
        </span>
        {/* Verbose "of 52 · Month Year" subtitle trims to just the year
            on narrow viewports — the month is already shown in the
            TopBar (MMM YYYY) so we do not duplicate it on phones. */}
        <span className="font-mono text-label uppercase tracking-widest text-text-muted mt-1">
          <span className="hidden sm:inline">of 52 · {monthName} {date.year}</span>
          <span className="sm:hidden">of 52 · {date.year}</span>
        </span>
      </div>

      {/* ─── RIGHT: Reserved for hand peek ─────────────────────
          A horizontal row of card chips will land here in the
          cards-as-physical-objects follow-up PR. For now this zone is
          intentionally empty so the layout budget is reserved. */}
      <div />
    </footer>
  );
}

export const BottomBar = memo(BottomBarImpl);
