import type { GameDate, ScenarioId } from './common';

export type PlayerPosition = 'senator' | 'representative' | 'governor' | 'president';

export interface VictoryCondition {
  id: string;
  description: string;
}

export interface ScenarioDefinition {
  id: ScenarioId;
  title: string;
  description: string;
  startDate: GameDate;
  playerPosition: PlayerPosition;
  playerState: string;
  partyConfig: { playerParty: 'D' | 'R' | 'I' | 'configurable' };
  startingConditions: {
    politicalCapital: number;
    actionPointsMax: number;
    relationships: Record<string, number>;
  };
  availableEvents: string[];
  victoryConditions: VictoryCondition[];
  /** Short text shown on the scenario-select screen. */
  summary: string;
}
