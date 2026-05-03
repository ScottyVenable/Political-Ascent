# Research Packet — Nova: Gameplay Systems & Balancing Lead

**Destination:** `.github/team/research/` (team resource)
**Intended audience:** Nova

---

## Purpose

Equips Nova with the systems design vocabulary, balance methodology, and political simulation genre knowledge needed to deliver implementation-ready specs and tuned parameter tables for Political Ascent's economy, legislation, and faction systems.

---

## Role Summary

Nova designs and balances the core gameplay systems: mechanics, progression, economy loops, difficulty curves, and player-experience tuning. Nova's deliverables — system specs, formulas, data tables, and balancing parameters — are handed to Sol for implementation. Nova coordinates with Vex on narrative constraints, Lux on visual readability of system outputs, and Rook on balance-test results.

---

## Key Concepts & Domain Knowledge

- **Systems design vocabulary** — Differentiate between *stocks* (quantities that accumulate: approval rating, political capital, treasury), *flows* (rates of change: weekly GDP growth, daily approval drift), and *converters* (mechanisms that transform one resource into another: legislation that converts PC into approval). Political Ascent is a stock-and-flow simulation.
- **Positive and negative feedback loops** — High approval → easier legislation → more policy wins → higher approval (positive feedback: runaway). Low approval → blocked legislation → fewer wins → lower approval (negative feedback: stabilizing). Nova must consciously design which loops are which and ensure positive loops have governors.
- **Balancing methodology: spreadsheet-driven vs. playtest-driven** — For deterministic simulations, spreadsheet models (simulate N weeks in Excel/Python) allow rapid iteration before implementation. Nova should build balancing models that Sol can also inspect; don't rely solely on intuition.
- **Political capital (PC) as a metered resource** — PC is the primary non-time cost. Its generation rate, cap, and expenditure curve define the rhythm of player agency. If PC regenerates too fast, choices feel trivial; too slow, and the game feels punishing. Research how Crusader Kings 3's Prestige/Piety and Victoria 3's Influence work as comparable metered political resources.
- **Time as a first-class cost** — The April 2026 pacing pass made legislative stage duration (Committee: 21d, Floor: 14d, Vote: 7d) the primary cost. Nova's balancing work must treat this calendar as a constraint that interacts with event cadence and action-point regeneration.
- **Multi-variable approval systems** — Political Ascent tracks approval across population groups, not just a single number. Nova must understand how group weights aggregate to national approval and how to balance systems that affect subgroups differently (e.g., a tax bill that raises GDP but angers urban progressives).
- **Economy model fidelity** — The current `EconomySystem` is described as a "simple model." Nova should understand where it abstracts real economic mechanics and where fidelity could be increased in later milestones without causing runaway complexity.
- **Faction loyalty mechanics** — Faction loyalty is designed but not yet implemented (GDD §4.0 inventory). Nova owns the design spec for `FactionSystem.ts`. Study Victoria 3's Interest Groups and Crusader Kings 3's Council/Vassal loyalty as comparable mechanics.
- **Skill tree progression design** — The current `SkillSystem` has 3 branches. Nova should understand how skill trees interact with system balance: skills that reduce costs must be accounted for in the "baseline" economy model to prevent runaway snowball effects.
- **Difficulty scaling in political simulations** — Unlike combat games, difficulty in a political sim is best adjusted through AI behavior and external pressure (opponent legislation, crises, economic shocks), not stat inflation. Nova should prefer designing emergent difficulty over scripted hard-coding.

---

## Reference Games / Comparable Projects

| Title | What Nova should study |
|---|---|
| **Victoria 3** (Paradox, 2022) | POP-based approval aggregation; Interest Group mechanics; law-passing system with clout, support, and opposition as variables — the closest systems analogue to Political Ascent. |
| **Democracy 4** (Positech Games, 2020) | Policy graph model — policies connect to outcomes via weighted edges with lag; a mathematically explicit influence-propagation system. Study the spreadsheet-first design philosophy. |
| **Crusader Kings III** (Paradox, 2020) | Prestige/Piety/Dread as metered political resources; stress/stewardship balance; how character traits gate action availability — analogues to PC and skill trees. |
| **Frostpunk** (11 bit studios, 2018) | Resource scarcity and moral approval as dual pressure systems; escalating crisis pacing; how "hope" and "discontent" meters create tension without a combat system. |
| **Tropico 6** (Limbic Entertainment, 2019) | Faction tension management; population-group happiness as a multi-variable approval system; how economic policies produce faction-specific reactions. |

---

## Best Practices for This Project

1. **Build a balancing spreadsheet model before writing specs.** Simulate the first 20 weeks of the Modern America 2024 scenario in a spreadsheet (weekly tick, approval, PC, economy). Validate that the player has meaningful agency throughout — not coasting or drowning.
2. **Spec every formula explicitly, not descriptively.** A spec that says "approval increases based on how good the economy is" is not implementable. A spec that says `weeklyApprovalDelta = (gdpGrowth * 0.4) + (employmentDelta * 0.6)` is. Sol requires the latter.
3. **Flag narrative constraints to Vex before finalizing.** If a system spec requires a faction to respond in a specific way, Vex needs to author the event text that surfaces that response. The mechanic and the narrative must ship together.
4. **Define the observable player signal for every hidden variable.** Any value the player cannot directly see (e.g., faction loyalty score) must have a visible proxy (a relationship indicator, a vote tally change, a news headline). Nova specs the mechanic; Lux specs the visual signal.
5. **Submit balance-test scenarios to Rook alongside system specs.** For every new system or tuning pass, provide a named scenario ("week-20 stress test", "minimum-PC legislation attempt") that Rook can script and run as a regression test.

---

## Useful Patterns & Anti-Patterns

| Do | Avoid |
|---|---|
| Express formulas explicitly with named variables and unit labels | Descriptive-only specs that leave formula interpretation to Sol |
| Build a spreadsheet model first; validate before committing to implementation | Tuning by intuition in the first pass |
| Design positive feedback loops with explicit governors (caps, decay rates) | Unbounded positive feedback (runaway approval spiral) |
| Specify both the mechanic and its observable player signal | Hidden variables with no player-visible proxy |
| Balance for median skill, then spec easy/hard as parameter deltas | Designing for expert play as the baseline |
| Document assumptions explicitly ("assumes PC cap = 100") | Embedding assumptions silently in formulas |

---

## Quick Reference Links (Internal)

- [TEAM.md](../../TEAM.md) (Nova entry — role, tools, handoff matrix)
- [GDD §4 — Game Systems](../../../docs/GDD.md) (full system inventory, implementation status, current tick cadences)
- [GDD §2 — Core Loop & Pacing](../../../docs/GDD.md) (time scale, stage durations, pacing intent)
- [GDD §3 — Player Fantasy & Win/Loss states](../../../docs/GDD.md)
- [ROADMAP.md](../../../docs/ROADMAP.md) (milestone plan; faction loyalty and speech systems are post-MVP)
- [docs/research/victoria-3.md](../../../docs/research/victoria-3.md) (POP systems, law-passing, Interest Groups)
- [docs/research/crusader-kings-3.md](../../../docs/research/crusader-kings-3.md) (metered resources, traits, council mechanics)
- [docs/research/comparative-systems.md](../../../docs/research/comparative-systems.md) (Democracy 4, Tropico 6, Frostpunk patterns)
- [docs/research/political-simulation-fidelity.md](../../../docs/research/political-simulation-fidelity.md) (how much realism is "enough")
- [docs/research/pacing-legislative-timeline-2026-04.md](../../../docs/research/pacing-legislative-timeline-2026-04.md) (time-as-cost rationale and tuning table)
- [docs/LEGISLATION_OVERHAUL_PLAN.md](../../../docs/LEGISLATION_OVERHAUL_PLAN.md)

---

## Handoffs Cheatsheet

| Agent | What Nova gives | What Nova receives |
|---|---|---|
| **Sol** | Finalized system specs, explicit formulas, data tables, balancing parameters — implementation-ready | Implementation feedback: feasibility, performance cost, type constraints |
| **Vex** | System constraints affecting narrative beats; lore-driven system requirements | Narrative constraints on mechanics; content that surfaces system state to players |
| **Lux** | Systems that require visual feedback; readability requirements for data displays | Visual readability constraints; review of system-output panel specs |
| **Rook** | Balance-test scenarios; perf budgets for simulation systems | Balance-test results; edge-case repros; perf-budget breach reports |
| **Jesse** | Systems/balance work items; milestone alignment | Board field tracking; milestone updates |
| **Robert** | Research requests (competitor balancing data, genre benchmarks, systems design papers) | Structured competitor analysis; systems design references; genre balance patterns |

---

*Researched by Robert — 2026-05-03*
