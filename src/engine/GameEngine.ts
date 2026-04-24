import type {
  ScenarioDefinition,
  CharacterState,
  CardDefinition,
  GameEventDefinition,
  QuestDefinition,
  AchievementDefinition,
  BillTemplate,
  TraitDefinition,
  PopulationGroup,
  EconomicState,
  ScenarioId,
} from '@/types';
import { useGameStore } from '@/store/gameStore';
import { useWorldStore } from '@/store/worldStore';
import { useCharacterStore } from '@/store/characterStore';

import { TimeEngine } from './TimeEngine';
import { EventEngine } from './EventEngine';
import { AchievementEngine } from './AchievementEngine';
import { ActionEngine } from './ActionEngine';

import { CongressSystem } from '@/systems/CongressSystem';
import { CardSystem } from '@/systems/CardSystem';
import { QuestSystem } from '@/systems/QuestSystem';
import { InfluenceSystem } from '@/systems/InfluenceSystem';
import { PopulationSystem } from '@/systems/PopulationSystem';
import { EconomySystem } from '@/systems/EconomySystem';
import { LegislationSystem } from '@/systems/LegislationSystem';

import { hashString, SeededRNG } from '@/utils/random';
import { createLogger } from '@/utils/logger';

const log = createLogger('GameEngine');

export interface DataBundle {
  scenarios: ScenarioDefinition[];
  populationsByScenario: Record<string, PopulationGroup[]>;
  economyByScenario: Record<string, EconomicState>;
  legislatorSeedByScenario: Record<string, { seed: number; split: { D: number; R: number; I?: number } }>;
  cards: CardDefinition[];
  traits: TraitDefinition[];
  events: GameEventDefinition[];
  quests: QuestDefinition[];
  achievements: AchievementDefinition[];
  billTemplates: BillTemplate[];
}

export interface GameEngineAPI {
  /** Register all loaded JSON data with the engine's sub-registries. */
  registerData(bundle: DataBundle): void;
  /** Start a new game: initialize world state and wire TimeEngine hooks. */
  startNewGame(scenarioId: ScenarioId, character: CharacterState): void;
  /** Start the clock at the given speed. */
  startClock(): void;
  /** Pause the clock. */
  pauseClock(): void;
  /** Stop all hooks (used on teardown / back-to-menu). */
  teardown(): void;
  /** Access the loaded bill templates (for the legislation hub). */
  getBillTemplates(): readonly BillTemplate[];
  /** Access the loaded trait definitions. */
  getTraits(): readonly TraitDefinition[];
  /** Access the loaded scenarios. */
  getScenarios(): readonly ScenarioDefinition[];
  /** Find a scenario by id. */
  getScenario(id: ScenarioId): ScenarioDefinition | undefined;
}

class GameEngineImpl implements GameEngineAPI {
  private bundle: DataBundle = {
    scenarios: [],
    populationsByScenario: {},
    economyByScenario: {},
    legislatorSeedByScenario: {},
    cards: [],
    traits: [],
    events: [],
    quests: [],
    achievements: [],
    billTemplates: [],
  };

  private unsubs: Array<() => void> = [];

  registerData(bundle: DataBundle): void {
    this.bundle = bundle;
    CardSystem.register(bundle.cards);
    EventEngine.registerEvents(bundle.events);
    QuestSystem.register(bundle.quests);
    AchievementEngine.registerAchievements(bundle.achievements);
    log.info('data registered', {
      scenarios: bundle.scenarios.length,
      cards: bundle.cards.length,
      events: bundle.events.length,
      quests: bundle.quests.length,
      bills: bundle.billTemplates.length,
      achievements: bundle.achievements.length,
    });
  }

  getBillTemplates(): readonly BillTemplate[] {
    return this.bundle.billTemplates;
  }
  getTraits(): readonly TraitDefinition[] {
    return this.bundle.traits;
  }
  getScenarios(): readonly ScenarioDefinition[] {
    return this.bundle.scenarios;
  }
  getScenario(id: ScenarioId): ScenarioDefinition | undefined {
    return this.bundle.scenarios.find((s) => s.id === id);
  }

  startNewGame(scenarioId: ScenarioId, character: CharacterState): void {
    const scenario = this.getScenario(scenarioId);
    if (!scenario) throw new Error(`Unknown scenarioId: ${scenarioId}`);

    // Seed derived deterministically from scenario id + character name.
    const seed = hashString(`${scenarioId}:${character.name}:${character.background}`);

    // Procedural congress.
    const legSeed = this.bundle.legislatorSeedByScenario[scenarioId] ?? {
      seed,
      split: { D: 47, R: 48, I: 5 },
    };
    const congress = CongressSystem.generate(legSeed.seed, legSeed.split);

    // Relationships for starting allies from scenario.
    const relationships: Record<string, number> = {};
    for (const [npcId, value] of Object.entries(scenario.startingConditions.relationships)) {
      relationships[npcId] = value;
    }

    const population = this.bundle.populationsByScenario[scenarioId] ?? [];
    const economy = this.bundle.economyByScenario[scenarioId] ?? defaultEconomy();

    useWorldStore.getState().reset();
    useWorldStore.getState().initializeWorld({
      scenarioId,
      economy: { ...economy, history: [] },
      population,
      congress,
      relationships,
      leverage: {},
      activeEvents: [],
      activeQuests: [],
      pendingLegislation: [],
      passedLegislation: [],
      failedLegislation: [],
      unlockedAchievements: [],
      news: [],
      flags: {},
      seed,
    });

    // Starting deck: a subset of common starter cards.
    const allCards = this.bundle.cards;
    const rng = new SeededRNG(seed);
    const starterCount = Math.min(8, allCards.length);
    const pool = [...allCards];
    const deck = [];
    for (let i = 0; i < starterCount && pool.length > 0; i++) {
      const idx = rng.int(0, pool.length - 1);
      const def = pool.splice(idx, 1)[0];
      deck.push(CardSystem.instantiate(def.id, rng));
    }

    useCharacterStore.getState().setCharacter({
      ...character,
      deck,
      hand: [],
    });

    useGameStore.getState().initializeFromScenario(
      scenarioId,
      scenario.startingConditions.politicalCapital,
      scenario.startingConditions.actionPointsMax,
    );

    // Wire TimeEngine hooks.
    this.teardown();
    this.unsubs.push(
      TimeEngine.onDaily(() => {
        EventEngine.checkDailyTriggers();
        QuestSystem.dailyUpdate();
      }),
      TimeEngine.onWeekly(() => {
        PopulationSystem.weeklyUpdate();
        EconomySystem.weeklyUpdate();
        CongressSystem.weeklyUpdate();
        InfluenceSystem.weeklyUpdate();
        LegislationSystem.weeklyUpdate();
        ActionEngine.weeklyRegenerate();
        AchievementEngine.check();
        CardSystem.drawToHandSize(5);
      }),
      TimeEngine.onMonthly(() => {
        EconomySystem.monthlyReport();
      }),
      TimeEngine.onYearly(() => {
        EconomySystem.annualReport();
      }),
    );

    // Fill initial hand.
    ActionEngine.recalculateMaxAP();
    CardSystem.drawToHandSize(5);

    log.info('new game started', { scenarioId, character: character.name });
  }

  startClock(): void {
    const game = useGameStore.getState();
    if (game.speed === 0) game.setSpeed(1);
    TimeEngine.start();
  }

  pauseClock(): void {
    useGameStore.getState().setPaused(true);
    TimeEngine.stop();
  }

  teardown(): void {
    TimeEngine.stop();
    for (const unsub of this.unsubs) unsub();
    this.unsubs = [];
  }
}

function defaultEconomy(): EconomicState {
  return {
    gdpGrowth: 2.1,
    unemployment: 4.0,
    inflation: 3.2,
    debt: 34000,
    deficit: 1700,
    gini: 0.41,
    trade: -900,
    history: [],
  };
}

export const GameEngine: GameEngineAPI = new GameEngineImpl();
