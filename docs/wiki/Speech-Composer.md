# Speech Composer

> **GDD reference:** §12.6, §4.4 (PopulationSystem — audience segment hook)
> **Implementation status:** Designed (M3 — Stump)
> **Last reviewed:** 2026-05-02 (Vex, GDD v0.4-DRAFT)

## Overview

The Speech Composer is where your rhetoric becomes a mechanical act. You assemble a speech from phrase fragments, choose your rhetorical devices, and deliver. The outcome is scored against your audience — and the news headlines reflect whether you landed it.

## Player-Facing Summary

*Note: the Speech Composer has no module or UI surface yet. It ships at M3.*

When it ships: you will enter the Speech Composer before a floor speech, a press conference, or a rally. You pick an opening, a body, and a close — each from a pool of phrase fragments filtered by topic, rhetorical device, and your character's stats. The assembled speech previews an audience-fit score against the cohorts in the room. Deliver it and the happiness deltas resolve. Read the news headline. It will not lie to you.

## How It Works (GDD §12.6)

### The Build Tool

Speeches are assembled in three segments:

| Segment | Purpose |
|---|---|
| **Opening** | Establishes register and initial rapport. Sets tone for the body. |
| **Body** | The argument itself. Multiple fragments stack; incompatible tones trigger gaffe penalties. |
| **Close** | The call to action or closing image. Determines the news headline band. |

### Rhetorical Devices

Each fragment carries a rhetorical device tag that determines which cohorts respond to it:

| Device | Tone tag | Best for |
|---|---|---|
| Appeal to shared identity | `unity` | Working-class, rural voters |
| Statistical gravitas | `authority` | Professionals, technocrats |
| Historical analogy | `gravitas` | Older cohorts, educated voters |
| Adversarial framing | `confrontational` | Ideologically active base |
| Personal testimony | `empathy` | Working-class, minority cohorts |
| Moral imperative | `principled` | Reform base, religious cohorts |
| Economic pragmatism | `pragmatic` | Business interests, moderates |
| Emergency urgency | `urgent` | Swing voters during active crisis events |

### Audience-Fit Scoring

Scored output determines per-cohort happiness deltas:

1. **Topic relevance** — bill `policyTags` vs. cohort's known issue priorities
2. **Tone alignment** — cohort ideology vs. speech `toneTag` distribution
3. **Stat modifier** — Charisma scales base effectiveness; Strategy scales fragment bonus stacks
4. **Trait modifiers** — e.g., `veteran-orator` adds +1 Charisma on speech actions
5. **Radicalism modifier** — cohorts above radicalism 60 respond to `confrontational` and are immune to `pragmatic` framing

**Delta range:** `[−8, +12]` per cohort. Groups misaligned in tone take a small negative.

### Gaffe Modes

| Failure mode | Trigger | Effect |
|---|---|---|
| Contradiction | Two incompatible tone tags in the same speech | −6 happiness across all targeted cohorts; news item flagging inconsistency |
| Empty rhetoric | No body fragments, or all fragments misaligned | No positive effect; −3 approval with professionals |

### News Headlines on Resolution

| Outcome | Headline template |
|---|---|
| High effectiveness (avg delta ≥ 8) | *"{pc.name} Speech Draws Rare Bipartisan Praise"* |
| Moderate effectiveness (delta 3–7) | *"{pc.name} Makes Case for {bill.topic} on Senate Floor"* |
| Low effectiveness (delta 0–2) | *"{pc.name} Floor Speech Falls Flat Amid Opposition"* |
| Gaffe | *"{pc.name} Speech Draws Fire After Contradictory Signals"* |

## Key Terms

| Term | Definition |
|---|---|
| **Phrase fragment** | A single authored speech component with a segment, topic, rhetorical device, and tone tag |
| **Rhetorical device** | The persuasion strategy embedded in a fragment; determines audience-fit bonuses |
| **Tone tag** | The emotional register of a fragment; must be consistent across the body or gaffe triggers |
| **Audience-fit score** | The aggregate effectiveness prediction before delivery |
| **Gaffe** | A scoring penalty triggered by incompatible tones or empty content |

## Modding Hooks (GDD §9, §12.6)

Phrase fragments will live in `src/data/speech/fragments.json`. Each fragment references the shape in GDD §12.6.3. News headline templates will be in `src/i18n/en-US/news.json`. See [[Authoring-Scenarios]] for how speeches interlock with scenario-specific content.

## Related

[[Population]] · [[Character]] · [[Events]] · [[Voice-and-Tone]] · [[Archetypes]] · [[Concept-Glossary]]
