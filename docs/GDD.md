# POLITICAL ASCENT — Game Design Document (GDD)
**Version:** 0.1-DRAFT | **Lead Director:** [Your Name] | **Engine:** React + Electron

---

## TABLE OF CONTENTS
1. [Vision Statement](#1-vision-statement)
2. [Core Pillars](#2-core-pillars)
3. [Player Experience Goals](#3-player-experience-goals)
4. [Game Modes](#4-game-modes)
5. [Character System](#5-character-system)
6. [Core Game Loop](#6-core-game-loop)
7. [Time System](#7-time-system)
8. [Legislation System](#8-legislation-system)
9. [Population Simulation](#9-population-simulation)
10. [Congress System](#10-congress-system)
11. [Card System](#11-card-system)
12. [Influence & Relationship System](#12-influence--relationship-system)
13. [Events & Quest System](#13-events--quest-system)
14. [Economy System](#14-economy-system)
15. [Dialogue & Speech System](#15-dialogue--speech-system)
16. [Skill Tree System](#16-skill-tree-system)
17. [Scenarios](#17-scenarios)
18. [UI/UX Design Language](#18-uiux-design-language)
19. [Achievement System](#19-achievement-system)
20. [Modding & Creator Mode](#20-modding--creator-mode)
21. [Audio Design](#21-audio-design)
22. [MVP v0.1 Scope](#22-mvp-v01-scope)

---

## 1. VISION STATEMENT

**Political Ascent** is a hybrid RPG / grand strategy / management simulation game where the player navigates the world of politics — from a humble newcomer or seasoned veteran — working to gain power, shape policy, and leave a legacy on a dynamically simulated nation.

The game respects the player's intelligence. There are no "correct" political outcomes. The simulation responds to your choices with realistic consequences: your policies shift the economy, your speeches move populations, your alliances determine your survival. You may rise to become a beloved reformer, a feared authoritarian, a compromised centrist, or a footnote in history.

**Tagline:** *Every vote has a cost. Every promise has a price.*

---

## 2. CORE PILLARS

| Pillar | Description |
|--------|-------------|
| **Political Authenticity** | Systems grounded in how real politics, legislation, and governance function |
| **Meaningful Choice** | No filler decisions — every action has visible ripple effects |
| **Living World** | The simulation runs whether you act or not; inaction is a choice |
| **Personal Narrative** | Your character's background, traits, and relationships shape your story |
| **Accessible Depth** | Deep systems layered progressively — new players aren't overwhelmed |

---

## 3. PLAYER EXPERIENCE GOALS

- **First 10 minutes:** Player feels grounded, character feels personal, the world feels alive
- **First hour:** Player has made a controversial decision and seen its consequences ripple
- **First session:** Player has experienced one crisis, one triumph, one failure
- **Long-term:** Player wants to run it again from a different background, ideology, or era

---

## 4. GAME MODES

### 4.1 Career Mode *(Primary)*
The full experience. Begin with character creation, choose a starting scenario, and play through the complete political lifecycle — from first election to legacy.

### 4.2 Scenario Mode
Drop-in historical or fictional scenarios with pre-built characters and conditions. The player takes control at a defined moment in time.

**Launch Scenarios (v0.1):**
- `Modern America — Senator (2024)` ← **MVP Scenario**

**Post-Launch Scenarios (roadmap):**
- Rise of the Third Reich (Germany, 1928–1934)
- The Civil War Era (USA, 1860–1865)
- The Civil Rights Movement (USA, 1960–1968)
- The American Revolution (USA, 1770–1783)
- Cold War Détente (USA/USSR, 1969–1979)
- Weimar Republic (Germany, 1919–1933)

### 4.3 Sandbox Mode
All systems unlocked. No win/loss states. Pure simulation and experimentation.

### 4.4 Creator Mode *(Post-MVP)*
In-game editor for scenarios, politicians, events, cards, traits, and dialogue trees.

---

## 5. CHARACTER SYSTEM

### 5.1 Backgrounds
The player chooses one of three origin archetypes, each with unique stat distributions, starting resources, and narrative framing:

#### The Passionate Citizen
*"The system is broken. I'm going to fix it."*
- **Stat Bonuses:** Charisma +2, Integrity +2, Connections −1, Wealth −2
- **Starting Resources:** Grassroots support network, 1 Populist Card
- **Unique Trait:** *Outsider's Mandate* — First election costs 20% less political capital, but establishment NPCs start at −10 relationship
- **Narrative Flavor:** Motivated by a specific issue (chosen during creation). That issue becomes a personal quest thread.

#### The Political Veteran
*"I've been building toward this my whole career."*
- **Stat Bonuses:** Connections +3, Strategy +2, Charisma 0, Integrity −1
- **Starting Resources:** Party favor network, 2 Procedure Cards, 1 Mentor NPC relationship
- **Unique Trait:** *Institutional Memory* — Can call in favors once per month; knows where political skeletons are buried
- **Narrative Flavor:** Carries the weight of past compromises. Certain legacy decisions can unlock or haunt them.

#### The Business Executive
*"I built something real. Politics is just another market."*
- **Stat Bonuses:** Wealth +4, Connections +2, Charisma +1, Integrity −2
- **Starting Resources:** Campaign war chest (+$500K), 2 Donor Cards, Corporate Lobby contact
- **Unique Trait:** *Leverage* — Can fund political actions directly; subject to ethics investigations if overused
- **Narrative Flavor:** Outside perception matters — public trust starts lower, but business community is loyal.

---

### 5.2 Core Stats

| Stat | Description | Affects |
|------|-------------|---------|
| **Charisma** | Public speaking, persuasion, media appeal | Speech outcomes, poll ratings, debate performance |
| **Strategy** | Political maneuvering, long-game planning | Legislation success rate, committee positioning |
| **Connections** | Network of allies, party relationships | NPC relationship caps, favor system |
| **Integrity** | Public trust, ethical reputation | Scandal resistance, voter base stability |
| **Wealth** | Personal and campaign financial resources | Campaign options, donor unlocks, some card access |
| **Stamina** | How many actions you can take per time period | Action point pool per week/month |

Stats range from 1–10. They can grow through the Skill Tree, events, and certain card effects.

---

### 5.3 Traits System

Traits are passive modifiers that define your character's personality and history. They are stackable and interact with each other.

**Starting Traits (choose 2 + 1 from background):**

| Trait | Effect |
|-------|--------|
| *Veteran Orator* | Speech actions cost 1 less AP; 15% boost to speech outcomes |
| *Scandal Survivor* | First scandal has 50% reduced severity |
| *Grassroots Organizer* | Volunteer actions yield 30% more support |
| *Dealmaker* | Negotiation events have 1 extra dialogue option |
| *Iron Will* | Stamina regenerates 1 extra AP per week |
| *Ideological Purist* | Integrity +3, but bipartisan actions cost double political capital |
| *Media Darling* | Press events always start at Favorable; interview crits more common |
| *Old Money* | Wealth income passive; elite donor access unlocked at start |
| *Street Smart* | Random negative events have 20% chance to backfire on opponent |
| *Pragmatist* | Compromise legislation passes 25% faster but loses voter base loyalty |

**Acquired Traits** (unlocked through gameplay):
- *First-Term Survivor*, *Filibuster King*, *War Hawk*, *Reformer's Legacy*, *Populist Icon*, etc.

---

### 5.4 Ideology System

The player positions themselves on a 2-axis political compass:

```
          AUTHORITARIAN
               │
 LEFT ─────────┼───────── RIGHT
               │
           LIBERTARIAN
```

This is not a judgment — it's a mechanical positioning that affects:
- Which NPCs are allies vs. adversaries
- Which legislation is available or blocked
- How population groups react to your actions
- Which party factions support or oppose you

Ideology can shift over time based on legislation passed, traits acquired, and events chosen.

---

### 5.5 Character Presets

Available for new players or quick-start:

| Preset | Background | Ideology | Playstyle |
|--------|-----------|----------|-----------|
| *The Reformer* | Citizen | Center-Left | Legislation-heavy |
| *The Machine* | Veteran | Center-Right | Alliance-heavy |
| *The Disruptor* | Executive | Far-Right/Libertarian | Wealth-heavy |
| *The Idealist* | Citizen | Far-Left | Populism-heavy |
| *The Statesman* | Veteran | Centrist | Balanced |

---

## 6. CORE GAME LOOP

```
WEEKLY CYCLE
│
├─ [MORNING BRIEFING] — Event summary, news headlines, incoming issues
│
├─ [ACTION PHASE] — Spend AP on:
│   ├─ Legislative actions (draft, negotiate, push, vote)
│   ├─ Relationship actions (meet NPCs, conduct hearings, party events)
│   ├─ Public actions (press briefing, speech, rally, interview)
│   ├─ Administrative (review budget, respond to crisis, staff management)
│   └─ Personal (rest/recover AP, use cards, skill tree)
│
├─ [WORLD SIMULATION TICK] — Population shifts, economy updates, NPC actions
│
├─ [EVENT RESOLUTION] — Random and scheduled events fire
│
└─ [END OF WEEK SUMMARY] — Stats update, achievements check, save prompt

MONTHLY CYCLE ADDS:
├─ Committee hearings
├─ Poll results published
├─ Economic indicators update
└─ Faction loyalty check

ANNUAL CYCLE ADDS:
├─ Election cycle events
├─ Supreme Court terms
├─ Budget reconciliation
└─ Legacy score update
```

---

## 7. TIME SYSTEM

### 7.1 Time Scale
- **Base unit:** Day (simulated)
- **Primary interaction unit:** Week (action phase)
- **Macro view:** Month, Quarter, Year

### 7.2 Speed Controls
Displayed as a persistent bottom bar:

```
[Speed slider: Pause | 1x | 2x | 4x]  [Active bill/event progress]  [Week/date]  [Save] [Load] [Menu]
```

- **Pause** — Full stop; menus and actions still accessible
- **1×** — Normal speed; one game day per ~3 real seconds
- **2×** — Fast; good for quiet stretches
- **4×** — Very fast; auto-pauses on events
- **Active progress strip** — Shows the closest in-flight bill deadline from anywhere in the game and jumps back to the Legislation Hub when clicked

### 7.3 Auto-Pause Settings
Configurable in Settings → Gameplay:
- Pause on: New event, New crisis, End of month, End of year, Low AP, Negative poll shift

---

## 8. LEGISLATION SYSTEM

### 8.1 Bill Lifecycle

```
DRAFT → COMMITTEE → FLOOR DEBATE → VOTE → (SIGNED/VETOED) → IMPLEMENTATION
```

Each stage requires different actions and political capital expenditure.

### 8.2 Bill Properties

Every piece of legislation has:
- **Title & Description** — Flavor text and mechanical summary
- **Policy Tags** — Economy, Healthcare, Defense, Civil Rights, Environment, etc.
- **Affected Groups** — Which population segments benefit or suffer
- **Cost** — Budget impact (surplus/deficit effect)
- **Political Capital Cost** — To push through each stage
- **Opposition Score** — How much resistance to expect
- **Implementation Time** — How long before effects manifest

### 8.3 Legislation Categories

| Category | Examples |
|----------|---------|
| Economic | Tax reform, trade policy, minimum wage, tariffs |
| Social | Civil rights, healthcare access, education funding |
| Criminal Justice | Sentencing reform, police funding, drug policy |
| Environment | Carbon tax, EPA regulations, energy subsidies |
| Defense | Military budget, foreign aid, arms treaties |
| Constitutional | Amendments, electoral reform, court reform |

### 8.4 Negotiation Mini-System

When a bill needs votes, a **Negotiation Panel** opens:
- Shows list of undecided/opposing legislators with their priorities
- Player can offer: policy concessions, political favors, campaign support, or cards
- Each legislator has a **breaking point** and **red lines**
- Relationships affect starting position of negotiation

---

## 9. POPULATION SIMULATION

### 9.1 Population Groups

The nation is divided into **demographic segments**, each with tracked stats:

**Class Groups:**
- Working Class, Middle Class, Upper Class, Underclass

**Occupational Groups:**
- Industrial Workers, Agricultural Workers, Service Workers, Professionals, Business Owners, Military, Clergy, Students, Retirees

**Identity Groups:**
- Tracked by region, religion, ethnicity, age bracket (handled sensitively — these are simulation variables, not judgments)

### 9.2 Group Stats (per group)

| Stat | Description |
|------|-------------|
| **Size** | Population count/percentage |
| **Happiness** | Satisfaction with current government |
| **Radicalism** | Tendency toward extreme political action |
| **Ideology** | Group's average political position |
| **Income** | Economic wellbeing |
| **Loyalty** | Alignment to your party/character |
| **Activism** | How politically engaged/active the group is |

### 9.3 Group Behaviors

Groups respond to:
- Legislation that helps/hurts them
- Economic conditions
- Events and crises
- Your public statements
- Time (slow drift based on generational change)

Groups can:
- Organize protests
- Swing elections
- Radicalize if ignored
- Form coalitions
- Generate random events (strikes, demonstrations, petitions)

### 9.4 Population Panel UI

Accessible from the main toolbar:
- **Overview Tab** — Nation-wide aggregate stats with sparklines
- **Groups Tab** — Filterable list of all groups with drill-down
- **Map Tab** — Regional breakdown (if map is enabled)
- **Trends Tab** — Historical charts for any stat, any group

---

## 10. CONGRESS SYSTEM

### 10.1 Legislative Body

- **House of Representatives** — 435 seats, 2-year terms
- **Senate** — 100 seats, 6-year staggered terms
- **Party system** — At minimum: Democrat, Republican, Independent (modding expands this)

### 10.2 Congress UI — The Chamber View

A dedicated screen showing all seats in their iconic semicircle layout.

**View Modes (toggle):**
- 🔵🔴 **Party View** — Color by party affiliation
- 📊 **Ideology View** — Color spectrum from far-left to far-right
- 😊😤 **Happiness View** — How satisfied with your leadership
- ⚡ **Influence View** — How much political sway you have over them
- 🗳️ **Vote Prediction** — Shows how they're likely to vote on pending bills

**Interactions:**
- **Hover** → Quick stats tooltip
- **Click** → Opens legislator profile (bio, stats, relationships, voting history, leverage)

### 10.3 Voting Sequence

When a vote is called:
- Player can **Skip** (auto-resolves) or **Watch**
- Watch mode: seats light up one by one or in batches, tension builds
- Real-time tally counter
- Dramatic hold for close votes
- Post-vote breakdown: who flipped, who held, margin

### 10.4 NPC Politicians

Each legislator is a procedurally-seeded NPC with:
- Name, party, state/district
- Ideology position
- Key issue priorities (1–3)
- Personality traits (Loyalist, Maverick, Opportunist, Ideologue, etc.)
- Relationship score with player (−100 to +100)
- Corruptibility score (hidden)
- Historical voting record (builds over time)

---

## 11. CARD SYSTEM

Cards are collectible, usable items that represent political maneuvers, resources, connections, and wild cards. They are a supplement to core gameplay — not the primary driver.

### 11.1 Card Types

| Type | Color | Description |
|------|-------|-------------|
| **Action Cards** | Blue | One-time political actions (Call a Press Conference, Push the Narrative) |
| **Boost Cards** | Green | Temporary stat boosts (Rally the Base +15% loyalty for 2 weeks) |
| **Sabotage Cards** | Red | Actions against opponents (Leak to the Press, Filibuster Prep) |
| **Resource Cards** | Gold | One-time resources (Emergency Donor, Volunteer Surge) |
| **Legislation Cards** | Purple | Pre-drafted bills that skip the drafting phase |
| **Relationship Cards** | White | Bypass normal relationship building (Backdoor Deal, Party Whip) |
| **Wild Cards** | Prismatic | Rare, powerful, unpredictable effects |

### 11.2 Card Acquisition

- Starting hand based on background (3–5 cards)
- Earned through: quest rewards, achievements, NPC gifts, event choices
- Purchased with political capital at the Party Store
- Rare drops from certain events and crises

### 11.3 Card UI

- **Hand** — Persistent bottom-right drawer showing current hand
- **Play** — Drag to active zone or right-click → Play
- **Deck Inspector** — View full collection, filter, sort
- Card art: placeholder icons initially; illustrated art post-MVP
- **Readable card faces** — Costs, effect summaries, stats, tags, and flavor text live directly on the card face instead of relying on a full-card tooltip
- **Focused card modal** — Clicking a card opens a larger reader view with complete rules text, all effects, Play/Discard actions, and glossary-linked terms
- **Glossary support** — Hypertext remains term-level only; hovering an in-card term can still open the Paradox-style Extended Tooltip

---

## 12. INFLUENCE & RELATIONSHIP SYSTEM

### 12.1 Political Capital (PC)

The primary resource for political actions. Think of it as the currency of power.

- **Generated by:** Winning votes, good press, completing quests, high poll numbers, NPC gifts
- **Spent on:** Bill advancement, NPC persuasion, card purchases, crisis response
- **Lost by:** Scandals, failed legislation, party disloyalty, negative press

### 12.2 NPC Relationships

Every significant NPC (legislators, party leaders, press, judges, foreign leaders) has:

- **Relationship Score** (−100 to +100)
  - Below −50: Adversary (actively works against you)
  - −49 to 0: Unfriendly (uncooperative, may leak against you)
  - 1 to 49: Neutral (transactional)
  - 50 to 79: Ally (supportive, shares information)
  - 80+: Loyal Ally (defends you publicly, favors your agenda)

- **Leverage Score** (hidden; 0–100)
  - Represents compromising information or obligations you hold over them
  - Can be used as a dark tool with Integrity cost

### 12.3 Faction System

Beyond individuals, **political factions** exist within and across parties:

| Faction | Description |
|---------|-------------|
| Progressive Caucus | Left-wing legislators; healthcare, climate, equality |
| Moderate Democrats | Centrist Dems; pragmatic, swing-district oriented |
| Establishment Republicans | Traditional conservatives; fiscal hawkishness |
| Freedom Caucus | Hard-right; small government, populist nationalist |
| Problem Solvers Caucus | Bipartisan; compromise-oriented |
| Business Roundtable | Cross-party corporate interests |
| Reform Coalition | Anti-corruption, electoral reform |

Player can join factions, lead them, or play them off against each other.

---

## 13. EVENTS & QUEST SYSTEM

### 13.1 Event Types

| Type | Trigger | Examples |
|------|---------|---------|
| **Crisis Events** | Random + condition-based | Economic crash, natural disaster, scandal, assassination attempt |
| **Opportunity Events** | Triggered by high stats | Alliance offer, speaking opportunity, foreign visit |
| **Population Events** | Group behavior | Strike action, protest movement, public petition |
| **Political Events** | Legislature cycle | Surprise vote, defection, party leadership challenge |
| **Personal Events** | Character-specific | Health check, family moment, mentor death |
| **Scheduled Events** | Calendar | Elections, State of the Union, budget deadlines |

### 13.2 Event Resolution

Events present as a **modal overlay** with:
- Situation description (flavor text + stats shown)
- 2–5 response options
- Each option shows: AP cost, PC cost, likely outcome, risk level
- Some options gated by stats, traits, or relationships
- Outcomes can spawn follow-up events (event chains)

### 13.3 Quest System

**Quests** are multi-stage objectives with defined rewards.

**Quest Types:**
- **Issue Quests** — A population group raises an issue; fix it in N weeks
- **Political Quests** — Party or NPC asks for a favor
- **Legacy Quests** — Long-arc goals tied to your ideology
- **Hidden Quests** — Unlocked by specific actions or traits

**Quest UI:**
- Quest Log panel accessible from sidebar
- Active quests show timer, objectives, progress
- Completed quests feed into Legacy Score

---

## 14. ECONOMY SYSTEM

### 14.1 National Economic Stats

| Metric | Description |
|--------|-------------|
| **GDP Growth** | Percentage growth rate; affects happiness broadly |
| **Unemployment** | Affects working class groups significantly |
| **Inflation** | Erodes purchasing power; triggers protests if high |
| **National Debt** | Affects what fiscal legislation is viable |
| **Budget Surplus/Deficit** | Annual balance; affects PC with fiscal conservatives |
| **Inequality Index (Gini)** | Wealth distribution; affects radicalism |
| **Trade Balance** | Imports vs. exports; affects business groups |

### 14.2 Economic Policy Effects

Legislation and events shift these stats. Effects are:
- **Immediate** — Small, instant shift (press reaction)
- **Short-term** — Weeks to months (market response)
- **Long-term** — Months to years (structural change)

Economic stats feed back into population group behaviors, poll numbers, and crisis event probability.

### 14.3 Economy Dashboard

Accessible as a dedicated panel:
- Line charts for each major stat over time
- Policy impact markers on chart (mouseover shows what caused the shift)
- Projection mode (predict next 6 months based on current trajectory)
- Comparison to historical averages or previous administrations

---

## 15. DIALOGUE & SPEECH SYSTEM

### 15.1 Dialogue Trees

Used for: NPC meetings, negotiations, press interviews, Congressional hearings.

Each dialogue node has:
- **Speaker text** (NPC statement or question)
- **Player options** (2–5 choices)
- **Option metadata:** AP cost, stat check requirement, relationship effect, PC effect
- **Outcome state** — Which node comes next based on choice + random modifier

```
[NPC]: "Senator, how do you plan to fund this bill?"
  → [A] "We'll close corporate loopholes." (Integrity +1, Business Relations −5)
  → [B] "I'm exploring all options." (Neutral, Charisma check)
  → [C] "We'll make the tough cuts." (Fiscal Conservatives +8, Social groups −3)
  → [D] [CARD: Redirect] Play Redirect Card to change subject (-1 card)
```

### 15.2 Speeches & Press Briefings

The player constructs speeches from **Speech Segments** — modular blocks representing talking points:

- **Opening** — Set tone (Defiant, Reassuring, Inspirational, Aggressive)
- **Body Points** — Select 2–4 policy positions to address
- **Close** — Call to action (Unify, Mobilize, Warn, Promise)

Each segment has a quality score based on Charisma stat + relevant trait. The final speech generates:
- Poll shift (positive or negative per group)
- Press reaction (Favorable / Neutral / Critical)
- Political capital change
- Potential quote that becomes a game event/headline

### 15.3 Transcript System *(Post-MVP)*

Congressional sessions generate readable transcripts players can review, share, or export.

---

## 16. SKILL TREE SYSTEM

### 16.1 Structure

A branching upgrade tree organized into 5 paths. Points earned by: leveling up (XP from actions), completing quests, winning elections.

```
ORATORY PATH
└─ Basic Speech (unlock speech actions)
   └─ Crowd Galvanizer (+10% rally effectiveness)
      └─ Master Orator (+25% speech, unlock keynote)
         └─ Historic Address (once-per-game: massive poll shift)

LEGISLATIVE PATH
└─ Bill Drafting (unlock custom legislation)
   └─ Committee Insider (lower committee costs)
      └─ Floor Leader (faster floor debate)
         └─ Legislative Legend (bills auto-gain 3 cosponsors)

STRATEGIST PATH
└─ Political Calculus (+5% vote prediction accuracy)
   └─ Backroom Dealings (unlock leverage actions)
      └─ Coalition Builder (faction alignment costs −30%)
         └─ Kingmaker (can install party leader of choice once)

POPULIST PATH
└─ Grassroots Connect (unlock community events)
   └─ Base Energizer (+15% voter loyalty)
      └─ Movement Builder (unlock mass movement events)
         └─ Revolutionary Icon (population loyalty near-permanent)

ECONOMIST PATH
└─ Budget Literacy (unlock economic dashboards)
   └─ Fiscal Discipline (+5% to debt reduction legislation)
      └─ Market Whisperer (predict economic events 1 month early)
         └─ Economic Architect (design custom economic policy packages)
```

---

## 17. SCENARIOS

### 17.1 MVP Scenario: Modern America — Senator (2024)

**Setting:** United States Senate, January 2025
**Player Position:** Newly elected Senator from a swing state
**Starting Conditions:**
- Senate split: 51 R / 49 D (player party configurable)
- Economy: Moderate growth, elevated inflation
- Major issues: Healthcare costs, housing crisis, immigration reform, climate change, national debt
- Starting PC: 50
- Starting relationships: All neutral except 2 random allies

**Victory Conditions (optional):**
- Pass a signature piece of legislation in first term
- Win re-election with +5% margin improvement
- Achieve 60%+ national approval rating
- Reach Senate Majority Leader position

**Failure States:**
- Lose re-election bid
- Resign due to scandal
- Party expulsion
- Censure + loss of all committee seats

---

## 18. UI/UX DESIGN LANGUAGE

### 18.1 Visual Style

**Aesthetic:** Clean, professional, editorial. Inspired by:
- *The Economist* magazine layouts
- Modern civic design (gov.uk, USA.gov redesigns)
- Bloomberg Terminal (data-dense but readable)

**Color Palette:**
```
Primary Background:  #0F1117 (near-black, dark mode first)
Secondary Surface:   #1A1D27
Accent Blue:         #3B6FE8 (Democrat-neutral civic blue)
Accent Red:          #E83B3B (Republican-neutral civic red)
Accent Gold:         #C9A84C (political capital, achievements)
Text Primary:        #E8E8EC
Text Secondary:      #8A8D9A
Success:             #2ECC71
Warning:             #F39C12
Danger:              #E74C3C
```

**Typography:**
- Headlines: `IBM Plex Sans` (authority, modern)
- Body: `Inter` (clean, readable)
- Data/Numbers: `IBM Plex Mono` (terminal feel for stats)
- Flavor text: `Merriweather` (historical gravitas)

### 18.2 Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│  [LOGO]  [DATE]  [POLLS]  [PC]  [AP]  [ALERTS]           │  ← TOP BAR
├──────────┬──────────────────────────────────┬───────────┤
│          │                                  │           │
│ SIDEBAR  │        MAIN CONTENT AREA         │  CONTEXT  │
│ NAV      │     (changes per screen)         │  PANEL    │
│          │                                  │           │
│ • Home   │                                  │ (event    │
│ • Legis. │                                  │  detail,  │
│ • Congr. │                                  │  NPC      │
│ • Pop.   │                                  │  info,    │
│ • Econ.  │                                  │  quest    │
│ • Quests │                                  │  details) │
│ • Cards  │                                  │           │
│ • Skills │                                  │           │
├──────────┴──────────────────────────────────┴───────────┤
│ [SPEED SLIDER] [BILL/EVENT PROGRESS] [WEEK] [SAVE/LOAD] │  ← BOTTOM BAR
└─────────────────────────────────────────────────────────┘
```

### 18.3 Key UI Screens

| Screen | Purpose |
|--------|---------|
| **Main Dashboard** | At-a-glance: polls, recent events, AP, upcoming events |
| **Legislation Hub** | Draft, track, and manage all bills |
| **Congress Chamber** | Seat view, NPC profiles, vote sequences |
| **Population Panel** | Group stats, trends, behavior alerts |
| **Economy Dashboard** | All economic metrics with charts |
| **Quest Log** | Active/completed quests, objectives |
| **Character Sheet** | Stats, traits, ideology, skill tree |
| **Card Deck** | Hand, collection, store |
| **Press Room** | Schedule briefings, speeches, interviews |
| **Diplomacy** | Foreign leaders (post-MVP) |
| **Settings** | Gameplay, audio, display, accessibility |

---

## 19. ACHIEVEMENT SYSTEM

Achievements tracked per playthrough and across all playthroughs.

**Categories:**
- 🏛️ **Legislative** — *"The Great Legislator"* (pass 50 bills), *"Historic Reform"* (pass constitutional amendment)
- 📊 **Political** — *"Landslide"* (win election by 20%+), *"Kingmaker"* (elect your party's president)
- 👥 **Population** — *"Voice of the People"* (80%+ approval), *"Beloved by All"* (all groups at 60%+)
- 📰 **Press** — *"Media Darling"* (90% favorable coverage for a month), *"Enemy of the Press"* (all outlets hostile)
- 💀 **Dark Path** — *"The Machine"* (max leverage on 20 NPCs), *"Pyrrhic Victory"* (win re-election with <30% approval)
- 🎭 **Scenario-specific** — Unique achievements per scenario
- 🔍 **Hidden** — Discovered through unusual playthroughs

---

## 20. MODDING & CREATOR MODE

The game is built mod-first. All data is in editable JSON/YAML files.

**Moddable Systems:**
- Scenarios (full game states)
- Politicians (NPC definitions)
- Events (trigger conditions + outcomes)
- Cards (effects, costs, art references)
- Legislation templates
- Dialogue trees
- Population groups
- Economic formulas (advanced)

**Creator Mode UI (post-MVP):**
- In-game editors for all moddable content
- Visual dialogue tree editor
- Scenario start-state configurator
- NPC builder with trait assignment
- Event chain designer

**Mod Distribution:**
- Local folder install (place in `/Game/mods/modName/`)
- Future: Steam Workshop integration

---

## 21. AUDIO DESIGN

*(Placeholder system — no assets required for MVP)*

**Music:**
- Procedural ambient layers based on game state (tense music during crises, calm during routine)
- Era-appropriate style per scenario (orchestral for historical, modern for contemporary)
- Dynamic layers: add percussion during high-stakes votes

**Sound Effects:**
- UI clicks (clean, precise)
- Vote tallying (click, click, click... ding)
- Event alerts (different tones per severity)
- Card play (satisfying card sounds)
- Achievement unlock (triumphant)

**Audio Settings:** Master, Music, SFX, UI volume sliders

---

## 22. MVP v0.1 SCOPE

### What IS in v0.1:

| System | Status |
|--------|--------|
| Electron + React shell | ✅ Build |
| Main layout + navigation | ✅ Build |
| Character creation (all 3 backgrounds) | ✅ Build |
| Core stats + traits selection | ✅ Build |
| Character presets | ✅ Build |
| Time system (pause/1x/2x/4x) | ✅ Build |
| Action Point system | ✅ Build |
| Modern America 2024 scenario | ✅ Build |
| Basic legislation system (draft → vote) | ✅ Build |
| Congress Chamber view (seat grid) | ✅ Build |
| Basic NPC politicians (procedural) | ✅ Build |
| Population sim (6–8 groups, core stats) | ✅ Build |
| Basic event system (10–15 events) | ✅ Build |
| Quest system (3–5 starter quests) | ✅ Build |
| Card system (10–15 starter cards) | ✅ Build |
| Economy dashboard (basic metrics) | ✅ Build |
| Basic skill tree (3 paths, 3 tiers) | ✅ Build |
| Save/load system | ✅ Build |
| Basic achievement system (10 achievements) | ✅ Build |
| Settings screen | ✅ Build |

### What is NOT in v0.1 (Roadmap):

- Historical scenarios
- Diplomacy / foreign nations
- Military system
- Supreme Court / judicial system
- Elections / campaigns
- Creator Mode
- Multiplayer
- Full audio assets
- Map view
- Transcript system
- Constitutional amendment system
- Modding toolkit UI

---

*Document maintained by Lead Director. Update with each sprint.*
*Version history tracked in Git.*
