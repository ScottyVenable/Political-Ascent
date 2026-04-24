import type { GameDate, GameSpeed, Bounded, ScenarioId } from './common';
import type { Legislator } from './congress';
import type { Bill } from './legislation';
import type { ActiveEvent } from './event';
import type { QuestInstance } from './quest';

/** Macro economic metrics tracked for the whole nation. */
export interface EconomicState {
  gdpGrowth: number;     // annual %
  unemployment: number;  // %
  inflation: number;     // %
  debt: number;          // $B
  deficit: number;       // $B/year (negative = surplus)
  gini: number;          // 0–1
  trade: number;         // $B trade balance
  /** Recent snapshots for dashboards; appended weekly. */
  history: Array<{ date: GameDate; metrics: Omit<EconomicState, 'history'> }>;
}

/** A demographic segment of the nation. */
export interface PopulationGroup {
  id: string;
  name: string;
  /** Share of total population, 0–100. */
  size: number;
  happiness: number;   // 0–100
  radicalism: number;  // 0–100
  income: number;      // arbitrary index
  loyalty: number;     // −100 to +100 (alignment to player)
  activism: number;    // 0–100
  ideologyBias: number; // -1..1 on economic axis
  tags: string[];
}

/** A single headline shown in the news ticker. */
export interface NewsItem {
  id: string;
  date: GameDate;
  headline: string;
  body?: string;
  severity: 'info' | 'warning' | 'danger';
  relatedEntity?: { type: 'bill' | 'event' | 'npc' | 'group'; id: string };
}

/** Top-level game state (time, resources, session flags). */
export interface GameState {
  gameId: string;
  scenarioId: ScenarioId;
  startDate: GameDate;
  currentDate: GameDate;
  speed: GameSpeed;
  isPaused: boolean;
  actionPoints: Bounded;
  politicalCapital: number;
  week: number;
  month: number;
  year: number;
  isGameOver: boolean;
  gameOverReason?: string;
}

/** The live simulated world. */
export interface WorldState {
  scenarioId: ScenarioId;
  economy: EconomicState;
  population: PopulationGroup[];
  congress: { senate: Legislator[]; house: Legislator[] };
  relationships: Record<string, number>;
  leverage: Record<string, number>;
  activeEvents: ActiveEvent[];
  activeQuests: QuestInstance[];
  pendingLegislation: Bill[];
  passedLegislation: Bill[];
  failedLegislation: Bill[];
  unlockedAchievements: string[];
  news: NewsItem[];
  flags: Record<string, boolean>;
  /** Deterministic seed for all RNG calls. */
  seed: number;
}
