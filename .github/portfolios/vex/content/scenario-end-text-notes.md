# Authoring Notes — `scenario-end-text.json`

**File:** `.github/portfolios/vex/content/scenario-end-text.json`
**Author:** Vex
**Date:** 2026-05-03
**Source data:** `src/data/scenarios/modern-america-2024/scenario.json`

---

## Scenarios Found

Only one scenario directory exists at time of authoring: `src/data/scenarios/modern-america-2024/`. Text has been authored for all found scenarios. When Cold War (M6, planned) and subsequent scenarios ship, this file should receive additional entries.

---

## Schema Approach

The GDD M2 deliverable specifies `scenario.victoryText` and `scenario.lossText` as top-level string fields on the scenario JSON. The portfolio file mirrors this shape: one `victoryText` string and one `lossText` string per scenario entry.

**Proposed optional extensions — schema question for Sol (OQ-E):**

The Modern America scenario has two distinct `victoryConditions` (`vc-10-bills` and `vc-approval-60`) that resolve through very different campaign arcs. A player who ground out ten bills in a combative chamber and a player who sustained 60% national approval through careful coalition management have lived different stories. A single `victoryText` serves both but serves neither fully.

This file provides `victoryTextVariants` (keyed by `victoryConditions.id`) and `lossTextVariants` (keyed by proposed loss condition IDs) as additional authored content. Sol should decide whether to:

1. Implement the variant system in the end-of-run screen renderer — the engine checks which condition triggered, looks up the variant, falls back to `victoryText`/`lossText` if none found.
2. Use only the generic `victoryText`/`lossText` fields for M2 and defer variants to M5 (Content & Localisation Foundations).
3. Author condition-specific text directly into `victoryConditions[].text` on the scenario — a different structural approach.

**Recommendation:** Option 1 is the richest player experience. Option 2 is the fastest path to M2 exit criteria. Authoring is done either way — the variant text is in this file, ready to wire.

---

## Tone Rationale — `modern-america-2024`

**Era register:** Modern America 2024. Per GDD §12.1.4: compressed, media-saturated, self-aware. Avoid purple prose and stilted formality.

**Victory tone intent:** Not triumphalist. The scenario opens with "The nation is divided, the economy is wobbling" — victory in this context is hard-won and comes with costs still accruing. The player earned something, but the world keeps moving. The closing image ("somewhere in the Senate record, your name is attached to something real") is small and specific — the opposite of a sweep-the-crowd moment.

**Loss tone intent:** Not punitive, not nihilistic. The game's tone bible (§12.1.1) explicitly forbids nihilism: "Loss states must feel meaningful." The generic `lossText` closes with the retry hook ("the next senator from your state starts where you left off") — it acknowledges the loss without dismissing it, and plants the idea that starting over is not starting from zero.

---

## Per-Condition Victory Text Rationale

### `vc-10-bills` — "Pass 10 bills through the Senate"

The victory condition is accumulative and combative — you've been grinding the legislative machine. The text reflects that: it's about cost and body count, not inspiration. The Whip's line ("body count is how you keep score") is a reference to Machine Boss archetype dialogue voice — it ties the end screen back into the world's character logic without requiring the player to remember a specific conversation.

*"The costs are still settling"* is the sardonic closing note. You won by the metric the machine uses. Whether that metric captured the right thing is left open.

### `vc-approval-60` — "Maintain 60% nationwide average happiness for a full year"

This is a sustained performance victory — harder to game, harder to attribute. The text leans into the ambiguity: "historians will debate whether you earned it or inherited the moment." The player knows the answer. The text doesn't resolve it for them.

*"The country doesn't hand out standing ovations. It hands out numbers."* — wry, earned. The number 60 is what you have. Take it.

---

## Per-Condition Loss Text Rationale

### `loss-election` — Lost re-election

The most common loss condition. Tone: acknowledgement, not shame. The key line is "A margin is not a verdict on a career" — this is true in politics and gives the player somewhere to put the loss that isn't pure failure. The retry hook is light: "the work continues in other forms."

### `loss-scandal` — Resigned for scandal

More reflective. The scandal arc is the game's most personal loss state — the player made choices that had a cost. The text doesn't name the scandal or assign moral weight. "You had the room for a moment" acknowledges that the opportunity was real; "what went wrong" puts the analysis back on the player, not on the system.

### `loss-expulsion` — Party expulsion

Ideological and relational. The player diverged from their caucus. The text frames this as a coherent political divergence rather than a pure defeat: "whether that divergence was the right call made at the wrong time." This leaves the door open for the player to feel vindicated in their choices while still registering that the outcome was loss.

### `loss-censure` — Censure with committee seats stripped

The most institutional loss. The player is technically still serving — they've been humiliated inside the body. The text uses a specific invented vote count (63–37) to make it concrete and real. "Influence without a committee seat is a different kind of work — occasionally more honest" is a sardonic acknowledgement that the stripped senator may, perversely, have more freedom. The closing line ("senators who remember what the stripping felt like") hints at a future arc without promising one.

---

## Schema Questions for Sol (OQ-E)

### OQ-E — `victoryTextVariants` and `lossTextVariants` field support

As above: these fields are proposed extensions to the scenario schema. The `scenario.json` currently has no `victoryText`, `lossText`, or variant fields — M2 adds the base fields. Variants are the authoring recommendation for the richest player experience.

**Question:** Should Sol add `victoryTextVariants?: Record<string, string>` and `lossTextVariants?: Record<string, string>` to the `ScenarioDefinition` type in `src/types/`? Or defer to M5?

**Author preference:** Add them now. The content is authored. The implementation delta is small (one additional lookup in the end-of-run screen renderer). Deferring adds no technical debt but deprives the first playtesters of earned specificity.

---

## Loss Condition IDs

The `lossTextVariants` keys (`loss-election`, `loss-scandal`, `loss-expulsion`, `loss-censure`) are **authoring placeholders**. The Modern America scenario JSON has no `failureConditions` array at time of authoring — GDD §3.3 lists the loss states in prose but they are not yet encoded in `scenario.json`.

**TODO(vex): When Sol adds `failureConditions` to the scenario schema and `modern-america-2024/scenario.json`, align these variant keys with the actual `failureConditions[].id` values.**

---

- Vex
