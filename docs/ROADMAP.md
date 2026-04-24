# POLITICAL ASCENT — Development Roadmap
**Lead Director:** [Your Name] | **Engine Version:** 0.1

---

## ROADMAP OVERVIEW

```
v0.1-alpha  ← MVP: Character creation + Modern America scenario + core systems
v0.2-alpha  ← Elections, campaigns, judicial system
v0.3-alpha  ← Historical scenarios (Civil War, Civil Rights)
v0.4-beta   ← Diplomacy, military (basic), creator mode
v0.5-beta   ← Polish, audio, full achievement system, modding toolkit
v1.0        ← Launch candidate
```

---

## v0.1 — MVP (Current Sprint)

### Milestone 0: Project Setup
**Branch:** `exp--0.1--project-setup`

- [ ] Initialize Electron + Vite + React + TypeScript project
- [ ] Configure Tailwind CSS
- [ ] Set up Zustand
- [ ] Set up ESLint + Prettier
- [ ] Set up Vitest
- [ ] Create complete folder structure per Architecture doc
- [ ] Set up electron-builder config (win + mac targets)
- [ ] Create base Git branches (release, development, experimental)
- [ ] Write initial README
- [ ] Set up GitHub repo with branch protections
- [ ] Place COPILOT_INSTRUCTIONS.md in `.github/`

**Done When:** `npm run dev` launches an Electron window with a React app

---

### Milestone 1: Core Types & Architecture
**Branch:** `exp--0.1--core-types`

- [ ] Define all TypeScript interfaces (`GameState`, `Character`, `WorldState`, etc.)
- [ ] Set up all Zustand stores (empty, typed)
- [ ] Create `utils/random.ts` (seeded Mulberry32 RNG)
- [ ] Create `utils/math.ts` (clamp, lerp, stat helpers)
- [ ] Create `utils/format.ts` (date, number, currency formatting)
- [ ] Create `utils/logger.ts` (dev-mode logging wrapper)
- [ ] Create `GameEngine.ts` shell
- [ ] Create all system shells (empty class/object with typed interfaces)
- [ ] Set up JSON data loader with validation
- [ ] Write unit tests for all utils

**Done When:** TypeScript compiles with zero errors, all interfaces are defined

---

### Milestone 2: Main Menu & App Shell
**Branch:** `exp--0.1--app-shell`

- [ ] Main Menu screen (New Game, Load Game, Settings, Quit)
- [ ] Settings screen (Gameplay, Audio, Display, Accessibility)
- [ ] Top bar layout component
- [ ] Sidebar nav component
- [ ] Bottom bar layout component (time controls + card hand area)
- [ ] Context panel component
- [ ] Router setup (menu → character creation → game → settings)
- [ ] Global modal system
- [ ] Toast notification system
- [ ] App icon + window config

**Done When:** Can navigate between menu screens; no game content yet

---

### Milestone 3: Character Creation
**Branch:** `exp--0.1--character-system`

- [ ] Character creation multi-step screen
  - [ ] Step 1: Choose background (Citizen / Veteran / Executive)
  - [ ] Step 2: Name + customization (text input, ideology compass)
  - [ ] Step 3: Stat distribution (point-buy system with background bonuses)
  - [ ] Step 4: Trait selection (choose 2 from pool)
  - [ ] Step 5: Summary + confirm
- [ ] Character presets (5 presets, selectable from step 1)
- [ ] Ideology compass component (2-axis drag)
- [ ] `CharacterSystem.ts` — stat calculations, validation
- [ ] Character sheet panel (view-only during game)
- [ ] Portrait placeholder component

**Done When:** Can create a character and see their sheet

---

### Milestone 4: Scenario & World Loading
**Branch:** `exp--0.1--scenario-system`

- [ ] Scenario select screen (list of scenarios, Modern America initially)
- [ ] `modern-america-2024/scenario.json` — full scenario definition
- [ ] `modern-america-2024/legislators.json` — 100 senators, 435 representatives (procedural seed)
- [ ] `modern-america-2024/population.json` — starting population group states
- [ ] `modern-america-2024/economy.json` — starting economic conditions
- [ ] Scenario loader (reads JSON, seeds world state)
- [ ] Procedural NPC name/stat generator (seeded from scenario ID)
- [ ] World state initialization from scenario

**Done When:** Selecting a scenario loads the world into Zustand

---

### Milestone 5: Time System
**Branch:** `exp--0.1--time-system`

- [ ] `TimeEngine.ts` — tick loop, date advancement
- [ ] Speed controls: Pause / 1× / 2× / 4× / Skip to event
- [ ] Time controls UI component (bottom bar)
- [ ] Auto-pause triggers (configurable in settings)
- [ ] Date display in top bar
- [ ] Weekly/monthly/annual tick hooks
- [ ] Game start sequence (intro briefing on day 1)

**Done When:** Time advances, pauses, and accelerates correctly

---

### Milestone 6: Action Point System
**Branch:** `exp--0.1--action-system`

- [ ] AP tracking in game store
- [ ] AP display in top bar (current / max)
- [ ] AP regeneration (daily/weekly)
- [ ] `ActionEngine.ts` — validates actions, deducts AP
- [ ] Stamina stat integration (higher stamina = more AP per week)
- [ ] "Low AP" auto-pause trigger
- [ ] AP exhaustion state (blocked actions when AP = 0)

**Done When:** Actions cost and regenerate AP correctly

---

### Milestone 7: Main Dashboard
**Branch:** `exp--0.1--dashboard`

- [ ] Dashboard panel (home screen inside game)
- [ ] Approval rating widget (sparkline chart)
- [ ] Political capital display
- [ ] Upcoming events list
- [ ] Active quests preview (top 3)
- [ ] News ticker (recent headlines)
- [ ] Quick-action buttons (Schedule Press Briefing, View Calendar, etc.)
- [ ] Morning briefing modal (shows on each new week)

**Done When:** Dashboard shows live game state meaningfully

---

### Milestone 8: Population System
**Branch:** `exp--0.1--population-sim`

- [ ] `PopulationSystem.ts` — weekly update logic
- [ ] Population groups defined (8–10 groups for MVP)
- [ ] Group stat calculations (happiness, radicalism drift)
- [ ] Policy effect application to groups
- [ ] Population panel UI
  - [ ] Overview tab (aggregate nation stats)
  - [ ] Groups tab (list with drill-down)
  - [ ] Trends tab (historical sparklines)
- [ ] Group detail modal (stats, behavior, current issues)
- [ ] Radicalism event triggers (high radicalism → event)

**Done When:** Population groups update weekly and respond to legislation

---

### Milestone 9: Legislation System
**Branch:** `exp--0.1--legislation-ui`

- [ ] `LegislationSystem.ts` — bill lifecycle logic
- [ ] Bill draft screen (template picker, custom edit)
- [ ] `bill-templates.json` — 20+ bill templates covering major policy areas
- [ ] Committee stage simulation
- [ ] Floor debate simulation
- [ ] Vote resolution (with negotiation panel)
- [ ] Bill signing/veto (if executive branch applies)
- [ ] Implementation phase (delayed effects)
- [ ] Legislation hub panel
  - [ ] Active bills list (with stage indicators)
  - [ ] Drafting workspace
  - [ ] Historical log (passed/failed bills)
- [ ] Bill detail modal

**Done When:** Can draft, push, and vote on a bill through full lifecycle

---

### Milestone 10: Congress Chamber
**Branch:** `exp--0.1--congress-chamber`

- [ ] `CongressSystem.ts` — legislator logic, relationship updates
- [ ] Seat grid component (Senate: 100 seats, House: 435 seats)
- [ ] View mode toggles (Party / Ideology / Happiness / Influence / Vote Prediction)
- [ ] Seat tooltip (hover: quick stats)
- [ ] Legislator profile modal (click: full profile)
- [ ] Vote sequence animation (seats light up, tally counter)
- [ ] Skip vote option (instant resolution)
- [ ] Negotiation panel (for bill votes)
- [ ] Relationship display per legislator

**Done When:** Full Congress chamber is viewable and interactive, votes animate

---

### Milestone 11: Event System
**Branch:** `exp--0.1--event-system`

- [ ] `EventEngine.ts` — trigger evaluation, event selection, resolution
- [ ] `global-events.json` — 15+ generic events
- [ ] `modern-america-events.json` — 10+ scenario-specific events
- [ ] Event modal UI (description, options, costs, risk indicators)
- [ ] Event chain system (events that spawn follow-up events)
- [ ] Event outcome resolution + effect application
- [ ] Event history log (journal of past events)
- [ ] Crisis severity system (Minor / Moderate / Major / Catastrophic)

**Done When:** Events trigger, present choices, and apply outcomes correctly

---

### Milestone 12: Card System
**Branch:** `exp--0.1--card-system`

- [ ] `CardSystem.ts` — draw, play, effect resolution
- [ ] `starter-deck.json` — 15 starter cards across all types
- [ ] Card hand UI (bottom-right drawer, expandable)
- [ ] Card detail tooltip (hover)
- [ ] Card play UI (drag or right-click to play)
- [ ] Card collection viewer (full deck inspector)
- [ ] Card acquisition (from quests, events, party store)
- [ ] Party Store UI (spend PC to acquire cards)
- [ ] Card rarity visual treatment

**Done When:** Cards can be collected, viewed, and played with correct effects

---

### Milestone 13: Quest System
**Branch:** `exp--0.1--quest-system`

- [ ] `QuestSystem.ts` — quest tracking, objective evaluation, rewards
- [ ] `starter-quests.json` — 5 starter quests
- [ ] Quest log panel (active / completed tabs)
- [ ] Quest detail view (objectives, progress, rewards, timer)
- [ ] Quest notification on completion
- [ ] Issue quests (generated from population group events)
- [ ] Quest reward application (cards, PC, traits, XP)

**Done When:** Quests track progress and award rewards on completion

---

### Milestone 14: Economy Dashboard
**Branch:** `exp--0.1--economy-dashboard`

- [ ] `EconomySystem.ts` — weekly/monthly/annual update logic
- [ ] `economy.json` in Modern America scenario
- [ ] Economy dashboard panel (all metrics + charts)
- [ ] Recharts integration for time-series charts
- [ ] Policy impact markers on charts
- [ ] Economic alert system (triggers events when thresholds hit)
- [ ] Budget panel (surplus/deficit, spending categories)

**Done When:** Economic metrics update over time and visualize correctly

---

### Milestone 15: Skill Tree
**Branch:** `exp--0.1--skill-tree`

- [ ] `SkillSystem.ts` — XP, leveling, skill point allocation
- [ ] 3 skill paths for MVP (Oratory, Legislative, Strategist)
- [ ] Skill tree panel (visual tree with node states)
- [ ] Skill unlock animations
- [ ] Skill effect application (passive bonuses integrated into systems)
- [ ] XP gain from actions, quests, events

**Done When:** Player can earn XP, level up, and unlock skills that affect gameplay

---

### Milestone 16: Save System
**Branch:** `exp--0.1--save-system`

- [ ] `electron-store` setup for save files
- [ ] Save game (manual + auto-save on week end)
- [ ] Load game (from main menu and in-game)
- [ ] Save slot management (up to 5 manual saves + 1 autosave)
- [ ] Save file metadata (character name, date, scenario, playtime)
- [ ] Save file version field (for future migration)
- [ ] Save confirmation modal

**Done When:** Game can be saved and loaded with complete state restoration

---

### Milestone 17: Achievements
**Branch:** `exp--0.1--achievements`

- [ ] `AchievementEngine.ts` — condition checking, unlock tracking
- [ ] `achievements.json` — 10 MVP achievements
- [ ] Achievement unlock toast notification
- [ ] Achievements screen (list, locked/unlocked, progress)
- [ ] Achievement persistence (cross-save via separate store key)

**Done When:** Achievements unlock in-game and persist across saves

---

### Milestone 18: Polish & QA Pass
**Branch:** `exp--0.1--polish`

- [ ] Consistent typography + color usage audit
- [ ] All loading states handled (skeleton screens)
- [ ] All error states handled (error boundaries)
- [ ] Keyboard shortcuts implemented (pause, speed, nav)
- [ ] Accessibility pass (ARIA labels, focus management)
- [ ] Tooltips on all stats and terms
- [ ] Onboarding tooltips (first-time player guidance)
- [ ] Performance profiling (React DevTools, no jank)
- [ ] Cross-platform build test (Windows + macOS)
- [ ] Play-through QA (full session without crashes)
- [ ] README updated with setup instructions

**Done When:** Game is playable start-to-finish without critical bugs

---

### v0.1 RELEASE CRITERIA

- [ ] Character creation → scenario → full play session works
- [ ] All 18 milestones complete
- [ ] Zero P0/P1 bugs
- [ ] Builds successfully on Windows and macOS
- [ ] Save/load works correctly
- [ ] Merged to `development`, tagged `v0.1.0-alpha.1`
- [ ] Release notes written in `docs/about/CHANGELOG.md`

---

## v0.2 PLANNED FEATURES

- Full election system (campaigns, debates, polling, election night)
- Approval rating detailed breakdown (by demographic)
- Judicial system (Supreme Court + lower courts)
- Constitutional amendment mechanic
- 5 additional starter scenarios (framework)
- NPC press / media system (individual journalists with personalities)
- Foreign leader contacts (basic diplomacy groundwork)
- Creator Mode v1 (basic scenario editor)

---

## v0.3 PLANNED FEATURES

- Civil War Era scenario (full)
- Civil Rights Movement scenario (full)
- Military system (basic — budget, readiness, deployments)
- Map view (US regional breakdown with population data)
- Faction leadership system (player can lead a caucus)
- Advanced dialogue trees (branching press conferences)
- Party leadership path (whip → minority leader → majority leader)

---

## LONG-TERM VISION (v1.0+)

- Multiplayer (cooperative or competitive political simulation)
- Steam Workshop integration for mods
- Mobile companion app (view stats, approve/deny decisions)
- Historical accuracy research mode (optional overlays)
- Community scenario library
- Full audio implementation (score + SFX)
- Illustrated card art
- Character portrait generator
- Multiple countries/political systems (parliamentary, authoritarian, etc.)

---

*Roadmap owned by Lead Director.*
*Feature scope subject to change based on development velocity.*
