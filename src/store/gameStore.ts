import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { GameState, GameSpeed, ScenarioId } from '@/types';
import { addDays } from '@/utils/date';
import { FactionSystem } from '@/systems/FactionSystem';

/**
 * Master game state: time, speed, resources, meta flags.
 *
 * Reads are free; mutations MUST happen through the actions in this store —
 * never by mutating the state object from outside.
 */
interface GameStoreActions {
  setSpeed: (speed: GameSpeed) => void;
  setPaused: (paused: boolean) => void;
  advanceDay: () => void;
  addPoliticalCapital: (delta: number) => void;
  /** Adjust treasury by `delta`. Floors at 0 — we do not model debt yet. */
  addTreasury: (delta: number) => void;
  spendAP: (amount: number) => boolean;
  regenerateAP: (amount: number) => void;
  setMaxAP: (max: number) => void;
  endGame: (reason: string) => void;
  initializeFromScenario: (scenarioId: ScenarioId, startingPC: number, maxAP: number) => void;
  /**
   * Apply a standing delta to one faction, delegating clamping to FactionSystem.
   * Keeps store state in sync with the FactionSystem singleton.
   */
  updateFactionStanding: (factionId: string, delta: number) => void;
  reset: () => void;
}

type Store = GameState & GameStoreActions;

const DEFAULT_STATE: GameState = {
  gameId: '',
  scenarioId: '' as ScenarioId,
  startDate: { year: 2025, month: 1, day: 6 },
  currentDate: { year: 2025, month: 1, day: 6 },
  speed: 0,
  isPaused: true,
  actionPoints: { current: 6, max: 6 },
  politicalCapital: 50,
  treasury: 0,
  week: 1,
  month: 1,
  year: 2025,
  isGameOver: false,
  factionStandings: {},
};

export const useGameStore = create<Store>()(
  immer((set) => ({
    ...DEFAULT_STATE,

    setSpeed: (speed) =>
      set((s) => {
        s.speed = speed;
        s.isPaused = speed === 0;
      }),

    setPaused: (paused) =>
      set((s) => {
        s.isPaused = paused;
        if (paused) s.speed = 0;
        else if (s.speed === 0) s.speed = 1;
      }),

    advanceDay: () =>
      set((s) => {
        // Properly roll day → month → year. TimeEngine normally drives this,
        // but callers that invoke advanceDay directly (tests, step-debug) still
        // need the full rollover instead of an unbounded `day` counter.
        const next = addDays(s.currentDate, 1);
        s.currentDate = next;
        s.month = next.month;
        s.year = next.year;
      }),

    addPoliticalCapital: (delta) =>
      set((s) => {
        s.politicalCapital = Math.max(0, s.politicalCapital + delta);
      }),

    addTreasury: (delta) =>
      set((s) => {
        // Floor at zero — negative balances would need a debt UI we
        // haven't designed yet.
        s.treasury = Math.max(0, s.treasury + delta);
      }),

    spendAP: (amount) => {
      let success = false;
      set((s) => {
        if (s.actionPoints.current >= amount) {
          s.actionPoints.current -= amount;
          success = true;
        }
      });
      return success;
    },

    regenerateAP: (amount) =>
      set((s) => {
        s.actionPoints.current = Math.min(s.actionPoints.max, s.actionPoints.current + amount);
      }),

    setMaxAP: (max) =>
      set((s) => {
        s.actionPoints.max = max;
        s.actionPoints.current = Math.min(s.actionPoints.current, max);
      }),

    endGame: (reason) =>
      set((s) => {
        s.isGameOver = true;
        s.gameOverReason = reason;
        s.speed = 0;
        s.isPaused = true;
      }),

    initializeFromScenario: (scenarioId, startingPC, maxAP) =>
      set((s) => {
        s.scenarioId = scenarioId;
        s.politicalCapital = startingPC;
        // Reset treasury alongside PC so a new scenario doesn't inherit
        // funds from a previously abandoned save in the same session.
        // Scenarios will eventually carry their own starting treasury;
        // until then, every campaign begins broke.
        s.treasury = 0;
        s.actionPoints = { current: maxAP, max: maxAP };
        s.isPaused = true;
        s.speed = 0;
        s.isGameOver = false;
        s.gameOverReason = undefined;
        s.gameId = `game-${Date.now()}`;
      }),

    updateFactionStanding: (factionId, delta) =>
      set((s) => {
        const current = s.factionStandings[factionId] ?? 0;
        FactionSystem.setStanding(factionId, current + delta);
        s.factionStandings[factionId] = FactionSystem.getState().standings[factionId] ?? current;
      }),

    reset: () => set(() => ({ ...DEFAULT_STATE })),
  })),
);
