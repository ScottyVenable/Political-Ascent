# Sol → Vex: answers to the 6 wiki-blocking questions

Owner: **Sol** (engineering). Audience: **Vex** (wiki/lore) and **Jesse** (project manager).
Source: codebase inspection on the `exp--legislative-overhaul` branch, May 2026.
Cross-referenced against [docs/GDD.md](../docs/GDD.md) v0.4-DRAFT.

> All 6 questions answered. **5 conclusive. 1 needs a design decision** (Q4 dialogue token syntax) — recommended option included.

---

## Q1 — Rider vs. amendment terminology

**Question.** Wiki and GDD use both "rider" and "amendment" for the deep-draft attachables. Which is canonical?

**Answer.** **Rider** in player-facing copy. **`PolicyModule`** in TypeScript types. The two are deliberately layered: `PolicyModule` is the data shape, "rider" is what the player reads on screen.

**Evidence.**
- Type: [`src/types/legislation.ts` lines 94-138](../src/types/legislation.ts#L94-L138) — `interface PolicyModule`. Doc-comments call it "a reusable rider" (line 94).
- Math/util: [`src/utils/legislativeModules.ts` lines 38, 60-128](../src/utils/legislativeModules.ts#L38-L128) — every doc-comment uses "rider"; one literal fallback string `'Rider'` at [line 224](../src/utils/legislativeModules.ts#L224).
- Data: [`src/data/legislation/modules/policy-modules.json`](../src/data/legislation/modules/policy-modules.json) — file path uses `modules`, payload key is `modules`.
- "Amendment" appears **only** in legacy comments: [`src/systems/LegislationSystem.ts` line 42](../src/systems/LegislationSystem.ts#L42) ("amendments" in floor-debate prose) and [`src/types/legislation.ts` line 48](../src/types/legislation.ts#L48) ("constitutional amendments" — a different concept).

**Action.**
- **No code rename required.** Keep `PolicyModule` and the `modules/` data path.
- Wiki + GDD prose: standardise on **rider** for the deep-draft mechanic. Reserve **amendment** for future floor-stage amendment mechanics (per §4.1 floor-debate stage).
- Add a one-line glossary entry on the wiki: "Rider — see also: PolicyModule (type)."

---

## Q2 — Where does `dataLoader` load dialogue trees from?

**Question.** Wiki Authoring-Dialogue page wants a canonical path. What does the loader expect?

**Answer.** **It currently does not load dialogue at all.** No glob, no registry, no consumer wiring. `DialogueSystem` is implemented as a pure module that takes a `DialogueTree` argument from a caller that does not yet exist.

**Evidence.**
- Loader: [`src/engine/dataLoader.ts` lines 35-66](../src/engine/dataLoader.ts#L35-L66) — every `import.meta.glob` call enumerated; **no `/src/data/dialogue/` glob present**.
- Bundle shape: [`src/engine/GameEngine.ts` lines 37-48](../src/engine/GameEngine.ts#L37-L48) — `DataBundle` has no `dialogueTrees` field.
- System: [`src/systems/DialogueSystem.ts` lines 48-86](../src/systems/DialogueSystem.ts#L48-L86) — `getNode(tree, …)` takes the tree as a parameter; no internal registry.
- Directory: `src/data/dialogue/` **does not exist** (verified via `list_dir` on `src/data/`).

**Action.**
- **Canonical path going forward (recommended):** `src/data/dialogue/*.json`. One file per `DialogueTree`. File payload === `DialogueTree`.
- Add to `dataLoader.ts` (M2 work, already in seed-issues as part of "Build DialogueSystem renderer panel + node interpreter"):
  ```ts
  const dialogueModules = import.meta.glob('/src/data/dialogue/*.json', { eager: true, import: 'default' });
  ```
  with a `dialogueTrees: DialogueTree[]` field on `DataBundle`.
- Wiki Authoring-Dialogue page: cite `src/data/dialogue/<npcId>.json` as the canonical location, link to `src/types/dialogue.ts` for shape.
- This adds a **new finding** to the M2 backlog (see [sol-phase4-backlog.md](sol-phase4-backlog.md) F-04).

---

## Q3 — Speech fragment data path

**Question.** Wiki §12.6 references rhetorical-device + phrase-fragment data. Where do they live?

**Answer.** **Nowhere yet.** No `src/data/speech/` directory, no system module, no schema. Pure forward-looking work for M3 (Stump).

**Evidence.**
- `src/data/speech/` does not exist (verified via `list_dir` on `src/data/`).
- No `SpeechSystem.ts` in `src/systems/` (verified via `list_dir`).
- Only references to "speech/fragment" are: prose in [`src/utils/buildProfile.ts` line 19](../src/utils/buildProfile.ts#L19), card name in [`src/data/cards/starter-deck.json` line 117](../src/data/cards/starter-deck.json#L117), and tooltip glossary in [`src/renderer/components/tooltip/glossary.ts` lines 60, 89, 276](../src/renderer/components/tooltip/glossary.ts#L60).

**Action.**
- **Canonical paths (recommended, matching existing seed-issues M3 entries):**
  - `src/data/speech/devices.json`
  - `src/data/speech/fragments.json`
- Both files carry a `$schemaVersion: 1` header (matching the convention already used in `src/data/legislation/modules/policy-modules.json` line 2 and `src/data/avatars/avatars.json` line 2).
- Each fragment carries an `i18nKey` so M5 i18n scaffolding can lift the strings.
- Wiki Authoring-Speech page: defer page until M3 lands; until then, keep stubbed with "Coming in M3 Stump (`0.4.0-alpha.1`)" notice.

---

## Q4 — Dialogue token / variable syntax

**Question.** What syntax should authored dialogue text use for runtime substitutions like player name, current PC, etc.?

**Answer.** **Design decision required — no syntax exists in code today.** `DialogueNode.text` is a plain `string` ([`src/types/dialogue.ts` lines 14-19](../src/types/dialogue.ts#L14-L19)) and `DialogueSystem` never inspects it.

**Two options for Sol+Bridge to choose between:**

| Option | Syntax | Pros | Cons |
|---|---|---|---|
| **A — Curly braces (recommended)** | `Hello, {playerName}.` | Consistent with the placeholder style already used inside [`src/utils/format.ts`](../src/utils/format.ts) and the toast `${name}` template literals in `src/store/uiStore.ts`. Simple to lex (one regex). Plays well with future i18n: ICU MessageFormat is a proper superset. | None significant. |
| **B — Mustache `{{playerName}}` (double-brace)** | `Hello, {{playerName}}.` | Already familiar to mod-authors from many engines. Visually distinct from JSON syntax noise. | Adds a dependency or a hand-rolled parser; conflicts with ICU MessageFormat which uses single-brace. Costs i18n optionality. |

**Recommendation.** **Option A — single curly braces.** Stay ICU-compatible so M5 i18n can land without rewriting authored content. Tokens to support in v1: `{playerName}`, `{characterName}`, `{npcName}`, `{partyShort}`, `{week}`, `{year}`, `{pc}`, `{ap}`. Unknown token → render as literal (logged by `DialogueSystem` as a warning).

**Action.**
- This is a **Sol-blocked** decision; flagged for Bridge as part of Phase 5 dialogue work.
- Once decided, document in wiki Authoring-Dialogue and add the resolver to `DialogueSystem.ts` (new finding F-05 in [sol-phase4-backlog.md](sol-phase4-backlog.md)).

---

## Q5 — `applyEffect` schema canonical source

**Question.** When the wiki documents the effect schema, which file is authoritative?

**Answer.** **[`src/types/effect.ts`](../src/types/effect.ts) is the single source of truth.** The discriminated `Effect` union there drives the `applyEffect()` switch and every JSON file that emits effects.

**Evidence.**
- Type: [`src/types/effect.ts` lines 7-77](../src/types/effect.ts#L7-L77) — `Effect = StatEffect | ResourceEffect | … | QuestTriggerEffect`. 9 variants total.
- Consumer: [`src/engine/applyEffect.ts` lines 19-98](../src/engine/applyEffect.ts#L19-L98) — `switch (effect.type)` over those exact 9 variants.
- Data files use the same shapes verbatim, e.g. [`src/data/legislation/modules/policy-modules.json` lines 16-19](../src/data/legislation/modules/policy-modules.json#L16-L19) emit `{ "type": "economy", "metric": "deficit", "value": -10 }` matching `EconomyEffect`.

**Notes / caveats Vex should call out on the wiki:**
- `delayDays` and `duration` are **declared but not honoured** by the runtime — comment at [`src/engine/applyEffect.ts` lines 13-16](../src/engine/applyEffect.ts#L13-L16) says effects apply immediately. Wiki should mark these as "reserved; not yet enforced." Tracked as new finding F-08.
- `grant_card` and `trigger_quest` are **stubs**: see lines 81-95. Wiki should document the actual current behaviour (news pushed / flag set), not the eventual intent. Also tracked as F-09.

**Action.**
- **No JSON Schema (`*.schema.json`) file exists** and we are not creating one in this pass. If a JSON Schema is desired later, generate it from `src/types/effect.ts` (e.g. `ts-json-schema-generator`) so the TypeScript type stays canonical.
- Wiki Effect-Schema page: link directly to `src/types/effect.ts` and include a one-paragraph note on the two unimplemented features above.

---

## Q6 — Save schema v2 fields

**Question.** What fields land in v2 of the save schema, and what migration is required from v1?

**Answer.** **v1 today (`SAVE_SCHEMA_VERSION = 1`).** v2 is the M2 (Floor Manager) bump. The v1→v2 set is driven by three already-tracked seed-issues plus one new finding from this pass:

**v1→v2 fields (all on `payload.stores.world`):**

| Field | Source | Default for migrating v1 saves |
|---|---|---|
| `factions: Faction[]` | seed-issue "Decide and implement FactionSystem" (M2) | `[]` (recomputed from scenario data on first weekly tick) |
| `quest.startedDay: number` (per active quest entry) | seed-issue "Persist `quest.startedDay` on save" (M1) | current `currentDate.day` at load time (matches in-memory fallback in `QuestSystemImpl.startedDays`) |
| `dialogueProgress: Record<string, string>` (treeId → currentNodeId) | seed-issue "Persist dialogue progress on worldStore" (M2 sub-issue) | `{}` |
| `audiencePriority?: number[]` (per `PopulationGroup`) | seed-issue "Add audience-segment priority data to PopulationGroup" — but that's M3, **not M2**; defer to v3 | n/a — keep v2 strictly M2-scoped |

**v1 reference points.**
- Schema constant: [`src/engine/SaveSystem.ts` line 42](../src/engine/SaveSystem.ts#L42).
- Validator: [`src/engine/SaveSystem.ts` lines 165-176](../src/engine/SaveSystem.ts#L165-L176) — currently rejects any non-current version with no migration path.
- Reader: [`src/engine/SaveSystem.ts` lines 218-228](../src/engine/SaveSystem.ts#L218-L228).
- World store fields today: [`src/store/worldStore.ts` lines 45-69](../src/store/worldStore.ts#L45-L69) — confirms no `factions`, no `dialogueProgress`, and `activeQuests[]` carries no `startedDay`.

**Migration ladder requirement (GDD §13.3.3).**
The current `SaveSystem.readSave` returns a hard error on any version mismatch. v1→v2 needs a real ladder. Recommended scaffolding (added to backlog as F-02):
- Add `migrate(payload, fromVersion): SavePayload` shaped as a chain of pure functions `v1→v2`, `v2→v3`, …
- Add a fixture corpus under `src/test/fixtures/saves/v1/*.json` (already in seed-issues for M4, but the **first** fixture must land alongside the v1→v2 migrator in M2 so the ladder has something to test against).

**Action.**
- v2 schema content: confirmed (3 field groups above).
- Migration scaffolding: new finding F-02. Should land **before** any of the M2 sub-issues that bump fields, otherwise we ship a save-corruption hazard.
- Wiki Save-Format page: add v2 column to the field table; mark v1→v2 migrator as "M2 (required)".

---

## Summary

| Question | Status | Action |
|---|---|---|
| Q1 rider/amendment | Conclusive | Wiki copy fix only; no rename |
| Q2 dialogue dataLoader path | Conclusive | New finding F-04 (loader wiring, M2) |
| Q3 speech fragment path | Conclusive | Already covered by M3 seed-issues |
| Q4 dialogue token syntax | **Design decision** (Sol-blocked) | Recommend Option A `{token}`. New finding F-05 |
| Q5 applyEffect schema source | Conclusive | Wiki cites `src/types/effect.ts`. New findings F-08, F-09 for noted gaps |
| Q6 save schema v2 | Conclusive | Confirms 3 v2 fields. New finding F-02 (migration ladder) |

**Wiki push not blocked by code work.** Vex can write the pages now using the canonical paths/types above. The 4 new findings (F-02, F-04, F-05, F-08/F-09) are tracked separately for Jesse to add to Project 9.
