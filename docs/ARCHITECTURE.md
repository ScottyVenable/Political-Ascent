# POLITICAL ASCENT — Technical Architecture
**Version:** 0.1-DRAFT | **Stack:** React + Electron + Vite

---

## 1. TECH STACK

| Layer | Technology | Reason |
|-------|-----------|--------|
| **Desktop Shell** | Electron v30+ | Cross-platform desktop app |
| **Frontend** | React 18 + TypeScript | Component model fits UI-heavy game |
| **Build Tool** | Vite | Fast HMR in dev, clean production builds |
| **State Management** | Zustand | Lightweight, no boilerplate, game-state friendly |
| **Routing** | React Router v6 | Screen navigation (Menus → Game → Panels) |
| **Charts/Data Vis** | Recharts | Economy + population dashboards |
| **Styling** | Tailwind CSS + CSS Modules | Utility classes + scoped component styles |
| **Persistence** | electron-store | JSON-based save files, settings |
| **Testing** | Vitest + React Testing Library | Unit tests for game systems |
| **Linting** | ESLint + Prettier | Code quality |

---

## 2. FOLDER STRUCTURE

```
Game/                                   ← Root (git repo lives here)
│
├── .github/
│   ├── COPILOT_INSTRUCTIONS.md         ← GitHub Copilot master prompt
│   └── workflows/                      ← CI/CD pipelines
│
├── docs/
│   ├── GDD.md                          ← Game Design Document
│   ├── ARCHITECTURE.md                 ← This file
│   ├── ROADMAP.md                      ← Development roadmap
│   ├── guides/
│   │   ├── CONTRIBUTING.md
│   │   ├── MODDING.md
│   │   └── SAVE_FORMAT.md
│   └── about/
│       ├── VISION.md
│       └── CHANGELOG.md
│
├── src/                                ← All application source code
│   │
│   ├── main/                           ← Electron main process
│   │   ├── main.ts                     ← App entry, window creation
│   │   ├── ipc/                        ← IPC handlers (main ↔ renderer)
│   │   │   ├── saveHandlers.ts
│   │   │   ├── settingsHandlers.ts
│   │   │   └── index.ts
│   │   └── store/                      ← electron-store configs
│   │       └── persistedStore.ts
│   │
│   ├── renderer/                       ← React app (renderer process)
│   │   │
│   │   ├── index.tsx                   ← React root
│   │   ├── App.tsx                     ← Router + global providers
│   │   │
│   │   ├── screens/                    ← Top-level page screens
│   │   │   ├── MainMenu/
│   │   │   ├── CharacterCreation/
│   │   │   ├── ScenarioSelect/
│   │   │   ├── Game/                   ← Main game screen (hosts panels)
│   │   │   ├── Settings/
│   │   │   └── Achievements/
│   │   │
│   │   ├── panels/                     ← Major game sub-panels
│   │   │   ├── Dashboard/              ← Home overview
│   │   │   ├── LegislationHub/
│   │   │   ├── CongressChamber/
│   │   │   ├── PopulationPanel/
│   │   │   ├── EconomyDashboard/
│   │   │   ├── QuestLog/
│   │   │   ├── CardDeck/
│   │   │   ├── SkillTree/
│   │   │   ├── PressRoom/
│   │   │   └── CharacterSheet/
│   │   │
│   │   ├── components/                 ← Reusable UI components
│   │   │   ├── layout/
│   │   │   │   ├── TopBar.tsx
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── BottomBar.tsx
│   │   │   │   └── ContextPanel.tsx
│   │   │   ├── ui/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Card.tsx
│   │   │   │   ├── Modal.tsx
│   │   │   │   ├── Tooltip.tsx
│   │   │   │   ├── Badge.tsx
│   │   │   │   ├── ProgressBar.tsx
│   │   │   │   ├── StatDisplay.tsx
│   │   │   │   └── Chart.tsx
│   │   │   ├── game/
│   │   │   │   ├── EventModal.tsx
│   │   │   │   ├── DialogueTree.tsx
│   │   │   │   ├── VoteSequence.tsx
│   │   │   │   ├── SeatGrid.tsx          ← Congress seat view
│   │   │   │   ├── CardHand.tsx
│   │   │   │   ├── TimeControls.tsx
│   │   │   │   └── NewsHeadline.tsx
│   │   │   └── character/
│   │   │       ├── StatBlock.tsx
│   │   │       ├── TraitBadge.tsx
│   │   │       ├── IdeologyCompass.tsx
│   │   │       └── PortraitPlaceholder.tsx
│   │   │
│   │   └── hooks/                      ← React hooks
│   │       ├── useGameState.ts
│   │       ├── useTime.ts
│   │       ├── useEvents.ts
│   │       ├── useAP.ts
│   │       └── useAchievements.ts
│   │
│   ├── engine/                         ← Core game engine (pure logic, no React)
│   │   ├── GameEngine.ts               ← Master orchestrator
│   │   ├── TimeEngine.ts               ← Tick system, speed control
│   │   ├── EventEngine.ts              ← Event triggering, resolution
│   │   ├── ActionEngine.ts             ← AP costs, action validation
│   │   └── AchievementEngine.ts        ← Achievement tracking + unlocks
│   │
│   ├── systems/                        ← Individual simulation systems
│   │   ├── CharacterSystem.ts          ← Stats, traits, leveling
│   │   ├── LegislationSystem.ts        ← Bill lifecycle, voting logic
│   │   ├── CongressSystem.ts           ← NPC legislators, relationships
│   │   ├── PopulationSystem.ts         ← Group simulation, behavior
│   │   ├── EconomySystem.ts            ← Economic metrics, policy effects
│   │   ├── CardSystem.ts               ← Card draw, play, effects
│   │   ├── QuestSystem.ts              ← Quest tracking, objectives
│   │   ├── InfluenceSystem.ts          ← Political capital, relationships
│   │   ├── SkillSystem.ts              ← Skill tree, XP, upgrades
│   │   └── DialogueSystem.ts           ← Dialogue tree traversal
│   │
│   ├── store/                          ← Zustand state stores
│   │   ├── gameStore.ts                ← Master game state
│   │   ├── characterStore.ts           ← Player character state
│   │   ├── worldStore.ts               ← World/scenario state
│   │   ├── uiStore.ts                  ← UI state (active panel, modals)
│   │   └── settingsStore.ts            ← Player settings
│   │
│   ├── data/                           ← Static game data (loaded, not modified)
│   │   ├── scenarios/
│   │   │   └── modern-america-2024/
│   │   │       ├── scenario.json       ← Scenario definition
│   │   │       ├── legislators.json    ← Starting Congress makeup
│   │   │       ├── population.json     ← Starting population state
│   │   │       └── economy.json        ← Starting economic conditions
│   │   ├── cards/
│   │   │   └── starter-deck.json
│   │   ├── traits/
│   │   │   └── traits.json
│   │   ├── events/
│   │   │   ├── global-events.json
│   │   │   └── modern-america-events.json
│   │   ├── quests/
│   │   │   └── starter-quests.json
│   │   ├── legislation/
│   │   │   └── bill-templates.json
│   │   └── achievements/
│   │       └── achievements.json
│   │
│   └── utils/                          ← Utility functions
│       ├── random.ts                   ← Seeded RNG
│       ├── math.ts                     ← Clamp, lerp, stat calculations
│       ├── format.ts                   ← Number formatting, date formatting
│       ├── dialogue.ts                 ← Dialogue tree traversal helpers
│       └── logger.ts                   ← Dev logging utility
│
├── data/                               ← Runtime/user data (not in src)
│   └── media/
│       ├── pictures/
│       ├── videos/
│       ├── icons/
│       └── fonts/
│
├── mods/                               ← User/community mods
│   └── README.md
│
├── profiles/
│   └── saves/                          ← Save files (managed by electron-store)
│
├── bin/                                ← Build outputs
│
├── package.json
├── vite.config.ts
├── electron-builder.config.ts
├── tsconfig.json
├── tailwind.config.ts
└── README.md
```

---

## 3. STATE ARCHITECTURE

### 3.1 State Layers

```
┌─────────────────────────────────────────────┐
│              PERSISTED STATE                 │
│  (electron-store → profiles/saves/)          │
│  - Full game save snapshots                  │
│  - Settings                                  │
│  - Achievements (cross-save)                 │
└───────────────────┬─────────────────────────┘
                    │ load/save via IPC
┌───────────────────▼─────────────────────────┐
│             ZUSTAND STORES                   │
│  (in-memory, reactive, accessed by React)    │
│                                              │
│  gameStore      → time, AP, PC, turn state  │
│  characterStore → player stats, traits       │
│  worldStore     → scenario, pop, economy     │
│  uiStore        → panel state, modals        │
│  settingsStore  → preferences                │
└───────────────────┬─────────────────────────┘
                    │ read/write
┌───────────────────▼─────────────────────────┐
│             ENGINE / SYSTEMS                 │
│  (pure TypeScript, no React dependencies)    │
│                                              │
│  GameEngine orchestrates all systems         │
│  Each system is independently testable       │
└─────────────────────────────────────────────┘
```

### 3.2 Game State Shape (simplified)

```typescript
// gameStore.ts
interface GameState {
  // Meta
  gameId: string;
  scenarioId: string;
  startDate: GameDate;
  currentDate: GameDate;
  speed: 0 | 1 | 2 | 4;       // 0 = paused
  isPaused: boolean;

  // Resources
  actionPoints: { current: number; max: number; };
  politicalCapital: number;
  
  // Trackers
  week: number;
  month: number;
  year: number;
  
  // Flags
  isGameOver: boolean;
  gameOverReason?: string;
}

// characterStore.ts
interface CharacterState {
  id: string;
  name: string;
  background: 'citizen' | 'veteran' | 'executive';
  stats: {
    charisma: number;       // 1-10
    strategy: number;
    connections: number;
    integrity: number;
    wealth: number;
    stamina: number;
  };
  traits: string[];         // trait IDs
  ideology: { x: number; y: number; }; // -1 to 1 each axis
  xp: number;
  level: number;
  skillPoints: number;
  unlockedSkills: string[];
  hand: CardInstance[];     // current card hand
  deck: CardInstance[];     // full collection
}

// worldStore.ts
interface WorldState {
  scenario: ScenarioDefinition;
  date: GameDate;
  economy: EconomicState;
  population: PopulationGroup[];
  congress: {
    senate: Legislator[];
    house: Legislator[];
  };
  relationships: Record<string, number>;  // npcId → score
  leverage: Record<string, number>;
  activeEvents: GameEvent[];
  activeQuests: Quest[];
  pendingLegislation: Bill[];
  passedLegislation: Bill[];
  achievements: string[];
  news: NewsItem[];
}
```

---

## 4. ENGINE DESIGN

### 4.1 Game Loop

```typescript
// TimeEngine.ts — simplified
class TimeEngine {
  private speed: number = 1;
  private tickInterval: number = 3000; // ms per game day at 1x

  tick(): void {
    // Advance one day
    this.advanceDate();

    // Run daily systems
    EventEngine.checkDailyTriggers();
    ActionEngine.regenerateAP();
    
    // Weekly systems (every 7 ticks)
    if (this.isWeekEnd()) {
      PopulationSystem.weeklyUpdate();
      EconomySystem.weeklyUpdate();
      CongressSystem.weeklyUpdate();
      QuestSystem.checkObjectives();
      AchievementEngine.check();
    }

    // Monthly systems
    if (this.isMonthEnd()) {
      EconomySystem.monthlyReport();
      PollSystem.publishPolls();
      FactionSystem.loyaltyCheck();
    }
    
    // Annual systems
    if (this.isYearEnd()) {
      EconomySystem.annualReport();
      LegislationSystem.budgetReconciliation();
    }
  }
}
```

### 4.2 Event Engine

```typescript
// EventEngine.ts
interface GameEvent {
  id: string;
  type: 'crisis' | 'opportunity' | 'population' | 'political' | 'personal' | 'scheduled';
  triggerConditions: TriggerCondition[];
  title: string;
  description: string;
  options: EventOption[];
  isRepeatable: boolean;
  weight: number;             // probability weight for random events
}

interface EventOption {
  id: string;
  label: string;
  description: string;
  costs: { ap?: number; pc?: number; cards?: string[]; };
  requirements: Requirement[];  // stat checks, trait checks, etc.
  outcomes: WeightedOutcome[];
}

interface WeightedOutcome {
  weight: number;
  effects: Effect[];
  nextEvent?: string;           // chains to another event ID
  flavor: string;
}
```

### 4.3 Dialogue System

```typescript
// DialogueSystem.ts
interface DialogueTree {
  id: string;
  npcId: string;
  rootNodeId: string;
  nodes: Record<string, DialogueNode>;
}

interface DialogueNode {
  id: string;
  speaker: 'player' | 'npc' | 'narrator';
  text: string;
  options?: DialogueOption[];
  autoAdvance?: string;         // auto-proceed to this node ID
}

interface DialogueOption {
  id: string;
  label: string;
  requirements?: Requirement[];
  costs?: { ap?: number; pc?: number; };
  effects?: Effect[];
  nextNodeId: string;
  isHidden?: boolean;           // only shows if requirement met
}
```

---

## 5. DATA FORMAT STANDARDS

### 5.1 Scenario JSON

```json
{
  "id": "modern-america-2024",
  "title": "Modern America — Senator (2024)",
  "description": "...",
  "startDate": { "year": 2025, "month": 1, "day": 6 },
  "playerPosition": "senator",
  "playerState": "swing-state",
  "partyConfig": { "playerParty": "configurable" },
  "startingConditions": {
    "politicalCapital": 50,
    "relationships": {},
    "economyOverride": null
  },
  "availableEvents": ["global-events", "modern-america-events"],
  "victoryConditions": [
    { "id": "pass-signature-bill", "description": "Pass a signature piece of legislation" }
  ]
}
```

### 5.2 Event JSON

```json
{
  "id": "healthcare-crisis-01",
  "type": "crisis",
  "title": "Hospital System Under Strain",
  "description": "A major hospital network in your state has announced it may close three facilities due to funding shortfalls...",
  "triggerConditions": [
    { "type": "stat", "stat": "healthcare_index", "operator": "lt", "value": 40 }
  ],
  "weight": 3,
  "options": [
    {
      "id": "emergency-funding",
      "label": "Push emergency funding legislation",
      "costs": { "ap": 2, "pc": 20 },
      "requirements": [],
      "outcomes": [
        {
          "weight": 70,
          "effects": [
            { "type": "stat", "target": "healthcare_index", "value": 5 },
            { "type": "group_happiness", "group": "workers", "value": 8 }
          ],
          "flavor": "The funding bill passes committee quickly..."
        }
      ]
    }
  ]
}
```

### 5.3 Card JSON

```json
{
  "id": "rally-the-base",
  "name": "Rally the Base",
  "type": "boost",
  "rarity": "common",
  "description": "Energize your voter base before a key vote.",
  "flavorText": "\"We didn't come this far to come this far.\"",
  "cost": 0,
  "effects": [
    { "type": "group_loyalty", "group": "base", "value": 15, "duration": 14 },
    { "type": "stat", "target": "charisma", "value": 1, "duration": 7 }
  ],
  "tags": ["populist", "election"]
}
```

---

## 6. IPC COMMUNICATION (Electron)

```typescript
// Main process handles:
// - File system (saves, mods, settings)
// - Window management
// - Native OS features (notifications, tray)

// Renderer communicates via:
ipcRenderer.invoke('save:write', saveData);
ipcRenderer.invoke('save:read', saveId);
ipcRenderer.invoke('settings:get');
ipcRenderer.invoke('settings:set', settings);
ipcRenderer.invoke('mods:list');
ipcRenderer.invoke('mods:load', modId);
```

---

## 7. MODDING API

All game data is in `/Game/data/` as JSON. Mods placed in `/Game/mods/modName/` can:

- **Add** new events, cards, traits, legislators, scenarios
- **Override** existing data by matching IDs
- **Extend** population groups and faction definitions
- **Replace** UI strings (localization support built in)

Mod structure:
```
mods/
└── my-mod/
    ├── mod.json          ← Mod manifest (name, version, author, deps)
    ├── events/
    ├── cards/
    ├── scenarios/
    └── README.md
```

---

## 8. PERFORMANCE GUIDELINES

- Population simulation runs on a **Web Worker** (off main thread)
- Economy calculations batched weekly, not per-tick
- React components use `React.memo` for seat grid rows
- Event list uses virtualized rendering (react-window) if >100 items
- Save files compressed with LZ-string before write
- Target: <100ms UI response, <16ms render frame

---

## 9. GIT WORKFLOW

### Branch Strategy

```
release/            ← Public releases only (tagged: v1.0.0)
  └── development/  ← Integration branch for tested features
        └── experimental/  ← Bleeding edge, may be broken
              └── exp--0.1--core-engine
              └── exp--0.1--character-system
              └── exp--0.1--legislation-ui
              └── exp--0.1--population-sim
              └── exp--0.1--congress-chamber
              └── exp--0.1--time-system
              └── exp--0.1--card-system
              └── exp--0.1--quest-system
              └── exp--0.1--economy-dashboard
              └── exp--0.1--skill-tree
              └── exp--0.1--save-system
              └── exp--0.1--settings
```

### Commit Message Format

```
[SYSTEM] Short description

Types: feat, fix, refactor, docs, test, style, chore
Examples:
  feat(legislation): add committee stage to bill lifecycle
  fix(population): radicalism not resetting on policy pass
  docs(gdd): update card system section
  chore(deps): update electron to 30.1.2
```

### Release Tagging

```
v0.1.0-alpha.1    ← First playable alpha
v0.1.0-alpha.2    ← Second alpha
v0.1.0-beta.1     ← Feature-complete for v0.1
v0.1.0            ← Stable release
```

---

## 10. TESTING STRATEGY

```
Unit Tests (Vitest):
├── engine/        ← All engine logic tested in isolation
├── systems/       ← Each system has test coverage for core flows
└── utils/         ← Pure function coverage

Integration Tests:
└── Game loop runs N ticks without throwing

E2E Tests (post-MVP):
└── Playwright: character creation → scenario start → basic actions
```

---

*Architecture maintained by Lead Director.*
*Last updated: v0.1-DRAFT*
