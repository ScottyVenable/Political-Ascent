import type { GameDate, GameSpeed } from '@/types';
import { useGameStore } from '@/store/gameStore';
import { addDays, isMonthStart, isYearStart } from '@/utils/date';
import { createLogger } from '@/utils/logger';

const log = createLogger('TimeEngine');

/**
 * TimeEngine — drives the simulation clock.
 *
 * At 1× one in-game day elapses every `BASE_MS_PER_DAY` wall-clock milliseconds.
 * Higher speeds scale that down. The engine owns the setInterval loop; systems
 * subscribe by registering tick callbacks.
 */
const BASE_MS_PER_DAY = 3000;

export type TickHook = (date: GameDate) => void;

export interface TimeEngineAPI {
  start(): void;
  stop(): void;
  setSpeed(speed: GameSpeed): void;
  onDaily(hook: TickHook): () => void;
  onWeekly(hook: TickHook): () => void;
  onMonthly(hook: TickHook): () => void;
  onYearly(hook: TickHook): () => void;
  /** Advance one tick manually — used by tests and step-debugging. */
  step(): void;
}

class TimeEngineImpl implements TimeEngineAPI {
  private intervalId: number | null = null;
  private dailyHooks = new Set<TickHook>();
  private weeklyHooks = new Set<TickHook>();
  private monthlyHooks = new Set<TickHook>();
  private yearlyHooks = new Set<TickHook>();
  private lastWeekBoundary: number = 0;

  start(): void {
    this.stop();
    const speed = useGameStore.getState().speed;
    if (speed === 0) return;
    const msPerTick = BASE_MS_PER_DAY / speed;
    this.intervalId = setInterval(() => this.step(), msPerTick) as unknown as number;
    log.info('started', { speed, msPerTick });
  }

  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  setSpeed(speed: GameSpeed): void {
    useGameStore.getState().setSpeed(speed);
    if (speed === 0) this.stop();
    else this.start();
  }

  onDaily(hook: TickHook): () => void {
    this.dailyHooks.add(hook);
    return () => this.dailyHooks.delete(hook);
  }
  onWeekly(hook: TickHook): () => void {
    this.weeklyHooks.add(hook);
    return () => this.weeklyHooks.delete(hook);
  }
  onMonthly(hook: TickHook): () => void {
    this.monthlyHooks.add(hook);
    return () => this.monthlyHooks.delete(hook);
  }
  onYearly(hook: TickHook): () => void {
    this.yearlyHooks.add(hook);
    return () => this.yearlyHooks.delete(hook);
  }

  step(): void {
    const game = useGameStore.getState();
    if (game.isPaused || game.isGameOver) return;

    const nextDate = addDays(game.currentDate, 1);
    useGameStore.setState((s) => ({
      ...s,
      currentDate: nextDate,
      month: nextDate.month,
      year: nextDate.year,
    }));

    for (const hook of this.dailyHooks) hook(nextDate);

    // Week boundary: every 7 advance-day calls since engine start.
    this.lastWeekBoundary += 1;
    if (this.lastWeekBoundary >= 7) {
      this.lastWeekBoundary = 0;
      useGameStore.setState((s) => ({ ...s, week: s.week + 1 }));
      for (const hook of this.weeklyHooks) hook(nextDate);
    }

    if (isMonthStart(nextDate)) for (const hook of this.monthlyHooks) hook(nextDate);
    if (isYearStart(nextDate)) for (const hook of this.yearlyHooks) hook(nextDate);
  }
}

export const TimeEngine: TimeEngineAPI = new TimeEngineImpl();
