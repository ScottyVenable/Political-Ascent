# Research: Crusader Kings III

**Reference:** Crusader Kings III — Paradox Development Studio, 2020
**Focus for us:** Character-driven narrative, traits, schemes, relationships, lifestyle trees, stress.

---

## 1. Summary

CK3 reframes grand strategy as **a story about a person**. The player is one character in a dense social graph; every other named character has a full personality, opinions of the player, and agendas. Systems (traits, stress, lifestyle, schemes) exist to turn that graph into moment-to-moment drama.

The result is a game where *policy systems* (realm laws, succession, religion) feel secondary to *relationship systems* (who is plotting against whom, who will marry whom, who is a rival). That balance is instructive for a political simulator: our laws need to feel heavier than CK3's, but our characters need to feel nearly as alive as CK3's.

---

## 2. Relevant mechanics

### 2.1 Traits
- Three tiers: **Personality traits** (e.g., *Ambitious*, *Craven*), **Background traits** (e.g., *Education: Intrigue III*), **Situational traits** (e.g., *Stressed*, *Depressed*, *Imprisoned*).
- Traits affect opinions (others like or dislike this trait), stat modifiers, available actions, event pool weighting.
- Traits can be **gained or lost** through events, choices, or life paths.

### 2.2 Opinion / relationships
- Every character has an **opinion** of every other character they know: a single number from roughly −100 to +100.
- Modifiers stack: trait compatibility, shared faith, past actions, gifts, marriages, rivalries.
- Opinion drives AI behaviour: will they join your scheme? accept an alliance? plot murder?

### 2.3 Lifestyle / focus trees
- Five lifestyles: Diplomacy, Martial, Stewardship, Intrigue, Learning.
- Each lifestyle is a **skill tree** with perks; you progress by spending **lifestyle XP** earned through activities in that domain.
- Focuses within a lifestyle bias the event pool toward relevant stories.

### 2.4 Stress
- A single scalar (0–100+) that increases when the player makes choices contrary to their character's traits.
- At thresholds, the character gets negative situational traits (e.g., *Wounded Pride*, *Alcoholic*).
- Releasing stress requires actions that *align* with character traits.

### 2.5 Schemes
- Persistent covert actions with a **success meter** that ticks up over weeks/months.
- Require **agents** (other characters) whose stats and opinion modify success chance.
- Can be **discovered** and cancelled or punished mid-scheme.

### 2.6 Events
- Huge volume of personal events, gated by traits / situations / focus.
- Events are **character-situated**: they always present as "Your steward brings you news…" rather than faceless modals.

---

## 3. What translates to Political Ascent

| CK3 concept | Our equivalent | Notes |
|---|---|---|
| Traits (3 tiers) | Character traits (GDD §5.3) | We have this. CK3 validates the three-tier approach; we could formalise tiers. |
| Opinion scalar | `world.relationships[npcId]` | We already store per-NPC relationship. Decide if we want a single score or multi-axis. |
| Lifestyle / focus | Skill tree (Oratory / Legislative / Strategist) | Direct parallel. Add "focus" switch that biases event pool. |
| Stress | Integrity / Credibility pressure | Our equivalent is the Integrity stat + scandal pressure. Consider a **Political Stress** pool that grows when the player votes against their own party or ideology. |
| Schemes | Leverage system (GDD §12) | Multi-week covert actions with agents — direct translation. |
| Events as character-situated | Event modal "staff voice" | Route events through an in-world speaker (Chief of Staff, Press Secretary, Party Whip). Big tone win. |

---

## 4. What does not translate

- **Genetic/dynastic system.** Our game is one-character-long; we do not model families through centuries.
- **Holdings / realm map.** Our "map" is a population + congress visualisation, not territorial.
- **Murder/imprison mechanics.** Out of tone for the game. Analogues are *scandal fabrication* and *primary challenge*, which are softer versions.

---

## 5. Suggested hooks in our systems

- **CharacterSystem:** Add a `politicalStress` scalar (0–100). Increment when the player votes against their stated ideology (track `ideologyAtStart` vs. latest votes) or takes wealth from donors counter to their public platform. Decrement via actions that affirm identity.
- **RelationshipSystem (future):** Add an **opinion-modifier stack** model like CK3 so we can show tooltips of why an NPC likes/dislikes the player (e.g., "+10 Same party", "−15 You voted against HR-45", "+5 Shared alma mater").
- **Skill tree:** Add a **focus** per session (you pick one of your three paths; event pool tilts toward that path for the week). Low-cost, big flavor gain.
- **EventEngine:** Add `speakerNpcId` optional field on events so the modal shows a named staffer face+name rather than an anonymous narrator.
- **Schemes / leverage:** Implement scheme lifecycle with progress meter + agent slots now, not later — it is the single most replayable mechanic in CK3 and our Leverage system design already resembles it.

---

## 6. Open questions

- Should stress / political stress trigger *negative traits* that the player must actively clear (CK3 model), or only modifier debuffs? Recommendation: modifier debuffs for v0.1, escalate to trait acquisition in v0.2.
- Multi-axis relationship (respect, trust, friendship) vs single scalar? Recommendation: single scalar for v0.1, modifier stack for tooltip; split later if needed.

---

## 7. References

- Paradox Wiki — CK3: https://ck3.paradoxwikis.com/
- CK3 Dev Diaries on the official forum.
- GDC 2021 talk "The Narrative Engine of CK3" (public-facing talk).
