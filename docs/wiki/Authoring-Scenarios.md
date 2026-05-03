# Authoring Scenarios

> **GDD reference:** §3.2 (Scenario Data Bundle), §12.7 (Scenario Catalogue), §9 (Modding & Extensibility)
> **Implementation status:** Designed (second scenario ship at M7; data bundle spec from M1)
> **Last reviewed:** 2026-05-02 (Vex, GDD v0.4-DRAFT)

This page is for modders and contributors building scenario content. For the player-facing overview, see [[Scenarios]].

---

## What a Scenario Is

A scenario is a self-contained political simulation: a specific time, place, legislature, cast, and set of opening conditions. The scenario data bundle provides the engine with everything it needs to initialise a new run without touching base-game assumptions.

---

## Data Bundle Structure

A scenario lives in `src/data/scenarios/<scenario-id>/`:

```
scenario-id/
  scenario.json         ← master manifest
  legislators.json      ← procedural generation seed + named NPC overrides
  population.json       ← cohort starting values
  economy.json          ← economic indicator starting values
  events/
    event-001.json      ← event definitions for this scenario
    ...
  quests/
    arc-001.json        ← quest arc definitions for this scenario
    ...
  cards/
    scenario-cards.json ← scenario-specific cards (optional)
  dialogue/
    <npc-id>/           ← NPC dialogue trees (optional at launch)
```

---

## `scenario.json` — Master Manifest

```jsonc
{
  "id": "modern-america-2024",
  "name": "Modern America (2024)",
  "eraRegister": "modern",           // see Voice-and-Tone era table
  "description": "A first-term Senator in a 50-50 chamber. Everything is on the table. Nothing is guaranteed.",
  "schemaVersion": 1,
  "playerPosition": {
    "chamber": "senate",
    "state": "procedural",           // or specific state code
    "party": "player-choice",
    "termYear": 1,
    "seniority": 1
  },
  "victoryConditions": [
    { "id": "vc-bill", "description": "Signature bill passed and signed", "required": true },
    { "id": "vc-reelect", "description": "Re-elected with +5% margin", "required": false },
    { "id": "vc-approval", "description": "≥60% national approval at re-election", "required": false },
    { "id": "vc-majority", "description": "Reach majority leader or higher", "required": false }
  ],
  "failureConditions": [
    { "id": "fc-lose-election", "description": "Lost re-election" },
    { "id": "fc-resign", "description": "Resigned for scandal" },
    { "id": "fc-expulsion", "description": "Party expulsion" },
    { "id": "fc-censure", "description": "Censured with all committee seats stripped" }
  ],
  "victoryText": "The bill is signed. The aides are popping something cheap. You will read the analysis for weeks.",
  "lossText": "The seat is someone else's now. The work was real. The outcome is permanent.",
  "startYear": 2025,
  "termLengthYears": 6,
  "budgetStartYear": 2025,
  "budgetStartValue": 0,
  "namedNPCs": ["audrey-vance", "marcus-elbe", "harriet-okonkwo", "dell-pryor"]
}
```

---

## `legislators.json` — Chamber Seed

```jsonc
{
  "proceduralSeed": 20240101,
  "chamberSize": 100,
  "partyBalance": { "D": 50, "R": 49, "I": 1 },
  "overrides": [
    {
      "id": "audrey-vance",
      "name": "Audrey Vance",
      "party": "D",
      "state": "CA",
      "personality": "loyalist",
      "archetype": "machine-boss",
      "ideology": { "economic": -2, "social": -1 },
      "traits": ["whip-veteran", "donor-network"],
      "role": "majority-whip"
    }
  ]
}
```

Named NPC overrides are placed at the top of the legislator list and will not be re-rolled. The remaining seats are filled by the procedural generator from `proceduralSeed`.

---

## `population.json` — Cohort Starting Values

```jsonc
[
  {
    "id": "working-class-voters",
    "name": "Working-Class Voters",
    "size": 85,
    "happiness": 45,
    "radicalism": 35,
    "alignment": "D-lean",
    "policyPriorities": ["employment", "wages", "healthcare"]
  }
]
```

All cohorts present in the scenario must be listed with starting values. Do not reference cohort IDs from other scenarios — define your own or extend the base-game defaults explicitly.

---

## `economy.json` — Opening Economic State

```jsonc
{
  "gdpGrowth": 2.1,
  "unemployment": 3.9,
  "inflation": 3.2,
  "federalDebt": 34000,
  "tradeBalance": -800,
  "consumerConfidence": 63,
  "energyPrice": 3.45
}
```

All seven indicators must be supplied (GDD §4.9). Missing indicators default to 0 and will cause the economy to behave implausibly.

---

## Events and Quests

Events and quest arcs in `events/` and `quests/` follow the same schemas as base game content (see [[Events]] and [[Quests]]) but scoped to the scenario. The scenario engine does not merge base-game events into a scenario's event pool unless explicitly configured — which keeps historical scenarios from firing anachronistic events.

---

## Era Register

Every text string in a scenario — event descriptions, quest titles, card flavour text, NPC dialogue — must be written in the scenario's era register. See the [[Voice-and-Tone]] era table. The `eraRegister` field in `scenario.json` is used by content reviewers and linters, not by the runtime engine (yet).

---

## Checklist Before Submitting a Scenario

- [ ] `scenario.json` has all required fields including `victoryText` and `lossText`
- [ ] `victoryConditions` includes at least one `required: true` condition
- [ ] Named NPCs have `archetype` set (see [[Archetypes]])
- [ ] `population.json` supplies all cohorts with starting values
- [ ] `economy.json` supplies all seven indicators
- [ ] All text is era-appropriate (see [[Voice-and-Tone]])
- [ ] No real-person likenesses in NPC definitions
- [ ] All events and quests use `applyEffect`-compatible effect schema
- [ ] Schema version declared in `scenario.json`

---

## Related

[[Scenarios]] · [[Voice-and-Tone]] · [[Archetypes]] · [[Authoring-Dialogue]] · [[Authoring-Cards]] · [[Modding-Guide]] · [[Save-Format]]
