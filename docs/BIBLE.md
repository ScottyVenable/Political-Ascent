# POLITICAL ASCENT — Project Bible
**Version:** 1.0 | **Owner:** Lead Director | **Audience:** Every contributor (designer, engineer, writer, artist, modder)

> The **GDD** describes *what the game does*.
> The **Architecture** describes *how the code is structured*.
> The **Bible** describes *what the game is, who it is for, and the spirit in
> which it should be made*.
>
> When the GDD and the Bible disagree, the Bible wins on **tone, voice, and
> values**. The GDD wins on **mechanics**.

---

## TABLE OF CONTENTS

1. [Premise & Promise](#1-premise--promise)
2. [Audience & Mood Board](#2-audience--mood-board)
3. [Tone of Voice](#3-tone-of-voice)
4. [Themes the Game Explores](#4-themes-the-game-explores)
5. [Anti-Themes — what we are NOT making](#5-anti-themes--what-we-are-not-making)
6. [Sensitivity & Editorial Guidelines](#6-sensitivity--editorial-guidelines)
7. [World Canon](#7-world-canon)
8. [Faction Lore](#8-faction-lore)
9. [NPC Voice Guide](#9-npc-voice-guide)
10. [Player Character Canon](#10-player-character-canon)
11. [Visual Identity](#11-visual-identity)
12. [Audio Identity](#12-audio-identity)
13. [Naming Conventions](#13-naming-conventions)
14. [Writing Style Guide](#14-writing-style-guide)
15. [Design Principles & Heuristics](#15-design-principles--heuristics)
16. [Decision Log](#16-decision-log)
17. [Glossary](#17-glossary)

---

## 1. PREMISE & PROMISE

**Premise.** You are a politician. You navigate a simulated nation that is
indifferent to whether you exist. Every law you pass, every speech you give,
every alliance you betray ripples through a real economy and a real
population. The simulation does not flatter you.

**Promise.** Within five minutes, the player feels:

1. **Identified** — "this character is *mine*".
2. **Situated** — "I understand the country I am stepping into".
3. **In motion** — "the world will not wait for me".

Within thirty minutes, the player has at least one **story they can tell a
friend**. That story usually starts with "I had to choose between…".

The promise is *meaningful choice in a living world*, not power fantasy.

---

## 2. AUDIENCE & MOOD BOARD

**Primary audience.**
- Players who like **Crusader Kings, Suzerain, This War of Mine, Disco Elysium, Tropico, Frostpunk**.
- Civics nerds who watch C-SPAN and read *Politico*.
- Strategy players who want a system, not a story rail.

**Secondary audience.**
- Educators teaching civics or political science.
- Modders who want a sandbox.

**Mood board.**

| Reference | What we take from it |
|---|---|
| *Suzerain* (Torpor Games) | Dialogue gravity; the feeling of consequences without a save scummer's safety net. |
| *Crusader Kings III* | Living-world simulation; legitimacy of inaction. |
| *Disco Elysium* | Dignity of writing; trust in the player's intelligence. |
| *Frostpunk* | A simulation that **judges** the player. |
| *The Economist* / *gov.uk* | Editorial restraint, typographic confidence. |
| *Bloomberg Terminal* | Density without panic. |
| *House of Cards* (S1–2) | The texture of leverage. |
| *The West Wing* | Belief that institutions are people. |

**Anti-mood.** *Civilization* triumphalism. Mobile-game saturation. Cable-news
bombast. Anything that reduces politics to "team red vs team blue".

---

## 3. TONE OF VOICE

The game speaks in **three registers**:

1. **System voice** (UI, tooltips, error states).
   *Crisp, factual, slightly clinical.* Think a wire-service reporter.
   - "Bill HR-2014 advanced to Floor Debate. Cost: 15 PC."
   - **Not:** "Awesome! Your bill is on the move! 🚀"

2. **Editorial voice** (news ticker, headlines, post-event flavor).
   *Wry, observant, never partisan.*
   - "Senate splits 51–49 along party lines. Again."
   - "Approval rating dips below 40% — staff floats a 'reset week'."

3. **Character voice** (NPC dialogue).
   *Diverse — see §9. NPC Voice Guide.*

**Words we avoid in any voice:**
- Slurs, in-character or otherwise.
- Real living politicians' names. *(See §6.)*
- "Liberal" / "Conservative" as pejoratives — we use **left / right / progressive / traditionalist** as neutral coordinate labels.
- "Woke", "MAGA", "snowflake", "deplorable", and other identifying slogans of the 2010s–2020s discourse.
- Emoji in system voice. Sparingly in news ticker for severity icons.

---

## 4. THEMES THE GAME EXPLORES

| Theme | One-line statement |
|---|---|
| **Compromise has a cost.** | Every coalition is paid for in something. |
| **Power is a current, not a vault.** | You spend it whether you act or not. |
| **The crowd is a person.** | Demographic groups have memory and dignity. |
| **Institutions outlast you.** | The Senate doesn't care about your name. |
| **Time is the most expensive resource.** | A bill that takes 3 years to take effect is a different bill. |
| **History is a load-bearing wall.** | Past choices constrain present moves. |

Each theme should be **mechanically expressed at least once** — never
delivered only in flavor text.

---

## 5. ANTI-THEMES — what we are NOT making

- **Not a partisan simulator.** We do not punish the player for being on a
  particular side of the compass. Both sides have winning paths and tragic
  paths.
- **Not a satirical game.** Tone is sincere. *The Onion* is not a reference.
- **Not a campaign manager.** The campaign sub-loop in v0.2 is a *part* of the
  game, not its core.
- **Not a sandbox toy.** Sandbox Mode exists, but the soul of the game is a
  Career Mode with weight.
- **Not edutainment.** It is not a textbook. We are not above showing a
  filibuster as a card play.
- **Not a power fantasy.** The player will lose. Frequently. By design.

---

## 6. SENSITIVITY & EDITORIAL GUIDELINES

This is a political-simulation game shipped to a global audience. We are
careful, not timid.

**Rules of thumb:**

1. **No real living politicians.** All NPCs are fictional, even in the Modern
   America scenario. Resemblance is incidental. Modders may add real figures
   in their own packs.
2. **Demographics are simulation variables, not value judgments.**
   - "Working Class" is a stat-bearing entity. So is "Upper Class".
   - We never write a group as a caricature.
   - Religion, ethnicity, region are tracked when *mechanically relevant* and
     never as a punchline.
3. **The Dark Path exists.** A player can play an authoritarian, a corrupt
   centrist, a populist demagogue. The simulation responds; the writing does
   not editorialise. Achievements like *The Machine* are descriptive, not
   prescriptive.
4. **Violence is implied, not depicted.** Assassination attempts and
   protests are events with text descriptions and stat consequences. No gore.
5. **No hate symbols.** Even on the historical scenarios. The Civil War
   scenario uses *Union* and *Confederacy* and that is the closest we get.
6. **Slavery, genocide, and atrocity** are addressable in historical scenarios
   *only* with a content warning at scenario load and editorial framing
   (curated quotes, primary sources cited where possible).
7. **Suicide / self-harm:** never depicted. Mental-health events are framed as
   *exhaustion* or *health crisis*.
8. **Romance and personal life:** off-screen. Family members appear as
   relationship NPCs only.
9. **Player accessibility content warnings** at scenario load are mandatory
   for any historical scenario whose period contains atrocity.

When in doubt, pull it back, write it shorter, and ask the Lead Director.

---

## 7. WORLD CANON

The default game-world is a **fictionalized contemporary America** known
internally as *"Modern America 2024"* (`modern-america-2024`). Players never
see that codename — they see *"The United States, 2025"*.

### 7.1 What is fictionalized

- **Officeholders** — every named NPC is invented.
- **Geographic units** are real (50 states + DC + territories).
- **Major institutions** are real in name and structure (House, Senate, SCOTUS, agencies).
- **Parties** are real (Democratic, Republican, Independent) and **modders may add more**.
- **Historical events older than 5 years** are real and citeable.
- **Recent events** are *generic* — "the 2024 election" happened, but its
  outcome is left ambiguous so the scenario start-state is the canon.

### 7.2 The five Active Tensions

Every base scenario has **five** ongoing tensions in the simulation. They are
the gravity wells around which events are written.

1. **Healthcare cost spiral.**
2. **Housing affordability collapse.**
3. **Climate adaptation vs growth.**
4. **Immigration & border policy.**
5. **National debt + intergenerational fairness.**

A scenario must touch at least 3 of these in its events file; the player must
be able to make at least 2 of them their *signature issue*.

### 7.3 Demographic groups (default 6)

Per `src/data/scenarios/modern-america-2024/population.json`:

- **Working Class** — large, economically anxious, swing.
- **Middle Class** — large, status-anxious, moderately engaged.
- **Upper Class** — small, fiscally conservative, low activism but high donor weight.
- **Rural Communities** — medium, traditionalist-leaning, high turnout.
- **Urban Professionals** — medium, progressive-leaning, high media reach.
- **Underclass** — small, low turnout, high radicalism if ignored.

Identity-based groups (race, religion, gender, age) are **not** modeled at the
base layer in v0.1. They will be added in v0.3 as cross-cutting **modifiers**
on the existing groups, not as their own group rows. This is a deliberate
choice to avoid making any one identity feel like a "stat block".

### 7.4 Time canon

- Game starts on **January 6, 2025**, the day a Senator-elect would arrive in DC.
- A game-day is roughly 3 real seconds at 1× speed.
- A typical play session covers **4–12 game-weeks**.
- A "career" covers **6–12 game-years** before the natural endgame (retirement, defeat, scandal, or victory).

---

## 8. FACTION LORE

Factions are **transverse caucuses**, not parties. A senator can belong to a
party *and* a faction. Player can join, leave, or lead a faction.

| Faction | One-line creed | Priority issues | Default leader archetype |
|---|---|---|---|
| **Progressive Caucus** | "The system is broken; rebuild it." | healthcare, climate, equality | The Firebrand |
| **Moderate Democrats** | "Win the suburb. Win the country." | housing, education | The Pragmatist |
| **Establishment Republicans** | "Steady hand on the wheel." | fiscal, defense | The Statesman |
| **Freedom Caucus** | "Government is the threat." | immigration, second amendment | The Insurgent |
| **Problem Solvers Caucus** | "We can do business across the aisle." | infrastructure, debt | The Dealmaker |
| **Business Roundtable** | "What's good for business is good for America." | tax, trade | The Executive |
| **Reform Coalition** | "Fix the rules first, then play." | electoral reform, anti-corruption | The Reformer |

Each faction has, in its lore file (post-v0.2):

- **Founding myth** — a 1-paragraph origin story.
- **Patron saint** — a fictional historical figure they invoke.
- **Internal frictions** — what splits them when they're not united.
- **Visual mark** — a 1-color sigil for the Congress chamber overlay.

---

## 9. NPC VOICE GUIDE

NPCs are the heart of the simulation. They are the only thing in the game
that can sound *partisan*, because they are characters.

Personality archetypes (`src/types/congress.ts → Personality`):

- **Loyalist** — sentences end with the party line. "We've held the caucus together on this for ten years; you walk away from us, you walk alone."
- **Maverick** — speaks first, calls leadership second. "I'm voting yes. They'll come around."
- **Opportunist** — every reply is a question about what's in it for them. "What does the package look like for my district?"
- **Ideologue** — speaks in principles, rarely numbers. "There's a *line*, Senator. We don't cross it for a percentage point."
- **Pragmatist** — counts votes out loud. "You've got 47. You need 51. Where's the four?"

When writing an NPC line, ask:
1. Which **archetype** are they?
2. Which **faction**?
3. Are they speaking in **public** (cautious) or **private** (candid)?
4. Is their **relationship** with the player +50, 0, or −50? Adjust warmth accordingly.

**Length budget:** ≤ 240 characters per line in dialogue UI. Speech segments
are looser (≤ 600 characters).

---

## 10. PLAYER CHARACTER CANON

The player character is **never named** by the game. Their name comes from
the player. Their gender, age, and appearance are abstracted (no portrait
beyond a placeholder until v0.5).

The character canon covers only the **three backgrounds**, exactly as in the
GDD §5.1. The Bible adds:

- **No backstory beyond the chosen background.** No "where you grew up" or
  "your spouse's name". The player projects.
- **The character can change.** Ideology drift, traits acquired, scandal — all
  rewrite the character mid-run. The character at month 24 is not the
  character at month 0. This is a feature.
- **Death is on the table** — assassination event in v0.4. Always with a
  meaningful consent UX (you can disable it in Settings → Gameplay).

---

## 11. VISUAL IDENTITY

Already partially specified in GDD §18.1; this is the canonical extension.

### 11.1 Palette (Tailwind tokens)

| Token | Hex | Use |
|---|---|---|
| `bg-primary` | `#0F1117` | App background, dark mode default |
| `bg-secondary` | `#1A1D27` | Panels, cards |
| `bg-tertiary` | `#22262F` | Modals, hover states |
| `accent-blue` | `#3B6FE8` | Civic blue, Democrat-coded |
| `accent-red` | `#E83B3B` | Civic red, Republican-coded |
| `accent-gold` | `#C9A84C` | Political Capital, achievements, headlines |
| `text-primary` | `#E8E8EC` | Body text |
| `text-secondary` | `#8A8D9A` | Hints, axes, captions |
| `success` | `#2ECC71` | Positive deltas |
| `warning` | `#F39C12` | Caution events |
| `danger` | `#E74C3C` | Negative deltas, crisis |

**Light mode** is post-v1.0.

### 11.2 Typography

- **Headlines**: IBM Plex Sans, weight 600. Tracking +1%.
- **Body**: Inter, weight 400, line-height 1.5.
- **Numbers / data**: IBM Plex Mono, weight 500.
- **Flavor / quotes**: Merriweather, italic.

Numbers are **always monospaced** in panels — they line up on the decimal.

### 11.3 Iconography

- **Lucide** icons for UI affordances (we already use it).
- **Custom SVG** for political objects (gavel, ballot, podium, capitol dome) —
  a single weight, single corner radius. Use stroke icons, never filled,
  except for severity indicators.

### 11.4 Layout grid

- 12-column grid at ≥ 1280 px.
- 8-column grid at 768–1279 px.
- 4-column grid at < 768 px (Android Capacitor target).
- Spacing scale: 4, 8, 12, 16, 24, 32, 48 px (Tailwind defaults).

### 11.5 Motion

- All transitions ≤ 240 ms.
- **Vote tally** is the only allowed "long" animation, capped at 4 s.
- No parallax. No particles. No glow.
- Reduced-motion setting in accessibility halves all durations and disables
  the vote tally animation.

### 11.6 Card art (post-MVP)

- **Frame:** color-coded per type (see GDD §11.1).
- **Illustration style:** flat editorial illustration (think *NYT* op-eds).
  No realistic photography. No mascots. No memes.
- **Aspect ratio:** 5:7 (poker-card proportion).

---

## 12. AUDIO IDENTITY

(Audio is post-MVP — this section is the brief for whoever scores it.)

- **Score:** restrained chamber-orchestra base, occasional electronic
  texture. *Better Call Saul* op-ed energy. Not John Williams.
- **Layered states:** `calm`, `tense`, `triumphant`, `crisis`. Cross-fade on
  state change, never cut.
- **Era-shift:** historical scenarios get period-coded leads (fife & drum
  hint for 1860; jazz hint for 1968; synth for 2025).
- **SFX language:** wood, paper, distant bells. No metallic UI clicks.
- **Voice:** no voice acting in v1.0. Headlines never have a TTS voice.

---

## 13. NAMING CONVENTIONS

### 13.1 NPCs

- First name + last name, fictional. Generated by combining curated lists.
- **No surname matches any sitting US senator** as of the build date — we
  hash-check on generation.
- **State + party** is shown after the name in the chamber: *"Sen. Maria
  Aldridge (D-NV)"*.

### 13.2 Bills

`HR-####` for House, `S-####` for Senate, sequenced per game.
Bill **titles** follow the real US convention: *"the [Adjective] [Noun] Act
of [Year]"*. e.g. *"the Affordable Housing Restoration Act of 2025"*.

### 13.3 Events

- **System events**: `<scenario>.<category>.<short_id>` — e.g.
  `modern-america.crisis.market-crash`.
- **Display titles**: news-headline style — *"Markets Tumble on Quarterly
  Report"*.

### 13.4 Cards

- Internal `id`: `kebab-case-with-type` — e.g. `card-press-conference-action`.
- Display name: short, evocative, ≤ 24 chars — *"Press Conference"*, *"Leak
  to the Press"*, *"Backroom Deal"*.
- Flavor text: ≤ 100 chars, italicised, attributed if it's a fictional
  quote.

### 13.5 Files

- `src/types/<thing>.ts` — type-only.
- `src/engine/<Thing>Engine.ts` — orchestration / cross-system lifecycle.
- `src/systems/<Thing>System.ts` — single-domain simulation.
- `src/store/<thing>Store.ts` — Zustand store.
- `src/data/<category>/<scenario-or-name>.json` — content.
- Test files always co-located: `<file>.test.ts`.

---

## 14. WRITING STYLE GUIDE

- **Voice:** active. *"The bill passes."* not *"The bill was passed."*
- **Person:** second-person for system voice. *"You spend 10 PC."*
- **Tense:** present for current state, past for news, future only with
  hedge: *"is likely to"*, *"projects to"*.
- **Number formatting:** US — comma thousands, period decimal. Currency in
  scenario-local currency only (no FX in v1.0).
- **Percent:** always shown with a sign for deltas. *"+2.3%"* / *"−0.4%"*.
- **Dates:** ISO in saves; "January 6, 2025" in UI.
- **Capitalization:** Title Case for screen names and panel headers.
  Sentence case for buttons and tooltips.
- **Abbreviations:** spell out on first use per panel: *"Action Points (AP)"*.
- **No exclamation marks** in system voice. Earned in achievements only.

---

## 15. DESIGN PRINCIPLES & HEURISTICS

These are decision-tools when you're stuck.

1. **The simulation is the source of truth.** If the UI and the simulation
   disagree, the UI is wrong.
2. **Determinism is sacred.** Same seed + same inputs ⇒ same outputs. If
   you're tempted to use `Math.random()`, you're wrong.
3. **Content lives in JSON, never in TypeScript.** A designer should be able
   to edit a bill template without a build step.
4. **One choke point per concern.** All effects through `applyEffect`. All
   randomness through `SeededRNG`. All time through `TimeEngine`.
5. **No engine code in `/renderer`. No React in `/engine` or `/systems`.**
6. **Selectors over snapshots.** Subscribe to the slice you need, not the whole store.
7. **Numbers should be tunable, not magic.** A literal in TS code
   that affects balance is a bug — move it to `data/balance.json`.
8. **Tooltip everything.** If a number can change, it has a tooltip
   explaining why.
9. **Pause is a first-class action.** Players strategize during pause.
   *Never* hide the pause button. *Never* auto-unpause.
10. **The player is smart.** Trust them with information. Hide nothing the
    real-world equivalent would have access to. Reveal hidden stats only
    when the in-fiction reveal mechanism (a leak, a sting, an op-ed) fires.
11. **Tutorials by tooltip, not by tutorial.** A separate tutorial mode is a
    smell. The first 5 minutes of Career Mode *is* the tutorial.
12. **Failure is a feature.** Make sure losing is interesting.

---

## 16. DECISION LOG

A short, append-only record of decisions that shape the game. Newest at top.

| Date | Decision | Why |
|---|---|---|
| 2026-05-01 | Identity-based demographic groups deferred to v0.3 as modifiers, not group rows | avoids "identity = stat block" framing |
| 2026-04-24 | All randomness through `SeededRNG` | replay determinism, save migration sanity |
| 2026-04-24 | Effects via single `applyEffect` choke point | simulation consistency |
| 2026-04-24 | Zustand + immer over Redux | boilerplate cost, game-state friendly |
| 2026-04-24 | Capacitor for Android instead of native port | one source of truth, web stack |
| 2026-04-24 | Dark mode first, light mode post-v1 | tone (editorial / terminal) and scope |
| 2026-04-24 | No voice acting in v1.0 | localization & content cost |

When you make a notable choice, **append a row**.

---

## 17. GLOSSARY

| Term | Meaning |
|---|---|
| **AP** | Action Points — weekly budget for active player actions. |
| **PC** | Political Capital — currency of power; spent on legislative pushes, card buys, NPC persuasion. |
| **Approval** | Aggregate weighted average of population happiness toward the player. |
| **Background** | The starting archetype chosen at character creation (Citizen / Veteran / Executive). |
| **Bill** | A unit of legislation moving through the lifecycle DRAFT → COMMITTEE → FLOOR → VOTE → IMPLEMENT. |
| **Card** | A consumable, played from hand, that applies effects. |
| **Caucus / Faction** | Cross-party group of legislators with shared priorities. |
| **Crisis** | An event of severity Major or Catastrophic. |
| **Dark Path** | A playstyle that maximises leverage and authoritarian moves. Mechanically supported, never editorialized. |
| **Effect** | A typed simulation mutation applied via `applyEffect`. |
| **Event** | A modal-presented scenario with options, trigger conditions, and outcomes. |
| **Faction** | See Caucus. |
| **Group** | A demographic segment of the population. |
| **Ideology** | A 2-axis position (econ left/right × authority libertarian/authoritarian). |
| **Implementation Time** | The delay between a bill passing and its effects landing. |
| **Leverage** | Hidden score representing compromising material on an NPC. |
| **Loyalty** | A group's alignment with the player (-100 to +100). |
| **Quest** | A multi-objective, time-bounded objective with rewards. |
| **Scenario** | A start-state bundle (world + characters + events) loaded at game start. |
| **Trait** | A passive modifier on the player character. |

---

*This Bible is alive. If a decision in it stops being true, change it and
note the change in §16.*
