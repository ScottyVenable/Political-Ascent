# Authoring Dialogue

> **GDD reference:** §12.5 (Dialogue Authoring Guide), §12.3 (Archetypes)
> **Implementation status:** Designed (M2 — authoring framework; data path confirmed at M2 kickoff)
> **Last reviewed:** 2026-05-02 (Vex, GDD v0.4-DRAFT)

This page is for modders and contributors authoring dialogue tree content. For the player-facing overview of what dialogue does in-game, see [[Dialogue]].

---

## Data Location

Dialogue trees live in `src/data/dialogue/<npc-id>/<tree-id>.json`. The `dataLoader` entry for this path will be confirmed by Sol at M2 kickoff.

---

## Node Shape

```jsonc
{
  "id": "node-001",
  "speaker": "audrey-vance",          // NPC id or "player"
  "voiceTag": "machine-boss",         // archetype tag from §12.3.2
  "text": "I don't have a problem with your bill. I have a calendar problem.",
  "autoAdvance": false,               // true = no player pause; use sparingly
  "options": [
    {
      "id": "opt-push",
      "label": "What would it take to move it up?",
      "requirementType": "stat",      // "stat" | "trait" | "flag" | "ideology" | "none"
      "requirement": { "stat": "connections", "min": 4 },
      "failureHint": "Requires Connections 4 or higher.",
      "hiddenIfFails": false,
      "costType": "pc",               // "pc" | "ap" | "none"
      "cost": 10,
      "next": "node-002"
    },
    {
      "id": "opt-retreat",
      "label": "I'll come back when the timing is better.",
      "requirementType": "none",
      "costType": "none",
      "cost": 0,
      "next": "node-exit"
    }
  ]
}
```

---

## Voice Tagging

Every NPC node must carry a `voiceTag` from the [[Archetypes]] catalogue. The voice tag is not decorative — it is an authoring constraint. Before writing a line, identify the archetype, read their sample lines in [[Archetypes]], and write to that register.

| Voice tag | Archetype | Register |
|---|---|---|
| `machine-boss` | Machine Boss | Indirect, transactional; never says no directly |
| `reform-idealist` | Reform Idealist | Earnest, specific, occasionally naive about cost |
| `donor-whisperer` | Donor Whisperer | Smooth, euphemistic, fluent in abstractions |
| `coalition-broker` | Coalition Broker | Probing questions, list-making |
| `ideological-enforcer` | Ideological Enforcer | Principled, occasionally sanctimonious |
| `media-operator` | Media Operator | Quotable, punchy, comfortable with conflict |
| `principled-dissenter` | Principled Dissenter | Precise, measured, occasionally devastating |
| `crusader-freshman` | Crusader Freshman | Impatient, press-ready, prone to overreach |
| `reluctant-moderate` | Reluctant Moderate | Hedging, non-committal |
| `old-guard-survivor` | Old Guard Survivor | Historical allusions, patronising patience |
| `shadow-power` | Shadow Power | Asks rather than tells; presents options, never directives |
| `backbencher-loyalist` | Backbencher Loyalist | Deferential, brief; watches the room |

---

## Line Length Budgets (GDD §12.5.3)

| Context | Target | Hard cap |
|---|---|---|
| NPC speech line | 8–20 words | 30 words |
| Player option label | 4–12 words | 18 words |
| Auto-advance line (cinematic) | 6–15 words | 20 words |
| Flavour-only line | 8–25 words | 40 words |

Lines over budget should be split into a node chain. A wall of text in a dialogue modal is a writing problem, not a display problem.

---

## Requirement Gates as Narrative Beats (GDD §12.5.4)

A gate is a narrative beat. The option label should reflect why the stat matters at that moment:

| Write this | Not this |
|---|---|
| *"I've built this coalition — let's talk."* (connections ≥ 5) | *"Use connections to advance the conversation."* |
| *"Let me be direct."* (integrity ≥ 6; greyed: *"You'd need a cleaner record to say this."*) | (no label change for gate fail) |
| *"I know where the bodies are."* (trait: `street-smart`) | *"(Requires: Street Smart trait)"* |

`hiddenIfFails: false` is the default. Always supply a `failureHint` when a gate can be visible-but-greyed. Write failure hints from the player's perspective.

---

## Game-State Tokens (GDD §12.5.5)

Dialogue text may reference live game state:

| Token | Resolves to |
|---|---|
| `{pc.name}` | Player character name |
| `{pc.background}` | Background label |
| `{pc.ideology.label}` | Ideology quadrant label |
| `{bill.current.title}` | Active bill title |
| `{week.label}` | Current week label |
| `{npc.name}` | Speaker NPC's name |
| `{faction.name}` | Contextually relevant faction name |

Token syntax is proposed and will be confirmed with Sol at M2 kickoff.

---

## Reusability Patterns (GDD §12.5.6)

- **Greeting / exit library:** each archetype should have 3–5 canonical openers and 2–3 exits, reusable across trees.
- **Snippet nodes:** short informational nodes referenced (not embedded) across multiple trees.
- **State-conditional text variants:** `text` may be an array of `{ condition, text }` objects for varied NPC acknowledgements.

---

## Checklist Before Submitting a Dialogue Tree

- [ ] Every NPC node has a `voiceTag`
- [ ] All player option labels are 4–12 words
- [ ] All NPC lines are 8–20 words (30 hard cap)
- [ ] All `hiddenIfFails: false` options have a `failureHint`
- [ ] `failureHints` are written from the player's perspective, not in system-speak
- [ ] No anachronistic idiom for the scenario era (see [[Voice-and-Tone]])
- [ ] No real-person likenesses in NPC names or descriptions
- [ ] Effects use `applyEffect`-compatible schema — not raw state mutations

---

## Related

[[Dialogue]] · [[Archetypes]] · [[Voice-and-Tone]] · [[Modding-Guide]] · [[Authoring-Scenarios]]
