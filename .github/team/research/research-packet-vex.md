# Research Packet — Vex: Content & Lore Architect

**Destination:** `.github/team/research/` (team resource)
**Intended audience:** Vex

---

## Purpose

Equips Vex with the narrative craft knowledge, political drama conventions, and content-discipline practices needed to author lore, dialogue, and events that feel authentic, consequential, and tonally consistent across Political Ascent's simulation.

---

## Role Summary

Vex owns authored content quality and consistency. He writes and edits content entries (events, dialogue, legislation text, character bios, lore docs), maintains `src/data/` and `docs/wiki/`, and keeps narrative consistent with schema and balancing constraints. Vex does not modify engine code — schema changes are flagged to Sol.

---

## Key Concepts & Domain Knowledge

- **Choice architecture in political narrative** — Choices in political games must feel substantive, not cosmetic. Every player-facing dialogue option should produce a measurable state delta (approval, loyalty, economy). "Filler choices" that resolve identically regardless of selection erode trust in the simulation.
- **Tone calibration for political drama** — Political Ascent targets authenticity over editorializing. Characters should sound like people operating inside systems with real incentives, not editorial cartoons. Study how Suzerain and Disco Elysium write politicians as flawed-but-coherent worldview-holders.
- **Lore consistency as a contract** — Players in political sims rapidly model the world. Contradictory lore (a senator described as isolationist in one event and an interventionist in another without narrative cause) breaks immersion faster than mechanical bugs. Maintain a character fact-sheet for every named NPC.
- **Branching dialogue architecture** — Dialogue trees that fan out too aggressively become unmanageable. The industry best practice is a "diamond" structure: branch wide at the meaningful fork, converge back at a shared trunk. Understand the `DialogueSystem.ts` shell and plan content for it accordingly.
- **Legislative text as characterization** — Bill summaries and rider text are player-facing. They should read like real legislative language (dry, specific) while still being legible. This is a distinctive narrative register, not generic game copy.
- **Event scripting discipline** — Political Ascent events use a `Requirement` evaluator and `applyEffect` pipeline. Vex authors the content; Sol validates the schema. Numeric thresholds in authored events should stay within established ranges (check existing events before adding new values).
- **Faction voice differentiation** — Each faction (labor, rural conservatives, urban progressives, etc.) should have a recognizable linguistic register. Consistency across event flavour text, news ticker items, and NPC dialogue reinforces faction identity.
- **News ticker as lore surface** — The ticker is the "living world" signal. Short, punchy, plausible-sounding headlines written in the voice of a real wire service, not game announcements.
- **Scenario-specific historical register** — The Cold War and Civil War scenarios require historically grounded voice. Anachronistic modern political framing breaks period scenarios. Research the register before authoring content for non-Modern-America scenarios.
- **Schema hygiene** — IDs must be unique, keys collision-free, and content within the expected type shapes. A single bad JSON entry that passes Vex's authoring but fails `dataLoader` at boot will block QA.

---

## Reference Games / Comparable Projects

| Title | What Vex should study |
|---|---|
| **Suzerain** (Torpor Games, 2020) | Gold standard for political narrative in games. Presidential dialogue that feels genuinely consequential; cabinet dynamics; ideological coherence across branching choices. |
| **Disco Elysium** (ZA/UM, 2019) | Skill-check dialogue, interiority, writing politicians and ideologues as philosophically coherent agents. Study how checks surface character without breaking flow. |
| **80 Days** (inkle, 2014) | World-building through short, dense prose passages; branching travel narrative; how to convey a living world through authored fragments rather than exposition dumps. |
| **Crusader Kings III** (Paradox, 2020) | Event scripting discipline at scale; how a large team maintains tonal consistency across thousands of events. Structured event templates. |
| **Victoria 3** (Paradox, 2022) | How journal entries and flavour events communicate complex political/economic situations in compact, literate prose. |

---

## Best Practices for This Project

1. **Anchor every choice to a state delta.** Before authoring a dialogue option, confirm what system effect it triggers (even if small). A pure "flavour" choice with no delta is a bug.
2. **Write events in pairs: triggered and resolved.** Political Ascent's event model includes triggers (conditions) and outcomes (effects). Authoring only one half produces orphaned content.
3. **Validate numeric values against existing ranges.** Before assigning approval change `+15`, check existing events in `src/data/events/` to confirm that magnitude is calibrated correctly. Flag outliers to Nova, not Sol.
4. **Maintain an NPC character bible in `docs/wiki/`.** Named characters referenced across multiple events need a canonical fact-sheet. Jesse tracks the wiki; Vex authors the content entries.
5. **Mark speculative / placeholder content with `// TODO(vex)` comments** inside JSON string values so they're searchable. Don't leave unresolved placeholder text in shipped content.

---

## Useful Patterns & Anti-Patterns

| Do | Avoid |
|---|---|
| "Diamond" branch structure — converge choices back to shared state | Unconstrained fanout that creates exponential content debt |
| Distinct linguistic registers per faction | Generic "politician voice" that makes all factions sound the same |
| Period-appropriate language for historical scenarios | Modern political framing in Cold War / Civil War content |
| Short, wire-service-style news ticker entries | Ticker items that read like game system announcements |
| Flag schema changes to Sol before authoring around them | Silently adding new keys to JSON that break `dataLoader` |
| Cross-reference existing NPC entries before creating new ones | Duplicating NPC IDs or contradicting established characterization |

---

## Quick Reference Links (Internal)

- [Vex's agent file](../../agents/Vex.agent.md)
- [TEAM.md](../../TEAM.md)
- [GDD §12 — Narrative, Story, Characters, RPG, Dialogue](../../../docs/GDD.md)
- [GDD §1 — Vision & Pillars (P4: Personal narrative)](../../../docs/GDD.md)
- [docs/design/dialogue-system.md](../../../docs/design/dialogue-system.md)
- [docs/design/dialogue-vex-review.md](../../../docs/design/dialogue-vex-review.md)
- [docs/design/dialogue-reference-tree.json](../../../docs/design/dialogue-reference-tree.json)
- [docs/research/crusader-kings-3.md](../../../docs/research/crusader-kings-3.md) (character-driven story, traits, events)
- [docs/research/victoria-3.md](../../../docs/research/victoria-3.md) (journal entries, faction/movement prose)
- [docs/research/comparative-systems.md](../../../docs/research/comparative-systems.md) (Suzerain, Democracy 4 patterns)
- [docs/research/political-simulation-fidelity.md](../../../docs/research/political-simulation-fidelity.md) (authenticity vs. abstraction)
- [SCENARIO_PLAN.md](../../../docs/SCENARIO_PLAN.md)

---

## Handoffs Cheatsheet

| Agent | What Vex gives | What Vex receives |
|---|---|---|
| **Sol** | Schema change requests; content ready for validation; authoring questions about data structure | Schema / interface change notes; confirmation that content loaded without errors |
| **Rook** | Content QA requests (e.g., "does this event fire correctly?") | Content defects with reproduction steps |
| **Lux** | Narrative tone & lore reference for visual translation (e.g., faction colours, character visual direction) | Visual language proposals for narrative alignment review |
| **Nova** | Narrative constraints on mechanics; lore-driven system requirements | System constraints affecting narrative beats (e.g., "this mechanic needs a narrative hook") |
| **Jesse** | Content tracking issues; wiki entries | Issue assignments; board fields; wiki publication confirmation |
| **Robert** | Tone and setting research requests (historical register, political vocabulary) | Sourced reference documents, period sources, tone guides |

---

*Researched by Robert — 2026-05-03*
